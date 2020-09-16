import { Token } from './Token';
import { nextBlockToken, nextInlineToken } from './Tokenizer';

function block(origin: string, tokens: Token[], isTop: boolean): Token[] {
  let src = origin.replace(/^ +$/gm, '');
  while (src.length > 0) {
    const token = nextBlockToken(src, tokens);
    if (token === null) {
      throw new Error(`invalid token after : ${src.substring(0, 32)}`);
    }

    src = src.substring(token.raw.length);
    if (token.type === 'null') {
      // 마지막블럭에 추가한다
      const lastToken = tokens[tokens.length - 1];
      lastToken.raw += token.raw;
      lastToken.text += `\n${token.text}`;
    } else if (token.type === 'list') {
      // item 들을 정리한다
      token.options!.list!.items.forEach((item) => {
        item.children.push(...block(item.raw, [], false));
      });

      tokens.push(token);
    } else if (token.type === 'blockquote') {
      token.children = block(token.text, [], isTop);
      tokens.push(token);
    } else {
      // 토큰을 푸시한다
      tokens.push(token);
    }
  }
  return tokens;
}

function inline(tokens: Token[]) {
  tokens.forEach((token) => {
    switch (token.type) {
      case 'paragraph':
      case 'text':
      case 'heading': {
        token.children = [];
        inlineTokens(token.text);
      }
    }
  });
}

function inlineTokens(origin: string, tokens: Token[]): Token[] {
  let src = origin;
  while (src.length > 0) {
    const token = nextInlineToken(src);
    if (token === null) {
      throw new Error(`invalid string after ${src.substring(0, 30)}`);
    }

    src = src.substring(token.raw.length);

    if (token.type === 'escape') {

    }

    if (token.type === 'link') {
      token.children.push(...inlineTokens(token.text, []));
      tokens.push(token);
    }

    if (token.type === 'strong') {
      // token.children.push;
    }
  }

  return tokens;
}

export default function lex(src: string): Token[] {
  const tokens = block(src, [], true);
  return tokens;
}
