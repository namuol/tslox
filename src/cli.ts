#!/usr/bin/env node
import {docopt} from 'docopt';
import {promises as fs} from 'fs';
import {run} from './index.js';
import * as readline from 'readline';

const usage = `
Usage: tslox [<script>]
`;

const {'<script>': script} = docopt(usage);

async function runFile(filePath: string): Promise<void> {
  const source = await fs.readFile(filePath, 'utf-8');
  await run(source);
}

async function runPrompt() {
  const rl = readline.createInterface(process.stdin, process.stdout);
  const question = (prompt: string) =>
    new Promise<string>(resolve => {
      rl.question(prompt, answer => resolve(answer));
    });

  while (true) {
    const line = await question('> ');
    await run(line);
  }
}

(async () => {
  if (script) {
    await runFile(script);
  } else {
    await runPrompt();
  }
})();
