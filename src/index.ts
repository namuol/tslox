import {Result, err, ok} from './Result';

/*
*/
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
  COMMENT_BLOCK = 'COMMENT_BLOCK',

  EOF = 'EOF',
}

const KEYWORDS = new Map<string, TokenType>([
  ['and', TokenType.AND],
  ['class', TokenType.CLASS],
  ['else', TokenType.ELSE],
  ['false', TokenType.FALSE],
  ['fun', TokenType.FUN],
  ['for', TokenType.FOR],
  ['if', TokenType.IF],
  ['nil', TokenType.NIL],
  ['or', TokenType.OR],
  ['print', TokenType.PRINT],
  ['return', TokenType.RETURN],
  ['super', TokenType.SUPER],
  ['this', TokenType.THIS],
  ['true', TokenType.TRUE],
  ['var', TokenType.VAR],
  ['while', TokenType.WHILE],
]);

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
   * The line number that we started scanning the current lexeme on.
   */
  private lineStart = 1;

  /**
   * The column number that we started scanning the current lexeme on.
   */
  private columnStart = 1;

  /**
   * An index into our program pointing to the current character being considered.
   */
  private current = 0;

  private line = 1;
  private column = 1;
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
    ++this.column;
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

  private peekNext(): string {
    return this.program[this.current + 1];
  }

  private newline(): void {
    ++this.line;
    this.column = 1;
  }

  private error(message: string) {
    this.errors.push(
      new ScannerError(
        message,
        this.filename,
        {line: this.lineStart, column: this.columnStart},
        {line: this.line, column: this.column}
      )
    );
  }

  private string(): void {
    const text = [];
    while (this.peek() !== '"' && !this.isAtEnd()) {
      let char = this.advance();

      if (char === '\\') {
        char = this.advance();
      }

      if (char === '\n') {
        this.newline();
      }

      text.push(char);
    }

    if (this.isAtEnd()) {
      this.error('Unterminated string.');
    }

    // Closing '"'
    this.advance();

    this.addToken(TokenType.STRING, text.join(''));
  }

  private isDigit(char: string): boolean {
    return char >= '0' && char <= '9';
  }

  private number(): void {
    while (this.isDigit(this.peek())) {
      this.advance();
    }

    if (this.peek() === '.' && this.isDigit(this.peekNext())) {
      // Consume the '.'
      this.advance();

      // Consume the next digit (from peekNext)
      this.advance();

      // Consume the rest of the digits
      while (this.isDigit(this.peek())) {
        this.advance();
      }
    }

    // Unlike in the book, we don't parse the number yet; we do that in the
    // parsing step:
    this.addToken(TokenType.NUMBER);
  }

  private isAlpha(char: string): boolean {
    return (
      (char >= 'a' && char <= 'z') ||
      (char >= 'A' && char <= 'Z') ||
      char === '_'
    );
  }

  private identifier() {
    while (this.isAlpha(this.peek()) || this.isDigit(this.peek())) {
      this.advance();
    }

    const keywordTokenType = KEYWORDS.get(
      this.program.substring(this.start, this.current)
    );

    this.addToken(keywordTokenType || TokenType.IDENTIFIER);
  }

  private commentBlock() {
    while (!(this.peek() === '*' && this.peekNext() === '/')) {
      this.advance();
    }

    // "*"
    this.advance();
    // "/"
    this.advance();

    this.addToken(TokenType.COMMENT_BLOCK);
  }

  private scanToken(): void {
    const char = this.advance();
    switch (char) {
      case ' ':
      case '\r':
      case '\t': {
        break;
      }
      case '\n': {
        this.newline();
        break;
      }
      case '(': {
        this.addToken(TokenType.LEFT_PAREN);
        break;
      }
      case ')': {
        this.addToken(TokenType.RIGHT_PAREN);
        break;
      }
      case '{': {
        this.addToken(TokenType.LEFT_BRACE);
        break;
      }
      case '}': {
        this.addToken(TokenType.RIGHT_BRACE);
        break;
      }
      case ',': {
        this.addToken(TokenType.COMMA);
        break;
      }
      case '.': {
        this.addToken(TokenType.DOT);
        break;
      }
      case '-': {
        this.addToken(TokenType.MINUS);
        break;
      }
      case '+': {
        this.addToken(TokenType.PLUS);
        break;
      }
      case ';': {
        this.addToken(TokenType.SEMICOLON);
        break;
      }
      case '*': {
        this.addToken(TokenType.STAR);
        break;
      }
      case '!': {
        this.addToken(this.match('=') ? TokenType.BANG_EQUAL : TokenType.BANG);
        break;
      }
      case '=': {
        this.addToken(
          this.match('=') ? TokenType.EQUAL_EQUAL : TokenType.EQUAL
        );
        break;
      }
      case '<': {
        this.addToken(this.match('=') ? TokenType.LESS_EQUAL : TokenType.LESS);
        break;
      }
      case '>': {
        this.addToken(
          this.match('=') ? TokenType.GREATER_EQUAL : TokenType.GREATER
        );
        break;
      }
      case '/': {
        if (this.match('/')) {
          // A comment goes to the end of the line:
          while (this.peek() !== '\n' && !this.isAtEnd()) {
            this.advance();
          }
          this.addToken(TokenType.COMMENT);
        }else if (this.match('*')) {
          this.commentBlock();
        } else {
          this.addToken(TokenType.SLASH);
        }
        break;
      }
      case '"': {
        this.string();
        break;
      }
      default: {
        if (this.isDigit(char)) {
          this.number();
          return;
        } else if (this.isAlpha(char)) {
          this.identifier();
          return;
        }

        this.error(`Unexpected character: '${char}'`);
      }
    }
  }

  private addToken(
    type: TokenType,
    text = this.program.substring(this.start, this.current)
  ): void {
    this.tokens.push(new Token(type, text, this.line, this.column));
  }

  scanTokens(): Result<LoxError[], Token[]> {
    while (!this.isAtEnd()) {
      this.start = this.current;
      this.lineStart = this.line;
      this.columnStart = this.column;
      this.scanToken();
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
