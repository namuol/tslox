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

const makeNumericInfixer =
  (verb: string, fn: (a: number, b: number) => LoxValue) =>
  (token: Token, a: LoxValue, b: LoxValue): Result<LoxError, LoxValue> => {
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

const subtract = makeNumericInfixer('subtract', (a, b) => a - b);
const multiply = makeNumericInfixer('multiply', (a, b) => a * b);
const divide = makeNumericInfixer('divide', (a, b) => a / b);
const gt = makeNumericInfixer('compare', (a, b) => a > b);
const geq = makeNumericInfixer('compare', (a, b) => a >= b);
const lt = makeNumericInfixer('compare', (a, b) => a < b);
const leq = makeNumericInfixer('compare', (a, b) => a <= b);

function isTruthy(right: LoxValue) {
  if (typeof right === 'boolean') return right;
  return right !== null;
}

export class Interpreter
  implements
    e.Visitor<Result<LoxError, LoxValue>>,
    s.Visitor<Result<LoxError, LoxValue>>
{
  private environment: Environment = new Environment(null);

  constructor(private readonly filename: string) {}

  Logical({left, operator, right}: e.Logical): Result<LoxError, LoxValue> {
    const leftResult = this.evaluate(left);
    if (leftResult.err != null) return leftResult;

    switch (operator.type) {
      case TokenType.OR: {
        if (isTruthy(leftResult.val)) return leftResult;
        break;
      }
      case TokenType.AND: {
        if (!isTruthy(leftResult.val)) return leftResult;
        break;
      }
      default: {
        return err(
          new LoxRuntimeError(
            operator,
            `INTERNAL ERROR: Invalid logical operator: ${operator.type}`
          )
        );
      }
    }

    return this.evaluate(right);
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

  executeBlock(
    statements: s.Statement[],
    environment: Environment
  ): Result<LoxError, LoxValue> {
    const previousEnv = this.environment;
    this.environment = environment;

    let result;
    for (const stmt of statements) {
      result = this.execute(stmt);
      if (result.err) break;
    }

    this.environment = previousEnv;
    return result || ok(null);
  }

  evaluate(expr: e.Expression): Result<LoxError, LoxValue> {
    return expr.accept(this);
  }

  If({condition, thenBranch, elseBranch}: s.If): Result<LoxError, LoxValue> {
    const conditionResult = this.evaluate(condition);
    if (conditionResult.err) return conditionResult;

    if (isTruthy(conditionResult.val)) {
      return this.execute(thenBranch);
    } else if (elseBranch != null) {
      return this.execute(elseBranch);
    }
    return ok(null);
  }

  While({condition, statement}: s.While): Result<LoxError, LoxValue> {
    // eslint-disable-next-line no-constant-condition
    while (true) {
      const conditionResult = this.evaluate(condition);
      if (conditionResult.err) return conditionResult;
      if (!isTruthy(conditionResult.val)) break;
      const result = this.execute(statement);
      if (result.err) return result;
    }

    return ok(null);
  }

  Block(block: s.Block): Result<LoxError, LoxValue> {
    return this.executeBlock(
      block.statements,
      new Environment(this.environment)
    );
  }

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
