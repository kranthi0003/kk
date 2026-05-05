import React, { useState, useCallback } from 'react'

const snippets = [
  {
    id: 'fizzbuzz',
    title: 'FizzBuzz',
    lang: 'JavaScript',
    icon: '🟨',
    code: `// Classic FizzBuzz — try changing the range!
for (let i = 1; i <= 20; i++) {
  if (i % 15 === 0) console.log("FizzBuzz")
  else if (i % 3 === 0) console.log("Fizz")
  else if (i % 5 === 0) console.log("Buzz")
  else console.log(i)
}`,
  },
  {
    id: 'fibonacci',
    title: 'Fibonacci',
    lang: 'JavaScript',
    icon: '🔢',
    code: `// Generate Fibonacci sequence
function fib(n) {
  const seq = [0, 1]
  for (let i = 2; i < n; i++)
    seq.push(seq[i-1] + seq[i-2])
  return seq
}
console.log(fib(15).join(', '))`,
  },
  {
    id: 'palindrome',
    title: 'Palindrome',
    lang: 'JavaScript',
    icon: '🔄',
    code: `// Check if a string is a palindrome
function isPalindrome(str) {
  const clean = str.toLowerCase().replace(/[^a-z0-9]/g, '')
  return clean === clean.split('').reverse().join('')
}

console.log(isPalindrome("racecar"))   // true
console.log(isPalindrome("hello"))     // false
console.log(isPalindrome("A man a plan a canal Panama"))`,
  },
  {
    id: 'sort',
    title: 'Quick Sort',
    lang: 'JavaScript',
    icon: '📊',
    code: `// Quick Sort implementation
function quickSort(arr) {
  if (arr.length <= 1) return arr
  const pivot = arr[0]
  const left = arr.slice(1).filter(x => x <= pivot)
  const right = arr.slice(1).filter(x => x > pivot)
  return [...quickSort(left), pivot, ...quickSort(right)]
}

const arr = [64, 34, 25, 12, 22, 11, 90]
console.log("Input: ", arr.join(', '))
console.log("Sorted:", quickSort(arr).join(', '))`,
  },
]

export default function CodePlayground() {
  const [activeSnippet, setActiveSnippet] = useState(0)
  const [code, setCode] = useState(snippets[0].code)
  const [output, setOutput] = useState('')
  const [running, setRunning] = useState(false)

  const switchSnippet = (idx) => {
    setActiveSnippet(idx)
    setCode(snippets[idx].code)
    setOutput('')
  }

  const runCode = useCallback(() => {
    setRunning(true)
    setOutput('')
    
    const logs = []
    const fakeConsole = {
      log: (...args) => logs.push(args.map(a => 
        typeof a === 'object' ? JSON.stringify(a, null, 2) : String(a)
      ).join(' ')),
    }

    try {
      const fn = new Function('console', code)
      fn(fakeConsole)
      setOutput(logs.join('\n'))
    } catch (err) {
      setOutput(`Error: ${err.message}`)
    }
    
    setRunning(false)
  }, [code])

  return (
    <section className="py-20 px-6">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-10">
          <p className="font-mono text-sm text-accent mb-2">Try It Out</p>
          <h2 className="font-heading font-bold text-3xl sm:text-4xl">Code Playground</h2>
        </div>

        {/* Snippet tabs */}
        <div className="flex flex-wrap gap-2 mb-4">
          {snippets.map((s, i) => (
            <button
              key={s.id}
              onClick={() => switchSnippet(i)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono transition-all ${
                activeSnippet === i
                  ? 'bg-accent text-accent-foreground shadow-md'
                  : 'bg-card border border-border/20 text-muted-foreground hover:text-foreground hover:border-border/40'
              }`}
            >
              <span>{s.icon}</span>
              {s.title}
            </button>
          ))}
        </div>

        {/* Editor */}
        <div className="rounded-2xl border border-border/30 shadow-xl overflow-hidden bg-card">
          {/* Editor header */}
          <div className="flex items-center justify-between px-4 py-2.5 border-b border-border/20 bg-muted/30">
            <div className="flex items-center gap-2">
              <div className="flex gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-red-400/60" />
                <div className="w-2.5 h-2.5 rounded-full bg-yellow-400/60" />
                <div className="w-2.5 h-2.5 rounded-full bg-green-400/60" />
              </div>
              <span className="text-[10px] font-mono text-muted-foreground ml-1">
                {snippets[activeSnippet].title}.js
              </span>
            </div>
            <button
              onClick={runCode}
              disabled={running}
              className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-accent text-accent-foreground text-xs font-mono font-medium hover:opacity-90 transition-all disabled:opacity-50"
            >
              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z" />
              </svg>
              Run
            </button>
          </div>

          {/* Code textarea */}
          <textarea
            value={code}
            onChange={(e) => setCode(e.target.value)}
            className="w-full h-[200px] sm:h-[240px] p-4 font-mono text-[13px] leading-relaxed bg-transparent text-foreground resize-none outline-none"
            spellCheck={false}
          />

          {/* Output */}
          {output && (
            <div className="border-t border-border/20">
              <div className="px-4 py-2 bg-muted/20 flex items-center gap-2">
                <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider">Output</span>
              </div>
              <pre className="px-4 py-3 font-mono text-[12px] text-foreground/80 max-h-[150px] overflow-y-auto whitespace-pre-wrap">
                {output}
              </pre>
            </div>
          )}
        </div>

        <p className="text-center text-[10px] text-muted-foreground/50 mt-4 font-mono">
          edit the code and hit Run — it executes in your browser
        </p>
      </div>
    </section>
  )
}
