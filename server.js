import express from "express";
import ViteExpress from "vite-express";
import { GoogleGenerativeAI } from "@google/generative-ai";

const app = express();
app.use(express.json());

const geminiApiKey = process.env["GEMINI_API_KEY"];
const genAI = new GoogleGenerativeAI(geminiApiKey);

app.get("/message", (_, res) => res.send("Hello from express!"));

app.post("/api/predictImage", async (req, res) => {
  const { prompt, imageData } = req.body;

  const model = genAI.getGenerativeModel({ model: "gemini-pro-vision" });

  const result = await model.generateContent([
    prompt,
    { inlineData: { data: imageData, mimeType: "image/png" } },
  ]);
  const response = result.response;
  const text = response.text();
  res.json({ text });
});

ViteExpress.listen(app, 8080, () => console.log("Server is listening..."));
