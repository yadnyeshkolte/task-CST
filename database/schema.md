# Database Schema

The application uses MongoDB with two collections: `tickets` and `notes`.

## tickets

| Field | Type | Notes |
| --- | --- | --- |
| `_id` | ObjectId | MongoDB primary key |
| `ticket_id` | String | Unique public ID, e.g. `TKT-001` |
| `customer_name` | String | Required |
| `customer_email` | String | Required, normalized to lowercase |
| `subject` | String | Required |
| `description` | String | Required |
| `status` | String | `Open`, `In Progress`, or `Closed` |
| `created_at` | Date | Auto-generated |
| `updated_at` | Date | Auto-updated |

## notes

| Field | Type | Notes |
| --- | --- | --- |
| `_id` | ObjectId | MongoDB primary key |
| `ticket` | ObjectId | Reference to the ticket document |
| `ticket_id` | String | Public ticket ID for simple lookup/debugging |
| `note_text` | String | Required |
| `created_at` | Date | Auto-generated |
| `updated_at` | Date | Auto-updated |
