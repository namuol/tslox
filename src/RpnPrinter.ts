import {
  Expression,
  Binary,
  Grouping,
  Literal,
  Unary,
  Visitor,
  InvalidExpression,
} from './Expression';

/**
 * Implements Reverse Polish Notation (RPN) printing of expressions.
 */
export class RpnPrinter implements Visitor<string> {
  print(expr: Expression): string {
    return expr.accept(this);
  }

  Binary(expr: Binary): string {
    return [
      this.print(expr.left),
      this.print(expr.right),
      expr.operator.lexeme,
    ].join(' ');
  }

  Grouping(expr: Grouping): string {
    return this.print(expr.expr);
  }

  Literal(expr: Literal): string {
    return expr.value ? expr.value.toString() : 'nil';
  }

  Unary(expr: Unary): string {
    return [this.print(expr.right), expr.operator.lexeme].join(' ');
  }

  InvalidExpression(expr: InvalidExpression): string {
    return `<<Error: ${expr.message}>>`;
  }
}
