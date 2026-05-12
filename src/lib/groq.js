// Centralized Groq API proxy — routes through Supabase Edge Function
// This keeps the API key server-side (never exposed to the browser)

const SUPABASE_URL = 'https://urfmdrhuagbgvghjolvf.supabase.co'
const SUPABASE_ANON_KEY = 'sb_publishable_GB-5ytPAF6UkOuLpOaCHPw_6p3GrwSz'

export async function groqChat(messages, { max_tokens = 150, temperature = 0.7, model = 'llama-3.1-8b-instant' } = {}) {
  const res = await fetch(`${SUPABASE_URL}/functions/v1/groq-proxy`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
    },
    body: JSON.stringify({ model, max_tokens, temperature, messages }),
  })

  if (!res.ok) throw new Error(`Proxy error: ${res.status}`)
  return res.json()
}
