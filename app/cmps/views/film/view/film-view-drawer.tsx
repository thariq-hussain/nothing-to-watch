import {
  Suspense,
  lazy,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'

import { useShallowState } from '@/store'
import { useMediaQuery } from '../../../../hooks/use-media-query'
import { orientation } from '../../../../utils/mq'
import { cn } from '../../../../utils/tw'
import type { Film } from '../../../../vf'
import { Modal } from '../../../common/modal'

const AddCustomLinkModal = lazy(() =>
  import('./content').then((module) => ({
    default: module.AddCustomLinkModal,
  })),
)

const FilmView = lazy(() =>
  import('./content').then((module) => ({ default: module.FilmView })),
)

const FilmViewFooter = lazy(() =>
  import('./content').then((module) => ({
    default: module.FilmViewFooter,
  })),
)

export const FilmViewDrawer = () => {
  const landscape = useMediaQuery(orientation('landscape'))
  const [mountContent, setMountContent] = useState(false)
  const [freezeFilm, setFreezeFilm] = useState(false)
  const filmRef = useRef<Film>(undefined)

  const {
    film: activeFilm,
    isSelectMode,
    voroforce,
    exitVoroforceSelectMode,
    newLinkTypeOpen,
  } = useShallowState((state) => ({
    film: state.film,
    isSelectMode: state.isSelectMode,
    voroforce: state.voroforce,
    exitVoroforceSelectMode: state.exitSelectMode,
    newLinkTypeOpen: state.newLinkTypeOpen,
  }))

  const film = useMemo(() => {
    if (freezeFilm) return filmRef.current
    filmRef.current = activeFilm
    return activeFilm
  }, [activeFilm, freezeFilm])

  useEffect(() => {
    if (mountContent) return
    const mount = () => setMountContent(true)
    if (isSelectMode) {
      mount()
    } else if (voroforce) {
      setTimeout(() => {
        mount()
      }, 5000)
    }
  }, [voroforce, isSelectMode, mountContent])

  const onClose = useCallback(() => {
    exitVoroforceSelectMode()
    setFreezeFilm(false)
  }, [exitVoroforceSelectMode])

  return (
    <Modal
      rootProps={{
        direction: landscape ? 'left' : 'top',
        open: isSelectMode,
        onClose,
        modal: false,
      }}
      contentProps={{
        onMouseEnter: () => setFreezeFilm(true),
        onMouseLeave: () => setFreezeFilm(false),
        className: cn(
          'group landscape:max-lg:min-w-[33vw] landscape:max-lg:max-w-[66vw]',
          {
            'contain-layout contain-paint contain-style': !newLinkTypeOpen,
          },
        ),
      }}
      footer={mountContent ? <FilmViewFooter film={film} /> : null}
      handleProps={{
        className:
          'max-md:bg-background max-md:-translate-y-[150%] max-md:h-1.5 lg:bg-transparent lg:backdrop-blur-lg',
      }}
      additional={mountContent ? <AddCustomLinkModal /> : null}
    >
      <Suspense>{mountContent && <FilmView film={film} />}</Suspense>
    </Modal>
  )
}
