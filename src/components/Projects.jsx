import React, { useState, useCallback, useMemo } from 'react'

const projects = [
  {
    title: 'SketchGate',
    description: 'A high-availability distributed rate limiter with penalty queues, built in Go. Designed for cloud-native architectures with support for sliding window counters and adaptive throttling.',
    technologies: ['Go', 'Distributed Systems', 'Rate Limiting', 'High Availability'],
    githubUrl: 'https://github.com/kranthi0003/SketchGate',
    demoUrl: null,
    image: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=600&h=400&fit=crop',
  },
  {
    title: 'Health Risk Prediction',
    description: 'Machine learning pipeline for predicting health risks using patient data. Built classification models with feature engineering, data preprocessing, and model evaluation.',
    technologies: ['Python', 'Machine Learning', 'Pandas', 'Scikit-learn'],
    githubUrl: 'https://github.com/kranthi0003/Health-Risk-Prediction',
    demoUrl: null,
    image: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=600&h=400&fit=crop',
  },
  {
    title: 'Portfolio Website',
    description: 'This very site — a modern single-page portfolio built with React, Tailwind CSS, and Vite. Features light/dark mode, 3D card effects, typing animations, and social embeds.',
    technologies: ['React', 'Tailwind CSS', 'Vite', 'JavaScript'],
    githubUrl: 'https://github.com/kranthi0003/kranthi-kiran-site',
    demoUrl: 'https://kranthikiran.com',
    image: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=600&h=400&fit=crop',
  },
  {
    title: '2028 Halving Strategy',
    description: 'Crypto halving cycle strategy tracker built with TypeScript. Analyzes historical Bitcoin halving data and models investment strategies around cycle timing.',
    technologies: ['TypeScript', 'Crypto', 'Data Analysis', 'Finance'],
    githubUrl: 'https://github.com/kranthi0003/2028-halving-strategy',
    demoUrl: null,
    image: 'https://images.unsplash.com/photo-1621761191319-c6fb62004040?w=600&h=400&fit=crop',
  },
  {
    title: 'IoT Smart Home Controller',
    description: 'An IoT project using NodeMCU and Arduino to remotely control lights and fans via a mobile app. Uses relays and WiFi for real-time device management.',
    technologies: ['C++', 'Arduino', 'IoT', 'NodeMCU', 'WiFi'],
    githubUrl: 'https://github.com/kranthi0003/Arduino-app-nodemcu-LEDon-off',
    demoUrl: null,
    image: 'https://images.unsplash.com/photo-1553406830-ef2513450d76?w=600&h=400&fit=crop',
  },
  {
    title: 'Rotating Solar Panel',
    description: 'Self-rotating solar panel system using gear motor and Arduino UNO. Increases solar energy efficiency by tracking sunlight throughout the day.',
    technologies: ['C++', 'Arduino', 'IoT', 'Solar Energy', 'Hardware'],
    githubUrl: 'https://github.com/kranthi0003/Rotating-Solar-Panel',
    demoUrl: null,
    image: 'https://images.unsplash.com/photo-1509391366360-2e959784a276?w=600&h=400&fit=crop',
  },
  {
    title: 'Speech Assistant',
    description: 'Python-based speech recognition and text-to-speech assistant. Processes voice commands and responds with synthesized speech for hands-free interaction.',
    technologies: ['Python', 'Speech Recognition', 'NLP', 'TTS'],
    githubUrl: 'https://github.com/kranthi0003/Speech-Assistant',
    demoUrl: null,
    image: 'https://images.unsplash.com/photo-1587560699334-cc4ff634909a?w=600&h=400&fit=crop',
  },
  {
    title: 'GitHub Foundations Quest',
    description: 'Gamified preparation tool for the GitHub Foundations Certification. Interactive learning with quizzes, progress tracking, and study materials.',
    technologies: ['GitHub', 'Certification', 'Education'],
    githubUrl: 'https://github.com/kranthi0003/github-foundations-quest',
    demoUrl: null,
    image: 'https://images.unsplash.com/photo-1618401471353-b98afee0b2eb?w=600&h=400&fit=crop',
  },
  {
    title: 'Data Visualization',
    description: 'Python data visualization projects using matplotlib, seaborn, and pandas. Explores datasets with charts, graphs, and statistical analysis.',
    technologies: ['Python', 'Matplotlib', 'Seaborn', 'Pandas'],
    githubUrl: 'https://github.com/kranthi0003/data_visualization',
    demoUrl: null,
    image: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=600&h=400&fit=crop',
  },
]

const GithubIcon = () => (
  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
    <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
  </svg>
)

const ExternalIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
  </svg>
)

const ChevronDown = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
  </svg>
)

const ChevronUp = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
  </svg>
)

export default function Projects() {
  const [showAll, setShowAll] = useState(false)
  const toggle = useCallback(() => setShowAll(v => !v), [])

  const { primary, additional } = useMemo(() => ({
    primary: projects.slice(0, 3),
    additional: projects.slice(3),
  }), [])

  const renderCard = (project, index, isAdditional = false) => (
    <div
      key={`${isAdditional ? 'add' : 'pri'}-${index}`}
      className={`card-3d bg-card rounded-2xl overflow-hidden border border-border/30 shadow-lg flex flex-col h-full transition-all duration-500 ${
        isAdditional && !showAll ? 'translate-y-8 opacity-0' : 'translate-y-0 opacity-100'
      }`}
      style={{ animationDelay: `${index * 0.2}s`, transitionDelay: isAdditional && showAll ? `${index * 200}ms` : '0ms' }}
    >
      {/* Project image */}
      <div className="relative h-48 overflow-hidden">
        <img
          src={project.image}
          alt={project.title}
          className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-card/80 to-transparent" />
      </div>

      <div className="p-6 flex flex-col flex-grow">
        <h3 className="font-heading text-lg font-semibold mb-2">{project.title}</h3>
        <p className="text-muted-foreground text-sm leading-relaxed mb-4">{project.description}</p>

        <div className="flex flex-wrap gap-2 mb-6">
          {project.technologies.map((tech) => (
            <span
              key={tech}
              className="px-2 py-1 bg-accent/10 text-accent text-xs rounded-md border border-accent/20"
            >
              {tech}
            </span>
          ))}
        </div>

        <div className="flex gap-3 mt-auto">
          {project.githubUrl && (
            <a
              href={project.githubUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-border/50 text-sm font-medium hover:bg-muted transition-all"
            >
              <GithubIcon /> Code
            </a>
          )}
          {project.demoUrl && (
            <a
              href={project.demoUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-accent text-accent-foreground text-sm font-medium hover-lift shadow-md"
            >
              <ExternalIcon /> Demo
            </a>
          )}
        </div>
      </div>
    </div>
  )

  return (
    <section id="projects" className="py-24 bg-muted/30">
      <div className="max-w-6xl mx-auto px-6">
        <div className="text-center mb-16">
          <p className="font-mono text-sm text-accent mb-2">What I've Built</p>
          <h2 className="font-heading font-bold text-3xl sm:text-4xl mb-4">Projects</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            A showcase of my technical skills and problem-solving through real-world applications
          </p>
        </div>

        {/* Primary projects */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {primary.map((p, i) => renderCard(p, i))}
        </div>

        {/* Show more toggle */}
        {additional.length > 0 && (
          <div className="flex justify-center mt-12">
            <button
              onClick={toggle}
              className="group inline-flex items-center gap-3 px-8 py-4 bg-accent/10 hover:bg-accent/20 text-accent border border-accent/20 hover:border-accent/30 rounded-full font-semibold transition-all duration-300 hover:scale-105"
            >
              <span>{showAll ? 'Show Less Projects' : 'Show More Projects'}</span>
              {showAll ? <ChevronUp /> : <ChevronDown />}
            </button>
          </div>
        )}

        {/* Additional projects */}
        {additional.length > 0 && (
          <div className={`transition-all duration-700 ease-in-out overflow-hidden ${showAll ? 'max-h-[6000px] opacity-100 mt-12' : 'max-h-0 opacity-0 mt-0'}`}>
            <div className="text-center mb-8">
              <h3 className="font-heading text-2xl font-semibold text-muted-foreground">Additional Projects</h3>
              <div className="w-24 h-0.5 bg-accent/30 mx-auto mt-2" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {additional.map((p, i) => renderCard(p, i, true))}
            </div>
          </div>
        )}

        {/* View all on GitHub */}
        <div className="text-center mt-16">
          <a
            href="https://github.com/kranthi0003"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-3 px-8 py-4 rounded-xl border-2 border-primary text-primary font-medium hover:bg-accent hover:text-accent-foreground hover:border-accent transition-all hover-lift"
          >
            <GithubIcon /> View All Projects on GitHub
          </a>
        </div>
      </div>
    </section>
  )
}
