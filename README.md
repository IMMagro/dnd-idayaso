# Idayaso — D&D (standalone)

Strumento da DM per la campagna **Idayaso**, reso **autonomo**: sono i file
originali (`dnd.html` console DM, `tavolo.html` schermo giocatori) con un piccolo
"backend" locale (`dnd-local.js`) che salva tutto nel **localStorage** del
browser. Nessun server, nessun account.

## Uso

- Apri **`dnd.html`** (o la root, che reindirizza lì): è la console del DM.
- Dalla console apri il **Tavolo** (`tavolo.html`): lo schermo per i giocatori,
  a tutto schermo, da trascinare sulla TV / secondo monitor.
- Mappa (sfondo, griglia, **nebbia** rivela/oscura, pedine), **calendario di
  Exandria**, **party**, **dadi** e i **modi del tavolo** (mappa/immagine/
  carta/party) funzionano completamente e si salvano in locale.

## Sincronizzazione DM ⇄ Tavolo

Avviene tramite `localStorage` della **stessa origine**. Per una sincronia
affidabile servi i file via **https** (es. GitHub Pages) e apri console e tavolo
dallo stesso indirizzo. Aprendo i file con doppio clic (`file://`) alcuni browser
tengono i `localStorage` separati per finestra e la sincronia può non funzionare.

### Pubblicare su GitHub Pages
Repo → **Settings → Pages → Source: main / root**. Poi apri
`https://<utente>.github.io/<repo>/`.

## Loremaster (AI, opzionale)

Il Loremaster chiama direttamente l'API Anthropic dal browser. Per attivarlo,
apri la Console del browser (F12) ed esegui una volta:

```js
localStorage.anthropic_key = "sk-ant-..." // la tua API key Anthropic
```

## Cosa NON c'è (per scelta)

Le **note / grafo / albero** erano collegate al vault **Obsidian** locale: non
sono replicabili in un file autonomo e restano in Obsidian. Di conseguenza il
bestiario derivato dalle note parte vuoto.
