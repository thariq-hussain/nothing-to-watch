import { useEffect, useRef, useState } from 'react'
import { initVoroforce } from './vf'
import { store } from './store'

export function Voroforce() {
  const [error, setError] = useState<Error | null>(null)
  const isIniting = useRef(false)

  useEffect(() => {
    const tryInit = async () => {
      try {
        if (isIniting.current) return
        isIniting.current = true
        // biome-ignore lint/style/noNonNullAssertion: exists
        await initVoroforce(document.getElementById('voroforce')!)
        isIniting.current = false
      } catch (e) {
        setError(e as Error)
      }
    }

    // attempt initial
    void tryInit()
    const unsub = store.subscribe(
      (s) => s.preset,
      () => {
        setTimeout(() => {
          void tryInit()
        }, 750)
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
