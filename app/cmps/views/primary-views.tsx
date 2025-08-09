import { About } from './about'
import { Favorites } from './favorites'
import { FilmPreview, FilmViewDrawer } from './film'
import { LowFpsAlert } from './low-fps-alert'
import { Settings } from './settings'
import { HotkeysView } from './hotkeys'

const PrimaryViews = () => (
  <>
    <Settings />
    <About />
    <Favorites />
    <FilmPreview />
    <FilmViewDrawer />
    <LowFpsAlert />
    <HotkeysView />
  </>
)

export default PrimaryViews
