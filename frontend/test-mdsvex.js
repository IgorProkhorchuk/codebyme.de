import { compile } from 'mdsvex';
import remarkMath from 'remark-math';
import rehypeKatexSvelte from 'rehype-katex-svelte';
import fs from 'fs';

const doc = fs.readFileSync('src/content/blog/uk/entropy.md', 'utf8');

compile(doc, {
    remarkPlugins: [remarkMath],
    rehypePlugins: [rehypeKatexSvelte]
}).then(res => {
    console.log("Output has raw $$ ?", res.code.includes("$$"));
    console.log("Output has unescaped braces ?", res.code.includes("H_{\\text{pass}}"));
}).catch(console.error);
