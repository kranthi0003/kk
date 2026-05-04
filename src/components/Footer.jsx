import React from 'react'

export default function Footer() {
  return (
    <footer className="py-8 border-t border-border/50">
      <div className="max-w-6xl mx-auto px-6 text-center">
        <p className="text-sm text-muted-foreground">
          © {new Date().getFullYear()} Kranthi Kiran. Built with React & Tailwind CSS.
        </p>
      </div>
    </footer>
  )
}
