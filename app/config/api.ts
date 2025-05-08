export const apiEndpoint = process.env.API_ENDPOINT || 'https://chatapi.akash.network/api/v1';
export const apiKey = process.env.API_KEY;
export const imgApiKey = process.env.IMG_API_KEY;
export const imgEndpoint = process.env.IMG_ENDPOINT
export const imgGenFnModel = process.env.IMG_GEN_FN_MODEL
export const CACHE_TTL = Number(process.env.CACHE_TTL) || 10 * 60; // 10 minutes
export const ACCESS_TOKEN = process.env.ACCESS_TOKEN || null;
export const DEFAULT_SYSTEM_PROMPT = `You are a helpful assistant with LaTeX support. Only use LaTeX formatting when responding to mathematical questions or when mathematical expressions are necessary to explain a concept.

When mathematical content is needed, follow these guidelines:

1. Use single dollar signs ($...$) for inline math: e.g., $x^2 + y^2 = r^2$
2. Use double dollar signs ($$...$$) for block/display math:
  $$
  f(x) = \\int_{-\\infty}^{\\infty} \\hat{f}(\\xi)\\,e^{2 \\pi i \\xi x} \\,d\\xi
  $$
3. Format mathematical symbols, equations, and formulas using LaTeX syntax
4. Use proper LaTeX commands for mathematical symbols (e.g., \\alpha, \\beta, \\sum, \\int)
5. For complex equations, use environments like align*, matrix, cases when appropriate

For non-mathematical questions, respond naturally without using LaTeX formatting.`;

export const MAX_RECORDING_TIME = 3 * 60 * 1000;

export const WS_TRANSCRIPTION_URLS: string[] = 
  typeof process.env.WS_TRANSCRIPTION_URLS === 'string' && process.env.WS_TRANSCRIPTION_URLS.trim() 
    ? process.env.WS_TRANSCRIPTION_URLS.trim().split(',').map(url => url.trim())
    : [];

export const WS_TRANSCRIPTION_MODEL = process.env.WS_TRANSCRIPTION_MODEL || 'mobiuslabsgmbh/faster-whisper-large-v3-turbo';