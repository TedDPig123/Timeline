import dotenv from "dotenv";
import path from "path";
dotenv.config({ path: path.resolve(__dirname, "../../.env") });
import cors from "cors";

import { ContentType } from "./generated/prisma/enums";
import express from "express";
import multer from "multer";
import prisma from "./db";
import { getPresignedUrl, uploadFile } from "./s3";

const app = express();
const port = 3001;
const upload = multer({ storage: multer.memoryStorage() });

import { User } from "./generated/prisma/client";

import jwt from "jsonwebtoken";
import passport from "./auth/auth";

import { authenticateToken, AuthRequest } from "./middleware";

//note: just to allow the app to parse json
app.use(express.json());

app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

// ------------------------------ ALL USER ROUTES -----------------------------
//get all users
app.get("/api/users", async (req, res) => {
  try {
    const users = await prisma.user.findMany();
    res.send(users);
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({ error: "Failed to fetch users" });
  }
});

//create a user
app.post("/api/users", async (req, res) => {
  try {
    const request = req.body;
    const user = await prisma.user.create({
      data: {
        username: request.username,
        email: request.email,
      },
    });
    res.json(user);
  } catch (error) {
    console.error("Error creating user:", error);
    res.status(500).json({ error: "Failed to create new user" });
  }
});

// ------------------------------ ALL MEMORY ROUTES ----------------------------------
//TODO: POST create memory given user and date
app.post("/api/memories", authenticateToken, async (req: AuthRequest, res) => {
  try {
    const request = req.body;
    const memory = await prisma.memory.create({
      data: {
        user_id: req.userId!,
        date: new Date(request.date),
      },
    });
    res.json(memory);
  } catch (error) {
    console.error("Error creating memory:", error);
    res.status(500).json({ error: "Failed to create memory" });
  }
});

// GET all memories for the logged-in user (for timeline overview)
app.get("/api/memories", authenticateToken, async (req: AuthRequest, res) => {
  try {
    const user_id = req.userId!;
    const memories = await prisma.memory.findMany({
      where: { user_id },
      include: { memory_cards: true },
      orderBy: { date: "desc" },
    });
    res.json(memories);
  } catch (error) {
    console.error("Error fetching all memories:", error);
    res.status(500).json({ error: "Failed to fetch memories" });
  }
});

//TODO: GET retrieve a memory and its memory cards given user and date
app.get(
  "/api/memories/:date",
  authenticateToken,
  async (req: AuthRequest, res) => {
    try {
      const date = req.params.date as string;
      const user_id = req.userId!;

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
    } catch (error) {
      console.error("Error fetching memory with cards and URLS:", error);
      res.status(500).json({ error: "Failed to fetch memory" });
    }
  },
);

// deleting memory
app.delete(
  "/api/memories/:id",
  authenticateToken,
  async (req: AuthRequest, res) => {
    try {
      const memory_id = req.params.id as string;
      await prisma.memory.delete({
        where: { id: memory_id },
      });
      res.json({ message: "Memory deleted" });
    } catch (error) {
      console.error("Error deleting memory:", error);
      res.status(500).json({ error: "Failed to delete memory" });
    }
  },
);

// ------------------------------ ALL MEMORY CARD ROUTES -----------------------------
//TODO: POST create a memory card given a lot of things
app.post(
  "/api/cards",
  authenticateToken,
  upload.single("file"),
  async (req: AuthRequest, res) => {
    try {
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

          user_id: req.userId!,
          memory_id: request.memory_id,
        },
      });
      res.json(memory_card);
    } catch (error) {
      console.error("Error creating a memory card:", error);
      res.status(500).json({ error: "Failed to create a memory card" });
    }
  },
);

//TODO: update memory card position
app.patch(
  "/api/cards/position/:id",
  authenticateToken,
  async (req: AuthRequest, res) => {
    try {
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
    } catch (error) {
      console.error("Error updating memory card position:", error);
      res.status(500).json({ error: "Failed to update memory card position" });
    }
  },
);

//TODO: update memory card size
app.patch(
  "/api/cards/size/:id",
  authenticateToken,
  async (req: AuthRequest, res) => {
    try {
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
    } catch (error) {
      console.error("Error updating memory card position:", error);
      res.status(500).json({ error: "Failed to update memory card position" });
    }
  },
);

//deleting memory card
app.delete("/api/cards/:id", authenticateToken, async (req, res) => {
  try {
    const card_id = req.params.id as string;
    await prisma.memoryCard.delete({
      where: { id: card_id },
    });
    res.json({ message: "Card deleted" });
  } catch (error) {
    console.error("Error deleting memory card:", error);
    res.status(500).json({ error: "Failed to delete memory card" });
  }
});

//TODO: test for multer
app.post("/api/upload", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file provided" });
    }

    const key = await uploadFile(req.file);
    const url = await getPresignedUrl(key);

    res.json({
      key: key, // this is saved in the db
      url: url, // presigned url to use for 1 hour
    });
  } catch (error) {
    console.error("Error uploading file to Amazon:", error);
    res.status(500).json({ error: "Failed to upload file" });
  }
});

// ------------------------------ AUTH ROUTES -----------------------------

// start Google OAuth
app.get(
  "/api/auth/google",
  passport.authenticate("google", { scope: ["profile", "email"] }),
);

// callback
app.get(
  "/api/auth/google/callback",
  passport.authenticate("google", { session: false, failureRedirect: "/" }),
  (req, res) => {
    // make JWT token
    const user = req.user as User;
    const token = jwt.sign(
      { userId: user.id, email: user.email },
      process.env.JWT_SECRET!,
      { expiresIn: "7d" },
    );

    // redirect to frontend with token
    res.redirect(`http://localhost:5173/auth-callback?token=${token}`);
  },
);

app.listen(port, () => {
  console.log(`app listening on port ${port}`);
});
