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
  Call,
  Fun,
} from './Expression';

/**
 * Implements Reverse Polish Notation (RPN) printing of expressions.
 */
export class RpnPrinter implements Visitor<string> {
  print = (expr: Expression): string => {
    return expr.accept(this);
  };

  Assignment(expr: Assignment): string {
    return [expr.name.lexeme, this.print(expr.value), '='].join(' ');
  }

  Variable(expr: Variable): string {
    return expr.name.lexeme;
  }

  Binary(expr: Binary): string {
    return [
      this.print(expr.left),
      this.print(expr.right),
      expr.operator.lexeme,
    ].join(' ');
  }

  Logical(expr: Logical): string {
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

  Call(expr: Call): string {
    return [expr.args.map(this.print), `call::${this.print(expr.callee)}`].join(
      ' '
    );
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  Fun(expr: Fun): string {
    return 'fun';
  }
}
