import React from 'react'

// A heading or lead line whose words light up one after another as it
// scrolls up to the middle of the screen (the brightness is driven by
// lib/flow.js; without it, or under reduced motion, every word is simply
// lit). Plain text is split into words; an element among the children,
// such as a gradient word or an emoji, counts as one word.
export default function Words({ children }) {
  const parts = []
  let n = 0
  React.Children.forEach(children, (child, k) => {
    if (child === null || child === undefined || child === false || child === true) return
    if (typeof child === 'string' || typeof child === 'number') {
      String(child)
        .split(/(\s+)/)
        .forEach((w, j) => {
          if (!w) return
          if (/^\s+$/.test(w)) parts.push(w)
          else
            parts.push(
              <span key={`${k}.${j}`} className="fw" style={{ '--i': n++ }}>
                {w}
              </span>,
            )
        })
      return
    }
    parts.push(
      <span key={k} className="fw" style={{ '--i': n++ }}>
        {child}
      </span>,
    )
  })
  return (
    <span data-flow="words" style={{ '--n': n }}>
      {parts}
    </span>
  )
}
