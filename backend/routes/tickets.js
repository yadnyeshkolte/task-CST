import express from 'express'
import Ticket from '../models/Ticket.js'
import Note from '../models/Note.js'

const router = express.Router()
const VALID_STATUSES = ['Open', 'In Progress', 'Closed']
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function cleanString(value) {
  return typeof value === 'string' ? value.trim() : ''
}

function toTicketSummary(ticket) {
  return {
    ticket_id: ticket.ticket_id,
    customer_name: ticket.customer_name,
    customer_email: ticket.customer_email,
    subject: ticket.subject,
    status: ticket.status,
    created_at: ticket.created_at,
    updated_at: ticket.updated_at,
  }
}

function toTicketDetail(ticket, notes) {
  return {
    ...toTicketSummary(ticket),
    description: ticket.description,
    notes: notes.map((note) => ({
      id: note._id.toString(),
      note_text: note.note_text,
      created_at: note.created_at,
    })),
  }
}

function validateTicketInput(body) {
  const customer_name = cleanString(body.customer_name)
  const customer_email = cleanString(body.customer_email).toLowerCase()
  const subject = cleanString(body.subject)
  const description = cleanString(body.description)

  if (!customer_name || !customer_email || !subject || !description) {
    return {
      error: 'Customer name, customer email, subject, and description are required.',
    }
  }

  if (!EMAIL_PATTERN.test(customer_email)) {
    return { error: 'A valid customer email is required.' }
  }

  return {
    value: {
      customer_name,
      customer_email,
      subject,
      description,
    },
  }
}

async function createTicketWithSequentialId(payload) {
  const totalTickets = await Ticket.countDocuments()

  for (let attempt = 1; attempt <= 10; attempt += 1) {
    const sequence = totalTickets + attempt
    const ticket_id = `TKT-${String(sequence).padStart(3, '0')}`

    try {
      return await Ticket.create({
        ...payload,
        ticket_id,
      })
    } catch (error) {
      if (error.code !== 11000 || attempt === 10) {
        throw error
      }
    }
  }

  throw new Error('Unable to generate a unique ticket ID.')
}

router.post('/', async (req, res, next) => {
  try {
    const { value, error } = validateTicketInput(req.body ?? {})

    if (error) {
      return res.status(400).json({ error })
    }

    const ticket = await createTicketWithSequentialId(value)

    return res.status(201).json({
      ticket_id: ticket.ticket_id,
      created_at: ticket.created_at,
    })
  } catch (error) {
    return next(error)
  }
})

router.get('/', async (req, res, next) => {
  try {
    const status = cleanString(req.query.status)
    const search = cleanString(req.query.search)
    const query = {}

    if (status) {
      if (!VALID_STATUSES.includes(status)) {
        return res.status(400).json({ error: 'Invalid status filter.' })
      }

      query.status = status
    }

    if (search) {
      const pattern = new RegExp(escapeRegex(search), 'i')
      query.$or = [
        { ticket_id: pattern },
        { customer_name: pattern },
        { customer_email: pattern },
        { subject: pattern },
        { description: pattern },
      ]
    }

    const tickets = await Ticket.find(query).sort({ created_at: -1 }).limit(200)

    return res.json(tickets.map(toTicketSummary))
  } catch (error) {
    return next(error)
  }
})

router.get('/:ticket_id', async (req, res, next) => {
  try {
    const ticketId = cleanString(req.params.ticket_id)
    const ticket = await Ticket.findOne({ ticket_id: ticketId })

    if (!ticket) {
      return res.status(404).json({ error: 'Ticket not found.' })
    }

    const notes = await Note.find({ ticket: ticket._id }).sort({ created_at: -1 })

    return res.json(toTicketDetail(ticket, notes))
  } catch (error) {
    return next(error)
  }
})

router.put('/:ticket_id', async (req, res, next) => {
  try {
    const ticketId = cleanString(req.params.ticket_id)
    const nextStatus = cleanString(req.body?.status)
    const noteText = cleanString(req.body?.notes)

    if (nextStatus && !VALID_STATUSES.includes(nextStatus)) {
      return res.status(400).json({ error: 'Invalid ticket status.' })
    }

    const ticket = await Ticket.findOne({ ticket_id: ticketId })

    if (!ticket) {
      return res.status(404).json({ error: 'Ticket not found.' })
    }

    if (nextStatus) {
      ticket.status = nextStatus
    }

    if (noteText) {
      await Note.create({
        ticket: ticket._id,
        ticket_id: ticket.ticket_id,
        note_text: noteText,
      })
    }

    ticket.updated_at = new Date()
    await ticket.save()

    return res.json({
      success: true,
      updated_at: ticket.updated_at,
    })
  } catch (error) {
    return next(error)
  }
})

export default router
