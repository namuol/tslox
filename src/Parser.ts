import {Token, TokenType} from './Scanner';
import {LoxError} from './LoxError';
import {SourceLocation} from './SourceLocation';
import * as e from './Expression';
import * as s from './Statement';
import {Result, ok, err} from './Result';
import {HasSourceLocation} from './HasSourceLocation';

export class LoxParseError implements LoxError {
  constructor(
    readonly message: string,
    private readonly locationSource: HasSourceLocation
  ) {}

  getLocation(filename: string): SourceLocation {
    return this.locationSource.getLocation(filename);
  }
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

  parse(): Result<LoxError[], s.Statement[]> {
    const statements: s.Statement[] = [];
    while (!this.isAtEnd()) {
      try {
        statements.push(this.declaration());
      } catch (e) {
        if (e instanceof LoxParseError) {
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
    const tok = this.peek();
    if (tok.type === type) return this.advance();

    throw this.error(tok, `${message}; got ${tok.type}: "${tok.lexeme}"`);
  }

  private error(token: Token, message: string) {
    return new LoxParseError(message, token);
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

  // declaration     → varDecl
  //                 | statement ;
  declaration(): s.Statement {
    if (this.match(TokenType.VAR)) return this.varDeclaration();
    return this.statement();
  }

  // varDecl         → "var" IDENTIFIER ( "=" expression )? ";" ;
  varDeclaration(): s.Statement {
    const identifier = this.consume(
      TokenType.IDENTIFIER,
      'Expected variable name'
    );

    let initializer = null;
    if (this.match(TokenType.EQUAL)) {
      initializer = this.expression();
    }

    this.consume(TokenType.SEMICOLON, "Expected ';' after expression");
    return new s.Var(identifier, initializer);
  }

  // statement       → exprStmt
  //                 | ifStmt
  //                 | whileStmt
  //                 | forStmt
  //                 | printStmt
  //                 | block ;
  statement(): s.Statement {
    if (this.match(TokenType.IF)) return this.ifStatement();
    if (this.match(TokenType.WHILE)) return this.whileStatement();
    if (this.match(TokenType.FOR)) return this.forStatement();
    if (this.match(TokenType.PRINT)) return this.printStatement();
    if (this.match(TokenType.LEFT_BRACE)) return new s.Block(this.block());
    return this.expressionStatement();
  }

  // ifStmt          → "if" "(" expression ")" statement ( "else" statement )? ;
  ifStatement(): s.Statement {
    this.consume(TokenType.LEFT_PAREN, `Expected '(' after 'if'.`);
    const condition = this.expression();
    this.consume(TokenType.RIGHT_PAREN, `Expected ')' after condition.`);
    const thenBranch = this.statement();
    let elseBranch;
    if (this.match(TokenType.ELSE)) {
      elseBranch = this.statement();
    }
    return new s.If(condition, thenBranch, elseBranch);
  }

  // whileStmt       → "while" "(" expression ")" statement ;
  whileStatement(): s.Statement {
    this.consume(TokenType.LEFT_PAREN, `Expected '(' after 'while'.`);
    const condition = this.expression();
    this.consume(TokenType.RIGHT_PAREN, `Expected ')' after condition.`);
    const statement = this.statement();
    return new s.While(condition, statement);
  }

  // forStmt         → "for" "(" ( varDecl | exprStmt | ";" )
  //                   expression? ";"
  //                   expression? ")" statement ;
  forStatement(): s.Statement {
    // NOTE: We rewrite our for loops as while loops directly inside the parser.
    //
    // I'm following the book's lead here and using this desugaring approach at
    // the AST layer, but I think I would rather keep the semantics and desugar
    // _at the interpreter layer_, instead (if at all), in order to avoid losing
    // any of the authors original semantics so you can do more useful &
    // interesting things through the AST.

    this.consume(TokenType.LEFT_PAREN, `Expected '(' after 'for'.`);

    // First we collect the optional initializer:
    let initializer;
    if (this.match(TokenType.VAR)) {
      initializer = this.varDeclaration();
    } else if (!this.match(TokenType.SEMICOLON)) {
      initializer = this.expressionStatement();
    }

    // ...then the optional condition expression:
    let condition;
    if (this.peek().type !== TokenType.SEMICOLON) {
      condition = this.expression();
    }
    this.consume(TokenType.SEMICOLON, `Expected ';' after loop condition.`);

    // ...and finally the optional incrementor:
    let incrementor;
    if (this.peek().type !== TokenType.RIGHT_PAREN) {
      incrementor = this.expression();
    }

    this.consume(TokenType.RIGHT_PAREN, `Expected ')' after condition.`);

    // Now we construct an equivalent set of statements using `while` in place
    // of `for`.

    // Start with our body just being the statement inside our for loop...
    let body = this.statement();

    // If we have an incrementor, we want to append that to the end of our
    // statement so it executes after our for-loop body:
    if (incrementor) {
      // Add our incrementor to the end of our body
      body = new s.Block([body, new s.Expr(incrementor)]);
    }

    // If no condition was provided, we treat it like `while(true)`:
    if (!condition) {
      // NOTE: This requires us to insert a `true` literal, but we don't have
      // any source code to reference, so this puts us in an awkward position at
      // the AST level. We now have "desugared" (aka "generated") statements and
      // expressions alongside the original semantic source code.
      condition = new e.Literal(
        new Token(TokenType.TRUE, 'true', -1, -1),
        true
      );
    }

    body = new s.While(condition, body);

    if (initializer) {
      body = new s.Block([initializer, body]);
    }

    return body;
  }

  // block           → "{" declaration* "}" ;
  block(): s.Statement[] {
    const statements: s.Statement[] = [];
    while (this.peek().type !== TokenType.RIGHT_BRACE && !this.isAtEnd()) {
      statements.push(this.declaration());
    }
    this.consume(TokenType.RIGHT_BRACE, "Expect '}' after block.");
    return statements;
  }

  // exprStmt        → expression ";" ;
  expressionStatement(): s.Expr {
    const expr = this.expression();
    this.consume(TokenType.SEMICOLON, "Expect ';' after expression");
    return new s.Expr(expr);
  }

  // printStmt       → "print" expression ";" ;
  printStatement(): s.Print {
    const expr = this.expression();
    this.consume(TokenType.SEMICOLON, "Expect ';' after value");
    return new s.Print(expr);
  }

  // expression      → assignment ;
  expression(): e.Expression {
    return this.assignment();
  }

  // assignment      → IDENTIFIER "=" assignment
  //                 | logic_or ;
  assignment(): e.Expression {
    const expr = this.or();

    if (this.match(TokenType.EQUAL)) {
      const equals = this.previous();
      const value = this.assignment();

      if (expr instanceof e.Variable) {
        return new e.Assignment(expr.name, value);
      }

      throw this.error(equals, 'Invalid assignment target');
    }

    return expr;
  }

  // logic_or        → logic_and ( "or" logic_and )* ;
  or(): e.Expression {
    let expr = this.and();

    while (this.match(TokenType.OR)) {
      const operator = this.previous();
      const right = this.and();
      expr = new e.Logical(expr, operator, right);
    }
    return expr;
  }

  // logic_and       → equality ( "and" equality )* ;
  and(): e.Expression {
    let expr = this.equality();

    while (this.match(TokenType.AND)) {
      const operator = this.previous();
      const right = this.equality();
      expr = new e.Logical(expr, operator, right);
    }
    return expr;
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
  //                 | call ;
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

    return this.call();
  }

  // call            → primary ( "(" arguments? ")" )* ;
  private call(): e.Expression {
    let expr = this.primary();

    while (this.match(TokenType.LEFT_PAREN)) {
      let args: e.Expression[];
      if (this.match(TokenType.RIGHT_PAREN)) {
        args = [];
      } else {
        args = this.arguments();
        this.consume(
          TokenType.RIGHT_PAREN,
          "Expect ',' separating or ')' after arguments"
        );
      }

      expr = new e.Call(expr, args, this.previous());
    }

    return expr;
  }

  // arguments       → expression ( "," expression )* ;
  private arguments(): e.Expression[] {
    const args = [];

    do {
      if (arguments.length >= 255) {
        this.error(this.peek(), "Can't have more than 255 arguments.");
      }
      args.push(this.expression());
    } while (this.match(TokenType.COMMA));

    return args;
  }

  // primary         → "true" | "false" | "nil"
  //                 | NUMBER | STRING
  //                 | "(" expression ")"
  //                 | IDENTIFIER ;
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
      case TokenType.IDENTIFIER: {
        return new e.Variable(token);
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
