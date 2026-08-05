// Bitcoin address summary from CORS-friendly Esplora APIs.
//
// The BTC widgets previously fetched blockchain.info/rawaddr, which began
// returning HTTP 429 "Rate limited" with no CORS header. That made the fetch
// throw, and both widgets silently fell back to stale hardcoded numbers (e.g.
// "8 transactions" and a too-low balance). mempool.space and blockstream.info
// share the Esplora API, are reliable, and send `access-control-allow-origin: *`.
//
// Returns sats-denominated fields matching the shape the widgets already read:
// { final_balance, total_received, total_sent, n_tx, utxos }.
const SOURCES = [
  (a) => `https://mempool.space/api/address/${a}`,
  (a) => `https://blockstream.info/api/address/${a}`,
]

export async function fetchBtcWallet(addr) {
  let lastErr
  for (const build of SOURCES) {
    try {
      const r = await fetch(build(addr), { cache: 'no-store' })
      if (!r.ok) throw new Error(`status ${r.status}`)
      const d = await r.json()
      const c = d.chain_stats || {}
      const m = d.mempool_stats || {}
      const received = (c.funded_txo_sum || 0) + (m.funded_txo_sum || 0)
      const sent = (c.spent_txo_sum || 0) + (m.spent_txo_sum || 0)
      return {
        final_balance: received - sent,
        total_received: received,
        total_sent: sent,
        n_tx: (c.tx_count || 0) + (m.tx_count || 0),
        utxos: Math.max(0, (c.funded_txo_count || 0) - (c.spent_txo_count || 0)),
      }
    } catch (e) {
      lastErr = e
    }
  }
  throw lastErr || new Error('all BTC sources failed')
}
