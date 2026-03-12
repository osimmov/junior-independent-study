import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

// Entry point for the React app:
// - Finds the <div id="root"> in index.html
// - Mounts the <App /> component tree into it
createRoot(document.getElementById('root')).render(
  <StrictMode>
    {/* StrictMode helps catch common issues in development (it doesn't change production behavior). */}
    <App />
  </StrictMode>,
)
