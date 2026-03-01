// bin/commands/convert.js
// Converts Mimo source to another language (JavaScript, Python, Alya, …).

import { runConverter } from '../../tools/convert.js';
import { c } from '../utils/colors.js';

export function help() {
    console.log(`
${c.bold('mimo convert')} — Transpile Mimo code to another language

${c.bold('Usage:')}
  mimo convert --in <file> --out <file> --to <target>

${c.bold('Options:')}
  --in <file>     Input .mimo file
  --out <file>    Output file path
  --to <target>   Target language: javascript, python, alya

${c.bold('Examples:')}
  mimo convert --in app.mimo --out app.js --to javascript
  mimo convert --in app.mimo --out app.py --to python
`);
}

export async function run(args) {
    await runConverter(args);
}
