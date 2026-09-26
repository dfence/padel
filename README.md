# Padel

Een kleine statische PWA voor een donderdagcompetitie met 8 padelspelers.

GitHub-repository: `https://github.com/dfence/padel`.

Gepubliceerde site: `https://dfence.github.io/padel/`.

De competitie start op donderdag `2026-10-01`.

## Centrale Opslag

De app is bedoeld om centraal te werken via Supabase. Gebruik geen browseropslag voor competitiegegevens. Zodra `config.js` op `storageMode: "supabase"` staat, lezen alle browsers dezelfde centrale `league_state` rij en worden scorewijzigingen centraal bewaard.

Zonder Supabase-config toont de app alleen de statische startdata uit `data/league-state.json` en kunnen wijzigingen niet blijvend opgeslagen worden.

De app ondersteunt:

- de 8 vaste spelers beheren
- teams genereren op basis van het klassement
- `19:00`-wedstrijden eerlijk verdelen tijdens splitweken
- scores centraal invoeren
- vervangers aanduiden met een straf van `-2` games voor de vaste speler
- JSON-back-ups en scorelogs exporteren

De publieke app opent in alleen-lezen modus. Gebruik de knop `Admin` en code `padel26/27` om scorebeheer en planning te tonen. Dit voorkomt toevallige wijzigingen, maar is geen echte beveiliging omdat frontendcode zichtbaar is in de browser.

## Supabase Instellen

1. Maak een Supabase-project.
2. Open de SQL editor en voer `database/supabase.sql` uit.
3. Kopieer je Project URL en anon public key.
4. Zet die waarden in `config.js`:

```js
window.PADEL_APP_CONFIG = {
  repositoryName: "padel",
  storageMode: "supabase",
  supabaseUrl: "https://PROJECT.supabase.co",
  supabaseAnonKey: "PUBLIC_ANON_KEY"
};
```

De huidige SQL laat de app centraal lezen en schrijven naar exact één rij. Dat maakt de competitie meteen bruikbaar op meerdere browsers. Voor echte harde adminbeveiliging is de volgende stap Supabase Auth met een admin-user en strengere RLS policies.

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
