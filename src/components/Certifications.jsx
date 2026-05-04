import React from 'react'

const certifications = [
  {
    name: 'AWS Solutions Architect – Associate',
    issuer: 'Amazon Web Services',
    icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/amazonwebservices/amazonwebservices-plain-wordmark.svg',
    color: 'from-orange-500 to-yellow-500',
    verifyUrl: 'https://aws.amazon.com/verification',
  },
  {
    name: 'AWS Generative AI',
    issuer: 'Amazon Web Services',
    icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/amazonwebservices/amazonwebservices-plain-wordmark.svg',
    color: 'from-purple-500 to-pink-500',
    verifyUrl: 'https://aws.amazon.com/verification',
  },
  {
    name: 'AWS Well-Architected',
    issuer: 'Amazon Web Services',
    icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/amazonwebservices/amazonwebservices-plain-wordmark.svg',
    color: 'from-blue-500 to-cyan-500',
    verifyUrl: 'https://aws.amazon.com/verification',
  },
  {
    name: 'Couchbase Certified Professional Administrator',
    issuer: 'Couchbase',
    icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/couchbase/couchbase-original.svg',
    color: 'from-red-500 to-rose-500',
    verifyUrl: 'https://www.credly.com/badges/21986ffd-3145-4312-8ed8-8f870454b7d5/public_url',
  },
  {
    name: 'Couchbase Certified Associate Python Developer',
    issuer: 'Couchbase',
    icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/couchbase/couchbase-original.svg',
    color: 'from-red-500 to-orange-500',
    verifyUrl: 'https://www.credly.com/badges/6351ce61-4f3f-460e-935c-5b0e89e39c65',
  },
  {
    name: 'Couchbase Certified Associate Architect with Capella',
    issuer: 'Couchbase',
    icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/couchbase/couchbase-original.svg',
    color: 'from-rose-500 to-red-600',
    verifyUrl: 'https://www.credly.com/badges/e87a7035-55d0-4612-b5b4-8dc031560433',
  },
  {
    name: 'GitHub Foundations',
    issuer: 'GitHub / Microsoft',
    icon: 'https://cdn.simpleicons.org/github/white',
    color: 'from-gray-700 to-gray-900',
    verifyUrl: 'https://learn.microsoft.com/en-us/users/KranthiAkkumahanthi-6332/credentials/D4C54954A4FE7D48',
  },
]

const VerifyIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
  </svg>
)

export default function Certifications() {
  return (
    <section className="py-24">
      <div className="max-w-6xl mx-auto px-6">
        <div className="text-center mb-16">
          <p className="font-mono text-sm text-accent mb-2">Verified Credentials</p>
          <h2 className="font-heading font-bold text-3xl sm:text-4xl">Certifications</h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {certifications.map((cert) => (
            <a
              key={cert.name}
              href={cert.verifyUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="group card-3d bg-card rounded-2xl overflow-hidden border border-border/30 shadow-lg flex flex-col hover:border-accent/30 transition-all duration-300"
            >
              {/* Gradient top */}
              <div className={`h-2 bg-gradient-to-r ${cert.color}`} />

              <div className="p-6 flex flex-col items-center text-center gap-4 flex-1">
                <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center p-3 group-hover:scale-110 transition-transform duration-300">
                  <img src={cert.icon} alt={cert.issuer} className="w-full h-full object-contain" />
                </div>
                <div className="flex-1">
                  <h3 className="font-heading font-semibold text-sm mb-1 leading-tight">{cert.name}</h3>
                  <p className="text-xs text-muted-foreground">{cert.issuer}</p>
                </div>
                <span className="inline-flex items-center gap-1.5 text-xs text-accent font-medium opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <VerifyIcon /> Verify
                </span>
              </div>
            </a>
          ))}
        </div>
      </div>
    </section>
  )
}
