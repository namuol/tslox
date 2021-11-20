import {Token, TokenType} from './Scanner';
import * as e from './Expression';
import {AstPrinter} from './AstPrinter';

describe('AstPrinter', () => {
  const printer = new AstPrinter();
  describe('print', () => {
    const stringLiteral = new e.Literal(
      new Token(TokenType.STRING, '"hi"', 0, 1),
      '"hi"'
    );
    const leftParen = new Token(TokenType.LEFT_PAREN, '(', 0, 0);
    const rightParen = new Token(TokenType.RIGHT_PAREN, '(', 0, 0);

    test('simple literal', () => {
      expect(printer.print(stringLiteral)).toMatchInlineSnapshot(`"\\"hi\\""`);
    });

    test('grouping', () => {
      const expr = new e.Grouping(leftParen, stringLiteral, rightParen);

      expect(printer.print(expr)).toMatchInlineSnapshot(`"(group \\"hi\\")"`);
    });

    test('complex grouping', () => {
      const expr = new e.Binary(
        new e.Unary(
          new Token(TokenType.MINUS, '-', null, 1),
          new e.Literal(new Token(TokenType.NUMBER, '123', 0, 0), 123)
        ),
        new Token(TokenType.STAR, '*', null, 1),
        new e.Grouping(
          leftParen,
          new e.Literal(new Token(TokenType.NUMBER, '123', 0, 0), 45.67),
          rightParen
        )
      );

      expect(printer.print(expr)).toMatchInlineSnapshot(
        `"(* (- 123) (group 45.67))"`
      );
    });
  });
});
