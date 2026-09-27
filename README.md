# Padel

Een kleine statische PWA voor een donderdagcompetitie met 8 padelspelers.

GitHub-repository: `https://github.com/dfence/padel`.

Gepubliceerde site: `https://dfence.github.io/padel/`.

De competitie start op donderdag `2026-10-01`.

## Scores en rondes beheren

Iedereen leest dezelfde competitiegegevens uit `data/league-state.json`. Koppel een beheerapparaat één keer met een fijnmazig GitHub-token dat alleen schrijfrechten heeft op de repository `dfence/padel`:

1. Open de site op je telefoon en tik op `Admin`.
2. Open `Token maken op GitHub`; kies alleen `dfence/padel` en Contents lees- en schrijfrechten.
3. Plak het token bij `Website koppelen`. Dit hoef je per beheerapparaat één keer te doen.
4. Vul scores in op de wedstrijdkaarten en tik op `Opslaan op website`.
5. Na alle uitslagen tik je op `Volgende ronde maken + opslaan`. De app slaat de ronde en stand direct op GitHub op.

De GitHub-commit triggert het bijwerken van de gepubliceerde Pages-site. Als een ander apparaat intussen gegevens heeft opgeslagen, vraagt de app om te verversen in plaats van diens werk te overschrijven.

De app ondersteunt:

- de 8 vaste spelers beheren
- teams genereren op basis van het klassement
- `19:00`-wedstrijden eerlijk verdelen tijdens splitweken
- scores invoeren en rechtstreeks opslaan op GitHub
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
