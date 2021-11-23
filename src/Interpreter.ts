import {
  Expression,
  Binary,
  Grouping,
  Literal,
  Unary,
  Visitor,
  InvalidExpression,
} from './Expression';
import {LoxError} from './LoxError';
import {LoxValue} from './LoxValue';
import {ParseError} from './Parser';
import {Result, ok, err} from './Result';
import {TokenType} from './Scanner';
import {SourceLocation} from './SourceLocation';

export class LoxRuntimeError implements LoxError {
  constructor(
    readonly message: string,
    readonly location?: SourceLocation | undefined
  ) {}
}

const makeMathDoer =
  <T>(verb: string, fn: (a: number, b: number) => LoxValue) =>
  (a: LoxValue, b: LoxValue): Result<LoxError, LoxValue> => {
    if (typeof a !== 'number' || typeof b !== 'number') {
      return err(
        new LoxRuntimeError(`Cannot ${verb} ${typeof a} and ${typeof b} - expected numbers`)
      );
    }
    return ok(fn(a, b));
  };

const add = makeMathDoer('add', (a, b) => a + b);
const subtract = makeMathDoer('subtract', (a, b) => a - b);
const multiply = makeMathDoer('multiply', (a, b) => a * b);
const divide = makeMathDoer('divide', (a, b) => a / b);

const makeCompareDoer =
  <T>(fn: (a: boolean, b: boolean) => LoxValue) =>
  (a: LoxValue, b: LoxValue): Result<LoxError, LoxValue> => {
    if (typeof a !== 'boolean' || typeof b !== 'boolean') {
      return err(
        new LoxRuntimeError(`Cannot compare ${typeof a} and ${typeof b} - expected booleans`)
      );
    }
    return ok(fn(a, b));
  };

const gt = makeCompareDoer((a, b) => a > b);
const geq = makeCompareDoer((a, b) => a >= b);
const lt = makeCompareDoer((a, b) => a < b);
const leq = makeCompareDoer((a, b) => a <= b);

export class Interpreter implements Visitor<Result<LoxError, LoxValue>> {
  interpret(expr: Expression): Result<LoxError, LoxValue> {
    return expr.accept(this);
  }

  Binary(expr: Binary): Result<LoxError, LoxValue> {
    const left_ = this.interpret(expr.left);
    if (left_.val === undefined) return left_;
    const left = left_.val;
    const right_ = this.interpret(expr.right);
    if (right_.val === undefined) return right_;
    const right = right_.val;

    switch (expr.operator.type) {
      case TokenType.BANG_EQUAL: {
        return ok(left !== right);
      }
      case TokenType.EQUAL_EQUAL: {
        return ok(left === right);
      }
      case TokenType.GREATER: {
        return gt(left, right);
      }
      case TokenType.GREATER_EQUAL: {
        return geq(left, right);
      }
      case TokenType.LESS: {
        return lt(left, right);
      }
      case TokenType.LESS_EQUAL: {
        return leq(left, right);
      }
      case TokenType.PLUS: {
        return add(left, right);
      }
      case TokenType.MINUS: {
        return subtract(left, right);
      }
      case TokenType.SLASH: {
        return divide(left, right);
      }
      case TokenType.STAR: {
        return multiply(left, right);
      }
      default: {
        return err(
          new LoxRuntimeError(
            `INTERNAL ERROR: Unexpected operator type: ${expr.operator.type}`
          )
        );
      }
    }
  }

  Grouping(expr: Grouping): Result<LoxError, LoxValue> {
    return this.interpret(expr.expr);
  }

  Literal(expr: Literal): Result<LoxError, LoxValue> {
    return ok(expr.value);
  }

  Unary(expr: Unary): Result<LoxError, LoxValue> {
    const right_ = this.interpret(expr.right);
    if (right_.val === undefined) return right_;
    const right = right_.val;

    switch (expr.operator.type) {
      case TokenType.BANG: {
        if (typeof right !== 'boolean') {
          return err(
            new LoxRuntimeError(`Cannot logically negate ${typeof right} - expected boolean`)
          );
        }
        return ok(!right);
      }
      case TokenType.MINUS: {
        if (typeof right !== 'number') {
          return err(
            new LoxRuntimeError(`Cannot negate ${typeof right} - expected number`)
          );
        }
        return ok(-right);
      }
      default: {
        return err(
          new LoxRuntimeError(
            `INTERNAL ERROR: Unexpected operator type: ${expr.operator.type}`
          )
        );
      }
    }
  }

  InvalidExpression(expr: InvalidExpression): Result<LoxError, LoxValue> {
    return err(new ParseError(expr.message));
  }
}
