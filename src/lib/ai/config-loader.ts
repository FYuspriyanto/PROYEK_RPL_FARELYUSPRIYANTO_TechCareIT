/**
 * AI Config Loader
 * 
 * Reads AI provider configurations from the database (AiConfig table)
 * and creates DynamicProvider instances. Uses a simple time-based cache
 * so the DB is not hit on every single chat message.
 */
import { prisma } from '@/lib/prisma';
import { DynamicProvider, DynamicProviderConfig } from './providers/dynamic';
import { LLMProvider } from './types';

interface CachedConfigs {
  primary: DynamicProviderConfig | null;
  fallbacks: DynamicProviderConfig[];
  timestamp: number;
}

let cache: CachedConfigs | null = null;
const CACHE_TTL_MS = 30_000; // 30 seconds

/**
 * Load AI configs from the database. Returns the primary provider
 * and a list of fallback providers (all active configs that are not primary).
 */
export async function loadAiConfigs(): Promise<{
  primary: DynamicProviderConfig | null;
  fallbacks: DynamicProviderConfig[];
}> {
  const now = Date.now();
  if (cache && now - cache.timestamp < CACHE_TTL_MS) {
    return { primary: cache.primary, fallbacks: cache.fallbacks };
  }

  const configs = await prisma.aiConfig.findMany({
    where: { isActive: true },
    orderBy: [{ isPrimary: 'desc' }, { updatedAt: 'desc' }],
  });

  let primary: DynamicProviderConfig | null = null;
  const fallbacks: DynamicProviderConfig[] = [];

  for (const c of configs) {
    const cfg: DynamicProviderConfig = {
      providerSlug: c.providerSlug,
      providerName: c.providerName,
      apiKey: c.apiKey,
      model: c.model,
      baseUrl: c.baseUrl,
      maxTokens: c.maxTokens,
      temperature: c.temperature,
      timeoutMs: c.timeoutMs,
    };

    if (c.isPrimary && !primary) {
      primary = cfg;
    } else {
      fallbacks.push(cfg);
    }
  }

  cache = { primary, fallbacks, timestamp: now };
  return { primary, fallbacks };
}

/**
 * Build provider instances from the loaded configs.
 */
export async function buildProvidersFromConfig(): Promise<{
  primary: LLMProvider | null;
  fallbacks: LLMProvider[];
}> {
  const { primary, fallbacks } = await loadAiConfigs();

  return {
    primary: primary ? new DynamicProvider(primary) : null,
    fallbacks: fallbacks
      .map((c) => new DynamicProvider(c))
      .filter((p) => p.isAvailable()),
  };
}

/**
 * Invalidate the config cache. Call this after admin changes a config.
 */
export function invalidateAiConfigCache() {
  cache = null;
}

