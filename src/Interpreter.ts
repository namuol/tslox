import * as e from './Expression';
import * as s from './Statement';
import {LoxError} from './LoxError';
import {LoxValue, valueToString, print} from './LoxValue';
import {LoxParseError} from './Parser';
import {Result, ok, err} from './Result';
import {Token, TokenType} from './Scanner';
import {HasSourceLocation} from './HasSourceLocation';
import {Environment} from './Environment';

export class LoxRuntimeError implements LoxError {
  constructor(
    readonly locationSource: HasSourceLocation,
    readonly message: string
  ) {}
  getLocation(filename: string) {
    return this.locationSource.getLocation(filename);
  }
}

const makeMathDoer =
  (verb: string, fn: (a: number, b: number) => LoxValue) =>
  (
    token: Token,
    a: LoxValue,
    b: LoxValue
  ): Result<LoxError, LoxValue> => {
    if (typeof a !== 'number' || typeof b !== 'number') {
      return err(
        new LoxRuntimeError(
          token,
          `Cannot ${verb} ${typeof a} (${print(a)}) and ${typeof b} (${print(
            b
          )}) - expected two numbers`
        )
      );
    }
    return ok(fn(a, b));
  };

const subtract = makeMathDoer('subtract', (a, b) => a - b);
const multiply = makeMathDoer('multiply', (a, b) => a * b);
const divide = makeMathDoer('divide', (a, b) => a / b);
const gt = makeMathDoer('compare', (a, b) => a > b);
const geq = makeMathDoer('compare', (a, b) => a >= b);
const lt = makeMathDoer('compare', (a, b) => a < b);
const leq = makeMathDoer('compare', (a, b) => a <= b);

function isTruthy(right: LoxValue) {
  if (typeof right === 'boolean') return right;
  return right !== null;
}

export class Interpreter
  implements
    e.Visitor<Result<LoxError, LoxValue>>,
    s.Visitor<Result<LoxError, LoxValue>>
{
  private readonly environment: Environment = new Environment();

  constructor(private readonly filename: string) {}
  Assignment(expr: e.Assignment): Result<LoxError, LoxValue> {
    const result = this.evaluate(expr.value);
    if (result.err) {
      return result;
    }

    return this.environment.assign(expr.name, result.val);
  }

  Var(stmt: s.Var): Result<LoxError, LoxValue> {
    let val: LoxValue = null;

    if (stmt.initializer) {
      const result = this.evaluate(stmt.initializer);
      if (result.err !== undefined) {
        return result;
      }
      val = result.val;
    }

    this.environment.define(stmt.name.lexeme, val);
    return ok(val);
  }

  Variable(expr: e.Variable): Result<LoxError, LoxValue> {
    const val = this.environment.get(expr.name.lexeme);
    if (val === undefined) {
      return err(
        new LoxRuntimeError(
          expr.name,
          `Undefined variable '${expr.name.lexeme}'.`
        )
      );
    }

    return ok(val);
  }

  Expr(stmt: s.Expr): Result<LoxError, LoxValue> {
    return stmt.expr.accept(this);
  }

  Print(stmt: s.Print): Result<LoxError, LoxValue> {
    const result = stmt.expr.accept(this);
    if (result.val) {
      console.log(valueToString(result.val));
    }
    return ok(null);
  }

  interpret(program: s.Statement[]): Result<LoxError, void | LoxValue> {
    let result: void | Result<LoxError, LoxValue>;

    for (const stmt of program) {
      result = this.execute(stmt);
      if (result.err) return result;
    }

    if (result) {
      return result;
    }

    return ok(undefined);
  }

  execute(stmt: s.Statement): Result<LoxError, LoxValue> {
    return stmt.accept(this);
  }

  evaluate(expr: e.Expression): Result<LoxError, LoxValue> {
    return expr.accept(this);
  }

  Binary(expr: e.Binary): Result<LoxError, LoxValue> {
    const left_ = this.evaluate(expr.left);
    if (left_.val === undefined) return left_;
    const left = left_.val;
    const right_ = this.evaluate(expr.right);
    if (right_.val === undefined) return right_;
    const right = right_.val;

    switch (expr.operator.type) {
      case TokenType.BANG_EQUAL: {
        return ok(left !== right);
      }
      case TokenType.EQUAL_EQUAL: {
        if (Number.isNaN(left) && Number.isNaN(right)) {
          return ok(true);
        }

        return ok(left === right);
      }
      case TokenType.GREATER: {
        return gt(expr.operator, left, right);
      }
      case TokenType.GREATER_EQUAL: {
        return geq(expr.operator, left, right);
      }
      case TokenType.LESS: {
        return lt(expr.operator, left, right);
      }
      case TokenType.LESS_EQUAL: {
        return leq(expr.operator, left, right);
      }
      case TokenType.PLUS: {
        if (typeof left === 'string' || typeof right === 'string') {
          return ok(valueToString(left) + valueToString(right));
        }
        if (typeof left === 'number' && typeof right === 'number') {
          return ok(left + right);
        }

        return err(
          new LoxRuntimeError(
            expr.operator,
            `Cannot add ${typeof left} and ${typeof right} - expected two numbers, or at least one string`
          )
        );
      }
      case TokenType.MINUS: {
        return subtract(expr.operator, left, right);
      }
      case TokenType.SLASH: {
        return divide(expr.operator, left, right);
      }
      case TokenType.STAR: {
        return multiply(expr.operator, left, right);
      }
      default: {
        return err(
          new LoxRuntimeError(
            expr.operator,
            `INTERNAL ERROR: Unexpected operator type: ${expr.operator.type}`
          )
        );
      }
    }
  }

  Grouping(expr: e.Grouping): Result<LoxError, LoxValue> {
    return this.evaluate(expr.expr);
  }

  Literal(expr: e.Literal): Result<LoxError, LoxValue> {
    return ok(expr.value);
  }

  Unary(expr: e.Unary): Result<LoxError, LoxValue> {
    const right_ = this.evaluate(expr.right);
    if (right_.val === undefined) return right_;
    const right = right_.val;

    switch (expr.operator.type) {
      case TokenType.BANG: {
        return ok(!isTruthy(right));
      }
      case TokenType.MINUS: {
        if (typeof right !== 'number') {
          return err(
            new LoxRuntimeError(
              expr.operator,
              `Cannot negate ${typeof right} - expected number`
            )
          );
        }
        return ok(-right);
      }
      default: {
        return err(
          new LoxRuntimeError(
            expr.operator,
            `INTERNAL ERROR: Unexpected operator type: ${expr.operator.type}`
          )
        );
      }
    }
  }

  InvalidExpression(expr: e.InvalidExpression): Result<LoxError, LoxValue> {
    return err(new LoxParseError(expr.message, expr));
  }
}
