# Support CRM System

A full-stack customer support ticketing CRM built with React, Express, and MongoDB. The app lets support teams create tickets, search and filter the queue, open detailed ticket records, update statuses, and add internal notes.

## Tech Stack

- Frontend: React + Vite
- API: Node.js + Express
- Database: MongoDB + Mongoose
- Deployment target: Vercel

## Features

- Create support tickets with customer name, email, issue title, and description
- Auto-generated ticket IDs such as `TKT-001`
- List all tickets with ID, customer, title, status, and created date
- Search by ticket ID, customer name, customer email, title, and description
- Filter by `Open`, `In Progress`, and `Closed`
- Detail view with customer info, description, timestamps, status updates, and notes
- Responsive dashboard UI for desktop and mobile

## API Endpoints

| Method | Endpoint | Description |
| --- | --- | --- |
| `POST` | `/api/tickets` | Create a ticket |
| `GET` | `/api/tickets?status=Open&search=value` | List/search/filter tickets |
| `GET` | `/api/tickets/:ticket_id` | Get one ticket with notes |
| `PUT` | `/api/tickets/:ticket_id` | Update status and optionally add a note |
| `GET` | `/api/health` | API health check |

## Local Setup

1. Install root API dependencies.

   ```bash
   npm install
   ```

2. Install frontend dependencies.

   ```bash
   npm install --prefix frontend
   ```

3. Create a `.env` file from `.env.example`.

   ```bash
   cp .env.example .env
   ```

4. Set `MONGODB_URI` to a MongoDB Atlas or local MongoDB connection string.

5. Start the API in one terminal.

   ```bash
   npm run dev:api
   ```

6. Start the frontend in another terminal.

   ```bash
   npm run dev:web
   ```

7. Open `http://localhost:5173`.

## Deployment

The repository is configured for Vercel with:

- `api/index.js` as the serverless Express entrypoint
- `frontend/dist` as the static output directory
- SPA rewrites in `vercel.json`

Before production deployment, add this environment variable in Vercel:

```bash
MONGODB_URI=mongodb+srv://...
```

Then deploy:

```bash
vercel --prod
```

## Project Structure

```text
api/                 Vercel serverless entrypoint
backend/             Express app, Mongo connection, models, routes
database/            Schema documentation
frontend/            React/Vite frontend
vercel.json          Vercel build and rewrite config
.env.example         Required environment variables
```
