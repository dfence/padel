# Padel

Een kleine statische PWA voor een donderdagcompetitie met 8 padelspelers.

GitHub-repository: `https://github.com/dfence/padel`.

Gepubliceerde site: `https://dfence.github.io/padel/`.

De competitie start op donderdag `2026-10-01`.

## Opslag Met GitHub JSON

De app gebruikt geen browseropslag voor competitiegegevens. Iedereen leest dezelfde startdata uit `data/league-state.json`.

GitHub Pages kan vanuit de browser geen bestanden in de repository overschrijven. Daarom werkt adminbeheer zo:

1. Open de site en klik op `Admin`.
2. Gebruik de code `padel26/27`.
3. Maak rondes of vul scores in.
4. Klik op `league-state.json downloaden`.
5. Vervang in GitHub het bestand `data/league-state.json` door de download.
6. Commit de wijziging. Daarna ziet iedereen dezelfde nieuwe stand.

Zolang je het JSON-bestand nog niet terugzet in GitHub, blijven wijzigingen alleen in het geopende browservenster actief. Dat is normaal: de browser mag lokale projectbestanden niet rechtstreeks aanpassen.

De app ondersteunt:

- de 8 vaste spelers beheren
- teams genereren op basis van het klassement
- `19:00`-wedstrijden eerlijk verdelen tijdens splitweken
- scores invoeren en als nieuw `league-state.json` bestand downloaden
- vervangers aanduiden met een straf van `-2` games voor de vaste speler
- JSON-back-ups en scorelogs exporteren

De publieke app opent in alleen-lezen modus. Gebruik de knop `Admin` en code `padel26/27` om scorebeheer en planning te tonen. Dit voorkomt toevallige wijzigingen, maar is geen echte beveiliging omdat frontendcode zichtbaar is in de browser.

## Testen

Gebruik de knop `Demo laden` in adminmodus. Die vervangt de huidige rondes door zes fictieve donderdagen, inclusief een vervanger met strafpunten.

## Publiceren

1. Zet de bestanden in de root van de repository.
2. Open in GitHub `Settings > Pages`.
3. Kies `Deploy from a branch`.
4. Selecteer branch `main` en map `/ (root)`.
5. Sla op en deel daarna de Pages-URL met de groep.

Gebruik `Scorelog downloaden` om een Markdown-bestand met alle gespeelde rondes te bewaren in GitHub, bijvoorbeeld in de map `logs/`.
