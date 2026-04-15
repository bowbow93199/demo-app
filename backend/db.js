const { MongoClient } = require("mongodb");

let client;
let db;

function buildMongoUri() {
  const host = process.env.MONGO_HOST || "mongodb";
  const port = process.env.MONGO_PORT || "27017";
  const database = process.env.MONGO_DB || "moviesdb";
  const username = process.env.MONGO_USER || "moviesapp";
  const password = process.env.MONGO_PASSWORD || "moviesapp123";

  return `mongodb://${encodeURIComponent(username)}:${encodeURIComponent(password)}@${host}:${port}/${database}?authSource=${database}`;
}

async function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function connectToMongo({ retries = 20, delayMs = 5000 } = {}) {
  if (db) {
    return db;
  }

  const uri = buildMongoUri();

  for (let attempt = 1; attempt <= retries; attempt += 1) {
    try {
      client = new MongoClient(uri, {
        serverSelectionTimeoutMS: 5000
      });

      await client.connect();
      db = client.db(process.env.MONGO_DB || "moviesdb");

      await db.command({ ping: 1 });
      console.log(`Connected to MongoDB on attempt ${attempt}`);
      return db;
    } catch (error) {
      console.error(`MongoDB connection attempt ${attempt} failed: ${error.message}`);

      if (attempt === retries) {
        throw error;
      }

      await sleep(delayMs);
    }
  }

  throw new Error("Failed to connect to MongoDB");
}

function getDb() {
  if (!db) {
    throw new Error("Database connection has not been initialized");
  }
  return db;
}

function getMoviesCollection() {
  return getDb().collection("movies");
}

async function closeMongoConnection() {
  if (client) {
    await client.close();
    client = null;
    db = null;
  }
}

module.exports = {
  buildMongoUri,
  connectToMongo,
  getDb,
  getMoviesCollection,
  closeMongoConnection
};
