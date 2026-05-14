import { useCallback, useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import './App.css'
import { defaultLocale, localeOptions, siteLocales } from './content/siteLocales.js'

const whatsappUrl = 'https://wa.me/5561995596710'
const instagramUrl = 'https://www.instagram.com/guap.company/'

const getInitialLocale = () => {
  return defaultLocale
}

function SectionTransition({ tone }) {
  return (
    <div className={`section-transition ${tone}`} aria-hidden="true">
      <span className="transition-beam"></span>
      <span className="transition-node transition-node-left"></span>
      <span className="transition-node transition-node-center"></span>
      <span className="transition-node transition-node-right"></span>
    </div>
  )
}

function formatMetricValue(metric, value) {
  if (metric.suffix === 'x') {
    return `${value.toFixed(1)}x`
  }

  if (metric.prefix || metric.suffix) {
    const decimals = metric.decimals ?? 0
    const roundedValue = decimals > 0 ? value.toFixed(decimals).replace('.0', '') : Math.round(value)
    return `${metric.prefix ?? ''}${roundedValue}${metric.suffix ?? ''}`
  }

  if (metric.negative) {
    return `-${Math.round(value)}%`
  }

  return `+${Math.round(value)}%`
}

function ResultMetricCard({ metric, index, isActive }) {
  const [value, setValue] = useState(metric.start)

  useEffect(() => {
    if (!isActive) {
      return undefined
    }

    let frameId = 0
    const duration = 1800
    const minFrameInterval = 96
    const startTime = performance.now()
    let lastUpdateTime = startTime

    const tick = (time) => {
      const elapsed = Math.min((time - startTime) / duration, 1)

      if (elapsed === 1 || time - lastUpdateTime >= minFrameInterval) {
        const eased = 1 - Math.pow(1 - elapsed, 3)
        setValue(metric.start + (metric.end - metric.start) * eased)
        lastUpdateTime = time
      }

      if (elapsed < 1) {
        frameId = window.requestAnimationFrame(tick)
      }
    }

    frameId = window.requestAnimationFrame(tick)

    return () => window.cancelAnimationFrame(frameId)
  }, [isActive, metric.end, metric.start])

  return (
    <article className={`metric-card metric-card-${index + 1} reveal-panel`} data-reveal>
      <strong className={`metric-number ${isActive ? 'metric-number-live' : ''}`}>
        {formatMetricValue(metric, value)}
      </strong>
      <span>{metric.label}</span>
      <div className="metric-trend" aria-hidden="true">
        <span className="trend-bar trend-a"></span>
        <span className="trend-bar trend-b"></span>
        <span className="trend-bar trend-c"></span>
        <span className="trend-bar trend-d"></span>
      </div>
    </article>
  )
}

function App() {
  const [locale, setLocale] = useState(getInitialLocale)
  const content = siteLocales[locale] ?? siteLocales[defaultLocale]
  const {
    aiSignals,
    capabilities,
    contactLinks,
    copy,
    heroStats,
    marketStories,
    navItems,
    partnerLogos,
    resultMetrics,
  } = content
  const [resultsActive, setResultsActive] = useState(false)
  const [activeService, setActiveService] = useState(null)
  const [activeMarketIndex, setActiveMarketIndex] = useState(0)
  const [isMarketPaused, setIsMarketPaused] = useState(false)
  const [isMarketVisible, setIsMarketVisible] = useState(false)
  const [isPageReady, setIsPageReady] = useState(false)
  const [isDocumentVisible, setIsDocumentVisible] = useState(true)
  const [isClosingService, setIsClosingService] = useState(false)
  const serviceModalCloseTimer = useRef(null)
  const serviceModalTitleRef = useRef(null)
  const serviceModalScrollY = useRef(0)
  const marketTouchStartX = useRef(null)
  const marketResumeTimer = useRef(null)
  const marketTabRefs = useRef([])
  const prefersReducedMotion = useRef(false)
  const isMobileViewport = useRef(false)

  useEffect(() => {
    document.documentElement.lang = locale === 'ja' ? 'ja' : locale === 'pt' ? 'pt-BR' : 'en'
  }, [locale])

  useEffect(() => {
    prefersReducedMotion.current = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    isMobileViewport.current = window.matchMedia('(max-width: 780px)').matches
  }, [])

  useEffect(() => {
    const frameId = window.requestAnimationFrame(() => setIsPageReady(true))
    const timeoutId = window.setTimeout(() => setIsPageReady(true), 140)

    return () => {
      window.cancelAnimationFrame(frameId)
      window.clearTimeout(timeoutId)
    }
  }, [])

  useEffect(() => {
    const handleVisibilityChange = () => {
      setIsDocumentVisible(!document.hidden)
    }

    handleVisibilityChange()
    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => document.removeEventListener('visibilitychange', handleVisibilityChange)
  }, [])

  useEffect(() => {
    const shouldReduceScrollEffects = isMobileViewport.current || prefersReducedMotion.current
    const rootStyle = document.documentElement.style

    if (shouldReduceScrollEffects) {
      rootStyle.setProperty('--scroll-progress', '0')
      rootStyle.setProperty('--scroll-offset', '0px')
      return undefined
    }

    let frameId = 0
    let scrollableDistance = Math.max(document.documentElement.scrollHeight - window.innerHeight, 0)
    let lastScrollProgress = ''
    let lastScrollOffset = ''

    const updateScrollState = () => {
      const scrollTop = window.scrollY
      const rawProgress = scrollableDistance > 0 ? Math.min(Math.max(scrollTop / scrollableDistance, 0), 1) : 0
      const progress = `${Math.round(rawProgress * 500) / 500}`
      const offset = `${Math.round(Math.min(scrollTop, 1400) / 4) * 4}px`

      if (progress !== lastScrollProgress) {
        rootStyle.setProperty('--scroll-progress', progress)
        lastScrollProgress = progress
      }

      if (offset !== lastScrollOffset) {
        rootStyle.setProperty('--scroll-offset', offset)
        lastScrollOffset = offset
      }

      frameId = 0
    }

    const handleScroll = () => {
      if (frameId !== 0) {
        return
      }

      frameId = window.requestAnimationFrame(updateScrollState)
    }

    const handleResize = () => {
      scrollableDistance = Math.max(document.documentElement.scrollHeight - window.innerHeight, 0)
      handleScroll()
    }

    updateScrollState()
    window.addEventListener('scroll', handleScroll, { passive: true })
    window.addEventListener('resize', handleResize)

    return () => {
      window.removeEventListener('scroll', handleScroll)
      window.removeEventListener('resize', handleResize)
      if (frameId !== 0) {
        window.cancelAnimationFrame(frameId)
      }
    }
  }, [])

  useEffect(() => {
    const previousScrollRestoration = window.history.scrollRestoration

    if ('scrollRestoration' in window.history) {
      window.history.scrollRestoration = 'manual'
    }

    const frameId = window.requestAnimationFrame(() => {
      if (window.location.hash) {
        window.history.replaceState(null, '', `${window.location.pathname}${window.location.search}`)
      }

      window.scrollTo({ top: 0, left: 0, behavior: 'auto' })
    })

    return () => {
      window.cancelAnimationFrame(frameId)
      if ('scrollRestoration' in window.history) {
        window.history.scrollRestoration = previousScrollRestoration
      }
    }
  }, [])

  useEffect(() => {
    const resultsSection = document.getElementById('results')

    if (!resultsSection) {
      return undefined
    }

    if (!('IntersectionObserver' in window)) {
      const frameId = window.requestAnimationFrame(() => setResultsActive(true))
      return () => window.cancelAnimationFrame(frameId)
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setResultsActive((currentValue) => (currentValue ? currentValue : true))
          observer.disconnect()
        }
      },
      { threshold: 0.3 },
    )

    observer.observe(resultsSection)

    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    const elements = document.querySelectorAll('[data-reveal]')

    if (!elements.length) {
      return undefined
    }

    if (!('IntersectionObserver' in window)) {
      elements.forEach((element) => element.classList.add('is-visible'))
      return undefined
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible')
            observer.unobserve(entry.target)
          }
        })
      },
      { threshold: 0.16, rootMargin: '0px 0px -8% 0px' },
    )

    elements.forEach((element) => observer.observe(element))

    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    const motionScopes = document.querySelectorAll('.hero-panel, .section-card, .authority-band, .footer-card, .section-transition')

    if (!motionScopes.length) {
      return undefined
    }

    if (!('IntersectionObserver' in window)) {
      motionScopes.forEach((scope) => scope.classList.add('is-motion-active'))
      return undefined
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          entry.target.classList.toggle('is-motion-active', entry.isIntersecting)
        })
      },
      { threshold: 0, rootMargin: '28% 0px 28% 0px' },
    )

    motionScopes.forEach((scope) => observer.observe(scope))

    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    const marketsSection = document.getElementById('markets')

    if (!marketsSection) {
      return undefined
    }

    if (!('IntersectionObserver' in window)) {
      const frameId = window.requestAnimationFrame(() => setIsMarketVisible(true))
      return () => window.cancelAnimationFrame(frameId)
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsMarketVisible((currentValue) => (currentValue === entry.isIntersecting ? currentValue : entry.isIntersecting))
      },
      { threshold: 0.18, rootMargin: '12% 0px 12% 0px' },
    )

    observer.observe(marketsSection)

    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    if (
      !isMarketVisible ||
      !isDocumentVisible ||
      isMarketPaused ||
      marketStories.length < 2 ||
      prefersReducedMotion.current
    ) {
      return undefined
    }

    const timerId = window.setInterval(() => {
      setActiveMarketIndex((currentIndex) => (currentIndex + 1) % marketStories.length)
    }, 6500)

    return () => window.clearInterval(timerId)
  }, [isDocumentVisible, isMarketPaused, isMarketVisible, marketStories.length])

  useEffect(() => {
    const activeTab = marketTabRefs.current[activeMarketIndex]

    if (!activeTab || !isMobileViewport.current) {
      return
    }

    const scroller = activeTab.parentElement

    if (!scroller) {
      return
    }

    const behavior = prefersReducedMotion.current ? 'auto' : 'smooth'
    const targetLeft = activeTab.offsetLeft - (scroller.clientWidth - activeTab.clientWidth) / 2
    scroller.scrollTo({ left: Math.max(0, targetLeft), behavior })
  }, [activeMarketIndex])

  const selectedService = capabilities.find((item) => item.slug === activeService) ?? null
  const selectedServiceIndex = selectedService ? capabilities.findIndex((item) => item.slug === selectedService.slug) : -1
  const activeMarketStory = marketStories[activeMarketIndex] ?? marketStories[0]
  const isServiceModalOpen = Boolean(activeService)

  const openServiceModal = (slug) => {
    window.clearTimeout(serviceModalCloseTimer.current)
    setIsClosingService(false)
    setActiveService(slug)
  }

  const closeServiceModal = useCallback(() => {
    window.clearTimeout(serviceModalCloseTimer.current)
    setIsClosingService(true)
    serviceModalCloseTimer.current = window.setTimeout(() => {
      setActiveService(null)
      setIsClosingService(false)
    }, 220)
  }, [])

  const stepServiceModal = useCallback(
    (direction) => {
      if (!selectedService) {
        return
      }

      const total = capabilities.length
      const nextIndex = (selectedServiceIndex + direction + total) % total
      setActiveService(capabilities[nextIndex].slug)
    },
    [capabilities, selectedService, selectedServiceIndex],
  )

  useEffect(() => {
    if (!isServiceModalOpen) {
      return undefined
    }

    const previousBodyOverflow = document.body.style.overflow
    const previousBodyPosition = document.body.style.position
    const previousBodyTop = document.body.style.top
    const previousBodyLeft = document.body.style.left
    const previousBodyRight = document.body.style.right
    const previousBodyWidth = document.body.style.width
    const previousDocumentOverflow = document.documentElement.style.overflow
    const scrollYToLock = window.scrollY

    serviceModalScrollY.current = scrollYToLock
    document.body.style.overflow = 'hidden'
    document.documentElement.style.overflow = 'hidden'
    document.body.style.position = 'fixed'
    document.body.style.top = `-${scrollYToLock}px`
    document.body.style.left = '0'
    document.body.style.right = '0'
    document.body.style.width = '100%'

    return () => {
      const lockedTop = Number.parseInt(document.body.style.top || '', 10)
      const scrollYToRestore = Number.isFinite(lockedTop) ? Math.abs(lockedTop) : serviceModalScrollY.current

      document.body.style.overflow = previousBodyOverflow
      document.documentElement.style.overflow = previousDocumentOverflow
      document.body.style.position = previousBodyPosition
      document.body.style.top = previousBodyTop
      document.body.style.left = previousBodyLeft
      document.body.style.right = previousBodyRight
      document.body.style.width = previousBodyWidth
      window.scrollTo({ top: scrollYToRestore, left: 0, behavior: 'auto' })
      window.requestAnimationFrame(() => {
        window.scrollTo({ top: scrollYToRestore, left: 0, behavior: 'auto' })
      })
    }
  }, [isServiceModalOpen])

  useEffect(() => {
    if (!activeService) {
      return undefined
    }

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        closeServiceModal()
      }

      if (event.key === 'ArrowLeft') {
        event.preventDefault()
        stepServiceModal(-1)
      }

      if (event.key === 'ArrowRight') {
        event.preventDefault()
        stepServiceModal(1)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    serviceModalTitleRef.current?.focus({ preventScroll: true })

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [activeService, closeServiceModal, stepServiceModal])

  useEffect(
    () => () => {
      window.clearTimeout(serviceModalCloseTimer.current)
      window.clearTimeout(marketResumeTimer.current)
    },
    [],
  )

  const updateMarketPaused = (nextValue) => {
    setIsMarketPaused((currentValue) => (currentValue === nextValue ? currentValue : nextValue))
  }

  const stepMarket = (direction) => {
    const total = marketStories.length
    setActiveMarketIndex((currentIndex) => (currentIndex + direction + total) % total)
  }

  const pauseMarketBriefly = (duration = 1200) => {
    window.clearTimeout(marketResumeTimer.current)
    updateMarketPaused(true)
    marketResumeTimer.current = window.setTimeout(() => updateMarketPaused(false), duration)
  }

  const handleMarketTouchStart = (event) => {
    window.clearTimeout(marketResumeTimer.current)
    updateMarketPaused(true)
    marketTouchStartX.current = event.touches[0]?.clientX ?? null
  }

  const handleMarketTouchEnd = (event) => {
    const startX = marketTouchStartX.current
    const endX = event.changedTouches[0]?.clientX ?? null
    marketTouchStartX.current = null

    if (startX !== null && endX !== null && Math.abs(startX - endX) > 42) {
      stepMarket(startX > endX ? 1 : -1)
    }

    pauseMarketBriefly(900)
  }

  const handleMarketKeyDown = (event) => {
    if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') {
      return
    }

    event.preventDefault()
    pauseMarketBriefly()
    stepMarket(event.key === 'ArrowRight' ? 1 : -1)
  }

  const serviceModal = selectedService ? (
    <div
      className={`service-modal-backdrop ${isClosingService ? 'is-closing' : ''}`}
      role="presentation"
      onClick={closeServiceModal}
    >
      <section
        className={`service-modal ${isClosingService ? 'is-closing' : ''}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="service-modal-title"
        onClick={(event) => event.stopPropagation()}
      >
        <button className="service-modal-close" type="button" aria-label={copy.close} onClick={closeServiceModal}>
          {copy.close}
        </button>

        <div className="service-modal-layout" key={selectedService.slug}>
          <div className="service-modal-copy">
            <span className="kicker">{selectedService.eyebrow}</span>
            <h3 id="service-modal-title" ref={serviceModalTitleRef} tabIndex="-1">
              {selectedService.title}
            </h3>
            <p className="service-modal-impact">{selectedService.impact}</p>

            <ul className="service-modal-list">
              {selectedService.bullets.map((bullet) => (
                <li key={bullet}>{bullet}</li>
              ))}
            </ul>

            <a className="primary-button service-modal-cta" href={whatsappUrl} target="_blank" rel="noreferrer" onClick={closeServiceModal}>
              {selectedService.cta}
            </a>
          </div>

          <div className="service-modal-visual-wrap" aria-hidden="true">
            <img
              className="service-modal-visual"
              src={selectedService.image}
              width="1200"
              height="900"
              loading="lazy"
              decoding="async"
              alt=""
            />
          </div>
        </div>

        <div className="service-modal-nav" aria-label="Service navigation">
          <button className="service-modal-arrow service-modal-arrow-left" type="button" aria-label={copy.previousService} onClick={() => stepServiceModal(-1)}>
            <span aria-hidden="true">‹</span>
          </button>
          <span className="service-modal-count">
            {String(selectedServiceIndex + 1).padStart(2, '0')} / {String(capabilities.length).padStart(2, '0')}
          </span>
          <button className="service-modal-arrow service-modal-arrow-right" type="button" aria-label={copy.nextService} onClick={() => stepServiceModal(1)}>
            <span aria-hidden="true">›</span>
          </button>
        </div>
      </section>
    </div>
  ) : null

  return (
    <div className={`site-shell ${isPageReady ? 'is-page-ready' : ''}`}>
      <div className="ambient-layer ambient-grid" aria-hidden="true"></div>
      <div className="ambient-layer ambient-stars" aria-hidden="true"></div>
      <div className="ambient-layer ambient-glow ambient-glow-left" aria-hidden="true"></div>
      <div className="ambient-layer ambient-glow ambient-glow-right" aria-hidden="true"></div>
      <div className="ambient-layer ambient-veil" aria-hidden="true"></div>
      <div className="ambient-layer ambient-noise" aria-hidden="true"></div>
      <div className="ambient-layer ambient-comet comet-one" aria-hidden="true"></div>
      <div className="ambient-layer ambient-comet comet-two" aria-hidden="true"></div>
      <div className="ambient-layer ambient-blackhole" aria-hidden="true"></div>
      <div className="cosmic-current" aria-hidden="true">
        <span className="current-line"></span>
        <span className="current-pulse pulse-top"></span>
        <span className="current-pulse pulse-mid"></span>
        <span className="current-pulse pulse-low"></span>
      </div>

      <header className="topbar">
        <a className="brand" href="#home" aria-label={copy.hero.aria}>
          <img className="brand-logo-mark" src="/guap-wordmark-cosmic.png" width="430" height="150" decoding="async" alt="GUAP" />
        </a>

        <nav className="topnav" aria-label="Primary navigation">
          {navItems.map((item) => (
            <a key={item.label} href={item.href}>
              {item.label}
            </a>
          ))}
        </nav>

        <div className="topbar-actions">
          <div className="language-switcher" aria-label={copy.languageLabel}>
            {localeOptions.map((option) => (
              <button
                className={`language-option ${locale === option.code ? 'is-active' : ''}`}
                key={option.code}
                type="button"
                aria-pressed={locale === option.code}
                title={option.label}
                onClick={() => setLocale(option.code)}
              >
                {option.short}
              </button>
            ))}
          </div>

          <a className="nav-cta" href={whatsappUrl} target="_blank" rel="noreferrer">
            {copy.navCta}
          </a>
        </div>
      </header>

      <main className="site-flow" id="home">
        <div className="flow-ribbons" aria-hidden="true">
          <span className="flow-ribbon ribbon-a"></span>
          <span className="flow-ribbon ribbon-b"></span>
          <span className="flow-ribbon ribbon-c"></span>
          <span className="flow-node flow-node-a"></span>
          <span className="flow-node flow-node-b"></span>
          <span className="flow-node flow-node-c"></span>
        </div>

        <section className="hero-panel hero-panel-prism reveal-panel is-visible is-motion-active" data-reveal>
          <div className="hero-layout">
            <div className="hero-copy">
              <div className="hero-brandline">
                <img className="hero-logo-mark" src="/guap-wordmark-cosmic.png" width="430" height="150" decoding="async" alt="" aria-hidden="true" />
              </div>
              <span className="kicker">{copy.hero.kicker}</span>
              <h1>{copy.hero.title}</h1>
              <div className="hero-actions">
                <a className="primary-button" href={whatsappUrl} target="_blank" rel="noreferrer">
                  {copy.hero.primaryCta}
                </a>
                <a className="secondary-button" href="#results">
                  {copy.hero.secondaryCta}
                </a>
              </div>

              <div className="hero-stats">
                {heroStats.map((item) => (
                  <article className="stat-card" key={item.value}>
                    <strong>{item.value}</strong>
                    <span>{item.label}</span>
                  </article>
                ))}
              </div>

              <div className="signal-row">
                {aiSignals.map((signal) => (
                  <span className="signal-pill" key={signal}>
                    {signal}
                  </span>
                ))}
              </div>
            </div>

            <div className="hero-scene" aria-hidden="true">
              <div className="hero-orbit orbit-large"></div>
              <div className="hero-orbit orbit-medium"></div>
              <div className="hero-orbit orbit-small"></div>
              <div className="hero-beam"></div>
              <div className="hero-grid"></div>
              <div className="hero-glow glow-one"></div>
              <div className="hero-glow glow-two"></div>
              <div className="hero-core">
                <span>{copy.hero.sceneCore[0]}</span>
                <strong>{copy.hero.sceneCore[1]}</strong>
              </div>
              <div className="floating-card floating-card-left">
                <span>{copy.hero.sceneCards[0][0]}</span>
                <strong>{copy.hero.sceneCards[0][1]}</strong>
              </div>
              <div className="floating-card floating-card-bottom">
                <span>{copy.hero.sceneCards[1][0]}</span>
                <strong>{copy.hero.sceneCards[1][1]}</strong>
              </div>
            </div>
          </div>

        </section>

        <SectionTransition tone="transition-signal" />

        <section className="authority-band authority-band-signal reveal-panel" data-reveal>
          <div className="authority-copy">
            <span className="kicker">{copy.authority.kicker}</span>
            <h2>{copy.authority.title}</h2>
            <div className="authority-strip" aria-label={copy.authority.outcomesLabel}>
              {copy.authority.outcomes.map((item) => (
                <span key={item}>{item}</span>
              ))}
            </div>
          </div>

          <div className="authority-right">
            <div className="authority-points">
              {copy.authority.points.map(([title, text]) => (
                <article key={title}>
                  <strong>{title}</strong>
                  <span>{text}</span>
                </article>
              ))}
            </div>
          </div>

          <div className="section-cta-row">
            <a className="primary-button" href={whatsappUrl} target="_blank" rel="noreferrer">
              {copy.hero.primaryCta}
            </a>
            <a className="secondary-button" href="#capabilities">
              {copy.capabilities.kicker}
            </a>
          </div>
        </section>

        <SectionTransition tone="transition-violet" />

        <section className="section-card ecosystem-section section-mood-violet reveal-panel" id="ecosystem" data-reveal>
          <div className="section-grid section-grid-split">
            <div className="section-copy section-copy-stacked">
              <span className="kicker">{copy.ecosystem.kicker}</span>
              <h2>{copy.ecosystem.title}</h2>
              <div className="copy-note">
                <strong>{copy.ecosystem.noteTitle}</strong>
                <p>{copy.ecosystem.note}</p>
              </div>
            </div>

            <div className="ecosystem-scene" aria-hidden="true">
              <div className="ecosystem-ring eco-ring-a"></div>
              <div className="ecosystem-ring eco-ring-b"></div>
              <div className="ecosystem-ring eco-ring-c"></div>
              <div className="ecosystem-line eco-line-one"></div>
              <div className="ecosystem-line eco-line-two"></div>
              <div className="ecosystem-line eco-line-three"></div>
              <div className="ecosystem-core">GUAP</div>
              <span className="ecosystem-node eco-node-one">{copy.ecosystem.nodes[0]}</span>
              <span className="ecosystem-node eco-node-two">{copy.ecosystem.nodes[1]}</span>
              <span className="ecosystem-node eco-node-three">{copy.ecosystem.nodes[2]}</span>
              <span className="ecosystem-node eco-node-four">{copy.ecosystem.nodes[3]}</span>
              <span className="ecosystem-node eco-node-five">{copy.ecosystem.nodes[4]}</span>
              <span className="ecosystem-node eco-node-six">{copy.ecosystem.nodes[5]}</span>
            </div>
          </div>
        </section>

        <SectionTransition tone="transition-cyan" />

        <section
          className={`section-card markets-section markets-cinema reveal-panel ${isMarketVisible ? 'is-market-visible' : ''}`}
          id="markets"
          data-reveal
          aria-roledescription="carousel"
          onMouseEnter={() => updateMarketPaused(true)}
          onMouseLeave={() => updateMarketPaused(false)}
          onFocusCapture={() => updateMarketPaused(true)}
          onBlurCapture={(event) => {
            if (!event.currentTarget.contains(event.relatedTarget)) {
              pauseMarketBriefly(900)
            }
          }}
        >
          <div className="markets-cinema-head">
            <div className="section-copy section-copy-wide">
              <span className="kicker">{copy.markets.kicker}</span>
              <h2>{copy.markets.title}</h2>
            </div>

            <div className="markets-tabs" aria-label={copy.markets.railLabel}>
              {marketStories.map((story, index) => (
                <button
                  className={`market-tab ${activeMarketIndex === index ? 'is-active' : ''}`}
                  key={story.slug}
                  ref={(element) => {
                    marketTabRefs.current[index] = element
                  }}
                  type="button"
                  aria-pressed={activeMarketIndex === index}
                  onClick={() => {
                    pauseMarketBriefly()
                    setActiveMarketIndex(index)
                  }}
                >
                  <span>{story.flag}</span>
                  {story.country}
                </button>
              ))}
            </div>
          </div>

          <div
            key={activeMarketStory.slug}
            className={`market-stage ${activeMarketStory.visual} ${isMarketPaused ? 'is-paused' : ''}`}
            aria-label={copy.markets.aria}
            aria-live="polite"
            tabIndex="0"
            onMouseEnter={() => updateMarketPaused(true)}
            onMouseLeave={() => updateMarketPaused(false)}
            onTouchStart={handleMarketTouchStart}
            onTouchEnd={handleMarketTouchEnd}
            onTouchCancel={() => pauseMarketBriefly(900)}
            onKeyDown={handleMarketKeyDown}
          >
            <div className="market-stage-bg" aria-hidden="true">
              <span className="market-light light-one"></span>
              <span className="market-light light-two"></span>
              <span className="market-road"></span>
              <span className="market-skyline"></span>
              <span className="market-dashboard-lines"></span>
              <span className="market-particles"></span>
            </div>

            <div className="market-live-panel" aria-hidden="true">
              <span>{String(activeMarketIndex + 1).padStart(2, '0')} / {String(marketStories.length).padStart(2, '0')}</span>
              <strong>{activeMarketStory.country}</strong>
              <small>{activeMarketStory.metrics[0]}</small>
            </div>

            <article className="market-story" key={activeMarketStory.slug}>
              <div className="market-story-copy">
                <span className="market-story-eyebrow">
                  <span>{activeMarketStory.flag}</span>
                  {activeMarketStory.eyebrow}
                </span>
                <h3>{activeMarketStory.headline}</h3>
                <strong>{activeMarketStory.result}</strong>
              </div>

              <div className="market-story-visual" aria-hidden="true">
                <span className="visual-orbit visual-orbit-one"></span>
                <span className="visual-orbit visual-orbit-two"></span>
                <span className="visual-core">{activeMarketStory.country}</span>
                <span className="visual-node visual-node-one"></span>
                <span className="visual-node visual-node-two"></span>
                <span className="visual-node visual-node-three"></span>
              </div>

              <div className="market-story-metrics">
                {activeMarketStory.metrics.map((metric) => (
                  <span key={metric}>{metric}</span>
                ))}
              </div>
            </article>
          </div>

          <div className="market-controls">
            <button
              type="button"
              aria-label="Previous market"
              onClick={() => {
                pauseMarketBriefly()
                stepMarket(-1)
              }}
            >
              ‹
            </button>
            <div className="market-progress" aria-hidden="true">
              {marketStories.map((story, index) => (
                <span className={activeMarketIndex === index ? 'is-active' : ''} key={story.slug}></span>
              ))}
            </div>
            <button
              type="button"
              aria-label="Next market"
              onClick={() => {
                pauseMarketBriefly()
                stepMarket(1)
              }}
            >
              ›
            </button>
          </div>
        </section>

        <SectionTransition tone="transition-rose" />

        <section className="section-card partners-section section-mood-rose reveal-panel" id="partners" data-reveal>
          <div className="section-grid section-grid-asymmetric">
            <div className="section-copy">
              <span className="kicker">{copy.partners.kicker}</span>
              <h2>{copy.partners.title}</h2>
            </div>

            <div className="partner-quote-card">
              <strong>{copy.partners.quote}</strong>
            </div>
          </div>

          <div className="partner-marquee">
            <div className="partner-band">
              {[...partnerLogos, ...partnerLogos].map((partner, index) => (
                <span className="partner-pill" key={`${partner}-${index}`}>
                  {partner}
                </span>
              ))}
            </div>
          </div>

          <div className="partner-aurora" aria-hidden="true"></div>
        </section>

        <SectionTransition tone="transition-light" />

        <section className="section-card capabilities-section section-mood-aurora reveal-panel" id="capabilities" data-reveal>
          <div className="section-grid section-grid-split capabilities-head">
            <div className="section-copy section-copy-dark">
              <span className="kicker">{copy.capabilities.kicker}</span>
              <h2>{copy.capabilities.title}</h2>
            </div>
          </div>

          <div className="service-grid service-grid-minimal">
            {capabilities.map((item, index) => (
              <button
                className={`service-card service-card-${index + 1} service-trigger reveal-panel`}
                key={item.slug}
                data-reveal
                type="button"
                aria-label={`${copy.capabilities.openLabel}: ${item.title}`}
                onClick={() => openServiceModal(item.slug)}
              >
                <span className="service-eyebrow">{item.eyebrow}</span>
                <h3>{item.title}</h3>
                <span className="service-card-action">{copy.capabilities.cardAction}</span>
                <span className="service-index">{String(index + 1).padStart(2, '0')}</span>
              </button>
            ))}
          </div>

          <div className="section-action-row">
            <strong>{copy.capabilities.ctaText}</strong>
            <a className="secondary-button section-inline-cta" href={whatsappUrl} target="_blank" rel="noreferrer">
              {copy.capabilities.cta}
            </a>
          </div>
        </section>

        <SectionTransition tone="transition-electric" />

        <section className="section-card results-section section-mood-electric reveal-panel" id="results" data-reveal>
          <div className="section-grid section-grid-split">
            <div className="section-copy">
              <span className="kicker">{copy.results.kicker}</span>
              <h2>{copy.results.title}</h2>
            </div>

            <div className="results-visual" aria-hidden="true">
              <div className="results-sphere"></div>
              <div className="results-line line-one"></div>
              <div className="results-line line-two"></div>
              <div className="results-dot dot-one"></div>
              <div className="results-dot dot-two"></div>
              <div className="results-dot dot-three"></div>
              <div className="results-overlay-card">
                <span>{copy.results.visualLabel}</span>
                <strong>{copy.results.visualText}</strong>
              </div>
              <div className="results-float-badge badge-alpha">
                <span>{copy.results.badges[0][0]}</span>
                <strong>{copy.results.badges[0][1]}</strong>
              </div>
              <div className="results-float-badge badge-beta">
                <span>{copy.results.badges[1][0]}</span>
                <strong>{copy.results.badges[1][1]}</strong>
              </div>
            </div>
          </div>

          <div className="metrics-grid metrics-grid-compact">
            {resultMetrics.map((metric, index) => (
              <ResultMetricCard isActive={resultsActive} key={`${metric.label}-${metric.start}-${metric.end}`} metric={metric} index={index} />
            ))}
          </div>

          <div className="conversion-strip">
            <div>
              <span>{copy.results.ctaKicker}</span>
              <strong>{copy.results.ctaTitle}</strong>
            </div>
            <a className="primary-button conversion-strip-cta" href={whatsappUrl} target="_blank" rel="noreferrer">
              {copy.results.cta}
            </a>
          </div>
        </section>

        <SectionTransition tone="transition-deep" />
      </main>

      {serviceModal ? createPortal(serviceModal, document.body) : null}

      <footer className="footer-card footer-warp reveal-panel" id="contact" data-reveal>
        <div className="footer-layout">
          <div className="section-copy footer-brand">
            <img className="footer-logo-mark" src="/guap-wordmark-cosmic.png" width="430" height="150" loading="lazy" decoding="async" alt="GUAP" />
            <span className="kicker">{copy.footer.kicker}</span>
            <h2>{copy.footer.title}</h2>
          </div>

          <div className="footer-directory">
            <ul className="contact-list">
              {contactLinks.map((link) => (
                <li key={link.label}>
                  <span>{link.label}</span>
                  <a
                    href={link.href}
                    target={link.href.startsWith('http') ? '_blank' : undefined}
                    rel={link.href.startsWith('http') ? 'noreferrer' : undefined}
                  >
                    {link.value}
                  </a>
                </li>
              ))}
            </ul>

            <div className="footer-link-columns">
              <div>
                <strong>{copy.footer.marketsTitle}</strong>
                {copy.footer.markets.map((item) => (
                  <span key={item}>{item}</span>
                ))}
              </div>
              <div>
                <strong>{copy.footer.servicesTitle}</strong>
                {copy.footer.services.map((item) => (
                  <span key={item}>{item}</span>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="footer-bottom">
          <span>{copy.footer.copyright}</span>
          <a className="footer-instagram" href={instagramUrl} target="_blank" rel="noreferrer">
            Instagram
          </a>
          <a className="footer-instagram" href={whatsappUrl} target="_blank" rel="noreferrer">
            WhatsApp
          </a>
          <span>{copy.footer.legal}</span>
        </div>
      </footer>

      <a className="sticky-growth-cta" href={whatsappUrl} target="_blank" rel="noreferrer">
        <span>{copy.results.ctaKicker}</span>
        <strong>{copy.hero.primaryCta}</strong>
      </a>

      <a className="mobile-whatsapp-cta" href={whatsappUrl} target="_blank" rel="noreferrer" aria-label={copy.hero.primaryCta}>
        {copy.hero.primaryCta}
      </a>
    </div>
  )
}

export default App
