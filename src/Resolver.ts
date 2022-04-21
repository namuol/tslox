import * as e from './Expression';
import * as s from './Statement';
import {Interpreter} from './Interpreter';
import {Token} from './Scanner';
import {Result, ok, err} from './Result';
import {LoxError} from './LoxError';
import {HasSourceLocation} from './HasSourceLocation';
import {SourceLocation} from './SourceLocation';

export class LoxResolverError implements LoxError {
  constructor(
    readonly message: string,
    private readonly locationSource: HasSourceLocation
  ) {}

  getLocation(filename: string): SourceLocation {
    return this.locationSource.getLocation(filename);
  }
}

export class Resolver
  implements
    e.Visitor<Result<LoxError[], void>>,
    s.Visitor<Result<LoxError[], void>>
{
  private readonly scopes: Array<Map<string, boolean>> = [];
  constructor(private readonly interpreter: Interpreter) {}

  beginScope(): void {
    this.scopes.push(new Map<string, boolean>());
  }

  endScope(): void {
    this.scopes.pop();
  }

  resolveStatement(statement: s.Statement): Result<LoxError[], void> {
    return statement.accept(this);
  }

  resolveExpression(expr: e.Expression): Result<LoxError[], void> {
    return expr.accept(this);
  }

  resolveStatements(statements: s.Statement[]): Result<LoxError[], void> {
    const errs = [];
    for (const statement of statements) {
      const result = this.resolveStatement(statement);
      if (result.err) errs.push(...result.err);
    }

    if (errs.length > 0) return err(errs);
    return ok(undefined);
  }

  declare(name: Token): Result<LoxError[], void> {
    const scope = this.scopes.at(-1);
    if (scope == null) return ok(undefined);

    if (scope.has(name.lexeme)) {
      return err([
        new LoxResolverError(
          `Variable named '${name.lexeme}' already declared in this scope.`,
          name
        ),
      ]);
    }

    // `false` means that the variable is declared but has not yet been defined:
    scope.set(name.lexeme, false);

    return ok(undefined);
  }

  define(name: Token): void {
    const scope = this.scopes.at(-1);
    if (scope == null) return;

    // `true` means that a variable has been defined:
    scope.set(name.lexeme, true);
  }

  Block(stmt: s.Block): Result<LoxError[], void> {
    this.beginScope();
    const result = this.resolveStatements(stmt.statements);
    this.endScope();
    return result;
  }

  Var(stmt: s.Var): Result<LoxError[], void> {
    const result = this.declare(stmt.name);
    if (result.err) return result;

    if (stmt.initializer) {
      const result = this.resolveExpression(stmt.initializer);
      if (result.err) return result;
    }
    this.define(stmt.name);
    return result ?? ok(undefined);
  }

  resolveLocal(expr: e.Expression, name: Token): void {
    for (let i = this.scopes.length - 1; i >= 0; i -= 1) {
      const scope = this.scopes[i];
      if (scope.has(name.lexeme)) {
        this.interpreter.resolve(expr, this.scopes.length - 1 - i);
        break;
      }
    }
  }

  Variable(expr: e.Variable): Result<LoxError[], void> {
    const scope = this.scopes.at(-1);
    if (scope && scope.get(expr.name.lexeme) === false) {
      // Handles cases like `var a = a`:
      return err([
        new LoxResolverError(
          "Can't read local variable in its own initializer",
          expr
        ),
      ]);
    }

    this.resolveLocal(expr, expr.name);

    return ok(undefined);
  }

  Assignment(expr: e.Assignment): Result<LoxError[], void> {
    const result = this.resolveExpression(expr.value);
    this.resolveLocal(expr, expr.name);
    return result;
  }

  resolveFunction(fun: e.Fun): Result<LoxError[], void> {
    this.beginScope();
    for (const param of fun.parameters) {
      const result = this.declare(param);
      if (result.err) return result;
      this.define(param);
    }
    const result = this.resolveStatements(fun.body);
    this.endScope();
    return result;
  }

  FunDecl(stmt: s.FunDecl): Result<LoxError[], void> {
    const result = this.declare(stmt.name);
    if (result.err) return result;
    this.define(stmt.name);

    return this.resolveFunction(stmt.fun);
  }

  Fun(expr: e.Fun): Result<LoxError[], void> {
    if (expr.name !== null) {
      const result = this.declare(expr.name);
      if (result.err) return result;
      this.define(expr.name);
    }

    return this.resolveFunction(expr);
  }

  Expr(stmt: s.Expr): Result<LoxError[], void> {
    return this.resolveExpression(stmt.expr);
  }

  Print(stmt: s.Print): Result<LoxError[], void> {
    return this.resolveExpression(stmt.expr);
  }

  If(stmt: s.If): Result<LoxError[], void> {
    const errs = [];
    let result = this.resolveExpression(stmt.condition);
    if (result.err) errs.push(...result.err);
    result = this.resolveStatement(stmt.thenBranch);
    if (result.err) errs.push(...result.err);

    if (stmt.elseBranch) {
      result = this.resolveStatement(stmt.elseBranch);
      if (result.err) errs.push(...result.err);
    }

    return errs.length ? err(errs) : ok(undefined);
  }

  While(stmt: s.While): Result<LoxError[], void> {
    const errs = [];
    let result = this.resolveExpression(stmt.condition);
    if (result.err) errs.push(...result.err);
    result = this.resolveStatement(stmt.statement);
    if (result.err) errs.push(...result.err);

    return errs.length ? err(errs) : ok(undefined);
  }

  Return(stmt: s.Return): Result<LoxError[], void> {
    return stmt.expr ? this.resolveExpression(stmt.expr) : ok(undefined);
  }

  Binary(expr: e.Binary): Result<LoxError[], void> {
    const errs = [];
    let result = this.resolveExpression(expr.left);
    if (result.err) errs.push(...result.err);
    result = this.resolveExpression(expr.right);
    if (result.err) errs.push(...result.err);

    return errs.length ? err(errs) : ok(undefined);
  }

  Grouping(expr: e.Grouping): Result<LoxError[], void> {
    return this.resolveExpression(expr.expr);
  }

  Literal(): Result<LoxError[], void> {
    return ok(undefined);
  }

  Unary(expr: e.Unary): Result<LoxError[], void> {
    return this.resolveExpression(expr.right);
  }

  InvalidExpression(): Result<LoxError[], void> {
    return ok(undefined);
  }

  Logical(expr: e.Logical): Result<LoxError[], void> {
    const errs = [];
    let result = this.resolveExpression(expr.left);
    if (result.err) errs.push(...result.err);
    result = this.resolveExpression(expr.right);
    if (result.err) errs.push(...result.err);

    return errs.length ? err(errs) : ok(undefined);
  }

  Call(expr: e.Call): Result<LoxError[], void> {
    const errs = [];

    let result = this.resolveExpression(expr.callee);
    if (result.err) errs.push(...result.err);

    for (const arg of expr.args) {
      result = this.resolveExpression(arg);
      if (result.err) errs.push(...result.err);
    }

    return errs.length ? err(errs) : ok(undefined);
  }
}
