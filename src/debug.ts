/* eslint-disable no-console */
import * as fs from 'fs';
import { Token } from './Token';
import lex from './Lexer';
import render from './render';

export default function printToken(tokens: Token[], indent: string = '') {
  tokens.forEach((token) => {
    if (token.type === 'list') {
      console.log(`${indent}${token.type}`);
      token.options!.list!.items.forEach((item, i) => {
        console.log(`${indent}  item${i}`);
        printToken(item.children, `${indent}    `);
      });
    } else if (token.children.length > 0) {
      console.log(`${indent}${token.type}`);
      printToken(token.children, `${indent}  `);
    } else {
      console.log(`${indent}${token.type}: ${token.text}`);
    }
  });
}

function test() {
  const src = fs.readFileSync('./sample/test1.md', 'utf-8');
  const tokens = lex(src);
  // printToken(tokens);
  console.log(render(tokens));
}

test();
