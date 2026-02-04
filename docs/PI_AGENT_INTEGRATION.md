## Pi Agent SDK Integration Guide

This document describes how to integrate the **Pi Agent SDK** into a CLI tool in a **product-agnostic** way. It focuses on **authentication**, **model selection**, and **session lifecycle**, plus recommended integration patterns for reliability and safety.

> Scope: Pi Agent SDK usage patterns only. No `lgtm`-specific paths, flags, file names, or internal conventions.

---

### 1) Goals

- Provide a clean integration blueprint for:
  - **Auth** (OAuth + API key)
  - **Models** (registry, selection, overrides)
  - **Sessions** (creation, usage, optional event logging)

- Enable a CLI tool to:
  - run a single or multi-step agent workflow
  - safely handle failures/retries
  - keep configuration flexible without hard-coding provider/model assumptions

### Non-goals

- Prescribing a specific product’s CLI UX or configuration schema
- Mandating a specific storage location or encryption approach
- Specifying internal repo/module organization

---

## 2) Core Concepts

### Auth Storage

Pi Agent SDK typically expects an **AuthStorage** abstraction responsible for:

- listing available auth-capable providers
- performing OAuth login flows (interactive)
- storing and retrieving credentials for providers
- (optionally) supporting API key credentials

Your app integrates by:

- instantiating AuthStorage
- calling login when needed
- passing AuthStorage into session creation so the SDK can attach credentials

### Model Registry

Model selection is mediated via a **ModelRegistry** that:

- aggregates available models by provider
- may load user-defined/custom model definitions (optional)
- provides an “available models” list for selection

Your app integrates by:

- constructing a ModelRegistry (often using AuthStorage)
- retrieving available models
- selecting a model (and optionally a “fast” vs “capable” pair)

### Agent Session

An **Agent Session** is the runtime object used to:

- prompt the model (“generate text / plan / summarize / classify”)
- execute tools (if enabled)
- subscribe to events (streaming tokens, tool calls, errors, etc.)

Your app integrates by:

- creating a session with auth + registry + model + tool set + working directory
- using the session to run prompts and tools
- optionally subscribing to events for logging/UI
- ending the process (some SDKs expose close/dispose; if not, lifecycle ends with the run)

---

## 3) Authentication Integration

### 3.1 Requirements

Your integration should support:

- **OAuth login** (interactive)
- **API key auth** (non-interactive or prompted)
- persistent reuse of credentials between runs

### 3.2 Recommended auth flow

#### A) Provider discovery

- List OAuth-capable providers from AuthStorage (if supported by SDK).
- Validate that the requested provider exists and supports OAuth.

#### B) OAuth login (interactive)

Use SDK-provided login method with callbacks such as:

- `onAuth`: show URL/instructions to user (open browser if appropriate)
- `onPrompt`: ask user for code or confirmation
- `onProgress`: show spinner/progress text

Key points:

- Keep the CLI output minimal and actionable.
- Avoid printing sensitive tokens (never echo secrets).
- Handle cancellation distinctly (exit code, clean messaging).

#### C) API key auth

Support a flow where user provides:

- provider id
- api key value (from env var, config, or secure prompt)

Store it using the SDK-supported mechanism (if available) or your own adapter that AuthStorage can read.

> If the SDK already supports API-key storage, prefer it. If not, implement a thin wrapper that writes credentials in a format the SDK can consume (or inject credentials into session creation via SDK-supported hooks).

### 3.3 Credential precedence (recommended)

When multiple sources exist:

1. CLI flags (explicit per-run)
2. environment variables
3. config file / persisted auth storage
4. interactive login (only if needed)

### 3.4 Security and logging

- Treat all credentials as secrets.
- Never log:
  - access tokens, refresh tokens, api keys
  - auth URLs containing secrets

- If you support verbose logging of session events, document that it may include sensitive content unless redaction is implemented.

---

## 4) Model Selection Integration

### 4.1 Requirements

Your tool should:

- enumerate available models (via registry)
- allow selecting provider + model via:
  - flags/env/config

- define safe defaults (fast + capable, or single model)
- validate that requested model exists

### 4.2 Model selection strategy (recommended)

#### A) Build candidate list

- Ask ModelRegistry for available models.
- If provider is specified:
  - filter to that provider (or provider alias set, if you support aliases)

- If model id is specified:
  - select exact match within candidates

- Else choose a default:
  - prefer known “capable” models first
  - fallback to first available model

#### B) Fast vs capable

Many CLI workflows benefit from:

- **fast model**: cheap/quick tasks (summaries, formatting, lint fixes)
- **capable model**: hard reasoning tasks (planning, complex synthesis)

Rules:

- If user specifies only one model: use it for both.
- If user specifies both: validate both exist.
- If user specifies “capable” only: fast defaults to capable.

#### C) Reasoning / thinking levels

If SDK supports “thinking levels” or reasoning settings:

- default “minimal” for fast
- select higher levels for capable based on model capabilities
- allow user override

> Keep the selection logic simple and transparent. Surface “what was selected and why” in verbose mode.

---

## 5) Session Lifecycle Integration

### 5.1 Session creation (recommended shape)

When creating a session, pass:

- auth storage
- model registry
- selected model
- thinking/reasoning level (optional)
- enabled tools set (if your workflow needs tool execution)
- working directory / context root (for tools)

### 5.2 Using sessions

Common usage patterns:

- `session.prompt(...)` for generation
- `session.getLastAssistantText()` for retrieving final text
- `session.executeBash(...)` or tool APIs if you allow command execution

### 5.3 Events and streaming

If SDK supports event subscription:

- subscribe for:
  - assistant deltas (streaming tokens)
  - tool calls / tool results
  - error events

- use it for:
  - CLI spinners / progress UI
  - debug logging

### 5.4 Persistence and resumption

Most CLI tools do **not** need to persist session state.
If you do:

- persist only what you truly need (e.g., conversation summary)
- avoid persisting full token streams by default
- treat persisted content as sensitive

### 5.5 Shutdown

If SDK provides explicit close/dispose:

- call it in `finally` blocks
- flush loggers and close file handles

---

## 6) Reliability Patterns

### 6.1 Retry policy

- Retries should be bounded (fixed max attempts).
- Distinguish:
  - transient errors (network, rate limits) → retry with backoff
  - permanent errors (auth invalid, model not found) → fail fast

### 6.2 Validation-first prompts

For structured outputs (e.g., “must be valid Conventional Commit format”):

- instruct model to produce strict format
- validate output
- if invalid: re-prompt with correction guidance (bounded retries)

### 6.3 Guardrails for tool execution

If enabling tools (e.g., bash execution):

- run commands with timeouts
- capture stdout/stderr
- never run destructive commands unless explicitly allowed
- provide a dry-run mode if possible

---

## 7) Observability

### 7.1 What to log

- session start/end (provider/model chosen)
- high-level events (prompt started, prompt finished, tool executed)
- failures with actionable messages (no secrets)

### 7.2 Debug logging

If you offer verbose mode:

- consider writing structured logs (JSONL)
- document what may be included (prompts/responses/tool inputs)
- optionally provide redaction hooks (recommended)

---

## 8) Minimal Integration Checklist

### Auth

- [ ] OAuth login command implemented
- [ ] API key configuration supported
- [ ] Credentials persisted and reused
- [ ] No secrets printed/logged

### Models

- [ ] ModelRegistry created and queried
- [ ] Provider/model selection validated
- [ ] Defaults chosen sensibly
- [ ] Optional fast/capable pair supported

### Sessions

- [ ] Sessions created with auth + model registry + model
- [ ] Prompts executed and results consumed safely
- [ ] Optional event subscription for UX/logging
- [ ] Clean shutdown (flush logs, close session if supported)

---

## 9) Example Integration Flow (text sequence)

```
User -> CLI
CLI -> AuthStorage (load existing credentials)
CLI -> ModelRegistry (load available models)
CLI -> Select model (validate availability)
CLI -> createAgentSession(authStorage, modelRegistry, model, tools, cwd)
Session -> prompt(...) / tools(...)
Session -> events (optional: streaming/logging)
CLI -> print result / perform action
CLI -> exit (cleanup)
```

---

If you want this as a stricter engineering artifact, I can rewrite it as:

- an **ADR-style** doc (“Decision: integrate Pi SDK via AuthStorage/ModelRegistry/session”)
- or a **spec** with explicit interfaces and required functions for your codebase (still without `lgtm`-isms).
