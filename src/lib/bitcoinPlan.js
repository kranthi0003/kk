// The 13-year Bitcoin plan shown at #/bitcoin (opened from the Bitcoin icon in
// the navbar). Every word and number on the page comes from here; the page
// itself (src/components/BitcoinPlan.jsx) only renders it. Facts were checked
// on 24 Nov 2026; sources are listed under sections.notes.
//
// plan.openLots is the starting stack: every transaction into the cold-storage
// wallet before the plan began. The blockchain doesn't record what was paid,
// so each is costed at Bitcoin's price in the hour it arrived (mempool.space
// hourly USD price; that day's USD/INR rate from CoinGecko). plan.openBase is
// the stack's value when the plan began, where the projections start.
export const BITCOIN_PLAN = {
  "meta": {
    "bar": "Bitcoin plan",
    "kicker": "Bitcoin · 13 years · Dec 2026 – Nov 2039",
    "title": "The 13-year stack",
    "subtitle": "$500 a month into Bitcoin, stepping up 10% every six months, from December 2026 to November 2039. The rules decide what to buy in a crash, where the coins live, how Indian tax works and when to take risk off, so nothing has to be decided in the moment.",
    "chips": [
      {
        "k": "Starting stack",
        "v": "0.0435 BTC in cold storage, cost ≈ $3,048"
      },
      {
        "k": "Monthly",
        "v": "$500 → $5,417, +10% every 6 months"
      },
      {
        "k": "Put in by Nov 2039",
        "v": "≈ $330,000 (₹3.06 Cr today)"
      },
      {
        "k": "Growth needed for $1M",
        "v": "≈ 22.7% a year"
      }
    ],
    "mark": {
      "viewBox": "0 0 64 64",
      "paths": [
        {
          "d": "M32 2a30 30 0 1 1 0 60a30 30 0 1 1 0-60z",
          "fill": "#F7931A"
        },
        {
          "d": "M26 16v32M22 17h13a7 7 0 0 1 0 14H26M26 31h12a8 8 0 0 1 0 16H22M29 11v6M35 11v6M29 47v6M35 47v6",
          "stroke": "#FFFFFF",
          "width": 4.4
        }
      ]
    },
    "unit": {
      "code": "BTC",
      "small": "sats",
      "per": 100000000,
      "dp": 8
    },
    "cur": {
      "base": {
        "code": "USD",
        "sym": "$",
        "locale": "en-US"
      },
      "local": {
        "code": "INR",
        "sym": "₹",
        "locale": "en-IN",
        "compactFrom": 100000
      },
      "entry": "local"
    },
    "feed": {
      "url": "https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=bitcoin",
      "price": "current_price",
      "high": "ath",
      "highAt": "ath_date",
      "localUrl": "https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=inr",
      "local": "bitcoin.inr",
      "change": "price_change_percentage_24h",
      "historyUrl": "https://api.coingecko.com/api/v3/coins/bitcoin/market_chart?vs_currency=usd&days=365&interval=daily",
      "history": "prices",
      "every": 180
    },
    "seed": {
      "price": 60447,
      "local": 5609875,
      "fx": 92.8,
      "high": 126080,
      "highAt": "2025-10-06",
      "at": "2026-11-24"
    },
    "csv": "btc-ledger",
    "wallet": {
      "address": "bc1quaunu4xa0jgeh446jlx2mchlv4gda9tj0dqz9e",
      "txUrl": "https://mempool.space/tx/{t}",
      "explorers": [
        {
          "label": "mempool.space",
          "url": "https://mempool.space/address/{a}"
        },
        {
          "label": "Arkham",
          "url": "https://platform.arkhamintelligence.com/explorer/address/{a}"
        }
      ]
    }
  },
  "words": {
    "units": "Bitcoin",
    "small": "sats",
    "kind_out": "To my wallet",
    "kind_in": "Back to exchange",
    "kind_res": "Reserve cash",
    "venueHint": "Exchange or wallet",
    "holdingsEmpty": "Nothing logged yet. Log a buy to start tracking.",
    "valueNote": "Valued at the global price. Indian exchanges were paying about 13% more on 24 Nov 2026, so the same coins sell for more there while that premium lasts.",
    "taxLine": "After tax uses {t} on the gain; set your surcharge band in Notes → Settings.",
    "leversIntro": "What each change does at {r} a year, against the plan as set above.",
    "leverBase": "The plan as set above",
    "stressIntro": "A big fall just before the finish hurts most: the stack is at its largest and there’s no time left to recover. The glide path gives up a little upside to cushion that.",
    "stressNote": "After-tax values at the end of the plan. Glide path: 90%, 80%, 70% and 60% kept in Bitcoin in years 10–13, new money redirected first, any sales taxed at your rate, and the safer bucket growing at 4% a year in dollars.",
    "yourStack": "The stack",
    "includesStart": "Includes the starting stack: {u} {c} in cold storage.",
    "ledgerCostNote": "The blockchain records when coins arrived, not what was paid, so each cost here is Bitcoin’s price in that hour. Indian exchanges usually charge more, so if you know what you actually paid, enter it in Settings."
  },
  "views": [
    {
      "id": "today",
      "label": "This month"
    },
    {
      "id": "plan",
      "label": "The plan"
    },
    {
      "id": "grow",
      "label": "Projections"
    },
    {
      "id": "log",
      "label": "Ledger"
    },
    {
      "id": "rules",
      "label": "Rules"
    },
    {
      "id": "notes",
      "label": "Notes"
    }
  ],
  "plan": {
    "start": "2026-12",
    "years": 13,
    "openBase": 2630,
    "openLots": [
      {"d":"2026-04-06","u":0.0000143,"p":69956,"b":1,"l":93,"tx":"ba81cb420fe611531cf9de24cbd9895ec0166998eaaf037f3ef165810e3987b0"},
      {"d":"2026-04-06","u":0.02044838,"p":69569,"b":1422.57,"l":132253,"tx":"de21c0f589d4ed5d00597b5885d9d2e34869544a1e7906357b7a0fccf79d9383"},
      {"d":"2026-04-08","u":0.00209597,"p":71481,"b":149.82,"l":13871,"tx":"43d0889e11ef1d39e8901cc62e9a17f24a72148e98acee9d7e7752492615c8e7"},
      {"d":"2026-04-08","u":0.00104459,"p":71281,"b":74.46,"l":6885,"tx":"8b7e743a6e306b0129058d236bdf361f38fb20628209d1cc07ba9a89dc857721"},
      {"d":"2026-04-10","u":0.00102,"p":72092,"b":73.53,"l":6811,"tx":"4116091d24c4d43cea1032a36a5546975a7c7013fac9a8225a8b399bacb98081"},
      {"d":"2026-04-10","u":0.00068638,"p":71802,"b":49.28,"l":4567,"tx":"0bcdd8865aff5573bebbf84ae58d2c54db410831692aaab48b00643ed8873e20"},
      {"d":"2026-04-13","u":0.00100045,"p":70917,"b":70.95,"l":6712,"tx":"a9447f65a60a6a513611747923329ad321a3440877540da82966364c2fae8c23"},
      {"d":"2026-05-01","u":0.0006642,"p":77896,"b":51.74,"l":4907,"tx":"7815accb108886841306fe1e93a4e15759fb8f0b11ae25817d942825bebd47ea"},
      {"d":"2026-05-25","u":0.00197844,"p":77297,"b":152.93,"l":14621,"tx":"0d622771155c5f42bb78bf47656829899aff899470b03efafcef0674fbe26776"},
      {"d":"2026-05-29","u":0.00337856,"p":73685,"b":248.95,"l":23792,"tx":"e22849b8dfc305334988ba227b264bad874e8d0af71c8a2057a255dc30618acd"},
      {"d":"2026-07-06","u":0.00398448,"p":63490,"b":252.97,"l":24157,"tx":"7c9600d5ad382c9fe3f4ddd6296a568bc0f72002347f12a06a24bb1e0bd0eebb"},
      {"d":"2026-07-29","u":0.00383824,"p":64352,"b":247,"l":23623,"tx":"028fcd0f19c4e8158dac05d0545d74d1117e0bb02a69ffe9678f3e8f433833c8"},
      {"d":"2026-09-02","u":0.00313431,"p":77150,"b":241.81,"l":22880,"tx":"a26af656bf18eecdf40fe5c6202dc44acaea9618e15e2f58add7ee493e97c9d4"},
      {"d":"2026-11-23","u":0.00018374,"p":61249,"b":11.25,"l":1044,"tx":"b73efde7ba4009738df38c79224fe1406e40c27df62640a8f0c244109e6a04b1"}
    ],
    "monthly": 500,
    "step": 0.1,
    "every": 6,
    "cap": 0,
    "target": 1000000,
    "threshold": 1500,
    "capMonths": 6,
    "surcharge": 0,
    "ladder": [
      {
        "label": "Near the high",
        "from": 0,
        "core": 0.8,
        "reserve": 0.2,
        "deploy": 0,
        "action": "Builds: 20% of each month goes in",
        "note": "Bitcoin is within 30% of its high. Buy with **80%** of this month’s amount and put **20%** in the rupee reserve, until the reserve holds six months of contributions."
      },
      {
        "label": "30% below the high",
        "from": 0.3,
        "core": 0.8,
        "reserve": 0.2,
        "deploy": 0.3333333333333333,
        "note": "Bitcoin is 30–50% below its high. Keep the 80/20 split and deploy **a third of the reserve**, once this cycle."
      },
      {
        "label": "50% below the high",
        "from": 0.5,
        "core": 1,
        "reserve": 0,
        "deploy": 0.5,
        "note": "Bitcoin is 50–70% below its high. **All of this month’s amount** goes in, plus **half of what’s left in the reserve**, once this cycle. The last three bear markets bottomed 78–87% down, so it may well fall further. Keep buying."
      },
      {
        "label": "70% below the high",
        "from": 0.7,
        "core": 1,
        "reserve": 0,
        "deploy": 1,
        "note": "Bitcoin is more than 70% below its high, where the last three bear markets ended. Deploy **the rest of the reserve** and keep buying every month."
      }
    ],
    "scenarios": [
      {
        "id": "low",
        "label": "Cautious",
        "rate": 0.1,
        "tone": "low"
      },
      {
        "id": "mid",
        "label": "Middle",
        "rate": 0.2,
        "tone": "mid",
        "main": true
      },
      {
        "id": "high",
        "label": "Strong",
        "rate": 0.3,
        "tone": "high"
      }
    ],
    "tax": {
      "rate": 0.3,
      "cess": 0.04,
      "tds": 0.01,
      "fyStart": 4,
      "bands": [
        {
          "v": 0,
          "label": "None (income up to ₹50 L)"
        },
        {
          "v": 0.1,
          "label": "10% (₹50 L – 1 Cr)"
        },
        {
          "v": 0.15,
          "label": "15% (₹1–2 Cr)"
        },
        {
          "v": 0.25,
          "label": "25% (above ₹2 Cr)"
        }
      ]
    },
    "glide": [
      {
        "year": 10,
        "keep": 0.9
      },
      {
        "year": 11,
        "keep": 0.8
      },
      {
        "year": 12,
        "keep": 0.7
      },
      {
        "year": 13,
        "keep": 0.6
      }
    ],
    "glideRedirect": true,
    "safeRate": 0.04,
    "stress": {
      "drops": [
        0.5,
        0.7,
        0.8
      ]
    },
    "levers": {
      "cap": 2000,
      "step": 0.05,
      "extra": 5000,
      "years": 3
    },
    "events": [
      {
        "d": "2028-04-08",
        "label": "Fifth halving (block 1,050,000), estimated",
        "short": "Halving",
        "approx": true
      },
      {
        "d": "2032-04-01",
        "label": "Sixth halving, estimated",
        "short": "Halving",
        "approx": true
      },
      {
        "d": "2036-04-01",
        "label": "Seventh halving, estimated",
        "short": "Halving",
        "approx": true
      }
    ],
    "openWhere": "wallet"
  },
  "phases": [
    {
      "id": "stack",
      "name": "Stack",
      "from": 1,
      "to": 4,
      "body": [
        "Build the habit and the stack while the amounts are small: $500 a month rising to $974, about **$34,300** put in over four years. The plan starts with Bitcoin about 52% below its October 2025 high, so the rules put the whole amount in."
      ],
      "points": [
        "Automate a weekly buy (about **$115 a week** at the start) on an exchange that lets you withdraw Bitcoin.",
        "Set up the hardware wallet, the steel backups and the letter for your family **before** the first withdrawal.",
        "Move coins to your own wallet whenever the exchange balance passes **$1,500**.",
        "The next halving lands around **April 2028**. Past cycles peaked 12–18 months after a halving; the plan doesn’t change for it."
      ]
    },
    {
      "id": "compound",
      "name": "Compound",
      "from": 5,
      "to": 9,
      "body": [
        "Contributions climb from $1,072 to $2,527 a month, about **$102,500** in total. Market moves now outweigh what you add, so a 50% drop will feel like real money."
      ],
      "points": [
        "Keep the step-ups only while they’re affordable. If one would push the monthly amount past the share of take-home pay you’ve chosen, set a ceiling in Settings rather than pausing.",
        "Let the reserve ladder handle crashes, and change nothing else.",
        "Once the stack is worth more than a year’s salary, consider a 2-of-3 multisig wallet, so one lost or stolen key can’t cost everything.",
        "The sixth halving lands around **2032**."
      ]
    },
    {
      "id": "protect",
      "name": "Protect",
      "from": 10,
      "to": 13,
      "body": [
        "The biggest contributions ($2,780 to $5,417 a month, about **$190,700** in total) and the most to lose. A 70% fall in year 13 would cut a hold-everything result by more than half, so this phase moves money to safety on a schedule."
      ],
      "points": [
        "From year 10 (December 2035), new money goes to a safer rupee bucket (index and debt funds) whenever Bitcoin is above that year’s target share: **90%, 80%, 70%, 60%** in years 10–13.",
        "At each yearly review, sell only what’s still above the target. Sales are taxed at 30% plus cess and surcharge, so spreading them across financial years keeps the surcharge down.",
        "Decide what “done” means before you get there: the target, a date, or a monthly income.",
        "The seventh halving lands around **2036**."
      ]
    }
  ],
  "sections": {
    "plan": [
      {
        "type": "callout",
        "tone": "key",
        "title": "The plan in one paragraph",
        "body": [
          "Put a fixed, rising amount into Bitcoin every month for 13 years, whatever the headlines say. Buy extra in crashes from a rupee reserve, keep the coins in your own wallet, log every transaction here, and take risk off on a schedule in the last four years. Nobody can predict the price; the plan is built so that your own decisions aren’t what goes wrong."
        ]
      },
      {
        "type": "phases",
        "kicker": "Dec 2026 – Nov 2039",
        "title": "Three phases"
      },
      {
        "type": "schedule",
        "title": "Year by year",
        "intro": "What goes in each year, and what the stack could be worth at 10%, 20% and 30% a year. The current year is highlighted; Settings changes flow through."
      },
      {
        "type": "text",
        "title": "Why $500 and +10% every six months",
        "body": [
          "Ten percent every six months compounds to **21% a year**. In the last six months you’d put in **$5,417 a month** (about ₹5 lakh at today’s rate), and about **$330,000** in total over 13 years, counting the 0.0435 BTC already in cold storage (about ₹3.06 crore).",
          "That is what makes $1M realistic: it needs about **22.7% a year** from Bitcoin, against 38.7% on the earlier $250 + 10%-a-year plan. The catch is that your income has to keep up.",
          "If the step-ups outrun your pay, set a **monthly ceiling** in Settings instead of breaking the habit. Capping at $2,000 a month still puts in about $230,000 and reaches about $724,000 at 20% a year."
        ]
      },
      {
        "type": "ladder",
        "title": "Buying rules: distance from the high",
        "intro": "Each month the live price sets the split. Each reserve trigger fires once per cycle and re-arms when Bitcoin makes a new all-time high.",
        "note": "Price levels move with the high; today’s are worked out from the live all-time high."
      },
      {
        "type": "text",
        "title": "The reserve stays in rupees",
        "body": [
          "Park it in a liquid mutual fund or a sweep fixed deposit, not in stablecoins. In India every crypto-to-crypto swap is a taxable transfer with 1% TDS on each side.",
          "It’s full at six months of contributions. Beyond that the 20% goes straight into Bitcoin, so cash doesn’t pile up through long rallies.",
          "Log money set aside as **Reserve cash** in the Ledger, and tick **Paid from the reserve** when a buy uses it, so the balance stays right."
        ]
      },
      {
        "type": "glide",
        "title": "Protect: the glide path",
        "intro": "From year 10, new money goes to a safer bucket whenever Bitcoin is above that year’s target share. At each yearly review, sell only what’s still above it.",
        "note": "Redirecting new money first means less selling, so less tax is paid early. The stress test on Projections shows what this does in a crash."
      },
      {
        "type": "cards",
        "cols": 2,
        "title": "Where to buy, and where to keep it",
        "items": [
          {
            "tag": "The plan’s default",
            "title": "Indian exchange, then your own wallet",
            "tone": "good",
            "body": [
              "Buy with rupees on an exchange registered with India’s Financial Intelligence Unit (FIU-IND) that lets you withdraw Bitcoin, then move the coins to your hardware wallet."
            ],
            "points": [
              "Registered names (Lok Sabha answer, March 2026) include CoinDCX, ZebPay, Giottus, Mudrex, WazirX, Unocoin and Bitbns. CoinSwitch reportedly allows rupee withdrawals only, which doesn’t suit self-custody.",
              "Indian prices ran about **13–14% above** the global price at the official rupee rate on 24 Nov 2026 (7–10% in mid-2026). That premium is part of your cost, so compare quotes.",
              "Withdrawal fees reportedly range from 0.00004 to 0.0006 BTC ($2–36). Pick a low one and batch withdrawals.",
              "Tax: 30% + 4% cess (+ surcharge) on gains and 1% TDS when you sell. Nothing to file while you only hold."
            ]
          },
          {
            "tag": "Ask a CA first",
            "title": "US spot ETF through an overseas broker",
            "tone": "warn",
            "body": [
              "Buy a US spot Bitcoin ETF (iShares IBIT or Fidelity FBTC, 0.25% a year) through a broker such as Interactive Brokers, funded under the Liberalised Remittance Scheme. Indian apps dropped these after GIFT City platforms were barred from crypto-linked products from 31 Oct 2025."
            ],
            "points": [
              "Practitioners treat the ETF as a foreign capital asset, not crypto: about **13–15% after 24 months** instead of 31.2–39%, and losses can be set off. There’s no official ruling.",
              "You pay the global price, with no Indian premium.",
              "US estate tax applies to US-listed holdings above **$60,000** if you die holding them (18–40%); India has no estate-tax treaty with the US.",
              "Remittances above ₹10 lakh a year attract 20% TCS (credited against your tax), and the holding goes in Schedule FA every year.",
              "You don’t hold the coins yourself."
            ]
          }
        ],
        "note": "Avoid buying crypto directly on overseas exchanges: at least one law firm calls that a FEMA breach under LRS, and FIU-IND has ordered 53 unregistered offshore platforms blocked."
      },
      {
        "type": "callout",
        "tone": "tip",
        "title": "Verdict for now",
        "body": [
          "Keep the plan on Indian exchanges. At the first yearly review (December 2027), take the ETF route to a chartered accountant. If they confirm capital-gains treatment in writing, consider sending part of the new money there, and keep that holding modest because of the US estate-tax exposure."
        ]
      },
      {
        "type": "callout",
        "tone": "warn",
        "title": "What would break this plan",
        "points": [
          "Leverage, futures or “earn” products. Liquidations and platform failures (Celsius and FTX in 2022, the WazirX hack in 2024) are how long-term holders lose everything.",
          "Selling in a crash. The last three bear markets fell 78–87% from the peak; this one has been down 56% at its lowest so far.",
          "Lost keys, or a family that can’t find or recover them.",
          "Step-ups you can’t afford, forcing you to stop.",
          "A change in Indian rules. Tax and regulation have changed before; the yearly review checks for it.",
          "Bitcoin itself failing. That is why this is long-term money with an emergency fund behind it, not your only plan."
        ]
      }
    ],
    "grow": [
      {
        "type": "callout",
        "tone": "tip",
        "title": "Scenarios, not forecasts",
        "body": [
          "Bitcoin grew about 55% a year over the last 10 years, 38% over the last 4, and about 1% over the last 5 (measured from near the 2021 top). Each cycle has returned less than the one before: peak to peak, 101% a year (2013–17), then 38% (2017–21), then 17% (2021–25). The 10%, 20% and 30% scenarios assume that slowdown continues; even 20% is above the last cycle."
        ]
      },
      {
        "type": "text",
        "title": "How the numbers are worked out",
        "points": [
          "Growth compounds monthly at the yearly rate. Monthly amounts land at each month’s end, the yearly extra at each year’s end.",
          "“Reaches target” assumes nothing new goes in after the last plan year.",
          "After tax applies your rate (30% + 4% cess, plus the surcharge band in Settings) to the gain, as if you sold everything at the end. You don’t have to; tax is only due when you sell.",
          "Dollar figures ignore the rupee. It has tended to weaken against the dollar, which helps a rupee-based holder.",
          "Amounts are what you put in. On Indian exchanges the premium (about 13% in Nov 2026) means less Bitcoin per rupee than the global price implies.",
          "The stress test drops Bitcoin at the start of the chosen plan year, then lets it grow at the scenario rate again."
        ]
      }
    ],
    "rules": [
      {
        "type": "cards",
        "cols": 2,
        "title": "The non-negotiables",
        "items": [
          {
            "tag": "Never",
            "tone": "warn",
            "title": "No leverage, derivatives or “earn” products",
            "body": [
              "No margin, futures, options, lending or yield. One liquidation or one failed platform can undo a decade."
            ]
          },
          {
            "tag": "Always",
            "tone": "good",
            "title": "Emergency fund first",
            "body": [
              "Six months of expenses in rupees, outside crypto, so life never forces a sale at the bottom."
            ]
          },
          {
            "tag": "Always",
            "tone": "good",
            "title": "Only 10-year money",
            "body": [
              "Nothing you might need within ten years goes in. The last three bear markets fell 78–87% and took years to recover."
            ]
          },
          {
            "tag": "Always",
            "tone": "good",
            "title": "Step-ups you can afford",
            "body": [
              "Step-ups are a ceiling, not a duty. If the next one would push past the share of take-home pay you’ve chosen, hold the amount with a ceiling in Settings. Never pause."
            ]
          },
          {
            "tag": "Rule",
            "title": "Change the plan once a year",
            "body": [
              "Only at the December review, never mid-crash or mid-rally. The buying rules already say what to do when the price moves."
            ]
          },
          {
            "tag": "Rule",
            "title": "Log it the same day",
            "body": [
              "Every buy, sale, move and reserve deposit goes in the Ledger the day it happens, with the exchange’s order ID. Export the CSV every year for your accountant."
            ]
          },
          {
            "tag": "Never",
            "tone": "warn",
            "title": "Never share or type the seed",
            "body": [
              "No exchange, wallet maker or support person ever needs your 24 words. Never photograph them, type them into a phone or computer, or keep them in the cloud."
            ]
          },
          {
            "tag": "Rule",
            "title": "Bitcoin only",
            "body": [
              "No altcoins, tips or tokens with this money. In India every swap is a taxable transfer and losses can’t be set off, so rotating between coins mostly creates tax."
            ]
          }
        ]
      },
      {
        "type": "checklist",
        "id": "custody",
        "title": "Custody set-up",
        "intro": "Once, before the first withdrawal.",
        "items": [
          {
            "id": "hw",
            "text": "Buy a hardware wallet directly from the maker, not a marketplace or second-hand."
          },
          {
            "id": "steel",
            "text": "Record the 24 words on steel, in two copies kept in separate safe places.",
            "note": "Paper burns at about 233 °C and house fires reach 600–1,000 °C ([why steel](https://coldcard.com/learn/seed-phrases/paper-vs-metal-seed-backup))."
          },
          {
            "id": "check",
            "text": "Run a dry-run recovery check before sending real money, and again after each firmware update."
          },
          {
            "id": "pass",
            "text": "Optional: add a passphrase, stored separately from the 24 words.",
            "note": "A lost passphrase means lost coins, and a typo opens a different, empty wallet ([details](https://trezor.io/guides/backups-recovery/advanced-wallets/what-is-a-passphrase))."
          },
          {
            "id": "test",
            "text": "Send a small test withdrawal first, checking the address on the device’s own screen."
          },
          {
            "id": "exch",
            "text": "Pick an FIU-registered exchange that allows Bitcoin withdrawals, with a low withdrawal fee."
          },
          {
            "id": "twofa",
            "text": "Turn on app-based two-factor login and a withdrawal address allow-list on the exchange."
          },
          {
            "id": "reserve",
            "text": "Open the liquid fund or sweep deposit for the reserve."
          },
          {
            "id": "emergency",
            "text": "Confirm six months of expenses sit in an emergency fund."
          },
          {
            "id": "letter",
            "text": "Write the letter for your family (below) and tell one trusted person where it is."
          }
        ]
      },
      {
        "type": "text",
        "title": "If something happens to me",
        "body": [
          "Coins in your own wallet are only as safe as your family’s ability to find and recover them. Write a short letter and keep it with your important papers, but never with the 24 words. A will can become public, so recovery details belong in a separate letter."
        ],
        "points": [
          "What exists: roughly how much Bitcoin, which hardware wallet, which exchange accounts.",
          "Where the steel backups and the passphrase are, each in its own place.",
          "Step by step: how to restore the wallet on a new device, using only the letter.",
          "Who to ask for help, and a warning that anyone asking for the 24 words is a scammer.",
          "How to sell and pay tax in India (Schedule VDA, 1% TDS), or simply keep holding.",
          "Rehearse it once a year: could someone follow it without you?"
        ]
      },
      {
        "type": "text",
        "title": "Tax in India (checked 24 Nov 2026)",
        "points": [
          "Buying, holding and moving coins between your own wallets: **no tax**.",
          "Selling or swapping: **30% of the gain + 4% cess**, plus surcharge when total income passes ₹50 lakh (10%), ₹1 crore (15%) or ₹2 crore (25%). Unlike shares, the surcharge isn’t capped at 15%, so the effective rate is 31.2%, 34.3%, 35.9% or 39%.",
          "Only the purchase cost is deductible. A loss can’t be set off against anything, even other crypto, and can’t be carried forward.",
          "**1% TDS** on the sale value, deducted by the exchange (threshold ₹50,000 a year for individuals without business income). It counts towards your tax; check it in Form 26AS and AIS.",
          "Report every sale in **Schedule VDA** of your return.",
          "Crypto received as a gift is taxed in the receiver’s hands above ₹50,000 a year (gifts from relatives are exempt).",
          "Big exits: spread sales across financial years (April to March) to stay in a lower surcharge band.",
          "Since 1 April 2026 these rules sit in the Income-tax Act, 2025 (sections 194, 393 and 2(111)); the rates didn’t change."
        ]
      },
      {
        "type": "checklist",
        "id": "yearly",
        "per": "year",
        "title": "Yearly review (every December)",
        "items": [
          {
            "id": "backup",
            "text": "Download a backup and export the CSV."
          },
          {
            "id": "pace",
            "text": "Check “On plan?”: contributions against the schedule."
          },
          {
            "id": "afford",
            "text": "Confirm next year’s step-ups are affordable; set a ceiling if not."
          },
          {
            "id": "reserve",
            "text": "Match the reserve here with the liquid fund balance."
          },
          {
            "id": "custody",
            "text": "Check the wallet: firmware, a dry-run recovery and both steel copies."
          },
          {
            "id": "tax",
            "text": "Check the year’s Budget for tax or rule changes, and set your surcharge band in Settings."
          },
          {
            "id": "route",
            "text": "Revisit where to buy: the Indian premium, fees, and the ETF question with a CA."
          },
          {
            "id": "emergency",
            "text": "Re-check the emergency fund (six months)."
          },
          {
            "id": "letter",
            "text": "Update the letter for your family."
          },
          {
            "id": "glide",
            "text": "From year 10: apply the glide path and sell anything still above the target share."
          }
        ]
      }
    ],
    "notes": [
      {
        "type": "facts",
        "title": "Where Bitcoin stands",
        "asOf": "2026-11-24",
        "items": [
          {
            "k": "Price",
            "v": "$60,447; ₹56.1 lakh at the global price, ₹63.6–63.9 lakh on CoinDCX and WazirX (a 13–14% premium).",
            "src": "https://www.bitstamp.net/markets/btc/usd/",
            "tag": "verified"
          },
          {
            "k": "All-time high",
            "v": "$126,080 on 6 Oct 2025, so −52% today.",
            "src": "https://www.bitstamp.net/markets/btc/usd/",
            "tag": "verified"
          },
          {
            "k": "Low this cycle",
            "v": "$55,081 on 21 Nov 2026, −56.4% from the high. Whether that was the bottom is unknown.",
            "src": "https://www.bitstamp.net/markets/btc/usd/",
            "tag": "verified"
          },
          {
            "k": "Rupee",
            "v": "₹92.80 per dollar (RBI reference rate, 23 Nov 2026).",
            "src": "https://www.rbi.org.in/",
            "tag": "verified"
          },
          {
            "k": "Past bear markets",
            "v": "−93% (2011), −87% (2015), −84% (2018), −78% (2022), each over about a year from the peak.",
            "src": "https://www.bitstamp.net/markets/btc/usd/",
            "tag": "verified"
          },
          {
            "k": "Growth is slowing",
            "v": "About 55% a year over 10 years, 38% over 4 and 1% over 5. Peak to peak: 101%, then 38%, then 17% a year.",
            "tag": "verified"
          },
          {
            "k": "Halvings",
            "v": "Last on 20 Apr 2024 (block 840,000). Next at block 1,050,000, around 29 Mar – 13 Apr 2028, then about 2032 and 2036.",
            "src": "https://bitbo.io/halving/",
            "tag": "estimate"
          }
        ]
      },
      {
        "type": "facts",
        "title": "Indian rules that matter",
        "asOf": "2026-11-24",
        "items": [
          {
            "k": "Tax on gains",
            "v": "30% + 4% cess, plus surcharge with no 15% cap (31.2–39% in all). Income-tax Act, 2025, section 194; unchanged by the Finance Act, 2026.",
            "src": "https://egazette.gov.in/WriteReadData/2025/265620.pdf",
            "srcLabel": "Act",
            "tag": "verified"
          },
          {
            "k": "Losses",
            "v": "Not deductible against any income and not carried forward.",
            "src": "https://egazette.gov.in/WriteReadData/2025/265620.pdf",
            "srcLabel": "Act",
            "tag": "verified"
          },
          {
            "k": "TDS",
            "v": "1% of the sale value (section 393); thresholds ₹50,000 or ₹10,000 a year.",
            "src": "https://egazette.gov.in/WriteReadData/2025/265620.pdf",
            "srcLabel": "Act",
            "tag": "verified"
          },
          {
            "k": "Finance Act, 2026",
            "v": "Only added reporting penalties and a TDS paperwork change for crypto; no rate change.",
            "src": "https://egazette.gov.in/WriteReadData/2026/271439.pdf",
            "srcLabel": "Finance Act",
            "tag": "verified"
          },
          {
            "k": "Exchanges",
            "v": "54 crypto platforms registered with FIU-IND as of 9 Mar 2026; 53 unregistered offshore platforms ordered blocked.",
            "src": "https://www.sansad.in/getFile/loksabhaquestions/annex/187/AU5805_lMTYNK.pdf?source=pqals",
            "srcLabel": "Lok Sabha answer",
            "tag": "verified"
          },
          {
            "k": "Regulation",
            "v": "Crypto is “presently unregulated” beyond tax, money-laundering and reporting rules. A parliamentary committee asked for a law in July 2026.",
            "src": "https://www.sansad.in/getFile/app/lsscommittee/Finance/18_Finance_36.pdf?source=app",
            "srcLabel": "Committee report",
            "tag": "verified"
          },
          {
            "k": "Bitcoin ETFs",
            "v": "GIFT City platforms barred from crypto-linked products from 31 Oct 2025. Overseas brokers under LRS remain possible; the Indian tax treatment isn’t officially settled.",
            "src": "https://www.medianama.com/2025/09/223-vested-finance-stops-crypto-etfs-india/",
            "tag": "verified"
          },
          {
            "k": "ETF tax view",
            "v": "Practitioners treat it as a foreign capital asset: 12.5% (plus cess and capped surcharge) after 24 months.",
            "src": "https://www.cryptact.com/en/blog/india-bitcoin-etf-tax",
            "tag": "estimate"
          },
          {
            "k": "US estate tax",
            "v": "Applies to non-residents’ US-listed holdings above $60,000, at 18–40%. India isn’t on the US estate-tax treaty list.",
            "src": "https://www.irs.gov/businesses/small-businesses-self-employed/frequently-asked-questions-on-estate-taxes-for-nonresidents-not-citizens-of-the-united-states",
            "srcLabel": "IRS",
            "tag": "verified"
          }
        ]
      },
      {
        "type": "sources",
        "title": "More reading",
        "items": [
          {
            "label": "Income-tax Act, 2025 (Gazette PDF)",
            "url": "https://egazette.gov.in/WriteReadData/2025/265620.pdf",
            "note": "Section 194 (rate), 393 (TDS), 2(111) (definition)."
          },
          {
            "label": "Finance Act, 2026 (Gazette PDF)",
            "url": "https://egazette.gov.in/WriteReadData/2026/271439.pdf"
          },
          {
            "label": "The new Act is in force (PIB, 1 Apr 2026)",
            "url": "https://pib.gov.in/PressReleasePage.aspx?PRID=2248005&reg=48&lang=2"
          },
          {
            "label": "LRS frequently asked questions (RBI)",
            "url": "https://www.rbi.org.in/scripts/FS_FAQs.aspx?Id=115"
          },
          {
            "label": "US estate-tax treaties (IRS)",
            "url": "https://www.irs.gov/businesses/small-businesses-self-employed/estate-gift-tax-treaties-international"
          },
          {
            "label": "iShares Bitcoin Trust (IBIT)",
            "url": "https://www.blackrock.com/us/individual/products/333011/ishares-bitcoin-trust-etf"
          },
          {
            "label": "Securing your wallet (bitcoin.org)",
            "url": "https://bitcoin.org/en/secure-your-wallet"
          },
          {
            "label": "Live block height and fees (mempool.space)",
            "url": "https://mempool.space/"
          }
        ]
      },
      {
        "type": "callout",
        "tone": "warn",
        "title": "Not financial advice",
        "body": [
          "This is a personal plan and calculator built from public information checked on 24 November 2026. Bitcoin can fall 80% and stay down for years, and Indian rules can change. Check the tax position with a chartered accountant before large sales, and before using the ETF route."
        ]
      }
    ]
  }
}
