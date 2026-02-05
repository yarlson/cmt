# Providers and Models

## Table of contents

- [Providers](#providers)
- [Models by provider](#models-by-provider)
  - [amazon-bedrock](#amazon-bedrock)
  - [anthropic](#anthropic)
  - [azure-openai-responses](#azure-openai-responses)
  - [cerebras](#cerebras)
  - [github-copilot](#github-copilot)
  - [google](#google)
  - [google-antigravity](#google-antigravity)
  - [google-gemini-cli](#google-gemini-cli)
  - [google-vertex](#google-vertex)
  - [groq](#groq)
  - [huggingface](#huggingface)
  - [kimi-coding](#kimi-coding)
  - [minimax](#minimax)
  - [minimax-cn](#minimax-cn)
  - [mistral](#mistral)
  - [openai](#openai)
  - [openai-codex](#openai-codex)
  - [opencode](#opencode)
  - [openrouter](#openrouter)
  - [vercel-ai-gateway](#vercel-ai-gateway)
  - [xai](#xai)
  - [zai](#zai)

## Providers

| provider | name | oauth | models |
| --- | --- | --- | --- |
| amazon-bedrock | - | no | 60 |
| anthropic | Anthropic (Claude Pro/Max) | yes | 21 |
| azure-openai-responses | - | no | 34 |
| cerebras | - | no | 3 |
| github-copilot | GitHub Copilot | yes | 18 |
| google | - | no | 21 |
| google-antigravity | Antigravity (Gemini 3, Claude, GPT-OSS) | yes | 7 |
| google-gemini-cli | Google Cloud Code Assist (Gemini CLI) | yes | 5 |
| google-vertex | - | no | 11 |
| groq | - | no | 15 |
| huggingface | - | no | 14 |
| kimi-coding | - | no | 2 |
| minimax | - | no | 2 |
| minimax-cn | - | no | 2 |
| mistral | - | no | 25 |
| openai | - | no | 34 |
| openai-codex | ChatGPT Plus/Pro (Codex Subscription) | yes | 5 |
| opencode | - | no | 29 |
| openrouter | - | no | 231 |
| vercel-ai-gateway | - | no | 123 |
| xai | - | no | 22 |
| zai | - | no | 8 |

## Models by provider

### amazon-bedrock

| model | context | max-out | thinking | images |
| --- | --- | --- | --- | --- |
| amazon.nova-lite-v1:0 | 300K | 8.2K | no | yes |
| amazon.nova-micro-v1:0 | 128K | 8.2K | no | no |
| amazon.nova-pro-v1:0 | 300K | 8.2K | no | yes |
| anthropic.claude-3-5-haiku-20241022-v1:0 | 200K | 8.2K | no | yes |
| anthropic.claude-3-5-sonnet-20240620-v1:0 | 200K | 8.2K | no | yes |
| anthropic.claude-3-5-sonnet-20241022-v2:0 | 200K | 8.2K | no | yes |
| anthropic.claude-3-haiku-20240307-v1:0 | 200K | 4.1K | no | yes |
| anthropic.claude-3-opus-20240229-v1:0 | 200K | 4.1K | no | yes |
| anthropic.claude-3-sonnet-20240229-v1:0 | 200K | 4.1K | no | yes |
| cohere.command-r-plus-v1:0 | 128K | 4.1K | no | no |
| cohere.command-r-v1:0 | 128K | 4.1K | no | no |
| deepseek.v3-v1:0 | 163.8K | 81.9K | yes | no |
| eu.anthropic.claude-haiku-4-5-20251001-v1:0 | 200K | 64K | yes | yes |
| eu.anthropic.claude-opus-4-5-20251101-v1:0 | 200K | 64K | yes | yes |
| eu.anthropic.claude-sonnet-4-20250514-v1:0 | 200K | 64K | yes | yes |
| eu.anthropic.claude-sonnet-4-5-20250929-v1:0 | 200K | 64K | yes | yes |
| global.anthropic.claude-haiku-4-5-20251001-v1:0 | 200K | 64K | yes | yes |
| global.anthropic.claude-opus-4-5-20251101-v1:0 | 200K | 64K | yes | yes |
| global.anthropic.claude-sonnet-4-20250514-v1:0 | 200K | 64K | yes | yes |
| global.anthropic.claude-sonnet-4-5-20250929-v1:0 | 200K | 64K | yes | yes |
| google.gemma-3-27b-it | 202.8K | 8.2K | no | yes |
| google.gemma-3-4b-it | 128K | 4.1K | no | yes |
| meta.llama3-1-70b-instruct-v1:0 | 128K | 4.1K | no | no |
| meta.llama3-1-8b-instruct-v1:0 | 128K | 4.1K | no | no |
| minimax.minimax-m2 | 204.6K | 128K | yes | no |
| mistral.ministral-3-14b-instruct | 128K | 4.1K | no | no |
| mistral.ministral-3-8b-instruct | 128K | 4.1K | no | no |
| mistral.mistral-large-2402-v1:0 | 128K | 4.1K | no | no |
| mistral.voxtral-mini-3b-2507 | 128K | 4.1K | no | no |
| mistral.voxtral-small-24b-2507 | 32K | 8.2K | no | no |
| moonshot.kimi-k2-thinking | 256K | 256K | yes | no |
| nvidia.nemotron-nano-12b-v2 | 128K | 4.1K | no | yes |
| nvidia.nemotron-nano-9b-v2 | 128K | 4.1K | no | no |
| openai.gpt-oss-120b-1:0 | 128K | 4.1K | no | no |
| openai.gpt-oss-20b-1:0 | 128K | 4.1K | no | no |
| openai.gpt-oss-safeguard-120b | 128K | 4.1K | no | no |
| openai.gpt-oss-safeguard-20b | 128K | 4.1K | no | no |
| qwen.qwen3-235b-a22b-2507-v1:0 | 262.1K | 131.1K | no | no |
| qwen.qwen3-32b-v1:0 | 16.4K | 16.4K | yes | no |
| qwen.qwen3-coder-30b-a3b-v1:0 | 262.1K | 131.1K | no | no |
| qwen.qwen3-coder-480b-a35b-v1:0 | 131.1K | 65.5K | no | no |
| qwen.qwen3-next-80b-a3b | 262K | 262K | no | no |
| qwen.qwen3-vl-235b-a22b | 262K | 262K | no | yes |
| us.amazon.nova-2-lite-v1:0 | 128K | 4.1K | no | yes |
| us.amazon.nova-premier-v1:0 | 1M | 16.4K | yes | yes |
| us.anthropic.claude-3-7-sonnet-20250219-v1:0 | 200K | 8.2K | no | yes |
| us.anthropic.claude-haiku-4-5-20251001-v1:0 | 200K | 64K | yes | yes |
| us.anthropic.claude-opus-4-1-20250805-v1:0 | 200K | 32K | yes | yes |
| us.anthropic.claude-opus-4-20250514-v1:0 | 200K | 32K | yes | yes |
| us.anthropic.claude-opus-4-5-20251101-v1:0 | 200K | 64K | yes | yes |
| us.anthropic.claude-sonnet-4-20250514-v1:0 | 200K | 64K | yes | yes |
| us.anthropic.claude-sonnet-4-5-20250929-v1:0 | 200K | 64K | yes | yes |
| us.deepseek.r1-v1:0 | 128K | 32.8K | yes | no |
| us.meta.llama3-2-11b-instruct-v1:0 | 128K | 4.1K | no | yes |
| us.meta.llama3-2-1b-instruct-v1:0 | 131K | 4.1K | no | no |
| us.meta.llama3-2-3b-instruct-v1:0 | 131K | 4.1K | no | no |
| us.meta.llama3-2-90b-instruct-v1:0 | 128K | 4.1K | no | yes |
| us.meta.llama3-3-70b-instruct-v1:0 | 128K | 4.1K | no | no |
| us.meta.llama4-maverick-17b-instruct-v1:0 | 1M | 16.4K | no | yes |
| us.meta.llama4-scout-17b-instruct-v1:0 | 3.5M | 16.4K | no | yes |

### anthropic

| model | context | max-out | thinking | images |
| --- | --- | --- | --- | --- |
| claude-3-5-haiku-20241022 | 200K | 8.2K | no | yes |
| claude-3-5-haiku-latest | 200K | 8.2K | no | yes |
| claude-3-5-sonnet-20240620 | 200K | 8.2K | no | yes |
| claude-3-5-sonnet-20241022 | 200K | 8.2K | no | yes |
| claude-3-7-sonnet-20250219 | 200K | 64K | yes | yes |
| claude-3-7-sonnet-latest | 200K | 64K | yes | yes |
| claude-3-haiku-20240307 | 200K | 4.1K | no | yes |
| claude-3-opus-20240229 | 200K | 4.1K | no | yes |
| claude-3-sonnet-20240229 | 200K | 4.1K | no | yes |
| claude-haiku-4-5 | 200K | 64K | yes | yes |
| claude-haiku-4-5-20251001 | 200K | 64K | yes | yes |
| claude-opus-4-0 | 200K | 32K | yes | yes |
| claude-opus-4-1 | 200K | 32K | yes | yes |
| claude-opus-4-1-20250805 | 200K | 32K | yes | yes |
| claude-opus-4-20250514 | 200K | 32K | yes | yes |
| claude-opus-4-5 | 200K | 64K | yes | yes |
| claude-opus-4-5-20251101 | 200K | 64K | yes | yes |
| claude-sonnet-4-0 | 200K | 64K | yes | yes |
| claude-sonnet-4-20250514 | 200K | 64K | yes | yes |
| claude-sonnet-4-5 | 200K | 64K | yes | yes |
| claude-sonnet-4-5-20250929 | 200K | 64K | yes | yes |

### azure-openai-responses

| model | context | max-out | thinking | images |
| --- | --- | --- | --- | --- |
| codex-mini-latest | 200K | 100K | yes | no |
| gpt-4 | 8.2K | 8.2K | no | no |
| gpt-4-turbo | 128K | 4.1K | no | yes |
| gpt-4.1 | 1.0M | 32.8K | no | yes |
| gpt-4.1-mini | 1.0M | 32.8K | no | yes |
| gpt-4.1-nano | 1.0M | 32.8K | no | yes |
| gpt-4o | 128K | 16.4K | no | yes |
| gpt-4o-2024-05-13 | 128K | 4.1K | no | yes |
| gpt-4o-2024-08-06 | 128K | 16.4K | no | yes |
| gpt-4o-2024-11-20 | 128K | 16.4K | no | yes |
| gpt-4o-mini | 128K | 16.4K | no | yes |
| gpt-5 | 400K | 128K | yes | yes |
| gpt-5-chat-latest | 128K | 16.4K | no | yes |
| gpt-5-codex | 400K | 128K | yes | yes |
| gpt-5-mini | 400K | 128K | yes | yes |
| gpt-5-nano | 400K | 128K | yes | yes |
| gpt-5-pro | 400K | 272K | yes | yes |
| gpt-5.1 | 400K | 128K | yes | yes |
| gpt-5.1-chat-latest | 128K | 16.4K | yes | yes |
| gpt-5.1-codex | 400K | 128K | yes | yes |
| gpt-5.1-codex-max | 400K | 128K | yes | yes |
| gpt-5.1-codex-mini | 400K | 128K | yes | yes |
| gpt-5.2 | 400K | 128K | yes | yes |
| gpt-5.2-chat-latest | 128K | 16.4K | yes | yes |
| gpt-5.2-codex | 400K | 128K | yes | yes |
| gpt-5.2-pro | 400K | 128K | yes | yes |
| o1 | 200K | 100K | yes | yes |
| o1-pro | 200K | 100K | yes | yes |
| o3 | 200K | 100K | yes | yes |
| o3-deep-research | 200K | 100K | yes | yes |
| o3-mini | 200K | 100K | yes | no |
| o3-pro | 200K | 100K | yes | yes |
| o4-mini | 200K | 100K | yes | yes |
| o4-mini-deep-research | 200K | 100K | yes | yes |

### cerebras

| model | context | max-out | thinking | images |
| --- | --- | --- | --- | --- |
| gpt-oss-120b | 131.1K | 32.8K | yes | no |
| qwen-3-235b-a22b-instruct-2507 | 131K | 32K | no | no |
| zai-glm-4.7 | 131.1K | 40K | no | no |

### github-copilot

| model | context | max-out | thinking | images |
| --- | --- | --- | --- | --- |
| claude-haiku-4.5 | 128K | 16K | yes | yes |
| claude-opus-4.5 | 128K | 16K | yes | yes |
| claude-sonnet-4 | 128K | 16K | yes | yes |
| claude-sonnet-4.5 | 128K | 16K | yes | yes |
| gemini-2.5-pro | 128K | 64K | no | yes |
| gemini-3-flash-preview | 128K | 64K | yes | yes |
| gemini-3-pro-preview | 128K | 64K | yes | yes |
| gpt-4.1 | 128K | 16.4K | no | yes |
| gpt-4o | 64K | 16.4K | no | yes |
| gpt-5 | 128K | 128K | yes | yes |
| gpt-5-mini | 128K | 64K | yes | yes |
| gpt-5.1 | 128K | 128K | yes | yes |
| gpt-5.1-codex | 128K | 128K | yes | yes |
| gpt-5.1-codex-max | 128K | 128K | yes | yes |
| gpt-5.1-codex-mini | 128K | 100K | yes | yes |
| gpt-5.2 | 128K | 64K | yes | yes |
| gpt-5.2-codex | 272K | 128K | yes | yes |
| grok-code-fast-1 | 128K | 64K | yes | no |

### google

| model | context | max-out | thinking | images |
| --- | --- | --- | --- | --- |
| gemini-1.5-flash | 1M | 8.2K | no | yes |
| gemini-1.5-flash-8b | 1M | 8.2K | no | yes |
| gemini-1.5-pro | 1M | 8.2K | no | yes |
| gemini-2.0-flash | 1.0M | 8.2K | no | yes |
| gemini-2.0-flash-lite | 1.0M | 8.2K | no | yes |
| gemini-2.5-flash | 1.0M | 65.5K | yes | yes |
| gemini-2.5-flash-lite | 1.0M | 65.5K | yes | yes |
| gemini-2.5-flash-lite-preview-06-17 | 1.0M | 65.5K | yes | yes |
| gemini-2.5-flash-lite-preview-09-2025 | 1.0M | 65.5K | yes | yes |
| gemini-2.5-flash-preview-04-17 | 1.0M | 65.5K | yes | yes |
| gemini-2.5-flash-preview-05-20 | 1.0M | 65.5K | yes | yes |
| gemini-2.5-flash-preview-09-2025 | 1.0M | 65.5K | yes | yes |
| gemini-2.5-pro | 1.0M | 65.5K | yes | yes |
| gemini-2.5-pro-preview-05-06 | 1.0M | 65.5K | yes | yes |
| gemini-2.5-pro-preview-06-05 | 1.0M | 65.5K | yes | yes |
| gemini-3-flash-preview | 1.0M | 65.5K | yes | yes |
| gemini-3-pro-preview | 1M | 64K | yes | yes |
| gemini-flash-latest | 1.0M | 65.5K | yes | yes |
| gemini-flash-lite-latest | 1.0M | 65.5K | yes | yes |
| gemini-live-2.5-flash | 128K | 8K | yes | yes |
| gemini-live-2.5-flash-preview-native-audio | 131.1K | 65.5K | yes | no |

### google-antigravity

| model | context | max-out | thinking | images |
| --- | --- | --- | --- | --- |
| claude-opus-4-5-thinking | 200K | 64K | yes | yes |
| claude-sonnet-4-5 | 200K | 64K | no | yes |
| claude-sonnet-4-5-thinking | 200K | 64K | yes | yes |
| gemini-3-flash | 1.0M | 65.5K | yes | yes |
| gemini-3-pro-high | 1.0M | 65.5K | yes | yes |
| gemini-3-pro-low | 1.0M | 65.5K | yes | yes |
| gpt-oss-120b-medium | 131.1K | 32.8K | no | no |

### google-gemini-cli

| model | context | max-out | thinking | images |
| --- | --- | --- | --- | --- |
| gemini-2.0-flash | 1.0M | 8.2K | no | yes |
| gemini-2.5-flash | 1.0M | 65.5K | yes | yes |
| gemini-2.5-pro | 1.0M | 65.5K | yes | yes |
| gemini-3-flash-preview | 1.0M | 65.5K | yes | yes |
| gemini-3-pro-preview | 1.0M | 65.5K | yes | yes |

### google-vertex

| model | context | max-out | thinking | images |
| --- | --- | --- | --- | --- |
| gemini-1.5-flash | 1M | 8.2K | no | yes |
| gemini-1.5-flash-8b | 1M | 8.2K | no | yes |
| gemini-1.5-pro | 1M | 8.2K | no | yes |
| gemini-2.0-flash | 1.0M | 8.2K | no | yes |
| gemini-2.0-flash-lite | 1.0M | 65.5K | yes | yes |
| gemini-2.5-flash | 1.0M | 65.5K | yes | yes |
| gemini-2.5-flash-lite | 1.0M | 65.5K | yes | yes |
| gemini-2.5-flash-lite-preview-09-2025 | 1.0M | 65.5K | yes | yes |
| gemini-2.5-pro | 1.0M | 65.5K | yes | yes |
| gemini-3-flash-preview | 1.0M | 65.5K | yes | yes |
| gemini-3-pro-preview | 1M | 64K | yes | yes |

### groq

| model | context | max-out | thinking | images |
| --- | --- | --- | --- | --- |
| deepseek-r1-distill-llama-70b | 131.1K | 8.2K | yes | no |
| gemma2-9b-it | 8.2K | 8.2K | no | no |
| llama-3.1-8b-instant | 131.1K | 131.1K | no | no |
| llama-3.3-70b-versatile | 131.1K | 32.8K | no | no |
| llama3-70b-8192 | 8.2K | 8.2K | no | no |
| llama3-8b-8192 | 8.2K | 8.2K | no | no |
| meta-llama/llama-4-maverick-17b-128e-instruct | 131.1K | 8.2K | no | yes |
| meta-llama/llama-4-scout-17b-16e-instruct | 131.1K | 8.2K | no | yes |
| mistral-saba-24b | 32.8K | 32.8K | no | no |
| moonshotai/kimi-k2-instruct | 131.1K | 16.4K | no | no |
| moonshotai/kimi-k2-instruct-0905 | 262.1K | 16.4K | no | no |
| openai/gpt-oss-120b | 131.1K | 65.5K | yes | no |
| openai/gpt-oss-20b | 131.1K | 65.5K | yes | no |
| qwen-qwq-32b | 131.1K | 16.4K | yes | no |
| qwen/qwen3-32b | 131.1K | 16.4K | yes | no |

### huggingface

| model | context | max-out | thinking | images |
| --- | --- | --- | --- | --- |
| deepseek-ai/DeepSeek-R1-0528 | 163.8K | 163.8K | yes | no |
| deepseek-ai/DeepSeek-V3.2 | 163.8K | 65.5K | yes | no |
| MiniMaxAI/MiniMax-M2.1 | 204.8K | 131.1K | yes | no |
| moonshotai/Kimi-K2-Instruct | 131.1K | 16.4K | no | no |
| moonshotai/Kimi-K2-Instruct-0905 | 262.1K | 16.4K | no | no |
| moonshotai/Kimi-K2-Thinking | 262.1K | 262.1K | yes | no |
| moonshotai/Kimi-K2.5 | 262.1K | 262.1K | yes | yes |
| Qwen/Qwen3-235B-A22B-Thinking-2507 | 262.1K | 131.1K | yes | no |
| Qwen/Qwen3-Coder-480B-A35B-Instruct | 262.1K | 66.5K | no | no |
| Qwen/Qwen3-Next-80B-A3B-Instruct | 262.1K | 66.5K | no | no |
| Qwen/Qwen3-Next-80B-A3B-Thinking | 262.1K | 131.1K | no | no |
| XiaomiMiMo/MiMo-V2-Flash | 262.1K | 4.1K | yes | no |
| zai-org/GLM-4.7 | 204.8K | 131.1K | yes | no |
| zai-org/GLM-4.7-Flash | 200K | 128K | yes | no |

### kimi-coding

| model | context | max-out | thinking | images |
| --- | --- | --- | --- | --- |
| k2p5 | 262.1K | 32.8K | yes | yes |
| kimi-k2-thinking | 262.1K | 32.8K | yes | no |

### minimax

| model | context | max-out | thinking | images |
| --- | --- | --- | --- | --- |
| MiniMax-M2 | 196.6K | 128K | yes | no |
| MiniMax-M2.1 | 204.8K | 131.1K | yes | no |

### minimax-cn

| model | context | max-out | thinking | images |
| --- | --- | --- | --- | --- |
| MiniMax-M2 | 196.6K | 128K | yes | no |
| MiniMax-M2.1 | 204.8K | 131.1K | yes | no |

### mistral

| model | context | max-out | thinking | images |
| --- | --- | --- | --- | --- |
| codestral-latest | 256K | 4.1K | no | no |
| devstral-2512 | 262.1K | 262.1K | no | no |
| devstral-medium-2507 | 128K | 128K | no | no |
| devstral-medium-latest | 262.1K | 262.1K | no | no |
| devstral-small-2505 | 128K | 128K | no | no |
| devstral-small-2507 | 128K | 128K | no | no |
| labs-devstral-small-2512 | 256K | 256K | no | yes |
| magistral-medium-latest | 128K | 16.4K | yes | no |
| magistral-small | 128K | 128K | yes | no |
| ministral-3b-latest | 128K | 128K | no | no |
| ministral-8b-latest | 128K | 128K | no | no |
| mistral-large-2411 | 131.1K | 16.4K | no | no |
| mistral-large-2512 | 262.1K | 262.1K | no | yes |
| mistral-large-latest | 262.1K | 262.1K | no | yes |
| mistral-medium-2505 | 131.1K | 131.1K | no | yes |
| mistral-medium-2508 | 262.1K | 262.1K | no | yes |
| mistral-medium-latest | 128K | 16.4K | no | yes |
| mistral-nemo | 128K | 128K | no | no |
| mistral-small-2506 | 128K | 16.4K | no | yes |
| mistral-small-latest | 128K | 16.4K | no | yes |
| open-mistral-7b | 8K | 8K | no | no |
| open-mixtral-8x22b | 64K | 64K | no | no |
| open-mixtral-8x7b | 32K | 32K | no | no |
| pixtral-12b | 128K | 128K | no | yes |
| pixtral-large-latest | 128K | 128K | no | yes |

### openai

| model | context | max-out | thinking | images |
| --- | --- | --- | --- | --- |
| codex-mini-latest | 200K | 100K | yes | no |
| gpt-4 | 8.2K | 8.2K | no | no |
| gpt-4-turbo | 128K | 4.1K | no | yes |
| gpt-4.1 | 1.0M | 32.8K | no | yes |
| gpt-4.1-mini | 1.0M | 32.8K | no | yes |
| gpt-4.1-nano | 1.0M | 32.8K | no | yes |
| gpt-4o | 128K | 16.4K | no | yes |
| gpt-4o-2024-05-13 | 128K | 4.1K | no | yes |
| gpt-4o-2024-08-06 | 128K | 16.4K | no | yes |
| gpt-4o-2024-11-20 | 128K | 16.4K | no | yes |
| gpt-4o-mini | 128K | 16.4K | no | yes |
| gpt-5 | 400K | 128K | yes | yes |
| gpt-5-chat-latest | 128K | 16.4K | no | yes |
| gpt-5-codex | 400K | 128K | yes | yes |
| gpt-5-mini | 400K | 128K | yes | yes |
| gpt-5-nano | 400K | 128K | yes | yes |
| gpt-5-pro | 400K | 272K | yes | yes |
| gpt-5.1 | 400K | 128K | yes | yes |
| gpt-5.1-chat-latest | 128K | 16.4K | yes | yes |
| gpt-5.1-codex | 400K | 128K | yes | yes |
| gpt-5.1-codex-max | 400K | 128K | yes | yes |
| gpt-5.1-codex-mini | 400K | 128K | yes | yes |
| gpt-5.2 | 400K | 128K | yes | yes |
| gpt-5.2-chat-latest | 128K | 16.4K | yes | yes |
| gpt-5.2-codex | 400K | 128K | yes | yes |
| gpt-5.2-pro | 400K | 128K | yes | yes |
| o1 | 200K | 100K | yes | yes |
| o1-pro | 200K | 100K | yes | yes |
| o3 | 200K | 100K | yes | yes |
| o3-deep-research | 200K | 100K | yes | yes |
| o3-mini | 200K | 100K | yes | no |
| o3-pro | 200K | 100K | yes | yes |
| o4-mini | 200K | 100K | yes | yes |
| o4-mini-deep-research | 200K | 100K | yes | yes |

### openai-codex

| model | context | max-out | thinking | images |
| --- | --- | --- | --- | --- |
| gpt-5.1 | 272K | 128K | yes | yes |
| gpt-5.1-codex-max | 272K | 128K | yes | yes |
| gpt-5.1-codex-mini | 272K | 128K | yes | yes |
| gpt-5.2 | 272K | 128K | yes | yes |
| gpt-5.2-codex | 272K | 128K | yes | yes |

### opencode

| model | context | max-out | thinking | images |
| --- | --- | --- | --- | --- |
| big-pickle | 200K | 128K | yes | no |
| claude-3-5-haiku | 200K | 8.2K | no | yes |
| claude-haiku-4-5 | 200K | 64K | yes | yes |
| claude-opus-4-1 | 200K | 32K | yes | yes |
| claude-opus-4-5 | 200K | 64K | yes | yes |
| claude-sonnet-4 | 1M | 64K | yes | yes |
| claude-sonnet-4-5 | 1M | 64K | yes | yes |
| gemini-3-flash | 1.0M | 65.5K | yes | yes |
| gemini-3-pro | 1.0M | 65.5K | yes | yes |
| glm-4.6 | 204.8K | 131.1K | yes | no |
| glm-4.7 | 204.8K | 131.1K | yes | no |
| glm-4.7-free | 204.8K | 131.1K | yes | no |
| gpt-5 | 400K | 128K | yes | yes |
| gpt-5-codex | 400K | 128K | yes | yes |
| gpt-5-nano | 400K | 128K | yes | yes |
| gpt-5.1 | 400K | 128K | yes | yes |
| gpt-5.1-codex | 400K | 128K | yes | yes |
| gpt-5.1-codex-max | 400K | 128K | yes | yes |
| gpt-5.1-codex-mini | 400K | 128K | yes | yes |
| gpt-5.2 | 400K | 128K | yes | yes |
| gpt-5.2-codex | 400K | 128K | yes | yes |
| kimi-k2 | 262.1K | 262.1K | no | no |
| kimi-k2-thinking | 262.1K | 262.1K | yes | no |
| kimi-k2.5 | 262.1K | 262.1K | yes | yes |
| kimi-k2.5-free | 262.1K | 262.1K | yes | yes |
| minimax-m2.1 | 204.8K | 131.1K | yes | no |
| minimax-m2.1-free | 204.8K | 131.1K | yes | no |
| qwen3-coder | 262.1K | 65.5K | no | no |
| trinity-large-preview-free | 131.1K | 131.1K | no | no |

### openrouter

| model | context | max-out | thinking | images |
| --- | --- | --- | --- | --- |
| ai21/jamba-large-1.7 | 256K | 4.1K | no | no |
| ai21/jamba-mini-1.7 | 256K | 4.1K | no | no |
| alibaba/tongyi-deepresearch-30b-a3b | 131.1K | 131.1K | yes | no |
| allenai/olmo-3.1-32b-instruct | 65.5K | 4.1K | no | no |
| amazon/nova-2-lite-v1 | 1M | 65.5K | yes | yes |
| amazon/nova-lite-v1 | 300K | 5.1K | no | yes |
| amazon/nova-micro-v1 | 128K | 5.1K | no | no |
| amazon/nova-premier-v1 | 1M | 32K | no | yes |
| amazon/nova-pro-v1 | 300K | 5.1K | no | yes |
| anthropic/claude-3-haiku | 200K | 4.1K | no | yes |
| anthropic/claude-3.5-haiku | 200K | 8.2K | no | yes |
| anthropic/claude-3.5-sonnet | 200K | 8.2K | no | yes |
| anthropic/claude-3.7-sonnet | 200K | 64K | yes | yes |
| anthropic/claude-3.7-sonnet:thinking | 200K | 64K | yes | yes |
| anthropic/claude-haiku-4.5 | 200K | 64K | yes | yes |
| anthropic/claude-opus-4 | 200K | 32K | yes | yes |
| anthropic/claude-opus-4.1 | 200K | 32K | yes | yes |
| anthropic/claude-opus-4.5 | 200K | 64K | yes | yes |
| anthropic/claude-sonnet-4 | 1M | 64K | yes | yes |
| anthropic/claude-sonnet-4.5 | 1M | 64K | yes | yes |
| arcee-ai/trinity-large-preview:free | 131K | 4.1K | no | no |
| arcee-ai/trinity-mini | 131.1K | 131.1K | yes | no |
| arcee-ai/trinity-mini:free | 131.1K | 4.1K | yes | no |
| arcee-ai/virtuoso-large | 131.1K | 64K | no | no |
| baidu/ernie-4.5-21b-a3b | 120K | 8K | no | no |
| baidu/ernie-4.5-vl-28b-a3b | 30K | 8K | yes | yes |
| bytedance-seed/seed-1.6 | 262.1K | 32.8K | yes | yes |
| bytedance-seed/seed-1.6-flash | 262.1K | 32.8K | yes | yes |
| cohere/command-r-08-2024 | 128K | 4K | no | no |
| cohere/command-r-plus-08-2024 | 128K | 4K | no | no |
| deepcogito/cogito-v2-preview-llama-109b-moe | 32.8K | 4.1K | yes | yes |
| deepcogito/cogito-v2-preview-llama-405b | 32.8K | 4.1K | yes | no |
| deepcogito/cogito-v2-preview-llama-70b | 32.8K | 4.1K | yes | no |
| deepseek/deepseek-chat | 163.8K | 163.8K | no | no |
| deepseek/deepseek-chat-v3-0324 | 163.8K | 65.5K | yes | no |
| deepseek/deepseek-chat-v3.1 | 32.8K | 7.2K | yes | no |
| deepseek/deepseek-r1 | 64K | 16K | yes | no |
| deepseek/deepseek-r1-0528 | 163.8K | 65.5K | yes | no |
| deepseek/deepseek-v3.1-terminus | 163.8K | 4.1K | yes | no |
| deepseek/deepseek-v3.1-terminus:exacto | 163.8K | 4.1K | yes | no |
| deepseek/deepseek-v3.2 | 163.8K | 65.5K | yes | no |
| deepseek/deepseek-v3.2-exp | 163.8K | 65.5K | yes | no |
| google/gemini-2.0-flash-001 | 1.0M | 8.2K | no | yes |
| google/gemini-2.0-flash-lite-001 | 1.0M | 8.2K | no | yes |
| google/gemini-2.5-flash | 1.0M | 65.5K | yes | yes |
| google/gemini-2.5-flash-lite | 1.0M | 65.5K | yes | yes |
| google/gemini-2.5-flash-lite-preview-09-2025 | 1.0M | 65.5K | yes | yes |
| google/gemini-2.5-flash-preview-09-2025 | 1.0M | 65.5K | yes | yes |
| google/gemini-2.5-pro | 1.0M | 65.5K | yes | yes |
| google/gemini-2.5-pro-preview | 1.0M | 65.5K | yes | yes |
| google/gemini-2.5-pro-preview-05-06 | 1.0M | 65.5K | yes | yes |
| google/gemini-3-flash-preview | 1.0M | 65.5K | yes | yes |
| google/gemini-3-pro-preview | 1.0M | 65.5K | yes | yes |
| google/gemma-3-27b-it | 96K | 96K | no | yes |
| google/gemma-3-27b-it:free | 131.1K | 8.2K | no | yes |
| inception/mercury | 128K | 16.4K | no | no |
| inception/mercury-coder | 128K | 16.4K | no | no |
| kwaipilot/kat-coder-pro | 256K | 128K | no | no |
| meta-llama/llama-3-8b-instruct | 8.2K | 16.4K | no | no |
| meta-llama/llama-3.1-405b-instruct | 10K | 4.1K | no | no |
| meta-llama/llama-3.1-70b-instruct | 131.1K | 4.1K | no | no |
| meta-llama/llama-3.1-8b-instruct | 16.4K | 16.4K | no | no |
| meta-llama/llama-3.3-70b-instruct | 131.1K | 16.4K | no | no |
| meta-llama/llama-3.3-70b-instruct:free | 128K | 128K | no | no |
| meta-llama/llama-4-maverick | 1.0M | 16.4K | no | yes |
| meta-llama/llama-4-scout | 327.7K | 16.4K | no | yes |
| minimax/minimax-m1 | 1M | 40K | yes | no |
| minimax/minimax-m2 | 196.6K | 65.5K | yes | no |
| minimax/minimax-m2.1 | 196.6K | 196.6K | yes | no |
| mistralai/codestral-2508 | 256K | 4.1K | no | no |
| mistralai/devstral-2512 | 262.1K | 65.5K | no | no |
| mistralai/devstral-medium | 131.1K | 4.1K | no | no |
| mistralai/devstral-small | 131.1K | 4.1K | no | no |
| mistralai/ministral-14b-2512 | 262.1K | 4.1K | no | yes |
| mistralai/ministral-3b | 131.1K | 4.1K | no | no |
| mistralai/ministral-3b-2512 | 131.1K | 4.1K | no | yes |
| mistralai/ministral-8b | 131.1K | 4.1K | no | no |
| mistralai/ministral-8b-2512 | 262.1K | 4.1K | no | yes |
| mistralai/mistral-large | 128K | 4.1K | no | no |
| mistralai/mistral-large-2407 | 131.1K | 4.1K | no | no |
| mistralai/mistral-large-2411 | 131.1K | 4.1K | no | no |
| mistralai/mistral-large-2512 | 262.1K | 4.1K | no | yes |
| mistralai/mistral-medium-3 | 131.1K | 4.1K | no | yes |
| mistralai/mistral-medium-3.1 | 131.1K | 4.1K | no | yes |
| mistralai/mistral-nemo | 131.1K | 16.4K | no | no |
| mistralai/mistral-saba | 32.8K | 4.1K | no | no |
| mistralai/mistral-small-24b-instruct-2501 | 32.8K | 32.8K | no | no |
| mistralai/mistral-small-3.1-24b-instruct | 131.1K | 131.1K | no | yes |
| mistralai/mistral-small-3.1-24b-instruct:free | 128K | 4.1K | no | yes |
| mistralai/mistral-small-3.2-24b-instruct | 131.1K | 131.1K | no | yes |
| mistralai/mistral-small-creative | 32.8K | 4.1K | no | no |
| mistralai/mistral-tiny | 32.8K | 4.1K | no | no |
| mistralai/mixtral-8x22b-instruct | 65.5K | 4.1K | no | no |
| mistralai/mixtral-8x7b-instruct | 32.8K | 16.4K | no | no |
| mistralai/pixtral-12b | 32.8K | 4.1K | no | yes |
| mistralai/pixtral-large-2411 | 131.1K | 4.1K | no | yes |
| mistralai/voxtral-small-24b-2507 | 32K | 4.1K | no | no |
| moonshotai/kimi-k2 | 131.1K | 4.1K | no | no |
| moonshotai/kimi-k2-0905 | 262.1K | 262.1K | no | no |
| moonshotai/kimi-k2-0905:exacto | 262.1K | 4.1K | no | no |
| moonshotai/kimi-k2-thinking | 262.1K | 65.5K | yes | no |
| moonshotai/kimi-k2.5 | 262.1K | 65.5K | yes | yes |
| nex-agi/deepseek-v3.1-nex-n1 | 131.1K | 163.8K | no | no |
| nousresearch/deephermes-3-mistral-24b-preview | 32.8K | 32.8K | yes | no |
| nousresearch/hermes-4-70b | 131.1K | 131.1K | yes | no |
| nvidia/llama-3.1-nemotron-70b-instruct | 131.1K | 16.4K | no | no |
| nvidia/llama-3.3-nemotron-super-49b-v1.5 | 131.1K | 4.1K | yes | no |
| nvidia/nemotron-3-nano-30b-a3b | 262.1K | 4.1K | yes | no |
| nvidia/nemotron-3-nano-30b-a3b:free | 256K | 4.1K | yes | no |
| nvidia/nemotron-nano-12b-v2-vl:free | 128K | 128K | yes | yes |
| nvidia/nemotron-nano-9b-v2 | 131.1K | 4.1K | yes | no |
| nvidia/nemotron-nano-9b-v2:free | 128K | 4.1K | yes | no |
| openai/gpt-3.5-turbo | 16.4K | 4.1K | no | no |
| openai/gpt-3.5-turbo-0613 | 4.1K | 4.1K | no | no |
| openai/gpt-3.5-turbo-16k | 16.4K | 4.1K | no | no |
| openai/gpt-4 | 8.2K | 4.1K | no | no |
| openai/gpt-4-0314 | 8.2K | 4.1K | no | no |
| openai/gpt-4-1106-preview | 128K | 4.1K | no | no |
| openai/gpt-4-turbo | 128K | 4.1K | no | yes |
| openai/gpt-4-turbo-preview | 128K | 4.1K | no | no |
| openai/gpt-4.1 | 1.0M | 32.8K | no | yes |
| openai/gpt-4.1-mini | 1.0M | 32.8K | no | yes |
| openai/gpt-4.1-nano | 1.0M | 32.8K | no | yes |
| openai/gpt-4o | 128K | 16.4K | no | yes |
| openai/gpt-4o-2024-05-13 | 128K | 4.1K | no | yes |
| openai/gpt-4o-2024-08-06 | 128K | 16.4K | no | yes |
| openai/gpt-4o-2024-11-20 | 128K | 16.4K | no | yes |
| openai/gpt-4o-audio-preview | 128K | 16.4K | no | no |
| openai/gpt-4o-mini | 128K | 16.4K | no | yes |
| openai/gpt-4o-mini-2024-07-18 | 128K | 16.4K | no | yes |
| openai/gpt-4o:extended | 128K | 64K | no | yes |
| openai/gpt-5 | 400K | 128K | yes | yes |
| openai/gpt-5-codex | 400K | 128K | yes | yes |
| openai/gpt-5-image | 400K | 128K | yes | yes |
| openai/gpt-5-image-mini | 400K | 128K | yes | yes |
| openai/gpt-5-mini | 400K | 128K | yes | yes |
| openai/gpt-5-nano | 400K | 128K | yes | yes |
| openai/gpt-5-pro | 400K | 128K | yes | yes |
| openai/gpt-5.1 | 400K | 128K | yes | yes |
| openai/gpt-5.1-chat | 128K | 16.4K | no | yes |
| openai/gpt-5.1-codex | 400K | 128K | yes | yes |
| openai/gpt-5.1-codex-max | 400K | 128K | yes | yes |
| openai/gpt-5.1-codex-mini | 400K | 100K | yes | yes |
| openai/gpt-5.2 | 400K | 128K | yes | yes |
| openai/gpt-5.2-chat | 128K | 16.4K | no | yes |
| openai/gpt-5.2-codex | 400K | 128K | yes | yes |
| openai/gpt-5.2-pro | 400K | 128K | yes | yes |
| openai/gpt-oss-120b | 131.1K | 4.1K | yes | no |
| openai/gpt-oss-120b:exacto | 131.1K | 4.1K | yes | no |
| openai/gpt-oss-120b:free | 131.1K | 131.1K | yes | no |
| openai/gpt-oss-20b | 131.1K | 131.1K | yes | no |
| openai/gpt-oss-20b:free | 131.1K | 131.1K | yes | no |
| openai/gpt-oss-safeguard-20b | 131.1K | 65.5K | yes | no |
| openai/o1 | 200K | 100K | no | yes |
| openai/o3 | 200K | 100K | yes | yes |
| openai/o3-deep-research | 200K | 100K | yes | yes |
| openai/o3-mini | 200K | 100K | no | no |
| openai/o3-mini-high | 200K | 100K | no | no |
| openai/o3-pro | 200K | 100K | yes | yes |
| openai/o4-mini | 200K | 100K | yes | yes |
| openai/o4-mini-deep-research | 200K | 100K | yes | yes |
| openai/o4-mini-high | 200K | 100K | yes | yes |
| openrouter/auto | 2M | 4.1K | yes | yes |
| openrouter/free | 200K | 4.1K | yes | yes |
| prime-intellect/intellect-3 | 131.1K | 131.1K | yes | no |
| qwen/qwen-2.5-72b-instruct | 32.8K | 16.4K | no | no |
| qwen/qwen-2.5-7b-instruct | 32.8K | 4.1K | no | no |
| qwen/qwen-max | 32.8K | 8.2K | no | no |
| qwen/qwen-plus | 131.1K | 8.2K | no | no |
| qwen/qwen-plus-2025-07-28 | 1M | 32.8K | no | no |
| qwen/qwen-plus-2025-07-28:thinking | 1M | 32.8K | yes | no |
| qwen/qwen-turbo | 1M | 8.2K | no | no |
| qwen/qwen-vl-max | 131.1K | 8.2K | no | yes |
| qwen/qwen3-14b | 41.0K | 41.0K | yes | no |
| qwen/qwen3-235b-a22b | 41.0K | 4.1K | yes | no |
| qwen/qwen3-235b-a22b-2507 | 262.1K | 4.1K | yes | no |
| qwen/qwen3-235b-a22b-thinking-2507 | 262.1K | 262.1K | yes | no |
| qwen/qwen3-30b-a3b | 41.0K | 41.0K | yes | no |
| qwen/qwen3-30b-a3b-instruct-2507 | 262.1K | 262.1K | no | no |
| qwen/qwen3-30b-a3b-thinking-2507 | 32.8K | 4.1K | yes | no |
| qwen/qwen3-32b | 41.0K | 41.0K | yes | no |
| qwen/qwen3-4b:free | 41.0K | 4.1K | yes | no |
| qwen/qwen3-8b | 32K | 8.2K | yes | no |
| qwen/qwen3-coder | 262.1K | 262.1K | yes | no |
| qwen/qwen3-coder-30b-a3b-instruct | 160K | 32.8K | no | no |
| qwen/qwen3-coder-flash | 128K | 65.5K | no | no |
| qwen/qwen3-coder-next | 262.1K | 65.5K | no | no |
| qwen/qwen3-coder-plus | 128K | 65.5K | no | no |
| qwen/qwen3-coder:exacto | 262.1K | 65.5K | yes | no |
| qwen/qwen3-coder:free | 262K | 262K | no | no |
| qwen/qwen3-max | 256K | 32.8K | no | no |
| qwen/qwen3-next-80b-a3b-instruct | 262.1K | 4.1K | no | no |
| qwen/qwen3-next-80b-a3b-instruct:free | 262.1K | 4.1K | no | no |
| qwen/qwen3-next-80b-a3b-thinking | 128K | 4.1K | yes | no |
| qwen/qwen3-vl-235b-a22b-instruct | 262.1K | 4.1K | no | yes |
| qwen/qwen3-vl-235b-a22b-thinking | 262.1K | 262.1K | yes | yes |
| qwen/qwen3-vl-30b-a3b-instruct | 262.1K | 4.1K | no | yes |
| qwen/qwen3-vl-30b-a3b-thinking | 131.1K | 32.8K | yes | yes |
| qwen/qwen3-vl-8b-instruct | 131.1K | 32.8K | no | yes |
| qwen/qwen3-vl-8b-thinking | 256K | 32.8K | yes | yes |
| qwen/qwq-32b | 32.8K | 32.8K | yes | no |
| relace/relace-search | 256K | 128K | no | no |
| sao10k/l3-euryale-70b | 8.2K | 8.2K | no | no |
| sao10k/l3.1-euryale-70b | 32.8K | 32.8K | no | no |
| stepfun-ai/step3 | 65.5K | 65.5K | yes | yes |
| stepfun/step-3.5-flash:free | 256K | 256K | yes | no |
| thedrummer/rocinante-12b | 32.8K | 32.8K | no | no |
| thedrummer/unslopnemo-12b | 32.8K | 32.8K | no | no |
| tngtech/deepseek-r1t2-chimera | 163.8K | 163.8K | yes | no |
| tngtech/tng-r1t-chimera | 163.8K | 65.5K | yes | no |
| tngtech/tng-r1t-chimera:free | 163.8K | 65.5K | yes | no |
| upstage/solar-pro-3:free | 128K | 4.1K | yes | no |
| x-ai/grok-3 | 131.1K | 4.1K | no | no |
| x-ai/grok-3-beta | 131.1K | 4.1K | no | no |
| x-ai/grok-3-mini | 131.1K | 4.1K | yes | no |
| x-ai/grok-3-mini-beta | 131.1K | 4.1K | yes | no |
| x-ai/grok-4 | 256K | 4.1K | yes | yes |
| x-ai/grok-4-fast | 2M | 30K | yes | yes |
| x-ai/grok-4.1-fast | 2M | 30K | yes | yes |
| x-ai/grok-code-fast-1 | 256K | 10K | yes | no |
| xiaomi/mimo-v2-flash | 262.1K | 4.1K | yes | no |
| z-ai/glm-4-32b | 128K | 4.1K | no | no |
| z-ai/glm-4.5 | 131.1K | 65.5K | yes | no |
| z-ai/glm-4.5-air | 131.1K | 131.1K | yes | no |
| z-ai/glm-4.5-air:free | 131.1K | 96K | yes | no |
| z-ai/glm-4.5v | 65.5K | 16.4K | yes | yes |
| z-ai/glm-4.6 | 202.8K | 65.5K | yes | no |
| z-ai/glm-4.6:exacto | 204.8K | 131.1K | yes | no |
| z-ai/glm-4.6v | 131.1K | 131.1K | yes | yes |
| z-ai/glm-4.7 | 202.8K | 65.5K | yes | no |
| z-ai/glm-4.7-flash | 200K | 131.1K | yes | no |

### vercel-ai-gateway

| model | context | max-out | thinking | images |
| --- | --- | --- | --- | --- |
| alibaba/qwen-3-14b | 41.0K | 16.4K | yes | no |
| alibaba/qwen-3-235b | 41.0K | 16.4K | no | no |
| alibaba/qwen-3-30b | 41.0K | 16.4K | yes | no |
| alibaba/qwen-3-32b | 41.0K | 16.4K | yes | no |
| alibaba/qwen3-235b-a22b-thinking | 262.1K | 262.1K | yes | yes |
| alibaba/qwen3-coder | 262.1K | 66.5K | no | no |
| alibaba/qwen3-coder-30b-a3b | 160K | 32.8K | yes | no |
| alibaba/qwen3-coder-plus | 1M | 65.5K | no | no |
| alibaba/qwen3-max-preview | 262.1K | 32.8K | no | no |
| alibaba/qwen3-max-thinking | 256K | 65.5K | yes | no |
| alibaba/qwen3-vl-thinking | 256K | 256K | yes | yes |
| anthropic/claude-3-haiku | 200K | 4.1K | no | yes |
| anthropic/claude-3.5-haiku | 200K | 8.2K | no | yes |
| anthropic/claude-3.5-sonnet | 200K | 8.2K | no | yes |
| anthropic/claude-3.5-sonnet-20240620 | 200K | 8.2K | no | yes |
| anthropic/claude-3.7-sonnet | 200K | 64K | yes | yes |
| anthropic/claude-haiku-4.5 | 200K | 64K | yes | yes |
| anthropic/claude-opus-4 | 200K | 32K | yes | yes |
| anthropic/claude-opus-4.1 | 200K | 32K | yes | yes |
| anthropic/claude-opus-4.5 | 200K | 64K | yes | yes |
| anthropic/claude-sonnet-4 | 1M | 64K | yes | yes |
| anthropic/claude-sonnet-4.5 | 1M | 64K | yes | yes |
| arcee-ai/trinity-large-preview | 131K | 131K | no | no |
| bytedance/seed-1.6 | 256K | 32K | yes | no |
| cohere/command-a | 256K | 8K | no | no |
| deepseek/deepseek-v3 | 163.8K | 16.4K | no | no |
| deepseek/deepseek-v3.1 | 163.8K | 128K | yes | no |
| deepseek/deepseek-v3.1-terminus | 131.1K | 65.5K | yes | no |
| deepseek/deepseek-v3.2-exp | 163.8K | 163.8K | yes | no |
| deepseek/deepseek-v3.2-thinking | 128K | 64K | yes | no |
| google/gemini-2.5-flash | 1M | 65.5K | yes | no |
| google/gemini-2.5-flash-lite | 1.0M | 65.5K | yes | yes |
| google/gemini-2.5-flash-lite-preview-09-2025 | 1.0M | 65.5K | yes | yes |
| google/gemini-2.5-flash-preview-09-2025 | 1M | 65.5K | yes | yes |
| google/gemini-2.5-pro | 1.0M | 65.5K | yes | no |
| google/gemini-3-flash | 1M | 64K | yes | yes |
| google/gemini-3-pro-preview | 1M | 64K | yes | yes |
| inception/mercury-coder-small | 32K | 16.4K | no | no |
| meituan/longcat-flash-chat | 128K | 8.2K | no | no |
| meituan/longcat-flash-thinking | 128K | 8.2K | yes | no |
| meta/llama-3.1-70b | 131.1K | 16.4K | no | no |
| meta/llama-3.1-8b | 131.1K | 16.4K | no | no |
| meta/llama-3.2-11b | 128K | 8.2K | no | yes |
| meta/llama-3.2-90b | 128K | 8.2K | no | yes |
| meta/llama-3.3-70b | 128K | 8.2K | no | no |
| meta/llama-4-maverick | 131.1K | 8.2K | no | yes |
| meta/llama-4-scout | 131.1K | 8.2K | no | yes |
| minimax/minimax-m2 | 262.1K | 262.1K | yes | no |
| minimax/minimax-m2.1 | 196.6K | 196.6K | yes | no |
| minimax/minimax-m2.1-lightning | 204.8K | 131.1K | yes | no |
| mistral/codestral | 128K | 4K | no | no |
| mistral/devstral-2 | 256K | 256K | no | no |
| mistral/devstral-small | 128K | 64K | no | no |
| mistral/devstral-small-2 | 256K | 256K | no | no |
| mistral/ministral-3b | 128K | 4K | no | no |
| mistral/ministral-8b | 128K | 4K | no | no |
| mistral/mistral-medium | 128K | 64K | no | yes |
| mistral/mistral-small | 32K | 4K | no | yes |
| mistral/pixtral-12b | 128K | 4K | no | yes |
| mistral/pixtral-large | 128K | 4K | no | yes |
| moonshotai/kimi-k2 | 131.1K | 16.4K | no | no |
| moonshotai/kimi-k2-thinking | 216.1K | 216.1K | yes | no |
| moonshotai/kimi-k2-thinking-turbo | 262.1K | 262.1K | yes | no |
| moonshotai/kimi-k2-turbo | 256K | 16.4K | no | no |
| moonshotai/kimi-k2.5 | 262.1K | 252.1K | yes | yes |
| nvidia/nemotron-nano-12b-v2-vl | 131.1K | 131.1K | yes | yes |
| nvidia/nemotron-nano-9b-v2 | 131.1K | 131.1K | yes | no |
| openai/codex-mini | 200K | 100K | yes | yes |
| openai/gpt-4-turbo | 128K | 4.1K | no | yes |
| openai/gpt-4.1 | 1.0M | 32.8K | no | yes |
| openai/gpt-4.1-mini | 1.0M | 32.8K | no | yes |
| openai/gpt-4.1-nano | 1.0M | 32.8K | no | yes |
| openai/gpt-4o | 128K | 16.4K | no | yes |
| openai/gpt-4o-mini | 128K | 16.4K | no | yes |
| openai/gpt-5 | 400K | 128K | yes | yes |
| openai/gpt-5-chat | 128K | 16.4K | yes | yes |
| openai/gpt-5-codex | 400K | 128K | yes | yes |
| openai/gpt-5-mini | 400K | 128K | yes | yes |
| openai/gpt-5-nano | 400K | 128K | yes | yes |
| openai/gpt-5-pro | 400K | 272K | yes | yes |
| openai/gpt-5.1-codex | 400K | 128K | yes | yes |
| openai/gpt-5.1-codex-max | 400K | 128K | yes | yes |
| openai/gpt-5.1-codex-mini | 400K | 128K | yes | yes |
| openai/gpt-5.1-instant | 128K | 16.4K | yes | yes |
| openai/gpt-5.1-thinking | 400K | 128K | yes | yes |
| openai/gpt-5.2 | 400K | 128K | yes | yes |
| openai/gpt-5.2-chat | 128K | 16.4K | yes | yes |
| openai/gpt-5.2-codex | 400K | 128K | yes | yes |
| openai/gpt-5.2-pro | 400K | 128K | yes | yes |
| openai/gpt-oss-120b | 131.1K | 131.1K | yes | no |
| openai/gpt-oss-20b | 128K | 8.2K | yes | no |
| openai/gpt-oss-safeguard-20b | 131.1K | 65.5K | yes | no |
| openai/o1 | 200K | 100K | yes | yes |
| openai/o3 | 200K | 100K | yes | yes |
| openai/o3-deep-research | 200K | 100K | yes | yes |
| openai/o3-mini | 200K | 100K | yes | no |
| openai/o3-pro | 200K | 100K | yes | yes |
| openai/o4-mini | 200K | 100K | yes | yes |
| perplexity/sonar | 127K | 8K | no | yes |
| perplexity/sonar-pro | 200K | 8K | no | yes |
| prime-intellect/intellect-3 | 131.1K | 131.1K | yes | no |
| vercel/v0-1.0-md | 128K | 32K | no | yes |
| vercel/v0-1.5-md | 128K | 32.8K | no | yes |
| xai/grok-2-vision | 32.8K | 32.8K | no | yes |
| xai/grok-3 | 131.1K | 131.1K | no | no |
| xai/grok-3-fast | 131.1K | 131.1K | no | no |
| xai/grok-3-mini | 131.1K | 131.1K | no | no |
| xai/grok-3-mini-fast | 131.1K | 131.1K | no | no |
| xai/grok-4 | 256K | 256K | yes | yes |
| xai/grok-4-fast-non-reasoning | 2M | 256K | no | no |
| xai/grok-4-fast-reasoning | 2M | 256K | yes | no |
| xai/grok-4.1-fast-non-reasoning | 2M | 30K | no | no |
| xai/grok-4.1-fast-reasoning | 2M | 30K | yes | no |
| xai/grok-code-fast-1 | 256K | 256K | yes | no |
| xiaomi/mimo-v2-flash | 262.1K | 32K | yes | no |
| zai/glm-4.5 | 131.1K | 131.1K | yes | no |
| zai/glm-4.5-air | 128K | 96K | yes | no |
| zai/glm-4.5v | 65.5K | 16.4K | yes | yes |
| zai/glm-4.6 | 200K | 96K | yes | no |
| zai/glm-4.6v | 128K | 24K | yes | yes |
| zai/glm-4.6v-flash | 128K | 24K | yes | yes |
| zai/glm-4.7 | 202.8K | 120K | yes | no |
| zai/glm-4.7-flashx | 200K | 128K | yes | no |

### xai

| model | context | max-out | thinking | images |
| --- | --- | --- | --- | --- |
| grok-2 | 131.1K | 8.2K | no | no |
| grok-2-1212 | 131.1K | 8.2K | no | no |
| grok-2-latest | 131.1K | 8.2K | no | no |
| grok-2-vision | 8.2K | 4.1K | no | yes |
| grok-2-vision-1212 | 8.2K | 4.1K | no | yes |
| grok-2-vision-latest | 8.2K | 4.1K | no | yes |
| grok-3 | 131.1K | 8.2K | no | no |
| grok-3-fast | 131.1K | 8.2K | no | no |
| grok-3-fast-latest | 131.1K | 8.2K | no | no |
| grok-3-latest | 131.1K | 8.2K | no | no |
| grok-3-mini | 131.1K | 8.2K | yes | no |
| grok-3-mini-fast | 131.1K | 8.2K | yes | no |
| grok-3-mini-fast-latest | 131.1K | 8.2K | yes | no |
| grok-3-mini-latest | 131.1K | 8.2K | yes | no |
| grok-4 | 256K | 64K | yes | no |
| grok-4-1-fast | 2M | 30K | yes | yes |
| grok-4-1-fast-non-reasoning | 2M | 30K | no | yes |
| grok-4-fast | 2M | 30K | yes | yes |
| grok-4-fast-non-reasoning | 2M | 30K | no | yes |
| grok-beta | 131.1K | 4.1K | no | no |
| grok-code-fast-1 | 256K | 10K | yes | no |
| grok-vision-beta | 8.2K | 4.1K | no | yes |

### zai

| model | context | max-out | thinking | images |
| --- | --- | --- | --- | --- |
| glm-4.5 | 131.1K | 98.3K | yes | no |
| glm-4.5-air | 131.1K | 98.3K | yes | no |
| glm-4.5-flash | 131.1K | 98.3K | yes | no |
| glm-4.5v | 64K | 16.4K | yes | yes |
| glm-4.6 | 204.8K | 131.1K | yes | no |
| glm-4.6v | 128K | 32.8K | yes | yes |
| glm-4.7 | 204.8K | 131.1K | yes | no |
| glm-4.7-flash | 200K | 131.1K | yes | no |
