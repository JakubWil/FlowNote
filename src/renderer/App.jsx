import NotesApp from './NotesApp.jsx'
import OverlayApp from './OverlayApp.jsx'

export default function Root() {
  const params = new URLSearchParams(window.location.search)
  const windowType = params.get('window') || 'main'

  if (windowType === 'overlay') {
    return <OverlayApp />
  }

  return <NotesApp />
}
