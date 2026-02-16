import { MongoClient, Db } from 'mongodb';

let client: MongoClient;
let db: Db;

const MAX_RETRIES = 5;
const RETRY_DELAY = 5000; // 5 seconds

async function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export async function connectToDatabase(): Promise<Db> {
  if (db) {
    return db;
  }

  const uri = process.env.MONGODB_URI;

  if (!uri) {
    throw new Error('MONGODB_URI is not set in environment variables');
  }

  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      client = new MongoClient(uri, {
        serverSelectionTimeoutMS: 10000,
        connectTimeoutMS: 10000,
      });
      await client.connect();
      db = client.db();
      console.log('✅ Connected to MongoDB');
      return db;
    } catch (error) {
      lastError = error as Error;
      console.error(`❌ Failed to connect to MongoDB (attempt ${attempt}/${MAX_RETRIES}):`, error);
      
      if (attempt < MAX_RETRIES) {
        console.log(`Retrying in ${RETRY_DELAY / 1000} seconds...`);
        await sleep(RETRY_DELAY);
      }
    }
  }

  console.error('❌ Failed to connect to MongoDB after all retry attempts');
  throw lastError || new Error('Failed to connect to MongoDB');
}

export function getDatabase(): Db {
  if (!db) {
    throw new Error('Database not connected. Call connectToDatabase() first.');
  }
  return db;
}

export async function closeDatabase(): Promise<void> {
  if (client) {
    await client.close();
    console.log('MongoDB connection closed');
  }
}

