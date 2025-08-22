// scripts/fix-frontmatter-yaml.mjs
// 用法：node scripts/fix-frontmatter-yaml.mjs "src/content/posts" --report
import fs from "fs";
import path from "path";
import yaml from "js-yaml";

const args = process.argv.slice(2);
const ROOT = path.resolve(args[0] || "src/content/posts");
const DRY = args.includes("--dry");
const REPORT = args.includes("--report");

function toDateOnly(v) {
  if (!v) return undefined;
  try {
    if (v instanceof Date && !isNaN(v)) return v.toISOString().slice(0, 10);
    const s = String(v).trim().replace(/^"|"$/g, "");
    const m = s.match(/^(\d{4}-\d{2}-\d{2})/);
    if (m) return m[1];
    const d = new Date(s);
    if (!isNaN(d)) return d.toISOString().slice(0, 10);
  } catch {}
  return undefined;
}

function walk(dir, hit) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, hit);
    else if (e.isFile() && e.name.toLowerCase() === "index.md") hit(p);
  }
}

function splitFrontmatter(s) {
  const norm = s.replace(/\r\n/g, "\n");
  const m = norm.match(/^\uFEFF?\s*---\n([\s\S]*?)\n---\n?/);
  if (!m) return null;
  const headLen = m[0].length;
  return { fmRaw: m[1], body: norm.slice(headLen), raw: norm };
}

function toArrayTags(v) {
  if (v == null) return [];
  if (Array.isArray(v)) return v.map(String).map(s => s.trim()).filter(Boolean);
  const txt = String(v).trim();
  const inner = txt.replace(/^\[|\]$/g, "");
  return inner.split(",").map(s => s.replace(/^[\s"']+|[\s"']+$/g, "")).filter(Boolean);
}

function orderFields(obj) {
  const order = ["title","published","updated","description","image","tags","category","draft","lang",
                 "prevTitle","prevSlug","nextTitle","nextSlug"];
  const out = {};
  for (const k of order) if (obj[k] !== undefined) out[k] = obj[k];
  for (const k of Object.keys(obj)) if (!(k in out)) out[k] = obj[k];
  return out;
}

// 从路径推断日期和标题：  .../YYYY/SLUG/index.md ，SLUG 可能以 YYYY-MM-DD 开头
function inferMetaFromPath(file) {
  const slug = path.basename(path.dirname(file));
  const y = path.basename(path.dirname(path.dirname(file))); // 年目录
  let published = undefined;
  const m = slug.match(/^(\d{4}-\d{2}-\d{2})/);
  if (m) published = m[1];
  else if (/^\d{4}$/.test(y)) published = `${y}-01-01`;
  const title = slug.replace(/^\d{4}-\d{2}-\d{2}-?/, "").replace(/[-_]/g, " ").trim() || slug;
  return { title, published };
}

let total = 0, changed = 0, failed = 0;
const edited = [], errors = [];

walk(ROOT, (file) => {
  total++;
  const raw = fs.readFileSync(file, "utf8");
  const parts = splitFrontmatter(raw);

  const doWrite = (content) => { if (!DRY) fs.writeFileSync(file, content, "utf8"); changed++; edited.push(file); };

  // 如果没有 frontmatter，直接构造一个最小可用的
  if (!parts) {
    const { title, published } = inferMetaFromPath(file);
    const fmObj = orderFields({
      title,
      published: published || "1970-01-01",
      description: "",
      image: "",
      tags: [],
      category: "未分类",
      draft: false,
    });
    const fmNew = yaml.dump(fmObj, { indent: 2, lineWidth: 1000 });
    doWrite(`---\n${fmNew}---\n` + raw.replace(/^\uFEFF?/, "").replace(/\r\n/g, "\n"));
    return;
  }

  // 有 frontmatter：先把 TAB 换空格再尝试解析
  const fmRaw = parts.fmRaw.replace(/\t/g, "  ");
  let data;
  try {
    data = yaml.load(fmRaw) || {};
  } catch (e) {
    // 解析失败：强制重建 frontmatter，正文保留
    const { title, published } = inferMetaFromPath(file);
    const fmObj = orderFields({
      title,
      published: published || "1970-01-01",
      description: "",
      image: "",
      tags: [],
      category: "未分类",
      draft: false,
    });
    const fmNew = yaml.dump(fmObj, { indent: 2, lineWidth: 1000 });
    doWrite(`---\n${fmNew}---\n${parts.body}`);
    return;
  }

  // 规范化已有 frontmatter
  if (data.date && !data.published) { data.published = data.date; delete data.date; }
  const pub = toDateOnly(data.published);
  data.published = pub || inferMetaFromPath(file).published || "1970-01-01";

  if (data.updated) {
    const upd = toDateOnly(data.updated);
    if (upd) data.updated = upd; else delete data.updated;
  }

  if (data.categories !== undefined) {
    if (Array.isArray(data.categories)) data.category = data.categories[0] ?? "未分类";
    else data.category = String(data.categories || "").trim() || "未分类";
    delete data.categories;
  }
  if (!data.category || typeof data.category !== "string") data.category = "未分类";

  data.tags = toArrayTags(data.tags);

  if (!data.image && data.cover) data.image = data.cover;
  if (!data.image && data.thumbnail) data.image = data.thumbnail;
  delete data.cover; delete data.thumbnail;

  if (data.draft !== undefined) data.draft = !!data.draft;
  if (data.description == null) data.description = "";

  // 基于路径补一个安全 title（避免空或奇怪字符）
  if (!data.title || !String(data.title).trim()) {
    data.title = inferMetaFromPath(file).title;
  }

  const fmObj = orderFields(data);
  const fmNew = yaml.dump(fmObj, { indent: 2, lineWidth: 1000 });
  const rebuilt = `---\n${fmNew}---\n${parts.body}`;
  if (rebuilt !== parts.raw) doWrite(rebuilt);
});

console.log(`修复完成：共扫描 ${total} 篇；写入修复 ${changed} 篇；解析失败（已强制重建） ${failed} 篇。`);
if (REPORT) {
  if (edited.length) {
    console.log("\n已修改文件（前 30 条）：");
    edited.slice(0, 30).forEach(f => console.log("  -", f));
    if (edited.length > 30) console.log(`  ...共 ${edited.length} 个`);
  }
  if (errors.length) {
    console.log("\n解析失败文件（仅记录）：");
    errors.slice(0, 30).forEach(e => console.log("  -", e.file, "\n    ", e.error));
  }
}
