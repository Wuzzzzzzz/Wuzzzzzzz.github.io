// scripts/fix-frontmatter.mjs
// 用法：node scripts/fix-frontmatter.mjs "src/content/posts"
import fs from "fs";
import path from "path";

const root = path.resolve(process.argv[2] || "src/content/posts");

// 递归遍历目录
function walk(dir, hit) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, hit);
    else if (e.isFile() && e.name.toLowerCase() === "index.md") hit(p);
  }
}

// 统一修复 frontmatter
function fixOne(md) {
  const m = md.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!m) return md;
  let fm = m[1];

  // 去掉 Tab，换成两个空格
  fm = fm.replace(/\t/g, "  ");

  // date -> published
  fm = fm.replace(/^date:\s*([^\r\n]+)$/m, (_, v) => {
    const dateOnly = String(v).trim().replace(/^"|"$/g, "").split(/[ T]/)[0];
    return `published: ${dateOnly}`;
  });

  // categories -> category（取第一个）
  fm = fm.replace(/^categories:\s*\[([^\]]*)\]\s*$/m, (_, arr) => {
    const first = (arr || "")
      .split(",")[0]
      .replace(/^\s*["']?/, "")
      .replace(/["']?\s*$/, "")
      .trim();
    return `category: ${first || "未分类"}`;
  });
  fm = fm.replace(/^categories:\s*["']?(.+?)["']?\s*$/m, (_, one) => {
    return `category: ${(one || "未分类").trim()}`;
  });

  // tags 如果是一行写的，改成多行写法，避免缩进错误
  fm = fm.replace(/^tags:\s*\[(.*?)\]\s*$/m, (_, arr) => {
    const tags = arr.split(",").map(s => s.replace(/["'\s]/g, "").trim()).filter(Boolean);
    return tags.length
      ? `tags:\n${tags.map(t => `  - ${t}`).join("\n")}`
      : "tags: []";
  });

  // cover/thumbnail -> image
  fm = fm.replace(/^cover:\s*(.+)$/m, "image: $1");
  fm = fm.replace(/^thumbnail:\s*(.+)$/m, "image: $1");

  // title/description 若含冒号，加引号
  fm = fm.replace(/^(title|description):\s*(.+)$/gm, (_, key, val) => {
    val = val.trim();
    if (val.includes(":") && !/^["'].*["']$/.test(val)) {
      return `${key}: "${val}"`;
    }
    return `${key}: ${val}`;
  });

  return md.replace(/^---\r?\n([\s\S]*?)\r?\n---/, `---\n${fm}\n---`);
}

let total = 0, changed = 0;
walk(root, (file) => {
  const old = fs.readFileSync(file, "utf-8");
  const neo = fixOne(old);
  total++;
  if (neo !== old) {
    fs.writeFileSync(file, neo, "utf-8");
    changed++;
  }
});

console.log(`完成：扫描 ${total} 篇，已修复 ${changed} 篇。`);
