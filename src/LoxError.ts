import {SourceLocation} from './SourceLocation';

export interface LoxError {
  message: string;
  location?: SourceLocation;
}
