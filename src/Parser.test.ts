import {Token, TokenType} from './Scanner';
import {Parser} from './Parser';
import {AstPrinter} from './AstPrinter';

const num = n => new Token(TokenType.NUMBER, n.toString(10), 0, 0);
const str = s => new Token(TokenType.STRING, JSON.stringify(s), 0, 0);
const id = s => new Token(TokenType.IDENTIFIER, s, 0, 0);

const TOKENS = {
  '(': new Token(TokenType.LEFT_PAREN, '(', 0, 0),
  ')': new Token(TokenType.RIGHT_PAREN, ')', 0, 0),
  '=': new Token(TokenType.EQUAL, '==', 0, 0),
  '==': new Token(TokenType.EQUAL_EQUAL, '==', 0, 0),
  '!=': new Token(TokenType.BANG_EQUAL, '!=', 0, 0),
  '>': new Token(TokenType.GREATER, '>', 0, 0),
  '>=': new Token(TokenType.GREATER_EQUAL, '>=', 0, 0),
  '<': new Token(TokenType.LESS, '<', 0, 0),
  '<=': new Token(TokenType.LESS_EQUAL, '<=', 0, 0),
  '+': new Token(TokenType.PLUS, '+', 0, 0),
  '-': new Token(TokenType.MINUS, '-', 0, 0),
  '*': new Token(TokenType.STAR, '*', 0, 0),
  '/': new Token(TokenType.SLASH, '/', 0, 0),
  '!': new Token(TokenType.BANG, '!', 0, 0),
  ',': new Token(TokenType.COMMA, ',', 0, 0),
  true: new Token(TokenType.TRUE, 'true', 0, 0),
  false: new Token(TokenType.FALSE, 'false', 0, 0),
  nil: new Token(TokenType.NIL, 'nil', 0, 0),
};

type ShorthandToken = keyof typeof TOKENS | number | Token;
type Case = [string, ShorthandToken[], string];
const invalidUnaryOps: ShorthandToken[] = [
  '==',
  '!=',
  '>',
  '>=',
  '<',
  '<=',
  '+',
  '/',
  '*',
];

// prettier-ignore
const cases: Case[] = [
  ['addition', [1, '+', 2], '(+ 1 2)'],
  ['subtraction', [1, '-', 2], '(- 1 2)'],
  ['multiplication', [1, '*', 2], '(* 1 2)'],
  ['division', [1, '/', 2], '(/ 1 2)'],
  ['addition then multiplication',
    [1, '+', 2, '*', 3],
    '(+ 1 (* 2 3))',
  ],
  ['multiplication then addition',
    [1, '*', 2, '+', 3],
    '(+ (* 1 2) 3)',
  ],
  ['parenthesis get precedence',
    ['(', 1, '+', 2, ')', '*', 3],
    '(* (group (+ 1 2)) 3)',
  ],
  ['string',
    [str('Hello, world!')],
    '"Hello, world!"'
  ],
  ['floating-point number',
    [1.23456789],
    '1.23456789'
  ],
  ['negative number',
    ['-', 42],
    '(- 42)'
  ],
  ['double-negative number',
    ['-', '-', 42],
    '(- (- 42))'
  ],
  ['true', ['true'], 'true'],
  ['false', ['false'], 'false'],
  ['nil', ['nil'], 'nil'],
  ['not true',
    ['!', 'true'],
    '(! true)'
  ],
  ['not true',
    ['!', '!', 'true'],
    '(! (! true))'
  ],
  ...invalidUnaryOps.map((op: ShorthandToken): Case => ([
    `invalid unary ${op}`,
    [op, 42],
    `<<Error: Missing left-hand operand for '${op}' operator>>`
  ])),
  ['call', [id('hello'), '(', 42, ')'], '(call hello 42)'],
  ['nested call', [
    id('hello'), '(',
      42, ',', id('foo'), '(',
        43,
      ')',
    ')'], '(call hello 42 (call foo 43))'],
  ['call of call', [
    id('hello'), '(', 42, ')', '(', ')'], '(call (call hello 42))']
];

const printer = new AstPrinter();
describe('Parser', () => {
  describe('parse', () => {
    for (const [caseName, shorthandTokens, expected] of cases) {
      test(caseName, () => {
        const tokens: Token[] = shorthandTokens.map(s => {
          if (s instanceof Token) {
            return s;
          }

          if (typeof s === 'string') {
            return TOKENS[s];
          }

          if (typeof s === 'number') {
            return num(s);
          }

          return str(s);
        });

        const expr = new Parser(tokens, 'test.lox').expression();

        expect(printer.print(expr)).toEqual(expected);
      });
    }
  });
});
