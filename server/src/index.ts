import dotenv from "dotenv";
import path from "path";
dotenv.config({ path: path.resolve(__dirname, "../../.env") });

import { ContentType } from "./generated/prisma/enums";
import express from "express";
import multer from "multer";
import prisma from "./db";
import { getPresignedUrl, uploadFile } from "./s3";

const app = express();
const port = 3001;
const upload = multer({ storage: multer.memoryStorage() });

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

  if (!memory_with_cards) {
    //if it doesn't exist
    return res.json(null);
  }

  // making presigned URLs for media cards
  const cardsWithUrls = await Promise.all(
    memory_with_cards.memory_cards.map(async (card) => {
      if (card.type === "TEXT") {
        return card; // text content dhouldn't be modified
      }
      // IMAGE, VIDEO, AUDIO - generate presigned URL
      const url = await getPresignedUrl(card.content);
      return { ...card, content: url };
    }),
  );

  res.json({
    ...memory_with_cards,
    memory_cards: cardsWithUrls,
  });
});

// ------------------------------ ALL MEMORY CARD ROUTES -----------------------------
//TODO: POST create a memory card given a lot of things
app.post("/api/cards", upload.single("file"), async (req, res) => {
  const request = req.body;

  let content = request.content;

  if (req.file) {
    content = await uploadFile(req.file);
  }

  const memory_card = await prisma.memoryCard.create({
    data: {
      type: request.type as ContentType,
      content: content,
      date: new Date(request.date),
      position_x: parseInt(request.position_x),
      position_y: parseInt(request.position_y),
      z_index: parseInt(request.z_index),
      width: parseInt(request.width),
      height: parseInt(request.height),

      user_id: request.user_id,
      memory_id: request.memory_id,
    },
  });
  res.json(memory_card);
});

//TODO: update memory card position
app.patch("/api/cards/position/:id", async (req, res) => {
  const request = req.body;
  const card_id = req.params.id;
  const memory_card = await prisma.memoryCard.update({
    where: { id: card_id as string },
    data: {
      position_x: request.position_x,
      position_y: request.position_y,
      z_index: request.z_index,
    },
  });
  res.json(memory_card);
});

//TODO: update memory card size
app.patch("/api/cards/size/:id", async (req, res) => {
  const request = req.body;
  const card_id = req.params.id;
  const memory_card = await prisma.memoryCard.update({
    where: { id: card_id as string },
    data: {
      width: request.width,
      height: request.height,
    },
  });
  res.json(memory_card);
});

//TODO: test for multer
app.post("/api/upload", upload.single("file"), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "No file provided" });
  }

  const key = await uploadFile(req.file);
  const url = await getPresignedUrl(key);

  res.json({
    key: key, // this is saved in the db
    url: url, // presigned url to use for 1 hour
  });
});

// app.post("/api/upload", upload.single("file"), (req, res) => {
//   console.log(req.file);
//   res.json({
//     message: "File received",
//     file: req.file,
//   });
// });

app.listen(port, () => {
  console.log(`app listening on port ${port}`);
});
