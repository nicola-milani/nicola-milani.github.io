# Progetto Hugo CV PDF Generator

Questo progetto è una personalizzazione di Hugo per la generazione e preview di Curriculum Vitae (CV) in formato PDF, con supporto a stili multipli (Europass e Custom), gestione privacy (campi base64), foto e layout responsive.

## Struttura delle cartelle principali

```text
/workspaces/nicola-milani.github.io
│
├── README.md                # Questo file
├── src/                     # Sorgente principale del sito Hugo
│   ├── config.toml          # Configurazione Hugo
│   ├── archetypes/          # Archetipi di contenuto
│   ├── content/             # Contenuti markdown (pagine, blog, progetti, ecc.)
│   ├── data/                # Dati strutturati (JSON per sezioni CV, skills, ecc.)
│   ├── layouts/             # (Vuoto, layout custom non usati direttamente qui)
│   ├── public/              # Output statico generato da Hugo (NON modificare a mano)
│   │   ├── css/             # CSS generati
│   │   ├── data/            # JSON per il CV (pdf-content.json)
│   │   ├── js/              # JS statici (pdf-generator.js, resume.js, ecc.)
│   │   ├── templates/       # Template Handlebars per i vari stili CV
│   │   └── ...
│   ├── resources/           # Risorse generate da Hugo
│   ├── static/              # File statici serviti direttamente (img, js, css, ecc.)
│   └── themes/              # Temi Hugo (hugo-resume customizzato)
└── static/                  # Alias di src/static (per compatibilità)
```

## File e cartelle chiave

- **src/data/pdf-content.json**: Dati del CV in formato JSON (campi sensibili codificati base64, foto inclusa come base64).
- **src/public/js/pdf-generator.js**: Logica JS per preview dinamica e generazione PDF (gestione template, decodifica base64, firma PDF, selezione stile).
- **src/public/templates/cv-europass.html**: Template Handlebars per stile Europass.
- **src/public/templates/cv-custom.html**: Template Handlebars per stile personalizzato.
- **src/themes/hugo-resume/layouts/partials/portfolio/downloadResume.html**: UI Hugo per selezione stile, preview e download PDF.
- **src/public/css/resume.css, tweaks.css, resume-override.css**: Stili custom per il CV.

## Flusso di funzionamento

1. L'utente seleziona lo stile desiderato (Europass o Custom) dalla UI.
2. Viene caricata la preview del CV usando il template corrispondente e i dati JSON.
3. Alla pressione di "Genera PDF", viene aggiunta una firma con la data e viene generato il PDF con lo stile selezionato.
4. I campi sensibili vengono decodificati solo per il PDF.

## Personalizzazione e manutenzione

- **Aggiunta/Modifica dati CV**: Modificare `src/data/pdf-content.json`.
- **Aggiunta/Modifica template**: Modificare i file in `src/public/templates/`.
- **Stili**: Personalizzare i CSS in `src/public/css/`.
- **Logica JS**: Tutta la logica di preview e PDF è in `src/public/js/pdf-generator.js`.
- **UI Hugo**: La UI di selezione e preview è in `src/themes/hugo-resume/layouts/partials/portfolio/downloadResume.html`.

## Note tecniche

- Il sistema supporta la privacy: i dati sensibili sono codificati base64 e decodificati solo per la generazione del PDF.
- La foto è gestita come stringa base64.
- La firma con la data di generazione viene aggiunta solo nel PDF, non nella preview.
- Il template usato per la preview e per il PDF è sempre quello selezionato dall’utente.

## Comandi utili

- **Avvio server di sviluppo Hugo**:

  ```bash
  hugo server -D
  ```

- **Build sito statico**:

  ```bash
  hugo
  ```

## Dipendenze principali

- Hugo
- Handlebars.js
- html2pdf.js
- jsPDF

---
