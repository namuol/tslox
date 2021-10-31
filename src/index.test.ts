import {Scanner} from './index';

describe('Scanner', () => {
  it('constructor', () => {
    new Scanner('var language = "lox";', 'test.lox');
  });

  it('scanTokens', () => {
    expect(new Scanner('var language = "lox";', 'test.lox').scanTokens())
      .toMatchInlineSnapshot(`
      Object {
        "err": Array [
          ScannerError {
            "location": Object {
              "end": undefined,
              "filename": "test.lox",
              "start": Object {
                "column": 1,
                "line": 1,
              },
            },
            "message": "Unexpected character: 'v'",
          },
          ScannerError {
            "location": Object {
              "end": undefined,
              "filename": "test.lox",
              "start": Object {
                "column": 1,
                "line": 1,
              },
            },
            "message": "Unexpected character: 'a'",
          },
          ScannerError {
            "location": Object {
              "end": undefined,
              "filename": "test.lox",
              "start": Object {
                "column": 1,
                "line": 1,
              },
            },
            "message": "Unexpected character: 'r'",
          },
          ScannerError {
            "location": Object {
              "end": undefined,
              "filename": "test.lox",
              "start": Object {
                "column": 1,
                "line": 1,
              },
            },
            "message": "Unexpected character: ' '",
          },
          ScannerError {
            "location": Object {
              "end": undefined,
              "filename": "test.lox",
              "start": Object {
                "column": 1,
                "line": 1,
              },
            },
            "message": "Unexpected character: 'l'",
          },
          ScannerError {
            "location": Object {
              "end": undefined,
              "filename": "test.lox",
              "start": Object {
                "column": 1,
                "line": 1,
              },
            },
            "message": "Unexpected character: 'a'",
          },
          ScannerError {
            "location": Object {
              "end": undefined,
              "filename": "test.lox",
              "start": Object {
                "column": 1,
                "line": 1,
              },
            },
            "message": "Unexpected character: 'n'",
          },
          ScannerError {
            "location": Object {
              "end": undefined,
              "filename": "test.lox",
              "start": Object {
                "column": 1,
                "line": 1,
              },
            },
            "message": "Unexpected character: 'g'",
          },
          ScannerError {
            "location": Object {
              "end": undefined,
              "filename": "test.lox",
              "start": Object {
                "column": 1,
                "line": 1,
              },
            },
            "message": "Unexpected character: 'u'",
          },
          ScannerError {
            "location": Object {
              "end": undefined,
              "filename": "test.lox",
              "start": Object {
                "column": 1,
                "line": 1,
              },
            },
            "message": "Unexpected character: 'a'",
          },
          ScannerError {
            "location": Object {
              "end": undefined,
              "filename": "test.lox",
              "start": Object {
                "column": 1,
                "line": 1,
              },
            },
            "message": "Unexpected character: 'g'",
          },
          ScannerError {
            "location": Object {
              "end": undefined,
              "filename": "test.lox",
              "start": Object {
                "column": 1,
                "line": 1,
              },
            },
            "message": "Unexpected character: 'e'",
          },
          ScannerError {
            "location": Object {
              "end": undefined,
              "filename": "test.lox",
              "start": Object {
                "column": 1,
                "line": 1,
              },
            },
            "message": "Unexpected character: ' '",
          },
          ScannerError {
            "location": Object {
              "end": undefined,
              "filename": "test.lox",
              "start": Object {
                "column": 1,
                "line": 1,
              },
            },
            "message": "Unexpected character: ' '",
          },
          ScannerError {
            "location": Object {
              "end": undefined,
              "filename": "test.lox",
              "start": Object {
                "column": 1,
                "line": 1,
              },
            },
            "message": "Unexpected character: '\\"'",
          },
          ScannerError {
            "location": Object {
              "end": undefined,
              "filename": "test.lox",
              "start": Object {
                "column": 1,
                "line": 1,
              },
            },
            "message": "Unexpected character: 'l'",
          },
          ScannerError {
            "location": Object {
              "end": undefined,
              "filename": "test.lox",
              "start": Object {
                "column": 1,
                "line": 1,
              },
            },
            "message": "Unexpected character: 'o'",
          },
          ScannerError {
            "location": Object {
              "end": undefined,
              "filename": "test.lox",
              "start": Object {
                "column": 1,
                "line": 1,
              },
            },
            "message": "Unexpected character: 'x'",
          },
          ScannerError {
            "location": Object {
              "end": undefined,
              "filename": "test.lox",
              "start": Object {
                "column": 1,
                "line": 1,
              },
            },
            "message": "Unexpected character: '\\"'",
          },
        ],
      }
    `);
  });
});
