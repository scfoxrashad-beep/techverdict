import express from "express";
import cors from "cors";
import "dotenv/config";

const app = express();

app.use(cors({
  origin: ["https://rad-praline-7a4db7.netlify.app", "http://localhost:5173", "http://localhost:5174"]
}));

app.use(express.json());

app.post("/api/anthropic/v1/messages", async (req, res) => {
  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify(req.body),
    });
    const data = await response.json();
    res.status(response.status).json(data);
  } catch (err) {
    res.status(500).json({ error: { message: "Proxy request failed" } });
  }
});

app.listen(3001, () => console.log("Proxy server running on http://localhost:3001"));