import {SourceLocation} from './SourceLocation';

export interface LoxError {
  readonly message: string;
  readonly location?: SourceLocation;
}
