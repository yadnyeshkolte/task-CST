import { useCallback, useEffect, useMemo, useState } from 'react'
import './App.css'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || ''
const STATUSES = ['Open', 'In Progress', 'Closed']
const EMPTY_FORM = {
  customer_name: '',
  customer_email: '',
  subject: '',
  description: '',
}

function formatDate(value) {
  if (!value) return 'Not available'

  return new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value))
}

function statusClass(status) {
  return `status status-${status.toLowerCase().replace(/\s+/g, '-')}`
}

async function apiRequest(path, options = {}) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  })

  const payload = await response.json().catch(() => ({}))

  if (!response.ok) {
    throw new Error(payload.error || 'The request could not be completed.')
  }

  return payload
}

function App() {
  const [tickets, setTickets] = useState([])
  const [selectedTicket, setSelectedTicket] = useState(null)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [view, setView] = useState('list')
  const [form, setForm] = useState(EMPTY_FORM)
  const [draftStatus, setDraftStatus] = useState('Open')
  const [noteText, setNoteText] = useState('')
  const [loadingList, setLoadingList] = useState(true)
  const [loadingDetail, setLoadingDetail] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  const metrics = useMemo(() => {
    return STATUSES.map((status) => ({
      label: status,
      count: tickets.filter((ticket) => ticket.status === status).length,
    }))
  }, [tickets])

  const loadTickets = useCallback(async () => {
    setLoadingList(true)
    setError('')

    try {
      const params = new URLSearchParams()

      if (statusFilter) params.set('status', statusFilter)
      if (search.trim()) params.set('search', search.trim())

      const query = params.toString()
      const data = await apiRequest(`/api/tickets${query ? `?${query}` : ''}`)
      setTickets(data)
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setLoadingList(false)
    }
  }, [search, statusFilter])

  const loadTicket = useCallback(async (ticketId) => {
    setLoadingDetail(true)
    setError('')
    setNotice('')

    try {
      const data = await apiRequest(`/api/tickets/${ticketId}`)
      setSelectedTicket(data)
      setDraftStatus(data.status)
      setView('detail')
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setLoadingDetail(false)
    }
  }, [])

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      loadTickets()
    }, 250)

    return () => window.clearTimeout(timeout)
  }, [loadTickets])

  function updateForm(event) {
    const { name, value } = event.target
    setForm((current) => ({
      ...current,
      [name]: value,
    }))
  }

  async function createTicket(event) {
    event.preventDefault()
    setSubmitting(true)
    setError('')
    setNotice('')

    try {
      const result = await apiRequest('/api/tickets', {
        method: 'POST',
        body: JSON.stringify(form),
      })

      setForm(EMPTY_FORM)
      setNotice(`Created ${result.ticket_id}.`)
      await loadTickets()
      await loadTicket(result.ticket_id)
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setSubmitting(false)
    }
  }

  async function updateTicket(event) {
    event.preventDefault()

    if (!selectedTicket) return

    setSubmitting(true)
    setError('')
    setNotice('')

    try {
      await apiRequest(`/api/tickets/${selectedTicket.ticket_id}`, {
        method: 'PUT',
        body: JSON.stringify({
          status: draftStatus,
          notes: noteText,
        }),
      })

      setNoteText('')
      setNotice('Ticket updated.')
      await loadTickets()
      await loadTicket(selectedTicket.ticket_id)
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setSubmitting(false)
    }
  }

  function showCreateForm() {
    setSelectedTicket(null)
    setView('create')
    setError('')
    setNotice('')
  }

  function showList() {
    setView('list')
    setError('')
    setNotice('')
  }

  return (
    <main className="app-shell">
      <header className="topbar">
        <div>
          <p className="eyebrow">Customer Support CRM</p>
          <h1>Tickets, customers, and team notes in one queue.</h1>
        </div>
        <div className="topbar-actions">
          <button className="secondary-button" type="button" onClick={loadTickets}>
            Refresh
          </button>
          <button className="primary-button" type="button" onClick={showCreateForm}>
            New ticket
          </button>
        </div>
      </header>

      <section className="metrics-grid" aria-label="Ticket status summary">
        {metrics.map((metric) => (
          <article className="metric" key={metric.label}>
            <span>{metric.label}</span>
            <strong>{metric.count}</strong>
          </article>
        ))}
      </section>

      {(error || notice) && (
        <section className={error ? 'alert alert-error' : 'alert alert-success'}>
          {error || notice}
        </section>
      )}

      <section className="workspace">
        <aside className="queue-panel">
          <div className="panel-heading">
            <div>
              <h2>Ticket queue</h2>
              <p>{loadingList ? 'Loading tickets' : `${tickets.length} visible tickets`}</p>
            </div>
            <button className="link-button" type="button" onClick={showList}>
              View all
            </button>
          </div>

          <div className="controls">
            <label>
              <span>Search</span>
              <input
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Name, email, ID, or issue"
              />
            </label>

            <label>
              <span>Status</span>
              <select
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value)}
              >
                <option value="">All statuses</option>
                {STATUSES.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="ticket-list">
            {loadingList && <p className="empty-state">Loading ticket queue...</p>}

            {!loadingList &&
              tickets.map((ticket) => (
                <button
                  className={`ticket-row ${
                    selectedTicket?.ticket_id === ticket.ticket_id ? 'is-active' : ''
                  }`}
                  key={ticket.ticket_id}
                  type="button"
                  onClick={() => loadTicket(ticket.ticket_id)}
                >
                  <span className="ticket-main">
                    <strong>{ticket.subject}</strong>
                    <small>
                      {ticket.ticket_id} · {ticket.customer_name}
                    </small>
                  </span>
                  <span className="ticket-meta">
                    <span className={statusClass(ticket.status)}>{ticket.status}</span>
                    <time>{formatDate(ticket.created_at)}</time>
                  </span>
                </button>
              ))}

            {!loadingList && tickets.length === 0 && (
              <p className="empty-state">No tickets match this view.</p>
            )}
          </div>
        </aside>

        <section className="content-panel">
          {view === 'list' && (
            <div className="table-view">
              <div className="panel-heading">
                <div>
                  <h2>All tickets</h2>
                  <p>Search and filter results update as you type.</p>
                </div>
              </div>

              <div className="responsive-table">
                <table>
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Name</th>
                      <th>Title</th>
                      <th>Status</th>
                      <th>Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tickets.map((ticket) => (
                      <tr key={ticket.ticket_id} onClick={() => loadTicket(ticket.ticket_id)}>
                        <td>{ticket.ticket_id}</td>
                        <td>{ticket.customer_name}</td>
                        <td>{ticket.subject}</td>
                        <td>
                          <span className={statusClass(ticket.status)}>{ticket.status}</span>
                        </td>
                        <td>{formatDate(ticket.created_at)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {!loadingList && tickets.length === 0 && (
                <p className="empty-state">Create the first support ticket to start the queue.</p>
              )}
            </div>
          )}

          {view === 'create' && (
            <form className="ticket-form" onSubmit={createTicket}>
              <div className="panel-heading">
                <div>
                  <h2>Create ticket</h2>
                  <p>Capture the customer and issue details for the support team.</p>
                </div>
              </div>

              <div className="form-grid">
                <label>
                  <span>Customer name</span>
                  <input
                    name="customer_name"
                    value={form.customer_name}
                    onChange={updateForm}
                    required
                  />
                </label>

                <label>
                  <span>Customer email</span>
                  <input
                    name="customer_email"
                    type="email"
                    value={form.customer_email}
                    onChange={updateForm}
                    required
                  />
                </label>
              </div>

              <label>
                <span>Issue title</span>
                <input name="subject" value={form.subject} onChange={updateForm} required />
              </label>

              <label>
                <span>Description</span>
                <textarea
                  name="description"
                  value={form.description}
                  onChange={updateForm}
                  rows="7"
                  required
                />
              </label>

              <div className="form-actions">
                <button className="secondary-button" type="button" onClick={showList}>
                  Cancel
                </button>
                <button className="primary-button" type="submit" disabled={submitting}>
                  {submitting ? 'Creating...' : 'Create ticket'}
                </button>
              </div>
            </form>
          )}

          {view === 'detail' && (
            <div className="detail-view">
              {loadingDetail && <p className="empty-state">Loading ticket details...</p>}

              {!loadingDetail && selectedTicket && (
                <>
                  <div className="detail-header">
                    <div>
                      <p className="eyebrow">{selectedTicket.ticket_id}</p>
                      <h2>{selectedTicket.subject}</h2>
                      <p>
                        {selectedTicket.customer_name} · {selectedTicket.customer_email}
                      </p>
                    </div>
                    <span className={statusClass(selectedTicket.status)}>
                      {selectedTicket.status}
                    </span>
                  </div>

                  <dl className="detail-grid">
                    <div>
                      <dt>Created</dt>
                      <dd>{formatDate(selectedTicket.created_at)}</dd>
                    </div>
                    <div>
                      <dt>Updated</dt>
                      <dd>{formatDate(selectedTicket.updated_at)}</dd>
                    </div>
                  </dl>

                  <section className="description-block">
                    <h3>Description</h3>
                    <p>{selectedTicket.description}</p>
                  </section>

                  <form className="update-panel" onSubmit={updateTicket}>
                    <div className="form-grid">
                      <label>
                        <span>Status</span>
                        <select
                          value={draftStatus}
                          onChange={(event) => setDraftStatus(event.target.value)}
                        >
                          {STATUSES.map((status) => (
                            <option key={status} value={status}>
                              {status}
                            </option>
                          ))}
                        </select>
                      </label>
                    </div>

                    <label>
                      <span>Add note</span>
                      <textarea
                        value={noteText}
                        onChange={(event) => setNoteText(event.target.value)}
                        rows="4"
                        placeholder="Document troubleshooting steps, customer context, or handoff details."
                      />
                    </label>

                    <div className="form-actions">
                      <button className="primary-button" type="submit" disabled={submitting}>
                        {submitting ? 'Saving...' : 'Update ticket'}
                      </button>
                    </div>
                  </form>

                  <section className="notes-section">
                    <h3>Notes</h3>
                    {selectedTicket.notes.length > 0 ? (
                      <div className="notes-list">
                        {selectedTicket.notes.map((note) => (
                          <article className="note" key={note.id}>
                            <p>{note.note_text}</p>
                            <time>{formatDate(note.created_at)}</time>
                          </article>
                        ))}
                      </div>
                    ) : (
                      <p className="empty-state">No internal notes yet.</p>
                    )}
                  </section>
                </>
              )}
            </div>
          )}
        </section>
      </section>
    </main>
  )
}

export default App
