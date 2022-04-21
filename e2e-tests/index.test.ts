import {exec} from 'child_process';
import path from 'path';

const execute = (command: string) =>
  new Promise((resolve, reject) => {
    exec(command, (err, stdout, stderr) => {
      if (err) {
        reject(err);
        return;
      }

      resolve({stdout, stderr});
    });
  });

type Cases = {[filename: string]: {stdout: string; stderr: string}};

const cases: Cases = {
  'hello_world.lox': {
    stdout: 'Hello, world!!\n',
    stderr: '',
  },
  'lambda.lox': {
    stdout: ['hi', 'okay', '42', ''].join('\n'),
    stderr: '',
  },
};

describe('end-to-end CLI tests', () => {
  for (const filename of Object.keys(cases)) {
    it(filename, async () => {
      const result = await execute(
        `node lib/cli.js ${path.join(__dirname, filename)}`
      );
      expect(result).toEqual(cases[filename]);
    });
  }
});
