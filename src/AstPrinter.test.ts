import {Token, TokenType} from './Scanner';
import * as e from './Expression';
import {AstPrinter} from './AstPrinter';

describe('AstPrinter', () => {
  const printer = new AstPrinter();
  describe('print', () => {
    const str = s => new e.Literal(new Token(TokenType.STRING, s, 0, 1), s);
    const num = n =>
      new e.Literal(new Token(TokenType.NUMBER, n.toString(10), 0, 0), n);

    const leftParen = new Token(TokenType.LEFT_PAREN, '(', 0, 0);
    const rightParen = new Token(TokenType.RIGHT_PAREN, '(', 0, 0);

    // const group = expr => new e.Grouping(leftParen, expr, rightParen);

    // const plus = new Token(TokenType.PLUS, '+', 0, 0);
    // const minus = new Token(TokenType.MINUS, '-', 0, 0);
    // const star = new Token(TokenType.STAR, '*', 0, 0);
    // const slash = new Token(TokenType.SLASH, '/', 0, 0);
    const boolTrue = new e.Literal(
      new Token(TokenType.TRUE, 'true', 0, 0),
      true
    );
    const boolFalse = new e.Literal(
      new Token(TokenType.FALSE, 'false', 0, 0),
      false
    );
    const nil = new e.Literal(new Token(TokenType.NIL, 'nil', 0, 0), null);

    test('string', () => {
      expect(printer.print(str('hi'))).toMatchInlineSnapshot(`"\\"hi\\""`);
    });

    test('true', () => {
      expect(printer.print(boolTrue)).toMatchInlineSnapshot(`"true"`);
    });

    test('false', () => {
      expect(printer.print(boolFalse)).toMatchInlineSnapshot(`"false"`);
    });

    test('nil', () => {
      expect(printer.print(nil)).toMatchInlineSnapshot(`"nil"`);
    });

    test('grouping', () => {
      const expr = new e.Grouping(leftParen, str('hi'), rightParen);

      expect(printer.print(expr)).toMatchInlineSnapshot(`"(group \\"hi\\")"`);
    });

    test('complex grouping', () => {
      const expr = new e.Binary(
        new e.Unary(new Token(TokenType.MINUS, '-', null, 1), num(123)),
        new Token(TokenType.STAR, '*', null, 1),
        new e.Grouping(leftParen, num(45.67), rightParen)
      );

      expect(printer.print(expr)).toMatchInlineSnapshot(
        `"(* (- 123) (group 45.67))"`
      );
    });
  });
});
