import {Token, TokenType} from './Scanner';
import {LoxError} from './LoxError';
import {SourceLocation} from './SourceLocation';
import * as e from './Expression';
import * as s from './Statement';
import {Result, ok, err} from './Result';
import exp from 'constants';

export class ParseError implements LoxError {
  constructor(
    readonly message: string,
    readonly location?: SourceLocation | undefined
  ) {}
}

export class Parser {
  private tokenIndex: number;
  private errors: LoxError[];

  constructor(
    private readonly tokens: Token[],
    private readonly filename: string
  ) {
    this.tokenIndex = 0;
    this.errors = [];
  }

  printStatement(): s.Print {
    const expr = this.expression();
    this.consume(TokenType.SEMICOLON, "Expect ';' after value");
    return new s.Print(expr);
  }

  expressionStatement(): s.Expr {
    const expr = this.expression();
    this.consume(TokenType.SEMICOLON, "Expect ';' after expression");
    return new s.Expr(expr);
  }

  statement(): s.Statement {
    if (this.match(TokenType.PRINT)) return this.printStatement();
    return this.expressionStatement();
  }

  parse(): Result<LoxError[], s.Statement[]> {
    const statements: s.Statement[] = [];
    while (!this.isAtEnd()) {
      try {
        statements.push(this.statement());
      } catch (e) {
        if (e instanceof ParseError) {
          this.errors.push(e);
          this.synchronize();
        } else {
          throw e;
        }
      }
    }

    if (this.errors.length > 0) return err(this.errors);

    return ok(statements);
  }

  private match(...tokenTypes: TokenType[]): boolean {
    if (this.isAtEnd()) return false;

    if (tokenTypes.includes(this.peek().type)) {
      this.advance();
      return true;
    }

    return false;
  }

  private peek(): Token {
    return this.tokens[this.tokenIndex] || new Token(TokenType.EOF, '', 0, 0);
  }

  private advance(): Token {
    if (!this.isAtEnd()) this.tokenIndex++;
    return this.previous();
  }

  private isAtEnd(): boolean {
    return this.tokenIndex >= this.tokens.length;
  }

  private previous(): Token {
    return this.tokens[this.tokenIndex - 1];
  }

  private consume(type: TokenType, message: string) {
    if (this.peek().type === type) return this.advance();

    throw this.error(this.peek(), message + '; got ' + this.peek().type);
  }

  private error(token: Token, message: string) {
    return new ParseError(message, token.getSourceLocation(this.filename));
  }

  /**
   * Discard tokens until we think we've found a statement boundary.
   */
  private synchronize() {
    this.advance();

    while (!this.isAtEnd()) {
      if (this.previous().type == TokenType.SEMICOLON) return;

      switch (this.peek().type) {
        case TokenType.CLASS:
        case TokenType.FUN:
        case TokenType.VAR:
        case TokenType.FOR:
        case TokenType.IF:
        case TokenType.WHILE:
        case TokenType.PRINT:
        case TokenType.RETURN:
          return;
      }

      this.advance();
    }
  }

  // expression      → equality ;
  expression(): e.Expression {
    return this.equality();
  }

  // equality        → comparison ( ( "==" | "!=" ) comparison)* ;
  private equality(): e.Expression {
    let expr = this.comparison();
    // ( "==" | "!=" )
    while (this.match(TokenType.EQUAL_EQUAL, TokenType.BANG_EQUAL)) {
      const op: Token = this.previous();
      const right = this.comparison();
      expr = new e.Binary(expr, op, right);
    }
    return expr;
  }

  // comparison      → term ( ( ">" | ">=" | "<" | "<=" ) term )* ;
  private comparison(): e.Expression {
    let expr = this.term();
    // ( ">" | ">=" | "<" | "<=" )
    while (
      this.match(
        TokenType.GREATER,
        TokenType.GREATER_EQUAL,
        TokenType.LESS,
        TokenType.LESS_EQUAL
      )
    ) {
      const op: Token = this.previous();
      const right = this.term();
      expr = new e.Binary(expr, op, right);
    }
    return expr;
  }

  // term            → factor ( ( "+" | "-" ) factor )* ;
  private term(): e.Expression {
    let expr = this.factor();
    // ( "+" | "-" )
    while (this.match(TokenType.PLUS, TokenType.MINUS)) {
      const op: Token = this.previous();
      const right = this.factor();
      expr = new e.Binary(expr, op, right);
    }
    return expr;
  }

  // factor          → unary ( ( "/" | "*" ) unary )* ;
  private factor(): e.Expression {
    let expr = this.unary();
    // ( "/" | "*" )
    while (this.match(TokenType.SLASH, TokenType.STAR)) {
      const op: Token = this.previous();
      const right = this.unary();
      expr = new e.Binary(expr, op, right);
    }
    return expr;
  }

  // unary           → ( "!" | "-" ) unary
  //                 | invalidUnary ;
  private unary(): e.Expression {
    if (this.match(TokenType.BANG, TokenType.MINUS)) {
      return new e.Unary(this.previous(), this.unary());
    }

    return this.invalidUnary();
  }

  // invalidUnary    → ( "==" | "!=" | ">" | ">=" | "<" | "<=" | "+" | "/" | "*" ) invalidUnary
  //                 | primary ;
  private invalidUnary(): e.Expression {
    if (
      this.match(
        TokenType.EQUAL_EQUAL,
        TokenType.BANG_EQUAL,
        TokenType.GREATER,
        TokenType.GREATER_EQUAL,
        TokenType.LESS,
        TokenType.LESS_EQUAL,
        TokenType.PLUS,
        TokenType.SLASH,
        TokenType.STAR
      )
    ) {
      const op = this.previous();
      return new e.InvalidUnary(
        `Missing left-hand operand for '${op.lexeme}' operator`,
        op,
        this.invalidUnary()
      );
    }

    return this.primary();
  }

  // primary         → NUMBER | STRING | "true" | "false" | "nil"
  //                 | "(" expression ")" ;
  private primary(): e.Expression {
    const token = this.advance();
    switch (token.type) {
      case TokenType.NUMBER:
        return new e.Literal(token, parseFloat(token.lexeme));
      case TokenType.STRING:
        return new e.Literal(token, JSON.parse(token.lexeme));
      case TokenType.TRUE:
        return new e.Literal(token, true);
      case TokenType.FALSE:
        return new e.Literal(token, false);
      case TokenType.NIL:
        return new e.Literal(token, null);
      case TokenType.LEFT_PAREN: {
        const expr = this.expression();
        this.consume(TokenType.RIGHT_PAREN, "Expected ')' after expression.");
        return new e.Grouping(token, expr, this.previous());
      }
      default: {
        throw this.error(
          token,
          `Unexpected token '${token.type}' - expected expression.`
        );
      }
    }
  }
}