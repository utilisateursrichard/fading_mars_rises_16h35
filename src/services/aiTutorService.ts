/**
 * BETTERSCHOOL — MOTEUR D'ORCHESTRATION DU TUTEUR IA MULTI-PROVIDERS
 * 
 * Basé STRICTEMENT sur l'annuaire "Awesome Free LLM APIs" (freellm.net).
 * Tous les modèles, endpoints, IDs et limites proviennent du tableau officiel du guide.
 * Intègre un mécanisme de repli (fallback cascade) ordonné par réputation avec tolérance aux pannes.
 */

export interface LLMMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export type LLMTier = 1 | 2 | 3 | 'local';

export interface LLMProviderConfig {
  id: string;
  name: string;
  tier: LLMTier;
  reputationRank: number; // Ordre de priorité de la cascade de repli
  baseUrl: string;
  model: string;
  envKeyName: string;
  rateLimit: string;
  websiteUrl: string;
  requiresKey: boolean;
  isOpenAICompatible: boolean;
  customHeaders?: (apiKey: string) => Record<string, string>;
  customBody?: (messages: LLMMessage[], model: string) => any;
  customExtract?: (json: any) => string;
}

export interface TutorResponse {
  text: string;
  providerId: string;
  providerName: string;
  modelUsed: string;
  tier: LLMTier;
  latencyMs: number;
  fallbackChain: Array<{ providerId: string; providerName: string; error: string }>;
  isZeroDowntimeFallback: boolean;
}

export interface StudentContextData {
  studentName?: string;
  studentClass?: string;
  schoolName?: string;
  currentCourses?: string[];
  pendingHomeworks?: Array<{ title: string; subject: string; dueDate: string }>;
  recentGrades?: Array<{ subject: string; grade: number; max: number }>;
}

// ==============================================================================
// 🏆 REGISTRE OFFICIEL DES PROVIDERS GRATUITS (STRICTEMENT BASÉ SUR LE README)
// ==============================================================================
export const LLM_PROVIDERS_REGISTRY: LLMProviderConfig[] = [
  // ----------------------------------------------------------------------------
  // TIER 1 : LEADERS FRONTIÈRE & INFRASTRUCTURES MAJEURES
  // ----------------------------------------------------------------------------
  {
    id: 'google-gemini',
    name: 'Google Gemini',
    tier: 1,
    reputationRank: 1,
    baseUrl: 'https://generativelanguage.googleapis.com/v1beta/models',
    model: 'gemini-3.7-flash', // Directement issu du tableau "Best Free Models"
    envKeyName: 'VITE_GEMINI_API_KEY',
    rateLimit: '15 RPM, 1,500 RPD, 1M context',
    websiteUrl: 'https://aistudio.google.com/app/apikey',
    requiresKey: true,
    isOpenAICompatible: false,
    customBody: (messages) => {
      const systemInstruction = messages.find(m => m.role === 'system')?.content || '';
      const conversation = messages
        .filter(m => m.role !== 'system')
        .map(m => ({
          role: m.role === 'user' ? 'user' : 'model',
          parts: [{ text: m.content }]
        }));

      return {
        contents: conversation,
        ...(systemInstruction ? {
          systemInstruction: { parts: [{ text: systemInstruction }] }
        } : {}),
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 2048,
        }
      };
    },
    customExtract: (json) => {
      return json?.candidates?.[0]?.content?.parts?.[0]?.text || '';
    }
  },
  {
    id: 'groq',
    name: 'Groq',
    tier: 1,
    reputationRank: 2,
    baseUrl: 'https://api.groq.com/openai/v1',
    model: 'llama-3.3-70b-versatile', // Issu du Quick Start & 262K context
    envKeyName: 'VITE_GROQ_API_KEY',
    rateLimit: '30 RPM, 14,400 RPD',
    websiteUrl: 'https://console.groq.com/keys',
    requiresKey: true,
    isOpenAICompatible: true
  },
  {
    id: 'nvidia-nim',
    name: 'NVIDIA NIM',
    tier: 1,
    reputationRank: 3,
    baseUrl: 'https://integrate.api.nvidia.com/v1',
    model: 'z-ai/glm-5.2', // Best Free Model NVIDIA dans le tableau (1M context)
    envKeyName: 'VITE_NVIDIA_NIM_API_KEY',
    rateLimit: 'Up to 40 RPM, 1M context',
    websiteUrl: 'https://build.nvidia.com/settings/api-keys',
    requiresKey: true,
    isOpenAICompatible: true
  },
  {
    id: 'mistral-ai',
    name: 'Mistral AI',
    tier: 1,
    reputationRank: 4,
    baseUrl: 'https://api.mistral.ai/v1',
    model: 'open-mistral-7b', // Best Free Model Mistral AI dans le tableau
    envKeyName: 'VITE_MISTRAL_API_KEY',
    rateLimit: '~1 RPS, 500K TPM',
    websiteUrl: 'https://console.mistral.ai/api-keys',
    requiresKey: true,
    isOpenAICompatible: true
  },
  {
    id: 'openrouter',
    name: 'OpenRouter',
    tier: 1,
    reputationRank: 5,
    baseUrl: 'https://openrouter.ai/api/v1',
    model: 'nvidia/nemotron-3-ultra-550b-a55b:free', // Best Free Model OpenRouter (1M context)
    envKeyName: 'VITE_OPENROUTER_API_KEY',
    rateLimit: 'Free tier 1M tokens',
    websiteUrl: 'https://openrouter.ai/workspaces/default/keys',
    requiresKey: true,
    isOpenAICompatible: true,
    customHeaders: (key) => ({
      'Authorization': `Bearer ${key}`,
      'HTTP-Referer': 'https://betterschool.app',
      'X-Title': 'BetterSchool AI Tutor'
    })
  },
  {
    id: 'github-models',
    name: 'GitHub Models',
    tier: 1,
    reputationRank: 6,
    baseUrl: 'https://models.github.ai/inference',
    model: 'Phi-4', // Best Free Model GitHub Models dans le tableau (131K context)
    envKeyName: 'VITE_GITHUB_MODELS_API_KEY',
    rateLimit: 'Gratuit compte GitHub, 131K context',
    websiteUrl: 'https://github.com/marketplace/models',
    requiresKey: true,
    isOpenAICompatible: true
  },
  {
    id: 'cerebras',
    name: 'Cerebras',
    tier: 1,
    reputationRank: 7,
    baseUrl: 'https://api.cerebras.ai/v1',
    model: 'llama3.1-70b', // Best Free Model Cerebras dans le tableau
    envKeyName: 'VITE_CEREBRAS_API_KEY',
    rateLimit: '10 RPM, 100 RPD, 1M TPD',
    websiteUrl: 'https://cloud.cerebras.ai/',
    requiresKey: true,
    isOpenAICompatible: true
  },
  {
    id: 'cohere',
    name: 'Cohere',
    tier: 1,
    reputationRank: 8,
    baseUrl: 'https://api.cohere.com/v2',
    model: 'command-a-218b', // Best Free Model Cohere dans le tableau
    envKeyName: 'VITE_COHERE_API_KEY',
    rateLimit: '20 RPM, 128K context',
    websiteUrl: 'https://dashboard.cohere.com/api-keys',
    requiresKey: true,
    isOpenAICompatible: true
  },
  {
    id: 'deepseek',
    name: 'DeepSeek',
    tier: 1,
    reputationRank: 9,
    baseUrl: 'https://api.deepseek.com/v1',
    model: 'deepseek-chat-v3-2', // Best Free Model DeepSeek dans le tableau (128K)
    envKeyName: 'VITE_DEEPSEEK_API_KEY',
    rateLimit: 'Dynamic tiers, 128K context',
    websiteUrl: 'https://platform.deepseek.com/api_keys',
    requiresKey: true,
    isOpenAICompatible: true
  },
  {
    id: 'xai',
    name: 'xAI',
    tier: 1,
    reputationRank: 10,
    baseUrl: 'https://api.x.ai/v1',
    model: 'grok-4-3', // Best Free Model xAI dans le tableau (1M context)
    envKeyName: 'VITE_XAI_API_KEY',
    rateLimit: 'Credit-based, 1M context',
    websiteUrl: 'https://console.x.ai',
    requiresKey: true,
    isOpenAICompatible: true
  },

  // ----------------------------------------------------------------------------
  // TIER 2 : HAUTE DISPONIBILITÉ & FOURNISSEURS CLOUD ÉPROUVÉS
  // ----------------------------------------------------------------------------
  {
    id: 'sambanova',
    name: 'SambaNova',
    tier: 2,
    reputationRank: 11,
    baseUrl: 'https://api.sambanova.ai/v1',
    model: 'deepseek-v3-1', // Best Free Model SambaNova dans le tableau
    envKeyName: 'VITE_SAMBANOVA_API_KEY',
    rateLimit: '20 RPM, 20 RPD, 200K TPD',
    websiteUrl: 'https://cloud.sambanova.ai/apis',
    requiresKey: true,
    isOpenAICompatible: true
  },
  {
    id: 'modelscope',
    name: 'ModelScope',
    tier: 2,
    reputationRank: 12,
    baseUrl: 'https://api-inference.modelscope.cn/v1',
    model: 'MiniMax/MiniMax-M2.5', // Best Free Model ModelScope dans le tableau
    envKeyName: 'VITE_MODELSCOPE_API_KEY',
    rateLimit: '2,000 RPD total, 204K context',
    websiteUrl: 'https://modelscope.cn/my/myaccesstoken',
    requiresKey: true,
    isOpenAICompatible: true
  },
  {
    id: 'alibaba-cloud',
    name: 'Alibaba Cloud Model Studio',
    tier: 2,
    reputationRank: 13,
    baseUrl: 'https://dashscope-intl.aliyuncs.com/compatible-mode/v1',
    model: 'qwen3-max', // Best Free Model Alibaba Cloud dans le tableau
    envKeyName: 'VITE_ALIBABA_DASHSCOPE_API_KEY',
    rateLimit: 'Tiered by region, 128K context',
    websiteUrl: 'https://bailian.console.alibabacloud.com/?apiKey=1',
    requiresKey: true,
    isOpenAICompatible: true
  },
  {
    id: 'huggingface',
    name: 'Hugging Face',
    tier: 2,
    reputationRank: 14,
    baseUrl: 'https://router.huggingface.co/v1',
    model: 'meta-llama-3-1-8b-instruct', // Best Free Model Hugging Face dans le tableau
    envKeyName: 'VITE_HUGGINGFACE_API_KEY',
    rateLimit: 'Credit-metered, 128K context',
    websiteUrl: 'https://huggingface.co/settings/tokens',
    requiresKey: true,
    isOpenAICompatible: true
  },
  {
    id: 'cloudflare',
    name: 'Cloudflare Workers AI',
    tier: 2,
    reputationRank: 15,
    baseUrl: 'https://api.cloudflare.com/client/v4/accounts',
    model: '@cf/mistral/mistral-7b-instruct-v0.1', // Best Free Model Cloudflare dans le tableau
    envKeyName: 'VITE_CLOUDFLARE_API_KEY',
    rateLimit: '10K neurons/day shared',
    websiteUrl: 'https://dash.cloudflare.com/profile/api-tokens',
    requiresKey: true,
    isOpenAICompatible: false,
    customBody: (messages) => ({
      messages: messages.map(m => ({ role: m.role, content: m.content }))
    }),
    customExtract: (json) => json?.result?.response || ''
  },
  {
    id: 'z-ai',
    name: 'Z AI (Zhipu AI)',
    tier: 2,
    reputationRank: 16,
    baseUrl: 'https://open.bigmodel.cn/api/paas/v4',
    model: 'glm-4.7-flash', // Best Free Model Z AI dans le tableau (200K context)
    envKeyName: 'VITE_ZHIPU_API_KEY',
    rateLimit: '1 concurrent request, 200K context',
    websiteUrl: 'https://open.bigmodel.cn/usercenter/apikeys',
    requiresKey: true,
    isOpenAICompatible: true
  },
  {
    id: 'ai21',
    name: 'AI21 Labs',
    tier: 2,
    reputationRank: 17,
    baseUrl: 'https://api.ai21.com/studio/v1',
    model: 'jamba-large-1-7', // Best Free Model AI21 Labs dans le tableau
    envKeyName: 'VITE_AI21_API_KEY',
    rateLimit: '200 RPM, 10 RPS, 256K context',
    websiteUrl: 'https://studio.ai21.com/account/api-key',
    requiresKey: true,
    isOpenAICompatible: true
  },
  {
    id: 'chutes-ai',
    name: 'Chutes.ai',
    tier: 2,
    reputationRank: 18,
    baseUrl: 'https://api.chutes.ai/v1',
    model: 'deepseek-ai/DeepSeek-R1', // Best Free Model Chutes.ai dans le tableau
    envKeyName: 'VITE_CHUTES_API_KEY',
    rateLimit: 'Community-powered, 131K context',
    websiteUrl: 'https://chutes.ai/',
    requiresKey: true,
    isOpenAICompatible: true
  },
  {
    id: 'glhf-chat',
    name: 'Glhf.chat',
    tier: 2,
    reputationRank: 19,
    baseUrl: 'https://glhf.chat/api/openai/v1',
    model: 'meta-llama/Meta-Llama-3.1-70B-Instruct', // Best Free Model Glhf.chat dans le tableau
    envKeyName: 'VITE_GLHF_API_KEY',
    rateLimit: 'Unlimited for free models, 131K context',
    websiteUrl: 'https://glhf.chat/',
    requiresKey: true,
    isOpenAICompatible: true
  },

  // ----------------------------------------------------------------------------
  // TIER 3 : GATEWAYS COMMUNAUTAIRES & ALTERNATIFS
  // ----------------------------------------------------------------------------
  {
    id: 'llm7-io',
    name: 'LLM7.io',
    tier: 3,
    reputationRank: 20,
    baseUrl: 'https://api.llm7.io/v1',
    model: 'gpt-oss-20b', // Best Free Model LLM7.io dans le tableau
    envKeyName: 'VITE_LLM7_API_KEY',
    rateLimit: '10 RPM, 60 req/hr, 128K context',
    websiteUrl: 'https://token.llm7.io',
    requiresKey: true,
    isOpenAICompatible: true
  },
  {
    id: 'siliconflow',
    name: 'SiliconFlow',
    tier: 3,
    reputationRank: 21,
    baseUrl: 'https://api.siliconflow.cn/v1',
    model: 'abbreviation', // Best Free Model SiliconFlow dans le tableau
    envKeyName: 'VITE_SILICONFLOW_API_KEY',
    rateLimit: '30 RPM, 60K TPM, 131K context',
    websiteUrl: 'https://cloud.siliconflow.cn/account/ak',
    requiresKey: true,
    isOpenAICompatible: true
  },
  {
    id: 'ovhcloud',
    name: 'OVHcloud AI Endpoints',
    tier: 3,
    reputationRank: 22,
    baseUrl: 'https://oai.endpoints.kepler.ai.cloud.ovh.net/v1',
    model: 'qwen3.5-397b-a17b', // Best Free Model OVHcloud dans le tableau
    envKeyName: 'VITE_OVHCLOUD_API_KEY',
    rateLimit: '2 RPM (anonymous), 131K context',
    websiteUrl: 'https://www.ovhcloud.com/en/public-cloud/ai-endpoints/catalog/',
    requiresKey: true,
    isOpenAICompatible: true
  },
  {
    id: 'kilo-code',
    name: 'Kilo Code',
    tier: 3,
    reputationRank: 23,
    baseUrl: 'https://api.kilo.ai/api/gateway',
    model: 'nvidia/nemotron-3-ultra-550b-a55b:free', // Best Free Model Kilo Code dans le tableau
    envKeyName: 'VITE_KILO_API_KEY',
    rateLimit: '200 req/hr, 1M context',
    websiteUrl: 'https://app.kilo.ai/profile',
    requiresKey: true,
    isOpenAICompatible: true
  },
  {
    id: 'opencode-zen',
    name: 'OpenCode Zen',
    tier: 3,
    reputationRank: 24,
    baseUrl: 'https://opencode.ai/zen/v1',
    model: 'big-pickle', // Best Free Model OpenCode Zen dans le tableau
    envKeyName: 'VITE_OPENCODE_API_KEY',
    rateLimit: 'Registration tier, 1M context',
    websiteUrl: 'https://opencode.ai/auth',
    requiresKey: true,
    isOpenAICompatible: true
  },
  {
    id: 'nscale',
    name: 'Nscale',
    tier: 3,
    reputationRank: 25,
    baseUrl: 'https://inference.api.nscale.com/v1',
    model: 'llama-3-3-70b-instruct', // Best Free Model Nscale dans le tableau
    envKeyName: 'VITE_NSCALE_API_KEY',
    rateLimit: 'Fair-use, 128K context',
    websiteUrl: 'https://console.nscale.com/',
    requiresKey: true,
    isOpenAICompatible: true
  },
  {
    id: 'nebius',
    name: 'Nebius',
    tier: 3,
    reputationRank: 26,
    baseUrl: 'https://api.studio.nebius.com/v1',
    model: 'qwen3-235b-a22b', // Best Free Model Nebius dans le tableau
    envKeyName: 'VITE_NEBIUS_API_KEY',
    rateLimit: 'Tier-based, 128K context',
    websiteUrl: 'https://studio.nebius.com/settings/api-keys',
    requiresKey: true,
    isOpenAICompatible: true
  },
  {
    id: 'aion-labs',
    name: 'Aion Labs',
    tier: 3,
    reputationRank: 27,
    baseUrl: 'https://api.aionlabs.ai/v1',
    model: 'aion-labs-aion-2-0', // Best Free Model Aion Labs dans le tableau
    envKeyName: 'VITE_AION_API_KEY',
    rateLimit: '15 RPM, 20K TPD, 128K context',
    websiteUrl: 'https://www.aionlabs.ai/app/api-keys/',
    requiresKey: true,
    isOpenAICompatible: true
  },
  {
    id: 'agnes-ai',
    name: 'Agnes AI',
    tier: 3,
    reputationRank: 28,
    baseUrl: 'https://apihub.agnes-ai.com/v1',
    model: 'agnes-1.5-flash', // Best Free Model Agnes AI dans le tableau
    envKeyName: 'VITE_AGNES_API_KEY',
    rateLimit: '30 RPM, 256K context',
    websiteUrl: 'https://platform.agnes-ai.com/settings/apiKeys',
    requiresKey: true,
    isOpenAICompatible: true
  },
  {
    id: 'ollama-cloud',
    name: 'Ollama Cloud',
    tier: 3,
    reputationRank: 29,
    baseUrl: 'https://ollama.com/api',
    model: 'deepseek-v4-pro', // Best Free Model Ollama Cloud dans le tableau
    envKeyName: 'VITE_OLLAMA_CLOUD_API_KEY',
    rateLimit: 'Session/weekly limits, 1M context',
    websiteUrl: 'https://ollama.com/settings/keys',
    requiresKey: true,
    isOpenAICompatible: true
  },
  {
    id: 'grok-xai',
    name: 'Grok (xAI)',
    tier: 3,
    reputationRank: 30,
    baseUrl: 'https://api.x.ai/v1',
    model: 'grok-2', // Best Free Model Grok (xAI) dans le tableau ($25/month credits)
    envKeyName: 'VITE_GROK_XAI_API_KEY',
    rateLimit: '$25/month free credits, 131K context',
    websiteUrl: 'https://console.x.ai/',
    requiresKey: true,
    isOpenAICompatible: true
  },
  {
    id: 'cline',
    name: 'Cline',
    tier: 3,
    reputationRank: 31,
    baseUrl: 'https://api.cline.bot/v1',
    model: 'deepseek/deepseek-v4-flash', // Best Free Model Cline dans le tableau
    envKeyName: 'VITE_CLINE_API_KEY',
    rateLimit: 'Registration tier',
    websiteUrl: 'https://cline.bot',
    requiresKey: true,
    isOpenAICompatible: true
  },
  // ----------------------------------------------------------------------------
  // LOCAL / SELF-HOSTED (Ollama / LM Studio)
  // ----------------------------------------------------------------------------
  {
    id: 'local-ollama',
    name: 'Ollama Local / Self-Hosted',
    tier: 'local',
    reputationRank: 32,
    baseUrl: 'http://localhost:11434/v1',
    model: 'llama3.2',
    envKeyName: 'VITE_LOCAL_OLLAMA_URL',
    rateLimit: 'Illimité (Sur votre machine, 100% privé)',
    websiteUrl: 'https://ollama.com',
    requiresKey: false,
    isOpenAICompatible: true
  }
];

// Validation stricte des clés API (ignore les chaînes vides, 'FALSE', 'null', 'undefined', etc.)
export const isInvalidApiKey = (val: unknown): boolean => {
  if (typeof val !== 'string') return true;
  const trimmed = val.trim();
  if (!trimmed || trimmed === '""' || trimmed === "''") return true;
  const upper = trimmed.toUpperCase();
  if (upper === 'FALSE' || upper === 'NONE' || upper === 'NULL' || upper === 'UNDEFINED') return true;
  if (trimmed.length < 5) return true; // Une vraie clé API comporte au moins 5 caractères
  return false;
};

// Helper pour récupérer la clé API valide d'un provider
export const getProviderApiKey = (provider: LLMProviderConfig): string => {
  // 1. Clé stockée dans localStorage si modifiée en direct dans l'interface
  try {
    const customKeys = JSON.parse(localStorage.getItem('betterschool_tutor_api_keys') || '{}');
    const customVal = customKeys[provider.id];
    if (!isInvalidApiKey(customVal)) {
      return customVal.trim();
    }
  } catch {
    // Ignore localStorage parse errors
  }

  // 2. Clé importée depuis .env.api via import.meta.env
  const envObj = (import.meta as any).env || {};
  const envVal = envObj[provider.envKeyName];
  if (!isInvalidApiKey(envVal)) {
    return envVal.trim();
  }

  return '';
};

// Vérifie si un provider est prêt à être interrogé (skip si clé vide ou égale à "FALSE")
export const isProviderConfigured = (provider: LLMProviderConfig): boolean => {
  if (provider.id === 'local-ollama') {
    const envObj = (import.meta as any).env || {};
    const localUrl = envObj.VITE_LOCAL_OLLAMA_URL;
    if (isInvalidApiKey(localUrl)) {
      return false;
    }
    return true;
  }

  const key = getProviderApiKey(provider);
  if (isInvalidApiKey(key)) {
    return false;
  }

  return true;
};

// ==============================================================================
// 🧠 CONSTRUCTEUR D'INVITE SYSTÈME PÉDAGOGIQUE
// ==============================================================================
export const buildSystemPrompt = (context?: StudentContextData): string => {
  const studentFirst = context?.studentName || 'l’élève';
  const studentClass = context?.studentClass || 'Lycée';
  const schoolName = context?.schoolName || 'BetterSchool';

  let prompt = `Tu es le Tuteur IA officiel et bienveillant de BetterSchool pour ${studentFirst} (${studentClass} à ${schoolName}).
Ton objectif fondamental est de faire progresser l'élève avec méthode, clarté et bienveillance.

RÈGLES D'OR PÉDAGOGIQUES :
1. PÉDAGOGIE ACTIVE & MÉTHODE SOCRATIQUE :
   Ne donne pas immédiatement la réponse brute aux devoirs ou exercices. Guide l'élève pas à pas : pose une question intermédiaire, rappelle la formule clé ou découpe le problème en sous-étapes simples.
2. EXCELLENCE DU FRANÇAIS & STRUCTURE :
   Réponds toujours dans un français impeccable, aéré et clair.
   Utilise le gras pour faire ressortir les mots-clés, des puces à tirets ou numérotées, et des encadrés conceptuels si nécessaire.
3. ADAPTATION AU NIVEAU SCOLAIRE :
   Adapte le vocabulaire et les démonstrations au niveau ${studentClass} (programmes officiels français).
4. ENCOURAGEMENT :
   Sois toujours positif, motivant et valorisant face à l'effort de l'élève.
5. CODE ET MATHÉMATIQUES :
   Formate les calculs ou le code proprement (blocs de code avec syntaxe claire).`;

  if (context?.pendingHomeworks && context.pendingHomeworks.length > 0) {
    const hwSummary = context.pendingHomeworks
      .slice(0, 4)
      .map(h => `- [${h.subject}] ${h.title} (échéance : ${h.dueDate})`)
      .join('\n');
    prompt += `\n\nDEVOIRS EN COURS DE L'ÉLÈVE :\n${hwSummary}`;
  }

  if (context?.currentCourses && context.currentCourses.length > 0) {
    prompt += `\n\nMATIÈRES ÉTUDIÉES : ${context.currentCourses.join(', ')}`;
  }

  return prompt;
};

// ==============================================================================
// 🛡️ MOTEUR LOCAL DE SECOURS PÉDAGOGIQUE (ZÉRO DOWNTIME ABSOLU)
// ==============================================================================
const generateZeroDowntimeFallbackResponse = (
  userMessage: string,
  context?: StudentContextData
): string => {
  const lower = userMessage.toLowerCase();
  const name = context?.studentName || '';

  if (lower.includes('math') || lower.includes('tvi') || lower.includes('dérivé') || lower.includes('continuité') || lower.includes('fonction') || lower.includes('intégrale')) {
    return `Bonjour ${name} ! Voici une fiche méthodologique pour aborder ce point en **Mathématiques** :

### 📐 Démarche Pas-à-Pas :
1. **Domaine de définition & Continuité** :
   Assure-toi que ta fonction $f$ est définie et continue sur l'intervalle $I=[a, b]$. C'est le prérequis indispensable.
2. **Calcul de la dérivée $f'(x)$** :
   Calcule soigneusement la dérivée et étudie son signe pour déterminer les variations.
3. **Théorème des Valeurs Intermédiaires (TVI) / Corollaire** :
   - Si $f$ est **continue** et **strictement monotone** sur $[a, b]$, alors pour tout réel $k$ compris entre $f(a)$ et $f(b)$, l'équation $f(x) = k$ admet une **unique solution** $\\alpha \\in [a, b]$.
   - Pense à toujours bien citer les 3 conditions : *continuité*, *stricte monotonie*, et *encadrement de $k$*.

💡 *Quelle est la fonction exacte sur laquelle tu travailles ? Envoie-moi l'énoncé, et nous la résoudrons ensemble étape par étape !*`;
  }

  if (lower.includes('science') || lower.includes('investigation') || lower.includes('physique') || lower.includes('chimie') || lower.includes('svt')) {
    return `Bonjour ${name} ! La **démarche d'investigation** en Sciences repose sur un protocole rigoureux en 5 phases clés :

1. **La Situation-Problème** : Observer un phénomène ou un paradoxe et formuler le problème scientifique à résoudre.
2. **L'Hypothèse** : Proposer une explication plausible et testable (*"Si..., alors..."*).
3. **L'Expérimentation ou Modélisation** : Concevoir un protocole expérimental précis avec témoins et variables contrôlées.
4. **L'Analyse des Résultats** : Relever les mesures, tracer les graphiques et interpréter les écarts.
5. **La Conclusion & Synthèse** : Valider ou réfuter l'hypothèse initiale et ouvrir sur de nouvelles perspectives.

🔬 *Sur quelle expérience ou notion scientifique portes-tu ton analyse aujourd'hui ?*`;
  }

  if (lower.includes('philo') || lower.includes('heidegger') || lower.includes('technique') || lower.includes('nature') || lower.includes('dissertation')) {
    return `Excellente question de réflexion philosophique ${name} !

### 🏛️ Axe d'analyse : La Technique et l'Arraisonnement
Chez Martin Heidegger (*La Question de la technique*, 1954) :
- **L'essence de la technique** n'est pas simplement un ensemble d'outils neutres (conception instrumentale).
- Elle est un mode de dévoilement particulier du réel, qu'il nomme le **Gestell** (*arraisonnement* ou *dispositif*).
- **Le danger** : La nature et l'homme ne sont plus perçus comme des fins en soi, mais comme un **fonds disponible** (*Bestand*), une réserve d'énergie à optimiser et exploiter.

### 📝 Piste pour ta dissertation :
- **Thèse** : La technique comme libération de la contrainte naturelle.
- **Antithèse** : Le risque de réduction de l'homme et du vivant à de simples ressources arraisonnées.
- **Dépassement** : Vers une éthique de la responsabilité (Hans Jonas) et un usage réfléchi de l'innovation.

Quel est le sujet précis de ton devoir ? Nous pouvons bâtir le plan ensemble !`;
  }

  if (lower.includes('révis') || lower.includes('planning') || lower.includes('méthode') || lower.includes('ds') || lower.includes('bac')) {
    return `Bonjour ${name} ! Pour réviser efficacement tes prochains devoirs surveillés sans stress, voici la méthode de travail recommandée :

### 🎯 Méthode des 3 Paliers :
1. **J-7 à J-4 : Consolidation Active (Compréhension)** :
   - Relis le cours stylo en main. Écris une **fiche mémo** synthétique (définitions clés, pièges fréquents, formules encadrées).
   - Teste ta mémoire par restitution blanche (*Flashcards* ou feuille blanche).
2. **J-3 à J-2 : Entraînement en Situation Réelle** :
   - Fais 2 ou 3 exercices types "Type DS" en te chronométrant, sans regarder le corrigé.
   - Note sur une feuille rouge les erreurs commises pour ne plus les reproduire.
3. **J-1 : Vue d'ensemble & Sérénité** :
   - Relis uniquement ta fiche mémo et ta liste de pièges.
   - Couche-toi tôt : 80% de la consolidation mnésique se produit pendant le sommeil paradoxal !

Quelles sont les matières prioritaires que tu dois préparer cette semaine ?`;
  }

  return `Bonjour ${name} ! Bien reçu ta question.

Je suis ton tuteur BetterSchool et je suis prêt à t'accompagner pas à pas. Pour que nous soyons le plus efficace possible :
- S'il s'agit d'un **exercice ou d'un devoir**, dis-moi où tu bloques précisément et ce que tu as déjà tenté.
- S'il s'agit d'une **notion de cours**, indique-moi le chapitre pour que je t'explique le principe avec une analogie simple et des exemples.

À quel sujet ou devoir souhaites-tu que nous nous attaquions maintenant ?`;
};

// ==============================================================================
// 🚀 ORCHESTRATEUR PRINCIPAL DU TUTEUR IA (CASCADE DE FALLBACK)
// ==============================================================================
export class AITutorService {
  private static TIMEOUT_MS = 12000; // 12 secondes max par provider avant bascule

  /**
   * Envoie la requête au meilleur provider disponible avec cascade de fallback
   */
  static async queryTutor(
    messages: LLMMessage[],
    context?: StudentContextData
  ): Promise<TutorResponse> {
    const startTime = performance.now();
    const fallbackChain: Array<{ providerId: string; providerName: string; error: string }> = [];

    // 1. Préparer l'historique complet avec l'invite système actualisée
    const systemContent = buildSystemPrompt(context);
    const fullMessages: LLMMessage[] = [
      { role: 'system', content: systemContent },
      ...messages.filter(m => m.role !== 'system')
    ];

    // 2. Identifier la liste ordonnée des providers configurés
    const configuredProviders = LLM_PROVIDERS_REGISTRY
      .filter(p => isProviderConfigured(p))
      .sort((a, b) => a.reputationRank - b.reputationRank);

    // 3. Tenter chaque provider dans l'ordre de réputation
    for (const provider of configuredProviders) {
      try {
        const apiKey = getProviderApiKey(provider);
        const replyText = await this.callProvider(provider, apiKey, fullMessages);

        if (replyText && replyText.trim().length > 0) {
          const latencyMs = Math.round(performance.now() - startTime);
          return {
            text: replyText.trim(),
            providerId: provider.id,
            providerName: provider.name,
            modelUsed: provider.model,
            tier: provider.tier,
            latencyMs,
            fallbackChain,
            isZeroDowntimeFallback: false
          };
        }
      } catch (err: any) {
        const errMsg = err?.message || 'Erreur inconnue';
        fallbackChain.push({
          providerId: provider.id,
          providerName: provider.name,
          error: errMsg
        });
        console.warn(`[BetterSchool AI Tutor] Repli depuis ${provider.name}: ${errMsg}`);
      }
    }

    // 4. SI AUCUNE CLÉ N'EST CONFIGURÉE OU QUE TOUS LES PROVIDERS ONT ÉCHOUÉ :
    // Activation du Moteur Pédagogique Résilient (ZÉRO DOWNTIME GARANTI)
    const userLastMessage = messages.filter(m => m.role === 'user').pop()?.content || '';
    const fallbackReply = generateZeroDowntimeFallbackResponse(userLastMessage, context);
    const latencyMs = Math.round(performance.now() - startTime);

    return {
      text: fallbackReply,
      providerId: 'local-resilient-engine',
      providerName: 'Moteur Pédagogique Résilient (Zéro Downtime)',
      modelUsed: 'Système Haute Disponibilité BetterSchool',
      tier: 'local',
      latencyMs,
      fallbackChain,
      isZeroDowntimeFallback: true
    };
  }

  /**
   * Appelle un provider spécifique avec timeout et gestion d'erreur stricte
   */
  private static async callProvider(
    provider: LLMProviderConfig,
    apiKey: string,
    messages: LLMMessage[]
  ): Promise<string> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.TIMEOUT_MS);

    try {
      // Cas spécifique 1 : Google Gemini natif
      if (provider.id === 'google-gemini') {
        const url = `${provider.baseUrl}/${provider.model}:generateContent?key=${apiKey}`;
        const bodyPayload = provider.customBody ? provider.customBody(messages, provider.model) : {};

        const res = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(bodyPayload),
          signal: controller.signal
        });

        if (!res.ok) {
          const errBody = await res.text().catch(() => '');
          throw new Error(`HTTP ${res.status}: ${res.statusText || errBody.slice(0, 100)}`);
        }

        const data = await res.json();
        const extracted = provider.customExtract ? provider.customExtract(data) : '';
        if (!extracted) throw new Error('Format de réponse Gemini inattendu');
        return extracted;
      }

      // Cas standard : OpenAI-compatible endpoints
      const url = provider.baseUrl.endsWith('/chat/completions') 
        ? provider.baseUrl 
        : `${provider.baseUrl}/chat/completions`;

      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
        ...(provider.customHeaders ? provider.customHeaders(apiKey) : {})
      };

      const body = {
        model: provider.model,
        messages: messages.map(m => ({ role: m.role, content: m.content })),
        temperature: 0.7,
        max_tokens: 1500
      };

      const res = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify(body),
        signal: controller.signal
      });

      if (!res.ok) {
        const errBody = await res.text().catch(() => '');
        throw new Error(`HTTP ${res.status}: ${res.statusText || errBody.slice(0, 100)}`);
      }

      const data = await res.json();
      const content = data?.choices?.[0]?.message?.content;
      if (!content) {
        throw new Error('Réponse vide ou format OpenAI incompatible');
      }

      return content;
    } finally {
      clearTimeout(timeoutId);
    }
  }

  /**
   * Sauvegarde une clé pour un provider dans le navigateur (pour tests immédiats)
   */
  static saveCustomKey(providerId: string, key: string): void {
    try {
      const keys = JSON.parse(localStorage.getItem('betterschool_tutor_api_keys') || '{}');
      if (!key.trim()) {
        delete keys[providerId];
      } else {
        keys[providerId] = key.trim();
      }
      localStorage.setItem('betterschool_tutor_api_keys', JSON.stringify(keys));
    } catch (err) {
      console.error('Erreur de sauvegarde locale de la clé API:', err);
    }
  }
}
