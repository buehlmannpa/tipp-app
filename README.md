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
5. **News** – Automatisch generierte deutsche Zusammenfassungen der letzten Spiele plus Vorschau auf kommende Partien. Darunter **«Highlights & Berichte»**: echte WM-Artikel der Sportredaktionen von **kicker** (WM-Ressort) und **Sportschau** (Fussball, WM-gefiltert), serverseitig via RSS geladen und 10 Minuten gecacht ([src/lib/feeds.ts](src/lib/feeds.ts)) – ohne API-Key.

Dazu: **Profil** (Statistiken, Abmelden, Install-Anleitung) und **Verwaltung** (nur Admin).

**Punktesystem (wie SRF):** exaktes Resultat **3 Punkte**, richtige Tendenz **1 Punkt** – anpassbar in [src/lib/scoring.ts](src/lib/scoring.ts).

**Daten:** Alle 48 Teams und der echte Spielplan der Gruppenphase (72 Spiele, 11.–27. Juni 2026) sind vorbefüllt ([prisma/seed.ts](prisma/seed.ts)). Die K.o.-Spiele (Sechzehntelfinale bis Finale) sind als Platzhalter angelegt – der Admin trägt die Paarungen nach der Gruppenphase im Verwaltungs-Screen ein. Die Anstosszeiten der K.o.-Spiele sind provisorisch.

**Rollen:** Der **erste registrierte Benutzer wird automatisch Admin** und kann Resultate manuell erfassen (Verwaltung → Resultat speichern → Punkte werden für alle neu berechnet).

## Automatischer Resultat-Sync (empfohlen)

Mit einem Gratis-API-Key von [football-data.org](https://www.football-data.org/client/register) (WM im Free-Tier enthalten) holt die App Resultate **vollautomatisch**:

- **Wann:** Sobald jemand die App öffnet und ein Spiel seit > 105 Minuten läuft bzw. beendet sein müsste, fragt der Server die API ab (gedrosselt auf max. 1 Anfrage pro 5 Minuten). Zusätzlich läuft täglich um 6 Uhr ein Vercel-Cron als Backup ([vercel.json](vercel.json) → `/api/cron/sync`).
- **Was:** Endstände werden übernommen, die **Punkte aller Tipps sofort neu berechnet** (Rangliste damit aktuell), und sobald K.o.-Paarungen feststehen, werden die Platzhalter (Sechzehntelfinale bis Finale) **automatisch mit den richtigen Teams und Anstosszeiten befüllt**.
- **Setup:** Auf Vercel die Env-Variablen `FOOTBALL_DATA_API_KEY` und (empfohlen) `CRON_SECRET` setzen → Redeploy. Ohne Key bleibt der manuelle Admin-Workflow.

## Push-Erinnerungen (Tipp nicht vergessen!)

Die App erinnert Nutzer per Push-Nachricht an offene Tipps vor anstehenden Spielen
(täglich 9 Uhr CH-Zeit via Vercel Cron, max. 1 Erinnerung pro Gerät und Tag):

1. Schlüsselpaar erzeugen: `npx web-push generate-vapid-keys`
2. Auf Vercel setzen: `NEXT_PUBLIC_VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT` (z. B. `mailto:du@example.com`) → Redeploy.
3. Nutzer aktivieren die Erinnerungen im **Profil** über den Schalter «Tipp-Erinnerungen».

**iPhone:** Push funktioniert ab iOS 16.4, aber nur wenn die App über
«Zum Home-Bildschirm» installiert wurde und von dort geöffnet wird.
Wer öfter erinnern will (z. B. stündlich vor Anpfiff), kann `/api/cron/remind?window=3`
von einem externen Scheduler wie cron-job.org aufrufen lassen
(Header `Authorization: Bearer <CRON_SECRET>`).

## Bot-Schutz (Cloudflare Turnstile)

Die Registrierung ist optional mit [Cloudflare Turnstile](https://www.cloudflare.com/products/turnstile/) geschützt (gratis, ohne Bilder-Rätsel):

1. Auf [dash.cloudflare.com](https://dash.cloudflare.com) → *Turnstile* → Widget für deine Domain erstellen (Modus «Managed»).
2. Auf Vercel `NEXT_PUBLIC_TURNSTILE_SITE_KEY` und `TURNSTILE_SECRET_KEY` setzen → Redeploy.

Das Widget erscheint im Registrierungsformular und wird serverseitig verifiziert. Ohne Keys läuft die Registrierung ohne Captcha (praktisch für lokale Entwicklung).

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
