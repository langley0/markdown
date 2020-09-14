import { assert } from 'console';

export default function findClosingBracket(src: string, b: string): number {
  assert(b.length === 2); const [open, close] = b; // 클로즈브라켓을 찾을수 없다
  if (src.indexOf(close) === -1) {
    return -1;
  }

  const { length } = src;
  for (let i = 0; i < length; i++) {
    if (src[i]) {

    }
  }

  return -1;
}
