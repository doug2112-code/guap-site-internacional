import { useMemo, useState } from 'react'
import './App.css'
import photoCanada from './assets/market-photos/canada-expansion.png'
import photoJapan from './assets/market-photos/japan-operations.png'
import photoUnitedStates from './assets/market-photos/us-growth.png'
import { clients } from './data/dashboardData'

const viewTabs = [
  { id: 'overview', label: 'Overview' },
  { id: 'ads', label: 'Ads' },
  { id: 'social', label: 'Instagram' },
]

const countryTabs = ['All', 'Japan', 'United States', 'Canada']
const statusTabs = ['All', 'Scaling', 'Active', 'Stable']

const marketPhotos = {
  Canada: photoCanada,
  Japan: photoJapan,
  'United States': photoUnitedStates,
}

function buildPortfolio(clientsList) {
  const revenue = clientsList.reduce((total, client) => total + client.metrics.revenue, 0)
  const averageGrowth =
    clientsList.reduce((total, client) => total + client.metrics.growth, 0) / clientsList.length
  const totalReach = clientsList.reduce((total, client) => total + client.metrics.reach, 0)

  return {
    totalClients: clientsList.length,
    totalRevenue: revenue,
    averageGrowth,
    totalReach,
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

function formatCurrency(value, currency) {
  return Number.isInteger(value)
    ? moneyFormatters[currency].format(value)
    : decimalMoneyFormatters[currency].format(value)
}

function formatCompact(value) {
  return new Intl.NumberFormat('en-US', {
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(value)
}

function getClientRegionClass(region) {
  return region.toLowerCase().replace(/[^a-z0-9]+/g, '-')
}

function getClientStatus(client) {
  if (client.metrics.growth >= 24 || client.metrics.engagement >= 11) {
    return 'Scaling'
  }

  if (client.metrics.growth >= 18) {
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

function App() {
  const [activeClientId, setActiveClientId] = useState(null)
  const [activeView, setActiveView] = useState('overview')
  const [activeCountry, setActiveCountry] = useState('All')
  const [activeStatus, setActiveStatus] = useState('All')
  const [searchQuery, setSearchQuery] = useState('')

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
          photo: marketPhotos[client.region] ?? client.cover,
        }
      }),
    [],
  )

  const activeClient = useMemo(
    () => clientsWithMeta.find((client) => client.id === activeClientId) ?? clientsWithMeta[0],
    [activeClientId, clientsWithMeta],
  )

  const activeContent = activeClient.tabs[activeView]
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
    const activeProjects = clientsWithMeta.filter((client) => client.status !== 'Stable').length
    const growthSystems = clientsWithMeta.filter((client) => client.metrics.roas >= 5).length
    const aiSystems = clientsWithMeta.filter((client) => client.metrics.engagement >= 10).length

    return [
      {
        label: 'Total Clients',
        value: String(portfolio.totalClients),
        note: 'Global portfolio',
      },
      {
        label: 'Japan',
        value: String(countryCounts.Japan),
        note: 'Operations lane',
      },
      {
        label: 'United States',
        value: String(countryCounts['United States']),
        note: 'Growth lane',
      },
      {
        label: 'Canada',
        value: String(countryCounts.Canada),
        note: 'Expansion lane',
      },
      {
        label: 'Active Projects',
        value: String(activeProjects),
        note: 'Live workstreams',
      },
      {
        label: 'Growth Systems',
        value: String(growthSystems),
        note: 'Scaling signals',
      },
      {
        label: 'Dashboards / AI Systems',
        value: String(aiSystems),
        note: 'Live intelligence nodes',
      },
    ]
  }, [clientsWithMeta, countryCounts, portfolio.totalClients])

  const trendPath = useMemo(() => {
    const values = activeClient.trend
    const max = Math.max(...values)
    const min = Math.min(...values)
    const width = 360
    const height = 120

    return values
      .map((value, index) => {
        const x = (index / (values.length - 1)) * width
        const y = height - ((value - min) / (max - min || 1)) * 92 - 14
        return `${index === 0 ? 'M' : 'L'} ${x} ${y}`
      })
      .join(' ')
  }, [activeClient])

  const resetFilters = () => {
    setSearchQuery('')
    setActiveCountry('All')
    setActiveStatus('All')
  }

  return (
    <div className={`dashboard-shell theme-${activeClient.theme}`}>
      <div className="backdrop glow-a" aria-hidden="true"></div>
      <div className="backdrop glow-b" aria-hidden="true"></div>
      <div className="backdrop glow-c" aria-hidden="true"></div>

      <header className="topbar">
        <div className="brand-block">
          <div className="brand-mark">
            <img src="/guap-wordmark.svg" alt="GUAP" className="brand-wordmark" />
          </div>
          <div className="brand-copy">
            <span className="brand-kicker">Client Intelligence Hub</span>
            <h1>{activeClientId ? activeClient.company : 'Client Intelligence Hub'}</h1>
            <p>Global operations, clients and performance systems.</p>
          </div>
        </div>

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
      </header>

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

      <section className="summary-grid">
        {summaryCards.map((card) => (
          <article key={card.label} className="summary-card panel">
            <span>{card.label}</span>
            <strong>{card.value}</strong>
            <small>{card.note}</small>
          </article>
        ))}
      </section>

      {!activeClientId ? (
        <main className="hub-view">
          <section className="hub-hero panel">
            <div className="hub-hero-copy">
              <span className="section-label">Global command center</span>
              <h2>Automotive portfolio command center</h2>
              <p>
                Luxury rentals, drift experiences, premium road tours and performance garages
                across the United States, Japan and Canada.
              </p>
            </div>

            <div className="hub-radar" aria-hidden="true">
              <span className="hub-radar-core"></span>
              <span className="hub-radar-ring hub-radar-ring-a"></span>
              <span className="hub-radar-ring hub-radar-ring-b"></span>
              <div className="hub-radar-lanes">
                <span>Japan</span>
                <span>United States</span>
                <span>Canada</span>
              </div>
            </div>
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
                    setActiveView('overview')
                  }}
                >
                  <div className="gallery-media">
                    <img src={client.photo} alt="" className="gallery-cover" />
                    <div className="gallery-cover-overlay"></div>
                    <div className="gallery-logo">
                      <span>{client.logo}</span>
                      <small>GUAP client</small>
                    </div>
                    <div className="gallery-flag-badge">
                      <img src={client.flag} alt={client.flagAlt} className="flag flag-badge" />
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
                        <img src={client.flag} alt={client.flagAlt} className="flag" />
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

                    <p>{client.tabs.overview.text}</p>

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
        <div className="layout">
          <aside className="sidebar panel">
            <div className="sidebar-head">
              <div className="sidebar-head-row">
                <span className="section-label">Portfolio map</span>
                <button
                  type="button"
                  className="back-link"
                  onClick={() => setActiveClientId(null)}
                >
                  All clients
                </button>
              </div>
              <h2>Active companies</h2>
            </div>

            <div className="client-list">
              {clientsWithMeta.map((client) => (
                <button
                  key={client.id}
                  type="button"
                  className={`client-card ${client.id === activeClient.id ? 'is-active' : ''}`}
                  onClick={() => {
                    setActiveClientId(client.id)
                    setActiveView('overview')
                  }}
                >
                  <img src={client.flag} alt={client.flagAlt} className="flag" />
                  <div className="client-card-copy">
                    <strong>{client.company}</strong>
                    <span>
                      {client.city}, {client.region}
                    </span>
                  </div>
                  <div className="client-card-meta">
                    <span className={`status-chip ${client.statusTone}`}>{client.status}</span>
                    <small>{client.updateLabel}</small>
                  </div>
                </button>
              ))}
            </div>
          </aside>

          <main className="content">
            <section className="hero panel">
              <div className="hero-main">
                <div className="hero-title-row">
                  <div className={`client-mark region-${activeClient.regionClass}`}>
                    <span>{activeClient.logo}</span>
                  </div>
                  <div>
                    <span className="section-label">Selected client</span>
                    <h2>{activeClient.company}</h2>
                    <p>
                      {activeClient.city}, {activeClient.region} · {activeClient.category}
                    </p>
                  </div>
                </div>

                <div className="client-meta-row">
                  <span className={`status-chip ${activeClient.statusTone}`}>
                    {activeClient.status}
                  </span>
                  <span className="meta-chip">{activeClient.platform}</span>
                  <span className="meta-chip">Last update {activeClient.updateLabel}</span>
                </div>

                <div className="view-tabs" role="tablist" aria-label="Dashboard views">
                  {viewTabs.map((tab) => (
                    <button
                      key={tab.id}
                      type="button"
                      role="tab"
                      aria-selected={activeView === tab.id}
                      className={`view-tab ${activeView === tab.id ? 'is-active' : ''}`}
                      onClick={() => setActiveView(tab.id)}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>

                <div className="insight-strip">
                  {activeClient.insights.map((item) => (
                    <div key={item.label} className="insight-pill">
                      <span>{item.label}</span>
                      <strong>{item.value}</strong>
                    </div>
                  ))}
                </div>
              </div>

              <div className="hero-side">
                <div className="result-card">
                  <span>Revenue system</span>
                  <strong>{formatCurrency(activeClient.metrics.revenue, activeClient.currency)}</strong>
                  <small>+{activeClient.metrics.growth}% this month</small>
                  <div className="result-card-foot">
                    <span className={`status-chip ${activeClient.statusTone}`}>
                      {activeClient.status}
                    </span>
                    <span className="status-chip">Open Client</span>
                  </div>
                </div>
                <div className="pulse-stack" aria-hidden="true">
                  <div className="pulse-ring pulse-ring-a"></div>
                  <div className="pulse-ring pulse-ring-b"></div>
                </div>
              </div>
            </section>

            <section className="results-grid">
              <article className="metric panel">
                <span>ROAS</span>
                <strong>{activeClient.metrics.roas}x</strong>
              </article>
              <article className="metric panel">
                <span>Cost per result</span>
                <strong>{formatCurrency(activeClient.metrics.cpr, activeClient.currency)}</strong>
              </article>
              <article className="metric panel">
                <span>Reach</span>
                <strong>{formatCompact(activeClient.metrics.reach)}</strong>
              </article>
              <article className="metric panel">
                <span>Engagement</span>
                <strong>{activeClient.metrics.engagement}%</strong>
              </article>
            </section>

            <section className="detail-grid">
              <article className="panel story-panel">
                <div className="panel-top">
                  <span className="section-label">Focus</span>
                  <div className="mini-dot"></div>
                </div>
                <h3>{activeContent.title}</h3>
                <p>{activeContent.text}</p>
              </article>

              <article className="panel trend-panel">
                <div className="panel-top">
                  <span className="section-label">Trend</span>
                  <span className="trend-tag">12 checkpoints</span>
                </div>
                <svg viewBox="0 0 360 120" className="trend-chart" aria-hidden="true">
                  <path d={trendPath} className="trend-line" />
                </svg>
              </article>

              <article className="panel profile-panel">
                <div className="panel-top">
                  <span className="section-label">Client profile</span>
                  <span className="trend-tag">Services delivered</span>
                </div>
                <div className="profile-cover">
                  <img src={activeClient.photo} alt="" />
                  <div className="profile-cover-overlay"></div>
                  <span>{activeClient.category}</span>
                </div>
                <div className="profile-stack">
                  <div>
                    <span>Market</span>
                    <strong>{activeClient.region}</strong>
                  </div>
                  <div>
                    <span>Channel mix</span>
                    <strong>{activeClient.platform}</strong>
                  </div>
                  <div>
                    <span>Status</span>
                    <strong>{activeClient.status}</strong>
                  </div>
                  <div>
                    <span>Last update</span>
                    <strong>{activeClient.updateLabel}</strong>
                  </div>
                </div>
                <div className="tag-cloud">
                  {activeClient.tags.map((tag) => (
                    <span key={tag} className="gallery-tag">
                      {tag}
                    </span>
                  ))}
                </div>
              </article>

              <article className="panel activity-panel">
                <div className="panel-top">
                  <span className="section-label">Next actions</span>
                  <span className="trend-tag">Realtime feed</span>
                </div>
                <div className="activity-list">
                  {activeClient.activity.map((item) => (
                    <div key={`${item.time}-${item.text}`} className="activity-item">
                      <span>{item.time}</span>
                      <p>{item.text}</p>
                    </div>
                  ))}
                </div>
              </article>
            </section>
          </main>
        </div>
      )}
    </div>
  )
}

export default App
