import {Scanner} from './Scanner';
import {Parser} from './Parser';
import {Interpreter} from './Interpreter';
import {LoxValue} from './LoxValue';

type Case = [string, string, LoxValue];

const cases: Case[] = [
  ['addition', '1 + 2', 3],
  ['subtraction', '1 - 2', -1],
  ['multiplication', '1 * 2', 2],
  ['division', '1 / 2', 0.5],
  ['addition then multiplication', '1 + 2 * 3', 7],
  ['multiplication then addition', '1 * 2 + 3', 5],
  ['parenthesis get precedence', '( 1 + 2 ) * 3', 9],
  ['string', '"Hello, world!"', 'Hello, world!'],
  ['floating-point number', '1.23456789', 1.23456789],
  ['negative number', '-42', -42],
  ['double-negative number', '--42', 42],
  ['true', 'true', true],
  ['false', 'false', false],
  ['nil', 'nil', null],
  ['not true', '!true', false],
  ['not true', '!!true', true],
];

const interpreter = new Interpreter();
describe('Interpreter', () => {
  describe('interpret', () => {
    for (const [caseName, program, expected] of cases) {
      test(caseName, () => {
        // Okay, so these are really more like integration tests, but I'm much
        // too lazy to manually write out a bunch of ASTs...

        const scannerResult = new Scanner(program, 'test.lox').scanTokens();
        if (scannerResult.err) throw scannerResult.err;

        const parserResult = new Parser(scannerResult.val, 'test.lox').parse();
        if (parserResult.err) throw parserResult.err;

        expect(interpreter.interpret(parserResult.val).val).toEqual(expected);
      });
    }
  });
});
