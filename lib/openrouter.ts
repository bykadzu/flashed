// OpenRouter API helper
// Docs: https://openrouter.ai/docs

// Retry configuration
const DEFAULT_MAX_RETRIES = 3;
const DEFAULT_INITIAL_DELAY_MS = 1000;
const DEFAULT_BACKOFF_MULTIPLIER = 2;

/**
 * Retry helper with exponential backoff
 * Useful for transient failures (rate limits, network issues)
 */
export interface RetryOptions {
  maxRetries?: number;
  initialDelayMs?: number;
  backoffMultiplier?: number;
  retryableStatuses?: number[];
  onRetry?: (attempt: number, error: Error, delayMs: number) => void;
}

/**
 * Executes a function with exponential backoff retry
 * @param fn The async function to execute
 * @param options Retry configuration
 * @returns The result of the function
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const {
    maxRetries = DEFAULT_MAX_RETRIES,
    initialDelayMs = DEFAULT_INITIAL_DELAY_MS,
    backoffMultiplier = DEFAULT_BACKOFF_MULTIPLIER,
    retryableStatuses = [429, 500, 502, 503, 504], // Rate limit + server errors
    onRetry
  } = options;

  let lastError: Error;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      // Don't retry on last attempt
      if (attempt === maxRetries) {
        break;
      }

      // Check if error is retryable
      const isRetryable = lastError.message.includes('429') ||
        retryableStatuses.some(status => lastError.message.includes(String(status)));

      if (!isRetryable && lastError.message.includes('OpenRouter error:')) {
        // Non-retryable API error, don't retry
        throw lastError;
      }

      const delayMs = initialDelayMs * Math.pow(backoffMultiplier, attempt);

      if (onRetry) {
        onRetry(attempt + 1, lastError, delayMs);
      }

      console.warn(`Retry attempt ${attempt + 1}/${maxRetries} after ${delayMs}ms:`, lastError.message);

      await new Promise(resolve => setTimeout(resolve, delayMs));
    }
  }

  throw lastError!;
}

export const AVAILABLE_MODELS = [
  { id: 'google/gemini-2.5-flash', name: 'Gemini 2.5 Flash', provider: 'Google' },
  { id: 'google/gemini-2.5-pro-preview-05-06', name: 'Gemini 2.5 Pro', provider: 'Google' },
  { id: 'anthropic/claude-3.5-sonnet', name: 'Claude 3.5 Sonnet', provider: 'Anthropic' },
  { id: 'anthropic/claude-3.7-sonnet', name: 'Claude 3.7 Sonnet', provider: 'Anthropic' },
  { id: 'qwen/qwen3-8b', name: 'Qwen3 8B', provider: 'Qwen' },
  { id: 'qwen/qwen3-30b-a3b', name: 'Qwen3 30B', provider: 'Qwen' },
  { id: 'deepseek/deepseek-chat', name: 'DeepSeek V3', provider: 'DeepSeek' },
  { id: 'deepseek/deepseek-r1', name: 'DeepSeek R1', provider: 'DeepSeek' },
  { id: 'meta-llama/llama-3.1-70b-instruct', name: 'Llama 3.1 70B', provider: 'Meta' },
  { id: 'mistralai/mistral-small-3.1-24b-instruct', name: 'Mistral Small 3.1', provider: 'Mistral' },
  { id: 'openai/gpt-4o-mini', name: 'GPT-4o Mini', provider: 'OpenAI' },
  { id: 'openai/gpt-4o', name: 'GPT-4o', provider: 'OpenAI' },
] as const;

export type ModelId = typeof AVAILABLE_MODELS[number]['id'];

export const DEFAULT_MODEL: ModelId = 'google/gemini-2.5-flash';

// Storage key for persisting model selection
const MODEL_STORAGE_KEY = 'flashed_selected_model';

export function getStoredModel(): ModelId {
  if (typeof window === 'undefined') return DEFAULT_MODEL;
  const stored = localStorage.getItem(MODEL_STORAGE_KEY);
  if (stored && AVAILABLE_MODELS.some(m => m.id === stored)) {
    return stored as ModelId;
  }
  return DEFAULT_MODEL;
}

export function setStoredModel(modelId: ModelId): void {
  localStorage.setItem(MODEL_STORAGE_KEY, modelId);
}

export interface ContentPart {
  text?: string;
  inlineData?: {
    mimeType: string;
    data: string;
  };
}

interface Message {
  role: 'user' | 'assistant' | 'system';
  parts?: ContentPart[];
  content?: string | Array<{ type: string; text?: string; image_url?: { url: string } }>;
}

interface GenerateOptions {
  model?: string;
  contents: Message | Message[];
  config?: {
    temperature?: number;
    maxTokens?: number;
  };
}

// Type for OpenRouter message content (union of string or array of content parts)
type OpenRouterContent = string | Array<{
  type: 'text' | 'image_url';
  text?: string;
  image_url?: { url: string };
}>;

// Convert Google GenAI format to OpenRouter/OpenAI format
function convertToOpenRouterFormat(contents: Message | Message[]): Array<{ role: string; content: OpenRouterContent }> {
  const messageArray = Array.isArray(contents) ? contents : [contents];

  return messageArray.map(msg => {
    const role: string = msg.role;
    let content: OpenRouterContent = '';

    // If already has content field, might be pre-formatted
    if (msg.content && !msg.parts) {
      content = msg.content as OpenRouterContent;
    } else if (msg.parts) {
      // Convert parts to OpenRouter format
      const contentParts: Array<{ type: 'text' | 'image_url'; text?: string; image_url?: { url: string } }> = [];

      for (const part of msg.parts) {
        if (part.text) {
          contentParts.push({ type: 'text' as const, text: part.text });
        }
        if (part.inlineData) {
          contentParts.push({
            type: 'image_url' as const,
            image_url: {
              url: `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`
            }
          });
        }
      }

      // If only text, simplify to string
      if (contentParts.length === 1 && contentParts[0].type === 'text' && contentParts[0].text) {
        content = contentParts[0].text;
      } else {
        content = contentParts;
      }
    }

    return { role, content };
  });
}

export async function generateContent(apiKey: string, options: GenerateOptions): Promise<{ text: string }> {
  const messages = convertToOpenRouterFormat(options.contents);

  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': window.location.origin,
      'X-Title': 'Flashed'
    },
    body: JSON.stringify({
      model: options.model || DEFAULT_MODEL,
      messages,
      temperature: options.config?.temperature ?? 0.7,
      max_tokens: options.config?.maxTokens ?? 8192,
    })
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: { message: response.statusText } }));
    throw new Error(error.error?.message || `OpenRouter error: ${response.status}`);
  }

  const data = await response.json();
  return { text: data.choices?.[0]?.message?.content || '' };
}

export async function* generateContentStream(apiKey: string, options: GenerateOptions): AsyncGenerator<{ text: string }> {
  const messages = convertToOpenRouterFormat(options.contents);

  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': window.location.origin,
      'X-Title': 'Flashed'
    },
    body: JSON.stringify({
      model: options.model || DEFAULT_MODEL,
      messages,
      temperature: options.config?.temperature ?? 0.7,
      max_tokens: options.config?.maxTokens ?? 8192,
      stream: true
    })
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: { message: response.statusText } }));
    throw new Error(error.error?.message || `OpenRouter error: ${response.status}`);
  }

  const reader = response.body?.getReader();
  if (!reader) throw new Error('No response body');

  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() || '';

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed === 'data: [DONE]') continue;
      if (!trimmed.startsWith('data: ')) continue;

      try {
        const json = JSON.parse(trimmed.slice(6));
        const content = json.choices?.[0]?.delta?.content;
        if (content) {
          yield { text: content };
        }
      } catch {
        // Skip malformed JSON
      }
    }
  }
}

// Helper to create a client-like interface similar to Google GenAI
export function createOpenRouterClient(apiKey: string) {
  return {
    models: {
      generateContent: (options: Omit<GenerateOptions, 'apiKey'>) =>
        generateContent(apiKey, options),
      generateContentStream: (options: Omit<GenerateOptions, 'apiKey'>) =>
        generateContentStream(apiKey, options)
    }
  };
}
