import {HasSourceLocation} from './HasSourceLocation';
import {Token} from './Scanner';
import {SourceLocation} from './SourceLocation';

export interface Visitor<T> {
  Binary(expr: Binary): T;
  Grouping(expr: Grouping): T;
  Literal(expr: Literal): T;
  Unary(expr: Unary): T;
  InvalidExpression(expr: InvalidExpression): T;
  Variable(expr: Variable): T;
  Assignment(expr: Assignment): T;
  Logical(expr: Logical): T;
  Call(expr: Call): T;
}

export abstract class Expression {
  abstract accept<T>(visitor: Visitor<T>): T;
  abstract getLocation(filename: string): SourceLocation;
}

function getRangeLocation(
  filename: string,
  rangeStart: HasSourceLocation,
  rangeEnd: HasSourceLocation
) {
  const {start} = rangeStart.getLocation(filename);
  const {end} = rangeEnd.getLocation(filename);
  return {filename, start, end};
}

export class Binary extends Expression {
  constructor(
    readonly left: Expression,
    readonly operator: Token,
    readonly right: Expression
  ) {
    super();
  }

  getLocation(filename: string): SourceLocation {
    return getRangeLocation(filename, this.left, this.right);
  }

  accept<T>(visitor: Visitor<T>): T {
    return visitor.Binary(this);
  }
}

export class Grouping extends Expression {
  constructor(
    readonly open: Token,
    readonly expr: Expression,
    readonly close: Token
  ) {
    super();
  }
  accept<T>(visitor: Visitor<T>): T {
    return visitor.Grouping(this);
  }
  getLocation(filename: string): SourceLocation {
    return getRangeLocation(filename, this.open, this.close);
  }
}

export class Literal extends Expression {
  constructor(
    readonly token: Token,
    readonly value: number | string | boolean | null
  ) {
    super();
  }
  accept<T>(visitor: Visitor<T>): T {
    return visitor.Literal(this);
  }
  getLocation(filename: string): SourceLocation {
    return this.token.getLocation(filename);
  }
}

export class Unary extends Expression {
  constructor(readonly operator: Token, readonly right: Expression) {
    super();
  }
  accept<T>(visitor: Visitor<T>): T {
    return visitor.Unary(this);
  }
  getLocation(filename: string): SourceLocation {
    return getRangeLocation(filename, this.operator, this.right);
  }
}

/**
 * Useful for reporting parser errors by explicitly parsing and understanding
 * common mistakes.
 */
export abstract class InvalidExpression extends Expression {
  abstract readonly message: string;

  accept<T>(visitor: Visitor<T>): T {
    return visitor.InvalidExpression(this);
  }
}

export class InvalidUnary extends InvalidExpression {
  constructor(
    readonly message: string,
    readonly op: Token,
    readonly right: Expression
  ) {
    super();
  }
  getLocation(filename: string): SourceLocation {
    return getRangeLocation(filename, this.op, this.right);
  }
}

export class Variable extends Expression {
  constructor(readonly name: Token) {
    super();
  }
  accept<T>(visitor: Visitor<T>): T {
    return visitor.Variable(this);
  }
  getLocation(filename: string): SourceLocation {
    return this.name.getLocation(filename);
  }
}

export class Assignment extends Expression {
  constructor(readonly name: Token, readonly value: Expression) {
    super();
  }
  accept<T>(visitor: Visitor<T>): T {
    return visitor.Assignment(this);
  }
  getLocation(filename: string): SourceLocation {
    return getRangeLocation(filename, this.name, this.value);
  }
}

export class Logical extends Expression {
  constructor(
    readonly left: Expression,
    readonly operator: Token,
    readonly right: Expression
  ) {
    super();
  }
  accept<T>(visitor: Visitor<T>): T {
    return visitor.Logical(this);
  }
  getLocation(filename: string): SourceLocation {
    return getRangeLocation(filename, this.left, this.right);
  }
}

export class Call extends Expression {
  constructor(
    readonly callee: Expression,
    readonly args: Expression[],
    readonly closingParen: Token,
  ) {
    super();
  }
  accept<T>(visitor: Visitor<T>): T {
    return visitor.Call(this);
  }
  getLocation(filename: string): SourceLocation {
    return getRangeLocation(filename, this.callee, this.closingParen);
  }
}
