type JellyseerrMovieResponse = {
  id: number
  mediaInfo?: {
    status?: number
    downloadStatus?: number
    requests?: Array<{ id: number; status?: number }>
  }
}

const env = (import.meta as unknown as {
  env: {
    VITE_JELLYSEERR_URL?: string
    VITE_JELLYSEERR_API_KEY?: string
  }
}).env

const JELLYSEERR_URL = env?.VITE_JELLYSEERR_URL
const JELLYSEERR_API_KEY = env?.VITE_JELLYSEERR_API_KEY

const hasConfig = Boolean(JELLYSEERR_URL && JELLYSEERR_API_KEY)

const headers: HeadersInit = JELLYSEERR_API_KEY
  ? { 'X-Api-Key': JELLYSEERR_API_KEY, 'Content-Type': 'application/json' }
  : { 'Content-Type': 'application/json' }

const mapStatusToAvailability = (status?: number) => {
  // Jellyseerr/Overseerr media status: 1 Unknown, 2 Pending, 3 Processing, 4 Partially Available, 5 Available
  if (!status) return { available: false, label: 'Unknown' }
  if (status >= 5) return { available: true, label: 'Available' }
  if (status === 4) return { available: false, label: 'Partially available' }
  if (status === 3) return { available: false, label: 'Processing' }
  if (status === 2) return { available: false, label: 'Requested' }
  return { available: false, label: 'Not available' }
}

export const jellyseerr = {
  isConfigured: hasConfig,

  async getMovieAvailability(tmdbId: number): Promise<{
    available: boolean
    label: string
    requested: boolean
  }> {
    if (!hasConfig) return { available: false, label: 'Unavailable', requested: false }
    try {
      const res = await fetch(`${JELLYSEERR_URL}/api/v1/movie/${tmdbId}`, {
        headers,
      })
      if (!res.ok) throw new Error(String(res.status))
      const data = (await res.json()) as JellyseerrMovieResponse
      const { available, label } = mapStatusToAvailability(
        data.mediaInfo?.status ?? data.mediaInfo?.downloadStatus,
      )
      const requested = Boolean(data.mediaInfo?.requests?.length)
      return { available, label, requested }
    } catch {
      return { available: false, label: 'Unavailable', requested: false }
    }
  },

  async requestMovie(tmdbId: number): Promise<boolean> {
    if (!hasConfig) return false
    try {
      const res = await fetch(`${JELLYSEERR_URL}/api/v1/request`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ mediaType: 'movie', tmdbId }),
      })
      return res.ok
    } catch {
      return false
    }
  },
}

export type JellyseerrApi = typeof jellyseerr


