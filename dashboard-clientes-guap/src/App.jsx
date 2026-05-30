import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import './App.css'
import { clients } from './data/dashboardData'

const countryTabs = ['All', 'Japan', 'United States', 'Canada']
const statusTabs = ['All', 'Scaling', 'Active', 'Stable']
const USD_BY_CURRENCY = {
  USD: 1,
  JPY: 0.0064,
}

const campaignBlueprints = [
  {
    name: 'Campaign 01',
    focus: 'Retargeting WhatsApp',
    start: 'May 01',
    end: 'May 07',
    spendShare: 0.08,
    revenueShare: 0.06,
  },
  {
    name: 'Campaign 02',
    focus: 'Lead capture',
    start: 'May 08',
    end: 'May 14',
    spendShare: 0.15,
    revenueShare: 0.16,
  },
  {
    name: 'Campaign 03',
    focus: 'High-intent audience',
    start: 'May 15',
    end: 'May 21',
    spendShare: 0.22,
    revenueShare: 0.23,
  },
  {
    name: 'Campaign 04',
    focus: 'Premium offer',
    start: 'May 22',
    end: 'May 26',
    spendShare: 0.25,
    revenueShare: 0.25,
  },
  {
    name: 'Campaign 05',
    focus: 'Scale window',
    start: 'May 27',
    end: 'May 31',
    spendShare: 0.3,
    revenueShare: 0.3,
  },
]

const journeyMilestones = [
  { date: 'May 01', label: 'Campaign Launch' },
  { date: 'May 07', label: 'Creative Optimization' },
  { date: 'May 14', label: 'WhatsApp Scale Phase' },
  { date: 'May 22', label: 'Market Expansion' },
  { date: 'May 31', label: 'Record Revenue Month' },
]

function buildPortfolio(clientsList) {
  const revenue = clientsList.reduce(
    (total, client) => total + client.metrics.revenue * USD_BY_CURRENCY[client.currency],
    0,
  )
  const adSpend = clientsList.reduce(
    (total, client) => total + client.metrics.adSpend * USD_BY_CURRENCY[client.currency],
    0,
  )
  const leads = clientsList.reduce((total, client) => total + client.metrics.leads, 0)
  const whatsappStarted = clientsList.reduce(
    (total, client) => total + client.metrics.whatsappStarted,
    0,
  )

  return {
    totalClients: clientsList.length,
    totalRevenue: revenue,
    adSpend,
    leads,
    whatsappStarted,
    blendedRoas: revenue / adSpend,
  }
}

const moneyFormatters = {
  USD: new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }),
  JPY: new Intl.NumberFormat('ja-JP', {
    style: 'currency',
    currency: 'JPY',
    maximumFractionDigits: 0,
  }),
}

const decimalMoneyFormatters = {
  USD: new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }),
  JPY: new Intl.NumberFormat('ja-JP', {
    style: 'currency',
    currency: 'JPY',
    maximumFractionDigits: 0,
  }),
}

const compactFormatter = new Intl.NumberFormat('en-US', {
  notation: 'compact',
  maximumFractionDigits: 1,
})
const numberFormatterCache = new Map()
const reducedMotionSubscribers = new Set()
let reducedMotionQuery

const getReducedMotionQuery = () => {
  if (!reducedMotionQuery && typeof window !== 'undefined') {
    reducedMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
  }

  return reducedMotionQuery
}

const readReducedMotion = () => getReducedMotionQuery()?.matches ?? false

const handleReducedMotionChange = () => {
  const nextValue = readReducedMotion()
  reducedMotionSubscribers.forEach((listener) => listener(nextValue))
}

const subscribeReducedMotion = (listener) => {
  const mediaQuery = getReducedMotionQuery()

  if (!mediaQuery) {
    return () => {}
  }

  reducedMotionSubscribers.add(listener)

  if (reducedMotionSubscribers.size === 1) {
    if (typeof mediaQuery.addEventListener === 'function') {
      mediaQuery.addEventListener('change', handleReducedMotionChange)
    } else {
      mediaQuery.addListener(handleReducedMotionChange)
    }
  }

  return () => {
    reducedMotionSubscribers.delete(listener)

    if (reducedMotionSubscribers.size === 0) {
      if (typeof mediaQuery.removeEventListener === 'function') {
        mediaQuery.removeEventListener('change', handleReducedMotionChange)
      } else {
        mediaQuery.removeListener(handleReducedMotionChange)
      }
    }
  }
}

function formatCurrency(value, currency) {
  return Number.isInteger(value)
    ? moneyFormatters[currency].format(value)
    : decimalMoneyFormatters[currency].format(value)
}

function formatCompact(value) {
  return compactFormatter.format(value)
}

function formatAnimatedValue(value, format, currency, decimals = 0, suffix = '') {
  if (format === 'currency') {
    return formatCurrency(Math.round(value), currency)
  }

  const cacheKey = `${decimals}`

  if (!numberFormatterCache.has(cacheKey)) {
    numberFormatterCache.set(
      cacheKey,
      new Intl.NumberFormat('en-US', {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
      }),
    )
  }

  return `${numberFormatterCache.get(cacheKey).format(value)}${suffix}`
}

function useReducedMotion() {
  const [reducedMotion, setReducedMotion] = useState(readReducedMotion)

  useEffect(() => {
    return subscribeReducedMotion(setReducedMotion)
  }, [])

  return reducedMotion
}

function AnimatedValue({
  value,
  format = 'number',
  currency = 'USD',
  decimals = 0,
  suffix = '',
  duration = 1050,
  delay = 0,
  className = '',
}) {
  const elementRef = useRef(null)
  const frameRef = useRef(null)
  const completeTimerRef = useRef(null)
  const reducedMotion = useReducedMotion()
  const finalText = formatAnimatedValue(value, format, currency, decimals, suffix)

  useEffect(() => {
    const element = elementRef.current

    if (!element) {
      return undefined
    }

    if (reducedMotion) {
      element.textContent = finalText
      element.classList.add('has-started', 'is-complete')
      return undefined
    }

    let lastText = ''
    const setNumberText = (nextValue) => {
      const nextText = formatAnimatedValue(nextValue, format, currency, decimals, suffix)

      if (nextText !== lastText) {
        element.textContent = nextText
        lastText = nextText
      }
    }

    element.classList.remove('has-started', 'is-complete')
    setNumberText(0)

    const finishAnimation = () => {
      if (frameRef.current) {
        cancelAnimationFrame(frameRef.current)
        frameRef.current = null
      }
      if (completeTimerRef.current) {
        window.clearTimeout(completeTimerRef.current)
        completeTimerRef.current = null
      }

      element.textContent = finalText
      element.classList.add('is-complete')
    }

    const runAnimation = () => {
      const startTime = performance.now() + delay
      element.classList.add('has-started')

      completeTimerRef.current = window.setTimeout(finishAnimation, delay + duration + 180)

      const tick = (now) => {
        if (now < startTime) {
          frameRef.current = requestAnimationFrame(tick)
          return
        }

        const elapsed = Math.min((now - startTime) / duration, 1)
        const easedProgress = 1 - Math.pow(1 - elapsed, 3)

        setNumberText(value * easedProgress)

        if (elapsed < 1) {
          frameRef.current = requestAnimationFrame(tick)
        } else {
          finishAnimation()
        }
      }

      frameRef.current = requestAnimationFrame(tick)
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          runAnimation()
          observer.disconnect()
        }
      },
      { rootMargin: '90px 0px 120px 0px', threshold: 0.12 },
    )

    observer.observe(element)

    return () => {
      observer.disconnect()
      if (frameRef.current) {
        cancelAnimationFrame(frameRef.current)
      }
      if (completeTimerRef.current) {
        window.clearTimeout(completeTimerRef.current)
      }
    }
  }, [currency, decimals, delay, duration, finalText, format, reducedMotion, suffix, value])

  return (
    <strong
      ref={elementRef}
      className={`animated-number ${className}`}
      aria-label={finalText}
    >
      {reducedMotion ? finalText : formatAnimatedValue(0, format, currency, decimals, suffix)}
    </strong>
  )
}

function RevealSection({ as: Component = 'section', className = '', children, ...props }) {
  const elementRef = useRef(null)
  const reducedMotion = useReducedMotion()

  useEffect(() => {
    const element = elementRef.current

    if (!element) {
      return undefined
    }

    if (reducedMotion) {
      element.classList.add('is-visible')
      return undefined
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          element.classList.add('is-visible')
          observer.disconnect()
        }
      },
      { rootMargin: '0px 0px -14% 0px', threshold: 0.12 },
    )

    observer.observe(element)

    return () => observer.disconnect()
  }, [reducedMotion])

  return (
    <Component ref={elementRef} className={`reveal-section ${className}`} {...props}>
      {children}
    </Component>
  )
}

function buildCampaigns(client) {
  return campaignBlueprints.map((campaign, index) => {
    const investment = Math.round(client.metrics.adSpend * campaign.spendShare)
    const revenue = Math.round(client.metrics.revenue * campaign.revenueShare)
    const returnMultiple = revenue / investment
    const progress = Math.min(100, 46 + index * 11 + client.metrics.roas * 2)

    return {
      ...campaign,
      id: `${client.id}-${campaign.name}`,
      investment,
      revenue,
      returnMultiple,
      progress,
    }
  })
}

function getClientRegionClass(region) {
  return region.toLowerCase().replace(/[^a-z0-9]+/g, '-')
}

function getClientStatus(client) {
  if (client.metrics.roas >= 5.8 || client.metrics.whatsappConversionRate >= 64) {
    return 'Scaling'
  }

  if (client.metrics.roas >= 5) {
    return 'Active'
  }

  return 'Stable'
}

function getClientStatusTone(status) {
  if (status === 'Scaling') {
    return 'status-scaling'
  }

  if (status === 'Active') {
    return 'status-active'
  }

  return 'status-stable'
}

function getClientTags(client) {
  return [...new Set([client.category, ...client.platform.split(' + '), client.insights[1]?.value])]
    .filter(Boolean)
    .slice(0, 3)
}

function getClientUpdate(client) {
  return client.activity[0]?.time ? `${client.activity[0].time} local` : 'Live now'
}

function ClientProjectView({ client, onBack }) {
  const campaigns = useMemo(() => buildCampaigns(client), [client])
  const totalReturn = client.metrics.revenue - client.metrics.adSpend
  const strategicSummary = `${client.tabs.overview.text} Focus: profitable WhatsApp demand, efficient media spend and cleaner campaign pacing.`
  const growthStory = `Started with fragmented demand and inconsistent booking momentum. Through structured media buying, sharper creative signals and WhatsApp conversion tracking, ${client.company} built a more predictable growth rhythm in the ${client.city} market.`
  const executiveKpis = [
    {
      label: 'Revenue Generated',
      value: client.metrics.revenue,
      format: 'currency',
      note: 'Attributed campaign revenue',
    },
    {
      label: 'Investment',
      value: client.metrics.adSpend,
      format: 'currency',
      note: 'Media spend deployed',
    },
    {
      label: 'Return',
      value: totalReturn,
      format: 'currency',
      note: 'Net value created',
    },
    {
      label: 'Performance',
      value: client.metrics.roi,
      format: 'number',
      decimals: 2,
      suffix: 'x',
      note: 'Return on investment',
    },
  ]

  useLayoutEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' })
  }, [client.id])

  return (
    <main className={`project-view theme-${client.theme} region-${client.regionClass}`}>
      <div className="project-ambient project-ambient-a" aria-hidden="true"></div>
      <div className="project-ambient project-ambient-b" aria-hidden="true"></div>

      <nav className="project-nav" aria-label="Project navigation">
        <button type="button" className="project-back" onClick={onBack}>
          <span aria-hidden="true">←</span>
          All Clients
        </button>
        <div className="project-live">
          <span className="sync-dot"></span>
          Live project
        </div>
      </nav>

      <RevealSection className="project-hero">
        <div className="project-visual" aria-hidden="true">
          <img src={client.photo} width="1600" height="1000" decoding="async" fetchPriority="high" alt="" />
          <div className="project-visual-glow"></div>
        </div>

        <div className="project-hero-copy">
          <span className="section-label">Client project</span>
          <h1>{client.company}</h1>
          <p>
            {client.city}, {client.region} · {client.category}
          </p>
          <div className="project-chip-row">
            <span className={`status-chip ${client.statusTone}`}>{client.status}</span>
            <span className="meta-chip">{client.platform}</span>
            <span className="meta-chip">May 01 - May 31</span>
          </div>
        </div>

        <p className="project-summary">{strategicSummary}</p>
      </RevealSection>

      <RevealSection className="executive-kpis" aria-label="Executive KPIs">
        {executiveKpis.map((item, index) => (
          <article
            key={item.label}
            className="executive-kpi reveal-item"
            style={{ '--stagger': `${index * 110}ms` }}
          >
            <span>{item.label}</span>
            <AnimatedValue
              value={item.value}
              format={item.format}
              currency={client.currency}
              decimals={item.decimals}
              suffix={item.suffix}
              delay={index * 110}
              className="executive-number"
            />
            <small>{item.note}</small>
          </article>
        ))}
      </RevealSection>

      <RevealSection className="financial-comparison">
        <article className="investment-card">
          <span className="section-label">Investment vs return</span>
          <div className="return-compare">
            <div>
              <span>Investment line</span>
              <AnimatedValue
                value={client.metrics.adSpend}
                format="currency"
                currency={client.currency}
                className="return-number"
              />
              <i className="return-line investment-line" style={{ width: '34%' }}></i>
            </div>
            <div>
              <span>Revenue line</span>
              <AnimatedValue
                value={client.metrics.revenue}
                format="currency"
                currency={client.currency}
                delay={120}
                className="return-number"
              />
              <i
                className="return-line revenue-line"
                style={{ width: `${Math.min(100, client.metrics.roas * 12)}%` }}
              ></i>
            </div>
            <div>
              <span>Return line</span>
              <AnimatedValue
                value={totalReturn}
                format="currency"
                currency={client.currency}
                delay={240}
                className="return-number"
              />
              <i
                className="return-line net-line"
                style={{ width: `${Math.min(100, client.metrics.roi * 14)}%` }}
              ></i>
            </div>
          </div>
        </article>
      </RevealSection>

      <RevealSection className="growth-story">
        <span className="section-label">Growth Story</span>
        <p>{growthStory}</p>
      </RevealSection>

      <RevealSection className="result-journey">
        <div className="section-heading">
          <span className="section-label">Result timeline</span>
          <h2>A private growth journey</h2>
        </div>

        <div className="journey-line" aria-hidden="true"></div>
        <div className="journey-grid">
          {journeyMilestones.map((milestone, index) => (
            <article
              key={milestone.date}
              className="journey-step"
              style={{ '--stagger': `${index * 120}ms` }}
            >
              <span>{milestone.date}</span>
              <strong>{milestone.label}</strong>
            </article>
          ))}
        </div>
      </RevealSection>

      <RevealSection className="campaign-section">
        <div className="section-heading">
          <span className="section-label">Campaign performance</span>
          <h2>Campaign-by-campaign return</h2>
        </div>

        <div className="campaign-grid">
          {campaigns.map((campaign, index) => (
            <article
              key={campaign.id}
              className="campaign-card reveal-item"
              style={{ '--stagger': `${index * 105}ms` }}
            >
              <div className="campaign-card-head">
                <span>{campaign.name}</span>
                <small>
                  {campaign.start} - {campaign.end}
                </small>
              </div>
              <h3>{campaign.focus}</h3>
              <div className="campaign-values">
                <div>
                  <span>Investment</span>
                  <AnimatedValue
                    value={campaign.investment}
                    format="currency"
                    currency={client.currency}
                    delay={index * 90}
                    className="campaign-number"
                  />
                </div>
                <div>
                  <span>Revenue</span>
                  <AnimatedValue
                    value={campaign.revenue}
                    format="currency"
                    currency={client.currency}
                    delay={index * 90 + 80}
                    className="campaign-number"
                  />
                </div>
                <div>
                  <span>Return</span>
                  <AnimatedValue
                    value={campaign.returnMultiple}
                    decimals={1}
                    suffix="x"
                    delay={index * 90 + 160}
                    className="campaign-number"
                  />
                </div>
              </div>
              <div className="campaign-progress" aria-hidden="true">
                <span style={{ width: `${campaign.progress}%` }}></span>
              </div>
            </article>
          ))}
        </div>
      </RevealSection>

      <RevealSection className="project-bottom-grid">
        <article className="next-actions-card">
          <div className="panel-top">
            <span className="section-label">Next actions</span>
            <span className="trend-tag">Clean feed</span>
          </div>
          <div className="activity-list">
            {client.activity.slice(0, 3).map((item) => (
              <div key={`${item.time}-${item.text}`} className="activity-item">
                <span>{item.time}</span>
                <p>{item.text}</p>
              </div>
            ))}
          </div>
        </article>
      </RevealSection>
    </main>
  )
}

function App() {
  const [activeClientId, setActiveClientId] = useState(null)
  const [activeCountry, setActiveCountry] = useState('All')
  const [activeStatus, setActiveStatus] = useState('All')
  const [searchQuery, setSearchQuery] = useState('')
  const [isDirectoryOpen, setIsDirectoryOpen] = useState(false)

  const clientsWithMeta = useMemo(
    () =>
      clients.map((client) => {
        const status = getClientStatus(client)

        return {
          ...client,
          status,
          statusTone: getClientStatusTone(status),
          tags: getClientTags(client),
          updateLabel: getClientUpdate(client),
          regionClass: getClientRegionClass(client.region),
          photo: client.cover,
        }
      }),
    [],
  )

  const activeClient = useMemo(
    () => clientsWithMeta.find((client) => client.id === activeClientId) ?? clientsWithMeta[0],
    [activeClientId, clientsWithMeta],
  )

  const portfolio = useMemo(() => buildPortfolio(clientsWithMeta), [clientsWithMeta])

  const countryCounts = useMemo(() => {
    return {
      All: clientsWithMeta.length,
      Japan: clientsWithMeta.filter((client) => client.region === 'Japan').length,
      'United States': clientsWithMeta.filter((client) => client.region === 'United States').length,
      Canada: clientsWithMeta.filter((client) => client.region === 'Canada').length,
    }
  }, [clientsWithMeta])

  const statusCounts = useMemo(() => {
    return {
      All: clientsWithMeta.length,
      Scaling: clientsWithMeta.filter((client) => client.status === 'Scaling').length,
      Active: clientsWithMeta.filter((client) => client.status === 'Active').length,
      Stable: clientsWithMeta.filter((client) => client.status === 'Stable').length,
    }
  }, [clientsWithMeta])

  const filteredClients = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase()

    return clientsWithMeta.filter((client) => {
      const matchesCountry = activeCountry === 'All' || client.region === activeCountry
      const matchesStatus = activeStatus === 'All' || client.status === activeStatus
      const matchesQuery =
        normalizedQuery.length === 0 ||
        [client.company, client.city, client.region, client.category, client.platform, client.logo]
          .join(' ')
          .toLowerCase()
          .includes(normalizedQuery)

      return matchesCountry && matchesStatus && matchesQuery
    })
  }, [activeCountry, activeStatus, clientsWithMeta, searchQuery])

  const summaryCards = useMemo(() => {
    return [
      {
        label: 'Clientes',
        value: String(portfolio.totalClients),
        note: 'contas ativas',
      },
      {
        label: 'Faturamento',
        value: formatCurrency(portfolio.totalRevenue, 'USD'),
        note: 'atribuido / influenciado',
      },
      {
        label: 'Investimento',
        value: formatCurrency(portfolio.adSpend, 'USD'),
        note: `${portfolio.blendedRoas.toFixed(2)}x ROAS medio`,
      },
      {
        label: 'WhatsApp',
        value: formatCompact(portfolio.whatsappStarted),
        note: `${formatCompact(portfolio.leads)} leads rastreados`,
      },
    ]
  }, [portfolio])

  const resetFilters = () => {
    setSearchQuery('')
    setActiveCountry('All')
    setActiveStatus('All')
  }

  return (
    <div className={`dashboard-shell theme-${activeClient.theme}`}>
      {!activeClientId && (
        <header className="topbar">
          <div className="brand-block">
            <div className="brand-mark">
              <img src="/guap-wordmark.svg" alt="GUAP" className="brand-wordmark" />
            </div>
            <div className="brand-copy">
              <button
                type="button"
                className="title-button"
                onClick={() => {
                  setActiveClientId(null)
                  setIsDirectoryOpen(true)
                }}
              >
                Client Intelligence Hub
              </button>
            </div>
          </div>

          {isDirectoryOpen && (
            <div className="topbar-actions">
              <label className="search-field" htmlFor="client-search">
                <span className="search-icon" aria-hidden="true">
                  <svg viewBox="0 0 24 24" focusable="false" aria-hidden="true">
                    <circle cx="11" cy="11" r="6.5"></circle>
                    <path d="M16 16l4.5 4.5"></path>
                  </svg>
                </span>
                <input
                  id="client-search"
                  type="search"
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  placeholder="Search clients, markets, services"
                />
              </label>
              <div className="sync-pill">
                <span className="sync-dot"></span>
                Live now
              </div>
            </div>
          )}
        </header>
      )}

      {!activeClientId && !isDirectoryOpen ? (
        <main className="hub-start" aria-label="Open client hub">
          <button type="button" className="hub-start-button" onClick={() => setIsDirectoryOpen(true)}>
            <span>GUAP dashboard</span>
            <strong>Client Intelligence Hub</strong>
            <small>Clique para abrir os clientes</small>
          </button>
        </main>
      ) : !activeClientId ? (
        <main className="hub-view">
          <section className="summary-grid">
            {summaryCards.map((card) => (
              <article key={card.label} className="summary-card panel">
                <span>{card.label}</span>
                <strong>{card.value}</strong>
                <small>{card.note}</small>
              </article>
            ))}
          </section>

          <section className="command-bar panel" aria-label="Client filters">
            <div className="command-group">
              <span className="section-label">Country</span>
              <div className="pill-row">
                {countryTabs.map((country) => (
                  <button
                    key={country}
                    type="button"
                    className={`filter-pill ${activeCountry === country ? 'is-active' : ''}`}
                    onClick={() => setActiveCountry(country)}
                  >
                    <span>{country}</span>
                    <strong>{countryCounts[country]}</strong>
                  </button>
                ))}
              </div>
            </div>

            <div className="command-group">
              <span className="section-label">Status</span>
              <div className="pill-row">
                {statusTabs.map((status) => (
                  <button
                    key={status}
                    type="button"
                    className={`filter-pill ${activeStatus === status ? 'is-active' : ''}`}
                    onClick={() => setActiveStatus(status)}
                  >
                    <span>{status}</span>
                    <strong>{statusCounts[status]}</strong>
                  </button>
                ))}
              </div>
            </div>

            <button type="button" className="ghost-button" onClick={resetFilters}>
              Reset filters
            </button>
          </section>

          {filteredClients.length > 0 ? (
            <section className="client-gallery">
              {filteredClients.map((client) => (
                <button
                  key={client.id}
                  type="button"
                  className={`gallery-card panel theme-${client.theme} region-${client.regionClass}`}
                  onClick={() => {
                    setActiveClientId(client.id)
                    setIsDirectoryOpen(true)
                  }}
                >
                  <div className="gallery-media">
                    <img
                      src={client.photo}
                      alt=""
                      className="gallery-cover"
                      width="900"
                      height="620"
                      loading="lazy"
                      decoding="async"
                    />
                    <div className="gallery-cover-overlay"></div>
                    <div className="gallery-logo">
                      <span>{client.logo}</span>
                      <small>GUAP client</small>
                    </div>
                    <div className="gallery-flag-badge">
                      <img
                        src={client.flag}
                        alt={client.flagAlt}
                        className="flag flag-badge"
                        width="22"
                        height="22"
                        loading="lazy"
                        decoding="async"
                      />
                      <span>{client.region}</span>
                    </div>
                    <div className="gallery-image-caption">
                      <strong>{client.category}</strong>
                      <span>{client.platform}</span>
                    </div>
                  </div>

                  <div className="gallery-copy">
                    <div className="gallery-topline">
                      <div className="gallery-topline-copy">
                        <img
                          src={client.flag}
                          alt={client.flagAlt}
                          className="flag"
                          width="30"
                          height="30"
                          loading="lazy"
                          decoding="async"
                        />
                        <div>
                          <strong>{client.company}</strong>
                          <span>
                            {client.city}, {client.region}
                          </span>
                        </div>
                      </div>
                      <span className={`status-chip ${client.statusTone}`}>{client.status}</span>
                    </div>

                    <div className="gallery-tag-row">
                      {client.tags.map((tag) => (
                        <span key={tag} className="gallery-tag">
                          {tag}
                        </span>
                      ))}
                    </div>

                    <div className="gallery-metrics">
                      <div>
                        <span>ROAS</span>
                        <strong>{client.metrics.roas}x</strong>
                      </div>
                      <div>
                        <span>CPL</span>
                        <strong>{formatCurrency(client.metrics.cpl, client.currency)}</strong>
                      </div>
                      <div>
                        <span>WhatsApp</span>
                        <strong>{formatCompact(client.metrics.whatsappStarted)}</strong>
                      </div>
                    </div>

                    <div className="gallery-footer">
                      <small>Last update {client.updateLabel}</small>
                      <span>Open Client</span>
                    </div>
                  </div>
                </button>
              ))}
            </section>
          ) : (
            <section className="empty-state panel">
              <span className="section-label">No matches</span>
              <h3>No clients match this combination.</h3>
              <p>Try another market, status or search term.</p>
              <button type="button" className="ghost-button" onClick={resetFilters}>
                Clear filters
              </button>
            </section>
          )}
        </main>
      ) : (
        <ClientProjectView client={activeClient} onBack={() => setActiveClientId(null)} />
      )}
    </div>
  )
}

export default App
