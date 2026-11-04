import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '../index.css'
import { Phase2Harness } from './Phase2Harness.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Phase2Harness />
  </StrictMode>,
)
