// AI agents, grouped by what their visit means for Holly.
//   live      A person asked an AI a question just now, and it opened her page
//             to answer. The closest thing to "an AI recommended her" that can
//             be measured.
//   search    An AI search index. What ChatGPT search, Perplexity and Claude
//             cite from later.
//   training  Model-training crawls. Slow, background, not tied to a question.
// Matched on the name each agent announces in its user agent. Anyone can claim
// these names, so they are counts, not proof. Used by middleware.js (records
// the visit) and api/admin.js (the desk's Stats tab).
export const AI_AGENTS = [
  { key: 'chatgpt-user', label: 'ChatGPT', kind: 'live', ua: /ChatGPT-User/i },
  { key: 'claude-user', label: 'Claude', kind: 'live', ua: /Claude-User/i },
  { key: 'perplexity-user', label: 'Perplexity', kind: 'live', ua: /Perplexity-User/i },
  { key: 'mistral-user', label: 'Mistral', kind: 'live', ua: /MistralAI-User/i },
  { key: 'meta-fetcher', label: 'Meta AI', kind: 'live', ua: /meta-externalfetcher/i },
  { key: 'oai-searchbot', label: 'ChatGPT search', kind: 'search', ua: /OAI-SearchBot/i },
  { key: 'claude-searchbot', label: 'Claude search', kind: 'search', ua: /Claude-SearchBot/i },
  { key: 'perplexitybot', label: 'Perplexity', kind: 'search', ua: /PerplexityBot/i },
  { key: 'duckassist', label: 'DuckDuckGo AI', kind: 'search', ua: /DuckAssistBot/i },
  { key: 'gptbot', label: 'OpenAI', kind: 'training', ua: /GPTBot/i },
  { key: 'claudebot', label: 'Anthropic', kind: 'training', ua: /ClaudeBot|anthropic-ai/i },
  { key: 'ccbot', label: 'Common Crawl', kind: 'training', ua: /CCBot/i },
  { key: 'meta-agent', label: 'Meta', kind: 'training', ua: /meta-externalagent/i },
  { key: 'amazonbot', label: 'Amazon', kind: 'training', ua: /Amazonbot/i },
  { key: 'bytespider', label: 'ByteDance', kind: 'training', ua: /Bytespider/i },
  { key: 'cohere', label: 'Cohere', kind: 'training', ua: /cohere-ai/i },
]
export const AGENT_BY_KEY = Object.fromEntries(AI_AGENTS.map((a) => [a.key, a]))
export const matchAgent = (ua) => (ua ? AI_AGENTS.find((a) => a.ua.test(ua)) || null : null)

// Click-throughs: the "source" /api/track stores is the referrer host, or
// "utm:<tag>" with dots stripped (ChatGPT tags links utm_source=chatgpt.com,
// which arrives as utm:chatgptcom).
const ASSISTANTS = [
  ['ChatGPT', /chatgpt|openai/], ['Perplexity', /perplexity/], ['Claude', /claude/],
  ['Gemini', /gemini|bard\.google/], ['Copilot', /copilot/], ['Meta AI', /(^|\.)meta\.ai$|metaai/],
  ['Grok', /grok/], ['DeepSeek', /deepseek/], ['Mistral', /mistral/], ['You.com', /^you\.com$|utm:youcom/],
]
export function assistantFor(source) {
  const s = String(source || '').toLowerCase()
  const hit = ASSISTANTS.find(([, re]) => re.test(s))
  return hit ? hit[0] : null
}
