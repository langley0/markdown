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
    } else if (token.type === 'newline') {
      // newline 은 실제 렌더하는 토큰이 아니다. 무시한다
    } else {
      tokens.push(token);
    }
  }
  return tokens;
}

function inlineTokens(origin: string, tokens: Token[]): Token[] {
  let src = origin;
  while (src.length > 0) {
    const token = nextInlineToken(src);
    if (token === null) {
      throw new Error(`invalid string after ${src.substring(0, 30)}`);
    }

    src = src.substring(token.raw.length);

    if (token.type === 'link') {
      token.children.push(...inlineTokens(token.text, []));
      tokens.push(token);
    } else if (token.type === 'strong' || token.type === 'em' || token.type === 'strongem') {
      token.children.push(...inlineTokens(token.text, []));
      tokens.push(token);
    } else {
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
        token.children.push(...inlineTokens(token.text, []));
        break;
      }

      case 'blockquote':
        inline(token.children);
        break;

      case 'list':
        token.options!.list!.items.forEach((item) => {
          inline(item.children);
        });
        break;

      default:
        // do nothing
        break;
    }
  });
}

function compress(tokens: Token[]): Token[] {
  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i];

    if (token.type === 'text') {
      if (token.children.length === 1) {
        Object.assign(token, token.children[0]);
      }
      if (token.children.length === 0) {
        if (i > 0 && tokens[i - 1].type === 'text') {
          const prevText = tokens[i - 1];
          if (prevText.children.length === 0) {
            // 합치고 자신을 제거한다
            prevText.raw += token.raw;
            prevText.text += token.text;
            tokens.splice(i, 1);
            --i;
          }
        }
      }
    }

    if ((token.type === 'strong' || token.type === 'em')
    && token.children.length === 1
    && token.children[0].type === 'text') {
      token.children = [];
    }

    if (token.type === 'list') {
      token.options!.list!.items.forEach((item) => {
        compress(item.children);
      });
    }

    // \n 하나만을 가진 텍스트는 텍스트 다음에 이어서 온다면
    if (token.type === 'text'
    && token.raw === '\n') {
      tokens.splice(i, 1);
      --i;
    }

    token.children = compress(token.children);
  }

  return tokens;
}

export default function lex(src: string): Token[] {
  const tokens = block(src, [], true);
  inline(tokens);
  compress(tokens);
  return tokens;
}
