import { useEffect } from 'react'

interface ShortcutHandlers {
  onSearch?: () => void
  onNewJob?: () => void
  onEscape?: () => void
}

export function useKeyboardShortcuts(handlers: ShortcutHandlers) {
  useEffect(() => {
    const isInputFocused = () => {
      const tag = document.activeElement?.tagName
      return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT'
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && handlers.onEscape) {
        handlers.onEscape()
        return
      }

      if (isInputFocused()) return

      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        handlers.onSearch?.()
        return
      }

      if (e.key === 'n' && handlers.onNewJob) {
        handlers.onNewJob()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handlers.onSearch, handlers.onNewJob, handlers.onEscape])
}
