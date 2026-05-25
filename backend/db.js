import mongoose from 'mongoose'

mongoose.set('strictQuery', true)

const cached = globalThis.__supportCrmMongoose ?? {
  connection: null,
  promise: null,
}

globalThis.__supportCrmMongoose = cached

export async function connectDB() {
  if (cached.connection) {
    return cached.connection
  }

  const uri = process.env.MONGODB_URI

  if (!uri) {
    const error = new Error('MONGODB_URI is not configured')
    error.statusCode = 503
    error.code = 'DATABASE_NOT_CONFIGURED'
    throw error
  }

  if (!cached.promise) {
    cached.promise = mongoose
      .connect(uri, {
        serverSelectionTimeoutMS: 10000,
        maxPoolSize: 10,
      })
      .then((mongooseInstance) => mongooseInstance.connection)
  }

  cached.connection = await cached.promise
  return cached.connection
}
