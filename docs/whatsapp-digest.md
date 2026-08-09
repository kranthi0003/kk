# WhatsApp daily digest — setup

One WhatsApp message a day with today's birthdays (each with a one-tap link to
send the wish yourself) and any new guestbook notes.

Everything in the repo is already done. What's left is the Meta account setup,
which only you can do, plus pasting four values into GitHub.

Budget about 30 minutes, plus waiting for template approval.

---

## Before you start

Two things worth knowing up front, because they surprise people:

**1. The sender number gets detached from normal WhatsApp.** Once a number is
registered with the Cloud API it can no longer be used in WhatsApp Messenger or
the WhatsApp Business app. Use the spare number as the *sender*; you receive on
your personal number. They must be different — Meta returns error `131021` if
sender and recipient are the same.

**2. You cannot auto-send wishes to friends.** WhatsApp's policy requires opt-in
from every recipient of an API message, and business-initiated messages must use
a pre-approved template — so it would be a stiff templated greeting anyway. The
digest instead gives you a `wa.me` link per birthday: tap it, WhatsApp opens with
the wish typed, you hit send. It goes from your own number, as you.

---

## Step 1 — Create the Meta app

1. Register as a developer at <https://developers.facebook.com>.
2. Go to <https://developers.facebook.com/apps> → **Create App**.
3. Choose the use case **"Connect with customers through WhatsApp"**.
4. When prompted, create a **Meta Business Portfolio**. A personal one is fine —
   no registered company needed.

## Step 2 — Register the sender number

1. In the app dashboard: **WhatsApp → API Setup**.
2. Under **From**, click **Add phone number** and enter your spare number.
   It must be able to receive an SMS or voice call for the one-time code.
3. Verify with the code Meta sends.

Now copy two values from this page — you'll need them shortly:

- **Phone number ID** — a long number like `106540352242922`
- **WhatsApp Business Account ID** — used in the next step

## Step 3 — Create the message template

Templates are mandatory for anything sent outside a 24-hour reply window, which
a daily cron always is.

Go to **WhatsApp Manager → Message templates → Create template**:

| Field | Value |
| --- | --- |
| Name | `daily_digest` |
| Category | **Utility** |
| Language | English (US) — code `en_US` |

Paste exactly this as the **body**:

```
Hi Kiran, here is your site digest for {{1}}.

{{2}}

Sent automatically from kranthikiran.com
```

Sample values for review (Meta requires examples):

- `{{1}}` → `9 Aug`
- `{{2}}` → `Birthdays today (1): Amma turns 61`

Two rules this template is shaped around, both of which cause rejections:

- The body **cannot start or end with a variable**. That's why there's static
  text top and bottom.
- Keep it **Utility**, not Marketing. A vague body (or one that's only a
  variable) gets recategorised as Marketing, which costs more and is judged
  more harshly.

Approval usually lands within minutes to a few hours.

## Step 4 — Generate a permanent token

The token shown on the API Setup page **expires within hours** — useless for a
daily cron. You need a System User token:

1. Go to <https://business.facebook.com/settings/> → **System Users**.
2. **+Add** → give it a name → role **Admin**.
3. Click the system user → **Assign assets**:
   - **Apps** → your app → toggle **Manage app**
   - **WhatsApp Accounts** → your WABA → toggle **Manage WhatsApp Business accounts**
4. **Generate token** → select your app → set expiry to **Never** → tick these
   three permissions:
   - `business_management`
   - `whatsapp_business_management`
   - `whatsapp_business_messaging`
5. Copy the token. **It is shown once.** If you lose it, generate another.

## Step 5 — Put the values in GitHub

Repository → **Settings → Secrets and variables → Actions**.

Under **Secrets** → *New repository secret*:

| Secret | Value |
| --- | --- |
| `WHATSAPP_TOKEN` | the System User token from step 4 |
| `WHATSAPP_PHONE_ID` | the Phone number ID from step 2 |
| `WHATSAPP_TO` | your **personal** number, e.g. `+919876543210` |
| `BIRTHDAYS_JSON` | the contact list, format below |

`BIRTHDAYS_JSON` is a JSON array. `phone` and `note` are optional; without a
phone there's simply no wish link. `date` is `YYYY-MM-DD` (gives you their age)
or `MM-DD` (no age).

```json
[
  { "name": "Amma",    "date": "1965-03-14", "phone": "+919876543210", "note": "call in the morning" },
  { "name": "Ravi",    "date": "08-11",      "phone": "+919123456789" },
  { "name": "Sharath", "date": "12-25" }
]
```

This is why it's a secret and not a file in the repo — both your repos are
public, and these are other people's phone numbers.

You do **not** need to set the `vars` (`WHATSAPP_TEMPLATE`, `WHATSAPP_LANG`,
`WHATSAPP_FLATTEN`). They default to `daily_digest`, `en_US`, and off.

## Step 6 — Test it

Repository → **Actions → Daily digest → Run workflow**, and tick
**"Send even when there is nothing to report"**.

Check the run log. It prints the digest before sending, so you can see exactly
what went out.

---

## When something goes wrong

The script prints the Meta error code and what it means. The ones you're likely
to hit:

| Code | What it actually means |
| --- | --- |
| `190` | Token expired or revoked — you probably used the temporary one from API Setup. Redo step 4. |
| `132001` | Template not found or not approved yet. Check the name and language match exactly. |
| `132000` | Parameter count mismatch — the template must have exactly two variables. |
| `131021` | Sender and recipient are the same number. `WHATSAPP_TO` must be your personal number. |
| `131026` | Recipient can't receive messages — check the number is on WhatsApp. |

**If the message is rejected over the parameter formatting**, it's likely
because the digest is multi-line. Meta doesn't document whether a template
variable may contain line breaks, and I couldn't verify it either way. The fix
is one setting: add a repository **variable** (not a secret) `WHATSAPP_FLATTEN`
set to `1`, which collapses the digest onto a single line with `·` separators.

---

## Notes

- The digest is skipped entirely on days with nothing to report, so you won't
  get an empty message every morning.
- Scheduled GitHub Actions are best-effort and can run some minutes late. Fine
  for a daily digest; don't rely on it for anything time-critical.
- Cost is per message, Utility rate, one message a day. I could not extract
  India's current per-message rate from Meta's pricing page (it's behind a
  JavaScript rate tool), but at ~365 messages a year it is negligible.
- The script never fails the workflow. A missed digest won't show up as a red X.
- Birthdays are evaluated in IST, not the runner's UTC clock — otherwise anyone
  whose date rolls over between 18:30 UTC and midnight would be wished a day early.
