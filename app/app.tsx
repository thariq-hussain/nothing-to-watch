import { Navbar, ThemeProvider } from './cmps/layout'
import PrimaryViews from './cmps/views'
import { Intro } from './cmps/views/intro'
import { useKeyPress } from './hooks/use-key-press'

const App = () => {
  const spacePressed = useKeyPress('Space')
  if (!spacePressed) {
    return (
      <ThemeProvider>
        <Navbar />
        <PrimaryViews />
        <Intro />
      </ThemeProvider>
    )
  }
}

export default App
