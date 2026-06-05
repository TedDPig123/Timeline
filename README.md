# Timeline

![Screenshot of Landing Page](https://github.com/TedDPig123/Timeline/blob/main/src/assets/readme-images/LoginScreenshot.jpeg "Screenshot of landing page")

**Timeline** is a personal multimedia memory-keeping platform that lets you document your life one memory at a time and revisit it as a single, scrollable line through time.

> 🔗 **Live site:** [Timeline](https://timeline-one-omega.vercel.app/)

https://github.com/user-attachments/assets/a9b7ceee-75d6-480a-bc9f-66d71fa3a861

---

## :ledger: Index

- [About](#beginner-about)
- [Features](#sparkles-features)
- [Tech Stack](#computer-tech-stack)
- [Architecture](#triangular_ruler-architecture)
- [Roadmap](#world_map-roadmap)
- [FAQ](#question-faq)
- [Gallery](#camera-gallery)
- [Acknowledgments](#star2-acknowledgments)
- [License](#lock-license)

---

## :beginner: About

### What is Timeline?

Life comes fast, and it also goes quick. And if you're anything like me, you have a hard time remembering all the memories it leaves behind. But what is our life if not our memories? How could we make sense of who we are without a sense of our history?

_Enter: **Timeline!**_

At its core, Timeline is a journalling site, but what sets it apart is its presentation and style. For any date in your life, you can create your own memories like a page in a scrapbook: each memory is a customizable canvas where you can add text, images, video, and audio and arrange it however you want.

And all your memories are displayed on a single timeline you can scroll through, with different temporal views - by week, by month, or by year.

### How it started, where it's going

I've moved between countries since I was young, and each time I couldn't bring much with me except my memories. I wanted a single place to keep them, something to hold onto from my travels, if not the things themselves, so I came up with the idea of laying them all out on one timeline, a digital scrapbook.

It then came to life as a four-person team project for my college web development class, where we built a prototype with mock data. Since then I've taken it over as the sole developer and turned it into a full-stack, deployed product: real authentication, real database, real media storage, real users. Every part of the pipeline (frontend, backend, deployment, schema, infrastructure) has been touched by my hands at this point.

Below is what currently exists, and what's in the works.

---

## :sparkles: Features

- **Interactive timeline view.** Scroll horizontally through your memories with smooth animations. Thumbnails scale according to their distance from the viewport center, drawing your eye to whatever you're focused on.
- **Three temporal views.** Zoom in to a single week, out to a month, or all the way out to a year. Clicking a month in year view drills you into that month in month view.
- **Free-form memory canvases.** Each date is a blank canvas. Drag, drop, resize, and arrange text cards, images, audio clips, and videos exactly where you want them.
- **Multimedia upload.** Upload directly from your device. Images, audio, and video are stored securely on AWS S3 and served via presigned URLs.
- **Google OAuth login.** Simply log in and sign up with your google account.
- **Themes.** Light mode, dark mode, and a few in between.
- **Responsive design.** Works on tablets and laptops only (for now).
- **Save / cancel editing flow.** Make changes, undo them if you don't like them, save when you do.

---

## :computer: Tech Stack

### Frontend

- **React 18 + TypeScript** — component model and type safety.
- **Vite** — fast dev server and bundler.
- **Tailwind CSS** — utility-first styling.
- **GSAP** — fluid animations for the timeline.
- **React Router** — client-side routing.

### Backend

- **Node.js + Express** — REST API.
- **Prisma ORM** — type-safe database access and migrations.
- **Passport.js** — Google OAuth 2.0 strategy.
- **JWT** — stateless session tokens.

### Infrastructure

- **Vercel** — frontend hosting and serverless functions.
- **Neon** — serverless Postgres database.
- **AWS S3** — object storage for user-uploaded media, served via presigned URLs for security.
- **Git + GitHub** — version control.

---

## :triangular_ruler: Architecture

```
┌──────────────────┐        ┌──────────────────┐        ┌──────────────────┐
│   React Client   │  ───>  │  Express Server  │  ───>  │   Neon Postgres  │
│   (Vercel)       │  <───  │  (REST + Auth)   │  <───  │   (via Prisma)   │
└──────────────────┘        └──────────────────┘        └──────────────────┘
         │                          │
         │ presigned URLs           │
         ▼                          ▼
┌──────────────────┐        ┌──────────────────┐
│     AWS S3       │        │   Google OAuth   │
│  (media files)   │        │  (identity)      │
└──────────────────┘        └──────────────────┘
```

**Auth flow.** User signs in via Google OAuth → backend issues a JWT → client stores the token and includes it on every API request.

**Media flow.** When the user uploads a file, the client requests a presigned upload URL from the backend, uploads directly to S3, then sends only the S3 key back to the server for storage. Reads work the same way in reverse: the backend issues a presigned GET URL, the client fetches the asset directly from S3. The Express server never touches the binary payload.

**Data model.** Users own Memories (one per date); Memories own MemoryCards (the individual draggable elements). Card layout (position, size, z-index) is stored so layouts scale across viewport sizes.

### :file_folder: File Structure

```
.
├── public/                          # Static assets served as-is
├── server/                          # Express backend
│   ├── prisma/
│   │   ├── schema.prisma            # DB schema
│   │   └── migrations/              # Migration history
│   ├── src/
│   │   ├── auth/                    # Passport strategy, JWT helpers
│   │   ├── routes/                  # REST endpoints
│   │   ├── s3.ts                    # Presigned URL helpers
│   │   └── index.ts                 # Entry point
│   └── package.json
├── src/                             # React frontend
│   ├── assets/                      # Images, SVGs, fonts
│   ├── components/
│   │   ├── memory/                  # MemoryCard, MemoryPage, PreviewModal
│   │   ├── timeline/                # Timeline, Thumbnail, DateToggler
│   │   └── ui/                      # NavBar, Settings
│   ├── context/                     # React contexts (theme, auth, etc.)
│   ├── pages/                       # Top-level route pages
│   ├── services/                    # API client
│   ├── types/                       # Shared TypeScript types
│   ├── utils/                       # Helper functions
│   ├── App.tsx
│   └── main.tsx
├── documentation/                   # Reference docs (e.g. encryption plan)
├── index.html
├── package.json
├── tailwind.config.js
└── README.md
```

| Path                          | What's in it                                                       |
| ----------------------------- | ------------------------------------------------------------------ |
| `src/components/timeline/`    | The horizontal scrolling timeline, thumbnails, view toggler.       |
| `src/components/memory/`      | The memory canvas — card rendering, drag/resize, save/cancel flow. |
| `src/context/`                | Global state: auth, theme, view mode, current date, memory cards.  |
| `server/src/routes/`          | All API endpoints (auth, memories, cards, uploads).                |
| `server/prisma/schema.prisma` | Source of truth for the database structure.                        |

---

## :lock: Security & encryption

Timeline uses **client-side end-to-end encryption** for memory content. Your
passphrase derives a key (PBKDF2, 600k iterations) that unwraps a per-user data
key (AES-256-GCM); that key encrypts each card's text and files **in your
browser** before anything is sent. The server and storage only ever hold
ciphertext, salts, wrapped keys, and IVs.

**What the server can read:** dates, card types, layout (positions/sizes), file
sizes, and timestamps — the *structure* of your timeline, never the *content*.
Dates and layout stay readable so the timeline can render and order without
unlocking.

**What it cannot read:** your passphrase, recovery code, keys, or any text,
image, audio, or video content.

**What this does _not_ protect against (be aware):**

- **A compromised device or browser.** While you're logged in and unlocked, the
  data key is in memory and your content is readable on your machine. This is
  inherent to client-side encryption.
- **A malicious frontend build.** Web E2EE can't prove the served JavaScript is
  honest the way a signed native app can.
- **Metadata.** As above, the server still sees dates, counts, sizes, and
  sharing relationships.

**There is no password reset.** If you forget your passphrase, your one-time
recovery code is the only way back in. Lose both and the content is
unrecoverable — that's the cost of the server never being able to read it.

## :world_map: Roadmap

Things in progress or planned:

- [ ] **Mobile responsive timeline.** Currently only optimized for desktop/tablet.
- [ ] **Search.** Find memories by keyword across text cards.
- [x] **Client-side end-to-end encryption.** Memories encrypted before they leave the browser, so the server never sees plaintext. (See [Security & encryption](#lock-security--encryption).)
- [ ] **Shared timelines.** Invite friends or family to contribute to a collective memory line ( trip journals, family albums, etc.)
- [ ] **Memory templates.** Quick-start layouts for common memory types.
- [ ] **More theme customization.** Want to add more themes as well as the option to choose your own color palette.
- [ ] **Thumbnail Customization.** Add ways to customize the way the thumbnails look on the timeline, including the color of the thumbnails as well as the ability to choose which text and/or image is displayed.

---

## :hammer: Fixes in Progress

- [ ] **Image Resizing that Maintains Aspect Ratio.** Currently they can be any shape, but I want the resizing to respect the original aspect ratio.
- [ ] **Cropping.** I wanna add cropping for images.

---

## :question: FAQ

**Q: Why not use Notion / Google Photos / Day One?**
A: Those tools either treat memories as a content library or as a strictly linear journal. Timeline is built around the metaphor of a _line through time_...

**Q: Is my data private?**
A: Yes — Timeline now uses **client-side end-to-end encryption**. Your memory content is encrypted in your browser before it's sent, so the server (and I, the operator) only ever see ciphertext. See [Security & encryption](#lock-security--encryption) for what is and isn't protected, including the no-password-reset tradeoff.

**Q: Does it work offline?**
A: Not yet. Offline-first support is something I'll consider in the future. Perhaps I'll make an ElectronJS app to facilitate it.

---

## :camera: Gallery

### Landing page

![Landing](https://github.com/TedDPig123/Timeline/blob/main/src/assets/readme-images/LoginScreenshot.jpeg)

### Timeline — month view

![MonthView](https://github.com/TedDPig123/Timeline/blob/main/src/assets/readme-images/MonthView.png)

### Memory canvas (edit mode)

![MemoryCanvas](https://github.com/TedDPig123/Timeline/blob/main/src/assets/readme-images/EditScreenshot.jpg)

### Drilling down from year to month

https://github.com/user-attachments/assets/f4601723-7d63-49d6-a802-2032438e3ca9

### Theme switcher

https://github.com/user-attachments/assets/da19f26b-530f-4348-b0ec-e5bc8afe1855

---

## :star2: Acknowledgments

- The original four-person team at the college web dev course who shaped the first prototype with me. The core concept and a few of the rougher early decisions are theirs as much as mine.
- [Prisma](https://www.prisma.io/) for making the database layer manageable
- [Neon](https://neon.tech/) for free serverless Postgres
- Every illustrator on [Notioly](https://notioly.com/) whose work fills in the landing page.

---

## :lock: License

This project is licensed under the [MIT License](LICENSE).
