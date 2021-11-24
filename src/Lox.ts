import {Result, ok, err} from './Result';
import {Scanner} from './Scanner';
import {LoxError} from './LoxError';
import {Parser} from './Parser';
import {Interpreter} from './Interpreter';
import {LoxValue} from './LoxValue';

export class Lox {
  /**
   * Run a Lox program from source.
   */
  static async run(
    program: string,
    filename: string
  ): Promise<Result<LoxError[], void | LoxValue>> {
    const scannerResult = new Scanner(program, filename).scanTokens();
    if (scannerResult.err) return scannerResult;

    const parserResult = new Parser(scannerResult.val, filename).parse();
    if (parserResult.err) return parserResult;

    const result = new Interpreter(filename).interpret(parserResult.val);
    if (result.err) return err([result.err]);

    return result;
  }
}
