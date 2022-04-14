import {Scanner} from './Scanner';

describe('Scanner', () => {
  it('handles very simple program', () => {
    const program = 'var language = "lox";';
    expect(new Scanner(program, 'test.lox').scanTokens())
      .toMatchInlineSnapshot(`
      Object {
        "val": Array [
          Token {
            "column": 4,
            "lexeme": "var",
            "line": 1,
            "type": "VAR",
          },
          Token {
            "column": 13,
            "lexeme": "language",
            "line": 1,
            "type": "IDENTIFIER",
          },
          Token {
            "column": 15,
            "lexeme": "=",
            "line": 1,
            "type": "EQUAL",
          },
          Token {
            "column": 21,
            "lexeme": "\\"lox\\"",
            "line": 1,
            "type": "STRING",
          },
          Token {
            "column": 22,
            "lexeme": ";",
            "line": 1,
            "type": "SEMICOLON",
          },
        ],
      }
    `);
  });

  it('handles comments', () => {
    const program = 'bacon(); // cool stuff';
    expect(new Scanner(program, 'test.lox').scanTokens())
      .toMatchInlineSnapshot(`
      Object {
        "val": Array [
          Token {
            "column": 6,
            "lexeme": "bacon",
            "line": 1,
            "type": "IDENTIFIER",
          },
          Token {
            "column": 7,
            "lexeme": "(",
            "line": 1,
            "type": "LEFT_PAREN",
          },
          Token {
            "column": 8,
            "lexeme": ")",
            "line": 1,
            "type": "RIGHT_PAREN",
          },
          Token {
            "column": 9,
            "lexeme": ";",
            "line": 1,
            "type": "SEMICOLON",
          },
        ],
      }
    `);
  });

  it('handles block comments', () => {
    const program = 'var language /* pretty nifty */ = "lox";';
    expect(new Scanner(program, 'test.lox').scanTokens())
      .toMatchInlineSnapshot(`
      Object {
        "val": Array [
          Token {
            "column": 4,
            "lexeme": "var",
            "line": 1,
            "type": "VAR",
          },
          Token {
            "column": 13,
            "lexeme": "language",
            "line": 1,
            "type": "IDENTIFIER",
          },
          Token {
            "column": 33,
            "lexeme": "=",
            "line": 1,
            "type": "EQUAL",
          },
          Token {
            "column": 39,
            "lexeme": "\\"lox\\"",
            "line": 1,
            "type": "STRING",
          },
          Token {
            "column": 40,
            "lexeme": ";",
            "line": 1,
            "type": "SEMICOLON",
          },
        ],
      }
    `);
  });

  it('handles multiline program', () => {
    const program = [
      'class Foo < Bar {',
      '  whatever() {',
      '    var hello = "hi";',
      '    doStuff(hello);',
      '    return 42;',
      '  }',
      '',
      '  no() {',
      '    this.whatever();',
      '  }',
      '}',
    ].join('\n');
    expect(new Scanner(program, 'test.lox').scanTokens())
      .toMatchInlineSnapshot(`
      Object {
        "val": Array [
          Token {
            "column": 6,
            "lexeme": "class",
            "line": 1,
            "type": "CLASS",
          },
          Token {
            "column": 10,
            "lexeme": "Foo",
            "line": 1,
            "type": "IDENTIFIER",
          },
          Token {
            "column": 12,
            "lexeme": "<",
            "line": 1,
            "type": "LESS",
          },
          Token {
            "column": 16,
            "lexeme": "Bar",
            "line": 1,
            "type": "IDENTIFIER",
          },
          Token {
            "column": 18,
            "lexeme": "{",
            "line": 1,
            "type": "LEFT_BRACE",
          },
          Token {
            "column": 11,
            "lexeme": "whatever",
            "line": 2,
            "type": "IDENTIFIER",
          },
          Token {
            "column": 12,
            "lexeme": "(",
            "line": 2,
            "type": "LEFT_PAREN",
          },
          Token {
            "column": 13,
            "lexeme": ")",
            "line": 2,
            "type": "RIGHT_PAREN",
          },
          Token {
            "column": 15,
            "lexeme": "{",
            "line": 2,
            "type": "LEFT_BRACE",
          },
          Token {
            "column": 8,
            "lexeme": "var",
            "line": 3,
            "type": "VAR",
          },
          Token {
            "column": 14,
            "lexeme": "hello",
            "line": 3,
            "type": "IDENTIFIER",
          },
          Token {
            "column": 16,
            "lexeme": "=",
            "line": 3,
            "type": "EQUAL",
          },
          Token {
            "column": 21,
            "lexeme": "\\"hi\\"",
            "line": 3,
            "type": "STRING",
          },
          Token {
            "column": 22,
            "lexeme": ";",
            "line": 3,
            "type": "SEMICOLON",
          },
          Token {
            "column": 12,
            "lexeme": "doStuff",
            "line": 4,
            "type": "IDENTIFIER",
          },
          Token {
            "column": 13,
            "lexeme": "(",
            "line": 4,
            "type": "LEFT_PAREN",
          },
          Token {
            "column": 18,
            "lexeme": "hello",
            "line": 4,
            "type": "IDENTIFIER",
          },
          Token {
            "column": 19,
            "lexeme": ")",
            "line": 4,
            "type": "RIGHT_PAREN",
          },
          Token {
            "column": 20,
            "lexeme": ";",
            "line": 4,
            "type": "SEMICOLON",
          },
          Token {
            "column": 11,
            "lexeme": "return",
            "line": 5,
            "type": "RETURN",
          },
          Token {
            "column": 14,
            "lexeme": "42",
            "line": 5,
            "type": "NUMBER",
          },
          Token {
            "column": 15,
            "lexeme": ";",
            "line": 5,
            "type": "SEMICOLON",
          },
          Token {
            "column": 4,
            "lexeme": "}",
            "line": 6,
            "type": "RIGHT_BRACE",
          },
          Token {
            "column": 5,
            "lexeme": "no",
            "line": 8,
            "type": "IDENTIFIER",
          },
          Token {
            "column": 6,
            "lexeme": "(",
            "line": 8,
            "type": "LEFT_PAREN",
          },
          Token {
            "column": 7,
            "lexeme": ")",
            "line": 8,
            "type": "RIGHT_PAREN",
          },
          Token {
            "column": 9,
            "lexeme": "{",
            "line": 8,
            "type": "LEFT_BRACE",
          },
          Token {
            "column": 9,
            "lexeme": "this",
            "line": 9,
            "type": "THIS",
          },
          Token {
            "column": 10,
            "lexeme": ".",
            "line": 9,
            "type": "DOT",
          },
          Token {
            "column": 18,
            "lexeme": "whatever",
            "line": 9,
            "type": "IDENTIFIER",
          },
          Token {
            "column": 19,
            "lexeme": "(",
            "line": 9,
            "type": "LEFT_PAREN",
          },
          Token {
            "column": 20,
            "lexeme": ")",
            "line": 9,
            "type": "RIGHT_PAREN",
          },
          Token {
            "column": 21,
            "lexeme": ";",
            "line": 9,
            "type": "SEMICOLON",
          },
          Token {
            "column": 4,
            "lexeme": "}",
            "line": 10,
            "type": "RIGHT_BRACE",
          },
          Token {
            "column": 2,
            "lexeme": "}",
            "line": 11,
            "type": "RIGHT_BRACE",
          },
        ],
      }
    `);
  });

  it('catches unexpected tokens', () => {
    const program = ['a b c % $ ^ &', 'a b c % $ ^ &'].join('\n');
    expect(new Scanner(program, 'test.lox').scanTokens())
      .toMatchInlineSnapshot(`
      Object {
        "err": Array [
          ScannerError {
            "location": Object {
              "end": Object {
                "column": 8,
                "line": 1,
              },
              "filename": "test.lox",
              "start": Object {
                "column": 7,
                "line": 1,
              },
            },
            "message": "Unexpected character: '%'",
          },
          ScannerError {
            "location": Object {
              "end": Object {
                "column": 10,
                "line": 1,
              },
              "filename": "test.lox",
              "start": Object {
                "column": 9,
                "line": 1,
              },
            },
            "message": "Unexpected character: '$'",
          },
          ScannerError {
            "location": Object {
              "end": Object {
                "column": 12,
                "line": 1,
              },
              "filename": "test.lox",
              "start": Object {
                "column": 11,
                "line": 1,
              },
            },
            "message": "Unexpected character: '^'",
          },
          ScannerError {
            "location": Object {
              "end": Object {
                "column": 14,
                "line": 1,
              },
              "filename": "test.lox",
              "start": Object {
                "column": 13,
                "line": 1,
              },
            },
            "message": "Unexpected character: '&'",
          },
          ScannerError {
            "location": Object {
              "end": Object {
                "column": 8,
                "line": 2,
              },
              "filename": "test.lox",
              "start": Object {
                "column": 7,
                "line": 2,
              },
            },
            "message": "Unexpected character: '%'",
          },
          ScannerError {
            "location": Object {
              "end": Object {
                "column": 10,
                "line": 2,
              },
              "filename": "test.lox",
              "start": Object {
                "column": 9,
                "line": 2,
              },
            },
            "message": "Unexpected character: '$'",
          },
          ScannerError {
            "location": Object {
              "end": Object {
                "column": 12,
                "line": 2,
              },
              "filename": "test.lox",
              "start": Object {
                "column": 11,
                "line": 2,
              },
            },
            "message": "Unexpected character: '^'",
          },
          ScannerError {
            "location": Object {
              "end": Object {
                "column": 14,
                "line": 2,
              },
              "filename": "test.lox",
              "start": Object {
                "column": 13,
                "line": 2,
              },
            },
            "message": "Unexpected character: '&'",
          },
        ],
      }
    `);
  });
});
