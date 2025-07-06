import { Navbar, ThemeProvider } from './cmps/layout'
import LazyPrimaryViews from './cmps/views'
import { Intro } from './cmps/views/intro'

const App = () => (
  <ThemeProvider>
    <Navbar />
    <LazyPrimaryViews />
    <Intro />
  </ThemeProvider>
)

export default App
