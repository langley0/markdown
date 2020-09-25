import { block, inline } from './rules';
import { Token } from './Token';

export function newline(src: string): Token | null {
  const result = block.newline(src);
  if (result !== null) {
    return {
      type: 'newline',
      raw: result.raw,
      text: '',
      children: [],
    };
  }
  return null;
}

export function code(src: string, tokens: Token[]): Token | null {
  const result = block.code(src);
  if (result !== null) {
    const lastToken = tokens[tokens.length - 1];
    if (lastToken && lastToken.type === 'paragraph') {
      return {
        type: 'null',
        raw: result.raw,
        text: result.raw.trimRight(),
        children: [],
      };
    }

    return {
      type: 'code',
      raw: result.raw,
      text: result.raw.replace(/^ {4}/gm, ''),
      children: [],
      options: {
        codeBlockStyle: 'indented',
      },
    };
  }
  return null;
}

export function fences(src: string): Token | null {
  const result = block.fences(src);
  if (result !== null) {
    return {
      type: 'code',
      raw: result.raw,
      text: result.args[2].trimRight(),
      children: [],
      options: {
        language: result.args[1].trim(),
      },
    };
  }
  return null;
}

export function heading(src: string): Token | null {
  const result = block.heading(src);
  if (result !== null) {
    return {
      type: 'heading',
      raw: result.raw,
      text: result.args[1],
      children: [],
      options: {
        depth: result.args[0].length,
      },
    };
  }
  return null;
}

export function hr(src: string): Token | null {
  const result = block.hr(src);
  if (result !== null) {
    return {
      type: 'hr',
      raw: result.raw,
      text: '',
      children: [],
    };
  }
  return null;
}

export function blockquote(src: string): Token | null {
  const result = block.blockquote(src);
  if (result !== null) {
    const content = result.raw.replace(/> ?/gm, '');
    return {
      type: 'blockquote',
      raw: result.raw,
      text: content,
      children: [],
    };
  }
  return null;
}

export function list(src: string): Token | null {
  let result = block.list(src);

  if (result !== null) {
    let { raw } = result;
    const bullet = result.args[0];
    const ordered = !Number.isNaN(Number(bullet));
    const items: string[] = [result.args[1]];

    const checkBulletType = (dstBullet: string): boolean => {
      if (ordered) {
        // 숫자이면 된다
        return !Number.isNaN(Number(dstBullet));
      }

      // 모양이 같아야 한다
      return bullet === dstBullet;
    };

    // 리스트가 반복될때까지 읽어온다
    result = block.list(src.substring(raw.length));
    while (result !== null) {
      // 같은 불렛타입?
      // 아니라면 넘긴다
      if (checkBulletType(result.args[0])) {
        raw += result.raw;
        items.push(result.args[1]);
      } else {
        break;
      }

      result = block.list(src.substring(raw.length));
    }

    return {
      type: 'list',
      raw,
      text: '', // 중요하지 않다
      children: [],
      options: {
        list: {
          bullet,
          isOrdered: ordered,
          items: items.map((item) => ({ raw: item, children: [] })),
        },
      },
    };
  }
  return null;
}

export function html(src: string): Token | null {
  const result = block.html(src);
  if (result !== null) {
    return {
      type: 'html',
      raw: result.raw,
      text: result.raw,
      children: [],
    };
  }
  return null;
}

export function def(src: string): Token | null {
  const result = block.def(src);
  if (result !== null) {
    return {
      type: 'def',
      raw: result.raw,
      text: result.args[0],
      children: [],
      options: {
        href: result.args[1],
      },
    };
  }
  return null;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function table(_src: string): Token | null {
  return null;
}

export function lheading(src: string): Token | null {
  const result = block.lheading(src);
  if (result !== null) {
    return {
      type: 'heading',
      raw: result.raw,
      text: result.args[1],
      children: [],
      options: {
        depth: result.args[0] === '=' ? 1 : 2,
      },
    };
  }
  return null;
}

export function paragraph(src: string): Token | null {
  const result = block.paragraph(src);
  if (result !== null) {
    return {
      type: 'paragraph',
      raw: result.raw,
      text: result.raw.replace(/^ +/gm, ''),
      children: [],
    };
  }
  return null;
}

export function text(src: string, tokens:Token[]): Token | null {
  const result = block.text(src);
  if (result !== null) {
    const lastToken = tokens[tokens.length - 1];
    if (lastToken && lastToken.type === 'text') {
      return {
        type: 'null',
        raw: result.raw,
        text: result.raw,
        children: [],
      };
    }
    return {
      type: 'text',
      raw: result.raw,
      text: result.raw,
      children: [],
    };
  }
  return null;
}

export function nextBlockToken(src: string, tokens: Token[]): Token | null {
  return newline(src)
    || code(src, tokens)
    || fences(src)
    || heading(src)
    || hr(src)
    || blockquote(src)
    || list(src)
    || html(src)
    || def(src)
    || table(src)
    || lheading(src)
    || paragraph(src)
    || text(src, tokens);
}

export function escape(src: string): Token | null {
  const result = inline.escape(src);
  if (result !== null) {
    return {
      type: 'escape',
      raw: result.raw,
      text: '',
      children: [],
    };
  }
  return null;
}

export function link(src: string): Token | null {
  const result = inline.link(src);
  if (result !== null) {
    if (result.raw[0] === '!') {
      return {
        type: 'image',
        raw: result.raw,
        text: result.args[0],
        children: [],
        options: {
          href: result.args[1],
        },
      };
    }
    return {
      type: 'link',
      raw: result.raw,
      text: result.args[0],
      children: [],
      options: {
        href: result.args[1],
      },
    };
  }
  return null;
}

export function strong(src: string): Token | null {
  const result = inline.strong(src);
  if (result !== null) {
    return {
      type: 'strong',
      raw: result.raw,
      text: result.args[0],
      children: [],
    };
  }
  return null;
}

export function em(src: string): Token | null {
  const result = inline.em(src);
  if (result !== null) {
    return {
      type: 'em',
      raw: result.raw,
      text: result.args[0],
      children: [],
    };
  }
  return null;
}

export function strongem(src: string): Token | null {
  const result = inline.strongem(src);
  if (result !== null) {
    return {
      type: 'strongem',
      raw: result.raw,
      text: result.args[0],
      children: [],
    };
  }
  return null;
}

export function codespan(src: string): Token | null {
  const result = inline.code(src);
  if (result !== null) {
    return {
      type: 'codespan',
      raw: result.raw,
      text: result.args[0],
      children: [],
    };
  }
  return null;
}

export function inlineText(src: string): Token | null {
  const result = inline.text(src);
  if (result !== null) {
    // escape 를 해야할지는 문장결과를 보고 판단
    return {
      type: 'text',
      raw: result.raw,
      text: result.raw,
      children: [],
    };
  }
  return null;
}

export function reflink(src: string): Token | null {
  const result = inline.reflink(src);
  if (result !== null) {
    return {
      type: 'reflink',
      raw: result.raw,
      text: result.args[0],
      children: [],
    };
  }
  return null;
}

export function nextInlineToken(src: string): Token | null {
  return escape(src)
  // || tag
  || link(src)
  || reflink(src)
  || strongem(src)
  || strong(src)
  || em(src)
  || codespan(src)
  // autolink(url)
  || inlineText(src)
  || null;
}
