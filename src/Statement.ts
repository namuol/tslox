import {Expression} from './Expression';
import {Token} from './Scanner';

export interface Visitor<T> {
  Expr(stmt: Expr): T;
  Print(stmt: Print): T;
  Var(stmt: Var): T;
  Block(stmt: Block): T;
  If(stmt: If): T;
  While(stmt: While): T;
}

export abstract class Statement {
  abstract accept<T>(visitor: Visitor<T>): T;
}

export class Expr extends Statement {
  constructor(readonly expr: Expression) {
    super();
  }
  accept<T>(visitor: Visitor<T>): T {
    return visitor.Expr(this);
  }
}

export class Print extends Statement {
  constructor(readonly expr: Expression) {
    super();
  }
  accept<T>(visitor: Visitor<T>): T {
    return visitor.Print(this);
  }
}

export class Var extends Statement {
  constructor(readonly name: Token, readonly initializer: null | Expression) {
    super();
  }
  accept<T>(visitor: Visitor<T>): T {
    return visitor.Var(this);
  }
}

export class Block extends Statement {
  constructor(readonly statements: Statement[]) {
    super();
  }
  accept<T>(visitor: Visitor<T>): T {
    return visitor.Block(this);
  }
}

export class If extends Statement {
  constructor(
    readonly condition: Expression,
    readonly thenBranch: Statement,
    readonly elseBranch?: Statement
  ) {
    super();
  }
  accept<T>(visitor: Visitor<T>): T {
    return visitor.If(this);
  }
}


export class While extends Statement {
  constructor(
    readonly condition: Expression,
    readonly statement: Statement,
  ) {
    super();
  }
  accept<T>(visitor: Visitor<T>): T {
    return visitor.While(this);
  }
}

