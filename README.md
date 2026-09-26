# Padel

Een kleine statische PWA voor een donderdagcompetitie met 8 padelspelers.

GitHub-repository: `https://github.com/dfence/padel`.

Gepubliceerde site: `https://dfence.github.io/padel/`.

De competitie start op donderdag `2026-10-01`.

## Huidige opslag

Deze versie bewaart data in de browser van de admin via `localStorage`. Dat werkt goed voor een eerste GitHub Pages-versie:

- de 8 vaste spelers beheren
- teams genereren op basis van het klassement
- `19:00`-wedstrijden eerlijk verdelen tijdens splitweken
- scores invoeren
- vervangers aanduiden met een straf van `-2` games voor de vaste speler
- JSON-back-ups exporteren en importeren

Omdat GitHub Pages statisch is, is er nog geen gedeelde live database. Vrienden die de pagina openen op hun eigen telefoon zien dus niet automatisch de lokale data van de admin.

De publieke app opent in alleen-lezen modus. Gebruik de knop `Admin` en code `padel26/27` om scorebeheer en planning te tonen. Dit voorkomt toevallige wijzigingen, maar is geen echte beveiliging omdat frontendcode zichtbaar is in de browser.

## Volgende Database

Voor een gedeelde app blijft GitHub Pages prima als frontend, met daarachter een gehoste database:

- Supabase: beste keuze voor een kleine private competitie, met login, tabellen en een gratis tier.
- Firebase: ook goed, zeker als realtime updates belangrijk worden.
- Google Sheets plus Apps Script: vertrouwd en eenvoudig, maar minder app-achtig en lastiger netjes te beveiligen.

De eerste databasevariant staat in `database/supabase.sql`. Die maakt een gedeelde JSON-state aan in Supabase: eenvoudig genoeg voor deze competitie zolang de regels nog evolueren.

## Testen

Gebruik de knop `Demo laden` in adminmodus. Die vervangt de huidige rondes door zes fictieve donderdagen, inclusief een vervanger met strafpunten.

## Publiceren

1. Maak of hernoem de publieke repository naar `padel`.
2. Zet de bestanden in de root van de repository.
3. Open in GitHub `Settings > Pages`.
4. Kies `Deploy from a branch`.
5. Selecteer branch `main` en map `/ (root)`.
6. Sla op en deel daarna de Pages-URL met de groep.

Gebruik voorlopig `JSON exporteren` na scorewijzigingen zodat je altijd een back-up hebt. Gebruik `Scorelog downloaden` om een Markdown-bestand met alle gespeelde rondes te bewaren in GitHub, bijvoorbeeld in de map `logs/`.
