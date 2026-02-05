import { confirm, isCancel, password, select, text } from "@clack/prompts";

export type CommitDecision = "yes" | "no" | "edit";

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

export async function promptCommitDecision(
  question: string,
): Promise<CommitDecision | null> {
  if (!process.stdin.isTTY) {
    return null;
  }

  const response = await select({
    message: question,
    options: [
      { label: "Yes", value: "yes" },
      { label: "No", value: "no" },
      { label: "Edit", value: "edit" },
    ],
    initialValue: "yes",
  });

  if (isCancel(response)) {
    return null;
  }

  return response as CommitDecision;
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
