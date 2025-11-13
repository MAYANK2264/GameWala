import { useEffect, useRef } from 'react'

type UsePullToRefreshOptions = {
  onRefresh: () => Promise<void> | void
  enabled?: boolean
  threshold?: number
}

export function usePullToRefresh({ onRefresh, enabled = true, threshold = 80 }: UsePullToRefreshOptions) {
  const touchStartY = useRef<number | null>(null)
  const touchCurrentY = useRef<number | null>(null)
  const isRefreshing = useRef(false)
  const containerRef = useRef<HTMLElement | null>(null)

  useEffect(() => {
    if (!enabled) return

    const handleTouchStart = (e: TouchEvent) => {
      const target = e.target as HTMLElement
      // Only trigger if at the top of scrollable container
      if (target.scrollTop === 0 || (window.scrollY === 0 && document.documentElement.scrollTop === 0)) {
        touchStartY.current = e.touches[0].clientY
        touchCurrentY.current = e.touches[0].clientY
      }
    }

    const handleTouchMove = (e: TouchEvent) => {
      if (touchStartY.current === null) return
      touchCurrentY.current = e.touches[0].clientY
      const deltaY = touchCurrentY.current - touchStartY.current

      // Only allow pull down (positive deltaY) when at top
      if (deltaY > 0 && (window.scrollY === 0 || (e.target as HTMLElement).scrollTop === 0)) {
        // Prevent default scrolling when pulling down
        if (deltaY > 10) {
          e.preventDefault()
        }
      }
    }

    const handleTouchEnd = async () => {
      if (touchStartY.current === null || touchCurrentY.current === null) return

      const deltaY = touchCurrentY.current - touchStartY.current

      // Trigger refresh if pulled down enough
      if (deltaY > threshold && !isRefreshing.current) {
        isRefreshing.current = true
        try {
          await onRefresh()
        } finally {
          isRefreshing.current = false
          touchStartY.current = null
          touchCurrentY.current = null
        }
      } else {
        touchStartY.current = null
        touchCurrentY.current = null
      }
    }

    document.addEventListener('touchstart', handleTouchStart, { passive: true })
    document.addEventListener('touchmove', handleTouchMove, { passive: false })
    document.addEventListener('touchend', handleTouchEnd, { passive: true })

    return () => {
      document.removeEventListener('touchstart', handleTouchStart)
      document.removeEventListener('touchmove', handleTouchMove)
      document.removeEventListener('touchend', handleTouchEnd)
    }
  }, [enabled, threshold, onRefresh])

  return containerRef
}

