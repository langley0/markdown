import lex from './Lexer';
import render from './render';

const html = (src: string): string => {
  const tokens = lex(src);
  // printToken(tokens);
  return render(tokens);
};

export {
  html,
  lex,
  render,
};
