import {Result, ok} from './Result';
import {Scanner} from './Scanner';
import {LoxError} from './LoxError';

/**
 * Run a Lox program from source.
 */
export async function run(
  program: string,
  filename: string
): Promise<Result<LoxError[], void>> {
  const result = new Scanner(program, filename).scanTokens();

  if (result.err) {
    return result;
  }

  for (const token of result.val) {
    console.log(token);
  }

  return ok(undefined);
}
