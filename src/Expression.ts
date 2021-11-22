import {Token} from './Scanner';

export interface Visitor<T> {
  Binary(expr: Binary): T;
  Grouping(expr: Grouping): T;
  Literal(expr: Literal): T;
  Unary(expr: Unary): T;
  InvalidExpression(expr: InvalidExpression): T;
}

export abstract class Expression {
  abstract accept<T>(visitor: Visitor<T>): T;
}

export class Binary extends Expression {
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
  constructor(
    readonly message: string,
    readonly op: Token,
    readonly right: Expression
  ) {
    super();
  }
}
