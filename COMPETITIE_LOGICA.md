# Competitie Logica

Dit document beschrijft hoe de website haar stand, strafpunten en volgende ronde berekent.
Gebruik dit als vaste handleiding wanneer scores of rondes manueel in GitHub aangepast moeten worden.

## Belangrijkste bestanden

- `data/league-state.json`: centrale competitiegegevens. Dit bestand bepaalt wat de site toont.
- `app.js`: code van de website. De functies `computeStats`, `generatePairings` en `createRound` bevatten de berekening.
- `README.md`: korte uitleg voor admingebruik via de website.

Na elke wijziging aan `data/league-state.json` moet het bestand naar GitHub gepusht worden. GitHub Pages werkt daarna meestal binnen enkele seconden tot minuten bij.

## Data Structuur

`data/league-state.json` bevat:

- `players`: de 8 vaste spelers, in volgorde.
- `rounds`: alle rondes.
- `roundType`: meestal `auto`.

Een match bevat:

```json
{
  "id": "unieke-id",
  "time": "19:00",
  "court": 1,
  "teamA": ["speler1", "speler2"],
  "teamB": ["speler3", "speler4"],
  "scoreA": "13",
  "scoreB": "15",
  "substitutes": {
    "geert": "Pascal DB"
  }
}
```

Laat `scoreA` en `scoreB` leeg zolang de match nog niet gespeeld is:

```json
"scoreA": "",
"scoreB": ""
```

## Scores Ingeven

Vul per match de games in:

- `scoreA`: score van `teamA`.
- `scoreB`: score van `teamB`.

Voorbeeld:

```json
"teamA": ["philip", "michel"],
"teamB": ["tom", "stefan"],
"scoreA": "13",
"scoreB": "15"
```

Dit betekent: Philip + Michel verliezen met 13 tegen 15 van Tom + Stefan.

## Vervangers En Strafpunten

Als een vaste speler vervangen wordt, blijft de vaste speler in het team staan.
De vervanger komt in `substitutes`.

Voorbeeld:

```json
"teamA": ["ben", "carl"],
"teamB": ["geert", "wesley"],
"scoreA": "18",
"scoreB": "6",
"substitutes": { "geert": "Pascal DB" }
```

De site telt dan:

- Ben krijgt 18 games.
- Carl krijgt 18 games.
- Wesley krijgt 6 games.
- Geert krijgt 6 - 2 = 4 games.
- Bij Geert wordt `2` strafpunten geteld.

De straf is altijd `-2` games voor de vaste speler die vervangen werd.

## Stand Berekenen

Voor elke volledig ingevulde match:

1. Elke speler krijgt de score van zijn team.
2. Als die speler vervangen werd, worden 2 games afgetrokken.
3. `matches` stijgt alleen als beide scores ingevuld zijn.
4. `19:00` en `20:30` worden geteld op basis van het geplande uur van de match.

De rangschikking wordt daarna gesorteerd op:

1. Meeste games.
2. Bij gelijke games: minste gespeelde matchen.
3. Bij nog gelijk: volgorde in `players` in `data/league-state.json`.
4. Bij nog gelijk: naam alfabetisch.

Dus als Carl boven Ben moet staan bij gelijke score, moet Carl in `players` boven Ben staan.

## Volgende Ronde Berekenen

De site neemt de actuele rangschikking na alle ingevulde scores.
Daarna maakt ze deze koppels:

```text
Match 1: nummer 1 + nummer 8 tegen nummer 2 + nummer 7
Match 2: nummer 3 + nummer 6 tegen nummer 4 + nummer 5
```

Voorbeeld met deze stand:

```text
1. Carl
2. Ben
3. Tom
4. Stefan
5. Philip
6. Michel
7. Wesley
8. Geert
```

Dan wordt:

```text
Match 1: Carl + Geert tegen Ben + Wesley
Match 2: Tom + Michel tegen Stefan + Philip
```

## Datum Van De Volgende Ronde

De volgende ronde komt altijd 1 week na de laatste ronde.

Voorbeeld:

- Laatste ronde: `2026-10-01`
- Volgende ronde: `2026-10-08`

## Full Of Split

Als `roundType` op `auto` staat, kiest de site:

- ronde 1: `full`
- ronde 2: `split`
- ronde 3: `split`
- ronde 4: `full`
- daarna opnieuw hetzelfde patroon

Technisch: als het aantal bestaande rondes deelbaar is door 3, wordt de volgende ronde `full`; anders `split`.

## Uren Bij Full

Bij `full` spelen beide matchen om `19:00`.

```json
"kind": "full"
```

## Uren Bij Split

Bij `split` speelt 1 match om `19:00` en 1 match om `20:30`.

De site berekent voor beide nieuwe matchen hoeveel keer de spelers in die match al om `19:00` gepland stonden.
De match met de laagste gezamenlijke `19:00` teller krijgt `19:00`.
De andere match krijgt `20:30`.

Bij gelijke gezamenlijke teller krijgt match 1 `19:00` en match 2 `20:30`.

Als je achteraf manueel de uren wisselt, worden de tijdstatistieken automatisch anders omdat ze rechtstreeks uit `time` gelezen worden.

## Manueel Aanpassen In GitHub

1. Open `data/league-state.json` in GitHub.
2. Klik op het potlood om te bewerken.
3. Vul de scores in bij de juiste match.
4. Voeg eventuele vervangers toe in `substitutes`.
5. Bereken de nieuwe stand volgens de regels hierboven.
6. Voeg een nieuwe ronde toe in `rounds`.
7. Controleer dat JSON geldig blijft: komma's tussen items, geen komma na het laatste item.
8. Commit de wijziging op branch `main`.
9. Wacht tot GitHub Pages bijgewerkt is.

## Huidige Voorbeeldlogica Na 1 Oktober 2026

Scores:

```text
Philip + Michel tegen Tom + Stefan: 13-15
Ben + Carl tegen Geert + Wesley: 18-6
Geert vervangen door Pascal DB, dus Geert krijgt 2 strafpunten.
```

Stand:

```text
1. Carl: 18
2. Ben: 18
3. Tom: 15
4. Stefan: 15
5. Philip: 13
6. Michel: 13
7. Wesley: 6
8. Geert: 4
```

Volgende ronde:

```text
2026-10-08
19:00: Tom + Michel tegen Stefan + Philip
20:30: Carl + Geert tegen Ben + Wesley
```

## Snelle Controle

Na publiceren kan je deze URL openen om de ruwe data te controleren:

```text
https://dfence.github.io/padel/data/league-state.json
```

Als een telefoon nog oude data toont, sluit de site volledig en open opnieuw.
Je kan ook tijdelijk `?v=2` achter de site-URL zetten om de browsercache te omzeilen.
