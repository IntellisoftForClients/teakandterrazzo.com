# Teak & Terrazzo — Fullstack CMS

Interior design agency website with a Node.js / Express backend, PostgreSQL, and an admin dashboard.

## Stack

- **Public site:** Express + EJS (Terion-inspired UI)
- **Admin:** `/admin` CMS for services, projects, blog, testimonials, process, settings, and contact leads
- **Database:** PostgreSQL 16 via Docker Compose
- **ORM:** Prisma

## Quick start (local)

### 1. Start Postgres

```bash
docker compose up -d db
```

Postgres is exposed on **host port `55432`** (container `5432`) to avoid conflicts with other local Postgres installs.

### 2. Install & migrate

```bash
npm install
npm run db:push
npm run seed
```

### 3. Run the app

```bash
npm run dev
```

- Public site: http://localhost:3000  
- Admin: http://localhost:3000/admin  

Set `ADMIN_EMAIL` and `ADMIN_PASSWORD` in your local `.env` (see `.env.example`), then run `npm run seed`. Do not commit real credentials.

## Environment

Copy `.env.example` to `.env`:

| Variable | Purpose |
|---|---|
| `DATABASE_URL` | Postgres connection string |
| `SESSION_SECRET` | Express session secret |
| `ADMIN_EMAIL` / `ADMIN_PASSWORD` | Seeded admin credentials |
| `PORT` | App port (default `3000`) |

## Docker (full stack)

```bash
docker compose up --build
```

This starts both `db` and `app`. Uploads persist in `./public/uploads`.

## Contact leads

- Public contact form → `POST /api/contact`
- Newsletter join → `POST /api/newsletter` (stored as a lead with service `Newsletter`)
- View / filter / archive / delete in **Admin → Leads**

## CMS

From `/admin` you can create, edit, publish/unpublish, and delete:

- Services
- Projects
- Blog posts
- Testimonials
- Process steps
- Site settings (brand, phone, address, socials, about text)

Image uploads are stored under `public/uploads/`.

## Project layout

```
server/           Express app + routes
views/public/     Public EJS templates
views/admin/      Admin dashboard templates
prisma/           Schema + seed
public/           CSS, JS, assets, uploads
docker-compose.yml
```

## Notes

- Folder name contains `&`; prefer `npm run db:push` / `npm run prisma:generate` over bare `npx prisma` in some Windows shells.
- Figma source assets extracted for reference live in `public/assets/images/figma/`.
