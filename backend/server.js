import "dotenv/config"; // <-- NOVO
import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import { importFromYupoo } from "./yupoo.js";

const app = express();
app.use(cors());
app.use(express.json());

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// serve frontend
const frontendDir = path.join(__dirname, "..", "frontend");
app.use(express.static(frontendDir));

// rota da IA + scrape Yupoo
app.post("/api/import-yupoo", async (req, res) => {
  try {
    const { url } = req.body;
    if (!url) {
      return res.status(400).json({ error: "URL obrigatória" });
    }

    console.log("Importando Yupoo:", url);
    const result = await importFromYupoo(url);
    return res.json(result);
  } catch (err) {
    console.error("Erro na rota /api/import-yupoo:", err);
    return res.status(500).json({ error: err.message || "Erro interno" });
  }
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log("Hathor Imports backend rodando na porta " + PORT);
  console.log("Frontend disponível em http://localhost:" + PORT + "/admin.html");
});
