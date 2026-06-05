"""
Generates Timeline-Architecture.pdf - a full architecture & maintenance
reference for the Timeline codebase. Pure ASCII content (reportlab base fonts
do not include box-drawing / smart-quote glyphs). Run:  python build_arch_pdf.py
"""

from reportlab.lib.pagesizes import LETTER
from reportlab.lib.units import inch
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_LEFT, TA_CENTER, TA_JUSTIFY
from reportlab.platypus import (
    BaseDocTemplate, PageTemplate, Frame, Paragraph, Spacer, PageBreak,
    Table, TableStyle, Preformatted, ListFlowable, ListItem,
)
from reportlab.platypus.tableofcontents import TableOfContents

OUT = "Timeline-Architecture.pdf"

# ---------------------------------------------------------------- styles
ss = getSampleStyleSheet()
INK = colors.HexColor("#1a1a17")
ACCENT = colors.HexColor("#3c3489")
GREY = colors.HexColor("#5a5853")
CODEBG = colors.HexColor("#f3f2ee")
RULE = colors.HexColor("#d6d3c7")
HEADBG = colors.HexColor("#2c2c2a")

styles = {
    "title": ParagraphStyle("title", parent=ss["Title"], fontName="Helvetica-Bold",
                            fontSize=30, leading=34, textColor=INK, spaceAfter=6),
    "subtitle": ParagraphStyle("subtitle", parent=ss["Normal"], fontSize=13,
                               leading=18, textColor=GREY, spaceAfter=2),
    "h1": ParagraphStyle("H1", parent=ss["Heading1"], fontName="Helvetica-Bold",
                         fontSize=17, leading=21, textColor=ACCENT,
                         spaceBefore=18, spaceAfter=8),
    "h2": ParagraphStyle("H2", parent=ss["Heading2"], fontName="Helvetica-Bold",
                         fontSize=12.5, leading=16, textColor=INK,
                         spaceBefore=12, spaceAfter=5),
    "h3": ParagraphStyle("H3", parent=ss["Heading3"], fontName="Helvetica-Bold",
                         fontSize=10.5, leading=14, textColor=GREY,
                         spaceBefore=8, spaceAfter=3),
    "body": ParagraphStyle("body", parent=ss["Normal"], fontSize=9.6, leading=14,
                           textColor=INK, alignment=TA_JUSTIFY, spaceAfter=6),
    "bullet": ParagraphStyle("bullet", parent=ss["Normal"], fontSize=9.6,
                             leading=13.5, textColor=INK, spaceAfter=2),
    "code": ParagraphStyle("code", parent=ss["Code"], fontName="Courier",
                           fontSize=7.8, leading=10, textColor=INK,
                           backColor=CODEBG, borderColor=RULE, borderWidth=0.5,
                           borderPadding=6, spaceBefore=4, spaceAfter=8),
    "cell": ParagraphStyle("cell", parent=ss["Normal"], fontSize=8, leading=10.5,
                           textColor=INK),
    "cellh": ParagraphStyle("cellh", parent=ss["Normal"], fontSize=8,
                            leading=10.5, textColor=colors.white,
                            fontName="Helvetica-Bold"),
    "cap": ParagraphStyle("cap", parent=ss["Normal"], fontSize=8, leading=11,
                          textColor=GREY, spaceAfter=10, alignment=TA_CENTER),
}

S = []  # story


def h1(t): S.append(Paragraph(t, styles["h1"]))
def h2(t): S.append(Paragraph(t, styles["h2"]))
def h3(t): S.append(Paragraph(t, styles["h3"]))
def p(t): S.append(Paragraph(t, styles["body"]))
def code(t): S.append(Preformatted(t, styles["code"]))
def cap(t): S.append(Paragraph(t, styles["cap"]))
def sp(h=6): S.append(Spacer(1, h))


def bullets(items):
    fl = [ListItem(Paragraph(x, styles["bullet"]), value="-") for x in items]
    S.append(ListFlowable(fl, bulletType="bullet", start="-", leftIndent=14,
                          bulletColor=ACCENT))
    sp(4)


def table(rows, widths):
    data = []
    for ri, row in enumerate(rows):
        st = styles["cellh"] if ri == 0 else styles["cell"]
        data.append([Paragraph(str(c), st) for c in row])
    t = Table(data, colWidths=widths, repeatRows=1)
    t.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), HEADBG),
        ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, colors.HexColor("#f7f5ee")]),
        ("GRID", (0, 0), (-1, -1), 0.4, RULE),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("LEFTPADDING", (0, 0), (-1, -1), 5),
        ("RIGHTPADDING", (0, 0), (-1, -1), 5),
        ("TOPPADDING", (0, 0), (-1, -1), 3),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 3),
    ]))
    S.append(t)
    sp(8)


# ================================================================ TITLE
S.append(Spacer(1, 1.4 * inch))
S.append(Paragraph("Timeline", styles["title"]))
S.append(Paragraph("System Architecture &amp; Maintenance Reference", styles["subtitle"]))
S.append(Spacer(1, 0.3 * inch))
S.append(Paragraph(
    "A personal multimedia memory-keeping platform: every day is a free-form "
    "canvas of text / image / audio / video cards, laid out on a single "
    "horizontally-scrollable timeline, with client-side end-to-end encryption "
    "of all memory content.", styles["body"]))
sp(10)
table([
    ["Aspect", "Summary"],
    ["Frontend", "React 18 + TypeScript + Vite, hosted on Vercel"],
    ["Backend", "Node.js + Express 5 + Prisma, hosted on Railway"],
    ["Database", "Neon serverless PostgreSQL"],
    ["Object storage", "AWS S3 (encrypted media), served via presigned URLs"],
    ["Identity", "Google OAuth 2.0 (Passport) + stateless JWT"],
    ["Encryption", "Client-side E2EE (AES-256-GCM / PBKDF2), crypto version 1"],
    ["Live frontend", "timeline-one-omega.vercel.app"],
    ["Live API", "timeline-production-600c.up.railway.app"],
], [1.4 * inch, 5.0 * inch])
cap("Document generated from the codebase. Regenerate with documentation/build_arch_pdf.py")
S.append(PageBreak())

# ================================================================ TOC
S.append(Paragraph("Contents", styles["h1"]))
toc = TableOfContents()
toc.levelStyles = [
    ParagraphStyle("TOC1", fontName="Helvetica-Bold", fontSize=10.5, leading=18,
                   textColor=INK),
    ParagraphStyle("TOC2", fontName="Helvetica", fontSize=9, leading=13.5,
                   leftIndent=18, textColor=GREY),
]
S.append(toc)
S.append(PageBreak())

# ================================================================ 1
h1("1. Introduction &amp; Purpose")
p("Timeline is a journaling application whose differentiator is presentation: "
  "instead of a linear feed, each calendar date is a blank canvas onto which the "
  "user drags resizable cards (text, images, audio, video). All dates render on a "
  "single horizontal timeline that can be zoomed to a week, a month, or a year. It "
  "began as a four-person university project (mock data) and was rebuilt by a "
  "single developer into a deployed full-stack product with real authentication, a "
  "real database, real media storage, and client-side end-to-end encryption.")
p("This document is a standalone reference for maintaining the codebase without "
  "external assistance. It covers the data model, every backend endpoint, the "
  "frontend component and state architecture, the encryption subsystem, the "
  "runtime data flows, deployment, and dedicated scalability and maintainability "
  "analyses, plus a maintenance playbook for common changes.")

h2("1.1 Mental model in one paragraph")
p("The browser holds a per-session data-encryption key (DEK) that never leaves it. "
  "All card content is encrypted with that key before being sent to the Express "
  "API, which persists ciphertext to Postgres (text) or S3 (files) and is "
  "structurally unable to read it. The timeline UI reads the structural metadata "
  "(dates, layout, card types) in the clear to render, then decrypts content "
  "on demand in the browser. Identity is handled separately by Google OAuth and a "
  "JWT; the JWT proves who you are, the passphrase-derived key proves you can read "
  "your memories.")

# ================================================================ 2
h1("2. Technology Stack")
table([
    ["Layer", "Technology", "Role"],
    ["UI", "React 18, TypeScript", "Component model + type safety"],
    ["Build", "Vite 6", "Dev server, bundler (output to dist/)"],
    ["Styling", "Tailwind CSS 3, clsx, tailwind-merge", "Utility-first styling, theming"],
    ["Animation", "GSAP, framer-motion", "Timeline scroll / thumbnail scaling"],
    ["Routing", "react-router-dom 7", "Client-side routes"],
    ["API server", "Express 5, Node.js", "REST API"],
    ["ORM", "Prisma 6 (prisma-client-js)", "Type-safe DB access + migrations"],
    ["DB", "PostgreSQL (Neon)", "Relational store"],
    ["Auth", "Passport + passport-google-oauth20, jsonwebtoken", "OAuth + JWT"],
    ["Uploads", "multer (memory storage)", "Multipart parsing on the server"],
    ["Storage", "AWS SDK v3 (@aws-sdk/client-s3)", "S3 put/get/delete + presign"],
    ["Crypto", "Web Crypto API (window.crypto.subtle)", "E2EE, no third-party crypto libs"],
    ["Tests", "Vitest (node project) + Storybook (optional)", "Unit tests for crypto service"],
])
p("Deliberate non-choices: there are no third-party cryptography libraries (Web "
  "Crypto only), no global client state manager (React Context is used throughout), "
  "and no GraphQL (plain REST + fetch).")

# ================================================================ 3
h1("3. High-Level Architecture")
code(
"   +-------------------+        +----------------------+        +--------------------+\n"
"   |  React SPA (Vite) |  HTTPS |  Express API (Node)  | Prisma |  Neon PostgreSQL   |\n"
"   |  host: Vercel     | -----> |  host: Railway       | -----> |  (serverless PG)   |\n"
"   |                   | <----- |   REST + JSON        | <----- |                    |\n"
"   +---------+---------+        +-----------+----------+        +--------------------+\n"
"             |                              |\n"
"             | presigned GET (fetch        | PutObject / GetObject(presign) / Delete\n"
"             |  ciphertext, then decrypt)  |\n"
"             v                              v\n"
"   +-------------------+        +----------------------+\n"
"   |      AWS S3       |        |   Google OAuth 2.0   |\n"
"   |  encrypted media  |        |   identity provider  |\n"
"   +-------------------+        +----------------------+")
cap("Figure 1. Runtime topology. The API never holds plaintext content or keys.")
p("Three independently deployed tiers communicate over HTTPS. The React SPA talks "
  "to the Express API exclusively through the functions in src/services/api.ts. The "
  "API talks to Postgres through a single Prisma client (server/src/db.ts) and to "
  "S3 through helper functions (server/src/s3.ts). Two external services are called "
  "directly: Google OAuth (server-side, during login) and AWS S3 (the browser "
  "fetches ciphertext directly from S3 via presigned URLs; uploads are proxied "
  "through the API).")

h2("3.1 Trust boundaries")
bullets([
    "<b>Browser (trusted with plaintext):</b> the only place the DEK and decrypted "
    "content ever exist. Lost on tab close.",
    "<b>API + DB + S3 (untrusted with content):</b> store and serve ciphertext, "
    "salts, wrapped keys, IVs, and structural metadata only.",
    "<b>Google OAuth (identity only):</b> establishes who the user is; never sees "
    "memory content or encryption keys.",
])

# ================================================================ 4
h1("4. Repository &amp; Project Layout")
p("The repository is a monorepo containing <b>two independent npm projects</b>, each "
  "with its own package.json and node_modules. They are built and run separately; "
  "run <font face='Courier'>npm install</font> in both.")
code(
"Timeline/                      # ROOT = frontend npm project (Vite/React)\n"
"  package.json                 # frontend deps + scripts (dev/build/lint)\n"
"  vite.config.ts               # '@' alias -> ./src ; react + svgr plugins\n"
"  vitest.workspace.ts          # 'unit' (node) + optional 'storybook' projects\n"
"  index.html  tailwind.config.ts  tsconfig*.json  vercel.json\n"
"  src/\n"
"    main.tsx                   # React entry (StrictMode -> <App/>)\n"
"    App.tsx                    # context providers + <Router> + routes\n"
"    pages/                     # Landing, Login, AuthCallback, TimelineMainPage,\n"
"                               #   EditMemoryPage, CryptoSetup\n"
"    components/\n"
"      timeline/                # Timeline, Thumbnail, TimelineBar, ...\n"
"      memory/                  # MemoryPage, MemoryCard, MemoryModule,\n"
"                               #   MediaContent, AddCardModal, PreviewModal\n"
"      ui/                      # NavBar, Settings, DateToggler\n"
"      crypto/                  # RequireUnlock, UnlockModal\n"
"    context/                   # AuthContext.tsx, context.ts, theme.tsx\n"
"    services/                  # api.ts, crypto.ts, migrate.ts (+ crypto.test.ts)\n"
"    hooks/                     # useDecryptedMedia.ts\n"
"    types/index.ts             # shared TS types\n"
"    utils/                     # date-range filtering helpers\n"
"  server/                      # BACKEND npm project (Express/Prisma)\n"
"    package.json               # backend deps + scripts (dev/build/start)\n"
"    prisma.config.ts           # loads ../.env ; schema + migrations paths\n"
"    prisma/schema.prisma       # data model + generator + datasource\n"
"    prisma/migrations/         # ordered SQL migrations\n"
"    aws/s3-cors.json           # required S3 CORS rule (GET from app origins)\n"
"    src/\n"
"      index.ts                 # Express app: all routes\n"
"      db.ts                    # PrismaClient singleton (imports @prisma/client)\n"
"      s3.ts                    # uploadFile / getPresignedUrl / deleteFile\n"
"      middleware.ts            # authenticateToken (JWT verify)\n"
"      auth/auth.ts             # Passport Google strategy")
cap("Figure 2. Source tree (generated client and node_modules omitted).")

# ================================================================ 5
h1("5. Data Model")
p("Three tables and one enum, defined in server/prisma/schema.prisma. UUID primary "
  "keys throughout. The design principle is 'encrypt content, leave structure "
  "alone': dates, card types, and layout remain server-readable so the timeline can "
  "render and order without the key; only card content is opaque.")
code(
"  User 1 ------< Memory 1 ------< MemoryCard\n"
"    \\___________________________< MemoryCard   (denormalized user_id on cards)\n"
"\n"
"  - User  : one per Google account (unique email)\n"
"  - Memory: exactly one per (user_id, date)  [@@unique]\n"
"  - MemoryCard: many per Memory; also carries user_id for ownership checks")
cap("Figure 3. Entity relationships.")

h2("5.1 User")
table([
    ["Column", "Type", "Notes"],
    ["id", "String (uuid) PK", "Primary key"],
    ["email", "String unique", "From Google profile; identity"],
    ["username", "String", "Display name (Google displayName)"],
    ["createdAt", "DateTime", "Defaults to now()"],
    ["crypto_version", "Int?", "null until E2EE set up; 1 once configured"],
    ["passphrase_salt", "String?", "base64; 16 bytes; PBKDF2 salt for passphrase KEK"],
    ["recovery_salt", "String?", "base64; 16 bytes; PBKDF2 salt for recovery KEK"],
    ["wrapped_dek_passphrase", "String?", "base64; DEK wrapped by passphrase KEK"],
    ["wrapped_dek_passphrase_iv", "String?", "base64; IV for that wrap"],
    ["wrapped_dek_recovery", "String?", "base64; same DEK wrapped by recovery KEK"],
    ["wrapped_dek_recovery_iv", "String?", "base64; IV for that wrap"],
], [2.0 * inch, 1.3 * inch, 3.1 * inch])
p("The seven crypto columns are the per-user 'wrapping bundle'. They are opaque to "
  "the server and only ever returned to their owner via GET /api/crypto/bundle.")

h2("5.2 Memory")
table([
    ["Column", "Type", "Notes"],
    ["id", "String (uuid) PK", "Primary key"],
    ["user_id", "String FK -> User.id", "Owner"],
    ["created_at", "DateTime", "Defaults to now()"],
    ["date", "DateTime @db.Date", "Date only (no time); the timeline anchor"],
    ["", "@@unique([user_id, date])", "One memory per user per calendar day"],
], [2.0 * inch, 1.7 * inch, 2.7 * inch])

h2("5.3 MemoryCard")
table([
    ["Column", "Type", "Notes"],
    ["id", "String (uuid) PK", "Primary key"],
    ["type", "ContentType enum", "TEXT | IMAGE | VIDEO | AUDIO"],
    ["content", "String", "Ciphertext (TEXT) or S3 object key (media)"],
    ["content_iv", "String?", "base64 IV; null = legacy plaintext (migration marker)"],
    ["date", "DateTime", "Card's date (matches its Memory)"],
    ["style", "Json", "{ position:{x,y}, size:{w,h}, zIndex } + future fields"],
    ["user_id", "String FK", "onDelete: Cascade"],
    ["memory_id", "String FK", "onDelete: Cascade"],
], [1.5 * inch, 1.4 * inch, 3.5 * inch])
p("The <b>style</b> column was deliberately moved from five flat columns "
  "(position_x/y, width, height, z_index) into a single JSON blob so new render "
  "features (font, font size, colour) can be added without a schema migration. The "
  "<b>content_iv</b> column doubles as the per-card 'is encrypted' flag: a non-null "
  "IV means content is ciphertext; null means legacy plaintext awaiting migration.")

h2("5.4 Migration history")
p("Migrations live in server/prisma/migrations and are applied in timestamp order. "
  "Apply with <font face='Courier'>npx prisma migrate deploy</font> from server/.")
table([
    ["Migration", "Purpose"],
    ["..._init", "Initial User / Memory / MemoryCard schema"],
    ["..._move_content_to_card", "Content/type moved onto MemoryCard"],
    ["..._memory_created_at_default", "created_at default now()"],
    ["..._add_cascade_delete", "Cascade deletes for memory/cards"],
    ["..._exclude_time_from_date", "Memory.date -> DATE (drop time)"],
    ["..._move_card_render_to_style_json", "5 layout columns -> style Json (backfilled)"],
    ["..._add_user_crypto_bundle", "7 nullable crypto columns on User"],
    ["..._add_card_content_iv", "content_iv column on MemoryCard"],
], [3.0 * inch, 3.4 * inch])

# ================================================================ 6
h1("6. Backend (Express API)")
p("The entire API is defined in a single file, server/src/index.ts. It loads env "
  "vars (dotenv), enables JSON parsing and CORS (allowing the localhost and Vercel "
  "origins), then registers routes. A Prisma client singleton (db.ts) is shared by "
  "all handlers. Protected routes use the authenticateToken middleware, which "
  "verifies the Bearer JWT and sets req.userId.")

h2("6.1 Request lifecycle")
bullets([
    "CORS + express.json() run on every request; multipart routes additionally use "
    "multer (in-memory) to parse file uploads.",
    "authenticateToken reads 'Authorization: Bearer &lt;jwt&gt;', verifies it with "
    "JWT_SECRET, and attaches req.userId; missing/invalid tokens get 401/403.",
    "Mutating handlers scope queries to req.userId (ownership checks) and return "
    "404 when a row is not owned by the caller.",
    "For media reads, handlers replace the stored S3 key with a 1-hour presigned "
    "GET URL before responding; TEXT content is returned as-is (ciphertext).",
])

h2("6.2 Endpoint reference")
table([
    ["Method &amp; path", "Auth", "Purpose"],
    ["GET /api/health", "no", "Liveness probe"],
    ["GET /api/auth/google", "no", "Begin Google OAuth"],
    ["GET /api/auth/google/callback", "no", "OAuth callback; signs 7-day JWT; "
     "redirects to FRONTEND_URL/auth-callback?token=..."],
    ["GET /api/crypto/bundle", "yes", "Owner's wrapping bundle, or null if E2EE "
     "not set up (drives signup-vs-unlock)"],
    ["POST /api/crypto/bundle", "yes", "Store wrapping bundle; sets crypto_version=1"],
    ["POST /api/memories", "yes", "Upsert memory for (user, date); returns it + cards"],
    ["GET /api/memories", "yes", "All memories + cards (timeline); presigns media"],
    ["GET /api/memories/:date", "yes", "One day's memory + cards; presigns media"],
    ["DELETE /api/memories/:id", "yes", "Delete memory (ownership-scoped)"],
    ["POST /api/cards", "yes", "Create card (multipart if file); verifies memory "
     "ownership; stores content_iv; presigns media in response"],
    ["PATCH /api/cards/style/:id", "yes", "Update style JSON (ownership-scoped)"],
    ["PATCH /api/cards/content/:id", "yes", "Replace content+iv with encrypted "
     "version (migration); media uploads new key, deletes old"],
    ["DELETE /api/cards/:id", "yes", "Delete card (ownership-scoped)"],
    ["POST /api/upload", "no(*)", "Standalone S3 upload test helper"],
], [2.3 * inch, 0.5 * inch, 3.6 * inch])
p("(*) POST /api/upload is an unauthenticated test/utility endpoint; it is not part "
  "of the normal card-creation path and is a candidate for removal or locking down.")

h2("6.3 Authentication")
p("Login is Google OAuth via Passport (server/src/auth/auth.ts). On the OAuth "
  "callback the strategy finds-or-creates a User by email, then index.ts signs a "
  "JWT containing { userId, email } with a 7-day expiry and redirects the browser "
  "to FRONTEND_URL/auth-callback?token=&lt;jwt&gt;. The SPA stores the token in "
  "localStorage and sends it as a Bearer header on every API call. Sessions are "
  "stateless (session:false); there is no server-side session store.")

h2("6.4 Media storage (S3)")
p("server/src/s3.ts wraps AWS SDK v3 with three functions: uploadFile (PutObject "
  "with a generated key), getPresignedUrl (1-hour GET URL), and deleteFile "
  "(DeleteObject, used by the migration to remove old plaintext objects). Uploads "
  "are proxied: the browser sends bytes (ciphertext) to the API via multer; the API "
  "puts them to S3 and stores only the key. Reads are direct: the API hands back a "
  "presigned URL and the browser fetches from S3 itself, so binary payloads never "
  "stream back through Express.")

# ================================================================ 7
h1("7. Frontend (React SPA)")
p("Entry is src/main.tsx, which renders &lt;App/&gt; in StrictMode. App.tsx nests "
  "all context providers, then a react-router &lt;Router&gt; with the routes below. "
  "Two routes (the timeline and the editor) are wrapped in &lt;RequireUnlock&gt;, "
  "the encryption gate.")

h2("7.1 Routes")
table([
    ["Path", "Page", "Gated?"],
    ["/", "Landing", "no"],
    ["/login", "Login (Continue with Google)", "no"],
    ["/auth-callback", "AuthCallback (stores JWT, redirects)", "no"],
    ["/timeline", "TimelineMainPage (NavBar + Timeline + DateToggler)", "RequireUnlock"],
    ["/edit/:date", "EditMemoryPage (MemoryPage canvas)", "RequireUnlock"],
], [1.4 * inch, 3.6 * inch, 1.4 * inch])

h2("7.2 State: React Context")
p("There is no Redux/Zustand. Global state is a stack of context providers created "
  "in App.tsx and consumed via typed hooks. AuthContext is a separate provider that "
  "also owns the encryption session.")
table([
    ["Context (hook)", "Holds"],
    ["AuthContext (useAuth)", "user, token, isLoading, dek, isUnlocked + login, "
     "logout, setupEncryption, completeSetup, unlock, recoverWithCode, "
     "changePassphrase, lock"],
    ["ThemeContext (useThemeContext)", "current theme object (light/dark/coffee/...)"],
    ["MemModalContext (useMemModalContext)", "in-memory array of MemoryCards for the "
     "open editor + position updater"],
    ["EditingContext (useEditingContext)", "isEditMode boolean"],
    ["ViewModeContext (useViewMode)", "'week' | 'month' | 'year'"],
    ["CurrentDateContext (useCurrentDate)", "date currently centered in the timeline"],
    ["BaseDateContext (useBaseDate)", "anchor date the view is generated around"],
    ["SettingsContext (useSettingsContext)", "user settings (e.g. scroll mode)"],
], [2.2 * inch, 4.2 * inch])
p("The DEK lives only in AuthContext state - never in localStorage - so it is lost "
  "on tab close and re-derived at the next unlock.")

h2("7.3 The API client (services/api.ts)")
p("Every server call goes through this module. API_URL switches on "
  "import.meta.env.PROD (localhost:3001 in dev, the Railway URL in prod). authHeaders "
  "attaches the Bearer token. Crucially, the read functions getAllMemories(dek) and "
  "getMemory(date, dek) decrypt TEXT cards in place via the internal decryptCard "
  "helper, and createCardWithFile(data, dek) encrypts content before upload. The DEK "
  "is threaded in from useAuth at each call site, so encryption is centralized at "
  "the network boundary.")

h2("7.4 Component catalog")
h3("timeline/")
bullets([
    "<b>Timeline.tsx</b> - the signature view. Renders two horizontally scroll-synced "
    "rows; on every scroll/drag/wheel it rescales each thumbnail by a Gaussian of "
    "its distance from viewport center. generateAllSlots builds week/month/year "
    "slots from the fetched cards; clicking a year slot drills into month view.",
    "<b>Thumbnail.tsx</b> - a single timeline cell; decrypts its image via "
    "useDecryptedMedia and clamps text lines to fit.",
    "<b>TimelineBar.tsx / ThumbnailSpacer.tsx</b> - the center rule and spacing.",
    "<b>DateToggler.tsx</b> (in ui/) - prev/next stepper that shifts baseDate by "
    "week/month/year.",
])
h3("memory/")
bullets([
    "<b>MemoryPage.tsx</b> - the day canvas with an explicit edit / save / cancel "
    "flow. Entering edit snapshots the cards; changes happen in memory; Save diffs "
    "against the snapshot and persists only what changed (style via "
    "updateCardStyle, deletes via deleteCard); Cancel restores the snapshot.",
    "<b>MemoryCard.tsx (MemModal)</b> - a draggable/resizable card; converts between "
    "logical canvas coordinates (700-unit space) and pixels.",
    "<b>MemoryModule.tsx</b> - renders a card by type; TEXT inline, media via "
    "MediaContent.",
    "<b>MediaContent.tsx</b> + <b>useDecryptedMedia</b> - fetch ciphertext from the "
    "presigned URL, decrypt to a Blob object URL (revoked on unmount); legacy "
    "plaintext media uses the URL directly.",
    "<b>AddCardModal.tsx</b> - pick type (TEXT/IMAGE/VIDEO/AUDIO) and enter text or "
    "choose a file.",
    "<b>PreviewModal.tsx / PreviewCard.tsx</b> - read-only day preview opened from a "
    "timeline thumbnail.",
])
h3("ui/ and crypto/")
bullets([
    "<b>NavBar.tsx</b> - week/month/year switch, Settings, Sign out.",
    "<b>Settings.tsx</b> - theme picker + change-passphrase form.",
    "<b>RequireUnlock.tsx</b> - the gate: fetches the bundle, shows CryptoSetup when "
    "none exists, UnlockModal when locked, and the page once the DEK is in memory.",
    "<b>UnlockModal.tsx</b> - passphrase prompt with a 'forgot passphrase' recovery "
    "mode.",
])

# ================================================================ 8
h1("8. End-to-End Encryption")
p("All memory content is encrypted in the browser before it is sent. The server, "
  "database, and S3 only ever hold ciphertext, salts, wrapped keys, and IVs. The "
  "full design lives in documentation/encryption-guide.html; this section "
  "summarizes the implementation.")

h2("8.1 Threat model")
bullets([
    "<b>Defends against:</b> anyone with access to the servers, database, or storage "
    "- operators, cloud staff, breaches, or legal compulsion - who obtain only "
    "ciphertext.",
    "<b>Does NOT defend against:</b> a compromised device/browser while unlocked; a "
    "malicious frontend build (web E2EE cannot prove served JS is honest); and "
    "metadata (dates, counts, file sizes, sharing) which remain visible.",
])

h2("8.2 Key hierarchy")
code(
"  passphrase + salt1 --PBKDF2(600k, SHA-256)--> KEK_passphrase --+\n"
"                                                                 +-- (un)wraps --> DEK\n"
"  recovery   + salt2 --PBKDF2(600k, SHA-256)--> KEK_recovery   --+        |\n"
"                                                                          | AES-256-GCM\n"
"                                                                          v\n"
"                                                                   card content\n"
"\n"
"  Primitives: AES-256-GCM (authenticated); PBKDF2 600k/SHA-256; salt 16B;\n"
"              IV 12B (fresh per encryption); DEK 256-bit. Web Crypto only.\n"
"  The DEK is wrapped twice (passphrase + recovery code) so either unlocks it.")
cap("Figure 4. Key derivation and wrapping.")

h2("8.3 What the server can and cannot read")
table([
    ["Readable (structure)", "Opaque (ciphertext / keys)"],
    ["User id, email, createdAt, crypto_version", "passphrase/recovery salts"],
    ["Memory id, user_id, date", "wrapped DEKs + their IVs"],
    ["Card id, type, style (position/size/z)", "card content (TEXT ciphertext)"],
    ["S3 object keys, file sizes, timestamps", "S3 object bodies (encrypted bytes)"],
    ["-", "Never sent: passphrase, recovery code, KEK, DEK, plaintext"],
], [3.2 * inch, 3.2 * inch])

h2("8.4 Crypto service (services/crypto.ts)")
p("Pure functions over Web Crypto, unit-tested in services/crypto.test.ts: "
  "generateSalt, generateRecoveryCode (RFC-4648 base32, normalized for forgiving "
  "entry), deriveKEK, generateDEK, wrapDEK/unwrapDEK (use Web Crypto wrapKey so raw "
  "key bytes never enter a JS variable), encryptText/decryptText, and "
  "encryptFile/decryptFile (which frame the MIME type inside the ciphertext so the "
  "server never learns it and a typed Blob can be rebuilt). The unwrapped session "
  "DEK is non-extractable except on the change-passphrase / recovery paths that must "
  "re-wrap it.")

h2("8.5 Flows")
h3("Signup (first-time setup)")
bullets([
    "After OAuth, RequireUnlock sees a null bundle and shows CryptoSetup.",
    "Browser generates a DEK, two salts, and a recovery code; derives both KEKs; "
    "wraps the DEK twice; POSTs the bundle (server sets crypto_version=1).",
    "Recovery code is shown once and must be acknowledged; only then is the DEK "
    "committed to the session (held in a pending ref until then).",
])
h3("Login + unlock")
bullets([
    "OAuth establishes identity; RequireUnlock fetches the bundle and shows "
    "UnlockModal.",
    "Passphrase -> KEK -> unwrap DEK. A wrong passphrase fails AES-GCM "
    "authentication and throws - the crypto operation IS the password check.",
    "On success the DEK is held in memory and the timeline loads.",
])
h3("Recovery, change passphrase, and legacy migration")
bullets([
    "<b>Recovery:</b> recovery code -> KEK_recovery -> unwrap DEK -> re-wrap under a "
    "new passphrase. The recovery code itself is unchanged.",
    "<b>Change passphrase:</b> verify old passphrase by unwrapping, then re-wrap the "
    "same DEK under the new one (recovery wrapper untouched).",
    "<b>Migrate-at-first-unlock (services/migrate.ts):</b> after unlock, any card "
    "with content_iv == null is re-encrypted in the background - TEXT in place, "
    "media by fetching the plaintext, re-encrypting, uploading to a new key, and "
    "deleting the old object. Idempotent and resumable: a card is only marked "
    "encrypted once its ciphertext is stored.",
])

h2("8.6 Operational requirement: S3 CORS")
p("Because encrypted media is fetched with fetch() (not an &lt;img&gt; tag, which is "
  "CORS-exempt), the S3 bucket MUST allow GET from the app origins. The rule is "
  "checked in to server/aws/s3-cors.json; apply it with: "
  "<font face='Courier'>aws s3api put-bucket-cors --bucket $AWS_BUCKET_NAME "
  "--cors-configuration file://server/aws/s3-cors.json</font>. Without it, encrypted "
  "media will neither display nor migrate (TEXT is unaffected).")

# ================================================================ 9
h1("9. Key Runtime Flows")
h2("9.1 First login of an existing (set-up) user")
code(
"  Browser            Express API           Google        Postgres / S3\n"
"  -------            -----------           ------        -------------\n"
"  click 'Continue'  GET /auth/google ----> consent\n"
"                    callback <------------- profile\n"
"                    find/create user --------------------> User\n"
"                    sign JWT (7d)\n"
"  store token <---- redirect /auth-callback?token=...\n"
"  GET /crypto/bundle ----------------------------------> User (bundle)\n"
"  show UnlockModal\n"
"  enter passphrase  (derive KEK, unwrap DEK in-browser)\n"
"  GET /memories ---------------------------------------> memories + cards\n"
"  decrypt TEXT in browser; fetch+decrypt media from S3\n"
"  render timeline")
cap("Figure 5. Login + unlock + first render.")

h2("9.2 Adding a card in the editor")
bullets([
    "User opens /edit/:date; EditMemoryPage upserts the Memory (POST /memories) and "
    "loads its cards (GET /memories/:date, decrypted with the DEK).",
    "User clicks Add Card, picks a type and enters text / selects a file.",
    "createCardWithFile encrypts TEXT (or file bytes) with the DEK, then POSTs "
    "multipart to /api/cards; the server stores ciphertext + content_iv and returns "
    "the card (with a presigned URL for media).",
    "The new card is placed on the canvas; dragging/resizing updates in-memory "
    "state; Save persists style changes via PATCH /api/cards/style/:id.",
])

# ================================================================ 10
h1("10. Deployment &amp; Infrastructure")
table([
    ["Component", "Host", "Build / run"],
    ["Frontend", "Vercel", "npm run build (tsc &amp;&amp; vite build) -> static dist/"],
    ["Backend", "Railway", "postinstall: prisma generate; build: tsc; start: node "
     "dist/index.js"],
    ["Database", "Neon", "PostgreSQL; migrations via prisma migrate deploy"],
    ["Media", "AWS S3", "Bucket with CORS GET rule (server/aws/s3-cors.json)"],
], [1.2 * inch, 0.9 * inch, 4.3 * inch])

h2("10.1 Prisma client generation (important gotcha)")
p("The generator is <b>prisma-client-js</b> with "
  "binaryTargets = [\"native\", \"debian-openssl-3.0.x\"], which generates into "
  "node_modules/@prisma/client. Server code imports from \"@prisma/client\" (not a "
  "custom output path). This matters because Railway runs on debian: postinstall "
  "regenerates the client with the debian query engine into node_modules, where the "
  "runtime resolves it. A previous configuration used the newer prisma-client "
  "generator with a committed custom output (src/generated/prisma); that shipped a "
  "Windows-only engine that tsc never copied into dist/, breaking the deploy. Do not "
  "reintroduce a custom output path unless you also adopt a driver adapter that "
  "needs no binary engine.")

h2("10.2 Environment variables (server/.env)")
table([
    ["Variable", "Used for"],
    ["DATABASE_URL", "Neon Postgres connection (Prisma)"],
    ["JWT_SECRET", "Signing/verifying session JWTs"],
    ["GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET", "Google OAuth app credentials"],
    ["GOOGLE_CALLBACK_URL", "OAuth redirect URI (must match Google console)"],
    ["FRONTEND_URL", "Where the callback redirects + CORS allow-list"],
    ["AWS_REGION / AWS_BUCKET_NAME", "S3 location"],
    ["AWS_ACCESS_KEY_ID / AWS_SECRET_ACCESS_KEY", "S3 credentials"],
], [3.2 * inch, 3.2 * inch])
p("The frontend has no secrets; its only environment dependency is "
  "import.meta.env.PROD, which selects the API base URL.")

# ================================================================ 11
h1("11. Local Development")
code(
"# one-time: install both projects\n"
"npm install                 # in repo root (frontend)\n"
"cd server && npm install    # backend (postinstall runs prisma generate)\n"
"\n"
"# create server/.env with the variables in section 10.2, then:\n"
"cd server && npx prisma migrate deploy   # apply migrations to your DB\n"
"\n"
"# run (two terminals)\n"
"cd server && npm run dev    # nodemon + ts-node, http://localhost:3001\n"
"npm run dev                 # Vite, http://localhost:5173\n"
"\n"
"# quality gates\n"
"npx tsc --noEmit -p tsconfig.json        # frontend type-check\n"
"cd server && npx tsc --noEmit            # backend type-check\n"
"npm run lint                             # eslint (max-warnings 0)\n"
"npx vitest run --project unit            # crypto unit tests")
p("Windows note: if 'prisma generate' fails with EPERM on the query-engine file, a "
  "running dev server is holding it - stop the backend and retry. The generated "
  "TypeScript types still update even when the engine rename fails.")

# ================================================================ 12
h1("12. Scalability Report")
p("Timeline is architected as a small, single-user-centric product. The following "
  "assesses how each tier behaves as users and data grow, and where the first "
  "bottlenecks appear.")

h2("12.1 What scales well")
bullets([
    "<b>Stateless API + JWT:</b> no server session store, so the Express tier scales "
    "horizontally behind a load balancer with no shared state.",
    "<b>Per-user data isolation:</b> all queries are scoped by user_id; there is no "
    "cross-user contention, which suits sharding/partitioning by user later.",
    "<b>Media offloaded to S3:</b> binary payloads are served directly from S3 via "
    "presigned URLs, so large files do not consume API bandwidth on read.",
    "<b>Neon serverless Postgres:</b> autoscaling compute and connection pooling "
    "absorb spiky, low-volume traffic typical of a personal app.",
    "<b>E2EE pushes work to the client:</b> encryption/decryption cost scales with "
    "users' own devices, not the server.",
])

h2("12.2 Bottlenecks and limits (in likely order)")
bullets([
    "<b>Timeline loads ALL memories at once:</b> GET /api/memories returns every "
    "card for the user and presigns every media URL in a sequential await loop. For "
    "a heavy multi-year user this is O(cards) work per load and a large payload. "
    "Fix path: paginate by visible date range, presign lazily, and batch.",
    "<b>Uploads proxy through the API:</b> multer buffers whole files in memory, so "
    "concurrent large uploads pressure the single API process's RAM. Fix path: "
    "presigned PUT for direct browser-to-S3 upload (encrypt client-side first).",
    "<b>Prisma connection limits on serverless:</b> each API instance opens a pool; "
    "many instances can exhaust Postgres connections. Fix path: Neon pooler / "
    "PgBouncer, or a driver adapter.",
    "<b>Client-side full decrypt on the timeline:</b> every visible media thumbnail "
    "is fetched and decrypted into a Blob; many thumbnails mean many parallel "
    "fetch+decrypt operations and object URLs. Fix path: virtualize the timeline "
    "(render only on-screen slots) and cache decrypted blobs in IndexedDB.",
    "<b>No caching layer:</b> every navigation refetches. A client query cache "
    "(e.g. TanStack Query) or HTTP caching would cut load.",
])

h2("12.3 Recommended scaling roadmap")
bullets([
    "Short term: add range-based pagination to the timeline; virtualize rendering.",
    "Medium term: switch uploads to presigned PUT; add a client data cache; add DB "
    "indexes on (user_id, date).",
    "Long term: connection pooling/driver adapter; IndexedDB media cache; consider a "
    "CDN in front of S3 for cached (still-encrypted) assets.",
])

# ================================================================ 13
h1("13. Maintainability Report")
h2("13.1 Strengths")
bullets([
    "<b>Clear layering:</b> all server I/O is funneled through api.ts; all DB access "
    "through one Prisma client; all crypto through one tested module. Changing a "
    "boundary touches one place.",
    "<b>Type safety end to end:</b> shared types in src/types, Prisma-generated DB "
    "types, strict tsconfig (noUnusedLocals/Parameters). Both projects type-check "
    "clean and that is the de-facto CI gate.",
    "<b>Encryption is centralized and unit-tested:</b> the most error-prone code "
    "(crypto.ts) is pure and covered by round-trip + failure tests.",
    "<b>Extensible by design:</b> the style JSON blob and the content_iv 'flag' let "
    "card features and the encryption rollout evolve without schema churn.",
    "<b>Ownership checks are consistent:</b> mutating endpoints scope by req.userId.",
])

h2("13.2 Risks &amp; technical debt")
bullets([
    "<b>Monolithic files:</b> the entire API is one ~470-line index.ts and Timeline "
    "is one large component. Splitting routes into modules and extracting timeline "
    "scroll logic into hooks would ease change.",
    "<b>Storybook test project is non-functional</b> (no .storybook config); only "
    "the crypto unit tests run. There is no test coverage for components, the API, "
    "or end-to-end flows.",
    "<b>The committed Prisma client history was a recurring deploy hazard</b> "
    "(custom output path + platform engine). Keep the prisma-client-js + "
    "node_modules setup; do not commit a generated client.",
    "<b>A few latent issues:</b> AuthContext.login() hardcodes localhost:3001 (dead "
    "code; loginWithGoogle is used instead); POST /api/upload is unauthenticated; "
    "and there is no content-edit endpoint (cards are immutable after creation, so "
    "editing text means delete + re-add).",
    "<b>No automated CI:</b> type-check, lint, and tests are run manually. A GitHub "
    "Action gating PRs would prevent regressions like the deploy breakages.",
    "<b>Single .env across concerns:</b> rotating any secret is manual; there is no "
    "secret manager.",
])

h2("13.3 Recommendations")
bullets([
    "Add a CI workflow: frontend tsc, backend tsc, lint, vitest on every PR.",
    "Split server/src/index.ts into routers (auth, memories, cards, crypto).",
    "Add component/integration tests (restore .storybook or adopt Playwright).",
    "Document the env vars in server/.env.example (names only).",
    "Address the latent issues above (remove dead login(), lock down /api/upload).",
])

# ================================================================ 14
h1("14. Known Issues, Gotchas &amp; Maintenance Playbook")
h2("14.1 Gotchas to remember")
bullets([
    "Two npm projects: run install/scripts in BOTH root and server/.",
    "After any schema change, run prisma generate (server) AND a migration; the "
    "running dev server can EPERM-lock the engine on Windows - stop it first.",
    "Encrypted media needs the S3 CORS rule; without it media silently fails.",
    "Deploys are per-tier: Vercel (frontend) and Railway (backend) deploy "
    "independently - pushing a fix only helps once BOTH rebuild from the new commit.",
    "The DEK is memory-only; a full page reload requires re-unlocking.",
    "There is no password reset; losing both passphrase and recovery code makes "
    "encrypted content permanently unreadable (by design).",
])
h2("14.2 Common tasks")
bullets([
    "<b>Add a card render property (e.g. font):</b> add it to the style object in "
    "MemoryPage/MemoryCard and the CardStyle type; no migration needed (style is "
    "JSON).",
    "<b>Add a DB column:</b> edit schema.prisma, write a migration under "
    "prisma/migrations, run prisma generate + migrate deploy, then thread the field "
    "through api.ts and the relevant component.",
    "<b>Add an endpoint:</b> add the handler in index.ts (use authenticateToken and "
    "scope to req.userId), then add a typed wrapper in services/api.ts.",
    "<b>Add a card content type:</b> extend the ContentType enum (migration), update "
    "AddCardModal, MemoryModule/MediaContent, and the presign type checks in "
    "index.ts.",
    "<b>Rotate the JWT secret:</b> change JWT_SECRET; all existing tokens become "
    "invalid and users must re-login (data is unaffected).",
])

cap("End of document.")


# ---------------------------------------------------------------- build
class DocTemplate(BaseDocTemplate):
    def __init__(self, filename, **kw):
        super().__init__(filename, pagesize=LETTER,
                         leftMargin=0.9 * inch, rightMargin=0.9 * inch,
                         topMargin=0.85 * inch, bottomMargin=0.8 * inch, **kw)
        frame = Frame(self.leftMargin, self.bottomMargin, self.width, self.height,
                      id="n")
        self.addPageTemplates([PageTemplate(id="main", frames=[frame],
                                            onPage=self._footer)])

    def _footer(self, c, doc):
        c.saveState()
        c.setFont("Helvetica", 7.5)
        c.setFillColor(GREY)
        c.drawString(self.leftMargin, 0.5 * inch,
                     "Timeline - Architecture & Maintenance Reference")
        c.drawRightString(LETTER[0] - self.rightMargin, 0.5 * inch,
                          "Page %d" % doc.page)
        c.restoreState()

    def afterFlowable(self, flowable):
        if isinstance(flowable, Paragraph):
            name = flowable.style.name
            if name == "H1":
                self.notify("TOCEntry", (0, flowable.getPlainText(), self.page))
            elif name == "H2":
                self.notify("TOCEntry", (1, flowable.getPlainText(), self.page))


DocTemplate(OUT).multiBuild(S)
print("wrote", OUT)
