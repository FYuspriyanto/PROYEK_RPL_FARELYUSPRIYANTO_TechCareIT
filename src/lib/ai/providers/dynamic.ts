/**
 * DynamicProvider — a generic LLM provider that can be instantiated
 * from an AiConfig database record. Supports any OpenAI-compatible API
 * (NVIDIA NIM, OpenAI, Groq, Mistral, Together, …) and Google Gemini.
 */
import { ChatMessage, LLMProvider } from '../types';

export interface DynamicProviderConfig {
  providerSlug: string;
  providerName: string;
  apiKey: string;
  model: string;
  baseUrl?: string | null;
  maxTokens: number;
  temperature: number;
  timeoutMs: number;
}

export class DynamicProvider implements LLMProvider {
  readonly name: string;
  private cfg: DynamicProviderConfig;

  constructor(cfg: DynamicProviderConfig) {
    this.cfg = cfg;
    this.name = cfg.providerSlug;
  }

  isAvailable(): boolean {
    return Boolean(this.cfg.apiKey && this.cfg.apiKey.trim().length > 0);
  }

  async generateResponse(
    systemPrompt: string,
    history: ChatMessage[],
    userMessage: string
  ): Promise<string> {
    if (!this.isAvailable()) {
      throw new Error(`API key for provider "${this.cfg.providerName}" is not configured.`);
    }

    // Gemini uses a different API format
    if (this.cfg.providerSlug === 'gemini') {
      return this.generateGemini(systemPrompt, history, userMessage);
    }

    // Default: OpenAI-compatible endpoint (NVIDIA NIM, OpenAI, Groq, Mistral, etc.)
    return this.generateOpenAICompatible(systemPrompt, history, userMessage);
  }

  // ─── OpenAI-compatible (NVIDIA, OpenAI, Groq, Mistral, Together, …) ───
  private async generateOpenAICompatible(
    systemPrompt: string,
    history: ChatMessage[],
    userMessage: string
  ): Promise<string> {
    const baseUrl = this.cfg.baseUrl || 'https://api.openai.com/v1';

    const messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }> = [];
    if (systemPrompt) {
      messages.push({ role: 'system', content: systemPrompt });
    }
    for (const msg of history) {
      messages.push({
        role: msg.role === 'system' ? 'system' : msg.role === 'user' ? 'user' : 'assistant',
        content: msg.content,
      });
    }
    messages.push({ role: 'user', content: userMessage });

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.cfg.timeoutMs);

    try {
      const response = await fetch(`${baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.cfg.apiKey}`,
        },
        body: JSON.stringify({
          model: this.cfg.model,
          messages,
          temperature: this.cfg.temperature,
          max_tokens: this.cfg.maxTokens,
          top_p: 1,
          stream: false,
        }),
        signal: controller.signal,
      });

      if (!response.ok) {
        const errorText = await response.text().catch(() => '');
        throw new Error(
          `${this.cfg.providerName} API error [${response.status}]: ${errorText.slice(0, 300)}`
        );
      }

      const data = await response.json();
      const content = data.choices?.[0]?.message?.content;

      if (!content) {
        throw new Error(`${this.cfg.providerName} API returned empty response`);
      }
      return content.trim();
    } finally {
      clearTimeout(timeout);
    }
  }

  // ─── Google Gemini ────────────────────────────────────────────────────
  private async generateGemini(
    systemPrompt: string,
    history: ChatMessage[],
    userMessage: string
  ): Promise<string> {
    const model = this.cfg.model || 'gemini-2.0-flash';
    const baseUrl = this.cfg.baseUrl || 'https://generativelanguage.googleapis.com/v1beta';
    const url = `${baseUrl}/models/${model}:generateContent?key=${this.cfg.apiKey}`;

    const contents: Array<{ role: string; parts: Array<{ text: string }> }> = [];
    for (const msg of history) {
      if (msg.role === 'system') continue;
      contents.push({
        role: msg.role === 'user' ? 'user' : 'model',
        parts: [{ text: msg.content }],
      });
    }
    contents.push({ role: 'user', parts: [{ text: userMessage }] });

    const body: Record<string, any> = {
      contents,
      generationConfig: {
        temperature: this.cfg.temperature,
        maxOutputTokens: this.cfg.maxTokens,
      },
    };
    if (systemPrompt) {
      body.systemInstruction = { parts: [{ text: systemPrompt }] };
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.cfg.timeoutMs);

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        signal: controller.signal,
      });

      if (!response.ok) {
        const errorText = await response.text().catch(() => '');
        throw new Error(
          `Gemini API error [${response.status}]: ${errorText.slice(0, 300)}`
        );
      }

      const data = await response.json();
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!text) {
        throw new Error('Gemini API returned empty text response');
      }
      return text.trim();
    } finally {
      clearTimeout(timeout);
    }
  }
}

