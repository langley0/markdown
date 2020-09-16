export type TokenType = 'newline'
| 'code'
| 'fences'
| 'list'
| 'paragraph'
| 'heading'
| 'hr'
| 'blockquote'
| 'text'
| 'table'
| 'strong'
| 'em'
| 'link'
| 'codespan'
| 'escape'
| 'null';

export interface Token {
  type: TokenType;
  raw: string;
  text: string;
  children: Token[],
  options?: {
    codeBlockStyle?: 'indented';
    language?: string;
    list?: {
      bullet: string,
      isOrdered: boolean,
      items: { raw: string, children: Token[] } [],
    },
    depth?: number,
  }
}
