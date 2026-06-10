# ⚽️ WM Tippspiel 2026

Ein Tippspiel zur Fussball-WM 2026 (USA, Kanada & Mexiko) als installierbare Web-App
(PWA) im Apple-Design – inspiriert vom SRF-Tippspiel und Kicktipp.

## Konzept

**Analyse bestehender Tippspiele:**

| App | Übernommene Idee |
|---|---|
| SRF Tippspiel | Tippabgabe pro Woche, Punktesystem (3 exakt / 1 Tendenz), private Tipprunden |
| Kicktipp | Einladungscode für Gruppen, automatische Punkteberechnung, Tendenz-Statistik |
| Instagram / iOS 26 | Schwebende Liquid-Glass-Tab-Bar unten, Large-Title-Header, Karten-Layout |

**Die fünf Screens (Tab-Bar):**

1. **Home** – Dashboard mit deinen Punkten, Rang, exakten Tipps, offenen Tipps der Woche, nächsten Spielen, letzten Resultaten und den Spitzenreitern.
2. **Tipps** – Wochenansicht (Woche 1–6) wie beim SRF-Tippspiel. Resultat eintippen, automatisches Speichern. Ab Anpfiff ist der Tipp gesperrt; danach siehst du Resultat und Punkte.
3. **Rangliste** – Gesamtwertung und pro Gruppe filterbar. Bei Punktgleichheit zählt die Anzahl exakter Tipps.
4. **Gruppen** – Tipprunden erstellen, per 6-stelligem Einladungscode beitreten, Gruppen-Rangliste, Code via iOS-Share-Sheet teilen.
5. **News** – Automatisch generierte deutsche Zusammenfassungen der letzten Spiele plus Vorschau auf kommende Partien.

Dazu: **Profil** (Statistiken, Abmelden, Install-Anleitung) und **Verwaltung** (nur Admin).

**Punktesystem (wie SRF):** exaktes Resultat **3 Punkte**, richtige Tendenz **1 Punkt** – anpassbar in [src/lib/scoring.ts](src/lib/scoring.ts).

**Daten:** Alle 48 Teams und der echte Spielplan der Gruppenphase (72 Spiele, 11.–27. Juni 2026) sind vorbefüllt ([prisma/seed.ts](prisma/seed.ts)). Die K.o.-Spiele (Sechzehntelfinale bis Finale) sind als Platzhalter angelegt – der Admin trägt die Paarungen nach der Gruppenphase im Verwaltungs-Screen ein. Die Anstosszeiten der K.o.-Spiele sind provisorisch.

**Rollen:** Der **erste registrierte Benutzer wird automatisch Admin** und erfasst die Resultate (Verwaltung → Resultat speichern → Punkte werden für alle neu berechnet).

## Tech-Stack

- **Next.js 16** (App Router, TypeScript) – läuft nativ auf Vercel
- **Tailwind CSS 4** – iOS-Designsystem mit Liquid Glass (backdrop-blur), Dark Mode automatisch
- **PostgreSQL + Prisma** – lokal Postgres, in Produktion Neon (Vercel-Integration)
- **Auth:** E-Mail + Passwort (bcrypt) mit JWT-Session-Cookie (60 Tage)
- **PWA:** Web-App-Manifest + Apple-Meta-Tags → installierbar ohne App Store

## Lokal starten

```bash
# Voraussetzungen: Node 20+, PostgreSQL läuft lokal
createdb tippspiel
cp .env.example .env        # DATABASE_URL + AUTH_SECRET eintragen
npm install
npm run db:setup            # Schema anlegen + WM-Spielplan einspielen
npm run dev                 # http://localhost:3000
```

## Deployment: GitHub → Vercel → eigene Domain

1. **GitHub:** Repository erstellen und pushen:
   ```bash
   git remote add origin https://github.com/<dein-name>/tipp-app.git
   git push -u origin main
   ```
2. **Vercel:** Auf [vercel.com](https://vercel.com) → *Add New Project* → GitHub-Repo importieren. Framework wird automatisch als Next.js erkannt.
3. **Datenbank:** Im Vercel-Projekt → Tab *Storage* → *Create Database* → **Neon (Postgres)**. Vercel setzt `DATABASE_URL` automatisch als Environment-Variable.
4. **Env-Variable:** Unter *Settings → Environment Variables* zusätzlich `AUTH_SECRET` setzen (z. B. Ausgabe von `openssl rand -base64 32`). Danach **Redeploy**.
5. **Spielplan einspielen** (einmalig, von deinem Mac aus gegen die Produktions-DB):
   ```bash
   DATABASE_URL="<neon-connection-string aus Vercel>" npm run db:setup
   ```
6. **Eigene Domain:** Vercel-Projekt → *Settings → Domains* → Domain eintragen und beim Domain-Anbieter den angezeigten CNAME-/A-Record setzen. HTTPS kommt automatisch.

## Auf dem iPhone installieren

1. Deine Domain in **Safari** öffnen.
2. **Teilen-Button** (Quadrat mit Pfeil) antippen.
3. **«Zum Home-Bildschirm»** wählen.

Die App erscheint mit eigenem Icon auf dem Home-Bildschirm und startet im Vollbild ohne Browser-Leiste – wie eine native App.

## Nützliche Befehle

| Befehl | Zweck |
|---|---|
| `npm run dev` | Entwicklungsserver |
| `npm run build` | Production-Build (inkl. `prisma generate`) |
| `npm run db:setup` | Schema pushen + Spielplan seeden (idempotent) |
| `node scripts/gen-icons.mjs` | App-Icons neu generieren |
