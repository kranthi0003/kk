// Every file in src/brain as raw text, bundled into one chunk that loads the
// first time someone talks to the twin. Kept separate from twin.js so the home
// page never downloads the brain.
export const BRAIN_FILES = import.meta.glob('../brain/*.md', { query: '?raw', import: 'default', eager: true })
