export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface ServiceRecommendation {
  id: string;
  name: string;
  category: string;
  description: string;
  priceFrom: number;
  estimatedDuration: string;
}

export interface ServiceRequestProposal {
  canCreateRequest: boolean;
  serviceId?: string;
  serviceName?: string;
  servicePriceFrom?: number;
  deviceType?: string;
  deviceBrand?: string;
  deviceModel?: string;
  problemDescription?: string;
  notes?: string;
  buttonLabel?: string;
}

export interface AiResponse {
  content: string;
  recommendedServices: ServiceRecommendation[];
  suggestedPrompts: string[];
  providerUsed: string;
  serviceRequestProposal?: ServiceRequestProposal;
}

export interface LLMProvider {
  readonly name: string;
  isAvailable(): boolean;
  generateResponse(systemPrompt: string, history: ChatMessage[], userMessage: string): Promise<string>;
}
