import React, { useState, useEffect } from 'react'

export default function GitHubHeatmap() {
  const [isDark, setIsDark] = useState(document.documentElement.classList.contains('dark'))

  useEffect(() => {
    const observer = new MutationObserver(() => {
      setIsDark(document.documentElement.classList.contains('dark'))
    })
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] })
    return () => observer.disconnect()
  }, [])

  const graphUrl = isDark
    ? 'https://github-readme-activity-graph.vercel.app/graph?username=kranthi0003&bg_color=transparent&color=94a3b8&line=60a5fa&point=e2e8f0&area=true&area_color=60a5fa&hide_border=true'
    : 'https://github-readme-activity-graph.vercel.app/graph?username=kranthi0003&bg_color=transparent&color=64748b&line=2563eb&point=1a1a2e&area=true&area_color=2563eb&hide_border=true'

  return (
    <div className="w-full overflow-hidden rounded-xl">
      <img
        key={isDark ? 'dark' : 'light'}
        src={graphUrl}
        alt="Kranthi's GitHub activity graph"
        className="w-full h-auto"
        loading="lazy"
      />
    </div>
  )
}
