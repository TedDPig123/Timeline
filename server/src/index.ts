import express from "express";
import prisma from "./db";

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
