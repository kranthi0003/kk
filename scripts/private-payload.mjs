#!/usr/bin/env node
// Encrypts and decrypts the payloads behind the passphrase-locked pages
// (src/lib/*Payload.js) with the same scheme the pages decrypt with:
// PBKDF2-SHA256 (200k iterations) -> AES-GCM-256, the 16-byte tag appended
// to the ciphertext, everything base64.
//
//   node scripts/private-payload.mjs encrypt <plain.json> <out.js> <EXPORT_NAME>
//   node scripts/private-payload.mjs decrypt <payload.js> > plain.json
//
// The passphrase comes from $PRIVATE_PASSPHRASE, or a hidden prompt.
// Keep plaintext files out of the repo: only the encrypted payload is
// committed, and `decrypt` gets the plaintext back whenever it needs editing.
import { webcrypto } from 'node:crypto'
import { readFileSync, writeFileSync } from 'node:fs'
import process from 'node:process'

const { subtle } = webcrypto
const ITER = 200000
const te = new TextEncoder()
const td = new TextDecoder()
const toB64 = (u8) => Buffer.from(u8).toString('base64')
const fromB64 = (s) => new Uint8Array(Buffer.from(s, 'base64'))

async function deriveKey(pass, salt, iter, usage) {
  const base = await subtle.importKey('raw', te.encode(pass), 'PBKDF2', false, ['deriveKey'])
  return subtle.deriveKey(
    { name: 'PBKDF2', salt, iterations: iter, hash: 'SHA-256' },
    base, { name: 'AES-GCM', length: 256 }, false, [usage],
  )
}

async function encrypt(text, pass) {
  const salt = webcrypto.getRandomValues(new Uint8Array(16))
  const iv = webcrypto.getRandomValues(new Uint8Array(12))
  const key = await deriveKey(pass, salt, ITER, 'encrypt')
  const ct = new Uint8Array(await subtle.encrypt({ name: 'AES-GCM', iv }, key, te.encode(text)))
  return { v: 1, iter: ITER, salt: toB64(salt), iv: toB64(iv), ct: toB64(ct) }
}

async function decrypt(payload, pass) {
  const key = await deriveKey(pass, fromB64(payload.salt), payload.iter || ITER, 'decrypt')
  const pt = await subtle.decrypt({ name: 'AES-GCM', iv: fromB64(payload.iv) }, key, fromB64(payload.ct))
  return td.decode(pt)
}

function readPayload(file) {
  const m = readFileSync(file, 'utf8').match(/=\s*(\{[\s\S]*\})\s*;?\s*$/)
  if (!m) throw new Error(`No payload object found in ${file}`)
  return JSON.parse(m[1])
}

function promptHidden(label) {
  const { stdin, stderr } = process
  if (!stdin.isTTY) return Promise.reject(new Error('Set PRIVATE_PASSPHRASE; there is no terminal to prompt on.'))
  return new Promise((resolve) => {
    let value = ''
    stderr.write(label)
    stdin.setRawMode(true)
    stdin.setEncoding('utf8')
    stdin.resume()
    const onData = (chunk) => {
      for (const ch of chunk) {
        if (ch === '\r' || ch === '\n') {
          stdin.setRawMode(false); stdin.pause(); stdin.off('data', onData)
          stderr.write('\n')
          return resolve(value)
        }
        if (ch === '\u0003') { stdin.setRawMode(false); stderr.write('\n'); process.exit(130) }
        if (ch === '\u007f' || ch === '\b') value = value.slice(0, -1)
        else value += ch
      }
    }
    stdin.on('data', onData)
  })
}

async function passphrase(confirm) {
  if (process.env.PRIVATE_PASSPHRASE) return process.env.PRIVATE_PASSPHRASE
  const pass = await promptHidden('Passphrase: ')
  if (confirm && pass !== await promptHidden('Again: ')) throw new Error('Passphrases did not match.')
  if (!pass) throw new Error('Empty passphrase.')
  return pass
}

const [cmd, a, b, name] = process.argv.slice(2)
try {
  if (cmd === 'encrypt' && a && b && /^[A-Z][A-Z0-9_]*$/.test(name || '')) {
    const text = JSON.stringify(JSON.parse(readFileSync(a, 'utf8')))
    const pass = await passphrase(true)
    const payload = await encrypt(text, pass)
    if (await decrypt(payload, pass) !== text) throw new Error('Round-trip check failed.')
    writeFileSync(b,
      '// Encrypted payload for a passphrase-locked page. Decrypts only in the\n' +
      '// browser with the passphrase. Do not edit by hand: regenerate with\n' +
      '// scripts/private-payload.mjs.\n' +
      `export const ${name} = ${JSON.stringify(payload, null, 2)}\n`)
    process.stderr.write(`Wrote ${b} (${text.length} bytes of plaintext, encrypted).\n`)
  } else if (cmd === 'decrypt' && a) {
    const payload = readPayload(a)
    const text = await decrypt(payload, await passphrase(false))
    let out = text
    try { out = JSON.stringify(JSON.parse(text), null, 2) } catch {}
    process.stdout.write(out + '\n')
  } else {
    process.stderr.write(
      'Usage:\n' +
      '  node scripts/private-payload.mjs encrypt <plain.json> <out.js> <EXPORT_NAME>\n' +
      '  node scripts/private-payload.mjs decrypt <payload.js> > plain.json\n')
    process.exit(2)
  }
} catch (err) {
  const msg = err?.name === 'OperationError' ? 'Wrong passphrase (or a corrupted payload).' : err?.message || String(err)
  process.stderr.write(`${msg}\n`)
  process.exit(1)
}
