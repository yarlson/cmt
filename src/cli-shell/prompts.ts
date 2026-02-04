import readline from "node:readline";
import { Writable } from "node:stream";

class MutedOutput extends Writable {
  _write(
    _chunk: Buffer,
    _encoding: BufferEncoding,
    callback: () => void,
  ): void {
    callback();
  }
}

export async function promptConfirm(question: string): Promise<boolean> {
  if (!process.stdin.isTTY) {
    return false;
  }

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return await new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      const normalized = answer.trim().toLowerCase();
      resolve(normalized === "y" || normalized === "yes");
    });
  });
}

export async function promptSecret(question: string): Promise<string | null> {
  if (!process.stdin.isTTY) {
    return null;
  }

  process.stdout.write(question);
  const rl = readline.createInterface({
    input: process.stdin,
    output: new MutedOutput(),
    terminal: true,
  });

  return await new Promise((resolve) => {
    rl.question("", (answer) => {
      rl.close();
      process.stdout.write("\n");
      const trimmed = answer.trim();
      resolve(trimmed.length > 0 ? trimmed : null);
    });
  });
}

export async function promptInput(
  question: string,
  allowEmpty = false,
): Promise<string | null> {
  if (!process.stdin.isTTY) {
    return null;
  }

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return await new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      const trimmed = answer.trim();
      if (!allowEmpty && trimmed.length === 0) {
        resolve(null);
      } else {
        resolve(trimmed);
      }
    });
  });
}
