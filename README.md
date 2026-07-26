# 黎安大学城拼车 · Li'an University Town Carpool

A bilingual (中文 / English) full-stack campus carpool platform for Li'an University.

**Stack:** Next.js 14 (App Router, TypeScript strict) · Tailwind CSS · shadcn/ui · Framer Motion · Lucide React · next-intl · Prisma ORM · PostgreSQL · PM2 + Nginx.

---

## 1. Features

| Route | Module |
|---|---|
| `/zh`, `/en` | Homepage: filterable grid of all carpool trips + one-click **Join** (atomically decrements remaining seats) |
| `/zh/publish` | Publish a carpool trip (validated bilingual form, preset campus pickup points + custom input) |
| `/zh/carpool-list` | All carpool trips with the same filter panel |
| `/zh/driver` | Driver Management Center: add / edit / delete driver records (tabbed UI) |
| `/zh/login`, `/zh/register` | Email-based accounts: a 6-digit code is emailed via SMTP on signup; publishing/joining/driver management require login |
| `/api/carpool`, `/api/carpool/:id/join`, `/api/drivers`, `/api/drivers/:id`, `/api/auth/*` | JSON API backed by Prisma/PostgreSQL |

Trip prices are **total trip prices** (`totalPrice`) — riders split the total by the final headcount, so cards also show a "per-seat when full" reference figure, and the price filters operate on the total.

The UI supports **light and dark themes** (toggle in the Dock, persisted to `localStorage`) and uses globally italic typography. Configure `AUTH_SECRET`, `SMTP_HOST`, `SMTP_PORT`, `QQ_EMAIL`, `QQ_EMAIL_AUTH_CODE` in `.env` (see `.env.example`) for the account system's verification emails.

Global UI: animated **BackgroundBeams** backdrop on every page and an Apple-style magnifying **Dock** navigation (Home / Publish / Trip list / Driver center / Language toggle). Language preference is persisted in `localStorage` and all routes carry a locale prefix (`/zh/...`, `/en/...`) via `next-intl` middleware.

### Custom UI component locations

| Component | Path |
|---|---|
| BackgroundBeams | `src/components/ui/background-beams.tsx` |
| Dock / DockItem / DockIcon / DockLabel | `src/components/ui/dock.tsx` |
| shadcn Input | `src/components/ui/input.tsx` |
| Other shadcn primitives (button, card, label, textarea, checkbox, select, tabs, badge) | `src/components/ui/*.tsx` |
| Demo previews | `src/components/demo/BackgroundBeamsDemo.tsx`, `src/components/demo/AppleStyleDock.tsx` |
| Business components | `src/components/features/*.tsx` |

---

## 2. Local development

### 2.1 Prerequisites

- Node.js ≥ 18.18 (20 LTS recommended)
- PostgreSQL ≥ 13 running locally or reachable remotely

### 2.2 Install & run

```bash
# 1. Install dependencies (postinstall runs `prisma generate` automatically)
npm install

# 2. Configure the database connection
cp .env.example .env
# edit .env → DATABASE_URL="postgresql://USER:PASSWORD@localhost:5432/lian_carpool?schema=public"

# 3. Create the database (once)
psql -U postgres -c "CREATE DATABASE lian_carpool;"

# 4. Create tables + generate the first migration
npx prisma migrate dev --name init

# 5. Start the dev server
npm run dev
# → http://localhost:3000  (redirects to /zh)
```

Useful extras:

```bash
npx prisma studio      # browse/edit data in the browser
npm run lint           # ESLint
npm run build          # production build (also runs prisma generate)
```

---

## 3. Database (Prisma + PostgreSQL)

Schema lives in [`prisma/schema.prisma`](prisma/schema.prisma) with four models:

- **CarpoolOrder** — published trips (organizer, route, departure time, seats, **total** price `Decimal(10,2)`, contact type `wechat|phone|both`, status `recruiting|full|finished`, `organizerId` linking to the publishing account).
- **DriverInfo** — registered drivers (contacts, license plate, service period as `@db.Date`, daily window stored as `"HH:mm"` strings since Prisma has no bare `Time` scalar, price, car type `sedan|suv|mpv`, notes). Managed only by the `ADMIN_EMAIL` account.
- **User** — email accounts (scrypt password hash, nickname).
- **EmailCode** — short-lived registration verification codes.

### Switching to MySQL later (planned)

The project is written to be database-portable; only three things change:

1. In `prisma/schema.prisma`, set `provider = "mysql"` in the `datasource` block.
2. In `.env`, set `DATABASE_URL="mysql://USER:PASSWORD@HOST:3306/lian_carpool"`.
3. Regenerate migrations (the committed SQL is PostgreSQL-specific):
   ```bash
   rm -rf prisma/migrations
   npx prisma migrate dev --name init_mysql
   ```

No application code changes are needed — all column types used (`@db.Decimal(10,2)`, `@db.Date`, `TEXT`) exist in MySQL, and every query goes through Prisma.

Migration commands:

```bash
npx prisma migrate dev --name init   # development: create + apply + generate client
npx prisma migrate deploy            # production: apply committed migrations
npx prisma generate                  # regenerate the client after schema edits
```

---

## 4. Linux cloud server deployment

The recommended flow is **build on the server** (or in CI) so native deps and the Prisma engine match the server platform.

### 4.1 Install runtime on the server (Ubuntu/Debian example)

```bash
# Node.js 20 LTS
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs nginx

# PM2 process manager
sudo npm install -g pm2
```

### 4.2 Upload the project

Either `git clone` on the server, or upload from your machine:

```bash
rsync -avz --exclude node_modules --exclude .next --exclude .env \
  ./lian-carpool/  user@YOUR_SERVER_IP:/var/www/lian-carpool/
```

### 4.3 Configure the remote PostgreSQL connection

1. Install PostgreSQL (`sudo apt-get install -y postgresql`) or use a managed database.
2. Create the user and database:
   ```bash
   sudo -u postgres psql
   CREATE USER carpool_user WITH PASSWORD 'strong_password_here';
   CREATE DATABASE lian_carpool OWNER carpool_user;
   \q
   ```
3. If the database is on a **different host**, allow remote access:
   - `postgresql.conf`: `listen_addresses = '*'`
   - `pg_hba.conf`: `host lian_carpool carpool_user APP_SERVER_IP/32 scram-sha-256`
   - `sudo systemctl restart postgresql`, and open port 5432 **only** to the app server's IP in your cloud security group.
4. On the app server create `/var/www/lian-carpool/.env`:
   ```env
   DATABASE_URL="postgresql://carpool_user:strong_password_here@DB_HOST:5432/lian_carpool?schema=public"
   ```
5. Verify connectivity and create tables:
   ```bash
   cd /var/www/lian-carpool
   npx prisma migrate deploy
   ```

### 4.4 Build and start with PM2

```bash
cd /var/www/lian-carpool
npm install          # installs deps + prisma generate
npm run build        # Next.js production build

pm2 start ecosystem.config.js   # starts `next start` on port 3000
pm2 save                        # persist the process list
pm2 startup                     # print the command that enables boot autostart — run it
```

Day-2 operations: `pm2 status`, `pm2 logs lian-carpool`, `pm2 reload lian-carpool` (after a rebuild).

### 4.5 Nginx reverse proxy

```bash
sudo cp deploy/nginx.conf /etc/nginx/sites-available/lian-carpool
sudo nano /etc/nginx/sites-available/lian-carpool   # replace carpool.example.com with your domain
sudo ln -s /etc/nginx/sites-available/lian-carpool /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
```

The full template is in [`deploy/nginx.conf`](deploy/nginx.conf) (upstream on `127.0.0.1:3000`, websocket-safe headers, immutable caching for `/_next/static/`).

### 4.6 Domain binding & firewall

1. At your DNS provider, add an **A record**: `carpool.example.com → YOUR_SERVER_IP`.
2. Open ports in the cloud provider security group **and** the OS firewall:
   ```bash
   sudo ufw allow 22/tcp    # SSH
   sudo ufw allow 80/tcp    # HTTP
   sudo ufw allow 443/tcp   # HTTPS
   sudo ufw enable
   ```
   Keep 3000 closed to the public — only Nginx should reach it. Open 5432 only between the DB and app servers.
3. Enable HTTPS:
   ```bash
   sudo apt-get install -y certbot python3-certbot-nginx
   sudo certbot --nginx -d carpool.example.com
   ```

### 4.7 Updating a running deployment

```bash
cd /var/www/lian-carpool
git pull                 # or rsync the new code
npm install
npx prisma migrate deploy
npm run build
pm2 reload lian-carpool
```

---

## 5. Project structure

```
lian-carpool/
├── components.json                  # shadcn/ui configuration
├── ecosystem.config.js              # PM2 process file
├── deploy/nginx.conf                # Nginx reverse proxy template
├── prisma/schema.prisma             # CarpoolOrder + DriverInfo models
├── next.config.mjs                  # next-intl plugin + Unsplash image host
├── tailwind.config.ts / postcss.config.mjs / tsconfig.json
└── src/
    ├── middleware.ts                # next-intl locale routing (/zh, /en)
    ├── i18n/                        # routing, navigation, request config
    ├── messages/en.json, zh.json    # all UI text (zero hard-coded strings)
    ├── lib/                         # cn(), prisma client, types, validation
    ├── app/
    │   ├── globals.css              # Tailwind base + shadcn CSS variables
    │   ├── [locale]/                # layout (Beams + Dock) and the 4 pages
    │   └── api/                     # carpool + drivers route handlers
    └── components/
        ├── ui/                      # base UI (no business logic)
        ├── features/                # business components
        └── demo/                    # dev-only component previews
```
