import rehypeShiki from '@shikijs/rehype';
import rehypeKatex from 'rehype-katex';
import rehypeStringify from 'rehype-stringify';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import remarkParse from 'remark-parse';
import remarkRehype from 'remark-rehype';
import { unified } from 'unified';

/**
 * CommonMark 规定 `#` 与标题文字之间须有空格，否则 `#引言` 会当成普通段落。
 * 仅在 fenced code 块外，为「行首 1–6 个 # 后紧跟非空白」补一个空格，便于中文习惯写法。
 */
function normalizeAtxHeadings(markdown: string): string {
	const lines = markdown.split('\n');
	let inFence = false;
	const out: string[] = [];
	for (const line of lines) {
		if (line.trimStart().startsWith('```')) {
			inFence = !inFence;
			out.push(line);
			continue;
		}
		if (inFence) {
			out.push(line);
			continue;
		}
		const m = line.match(/^(\s*)(#{1,6})([^\s#\r])(.*)$/);
		if (m) {
			out.push(`${m[1]}${m[2]} ${m[3]}${m[4]}`);
		} else {
			out.push(line);
		}
	}
	return out.join('\n');
}

/**
 * 将 Markdown 转为 HTML（GFM + KaTeX + Shiki），仅应在服务端调用。
 */
export async function renderMarkdownToHtml(markdown: string): Promise<string> {
	const source = normalizeAtxHeadings(markdown);
	const file = await unified()
		.use(remarkParse)
		.use(remarkGfm)
		.use(remarkMath)
		.use(remarkRehype)
		.use(rehypeKatex)
		.use(rehypeShiki, {
			theme: 'github-light',
		})
		.use(rehypeStringify);
	const result = await file.process(source);
	return String(result);
}
