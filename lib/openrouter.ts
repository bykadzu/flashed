// OpenRouter API helper
// Docs: https://openrouter.ai/docs

export const DEFAULT_MODEL = 'google/gemini-2.5-flash-preview';

interface ContentPart {
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

// Convert Google GenAI format to OpenRouter/OpenAI format
function convertToOpenRouterFormat(contents: Message | Message[]): Array<{ role: string; content: any }> {
  const messageArray = Array.isArray(contents) ? contents : [contents];

  return messageArray.map(msg => {
    // If already has content field, might be pre-formatted
    if (msg.content && !msg.parts) {
      return { role: msg.role, content: msg.content };
    }

    // Convert parts to OpenRouter format
    if (msg.parts) {
      const contentParts: any[] = [];

      for (const part of msg.parts) {
        if (part.text) {
          contentParts.push({ type: 'text', text: part.text });
        }
        if (part.inlineData) {
          contentParts.push({
            type: 'image_url',
            image_url: {
              url: `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`
            }
          });
        }
      }

      // If only text, simplify to string
      if (contentParts.length === 1 && contentParts[0].type === 'text') {
        return { role: msg.role, content: contentParts[0].text };
      }

      return { role: msg.role, content: contentParts };
    }

    return { role: msg.role, content: '' };
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
