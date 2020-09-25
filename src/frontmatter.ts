// front matter syntax
// ---
// var1-name: context
// var2-name: context
// ---
//
// * front matter 는 파일의 가장 위에 위치해야한다
// front-matter 를 사용하는 것이 확실해지면 그때 다시 작업

export interface FrontmatterResult {
  variables: {[key:string]: string }
  content: string,
}

function getLine(src: string): string | null {
  const rule = /^[^\n]*\n+/;
  const result = rule.exec(src);
  if (result !== null) {
    return result[0];
  }
  return null;
}

function pre(src: string): string {
  return src.replace(/\r\n/g, '\n').replace(/\t/g, '  ');
}

function frontmatter(origin: string): FrontmatterResult | null {
  const rule = /^ *(\w+) *: *([\s\S]*\S) *\n+$/;
  const variables: {[key:string]: string } = {};

  let src = pre(origin).trimStart();
  const open = getLine(src);
  if (open === null) { return null; }
  if (open.replace(/\s/gm, '') !== '---') { return null; }

  src = src.substring(open.length);

  while (src.length > 0) {
    const next = getLine(src);
    if (next === null) {
      // 파싱이 끝나지 않은 상태에서 종료되면 프론트매터로 인정되지 않는다
      return null;
    }

    src = src.substring(next.length);

    if (next.replace(/\s/gm, '') === '---') {
      break;
    }

    // variable 을 읽는다
    const result = rule.exec(next);
    if (result === null) {
      return null;
    }

    const name = result[1];
    const value = result[2];
    variables[name] = value;
  }

  // 결과를 반환한다
  return {
    variables,
    content: src,
  };
}

export default frontmatter;
