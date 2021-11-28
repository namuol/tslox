import {HasSourceLocation} from './HasSourceLocation';
import {SourceLocation} from './SourceLocation';

export abstract class LoxError implements HasSourceLocation {
  abstract readonly message: string;
  abstract getLocation(filename: string): SourceLocation;
}
