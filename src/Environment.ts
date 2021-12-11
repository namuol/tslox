import {LoxRuntimeError} from './Interpreter';
import {LoxError} from './LoxError';
import {LoxValue} from './LoxValue';
import {err, ok, Result} from './Result';
import {Token} from './Scanner';

export class Environment {
  private readonly vars: Map<string, LoxValue> = new Map();
  constructor(private readonly enclosing: null | Environment) {}

  get(name: string): LoxValue | void {
    const val = this.vars.get(name);

    if (val === undefined && this.enclosing) {
      return this.enclosing.get(name);
    }

    return val;
  }

  define(name: string, val: LoxValue): void {
    this.vars.set(name, val);
  }

  assign(token: Token, val: LoxValue): Result<LoxError, LoxValue> {
    const name = token.lexeme;

    if (this.vars.has(name)) {
      this.vars.set(name, val);
      return ok(val);
    }

    if (this.enclosing) {
      return this.enclosing.assign(token, val);
    }

    return err(
      new LoxRuntimeError(
        token,
        `No variable named '${name}' to assign a value to.`
      )
    );
  }
}
