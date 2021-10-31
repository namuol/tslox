type Token = string;

export class Scanner {
  source: string;

  constructor(source: string) {
    this.source = source;
  }

  scanTokens(): Token[] {
    return this.source.split('');
  }
}

/**
 * Run a Lox program from source.
 */
export async function run(program: string): Promise<void> {
  console.log(program);
}