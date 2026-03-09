import dotenv from "dotenv";
import path from "path";

import express from "express";
import prisma from "./db";

dotenv.config({ path: path.resolve(__dirname, "../../.env") });

const app = express();
const port = 3001;

app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

app.get("/api/users", async (req, res) => {
  const users = await prisma.user.findMany();
  res.send(users);
});

app.listen(port, () => {
  console.log(`app listening on port ${port}`);
});
