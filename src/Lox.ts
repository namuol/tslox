import {Result, err} from './Result';
import {Scanner} from './Scanner';
import {LoxError} from './LoxError';
import {Parser} from './Parser';
import {Interpreter} from './Interpreter';
import {LoxValue} from './LoxValue';
import {Resolver} from './Resolver';

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
    const statements = parserResult.val;

    const interpreter = new Interpreter(filename);
    const resolver = new Resolver(interpreter);
    const resolverResult = resolver.resolveStatements(statements);
    if (resolverResult.err) return resolverResult;

    const result = interpreter.interpret(statements);
    if (result.err) return err([result.err]);

    return result;
  }

  private readonly interpreter: Interpreter;
  constructor(private readonly filename: string) {
    this.interpreter = new Interpreter(filename);
  }

  async eval(
    programFragment: string
  ): Promise<Result<LoxError[], void | LoxValue>> {
    const scannerResult = new Scanner(
      programFragment,
      this.filename
    ).scanTokens();
    if (scannerResult.err) return scannerResult;

    const parserResult = new Parser(scannerResult.val, this.filename).parse();
    if (parserResult.err) return parserResult;
    const statements = parserResult.val;

    const resolver = new Resolver(this.interpreter);
    const resolverResult = resolver.resolveStatements(statements);
    if (resolverResult.err) return resolverResult;

    const result = this.interpreter.interpret(statements);
    if (result.err) return err([result.err]);

    return result;
  }
}
