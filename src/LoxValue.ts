import {Interpreter} from './Interpreter';
import {Result} from './Result';
import {LoxError} from './LoxError';
import {Fun} from './Expression';
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
  constructor(
    private readonly fun: Fun,
    private readonly closure: Environment
  ) {
    super();
  }

  call(interpreter: Interpreter, args: LoxValue[]): Result<LoxError, LoxValue> {
    // I assume this is where we'll need to implement closures:
    const env = new Environment(this.closure);
    const params = this.fun.parameters;

    for (let i = 0; i < args.length; ++i) {
      env.define(params[i].lexeme, args[i]);
    }

    return interpreter.executeBlock(this.fun.body, env);
  }

  arity(): number {
    return this.fun.parameters.length;
  }

  toString(): string {
    return `<fn ${this.fun.name?.lexeme ?? '[function]'}>`;
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
