import dotenv from "dotenv";
import path from "path";
dotenv.config({ path: path.resolve(__dirname, "../../.env") });

import { ContentType } from "./generated/prisma/enums";

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

// ------------------------------ ALL MEMORY ROUTES ----------------------------------
//TODO: POST create memory given user and date
app.post("/api/memories", async (req, res) => {
  const request = req.body;
  const memory = await prisma.memory.create({
    data: {
      user_id: request.user_id,
      date: new Date(request.date),
    },
  });
  res.json(memory);
});

//TODO: GET retrieve a memory and its memory cards given user and date
app.get("/api/memories/:date", async (req, res) => {
  const date = req.params.date;
  const user_id = req.query.user_id as string;
  const memory_with_cards = await prisma.memory.findFirst({
    where: {
      AND: [{ user_id: user_id }, { date: new Date(date) }],
    },
    include: {
      memory_cards: true,
    },
  });
  res.json(memory_with_cards);
});

// ------------------------------ ALL MEMORY CARD ROUTES -----------------------------
//TODO: POST create a memory card given a lot of things
app.post("/api/cards", async (req, res) => {
  const request = req.body;
  const memory_card = await prisma.memoryCard.create({
    data: {
      type: request.type as ContentType,
      content: request.content,
      date: new Date(request.date),
      position_x: request.position_x,
      position_y: request.position_y,
      z_index: request.z_index,
      width: request.width,
      height: request.height,

      user_id: request.user_id,
      memory_id: request.memory_id,
    },
  });

  res.json(memory_card);
});

app.listen(port, () => {
  console.log(`app listening on port ${port}`);
});
