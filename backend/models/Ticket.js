import mongoose from 'mongoose'

const ticketSchema = new mongoose.Schema(
  {
    ticket_id: {
      type: String,
      required: true,
      unique: true,
      index: true,
      trim: true,
    },
    customer_name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 120,
    },
    customer_email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      maxlength: 180,
    },
    subject: {
      type: String,
      required: true,
      trim: true,
      maxlength: 180,
    },
    description: {
      type: String,
      required: true,
      trim: true,
      maxlength: 5000,
    },
    status: {
      type: String,
      enum: ['Open', 'In Progress', 'Closed'],
      default: 'Open',
      index: true,
    },
  },
  {
    timestamps: {
      createdAt: 'created_at',
      updatedAt: 'updated_at',
    },
  },
)

ticketSchema.index({
  ticket_id: 'text',
  customer_name: 'text',
  customer_email: 'text',
  subject: 'text',
  description: 'text',
})

export default mongoose.models.Ticket || mongoose.model('Ticket', ticketSchema)
