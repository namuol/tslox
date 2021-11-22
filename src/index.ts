import {Lox} from './Lox';

/**
 * Run a Lox program from source.
 */
export async function run(
  program: string,
  filename: string
) {
  return Lox.run(program, filename);
}
