#!/usr/bin/env node
import {docopt} from 'docopt';
import {promises as fs} from 'fs';
import * as readline from 'readline';
import {Interpreter} from './Interpreter';
import {Lox} from './Lox';
import {print} from './LoxValue';

const usage = `
Usage: tslox [<script>]
`;

const {'<script>': script} = docopt(usage);

async function runFile(filename: string): Promise<void> {
  const source = await fs.readFile(filename, 'utf-8');
  await Lox.run(source, filename);
}

async function runPrompt() {
  console.log('TSLox (Ctrl-D to exit)');
  console.log('');

  const rl = readline.createInterface(process.stdin, process.stdout);
  const question = (prompt: string) =>
    new Promise<string>(resolve => {
      rl.question(prompt, answer => resolve(answer));
    });

  const filename = '[tslox]';
  const lox = new Lox(filename);

  // eslint-disable-next-line no-constant-condition
  while (true) {
    const line = await question('> ');
    if (line.trim().length === 0) {
      continue;
    }

    const result = await lox.eval(line);
    if (result.err) {
      for (const err of result.err) {
        const location = err.getLocation ? err.getLocation(filename) : null;
        const prefix = location
          ? `[${location.start.line}:${location.start.column}${
              location.end ? `-${location.end.line}:${location.end.column}` : ''
            }]: `
          : '';
        console.error(`${prefix}${err.message}`);
      }
    } else {
      if (result.val !== undefined) {
        console.log(`(${print(result.val)})`);
      }
    }
  }
}

(async () => {
  if (script) {
    await runFile(script);
  } else {
    await runPrompt();
  }
})();
