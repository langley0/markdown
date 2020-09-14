/* eslint-disable no-undef */
import { block } from './rules';

describe('block rules test', () => {
  describe('code block', () => {
    test('code test 1', (done) => {
      const result = block.code('    this is code\n    this is next line\n   how what');
      expect(result.matched).toBe(true);
      expect(result.block).toEqual('    this is code\n    this is next line\n');
      done();
    });
  });

  describe('fences', () => {
    test('fences test 1', (done) => {
      const src = '  ``` javascript\n this is code block\n next line \n```\n';
      const result = block.fences(src);
      expect(result.matched).toBe(true);
      expect(result.block).toEqual(src);
      done();
    });

    test('fences test 2', (done) => {
      const src = '  ```\n this is code block\n next line \n';
      const result = block.fences(src);
      expect(result.matched).toBe(true);
      expect(result.block).toEqual(src);
      done();
    });

    test('fences test 3', (done) => {
      const src = '  ``` javascript\n this is code block\n next line \n``';
      const result = block.fences(src);
      expect(result.matched).toBe(true);
      expect(result.block).toEqual(src);
      done();
    });
  });

  describe('hr', () => {
    test('hr test 1', (done) => {
      const src = ' ------\n';
      const result = block.hr(src);
      expect(result.matched).toBe(true);
      expect(result.block).toEqual(src);
      done();
    });

    test('hr test 2', (done) => {
      const src = '___\n';
      const result = block.hr(src);
      expect(result.matched).toBe(true);
      expect(result.block).toEqual(src);
      done();
    });

    test('hr test 3', (done) => {
      const src = '****\n';
      const result = block.hr(src);
      expect(result.matched).toBe(true);
      expect(result.block).toEqual(src);
      done();
    });
  });

  describe('heading', () => {
    test('heading #1 test', (done) => {
      const src = 'TITLE#1';
      const result = block.heading(`  # ${src}\n`);
      expect(result.matched).toBe(true);
      expect(result.captured[0]).toEqual('#');
      expect(result.captured[1]).toEqual(src);
      done();
    });

    test('heading #2 test', (done) => {
      const src = 'TITLE#2';
      const result = block.heading(`  ## ${src}  \n`);
      expect(result.matched).toBe(true);
      expect(result.captured[0]).toEqual('##');
      expect(result.captured[1]).toEqual(src);
      done();
    });

    test('heading #3 test', (done) => {
      const src = 'TITLE#3';
      const result = block.heading(`  ###### ${src}  \n`);
      expect(result.matched).toBe(true);
      expect(result.captured[0]).toEqual('######');
      expect(result.captured[1]).toEqual(src);
      done();
    });

    test('heading #4 test', (done) => {
      const src = 'TITLE#FAIL';
      const result = block.heading(`####### ${src}  \n`);
      expect(result.matched).toBe(false);
      done();
    });
  });
});
