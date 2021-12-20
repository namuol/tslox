import {Interpreter} from './Interpreter';
import {Result, ok} from './Result';
import {LoxError} from './LoxError';
import {FunDecl} from './Statement';
import {Environment} from './Environment';

export abstract class LoxCallable {
  abstract call(
    interpreter: Interpreter,
    args: LoxValue[]
  ): Result<LoxError, LoxValue>;

  abstract arity(): number;
  abstract toString(): string;
}

export class LoxFunction extends LoxCallable {
  constructor(private readonly funDecl: FunDecl) {
    super();
  }

  call(interpreter: Interpreter, args: LoxValue[]): Result<LoxError, LoxValue> {
    // I assume this is where we'll need to implement closures:
    const env = new Environment(interpreter.globals);
    const params = this.funDecl.parameters;

    for (let i = 0; i < args.length; ++i) {
      env.define(params[i].lexeme, args[i]);
    }

    interpreter.executeBlock(this.funDecl.body, env);

    // Guess we don't have return statements yet!
    return ok(null);
  }

  arity(): number {
    return this.funDecl.parameters.length;
  }

  toString(): string {
    return `<fn ${this.funDecl.name.lexeme}>`;
  }
}

export type LoxValue = number | string | boolean | null | LoxCallable; // Add object types later

export const valueToString = (val: LoxValue): string =>
  val === null ? 'nil' : String(val);

export const print = (val: LoxValue) => {
  if (val === null) {
    return 'nil';
  }

  return JSON.stringify(val);
};
