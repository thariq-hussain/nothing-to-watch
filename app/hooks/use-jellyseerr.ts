import { useCallback, useEffect, useState } from 'react'
import { jellyseerr } from '../utils/jellyseerr'

export const useJellyseerr = (tmdbId?: number) => {
  const [loading, setLoading] = useState(false)
  const [available, setAvailable] = useState(false)
  const [requested, setRequested] = useState(false)
  const [label, setLabel] = useState<string>('')

  const refresh = useCallback(async () => {
    if (!tmdbId || !jellyseerr.isConfigured) return
    setLoading(true)
    const res = await jellyseerr.getMovieAvailability(tmdbId)
    setAvailable(res.available)
    setRequested(res.requested)
    setLabel(res.label)
    setLoading(false)
  }, [tmdbId])

  const request = useCallback(async () => {
    if (!tmdbId || !jellyseerr.isConfigured) return false
    setLoading(true)
    const ok = await jellyseerr.requestMovie(tmdbId)
    await refresh()
    setLoading(false)
    return ok
  }, [tmdbId, refresh])

  useEffect(() => {
    void refresh()
  }, [refresh])

  return {
    configured: jellyseerr.isConfigured,
    loading,
    available,
    requested,
    label,
    refresh,
    request,
  }
}


