import dotenv from 'dotenv'
import app from './app.js'
import { connectDB } from './db.js'

dotenv.config()

const port = process.env.PORT || 5000

try {
  await connectDB()

  app.listen(port, () => {
    console.log(`Support CRM API is running on http://localhost:${port}`)
  })
} catch (error) {
  console.error(`Unable to start API: ${error.message}`)
  process.exit(1)
}
