/* eslint-disable no-undef */
import frontmatter from './frontmatter';

describe('lexer test', () => {
  test('default', (done) => {
    const result = frontmatter(`
---
title: Hello
slug: home
---
<h1>Hello world!</h1>`);

    expect(result).not.toBe(null);
    expect(result!.content).toBe('<h1>Hello world!</h1>');
    expect(result!.variables.title).toBe('Hello');
    expect(result!.variables.slug).toBe('home');
    done();
  });
});
