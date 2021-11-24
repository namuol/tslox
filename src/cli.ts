#!/usr/bin/env node
import {docopt} from 'docopt';
import {promises as fs} from 'fs';
import {run} from './index';
import * as readline from 'readline';
import {print} from './LoxValue';

const usage = `
Usage: tslox [<script>]
`;

const {'<script>': script} = docopt(usage);

async function runFile(filename: string): Promise<void> {
  const source = await fs.readFile(filename, 'utf-8');
  await run(source, filename);
}

async function runPrompt() {
  console.log('TSLox (Ctrl-D to exit)');
  console.log('');

  const rl = readline.createInterface(process.stdin, process.stdout);
  const question = (prompt: string) =>
    new Promise<string>(resolve => {
      rl.question(prompt, answer => resolve(answer));
    });

  // eslint-disable-next-line no-constant-condition
  while (true) {
    const line = await question('> ');
    if (line.trim().length === 0) {
      continue;
    }
    const result = await run(line, '[tslox]');

    if (result.err) {
      for (const err of result.err) {
        const prefix = err.location
          ? `[${err.location.start.line}:${err.location.start.column}${
              err.location.end
                ? `-${err.location.end.line}:${err.location.end.column}`
                : ''
            }]: `
          : '';
        console.error(`${prefix}${err.message}`);
      }
    } else {
      console.log(print(result.val));
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
