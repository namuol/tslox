import {Token, TokenType} from './Scanner';
import * as e from './Expression';
import {RpnPrinter} from './RpnPrinter';

describe('RpnPrinter', () => {
  const printer = new RpnPrinter();
  describe('print', () => {
    const num = n =>
      new e.Literal(new Token(TokenType.NUMBER, n.toString(10), 0, 0), n);

    const leftParen = new Token(TokenType.LEFT_PAREN, '(', 0, 0);
    const rightParen = new Token(TokenType.RIGHT_PAREN, '(', 0, 0);

    const add = (a: e.Expression, b: e.Expression) =>
      new e.Binary(a, new Token(TokenType.PLUS, '+', null, 0), b);
    const sub = (a: e.Expression, b: e.Expression) =>
      new e.Binary(a, new Token(TokenType.MINUS, '-', null, 0), b);
    const mul = (a: e.Expression, b: e.Expression) =>
      new e.Binary(a, new Token(TokenType.STAR, '*', null, 0), b);

    const group = a => new e.Grouping(leftParen, a, rightParen);

    test('simple binary operation', () => {
      expect(printer.print(add(num(1), num(2)))).toMatchInlineSnapshot(
        `"1 2 +"`
      );
    });

    test('grouped', () => {
      expect(
        printer.print(
          mul(group(add(num(1), num(2))), group(sub(num(4), num(3))))
        )
      ).toMatchInlineSnapshot(`"1 2 + 4 3 - *"`);
    });
  });
});
