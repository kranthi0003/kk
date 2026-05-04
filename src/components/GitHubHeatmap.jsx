import React from 'react'

export default function GitHubHeatmap() {
  return (
    <div className="w-full overflow-hidden rounded-xl border border-border/20">
      <img
        src="https://ghchart.rshah.org/3b82f6/kranthi0003"
        alt="Kranthi's GitHub contribution graph"
        className="w-full h-auto dark:brightness-90 dark:contrast-125"
        loading="lazy"
      />
    </div>
  )
}
