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
}

export abstract class Expression {
  abstract accept<T>(visitor: Visitor<T>): T;
  abstract getLocation(filename: string): SourceLocation;
}

export class Binary extends Expression {
  getLocation(filename: string): SourceLocation {
    const {start} = this.left.getLocation(filename);
    const {end} = this.right.getLocation(filename);

    return {
      filename,
      start,
      end,
    };
  }

  accept<T>(visitor: Visitor<T>): T {
    return visitor.Binary(this);
  }

  constructor(
    readonly left: Expression,
    readonly operator: Token,
    readonly right: Expression
  ) {
    super();
  }
}

export class Grouping extends Expression {
  getLocation(filename: string): SourceLocation {
    const {start} = this.open.getLocation(filename);
    const {end} = this.close.getLocation(filename);

    return {
      filename,
      start,
      end,
    };
  }
  accept<T>(visitor: Visitor<T>): T {
    return visitor.Grouping(this);
  }

  constructor(
    readonly open: Token,
    readonly expr: Expression,
    readonly close: Token
  ) {
    super();
  }
}

export class Literal extends Expression {
  getLocation(filename: string): SourceLocation {
    return this.token.getLocation(filename);
  }

  accept<T>(visitor: Visitor<T>): T {
    return visitor.Literal(this);
  }

  constructor(
    readonly token: Token,
    readonly value: number | string | boolean | null
  ) {
    super();
  }
}

export class Unary extends Expression {
  getLocation(filename: string): SourceLocation {
    const {start} = this.operator.getLocation(filename);
    const {end} = this.right.getLocation(filename);

    return {
      filename,
      start,
      end,
    };
  }
  accept<T>(visitor: Visitor<T>): T {
    return visitor.Unary(this);
  }

  constructor(readonly operator: Token, readonly right: Expression) {
    super();
  }
}

/**
 * Useful for reporting parser errors by explicitly parsing and understanding
 * common mistakes.
 */
export abstract class InvalidExpression extends Expression {
  accept<T>(visitor: Visitor<T>): T {
    return visitor.InvalidExpression(this);
  }

  abstract readonly message: string;
}

export class InvalidUnary extends InvalidExpression {
  getLocation(filename: string): SourceLocation {
    const {start} = this.op.getLocation(filename);
    const {end} = this.right.getLocation(filename);

    return {
      filename,
      start,
      end,
    };
  }
  constructor(
    readonly message: string,
    readonly op: Token,
    readonly right: Expression
  ) {
    super();
  }
}

export class Variable extends Expression {
  getLocation(filename: string): SourceLocation {
    return this.name.getLocation(filename);
  }
  accept<T>(visitor: Visitor<T>): T {
    return visitor.Variable(this);
  }

  constructor(readonly name: Token) {
    super();
  }
}

export class Assignment extends Expression {
  accept<T>(visitor: Visitor<T>): T {
    return visitor.Assignment(this);
  }
  getLocation(filename: string): SourceLocation {
    const {start} = this.name.getLocation(filename);
    const {end} = this.value.getLocation(filename);
    return {filename, start, end};
  }

  constructor(readonly name: Token, readonly value: Expression) {
    super();
  }
}
