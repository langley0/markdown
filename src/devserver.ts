import * as fs from 'fs';
import express from 'express';
import { log } from 'console';
import lex from './Lexer';
import render from './render';

const app = express();
app.get('/', (req, res) => {
  // 렌더링 해서 보여준다
  const src = fs.readFileSync('./sample/test1.md', 'utf-8');
  const tokens = lex(src);
  const html = render(tokens);

  res.send(html);
});
app.listen(3000, () => {
  log('dev web server started at port 3000');
});
