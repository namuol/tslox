import {Interpreter} from './Interpreter';
import {Result} from './Result';
import {LoxError} from './LoxError';

export abstract class LoxCallable {
  abstract call(
    interpreter: Interpreter,
    args: LoxValue[]
  ): Result<LoxError, LoxValue>;

  abstract arity(): number;
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
