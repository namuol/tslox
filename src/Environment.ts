import {LoxRuntimeError} from './Interpreter';
import {LoxError} from './LoxError';
import {LoxValue} from './LoxValue';
import {err, ok, Result} from './Result';
import {Token} from './Scanner';

export class Environment {
  private vars: Map<string, LoxValue> = new Map();
  get(name: string): LoxValue | void {
    return this.vars.get(name);
  }

  define(name: string, val: LoxValue): void {
    this.vars.set(name, val);
  }

  assign(token: Token, val: LoxValue): Result<LoxError, LoxValue> {
    const name = token.lexeme;
    if (!this.vars.has(token.lexeme)) {
      return err(
        new LoxRuntimeError(
          token,
          `No variable named '${name}' to assign a value to.`
        )
      );
    }

    this.vars.set(name, val);
    return ok(val);
  }
}
