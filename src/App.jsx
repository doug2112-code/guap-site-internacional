import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
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
  const initialMetricValues = useMemo(() => resultMetrics.map((metric) => metric.start), [resultMetrics])
  const targetMetricValues = useMemo(() => resultMetrics.map((metric) => metric.end), [resultMetrics])
  const [resultsActive, setResultsActive] = useState(false)
  const [metricValues, setMetricValues] = useState(() => initialMetricValues)
  const [activeService, setActiveService] = useState(null)
  const [activeMarketIndex, setActiveMarketIndex] = useState(0)
  const [isClosingService, setIsClosingService] = useState(false)
  const serviceModalCloseTimer = useRef(null)
  const serviceModalTitleRef = useRef(null)

  useEffect(() => {
    document.documentElement.lang = locale === 'ja' ? 'ja' : locale === 'pt' ? 'pt-BR' : 'en'
  }, [locale])

  useEffect(() => {
    const shouldReduceScrollEffects =
      window.matchMedia('(max-width: 780px)').matches || window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const rootStyle = document.documentElement.style

    if (shouldReduceScrollEffects) {
      rootStyle.setProperty('--scroll-progress', '0')
      rootStyle.setProperty('--scroll-offset', '0px')
      return undefined
    }

    let frameId = 0
    let lastScrollProgress = ''
    let lastScrollOffset = ''

    const updateScrollState = () => {
      const scrollTop = window.scrollY
      const scrollable = document.documentElement.scrollHeight - window.innerHeight
      const progress = scrollable > 0 ? Math.min(Math.max(scrollTop / scrollable, 0), 1).toFixed(4) : '0'
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

    updateScrollState()
    window.addEventListener('scroll', handleScroll, { passive: true })

    return () => {
      window.removeEventListener('scroll', handleScroll)
      if (frameId !== 0) {
        window.cancelAnimationFrame(frameId)
      }
    }
  }, [])

  useEffect(() => {
    if (!window.location.hash) {
      return undefined
    }

    const targetId = window.location.hash.slice(1)
    const frameId = window.requestAnimationFrame(() => {
      document.getElementById(targetId)?.scrollIntoView()
    })

    return () => window.cancelAnimationFrame(frameId)
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
          setResultsActive(true)
          observer.disconnect()
        }
      },
      { threshold: 0.3 },
    )

    observer.observe(resultsSection)

    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    if (!resultsActive) {
      return undefined
    }

    let frameId = 0
    const duration = 1800
    const minFrameInterval = 32
    const startTime = performance.now()
    let lastUpdateTime = startTime

    const tick = (time) => {
      const elapsed = Math.min((time - startTime) / duration, 1)

      if (elapsed === 1 || time - lastUpdateTime >= minFrameInterval) {
        const eased = 1 - Math.pow(1 - elapsed, 3)

        setMetricValues(
          initialMetricValues.map((start, index) => {
            const end = targetMetricValues[index]
            return start + (end - start) * eased
          }),
        )

        lastUpdateTime = time
      }

      if (elapsed < 1) {
        frameId = window.requestAnimationFrame(tick)
      }
    }

    frameId = window.requestAnimationFrame(tick)

    return () => window.cancelAnimationFrame(frameId)
  }, [initialMetricValues, resultsActive, targetMetricValues])

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
    if (marketStories.length < 2 || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      return undefined
    }

    const timerId = window.setInterval(() => {
      setActiveMarketIndex((currentIndex) => (currentIndex + 1) % marketStories.length)
    }, 6500)

    return () => window.clearInterval(timerId)
  }, [marketStories.length])

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

  useEffect(() => {
    if (!activeService) {
      return undefined
    }

    const previousBodyOverflow = document.body.style.overflow
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        closeServiceModal()
      }
    }

    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', handleKeyDown)
    serviceModalTitleRef.current?.focus()

    return () => {
      document.body.style.overflow = previousBodyOverflow
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [activeService, closeServiceModal])

  useEffect(() => () => window.clearTimeout(serviceModalCloseTimer.current), [])

  const formatMetricValue = (metric, index) => {
    const value = metricValues[index] ?? metric.start

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

  const selectedService = capabilities.find((item) => item.slug === activeService) ?? null
  const selectedServiceIndex = selectedService ? capabilities.findIndex((item) => item.slug === selectedService.slug) : -1
  const activeMarketStory = marketStories[activeMarketIndex] ?? marketStories[0]

  const stepServiceModal = (direction) => {
    if (!selectedService) {
      return
    }

    const total = capabilities.length
    const nextIndex = (selectedServiceIndex + direction + total) % total
    setActiveService(capabilities[nextIndex].slug)
  }

  const stepMarket = (direction) => {
    const total = marketStories.length
    setActiveMarketIndex((currentIndex) => (currentIndex + direction + total) % total)
  }

  return (
    <div className="site-shell">
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
          <img className="brand-logo-mark" src="/guap-wordmark.svg" alt="GUAP" />
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

        <section className="hero-panel hero-panel-prism reveal-panel is-visible" data-reveal>
          <div className="hero-layout">
            <div className="hero-copy">
              <div className="hero-brandline">
                <img className="hero-logo-mark" src="/guap-wordmark.svg" alt="" aria-hidden="true" />
              </div>
              <span className="kicker">{copy.hero.kicker}</span>
              <h1>{copy.hero.title}</h1>
              <p className="hero-description">{copy.hero.description}</p>
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

          <div className="growth-system-path" aria-label={copy.ecosystem.noteTitle}>
            {copy.ecosystem.flow.map((step, index) => (
              <span key={step}>
                <strong>{String(index + 1).padStart(2, '0')}</strong>
                {step}
              </span>
            ))}
          </div>
        </section>

        <SectionTransition tone="transition-signal" />

        <section className="authority-band authority-band-signal reveal-panel" data-reveal>
          <div className="authority-copy">
            <span className="kicker">{copy.authority.kicker}</span>
            <h2>{copy.authority.title}</h2>
            <p>{copy.authority.description}</p>
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
              <p>{copy.ecosystem.description}</p>
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

        <section className="section-card markets-section markets-cinema reveal-panel" id="markets" data-reveal>
          <div className="markets-cinema-head">
            <div className="section-copy section-copy-wide">
              <span className="kicker">{copy.markets.kicker}</span>
              <h2>{copy.markets.title}</h2>
              <p>{copy.markets.description}</p>
            </div>

            <div className="markets-tabs" aria-label={copy.markets.railLabel}>
              {marketStories.map((story, index) => (
                <button
                  className={`market-tab ${activeMarketIndex === index ? 'is-active' : ''}`}
                  key={story.slug}
                  type="button"
                  aria-pressed={activeMarketIndex === index}
                  onClick={() => setActiveMarketIndex(index)}
                >
                  <span>{story.flag}</span>
                  {story.country}
                </button>
              ))}
            </div>
          </div>

          <div className={`market-stage ${activeMarketStory.visual}`} aria-label={copy.markets.aria}>
            <div className="market-stage-bg" aria-hidden="true">
              <span className="market-light light-one"></span>
              <span className="market-light light-two"></span>
              <span className="market-road"></span>
              <span className="market-skyline"></span>
              <span className="market-dashboard-lines"></span>
              <span className="market-particles"></span>
            </div>

            <article className="market-story" key={activeMarketStory.slug}>
              <div className="market-story-copy">
                <span className="market-story-eyebrow">
                  <span>{activeMarketStory.flag}</span>
                  {activeMarketStory.eyebrow}
                </span>
                <h3>{activeMarketStory.headline}</h3>
                <p>{activeMarketStory.text}</p>
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
            <button type="button" aria-label="Previous market" onClick={() => stepMarket(-1)}>
              ‹
            </button>
            <div className="market-progress" aria-hidden="true">
              {marketStories.map((story, index) => (
                <span className={activeMarketIndex === index ? 'is-active' : ''} key={story.slug}></span>
              ))}
            </div>
            <button type="button" aria-label="Next market" onClick={() => stepMarket(1)}>
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
              <p>{copy.partners.description}</p>
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

            <div className="section-copy section-copy-dark section-copy-compact">
              <p>{copy.capabilities.description}</p>
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
                <p className="service-card-description">{item.description}</p>
                <span className="service-card-action">{copy.capabilities.cardAction}</span>
                <span className="service-index">{String(index + 1).padStart(2, '0')}</span>
              </button>
            ))}
          </div>

          <div className="section-action-row">
            <p>{copy.capabilities.ctaText}</p>
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
              <p>{copy.results.description}</p>
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
              <article className={`metric-card metric-card-${index + 1} reveal-panel`} key={metric.label} data-reveal>
                <strong className={`metric-number ${resultsActive ? 'metric-number-live' : ''}`}>
                  {formatMetricValue(metric, index)}
                </strong>
                <span>{metric.label}</span>
                <p>{metric.detail}</p>
                <div className="metric-trend" aria-hidden="true">
                  <span className="trend-bar trend-a"></span>
                  <span className="trend-bar trend-b"></span>
                  <span className="trend-bar trend-c"></span>
                  <span className="trend-bar trend-d"></span>
                </div>
              </article>
            ))}
          </div>

          <div className="conversion-strip">
            <div>
              <span>{copy.results.ctaKicker}</span>
              <strong>{copy.results.ctaTitle}</strong>
              <p>{copy.results.ctaText}</p>
            </div>
            <a className="primary-button conversion-strip-cta" href={whatsappUrl} target="_blank" rel="noreferrer">
              {copy.results.cta}
            </a>
          </div>
        </section>

        <SectionTransition tone="transition-deep" />

        <section className="section-card proof-section section-mood-deep reveal-panel" id="proof" data-reveal>
          <div className="section-grid section-grid-split">
            <div className="section-copy">
              <span className="kicker">{copy.proof.kicker}</span>
              <h2>{copy.proof.title}</h2>
              <p>{copy.proof.description}</p>
            </div>

            <article className="proof-card proof-card-main">
              <span>{copy.proof.cardLabel}</span>
              <h3>{copy.proof.cardTitle}</h3>
              <p>{copy.proof.cardText}</p>
            </article>
          </div>

          <div className="proof-layout proof-layout-expanded">
            <article className="proof-card proof-card-visual" aria-hidden="true">
              <div className="proof-sphere"></div>
              <div className="proof-ring proof-ring-one"></div>
              <div className="proof-ring proof-ring-two"></div>
              <div className="proof-pulse pulse-one"></div>
              <div className="proof-pulse pulse-two"></div>
            </article>

            <article className="proof-card proof-card-list">
              <span>{copy.proof.useCasesLabel}</span>
              <ul>
                {copy.proof.useCases.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </article>
          </div>
        </section>

      </main>

      {selectedService ? (
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

            <button className="service-modal-arrow service-modal-arrow-left" type="button" aria-label={copy.previousService} onClick={() => stepServiceModal(-1)}>
              <span aria-hidden="true">‹</span>
            </button>

            <button className="service-modal-arrow service-modal-arrow-right" type="button" aria-label={copy.nextService} onClick={() => stepServiceModal(1)}>
              <span aria-hidden="true">›</span>
            </button>

            <div className="service-modal-layout">
              <div className="service-modal-copy">
                <span className="kicker">{selectedService.eyebrow}</span>
                <h3 id="service-modal-title" ref={serviceModalTitleRef} tabIndex="-1">
                  {selectedService.title}
                </h3>
                <p className="service-modal-impact">{selectedService.impact}</p>

                <div className="service-modal-detail">
                  {selectedService.details.map((detail) => (
                    <p key={detail}>{detail}</p>
                  ))}
                </div>

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
                <img className="service-modal-visual" src={selectedService.image} alt="" />
              </div>
            </div>
          </section>
        </div>
      ) : null}

      <footer className="footer-card footer-warp reveal-panel" id="contact" data-reveal>
        <div className="footer-layout">
          <div className="section-copy footer-brand">
            <img className="footer-logo-mark" src="/guap-wordmark.svg" alt="GUAP" />
            <span className="kicker">{copy.footer.kicker}</span>
            <h2>{copy.footer.title}</h2>
            <p className="footer-description">{copy.footer.description}</p>
            <p className="footer-positioning">{copy.footer.positioning}</p>
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
