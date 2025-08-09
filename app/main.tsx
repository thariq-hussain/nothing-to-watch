import { StrictMode, useEffect, useRef, useState } from 'react'
import { createRoot } from 'react-dom/client'
import App from './app'
import ErrorBoundary from './cmps/common/error-boundary'
import config from './config'
import { store } from './store'
import { animateDocTitleSuffix } from './utils/anim'
import { initTelemetry } from './utils/telemetry/init-telemetry'
import { initVoroforce, safeInitVoroforce } from './vf'
import './styles.css'

initTelemetry()

function VoroforceInit() {
  const [error, setError] = useState<Error | null>(null)
  const didInit = useRef(false)

  useEffect(() => {
    const tryInit = async () => {
      if (didInit.current) return
      const state = store.getState()
      if (!state.preset) return
      try {
        didInit.current = true
        // biome-ignore lint/style/noNonNullAssertion: exists
        await initVoroforce(document.getElementById('voroforce')!)
      } catch (e) {
        setError(e as Error)
      }
    }

    // attempt initial
    void tryInit()
    const unsub = store.subscribe(
      (s) => s.preset,
      () => {
        void tryInit()
      },
    )
    return () => {
      unsub()
    }
  }, [])

  if (error) {
    throw error
  }

  return null
}

if (!config.standaloneMode) {
  // biome-ignore lint/style/noNonNullAssertion: exists
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <ErrorBoundary>
        <App />
        <VoroforceInit />
      </ErrorBoundary>
    </StrictMode>,
  )
} else {
  window.addEventListener('load', safeInitVoroforce)
}

animateDocTitleSuffix()
