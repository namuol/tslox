export interface SourceLocation {
  start: {line: number; column?: number};
  end?: {line: number; column?: number};
  filename: string;
}
