import React from 'react'

const skillsData = [
  {
    category: 'Languages',
    skills: ['Python', 'Go', 'Java', 'C++', 'Bash', 'Ruby'],
  },
  {
    category: 'Cloud & Infrastructure',
    skills: ['AWS', 'Azure', 'Lambda', 'S3', 'ECS', 'EC2', 'Kubernetes', 'Docker', 'Terraform'],
  },
  {
    category: 'Databases & Data',
    skills: ['PostgreSQL', 'MySQL', 'DynamoDB', 'Couchbase', 'Redis', 'Kafka', 'Spark'],
  },
  {
    category: 'Observability',
    skills: ['Splunk', 'Prometheus', 'Datadog', 'Grafana', 'CloudWatch', 'PagerDuty'],
  },
  {
    category: 'DevOps & CI/CD',
    skills: ['GitHub Actions', 'ArgoCD', 'Terraform', 'Git', 'REST APIs'],
  },
  {
    category: 'Certifications',
    skills: ['AWS SAA', 'AWS GenAI', 'AWS Well-Architected', 'Couchbase CAA'],
  },
]

export default function Skills() {
  return (
    <section id="skills" className="py-24">
      <div className="max-w-6xl mx-auto px-6">
        <div className="text-center mb-16">
          <p className="font-mono text-sm text-accent mb-2">What I Work With</p>
          <h2 className="font-heading font-bold text-3xl sm:text-4xl">Skills & Expertise</h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {skillsData.map((section) => (
            <div
              key={section.category}
              className="card-3d bg-card rounded-2xl p-6 border border-border/30 shadow-lg"
            >
              <h3 className="font-heading font-semibold text-lg mb-4 text-accent">
                {section.category}
              </h3>
              <div className="flex flex-wrap gap-2">
                {section.skills.map((skill) => (
                  <span
                    key={skill}
                    className="px-3 py-1 rounded-full text-sm font-medium bg-muted text-muted-foreground border border-border/50 hover:bg-accent hover:text-accent-foreground transition-colors duration-200"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
