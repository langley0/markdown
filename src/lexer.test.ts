/* eslint-disable no-undef */
import * as fs from 'fs';
import lex from './Lexer';

describe('lexer test', () => {
  test('default', (done) => {
    const src = fs.readFileSync('./sample/test1.md', 'utf-8');
    const tokens = lex(src);
    expect(tokens).toBeDefined();
    done();
  });
});
