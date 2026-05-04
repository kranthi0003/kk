import React from 'react'

export default function GitHubHeatmap() {
  return (
    <div className="w-full overflow-hidden rounded-xl">
      <img
        src="https://github-readme-activity-graph.vercel.app/graph?username=kranthi0003&bg_color=transparent&color=94a3b8&line=60a5fa&point=e2e8f0&area=true&area_color=60a5fa&hide_border=true"
        alt="Kranthi's GitHub activity graph"
        className="w-full h-auto"
        loading="lazy"
      />
    </div>
  )
}
