import config from '../../config'
import { cn } from '../../utils/tw'
import type { Film } from '../../vf'
import { useJellyseerr } from '../../hooks/use-jellyseerr'
import { Button } from '../ui/button'

export const StdLinks = ({
  film,
  buttonClassName = '',
}: {
  film: {
    title: Film['title']
    tmdbId: Film['tmdbId']
    imdbId?: Film['imdbId']
  }
  buttonClassName?: string
}) => {
  const { configured, loading, available, requested, request } =
    useJellyseerr(film.tmdbId)
  return (
    <>
      <Button
        asChild
        variant='outline'
        className={cn(
          'rounded-lg border-foreground md:backdrop-blur-lg',
          buttonClassName,
        )}
      >
        <a
          href={`${config.tmdbFilmBaseUrl}${film.tmdbId}`}
          target='_blank'
          rel='noreferrer'
        >
          TMDB
        </a>
      </Button>
      {film.imdbId && (
        <Button
          asChild
          variant='outline'
          className={cn(
            'rounded-lg border-foreground md:backdrop-blur-lg',
            buttonClassName,
          )}
        >
          <a
            href={`${config.imdbFilmBaseUrl}${film.imdbId}`}
            target='_blank'
            rel='noreferrer'
          >
            IMDB
          </a>
        </Button>
      )}
      {configured && available && (
        <Button
          asChild
          variant='outline'
          className={cn(
            'rounded-lg border-foreground md:backdrop-blur-lg',
            buttonClassName,
          )}
        >
          <a
            href={`https://jelly.thariqhussain.com/web/index.html#!/search?q=${encodeURIComponent(
              film.title,
            )}`}
            target='_blank'
            rel='noreferrer'
          >
            Watch now
          </a>
        </Button>
      )}
      {configured && !available && (
        <Button
          variant='outline'
          className={cn(
            'rounded-lg border-foreground md:backdrop-blur-lg',
            buttonClassName,
          )}
          disabled={loading || requested}
          onClick={() => void request()}
        >
          {requested ? 'Requested' : loading ? 'Requesting…' : 'Request movie'}
        </Button>
      )}
    </>
  )
}
