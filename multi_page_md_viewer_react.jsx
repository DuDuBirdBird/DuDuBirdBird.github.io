// MultiPage MD Viewer for GitHub Pages (Next.js + React + Tailwind version)
// Features:
// 1. SSR/SSG Markdown loading for Next.js
// 2. Auto-generated TOC (Table of Contents)
// 3. Syntax highlighting & lazy-loaded images
// 4. Works as static export for GitHub Pages

// ---------------------------
// Install dependencies:
// npm install next react react-dom react-markdown remark-gfm rehype-raw rehype-slug rehype-autolink-headings rehype-toc framer-motion rehype-highlight
// npm install highlight.js
// ---------------------------

import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import rehypeSlug from 'rehype-slug';
import rehypeAutolinkHeadings from 'rehype-autolink-headings';
import rehypeHighlight from 'rehype-highlight';
import rehypeToc from 'rehype-toc';
import { motion, AnimatePresence } from 'framer-motion';

// ---------------------------
// Paths configuration
// ---------------------------
// Markdown files should be under /public/content
// Backgrounds under /public/images

const contentDir = path.join(process.cwd(), 'public', 'content');
const manifest = [
  { id: 'network', title: '计算机网络', file: 'network.md', bg: '/images/network.jpg' },
  { id: 'os', title: '操作系统', file: 'os.md', bg: '/images/os.jpg' },
  { id: 'crypto', title: '密码学', file: 'crypto.md', bg: '/images/crypto.jpg' },
];

// ---------------------------
// Pre-generate static paths
// ---------------------------
export async function getStaticPaths() {
  const paths = manifest.map((m) => ({ params: { id: m.id } }));
  return { paths, fallback: false };
}

// ---------------------------
// Load markdown content for each page
// ---------------------------
export async function getStaticProps({ params }) {
  const page = manifest.find((m) => m.id === params.id);
  const fullPath = path.join(contentDir, page.file);
  const fileContents = fs.readFileSync(fullPath, 'utf8');
  const { content } = matter(fileContents);

  return {
    props: {
      page,
      content,
    },
  };
}

// ---------------------------
// Component for a single MD page
// ---------------------------
export default function LearnPage({ page, content }) {
  const [index, setIndex] = React.useState(manifest.findIndex((m) => m.id === page.id));
  const next = index < manifest.length - 1 ? manifest[index + 1] : null;
  const prev = index > 0 ? manifest[index - 1] : null;

  const backgroundStyle = page.bg
    ? {
        backgroundImage: `url(${page.bg})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }
    : { background: 'linear-gradient(135deg, #0f172a, #021124)' };

  return (
    <div className="min-h-screen flex flex-col" style={backgroundStyle}>
      <div className="absolute inset-0 bg-black/50 pointer-events-none" />

      <div className="relative z-10 container mx-auto px-4 py-8">
        <header className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-white">我的学习笔记</h1>
          <div className="space-x-2">
            {prev && (
              <a
                href={`/${prev.id}`}
                className="px-3 py-1 rounded bg-white/10 text-white hover:bg-white/20"
              >
                ← {prev.title}
              </a>
            )}
            {next && (
              <a
                href={`/${next.id}`}
                className="px-3 py-1 rounded bg-white/10 text-white hover:bg-white/20"
              >
                {next.title} →
              </a>
            )}
          </div>
        </header>

        <div className="flex items-start gap-6">
          <aside className="w-64 hidden md:block bg-white/5 p-3 rounded text-white text-sm backdrop-blur-sm">
            <h2 className="font-semibold mb-2">目录</h2>
            <ul>
              {manifest.map((m) => (
                <li key={m.id}>
                  <a
                    href={`/${m.id}`}
                    className={`block px-2 py-1 rounded ${m.id === page.id ? 'bg-white/10' : 'hover:bg-white/5'}`}
                  >
                    {m.title}
                  </a>
                </li>
              ))}
            </ul>
          </aside>

          <main className="prose prose-invert max-w-none flex-1 bg-white/10 rounded p-6 backdrop-blur-md overflow-hidden">
            <AnimatePresence mode="wait">
              <motion.div
                key={page.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
              >
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  rehypePlugins={[rehypeRaw, rehypeSlug, rehypeAutolinkHeadings, rehypeToc, rehypeHighlight]}
                  components={{
                    img: (props) => (
                      <img
                        {...props}
                        loading="lazy"
                        className="rounded shadow-md mx-auto my-4"
                      />
                    ),
                  }}
                >
                  {content}
                </ReactMarkdown>
              </motion.div>
            </AnimatePresence>
          </main>
        </div>

        <footer className="mt-6 text-white/70 text-sm flex justify-between">
          <div>
            当前页：{page.title} （{index + 1}/{manifest.length}）
          </div>
          <div className="w-1/3 bg-white/10 rounded h-2 overflow-hidden">
            <div
              className="h-full bg-white/60"
              style={{ width: `${((index + 1) / manifest.length) * 100}%` }}
            />
          </div>
        </footer>
      </div>
    </div>
  );
}

/*
==============================
部署与使用说明
==============================

1️⃣ 项目结构：

  /public/content/network.md
  /public/content/os.md
  /public/content/crypto.md
  /public/images/network.jpg
  /public/images/os.jpg
  /public/images/crypto.jpg

2️⃣ 新增页面：
   - 添加新的 .md 文件到 /public/content
   - 在 manifest 数组添加一项 { id, title, file, bg }

3️⃣ 在 Next.js 下使用：
   pages/[id].jsx ← 本文件
   pages/index.jsx 可以 redirect 到第一个页面。

4️⃣ 静态导出：
   next build && next export
   将 out/ 上传到 GitHub Pages（仓库名.github.io）。

5️⃣ 自动生成目录：
   rehype-toc 插件会为每个文档生成一个 TOC，可在样式中控制。

6️⃣ 图片懒加载、语法高亮：
   已启用 highlight.js 和 img.loading="lazy"。

7️⃣ 扩展方向：
   - 可添加搜索（预读取所有 md）
   - 可添加阅读进度记忆（localStorage）
*/
