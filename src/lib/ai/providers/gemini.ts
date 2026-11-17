import { ChatMessage, LLMProvider } from '../types';

export class GeminiProvider implements LLMProvider {
  readonly name = 'gemini';
  private apiKey: string;
  private model: string;

  constructor() {
    this.apiKey = process.env.GEMINI_API_KEY || '';
    this.model = process.env.GEMINI_MODEL || 'gemini-1.5-flash';
  }

  isAvailable(): boolean {
    return Boolean(this.apiKey && this.apiKey.trim().length > 0);
  }

  async generateResponse(systemPrompt: string, history: ChatMessage[], userMessage: string): Promise<string> {
    if (!this.isAvailable()) {
      throw new Error('GEMINI_API_KEY is not configured in environment variables');
    }

    const url = `https://generativelanguage.googleapis.com/v1beta/models/${this.model}:generateContent?key=${this.apiKey}`;

    // Format chat history for Gemini (roles: 'user' | 'model')
    const contents: Array<{ role: string; parts: Array<{ text: string }> }> = [];

    for (const msg of history) {
      if (msg.role === 'system') continue;
      contents.push({
        role: msg.role === 'user' ? 'user' : 'model',
        parts: [{ text: msg.content }],
      });
    }

    contents.push({
      role: 'user',
      parts: [{ text: userMessage }],
    });

    const body: Record<string, any> = {
      contents,
      generationConfig: {
        temperature: 0.3,
        maxOutputTokens: 1200,
      },
    };

    if (systemPrompt) {
      body.systemInstruction = {
        parts: [{ text: systemPrompt }],
      };
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 20000); // 20s timeout

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
        signal: controller.signal,
      });

      if (!response.ok) {
        const errorText = await response.text().catch(() => '');
        throw new Error(`Gemini API error [${response.status}]: ${errorText.slice(0, 200)}`);
      }

      const data = await response.json();
      const candidate = data.candidates?.[0];
      const text = candidate?.content?.parts?.[0]?.text;

      if (!text) {
        throw new Error('Gemini API returned empty text response');
      }

      return text.trim();
    } finally {
      clearTimeout(timeout);
    }
  }
}
