import { MIN_LERP_EASING_TYPES, type VoroforceCell, easedMinLerp } from '@/vf'
import { useCallback, useRef } from 'react'
import { clamp, lerp } from '../../../../utils/math'

export const useFilmPreviewAnimation = (
  config: { neighborOriginMod?: number; scaleMod?: number } | undefined,
  bounds: { width: number; height: number },
  reverseX: boolean,
  reverseY: boolean,
) => {
  const neighborOriginMod = useRef(
    config && 'neighborOriginMod' in config
      ? (config.neighborOriginMod ?? 1)
      : 1,
  )
  const scaleMod = useRef(
    config && 'scaleMod' in config ? (config.scaleMod ?? 1) : 1,
  )

  const cellsRef = useRef<VoroforceCell[]>(null)
  const primaryCellRef = useRef<VoroforceCell>(null)
  const topNeighborCellRef = useRef<{ x: number; y: number }>(undefined)
  const bottomNeighborCellRef = useRef<{ x: number; y: number }>(undefined)
  const positionRef = useRef<{ x: number; y: number }>(undefined)
  const scaleRef = useRef<number>(0)
  const opacityRef = useRef<number>(0)
  const frameRef = useRef<number>(0)

  const onCellFocused = useCallback(
    (
      { cell }: { cell?: VoroforceCell },
      voroforce: any,
      isSmallScreen: boolean,
    ) => {
      if (!voroforce) return
      if (isSmallScreen) return
      if (cell) primaryCellRef.current = cell
      if (!primaryCellRef.current || !cellsRef.current) return

      const {
        config: {
          lattice: { cols },
        },
      } = voroforce
      topNeighborCellRef.current =
        cellsRef.current[primaryCellRef.current.index - cols] ??
        topNeighborCellRef.current

      bottomNeighborCellRef.current =
        cellsRef.current[primaryCellRef.current.index + cols] ??
        bottomNeighborCellRef.current
    },
    [],
  )

  const calculateTargetPosition = useCallback(() => {
    if (!primaryCellRef.current) return null
    if (!topNeighborCellRef.current || !bottomNeighborCellRef.current)
      return null

    const neighborCell = reverseY
      ? bottomNeighborCellRef.current
      : topNeighborCellRef.current

    const origin =
      neighborOriginMod.current === 1
        ? neighborCell
        : {
            x: lerp(
              primaryCellRef.current.x,
              neighborCell.x,
              neighborOriginMod.current,
            ),
            y: lerp(
              primaryCellRef.current.y,
              neighborCell.y,
              neighborOriginMod.current,
            ),
          }

    return {
      x:
        origin.x -
        (reverseX ? bounds.width * 0.5 : bounds.width * 0.25) *
          (scaleMod.current ?? 1),
      y: origin.y - (reverseY ? 0 : bounds.height),
    }
  }, [bounds, reverseX, reverseY])

  const updateAnimationValues = useCallback(
    (pointer: any) => {
      if (!primaryCellRef.current) return false
      if (!topNeighborCellRef.current || !bottomNeighborCellRef.current)
        return false

      const targetPosition = calculateTargetPosition()
      if (!targetPosition) return false

      if (!positionRef.current) {
        positionRef.current = {
          x: targetPosition.x,
          y: targetPosition.y,
        }
      } else {
        positionRef.current.x = easedMinLerp(
          positionRef.current.x,
          targetPosition.x,
          0.1,
          MIN_LERP_EASING_TYPES.easeInOutQuad,
        )
        positionRef.current.y = easedMinLerp(
          positionRef.current.y,
          targetPosition.y,
          0.1,
          MIN_LERP_EASING_TYPES.easeInOutQuad,
        )
      }

      const customSpeedScale = 1.25 - clamp(0.25, 1.25, pointer.speedScale * 4)
      scaleRef.current = easedMinLerp(
        scaleRef.current,
        customSpeedScale * (scaleMod.current ?? 1),
        0.05,
        MIN_LERP_EASING_TYPES.easeInOutQuad,
      )
      opacityRef.current = easedMinLerp(
        opacityRef.current,
        customSpeedScale,
        0.05,
      )

      frameRef.current++
      return true
    },
    [calculateTargetPosition],
  )

  const checkBoundaryConditions = useCallback(
    (
      setReverseX: (reverse: boolean) => void,
      setReverseY: (reverse: boolean) => void,
    ) => {
      if (frameRef.current % 60 !== 0) return
      if (!primaryCellRef.current || !topNeighborCellRef.current) return

      const topOrigin =
        neighborOriginMod.current === 1
          ? topNeighborCellRef.current
          : {
              x: lerp(
                primaryCellRef.current.x,
                topNeighborCellRef.current.x,
                neighborOriginMod.current,
              ),
              y: lerp(
                primaryCellRef.current.y,
                topNeighborCellRef.current.y,
                neighborOriginMod.current,
              ),
            }

      // Y boundary checks
      if (topOrigin.y - bounds.height < 0) {
        setReverseY(true)
      } else if (reverseY && topOrigin.y - bounds.height > bounds.height) {
        setReverseY(false)
      }

      // X boundary checks
      const width = bounds.width * 0.25
      const origin = calculateTargetPosition()
      if (!origin) return

      if (origin.x - width < 0) {
        setReverseX(true)
      } else if (reverseX && origin.x - width > width) {
        setReverseX(false)
      }
    },
    [bounds, reverseX, reverseY, calculateTargetPosition],
  )

  return {
    cellsRef,
    primaryCellRef,
    positionRef,
    scaleRef,
    opacityRef,
    onCellFocused,
    updateAnimationValues,
    checkBoundaryConditions,
  }
}
