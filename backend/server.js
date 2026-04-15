cat > backend/server.js <<'EOF'
const express = require("express");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 8080;

app.get("/health", (req, res) => {
  res.status(200).json({ status: "ok", service: "backend" });
});

app.get("/api/message", (req, res) => {
  res.status(200).json({
    message: "Hello from backend API running on GKE!"
  });
});

app.listen(PORT, () => {
  console.log(`Backend listening on port ${PORT}`);
});
EOF