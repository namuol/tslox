import {Result, err, ok} from './Result';

enum TokenType {
  // Single-character tokens.
  LEFT_PAREN = 'LEFT_PAREN',
  RIGHT_PAREN = 'RIGHT_PAREN',
  LEFT_BRACE = 'LEFT_BRACE',
  RIGHT_BRACE = 'RIGHT_BRACE',
  COMMA = 'COMMA',
  DOT = 'DOT',
  MINUS = 'MINUS',
  PLUS = 'PLUS',
  SEMICOLON = 'SEMICOLON',
  SLASH = 'SLASH',
  STAR = 'STAR',

  // One or two character tokens.
  BANG = 'BANG',
  BANG_EQUAL = 'BANG_EQUAL',
  EQUAL = 'EQUAL',
  EQUAL_EQUAL = 'EQUAL_EQUAL',
  GREATER = 'GREATER',
  GREATER_EQUAL = 'GREATER_EQUAL',
  LESS = 'LESS',
  LESS_EQUAL = 'LESS_EQUAL',

  // Literals.
  IDENTIFIER = 'IDENTIFIER',
  STRING = 'STRING',
  NUMBER = 'NUMBER',

  // Keywords.
  AND = 'AND',
  CLASS = 'CLASS',
  ELSE = 'ELSE',
  FALSE = 'FALSE',
  FUN = 'FUN',
  FOR = 'FOR',
  IF = 'IF',
  NIL = 'NIL',
  OR = 'OR',
  PRINT = 'PRINT',
  RETURN = 'RETURN',
  SUPER = 'SUPER',
  THIS = 'THIS',
  TRUE = 'TRUE',
  VAR = 'VAR',
  WHILE = 'WHILE',

  // I added these:
  COMMENT = 'COMMENT',

  EOF = 'EOF',
}

class Token {
  type: TokenType;
  lexeme: string;
  line: number;
  column: number;
  constructor(type: TokenType, lexeme: string, line: number, column: number) {
    this.type = type;
    this.lexeme = lexeme;
    this.line = line;
    this.column = column;
  }
}

interface SourceLocation {
  start: {line: number; column?: number};
  end?: {line: number; column?: number};
  filename: string;
}

interface LoxError {
  message: string;
  location?: SourceLocation;
}

class ScannerError implements LoxError {
  message: string;
  location: SourceLocation;
  constructor(
    message: string,
    filename: string,
    start: {line: number; column?: number},
    end?: {line: number; column?: number}
  ) {
    this.message = message;
    this.location = {
      filename,
      start,
      end,
    };
  }
}

export class Scanner {
  readonly filename: string;
  readonly program: string;

  /**
   * An index into our program pointing to the first character of the lexeme
   * being scanned.
   */
  private start = 0;

  /**
   * An index into our program pointing to the current character being considered.
   */
  private current = 0;

  private line = 1;
  private column = 0;
  private tokens: Token[] = [];

  private errors: LoxError[] = [];

  constructor(program: string, filename: string) {
    this.program = program;
    this.filename = filename;
  }

  private isAtEnd(): boolean {
    return this.current >= this.program.length;
  }

  private advance(): string {
    return this.program[this.current++];
  }

  private match(expected: string): boolean {
    if (this.isAtEnd()) {
      return false;
    }

    if (this.program[this.current] !== expected) {
      return false;
    }

    ++this.current;
    return true;
  }

  private peek(): string {
    return this.program[this.current];
  }

  private scanToken(): Result<LoxError, undefined> {
    const char = this.advance();
    switch (char) {
      case ' ':
      case '\r':
      case '\t':
        break;
      case '\n':
        ++this.line;
        this.column = 1;
        break;
      case '(':
        this.addToken(TokenType.LEFT_PAREN);
        break;
      case ')':
        this.addToken(TokenType.RIGHT_PAREN);
        break;
      case '{':
        this.addToken(TokenType.LEFT_BRACE);
        break;
      case '}':
        this.addToken(TokenType.RIGHT_BRACE);
        break;
      case ',':
        this.addToken(TokenType.COMMA);
        break;
      case '.':
        this.addToken(TokenType.DOT);
        break;
      case '-':
        this.addToken(TokenType.MINUS);
        break;
      case '+':
        this.addToken(TokenType.PLUS);
        break;
      case ';':
        this.addToken(TokenType.SEMICOLON);
        break;
      case '*':
        this.addToken(TokenType.STAR);
        break;
      case '!':
        this.addToken(this.match('=') ? TokenType.BANG_EQUAL : TokenType.BANG);
        break;
      case '=':
        this.addToken(
          this.match('=') ? TokenType.EQUAL_EQUAL : TokenType.EQUAL
        );
        break;
      case '<':
        this.addToken(this.match('=') ? TokenType.LESS_EQUAL : TokenType.LESS);
        break;
      case '>':
        this.addToken(
          this.match('=') ? TokenType.GREATER_EQUAL : TokenType.GREATER
        );
        break;
      case '/':
        if (this.match('/')) {
          // A comment goes to the end of the line:
          while (this.peek() !== '\n' && !this.isAtEnd()) {
            this.advance();
          }
          this.addToken(TokenType.COMMENT);
        } else {
          this.addToken(TokenType.SLASH);
        }
        break;
      default:
        return err(
          new ScannerError(
            `Unexpected character: '${char}'`,
            this.filename,
            {line: this.line, column: this.column},
            undefined
          )
        );
    }

    return ok(undefined);
  }

  private addToken(type: TokenType): void {
    const text = this.program.substring(this.start, this.current);
    this.tokens.push(new Token(type, text, this.line, this.column));
    this.column += text.length;
  }

  scanTokens(): Result<LoxError[], Token[]> {
    while (!this.isAtEnd()) {
      this.start = this.current;
      const result = this.scanToken();
      if (result.err) {
        this.errors.push(result.err);
      }
    }
    if (this.errors.length > 0) {
      return err(this.errors);
    }
    return ok(this.tokens);
  }
}

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
