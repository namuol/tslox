import {LoxError} from './LoxError';
import {LoxValue} from './LoxValue';
import {SourceLocation} from './SourceLocation';

/**
 * Not a true exception, but a convenient way to break out of a call stack with
 * an early-return value.
 */
export class ReturnedValue extends LoxError {
  message: string;

  getLocation(filename: string): SourceLocation {
    throw new Error('Returned values do not have source locations.');
  }

  constructor(readonly value: LoxValue) {
    super();
    this.message = '';
  }
}
