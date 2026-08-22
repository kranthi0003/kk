// Centralized Groq API proxy — routes through Supabase Edge Function
// This keeps the API key server-side (never exposed to the browser)
//
// The model is named here and nowhere else. Six features run through this
// one function — the chatbot, the terminal, the meme generator, stranger
// chat and the collab editor — and none of them pass a model of their own.
//
// That turned out to matter. Groq decommissioned llama-3.1-8b-instant and
// all six broke at once, quietly: the proxy still answers 200 with an
// error object in the body, so nothing looked wrong from the outside.
//
// Picking the replacement was less obvious than it sounds, because this
// account can reach very few models and each family has a catch:
//
//   groq/compound-*     work, but they're agentic wrappers that call
//                       gpt-oss-120b underneath, so they inherit its rate
//                       limit. Fine for one person, not for a public page.
//   openai/gpt-oss-*    reasoning models. Left alone they spend the whole
//                       token budget thinking and return content: "" at
//                       the 150–350 limits these features use, which reads
//                       as the assistant replying with nothing. With
//                       reasoning_effort low they answer normally.
//   allam-2-7b          answers in Arabic.
//
// So: gpt-oss-20b with the reasoning kept short, and compound-mini behind
// it. Anything that suggests the model rather than the request is at fault
// — retired, rate limited, or an empty answer — retries once on the other
// one, and whichever works is remembered for the rest of the session.

const SUPABASE_URL = 'https://urfmdrhuagbgvghjolvf.supabase.co'
const SUPABASE_ANON_KEY = 'sb_publishable_GB-5ytPAF6UkOuLpOaCHPw_6p3GrwSz'

export const PRIMARY = 'openai/gpt-oss-20b'
const FALLBACK = 'groq/compound-mini'

// Only the gpt-oss family accepts this, and the others reject the whole
// request if it's present.
const wantsReasoningEffort = (model) => /gpt-oss/.test(model)

// Faults a different model would actually fix, as opposed to a malformed
// request, which it would not.
const SWITCHABLE = /model_not_found|model_decommissioned|does not exist|rate.?limit/i

let active = null // the model known to work this session

async function call(model, messages, max_tokens, temperature) {
  const body = { model, max_tokens, temperature, messages }
  if (wantsReasoningEffort(model)) body.reasoning_effort = 'low'

  const res = await fetch(`${SUPABASE_URL}/functions/v1/groq-proxy`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
    },
    body: JSON.stringify(body),
  })

  if (!res.ok) throw new Error(`Proxy error: ${res.status}`)
  return res.json()
}

// A reply with no text in it is a failure however cheerfully it's returned.
const isEmpty = (data) =>
  !data?.error && !(data?.choices?.[0]?.message?.content || '').trim()

export async function groqChat(messages, { max_tokens = 150, temperature = 0.7, model } = {}) {
  const first = model || active || PRIMARY
  const data = await call(first, messages, max_tokens, temperature)

  const err = data?.error
  const switchable = err && SWITCHABLE.test(`${err.code || ''} ${err.message || ''}`)
  if (!switchable && !isEmpty(data)) {
    if (!err && !model) active = first
    return data
  }

  // A caller that named its own model gets the truth back rather than a
  // silent substitution.
  if (model) return data

  const spare = first === FALLBACK ? PRIMARY : FALLBACK
  const retry = await call(spare, messages, max_tokens, temperature)
  if (!retry?.error && !isEmpty(retry)) {
    active = spare
    return retry
  }
  // Both are unhappy — hand back whichever said something more useful.
  return retry?.error ? retry : data
}
