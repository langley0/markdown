// import { countChar } from './utils';

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
        || block.list(src);

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

  link: (src: string): RuleResult | null => {
    // eslint-disable-next-line no-control-regex
    const rule = /^!?\[([\s\S]*)\]\(\s*([^\s\x00-\x1f]*)\s*\)/;
    const result = rule.exec(src);
    if (result !== null) {
      return {
        raw: result[0],
        args: [result[1], result[2]],
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

};

export {
  block,
  inline,
  RuleSet,
};
