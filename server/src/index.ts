import dotenv from "dotenv";
import path from "path";
dotenv.config({ path: path.resolve(__dirname, "../../.env") });

import express from "express";
import prisma from "./db";

const app = express();
const port = 3001;

//note: just to allow the app to parse json
app.use(express.json());

app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

// ------------------------------ ALL USER ROUTES -----------------------------
//get all users
app.get("/api/users", async (req, res) => {
  const users = await prisma.user.findMany();
  res.send(users);
});

//create a user
app.post("/api/users", async (req, res) => {
  const request = req.body;
  const user = await prisma.user.create({
    data: {
      username: request.username,
      email: request.email,
    },
  });
  res.json(user);
});

// ------------------------------ ALL MEMORY ROUTES -----------------------------

// ------------------------------ ALL MEMORY CARD ROUTES -----------------------------

app.listen(port, () => {
  console.log(`app listening on port ${port}`);
});
