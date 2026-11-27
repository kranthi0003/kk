# The twin's brain

Everything the AI twin knows about me lives in this folder. It answers in
first person from these files and nothing else, so if it isn't written here,
the twin says it doesn't know and points people to the real me.

**Everything here is public.** The repo is public, and the twin will repeat
any of it to any visitor. Don't add anything you wouldn't say to a stranger.

## Files

| File | What it holds | Sent with |
|---|---|---|
| `me.md` | Who I am, my job, how to reach me | every question |
| `voice.md` | How I talk, with example replies | every question |
| `boundaries.md` | What stays private | every question |
| `interview.md` | My own answers to interview questions | when relevant |
| everything else | Work, learning, projects, life, writing, the site | when relevant |

The twin only sends the few memories that match each question, so these files
can grow without slowing it down.

## Adding a memory

Each `## heading` is one memory. Write it in first person, the way I'd say it.
Optional lines right under the heading:

- `tags: word, word` extra words people might use to ask about it
- `ask: a question` shows up as a suggestion in the chat
- `link: https://…` where to read more

In `interview.md`, the heading is the question and whatever I write under it is
my answer. Questions with no answer are skipped, and answered ones also become
suggestions in the chat.

Edit on GitHub, commit to `main`, and the twin knows it after the deploy.
