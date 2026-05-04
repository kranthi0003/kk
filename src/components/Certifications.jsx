import React from 'react'

const certifications = [
  {
    name: 'AWS Solutions Architect – Associate',
    short: 'AWS SAA',
    issuer: 'Amazon Web Services',
    icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/amazonwebservices/amazonwebservices-plain-wordmark.svg',
    color: 'from-orange-500 to-yellow-500',
    bg: 'bg-orange-500/5 hover:bg-orange-500/10',
    border: 'border-orange-500/20 hover:border-orange-500/40',
    text: 'text-orange-500',
    verifyUrl: 'https://aws.amazon.com/verification',
  },
  {
    name: 'Certified Professional Administrator',
    short: 'CB Admin',
    issuer: 'Couchbase',
    icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/couchbase/couchbase-original.svg',
    color: 'from-red-500 to-rose-500',
    bg: 'bg-red-500/5 hover:bg-red-500/10',
    border: 'border-red-500/20 hover:border-red-500/40',
    text: 'text-red-500',
    verifyUrl: 'https://www.credly.com/badges/21986ffd-3145-4312-8ed8-8f870454b7d5/public_url',
  },
  {
    name: 'Certified Associate Python Developer',
    short: 'CB Python',
    issuer: 'Couchbase',
    icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/couchbase/couchbase-original.svg',
    color: 'from-red-500 to-orange-500',
    bg: 'bg-red-500/5 hover:bg-red-500/10',
    border: 'border-red-500/20 hover:border-red-500/40',
    text: 'text-red-500',
    verifyUrl: 'https://www.credly.com/badges/6351ce61-4f3f-460e-935c-5b0e89e39c65',
  },
  {
    name: 'Certified Associate Architect with Capella',
    short: 'CB Architect',
    issuer: 'Couchbase',
    icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/couchbase/couchbase-original.svg',
    color: 'from-rose-500 to-red-600',
    bg: 'bg-rose-500/5 hover:bg-rose-500/10',
    border: 'border-rose-500/20 hover:border-rose-500/40',
    text: 'text-rose-500',
    verifyUrl: 'https://www.credly.com/badges/e87a7035-55d0-4612-b5b4-8dc031560433',
  },
  {
    name: 'GitHub Foundations',
    short: 'GH Foundations',
    issuer: 'GitHub / Microsoft',
    icon: 'https://cdn.simpleicons.org/github/white',
    color: 'from-gray-700 to-gray-900',
    bg: 'bg-gray-500/5 hover:bg-gray-500/10',
    border: 'border-gray-500/20 hover:border-gray-500/40',
    text: 'text-gray-400',
    verifyUrl: 'https://learn.microsoft.com/en-us/users/KranthiAkkumahanthi-6332/credentials/D4C54954A4FE7D48',
  },
]

export default function Certifications() {
  return (
    <section className="py-20">
      <div className="max-w-6xl mx-auto px-6">
        <div className="text-center mb-12">
          <p className="font-mono text-sm text-accent mb-2">Verified Credentials</p>
          <h2 className="font-heading font-bold text-3xl sm:text-4xl">Certifications</h2>
        </div>

        <div className="flex flex-wrap justify-center gap-3">
          {certifications.map((cert) => (
            <a
              key={cert.name}
              href={cert.verifyUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={`group relative flex items-center gap-3 px-4 py-3 rounded-full ${cert.bg} border ${cert.border} backdrop-blur-sm transition-all duration-300 hover:scale-105 hover:shadow-lg`}
              title={cert.name}
            >
              {/* Glow effect on hover */}
              <div className={`absolute inset-0 rounded-full bg-gradient-to-r ${cert.color} opacity-0 group-hover:opacity-10 transition-opacity duration-300 blur-sm`} />

              <img
                src={cert.icon}
                alt={cert.issuer}
                className="w-5 h-5 object-contain relative z-10"
              />
              <div className="relative z-10 flex flex-col">
                <span className="text-xs font-semibold leading-tight">{cert.short}</span>
                <span className="text-[10px] text-muted-foreground leading-tight">{cert.issuer}</span>
              </div>

              {/* Verify badge */}
              <svg className={`w-3.5 h-3.5 ${cert.text} opacity-0 group-hover:opacity-100 transition-all duration-300 relative z-10 -ml-1`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </a>
          ))}
        </div>
      </div>
    </section>
  )
}
