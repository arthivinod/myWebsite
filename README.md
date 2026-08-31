# myWebsite

Arthi Vinod's personal portfolio — live at **[arthivinod.github.io/myWebsite](https://arthivinod.github.io/myWebsite/)**.

Plain HTML/CSS/JS, no build step. Dark violet theme, animated hero orb, ambient background, and count-up data visualizations for career highlights, plus full case studies for three projects.

## Structure

- `index.html` / `style.css` / `script.js` — the main single-page site (Hero → About → Career Highlights → Featured Work → Contact)
- `case-study-resolved.html` — case study for [Resolved](https://github.com/arthivinod), an AI consumer-complaint agent
- `case-study-renters-rights.html` — case study for the Renter's Rights Assistant (a RAG tenancy-law tool, built as "FinePrint")
- `case-study-interview-signal.html` — an original system-design case study for an AI interview-scoring assistant
- `Arthi_Vinod_Resume.pdf` — downloadable résumé, linked from the Contact section

## Run locally

```bash
python3 -m http.server 8000
```

Then open `http://localhost:8000/`.
