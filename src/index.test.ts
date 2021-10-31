import {Scanner} from './index';

describe('Scanner', () => {
  it('works', () => {
    const scanner = new Scanner('hello');
    expect(scanner.scanTokens()).toMatchInlineSnapshot(`
      Array [
        "h",
        "e",
        "l",
        "l",
        "o",
      ]
    `);
  });
});
