import {Token, TokenType} from './Scanner';
import {Parser} from './Parser';
import {AstPrinter} from './AstPrinter';

const num = n => new Token(TokenType.NUMBER, n.toString(10), 0, 0);
const str = s => new Token(TokenType.STRING, JSON.stringify(s), 0, 0);
const lparen = new Token(TokenType.LEFT_PAREN, '(', 0, 0);
const rparen = new Token(TokenType.RIGHT_PAREN, ')', 0, 0);
const plus = new Token(TokenType.PLUS, '+', 0, 0);
const minus = new Token(TokenType.MINUS, '-', 0, 0);
const star = new Token(TokenType.STAR, '*', 0, 0);
const slash = new Token(TokenType.SLASH, '/', 0, 0);
const eq = new Token(TokenType.EQUAL, '==', 0, 0);
const bang = new Token(TokenType.BANG, '!', 0, 0);
const eqeq = new Token(TokenType.EQUAL_EQUAL, '==', 0, 0);
const neq = new Token(TokenType.BANG_EQUAL, '!=', 0, 0);
const boolTrue = new Token(TokenType.TRUE, 'true', 0, 0);
const boolFalse = new Token(TokenType.FALSE, 'false', 0, 0);
const nil = new Token(TokenType.NIL, 'nil', 0, 0);

type Case = [string, Token[], string];

// prettier-ignore
const cases: Case[] = [
  ['addition', [num(1), plus, num(2)], '(+ 1 2)'],
  ['subtraction', [num(1), minus, num(2)], '(- 1 2)'],
  ['multiplication', [num(1), star, num(2)], '(* 1 2)'],
  ['division', [num(1), slash, num(2)], '(/ 1 2)'],
  ['addition then multiplication',
    [num(1), plus, num(2), star, num(3)],
    '(+ 1 (* 2 3))',
  ],
  ['multiplication then addition',
    [num(1), star, num(2), plus, num(3)],
    '(+ (* 1 2) 3)',
  ],
  ['parenthesis get precedence',
    [lparen, num(1), plus, num(2), rparen, star, num(3)],
    '(* (group (+ 1 2)) 3)',
  ],
  ['string',
    [str('Hello, world!')],
    '"Hello, world!"'
  ],
  ['floating-point number',
    [num(1.23456789)],
    '1.23456789'
  ],
  ['negative number',
    [minus, num(42)],
    '(- 42)'
  ],
  ['double-negative number',
    [minus, minus, num(42)],
    '(- (- 42))'
  ],
  ['true', [boolTrue], 'true'],
  ['false', [boolFalse], 'false'],
  ['nil', [nil], 'nil'],
  ['not true',
    [bang, boolTrue],
    '(! true)'
  ],
  ['not true',
    [bang, bang, boolTrue],
    '(! (! true))'
  ],
];

const printer = new AstPrinter();
describe('Parser', () => {
  describe('parse', () => {
    for (const [caseName, tokens, expected] of cases) {
      test(caseName, () => {
        expect(printer.print(new Parser(tokens).parse())).toEqual(expected);
      });
    }
  });
});
