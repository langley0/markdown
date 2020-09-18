import { findClosingBracket } from './utils';

interface RuleResult {
  raw: string,
  args: string[],
}

interface RuleFunction {
  (src: string): RuleResult | null;
}

interface RuleSet {
  [key: string]: RuleFunction
}

const block: RuleSet = {
  newline: (src: string): RuleResult | null => {
    const { length } = src;
    if (length === 0) { return null; }
    if (src[0] !== '\n') { return null; }

    let i = 1;
    while (i < length) {
      if (src[i] !== '\n') { break; }
      i++;
    }

    return {
      raw: src.substring(0, i),
      args: [],
    };
  },

  html: (src: string): RuleResult | null => {
    const rule = /^ {0,3}<([\w-]*)(?: +[\w.:-]*(?: *= *"[^"\n]*"| *= *'[^'\n]*'))*? *\/?>[\s\S]*?(?:\n{2,}|$)/;
    const result = rule.exec(src);
    if (result !== null) {
      return {
        raw: result[0],
        args: [],
      };
    }
    return null;
  },

  // 공백 4개로 시작하는 라인은 코드블럭이다.
  // 이런 라인이 연속해있다면 합쳐서 하나의 코드블럭으로 읽는다
  code: (src: string): RuleResult | null => {
    const rule = /^( {4}[^\n]+\n*)+/;
    const result = rule.exec(src);
    if (result !== null) {
      return {
        raw: result[0],
        args: [],
      };
    }
    return null;
  },
  // ``` 로 감싸여져있는 블럭또한 코드블럭이고, 이것은 펜스라고 정의한다
  // ` 의 갯수는 3개이상도 가능하지만 오픈할때아 같은 개수를 써야 펜스가 종료된다
  // 오픈하는 ``` 뒤에 단어를 넣는다면 코드 타입으로 인식한다
  fences: (src: string): RuleResult | null => {
    const openRule = /^ {0,3}(`{3,})([^\n]*)\n/;
    const open = openRule.exec(src);
    if (open === null) { return null; }
    const marker = open[1];
    const language = open[2];

    const closeIndex = src.indexOf(`${marker}\n`, open[0].length);
    if (closeIndex < 0) {
      return {
        raw: src,
        args: [
          marker,
          language,
          src.substring(open[0].length),
        ],
      };
    }

    return {
      raw: src.substring(0, closeIndex + marker.length + 1),
      args: [
        marker,
        language,
        src.substring(open[0].length, closeIndex),
      ],
    };
  },

  // 가로선
  hr: (src: string): RuleResult | null => {
    const rule = /^ {0,3}((?:-){3,}|(?:_){3,}|(?:\*){3,})(?:\n+|$)/;
    const result = rule.exec(src);
    if (result === null) {
      return null;
    }

    return {
      raw: result[0],
      args: [],
    };
  },

  heading: (src: string): RuleResult | null => {
    const rule = /^ {0,3}(#{1,6}) +([^\n]*?) *(?:\n+|$)/;
    const result = rule.exec(src);
    if (result === null) {
      return null;
    }

    return {
      raw: result[0],
      args: [result[1], result[2]],
    };
  },

  lheading: (src: string): RuleResult | null => {
    const rule = /^ {0,3}([^\n]+)\n {0,3}(=+|-+) *(?:\n+|$)/;
    const result = rule.exec(src);

    if (result === null) {
      return null;
    }

    return {
      raw: result[0],
      args: [result[2], result[1]],
    };
  },

  list: (src: string): RuleResult | null => {
    const rule = /^ {0,3}(?:([*+-])|(\d{1,9})[.)]) ([^\n]+)\n+/;
    const result = rule.exec(src);
    if (result === null) {
      return null;
    }

    if (result[1] !== undefined) {
      // *,+,- 중에 하나이다
      // bulletin list
      return {
        raw: result[0],
        args: [result[1], result[3]],
      };
    }

    if (result[2] !== undefined) {
      // ordered list
      return {
        raw: result[0],
        args: [result[2], result[3]],
      };
    }

    return null;
  },

  blockquote: (origin: string): RuleResult | null => {
    const openRule = /^ {0,3}> ?/;
    let src = origin;
    let blockLength = 0;

    while (src.length > 0) {
      const open = openRule.exec(src);
      if (open === null) {
        break;
      }

      // 패러그래프인가?
      const content = src.substring(open[0].length);
      const paragraph = block.paragraph(content);
      if (paragraph !== null) {
        // 문장을 포함시킨다
        const len = open[0].length + paragraph.raw.length;
        src = src.substring(len);
        blockLength += len;
      } else {
        // 라인끝까지 읽는다
        const lineEnd = content.indexOf('\n');
        if (lineEnd < 0) {
          const len = src.length;
          src = src.substring(len);
          blockLength += len;
        } else {
          const len = open[0].length + lineEnd + 1;
          src = src.substring(len);
          blockLength += len;
        }
      }
    }

    if (blockLength > 0) {
      return {
        raw: origin.substring(0, blockLength),
        args: [],
      };
    }
    return null;
  },

  table: (src: string): RuleResult | null => {
    const rule = /^ {0,3}\|(.+)\n {0,3}\|?( *[-:]+[-| :]*)\n(?: {0,3}(.*)\n*|$)/;
    rule.exec(src); // 일단 준비만 해두자..
    return null;
  },

  paragraph: (origin: string): RuleResult | null => {
    const rule = /^([^\n]+)(?:\n)/;
    let src = origin;

    const result = rule.exec(src);
    if (result === null) {
      return null;
    }

    let { length } = result[0];
    src = src.substring(length);

    // hr, heading, lheading, blockquote, fences, list 가 아니라면 하나의 paragraph 로 연결된다
    while (src.length > 0) {
      const next = block.newline(src)
        || block.hr(src)
        || block.heading(src)
        || block.lheading(src)
        || block.blockquote(src)
        || block.fences(src)
        || block.list(src)
        || block.html(src);

      if (next !== null) { break; }
      const found = src.indexOf('\n');
      if (found < 0) {
        length += src.length;
        src = '';
      } else {
        length += found + 1;
        src = src.substring(found + 1);
      }
    }

    return {
      raw: origin.substring(0, length),
      args: [],
    };
  },

  text: (src: string): RuleResult | null => {
    const rule = /^[^\n]+/;
    const result = rule.exec(src);
    if (result === null) {
      return null;
    }

    return {
      raw: result[0],
      args: [],
    };
  },

  def: (src: string): RuleResult | null => {
    const rule = /^ {0,3}\[(?!\s*\])([^[\]]+)\]: *\n? *([\s\S]*)(?=\n+|$)/;
    const result = rule.exec(src);
    if (result !== null) {
      return {
        raw: result[0],
        args: [result[1], result[2]],
      };
    }
    return null;
  },
};

const inline: RuleSet = {
  escape: (src: string): RuleResult | null => {
    const rule = /^\\([!"#$%&'()*+,\-./:;<=>?@[\]\\^_`{|}~])/;
    const result = rule.exec(src);
    if (result === null) {
      return null;
    }

    return {
      raw: result[0],
      args: [result[1]],
    };
  },

  link: (origin: string): RuleResult | null => {
    let src = origin;
    let isImage = false;
    if (src[0] === '!') {
      src = src.substring(1);
      isImage = true;
    }

    if (src[0] !== '[') {
      return null;
    }

    src = src.substring(1);
    const titleEnd = findClosingBracket(src, '[]');
    if (titleEnd < 0) {
      return null;
    }

    const title = src.substring(0, titleEnd);
    src = src.substring(1 + titleEnd);
    if (src[0] !== '(') {
      return null;
    }

    src = src.substring(1);
    const hrefEnd = findClosingBracket(src, '()');
    if (hrefEnd < 0) {
      return null;
    }

    const href = src.substring(0, hrefEnd);

    // title 과 href 의 룰을 확인한다
    const titleRule = /^\s*!?\[[^[\]\\]*\]|`[^`]*`|[^[\]\\`]*?\s*/;
    const hrefRule = /^\s*[^\s<>\\]*\s*/;
    if (titleRule.test(title) && hrefRule.test(href)) {
      return {
        raw: origin.substring(0, 4 + titleEnd + hrefEnd + (isImage ? 1 : 0)),
        args: [title, href],
      };
    }

    return null;
  },

  reflink: (origin: string): RuleResult | null => {
    let src = origin;
    let isImage = false;
    if (src[0] === '!') {
      src = src.substring(1);
      isImage = true;
    }

    if (src[0] !== '[') {
      return null;
    }

    src = src.substring(1);
    const titleEnd = findClosingBracket(src, '[]');
    if (titleEnd < 0) {
      return null;
    }

    const title = src.substring(0, titleEnd);

    const titleRule = /^\s*!?\[[^[\]\\]*\]|`[^`]*`|[^[\]\\`]*?\s*/;
    if (titleRule.test(title)) {
      return {
        raw: origin.substring(0, 2 + titleEnd + (isImage ? 1 : 0)),
        args: [title],
      };
    }
    return null;
  },

  code: (src: string): RuleResult | null => {
    const rule = /^`([^`]*)`/;
    const result = rule.exec(src);
    if (result !== null) {
      return {
        raw: result[0],
        args: [result[1]],
      };
    }
    return null;
  },

  strong: (src: string): RuleResult | null => {
    const rule = /^(_|\*){2}(?!\1)(?=\S)([\s\S]*?(?!\1)\S)\1{2}(?!\1)/;
    const result = rule.exec(src);
    if (result !== null) {
      return {
        raw: result[0],
        args: [result[2]],
      };
    }
    return null;
  },
  em: (src: string): RuleResult | null => {
    const rule = /^(_|\*)(?!\1)(?=\S)([\s\S]*?(?!\1)\S)\1(?!\1)/;
    const result = rule.exec(src);
    if (result !== null) {
      return {
        raw: result[0],
        args: [result[2]],
      };
    }
    return null;
  },

  strongem: (src: string): RuleResult | null => {
    const rule = /^(_|\*){3}(?!\1)(?=\S)([\s\S]*?(?!\1)\S)\1{3}(?!\1)/;
    const result = rule.exec(src);
    if (result !== null) {
      return {
        raw: result[0],
        args: [result[2]],
      };
    }
    return null;
  },

  text: (src: string): RuleResult | null => {
    // 특수기호 \, < , !, `, * 그리고 단어앞에 사용되는 _ 등장할때까지 인식한다
    // 예외적으로 `로 단어 제일 처음에 단독으로 쓰였을때에는 문장에포함시킨다.
    // 앞에서 코드스팬 검사를 먼저 하여야 하는 이유이다.
    const rule = /^(`+|[^`])(?:[\s\S]*?(?:(?=[\\<![`*]|\b_|$)))/;
    const result = rule.exec(src);
    if (result !== null) {
      return {
        raw: result[0],
        args: [],
      };
    }
    return null;
  },

};

export {
  block,
  inline,
  RuleSet,
};

TODO: def 가 뒤에 엔터를 인식하지 못한다. 엔터를 인식할 수 있도록 룰을 수정해야 한다