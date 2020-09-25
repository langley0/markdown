import hljs from 'highlight.js';
import { Token } from './Token';

export default function render(tokens: Token[], indent: string = ''): string {
  const renderContent = (token: Token): string => {
    if (token.children.length > 0) {
      return `\n${render(token.children, `${indent}  `)}\n${indent}`;
    }
    return token.text;
  };

  const result: string[] = tokens.map((token) => {
    if (token.type === 'blockquote') {
      return `${indent}<blockquote>${renderContent(token)}</blockquote>`;
    }
    if (token.type === 'code') {
      const highlightedCode = token.options?.language
        ? hljs.highlight(token.options!.language, token.text).value
        : hljs.highlightAuto(token.text).value;

      return `${indent}<pre class="hljs">\n${highlightedCode}\n${indent}</pre>`;
    }
    if (token.type === 'codespan') {
      return `${indent}<code>${renderContent(token)}</code>`;
    }
    if (token.type === 'em') {
      return `${indent}<em>${renderContent(token)}/em>`;
    }
    if (token.type === 'strong') {
      return `${indent}<strong>${renderContent(token)}</strong>`;
    }
    if (token.type === 'heading') {
      const tag = `h${token.options!.depth}`;
      return `${indent}<${tag}>${renderContent(token)}</${tag}>`;
    }
    if (token.type === 'hr') {
      return `${indent}<hr/>`;
    }
    if (token.type === 'html') {
      return `${indent}${token.text}`;
    }
    if (token.type === 'link') {
      return `${indent}<a href="${token.options!.href}" rel="nofollow">${renderContent(token)}</a>`;
    }
    if (token.type === 'image') {
      return `${indent}<img src="${token.options!.href}" alt="${token.text}"/>`;
    }
    if (token.type === 'paragraph') {
      return `${indent}<p>${renderContent(token)}</p>`;
    }
    if (token.type === 'strongem') {
      return `${indent}<strong><em>${renderContent(token)}</em></strong>`;
    }
    if (token.type === 'list') {
      const list = token.options!.list!;
      const tag = list.isOrdered ? 'ol' : 'ul';
      const attributes = list.isOrdered ? ` start = ${list.bullet}` : '';
      return `${indent}<${tag}${attributes}>\n${
        list.items.map((item) => `${indent}  <li>\n${render(item.children, `${indent}    `)}\n${indent}  </li>`).join('\n')
      }\n${indent}</${tag}>`;
    }
    if (token.type === 'text') {
      return `${indent}${token.text}`;
    }
    throw new Error(`invalid token type :${token.type}`);
  });

  return result.join('\n');
}
