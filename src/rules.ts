// import { countChar } from './utils';

interface RuleResult {
  matched : boolean,
  block: string,
  captured: string[],
}

const NotMatched: RuleResult = {
  matched: false,
  block: '',
  captured: [],
};

const block = {
  newline: (src: string): RuleResult => {
    const { length } = src;
    if (length === 0) { return NotMatched; }
    if (src[0] !== '\n') { return NotMatched; }

    let i = 1;
    while (i < length) {
      if (src[i] !== '\n') { break; }
      i++;
    }

    return {
      matched: true,
      block: src.substring(0, i),
      captured: [],
    };
  },

  // 공백 4개로 시작하는 라인은 코드블럭이다.
  // 이런 라인이 연속해있다면 합쳐서 하나의 코드블럭으로 읽는다
  code: (src: string): RuleResult => {
    const rule = /^( {4}[^\n]+\n*)+/;
    const result = rule.exec(src);
    if (result !== null) {
      return {
        matched: true,
        block: result[0],
        captured: [],
      };
    }
    return NotMatched;
  },
  // ``` 로 감싸여져있는 블럭또한 코드블럭이고, 이것은 펜스라고 정의한다
  // ` 의 갯수는 3개이상도 가능하지만 오픈할때아 같은 개수를 써야 펜스가 종료된다
  // 오픈하는 ``` 뒤에 단어를 넣는다면 코드 타입으로 인식한다
  fences: (src: string): RuleResult => {
    const openRule = /^ {0,3}(`{3,})([^\n]*)\n/;
    const open = openRule.exec(src);
    if (open === null) { return NotMatched; }
    const marker = open[1];
    const language = open[2];

    const closeIndex = src.indexOf(`${marker}\n`, open[0].length);
    if (closeIndex < 0) {
      return {
        matched: true,
        block: src,
        captured: [
          marker,
          language,
          src.substring(open[0].length),
        ],
      };
    }

    return {
      matched: true,
      block: src.substring(0, closeIndex + 4),
      captured: [
        marker,
        language,
        src.substring(open[0].length, closeIndex),
      ],
    };
  },
  // 가로선
  hr: (src: string): RuleResult => {
    const rule = /^ {0,3}((?:-){3,}|(?:_){3,}|(?:\*){3,})(?:\n+|$)/;
    const result = rule.exec(src);
    if (result === null) {
      return NotMatched;
    }

    return {
      matched: true,
      block: result[0],
      captured: [],
    };
  },

  heading: (src: string): RuleResult => {
    const rule = /^ {0,3}(#{1,6}) +([^\n]*?) *(?:\n+|$)/;
    const result = rule.exec(src);
    if (result === null) {
      return NotMatched;
    }

    return {
      matched: true,
      block: result[0],
      captured: [result[1], result[2]],
    };
  },

  lheading: (src: string): RuleResult => {
    const rule = /^ {0,3}([^\n]+)\n {0,3}(=+|-+) *(?:\n+|$)/;
    const result = rule.exec(src);

    if (result === null) {
      return NotMatched;
    }

    return {
      matched: true,
      block: result[0],
      captured: [result[2], result[1]],
    };
  },

  list: (src: string): RuleResult => {
    const openRule = /^ {0,3}(?:([*+-])|(\d{1,9})[.)]) ([\s\S]+)\n/;
    const open = openRule.exec(src);
    console.log(open);
    return NotMatched;
  },

  /// ^([^\n]+)\n {0,3}(=+|-+) *(?:\n+|$)/,

  blockquote: (src: string): RuleResult => {
    const openRule = /^ {0,3}> ?/;
    const open = openRule.exec(src);
    if (open === null) {
      return NotMatched;
    }

    // 패러그래프인가?
    const content = src.substring(open[0].length);
    const pResult = block.paragraph(content);
    if (pResult.matched) {
      return {
        matched: true,
        block: src.substring(0, open[0].length + pResult.block.length),
        captured: [pResult.block],
      };
    }
    // 라인끝까지 읽는다
    const lineEnd = content.indexOf('\n');
    if (lineEnd < 0) {
      return {
        matched: true,
        block: src,
        captured: [content],
      };
    }
    return {
      matched: true,
      block: src.substring(0, open[0].length + lineEnd + 1), // \n 을 포함
      captured: [content.substring(0, lineEnd)],
    };
  },
  /// ^( {0,3}> ?(paragraph|[^\n]*) )/,

  paragraph: (src: string): RuleResult => {
    console.log(src);
    return NotMatched;
  },
};

const inline = {

};

export {
  block,
  inline,
};

console.log(block.list('+ test\n'));
