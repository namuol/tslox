import {
  Expression,
  Binary,
  Grouping,
  Literal,
  Unary,
  Visitor,
  InvalidExpression,
  Variable,
  Assignment,
  Logical,
} from './Expression';

export class AstPrinter implements Visitor<string> {

  private parenthesize(name: string, ...exprs: Expression[]): string {
    return `(${name} ${exprs.map(this.print.bind(this)).join(' ')})`;
  }

  print(expr: Expression): string {
    return expr.accept(this);
  }

  Assignment(expr: Assignment): string {
    return `(= ${expr.name.lexeme} ${this.print(expr.value)})`;
  }
  
  Variable(expr: Variable): string {
    return expr.name.lexeme;
  }

  Binary(expr: Binary): string {
    return this.parenthesize(expr.operator.lexeme, expr.left, expr.right);
  }

  Logical(expr: Logical): string {
    return this.parenthesize(expr.operator.lexeme, expr.left, expr.right);
  }

  Grouping(expr: Grouping): string {
    return this.parenthesize('group', expr.expr);
  }

  Literal(expr: Literal): string {
    return expr.value != null ? JSON.stringify(expr.value) : 'nil';
  }

  Unary(expr: Unary): string {
    return this.parenthesize(expr.operator.lexeme, expr.right);
  }

  InvalidExpression(expr: InvalidExpression): string {
    return `<<Error: ${expr.message}>>`;
  }
}
