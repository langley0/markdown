import { assert } from 'console';

function findClosingBracket(src: string, b: string): number {
  assert(b.length === 2); const [open, close] = b;
  // 클로즈브라켓을 찾을수 없다
  if (src.indexOf(close) === -1) {
    return -1;
  }

  const { length } = src;
  let level = 0;
  for (let i = 0; i < length; i++) {
    if (src[i] === '\\') {
      i++;
    } else if (src[i] === open) {
      level++;
    } else if (src[i] === close) {
      level--;
      if (level < 0) {
        return i;
      }
    }
  }

  return -1;
}

/**
 * 문자열에서 주어진 특정 문자로 끝나는 부분을 제거한다.
 * str.replace(/c*$/, '') 과 동치이다
 */
function rtrim(src: string, c: string): string {
  const { length } = src;
  if (length === 0) {
    return '';
  }

  let suffLen = 0;
  while (suffLen < length) {
    const curChar = src.charAt(length - suffLen - 1);
    if (curChar === c) {
      suffLen++;
    } else {
      break;
    }
  }

  return src.substr(0, length - suffLen);
}

function countChar(src: string, c: string, index: number): number {
  assert(c.length === 1);
  let count = 0;
  if (index < src.length) {
    for (let i = 0; src[index + i] === c; i++) {
      count++;
    }
  }
  return count;
}

const escapeTest = /[&<>"']/;
const escapeReplace = /[&<>"']/g;
const escapeTestNoEncode = /[<>"']|&(?!#?\w+;)/;
const escapeReplaceNoEncode = /[<>"']|&(?!#?\w+;)/g;
const escapeReplacements: { [key:string]: string } = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
};
const getEscapeReplacement = (ch: string) => escapeReplacements[ch];
function escape(src: string, encode?: string) {
  if (encode) {
    if (escapeTest.test(src)) {
      return src.replace(escapeReplace, getEscapeReplacement);
    }
  } else if (escapeTestNoEncode.test(src)) {
    return src.replace(escapeReplaceNoEncode, getEscapeReplacement);
  }

  return src;
}

const unescapeTest = /&(#(?:\d+)|(?:#x[0-9A-Fa-f]+)|(?:\w+));?/ig;
function unescape(src: string) {
  // explicitly match decimal, hex, and named HTML entities
  return src.replace(unescapeTest, (_, _n) => {
    const n = _n.toLowerCase();
    if (n === 'colon') return ':';
    if (n.charAt(0) === '#') {
      return n.charAt(1) === 'x'
        ? String.fromCharCode(parseInt(n.substring(2), 16))
        : String.fromCharCode(+n.substring(1));
    }
    return '';
  });
}

export {
  findClosingBracket,
  rtrim,
  countChar,
  escape,
  unescape,
};
