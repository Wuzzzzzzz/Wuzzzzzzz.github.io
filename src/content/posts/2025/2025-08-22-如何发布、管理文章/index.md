---
title: 如何发布、管理文章
author: William
published: 2025-08-22
updated: 2025-08-22
draft: false
description: ""
image: images/home.png
category: 笔记
tags:
  - 文章
---
# **一、文章管理概述**

你的网站是使用 **Astro** 和 **Decap CMS** 构建的，**Decap CMS** 提供了可视化的文章编辑界面，而 **Astro** 负责前端展示和内容渲染。以下是管理和发布文章的步骤，涉及创建文章、编辑文章、分类管理等。

# 二、发布新文章的步骤

### 1. 使用 **Decap CMS** 编辑文章

#### 1.1 加载本地服务器和管理器

右键点击对应的fuwari文件夹，打开两个git bush终端  

```
pnpm dev
```

```
npx decap-serve
```

#### 1.2 打开后台管理页面

```
http://localhost:4321/admin/
```

#### 1.3 保存文章

完成填写后，点击 **Save** 按钮。如果文章准备好发布，取消勾选 **Draft**，然后点击 **Publish**，即可将文章发布到网站上。

## 三、通过命令行管理文章

### 2.1 新建文章

在命令行中使用 `pnpm` 来创建新文章。

#### 命令：

```
pnpm new-post my-first-post
```

此命令将在 `src/content/posts/` 目录下创建一个新的文件夹，结构类似于：src/content/posts/2024/2024-08-22-my-first-post/index.md

然后你可以直接打开该文件夹，编辑 `index.md`，填写文章的 `frontmatter`（如标题、分类、标签、作者等），并添加文章内容。


### 2.2 编辑现有文章

在创建文章后，你可以直接编辑位于 `src/content/posts/` 目录下的 Markdown 文件。文章的元数据（`frontmatter`）包括以下字段：
 ** title**：文章标题
 ** published**：发布日期（格式：YYYY-MM-DD）
 ** updated**：文章更新日期（格式：YYYY-MM-DD，非必填）
 ** category**：文章分类（例如：生活、工作等）
 ** tags**：文章标签（例如：学习、技术等）
 ** author**：作者（通常由全站配置读取，也可以自定义）
例如，文章的 `index.md` 文件内容：


```
---
title: "我的第一篇文章"
published: 2024-08-22
category: 生活
tags:
  - 随笔
  - 学习
author: "William"
---
这里是文章正文，支持Markdown语法！

```

### 
**2.3 运行本地开发服务器查看文章**



访问 `http://localhost:4321/` 即可查看文章内容。


## 四、更新文章

### 4.1 修改文章内容

你可以在 **Decap CMS** 后台直接编辑文章内容，或者在 `src/content/posts/{year}/{slug}/index.md` 文件中修改文章的正文和 `frontmatter`（例如作者、标签、分类等）。

### 4.2 文章更新后发布

修改完文章后，重新保存，点击 **Publish** 按钮，文章就会更新到网站上。
