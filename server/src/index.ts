import dotenv from "dotenv";
import path from "path";
dotenv.config({ path: path.resolve(__dirname, "../../.env") });
dotenv.config({
  path: path.resolve(__dirname, "../.env.local"),
  override: true,
});

console.log("GOOGLE_CALLBACK_URL:", process.env.GOOGLE_CALLBACK_URL);
console.log("FRONTEND_URL:", process.env.FRONTEND_URL);

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

//just to allow... requests to be made to different origins
app.use(
  cors({
    origin: [
      "http://localhost:5173",
      process.env.FRONTEND_URL || "https://timeline-one-omega.vercel.app",
    ],
    credentials: true,
  }),
);

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
    const user_id = req.userId!;
    const date = new Date(request.date);

    // Use upsert to either create or return existing
    const memory = await prisma.memory.upsert({
      where: {
        user_id_date: {
          user_id: user_id,
          date: date,
        },
      },
      update: {}, // Don't update anything if it exists
      create: {
        user_id: user_id,
        date: date,
      },
      include: {
        memory_cards: true,
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

    // Generate presigned URLs for all image cards
    for (const memory of memories) {
      for (const card of memory.memory_cards) {
        if (
          card.type === "IMAGE" ||
          card.type === "VIDEO" ||
          card.type === "AUDIO"
        ) {
          card.content = await getPresignedUrl(card.content);
        }
      }
    }

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

      // style arrives as an object (JSON body) or a string (multipart form)
      const style =
        typeof request.style === "string"
          ? JSON.parse(request.style)
          : request.style;

      const memory_card = await prisma.memoryCard.create({
        data: {
          type: request.type as ContentType,
          content: content,
          // client-side encryption IV for TEXT content; null for media/legacy
          content_iv: request.content_iv ?? null,
          date: new Date(request.date),
          style: style,

          user_id: req.userId!,
          memory_id: request.memory_id,
        },
      });

      if (
        memory_card.type === "IMAGE" ||
        memory_card.type === "VIDEO" ||
        memory_card.type === "AUDIO"
      ) {
        memory_card.content = await getPresignedUrl(memory_card.content);
      }

      res.json(memory_card);
    } catch (error) {
      console.error("Error creating a memory card:", error);
      res.status(500).json({ error: "Failed to create a memory card" });
    }
  },
);

// update a card's render style (position, size, zIndex, and any future fields)
app.patch(
  "/api/cards/style/:id",
  authenticateToken,
  async (req: AuthRequest, res) => {
    try {
      const request = req.body;
      const card_id = req.params.id;
      const memory_card = await prisma.memoryCard.update({
        where: { id: card_id as string },
        data: {
          style: request.style,
        },
      });
      res.json(memory_card);
    } catch (error) {
      console.error("Error updating memory card style:", error);
      res.status(500).json({ error: "Failed to update memory card style" });
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

// ------------------------------ CRYPTO ROUTES -----------------------------
// Per-user client-side-encryption wrapping bundle. The server stores these
// opaque values but can never read the user's data with them.

const CRYPTO_BUNDLE_FIELDS = [
  "passphrase_salt",
  "recovery_salt",
  "wrapped_dek_passphrase",
  "wrapped_dek_passphrase_iv",
  "wrapped_dek_recovery",
  "wrapped_dek_recovery_iv",
] as const;

// Returns the wrapping bundle for the logged-in user, or null if they haven't
// set up encryption yet. The client uses null to decide signup vs unlock.
app.get(
  "/api/crypto/bundle",
  authenticateToken,
  async (req: AuthRequest, res) => {
    try {
      const user = await prisma.user.findUnique({
        where: { id: req.userId! },
        select: {
          crypto_version: true,
          passphrase_salt: true,
          recovery_salt: true,
          wrapped_dek_passphrase: true,
          wrapped_dek_passphrase_iv: true,
          wrapped_dek_recovery: true,
          wrapped_dek_recovery_iv: true,
        },
      });

      if (!user || user.crypto_version == null) {
        return res.json(null);
      }

      res.json(user);
    } catch (error) {
      console.error("Error fetching crypto bundle:", error);
      res.status(500).json({ error: "Failed to fetch crypto bundle" });
    }
  },
);

// Stores the wrapping bundle for the logged-in user (used by the signup flow).
app.post(
  "/api/crypto/bundle",
  authenticateToken,
  async (req: AuthRequest, res) => {
    try {
      const request = req.body;

      const missing = CRYPTO_BUNDLE_FIELDS.filter((f) => !request[f]);
      if (missing.length > 0) {
        return res
          .status(400)
          .json({ error: `Missing fields: ${missing.join(", ")}` });
      }

      const user = await prisma.user.update({
        where: { id: req.userId! },
        data: {
          crypto_version: 1,
          passphrase_salt: request.passphrase_salt,
          recovery_salt: request.recovery_salt,
          wrapped_dek_passphrase: request.wrapped_dek_passphrase,
          wrapped_dek_passphrase_iv: request.wrapped_dek_passphrase_iv,
          wrapped_dek_recovery: request.wrapped_dek_recovery,
          wrapped_dek_recovery_iv: request.wrapped_dek_recovery_iv,
        },
        select: { crypto_version: true },
      });

      res.json(user);
    } catch (error) {
      console.error("Error saving crypto bundle:", error);
      res.status(500).json({ error: "Failed to save crypto bundle" });
    }
  },
);

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
    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
    res.redirect(`${frontendUrl}/auth-callback?token=${token}`);
  },
);

app.listen(port, () => {
  console.log(`app listening on port ${port}`);
});
