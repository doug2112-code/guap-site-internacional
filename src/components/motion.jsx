import { useEffect } from 'react'

const easeOutExpo = (progress) => (progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress))

export function SmoothScrollProvider({ children }) {
  useEffect(() => {
    const reducedMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    let frameId = 0

    const cancelScroll = () => {
      if (frameId !== 0) {
        window.cancelAnimationFrame(frameId)
        frameId = 0
      }
    }

    const getHeaderOffset = () => {
      const topbar = document.querySelector('.topbar')
      return topbar ? Math.min(Math.round(topbar.getBoundingClientRect().height + 22), 132) : 0
    }

    const animateTo = (targetY) => {
      cancelScroll()

      const startY = window.scrollY
      const distance = targetY - startY
      const duration = Math.min(920, Math.max(520, Math.abs(distance) * 0.42))
      const startTime = performance.now()

      const tick = (time) => {
        const progress = Math.min((time - startTime) / duration, 1)
        const nextY = startY + distance * easeOutExpo(progress)

        window.scrollTo(0, nextY)

        if (progress < 1) {
          frameId = window.requestAnimationFrame(tick)
          return
        }

        frameId = 0
      }

      frameId = window.requestAnimationFrame(tick)
    }

    const handleAnchorClick = (event) => {
      if (
        event.defaultPrevented ||
        event.metaKey ||
        event.ctrlKey ||
        event.shiftKey ||
        event.altKey ||
        event.button !== 0
      ) {
        return
      }

      const anchor = event.target.closest('a[href^="#"]')

      if (!anchor) {
        return
      }

      const hash = anchor.getAttribute('href')

      if (!hash || hash === '#') {
        return
      }

      const target = document.getElementById(decodeURIComponent(hash.slice(1)))

      if (!target) {
        return
      }

      event.preventDefault()
      window.history.pushState(null, '', hash)

      const targetY = Math.max(target.getBoundingClientRect().top + window.scrollY - getHeaderOffset(), 0)

      if (reducedMotionQuery.matches) {
        window.scrollTo(0, targetY)
        return
      }

      animateTo(targetY)
    }

    window.addEventListener('click', handleAnchorClick, { capture: true })
    window.addEventListener('wheel', cancelScroll, { passive: true })
    window.addEventListener('touchstart', cancelScroll, { passive: true })

    return () => {
      cancelScroll()
      window.removeEventListener('click', handleAnchorClick, { capture: true })
      window.removeEventListener('wheel', cancelScroll)
      window.removeEventListener('touchstart', cancelScroll)
    }
  }, [])

  return children
}

export function MotionText({ as: Tag = 'span', className = '', children, ...props }) {
  if (typeof children !== 'string') {
    return (
      <Tag className={`motion-text-reveal ${className}`.trim()} {...props}>
        {children}
      </Tag>
    )
  }

  const words = children.trim().split(/\s+/)

  return (
    <Tag className={`motion-text-reveal ${className}`.trim()} aria-label={children} {...props}>
      <span className="motion-text-mask" aria-hidden="true">
        {words.map((word, index) => (
          <span className="motion-word-wrap" key={`${word}-${index}`}>
            <span className="motion-word" style={{ '--motion-word-index': index }}>
              {word}
            </span>
          </span>
        ))}
      </span>
    </Tag>
  )
}
