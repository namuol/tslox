import {Expression} from './Expression';

export interface Visitor<T> {
  Expr(expr: Statement): T;
  Print(expr: Statement): T;
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
