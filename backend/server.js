const express = require("express");
const cors = require("cors");
const { connectToMongo, getMoviesCollection } = require("./db");

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 8080;

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

app.get("/health", async (req, res) => {
  try {
    const moviesCollection = getMoviesCollection();
    await moviesCollection.database.command({ ping: 1 });

    return res.status(200).json({
      status: "ok",
      service: "backend",
      database: "connected"
    });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      service: "backend",
      database: "disconnected",
      message: error.message
    });
  }
});

app.get("/api/message", (req, res) => {
  return res.status(200).json({
    message: "Hello from backend API running on GKE!"
  });
});

app.post("/api/movies", async (req, res) => {
  try {
    const { name, hero, language } = req.body;

    if (!name || !hero || !language) {
      return res.status(400).json({
        message: "name, hero, and language are required"
      });
    }

    const moviesCollection = getMoviesCollection();
    const now = new Date();

    const movie = {
      name: name.trim(),
      hero: hero.trim(),
      language: language.trim(),
      updatedAt: now
    };

    const existing = await moviesCollection.findOne({
      name: { $regex: `^${escapeRegex(name.trim())}$`, $options: "i" },
      language: { $regex: `^${escapeRegex(language.trim())}$`, $options: "i" }
    });

    if (existing) {
      await moviesCollection.updateOne(
        { _id: existing._id },
        {
          $set: {
            hero: movie.hero,
            updatedAt: now
          }
        }
      );

      const updatedMovie = await moviesCollection.findOne({ _id: existing._id });

      return res.status(200).json({
        message: "Movie updated successfully",
        movie: updatedMovie
      });
    }

    movie.createdAt = now;

    const result = await moviesCollection.insertOne(movie);
    const insertedMovie = await moviesCollection.findOne({ _id: result.insertedId });

    return res.status(201).json({
      message: "Movie added successfully",
      movie: insertedMovie
    });
  } catch (error) {
    console.error("Error adding movie:", error);
    return res.status(500).json({
      message: "Failed to add movie",
      error: error.message
    });
  }
});

app.get("/api/movies", async (req, res) => {
  try {
    const { name } = req.query;

    if (!name || !name.trim()) {
      return res.status(400).json({
        message: "Movie name query parameter is required"
      });
    }

    const moviesCollection = getMoviesCollection();

    const movies = await moviesCollection
      .find({
        name: {
          $regex: `^${escapeRegex(name.trim())}$`,
          $options: "i"
        }
      })
      .project({
        _id: 0
      })
      .sort({
        language: 1,
        imdbRank: 1
      })
      .toArray();

    return res.status(200).json({
      count: movies.length,
      movies
    });
  } catch (error) {
    console.error("Error getting movie:", error);
    return res.status(500).json({
      message: "Failed to get movie",
      error: error.message
    });
  }
});

async function startServer() {
  try {
    await connectToMongo();

    const moviesCollection = getMoviesCollection();
    await moviesCollection.createIndex(
      { name: 1, language: 1 },
      { unique: true }
    );

    app.listen(PORT, () => {
      console.log(`Backend listening on port ${PORT}`);
    });
  } catch (error) {
    console.error("Failed to start backend:", error);
    process.exit(1);
  }
}

startServer();
