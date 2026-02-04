import { confirm, isCancel, password, text } from "@clack/prompts";

export async function promptConfirm(question: string): Promise<boolean> {
  if (!process.stdin.isTTY) {
    return false;
  }

  const response = await confirm({
    message: question,
    initialValue: false,
  });

  if (isCancel(response)) {
    return false;
  }

  return response;
}

export async function promptSecret(question: string): Promise<string | null> {
  if (!process.stdin.isTTY) {
    return null;
  }

  const response = await password({ message: question });
  if (isCancel(response)) {
    return null;
  }

  const trimmed = response.trim();
  return trimmed.length > 0 ? trimmed : null;
}

export async function promptInput(
  question: string,
  allowEmpty = false,
): Promise<string | null> {
  if (!process.stdin.isTTY) {
    return null;
  }

  const response = await text({
    message: question,
    validate: allowEmpty
      ? undefined
      : (value: string | undefined) =>
          value && value.trim().length > 0 ? undefined : "Value is required.",
  });

  if (isCancel(response)) {
    return null;
  }

  const trimmed = response.trim();
  if (!allowEmpty && trimmed.length === 0) {
    return null;
  }

  return trimmed;
}
