import { Navbar, ThemeProvider } from './cmps/layout'
import LazyPrimaryViews from './cmps/views'
import { Intro } from './cmps/views/intro'
import { useKeyPress } from './hooks/use-key-press'

const App = () => {
  const spacePressed = useKeyPress('Space')
  if (!spacePressed) {
    return (
      <ThemeProvider>
        <Navbar />
        <LazyPrimaryViews />
        <Intro />
      </ThemeProvider>
    )
  }
}

export default App
