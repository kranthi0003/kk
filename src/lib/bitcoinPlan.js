// The 13-year Bitcoin plan shown at #/bitcoin (opened from the Bitcoin icon in
// the navbar). Every word and number on the page comes from here; the page
// itself (src/components/BitcoinPlan.jsx) only renders it. Facts were checked
// on 24 Nov 2026.
//
// plan.openLots is the starting stack: every transaction into the cold-storage
// wallet before the plan began. The blockchain doesn't record what was paid,
// so each is costed at Bitcoin's price in the hour it arrived (mempool.space
// hourly USD price; that day's USD/INR rate from CoinGecko). plan.openBase is
// the stack's value when the plan began, where the projections start.
export const BITCOIN_PLAN = {
  "meta": {
    "bar": "Bitcoin plan",
    "title": "The 13-year stack",
    "kicker": "Bitcoin · Dec 2026 – Nov 2039",
    "subtitle": "$500 a month into Bitcoin, up 10% every six months.",
    "footer": "Not financial advice. Prices from CoinGecko, the wallet balance from mempool.space.",
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
    "market": {
      "markets": "https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=250&page=1&price_change_percentage=1h,24h,7d",
      "trending": "https://api.coingecko.com/api/v3/search/trending",
      "global": "https://api.coingecko.com/api/v3/global",
      "companies": "https://api.coingecko.com/api/v3/companies/public_treasury/bitcoin",
      "governments": "https://api.coingecko.com/api/v3/governments/public_treasury/bitcoin",
      "coinUrl": "https://www.coingecko.com/en/coins/{id}",
      "every": 300,
      "minVolume": 5000000
    },
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
    "kind_out": "To my wallet",
    "kind_in": "Back to exchange",
    "kind_res": "Reserve cash",
    "venueHint": "Exchange or wallet",
    "yourStack": "The stack"
  },
  "views": [
    {
      "id": "today",
      "label": "This month"
    },
    {
      "id": "log",
      "label": "Ledger"
    },
    {
      "id": "grow",
      "label": "Projections"
    },
    {
      "id": "plan",
      "label": "Plan"
    },
    {
      "id": "coins",
      "label": "Coin tracker"
    }
  ],
  "phases": [
    {
      "id": "stack",
      "name": "Stack",
      "from": 1,
      "to": 4
    },
    {
      "id": "compound",
      "name": "Compound",
      "from": 5,
      "to": 9
    },
    {
      "id": "protect",
      "name": "Protect",
      "from": 10,
      "to": 13
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
        "note": "Within 30% of the high: buy with 80% and put 20% in the reserve."
      },
      {
        "label": "30% below the high",
        "from": 0.3,
        "core": 0.8,
        "reserve": 0.2,
        "deploy": 0.3333333333333333,
        "note": "30–50% below the high: keep the 80/20 split and deploy a third of the reserve, once."
      },
      {
        "label": "50% below the high",
        "from": 0.5,
        "core": 1,
        "reserve": 0,
        "deploy": 0.5,
        "note": "50–70% below the high: buy with all of it, plus half the reserve, once."
      },
      {
        "label": "70% below the high",
        "from": 0.7,
        "core": 1,
        "reserve": 0,
        "deploy": 1,
        "note": "More than 70% below the high: buy with all of it and deploy the rest of the reserve."
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
  "sections": {
    "plan": [
      {
        "type": "glance",
        "title": "The plan"
      },
      {
        "type": "schedule",
        "title": "Year by year"
      },
      {
        "type": "ladder",
        "title": "Buying rules"
      },
      {
        "type": "list",
        "title": "Rules",
        "items": [
          {
            "tag": "Never",
            "tone": "warn",
            "text": "Leverage, futures, lending or “earn” products."
          },
          {
            "tag": "Never",
            "tone": "warn",
            "text": "Typing, photographing or sharing the 24 words."
          },
          {
            "tag": "Always",
            "tone": "good",
            "text": "Six months of expenses in cash first, outside crypto."
          },
          {
            "tag": "Always",
            "tone": "good",
            "text": "Only money you won’t need for ten years."
          },
          {
            "tag": "Rule",
            "text": "Bitcoin only. In India every swap is a taxable sale."
          },
          {
            "tag": "Rule",
            "text": "Move coins to your own wallet once the exchange holds $1,500."
          },
          {
            "tag": "Rule",
            "text": "Change the plan only at the December review."
          },
          {
            "tag": "Protect",
            "text": "From December 2035, keep 90%, 80%, 70%, then 60% in Bitcoin and move the rest to safer funds."
          }
        ]
      },
      {
        "type": "text",
        "title": "Tax in India",
        "points": [
          "Buying, holding and moving coins to your own wallet: no tax.",
          "Selling: 30% of the gain plus 4% cess (31.2%), more with a surcharge above ₹50 lakh income.",
          "Losses can’t be set off or carried forward.",
          "Exchanges deduct 1% TDS on sales. Report each sale in Schedule VDA."
        ]
      },
      {
        "type": "checklist",
        "id": "custody",
        "title": "Wallet set-up",
        "items": [
          {
            "id": "hw",
            "text": "Buy a hardware wallet from the maker"
          },
          {
            "id": "steel",
            "text": "Put the 24 words on steel: two copies, two places"
          },
          {
            "id": "check",
            "text": "Test a recovery before sending real money"
          },
          {
            "id": "test",
            "text": "Send a small test withdrawal first"
          },
          {
            "id": "twofa",
            "text": "Turn on exchange 2FA and a withdrawal allow-list"
          },
          {
            "id": "emergency",
            "text": "Keep six months of expenses in an emergency fund"
          },
          {
            "id": "letter",
            "text": "Write a recovery letter for family"
          }
        ]
      },
      {
        "type": "checklist",
        "id": "yearly",
        "per": "year",
        "title": "Every December",
        "items": [
          {
            "id": "backup",
            "text": "Back up and export the CSV"
          },
          {
            "id": "afford",
            "text": "Check next year’s step-ups are affordable"
          },
          {
            "id": "custody",
            "text": "Update the wallet firmware and test a recovery"
          },
          {
            "id": "tax",
            "text": "Check the Budget for tax changes"
          },
          {
            "id": "emergency",
            "text": "Top up the emergency fund"
          },
          {
            "id": "glide",
            "text": "From year 10, sell anything above the target share"
          }
        ]
      }
    ]
  }
}
