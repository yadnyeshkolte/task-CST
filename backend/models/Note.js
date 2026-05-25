import mongoose from 'mongoose'

const noteSchema = new mongoose.Schema(
  {
    ticket: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Ticket',
      required: true,
      index: true,
    },
    ticket_id: {
      type: String,
      required: true,
      index: true,
      trim: true,
    },
    note_text: {
      type: String,
      required: true,
      trim: true,
      maxlength: 3000,
    },
  },
  {
    timestamps: {
      createdAt: 'created_at',
      updatedAt: 'updated_at',
    },
  },
)

export default mongoose.models.Note || mongoose.model('Note', noteSchema)
