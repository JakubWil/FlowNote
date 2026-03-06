import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import NotesApp from './NotesApp.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <NotesApp />
  </StrictMode>
)