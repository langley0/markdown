import lex from './Lexer';
import render from './render';
import frontmatter from './frontmatter';

const html = (src: string): string => {
  const tokens = lex(src);
  // printToken(tokens);
  return render(tokens);
};

export {
  html,
  lex,
  render,
  frontmatter,
};
