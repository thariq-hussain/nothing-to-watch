import { useEffect, useState } from 'react'
import useMeasure from 'react-use-measure'

import { useShallowState } from '@/store'
import type { VoroforceCell } from '@/vf'
import { useMediaQuery } from '../../../../hooks/use-media-query'
import { down } from '../../../../utils/mq'
import { cn } from '../../../../utils/tw'
import { Badge } from '../../../ui/badge'
import { FilmPoster } from '../shared/film-poster'
import { FilmRatingGauge } from '../shared/film-rating-gauge'
import { useFilmPreviewAnimation } from './use-film-preview-animation'
import { useFilmPreviewPositioning } from './use-film-preview-positioning'

export const FilmPreview = ({ poster = false }) => {
  const isSmallScreen = useMediaQuery(down('md'))
  const [measureRef, bounds] = useMeasure()
  const [reverseX, setReverseX] = useState(false)
  const [reverseY, setReverseY] = useState(false)

  const { film, isPreviewMode, config, voroforce } = useShallowState(
    (state) => ({
      film: state.film,
      isPreviewMode: state.isPreviewMode,
      config: state.config?.filmPreview,
      voroforce: state.voroforce,
    }),
  )

  const {
    containerRef,
    innerRef,
    voroforceRef,
    resetStyles,
    applyStyles,
    updateVoroforceRef,
  } = useFilmPreviewPositioning()

  const {
    cellsRef,
    positionRef,
    scaleRef,
    onCellFocused,
    updateAnimationValues,
    checkBoundaryConditions,
  } = useFilmPreviewAnimation(config, bounds, reverseX, reverseY)

  if (config && 'enabled' in config && !config.enabled) return null

  updateVoroforceRef(voroforce)

  useEffect(() => {
    if (!voroforceRef.current) return
    if (isSmallScreen) {
      resetStyles()
      return
    }
    const {
      ticker,
      controls: { pointer },
    } = voroforceRef.current

    const onTick = () => {
      const success = updateAnimationValues(pointer)
      if (!success) return

      applyStyles(positionRef.current, scaleRef.current)
      checkBoundaryConditions(setReverseX, setReverseY)
    }

    ticker.addEventListener('tick', onTick)

    return () => {
      ticker.removeEventListener('tick', onTick)
    }
  }, [
    isSmallScreen,
    bounds,
    reverseY,
    reverseX,
    updateAnimationValues,
    checkBoundaryConditions,
    applyStyles,
    resetStyles,
  ])

  useEffect(() => {
    if (!voroforceRef.current) return
    if (isSmallScreen) return
    const { controls, cells } = voroforceRef.current
    if (!cellsRef.current) cellsRef.current = cells as VoroforceCell[]

    const handleCellFocused = (event: any) => {
      onCellFocused(event, voroforceRef.current, isSmallScreen)
    }

    controls.addEventListener('focused', handleCellFocused)
    return () => {
      controls.removeEventListener('focused', handleCellFocused)
    }
  }, [isSmallScreen, onCellFocused])

  return (
    <>
      {/*{isPreviewMode && film && (*/}
      {film && (
        <div
          ref={(element) => {
            containerRef.current = element
            measureRef(element)
          }}
          className={cn(
            'pointer-events-none fixed top-0 left-0 z-10 w-full max-w-full p-4 opacity-0 transition-opacity duration-700 md:w-300 md:p-0 md:will-change-transform lg:p-9',
            {
              '!opacity-100': isPreviewMode,
            },
          )}
        >
          <div
            ref={innerRef}
            className={cn(
              'flex origin-top-left flex-row gap-3 md:will-change-[transform,opacity] lg:gap-9',
              {
                'flex-row-reverse': reverseX,
              },
            )}
          >
            {poster && (
              <FilmPoster
                film={film}
                className={cn(
                  'w-full max-w-[150px] shrink-0 basis-1/4 rounded-2xl lg:max-w-[300px] lg:basis-1/4',
                  {
                    'pointer-events-auto': isPreviewMode,
                  },
                )}
              />
            )}
            <div
              className={cn(
                'flex basis-full flex-row justify-between gap-3 md:basis-3/4 md:flex-col md:justify-start md:gap-4 lg:gap-6',
                {
                  'items-end text-right': reverseX,
                  'md:flex-col-reverse': reverseY,
                },
              )}
            >
              <div
                className={cn('flex flex-col gap-3 lg:justify-start lg:gap-3', {
                  'flex-col-reverse': reverseY,
                })}
              >
                <p className='line-clamp-2 hidden font-medium text-base text-foreground/90 leading-none md:inline-block lg:line-clamp-1 lg:h-[1.25rem] lg:text-xl lg:leading-none landscape:h-[1rem] lg:landscape:h-[1.25rem]'>
                  {film.tagline}
                </p>
                <h3 className='line-clamp-2.2 font-black text-2xl leading-none lg:line-clamp-1.1 lg:text-5xl landscape:line-clamp-1.1'>
                  {film.title}
                  <span className='font-normal text-foreground/50 text-xl leading-none lg:text-3xl'>
                    &nbsp;({film.year})
                  </span>
                </h3>
                <div
                  className={cn(
                    'flex flex-row flex-wrap gap-3 lg:flex-nowrap lg:pt-2',
                    {
                      'justify-end': reverseX,
                    },
                  )}
                >
                  {film.genres?.map((genre) => (
                    <Badge
                      key={genre}
                      className='whitespace-nowrap text-[0.6rem] leading-none lg:text-xs'
                    >
                      {genre}
                    </Badge>
                  ))}
                </div>
              </div>
              <FilmRatingGauge value={film.rating} />
            </div>
          </div>
        </div>
      )}
    </>
  )
}
