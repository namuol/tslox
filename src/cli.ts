#!/usr/bin/env node
import {docopt} from 'docopt';
import {promises as fs} from 'fs';
import {run} from './index';
import * as readline from 'readline';

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
    const {err: errors} = await run(line, '[tslox]');

    if (errors) {
      for (const err of errors) {
        const prefix = err.location
          ? `[${err.location.start.line}:${err.location.start.column}${
              err.location.end
                ? `-${err.location.end.line}:${err.location.end.column}`
                : ''
            }]: `
          : '';
        console.error(`${prefix}${err.message}`);
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
