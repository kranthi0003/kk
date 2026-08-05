import React from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import MatrixRain from './components/MatrixRain'
import CursorTrail from './components/CursorTrail'
import { AmbientProvider } from './components/AmbientContext'
import './index.css'

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AmbientProvider>
      <App />
      <MatrixRain />
      <CursorTrail />
    </AmbientProvider>
  </React.StrictMode>
)
