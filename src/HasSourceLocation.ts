import {SourceLocation} from './SourceLocation';

export interface HasSourceLocation {
  getLocation(filename: string): SourceLocation;
}
