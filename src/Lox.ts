import {Token, TokenType} from './Scanner';
import {SourceLocation} from './SourceLocation';
import {Result, ok, err} from './Result';
import {Scanner} from './Scanner';
import {LoxError} from './LoxError';
import {Parser} from './Parser';
import {Interpreter} from './Interpreter';
import {LoxValue} from './LoxValue';

const printLoc = (loc: SourceLocation): string => {
  return [loc.filename, loc.start.line, loc.start.column].join(':');
};

export class Lox {
  static error(filename: string, token: Token, message: string) {
    const at = token.type === TokenType.EOF ? 'end' : `'${token.lexeme}'`;
    this.report(token.getSourceLocation(filename), ` at ${at}`, message);
  }

  // private static hadError = false;
  private static report(
    loc: SourceLocation,
    where: string,
    message: string
  ): void {
    console.error(`${printLoc(loc)} Error${where}: ${message}`);
    // this.hadError = true;
  }

  /**
   * Run a Lox program from source.
   */
  static async run(
    program: string,
    filename: string
  ): Promise<Result<LoxError[], LoxValue>> {
    const scannerResult = new Scanner(program, filename).scanTokens();

    if (scannerResult.err) {
      return scannerResult;
    }

    const parserResult = new Parser(scannerResult.val, filename).parse();
    if (parserResult.err) {
      return parserResult;
    }

    const result = new Interpreter().interpret(parserResult.val);

    if (result.err) {
      return err([result.err]);
    }

    return ok(result.val);
  }
}
