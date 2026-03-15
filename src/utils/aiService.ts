export type AiProvider = 'openai' | 'anthropic' | 'gemini';

export interface ModelOption {
    value: string;
    label: string;
}

export const OPENAI_MODELS: ModelOption[] = [
    { value: 'gpt-4o',              label: 'GPT-4o' },
    { value: 'gpt-4o-mini',         label: 'GPT-4o mini' },
    { value: 'o1',                  label: 'o1' },
    { value: 'o1-mini',             label: 'o1 mini' },
    { value: 'o3-mini',             label: 'o3 mini' },
    { value: 'gpt-4-turbo',         label: 'GPT-4 Turbo' },
    { value: 'gpt-3.5-turbo',       label: 'GPT-3.5 Turbo' },
];

export const ANTHROPIC_MODELS: ModelOption[] = [
    { value: 'claude-opus-4-5',                 label: 'Claude Opus 4.5' },
    { value: 'claude-sonnet-4-5',               label: 'Claude Sonnet 4.5' },
    { value: 'claude-3-7-sonnet-20250219',       label: 'Claude 3.7 Sonnet' },
    { value: 'claude-3-5-haiku-20241022',        label: 'Claude 3.5 Haiku' },
    { value: 'claude-3-5-sonnet-20241022',       label: 'Claude 3.5 Sonnet' },
    { value: 'claude-3-opus-20240229',           label: 'Claude 3 Opus' },
    { value: 'claude-3-haiku-20240307',          label: 'Claude 3 Haiku' },
];

export const GEMINI_MODELS: ModelOption[] = [
    { value: 'gemini-2.5-pro-preview-03-25',  label: 'Gemini 2.5 Pro Preview' },
    { value: 'gemini-2.0-flash',              label: 'Gemini 2.0 Flash' },
    { value: 'gemini-2.0-flash-lite',         label: 'Gemini 2.0 Flash Lite' },
    { value: 'gemini-1.5-pro',                label: 'Gemini 1.5 Pro' },
    { value: 'gemini-1.5-flash',              label: 'Gemini 1.5 Flash' },
    { value: 'gemini-1.5-flash-8b',           label: 'Gemini 1.5 Flash 8B' },
];

export const DEFAULT_MODELS: Record<AiProvider, string> = {
    openai:    'gpt-4o-mini',
    anthropic: 'claude-3-5-haiku-20241022',
    gemini:    'gemini-2.0-flash',
};

export function getModelForProvider(provider: AiProvider): string {
    return localStorage.getItem(`ai_model_${provider}`)?.trim() || DEFAULT_MODELS[provider];
}

export interface AiAnalysisResult {
  provider: AiProvider;
  model: string;
  content: string;
}

const LOG_ANALYSIS_SYSTEM_PROMPT = `You are an expert Android developer and log analyst. Analyze the provided Android logcat logs and:
1. Identify errors, warnings, and crashes (with their root causes if possible)
2. Highlight any ANR (Application Not Responding) or OOM (Out of Memory) issues
3. List the top issues found, ranked by severity
4. Provide actionable suggestions to fix or investigate each issue
5. Note any patterns or recurring problems

Format your response with clear sections using markdown. Be concise but thorough.`;

export function getConfiguredProvider(): AiProvider | null {
    if (localStorage.getItem('ai_key_openai')?.trim()) return 'openai';
    if (localStorage.getItem('ai_key_anthropic')?.trim()) return 'anthropic';
    if (localStorage.getItem('ai_key_gemini')?.trim()) return 'gemini';
    return null;
}

export function hasAnyAiKey(): boolean {
    return getConfiguredProvider() !== null;
}

async function callOpenAI(key: string, logs: string): Promise<AiAnalysisResult> {
    const model = getModelForProvider('openai');
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${key}`,
        },
        body: JSON.stringify({
            model,
            messages: [
                { role: 'system', content: LOG_ANALYSIS_SYSTEM_PROMPT },
                { role: 'user', content: `Analyze these Android logcat logs:\n\n${logs}` },
            ],
            max_tokens: 2000,
            temperature: 0.3,
        }),
    });

    if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err?.error?.message || `OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    return {
        provider: 'openai',
        model,
        content: data.choices[0]?.message?.content || '',
    };
}

async function callAnthropic(key: string, logs: string): Promise<AiAnalysisResult> {
    const model = getModelForProvider('anthropic');
    const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'x-api-key': key,
            'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
            model,
            max_tokens: 2000,
            system: LOG_ANALYSIS_SYSTEM_PROMPT,
            messages: [
                { role: 'user', content: `Analyze these Android logcat logs:\n\n${logs}` },
            ],
        }),
    });

    if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err?.error?.message || `Anthropic API error: ${response.status}`);
    }

    const data = await response.json();
    return {
        provider: 'anthropic',
        model,
        content: data.content[0]?.text || '',
    };
}

async function callGemini(key: string, logs: string): Promise<AiAnalysisResult> {
    const model = getModelForProvider('gemini');
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`;
    const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            system_instruction: { parts: [{ text: LOG_ANALYSIS_SYSTEM_PROMPT }] },
            contents: [
                { role: 'user', parts: [{ text: `Analyze these Android logcat logs:\n\n${logs}` }] },
            ],
            generationConfig: { maxOutputTokens: 2000, temperature: 0.3 },
        }),
    });

    if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err?.error?.message || `Gemini API error: ${response.status}`);
    }

    const data = await response.json();
    return {
        provider: 'gemini',
        model,
        content: data.candidates?.[0]?.content?.parts?.[0]?.text || '',
    };
}

export async function analyzeLogs(logs: string): Promise<AiAnalysisResult> {
    const provider = getConfiguredProvider();
    if (!provider) throw new Error('No AI API key configured. Please add one in Settings.');

    const key = localStorage.getItem(`ai_key_${provider}`)!.trim();

    const MAX_CHARS = 12000;
    const truncated = logs.length > MAX_CHARS
        ? `[Showing last ${MAX_CHARS} chars of ${logs.length} total]\n...\n` + logs.slice(-MAX_CHARS)
        : logs;

    switch (provider) {
        case 'openai': return callOpenAI(key, truncated);
        case 'anthropic': return callAnthropic(key, truncated);
        case 'gemini': return callGemini(key, truncated);
    }
}
