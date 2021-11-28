import {Expression} from './Expression';
import {Token} from './Scanner';

export interface Visitor<T> {
  Expr(stmt: Expr): T;
  Print(stmt: Print): T;
  Var(stmt: Var): T;
}

export abstract class Statement {
  abstract accept<T>(visitor: Visitor<T>): T;
}

export class Expr extends Statement {
  accept<T>(visitor: Visitor<T>): T {
    return visitor.Expr(this);
  }

  constructor(readonly expr: Expression) {
    super();
  }
}

export class Print extends Statement {
  accept<T>(visitor: Visitor<T>): T {
    return visitor.Print(this);
  }

  constructor(readonly expr: Expression) {
    super();
  }
}

export class Var extends Statement {
  accept<T>(visitor: Visitor<T>): T {
    return visitor.Var(this);
  }

  constructor(readonly name: Token, readonly initializer: null | Expression) {
    super();
  }
}
