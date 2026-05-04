import React from 'react'

export default function Footer({ onSecretTrigger }) {
  return (
    <footer className="py-8 border-t border-border/50">
      <div className="max-w-6xl mx-auto px-6 text-center">
        <p className="text-sm text-muted-foreground">
          © {new Date().getFullYear()} Kranthi Kiran. Built with React & Tailwind CSS
          <span
            onClick={onSecretTrigger}
            className="cursor-default select-none hover:text-green-400 transition-colors duration-700"
            title=""
          >.</span>
        </p>
      </div>
    </footer>
  )
}
