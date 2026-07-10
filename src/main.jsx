import React from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import { AmbientProvider } from './components/AmbientContext'
import './index.css'

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AmbientProvider>
      <App />
    </AmbientProvider>
  </React.StrictMode>
)
