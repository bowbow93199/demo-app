const fs = require("fs");
const path = require("path");
const { connectToMongo, getMoviesCollection, closeMongoConnection } = require("./db");

async function seedMovies() {
  try {
    await connectToMongo({ retries: 30, delayMs: 5000 });

    const moviesCollection = getMoviesCollection();

    await moviesCollection.createIndex(
      { name: 1, language: 1 },
      { unique: true }
    );

    const dataPath = path.join(__dirname, "seed-data", "movies.json");
    const rawData = fs.readFileSync(dataPath, "utf8");
    const movies = JSON.parse(rawData);

    let insertedOrUpdated = 0;

    for (const movie of movies) {
      const now = new Date();

      await moviesCollection.updateOne(
        {
          name: movie.name,
          language: movie.language
        },
        {
          $set: {
            hero: movie.hero,
            imdbRank: movie.imdbRank,
            year: movie.year,
            updatedAt: now
          },
          $setOnInsert: {
            createdAt: now
          }
        },
        { upsert: true }
      );

      insertedOrUpdated += 1;
    }

    console.log(`Seed completed successfully. Processed ${insertedOrUpdated} movie records.`);
    await closeMongoConnection();
    process.exit(0);
  } catch (error) {
    console.error("Seed failed:", error);
    await closeMongoConnection();
    process.exit(1);
  }
}

seedMovies();
