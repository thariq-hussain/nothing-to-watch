import type { VoroforceInstance } from '@/vf'
import { useCallback, useRef } from 'react'

export const useFilmPreviewPositioning = () => {
  const containerRef = useRef<HTMLDivElement>(null)
  const innerRef = useRef<HTMLDivElement>(null)
  const voroforceRef = useRef<VoroforceInstance | undefined>(undefined)

  const resetStyles = useCallback(() => {
    if (!containerRef.current) return
    if (!innerRef.current) return
    containerRef.current.style.translate = ''
    innerRef.current.style.scale = ''
    innerRef.current.style.opacity = ''
  }, [])

  const applyStyles = useCallback(
    (position: { x: number; y: number } | undefined, scale: number) => {
      if (!containerRef.current) return
      if (!innerRef.current) return
      if (!position) return
      containerRef.current.style.translate = `${position.x}px ${position.y}px`
      innerRef.current.style.scale = `${scale}`
      innerRef.current.style.opacity = `${scale}`
    },
    [],
  )

  const updateVoroforceRef = useCallback(
    (voroforce: VoroforceInstance | undefined) => {
      if (voroforce && !voroforceRef.current) {
        voroforceRef.current = voroforce
      }
    },
    [],
  )

  return {
    containerRef,
    innerRef,
    voroforceRef,
    resetStyles,
    applyStyles,
    updateVoroforceRef,
  }
}
