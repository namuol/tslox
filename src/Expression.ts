import {Token} from './Scanner';

export interface Visitor<T> {
  Binary(expr: Binary): T;
  Grouping(expr: Grouping): T;
  Literal(expr: Literal): T;
  Unary(expr: Unary): T;
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
