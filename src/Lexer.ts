import { Token } from './Token';
import { nextBlockToken, nextInlineToken } from './Tokenizer';

interface Link {
  key: string;
  href: string;
}

function block(origin: string, tokens: Token[], isTop: boolean): [Token[], Link[]] {
  const links: Link[] = [];

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
        item.children.push(...block(item.raw, [], false)[0]);
      });

      tokens.push(token);
    } else if (token.type === 'blockquote') {
      const [children] = block(token.text, [], isTop);
      token.children = children;
      tokens.push(token);
    } else if (token.type === 'newline') {
      // newline 은 실제 렌더하는 토큰이 아니다. 무시한다
    } else if (token.type === 'def') {
      // reference 를 정의한다
      links.push({ key: token.text, href: token.options!.href! });
    } else {
      tokens.push(token);
    }
  }
  return [tokens, links];
}

function inlineTokens(origin: string, tokens: Token[], links: Link[]): Token[] {
  let src = origin;
  while (src.length > 0) {
    const token = nextInlineToken(src);
    if (token === null) {
      throw new Error(`invalid string after ${src.substring(0, 30)}`);
    }

    src = src.substring(token.raw.length);

    if (token.type === 'link') {
      token.children.push(...inlineTokens(token.text, [], links));
      tokens.push(token);
    } else if (token.type === 'reflink') {
      const found = links.find((p) => p.key === token.text);
      if (found !== undefined) {
        token.type = 'link';
        token.options = { href: found.href };
      } else {
        // 평범한 text 로 변경한다
        token.type = 'text';
      }
      tokens.push(token);
    } else if (token.type === 'strong' || token.type === 'em' || token.type === 'strongem') {
      token.children.push(...inlineTokens(token.text, [], links));
      tokens.push(token);
    } else {
      tokens.push(token);
    }
  }

  return tokens;
}

function inline(tokens: Token[], links: Link[]) {
  tokens.forEach((token) => {
    switch (token.type) {
      case 'paragraph':
      case 'text':
      case 'heading': {
        token.children.push(...inlineTokens(token.text, [], links));
        break;
      }

      case 'blockquote':
        inline(token.children, links);
        break;

      case 'list':
        token.options!.list!.items.forEach((item) => {
          inline(item.children, links);
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
        } else if (token.text.trim() === '') {
          // 단독으로 쓰이면서 의미없는 텍스트는 제거한다
          tokens.splice(i, 1);
          --i;
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

    token.children = compress(token.children);
  }

  return tokens;
}

function post(tokens: Token[]) {
  const compressed = compress(tokens);
  for (let i = 0; i < compressed.length; i++) {
    const token = compressed[i];
    if (token.type === 'text'
    || token.type === 'strong'
    || token.type === 'em') {
      token.text = token.text.replace('\n', ' ').trim();
    }
    post(token.children);
  }
  return tokens;
}

export default function lex(src: string): Token[] {
  const [tokens, links] = block(src, [], true);
  inline(tokens, links);
  return post(tokens);
}

console.log(lex(`[Hashcash]test
[none]


[Hashcash]: https://en.wikipedia.org/wiki/Hashcash


*test*
test
test2
`));
