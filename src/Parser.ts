import {Token, TokenType} from './Scanner';
import * as e from './Expression';

export class Parser {
  private tokenIndex: number;

  constructor(private readonly tokens: Token[]) {
    this.tokenIndex = 0;
  }

  parse(): e.Expression {
    return this.expression();
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
    return this.tokens[this.tokenIndex];
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

  // expression      → equality ;
  private expression(): e.Expression {
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
  //                 | primary ;
  private unary(): e.Expression {
    if (this.match(TokenType.BANG, TokenType.MINUS)) {
      return new e.Unary(this.previous(), this.unary());
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
        if (!this.match(TokenType.RIGHT_PAREN)) {
          throw new Error(
            `Expected RIGHT_PAREN but got ${this.previous().type}`
          );
        }
        return new e.Grouping(token, expr, this.previous());
      }
      default: {
        throw new Error(`Unexpected token: ${token.type}`);
      }
    }
  }
}
