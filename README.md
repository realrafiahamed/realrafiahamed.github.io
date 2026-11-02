# Rafi Ahamed — Personal Portfolio (Redesigned)

A production-ready personal portfolio for **Rafi Ahamed** (B.Sc. in Computer Science, BRAC University, Graduated with Distinction), combining:

- **Preserved Personal Identity**: Retains the signature two-column layout (sticky left profile rail + structured right content stream), SVG cursive signature loader, and zero-dependency HTML/CSS/JS architecture.
- **Apple / Linear / Vercel / Dillion Verma Design Synthesis**:
  - Refined monochrome color palette (`#09090b` obsidian dark mode & `#fafafa` alabaster light mode) with hairline translucent borders and subtle backdrop blur (`backdrop-filter: blur(20px) saturate(180%)`).
  - Subtle top masked architectural dot-grid canvas inspired by `dillionverma/portfolio`.
  - Varied editorial section compositions (README overview with 3 architectural pillars, dedicated Undergraduate Thesis research spotlight with metric proof bar, asymmetric 3-project flagship bento grid + 5-project specification ledger with live domain filtering, specification matrix for skills, connected vertical academic timeline, and two-column honors & expandable leadership accordion).
  - Floating Apple/Dillion-inspired bottom glass dock with proximity hover elevation and instant section/theme/CV triggers.

## Project Structure

- `index.html` — Semantic HTML5 markup containing all verified academic, thesis, project, skill, honor, and leadership records from `CV_Rafi_Ahamed_2026.pdf`.
- `styles.css` — Custom modular stylesheet with dark/light theme tokens, responsive layouts across desktop, laptop, tablet, and mobile, and `prefers-reduced-motion` support.
- `script.js` — Lightweight vanilla JS controller handling theme persistence, scroll progress, IntersectionObserver scroll-spy navigation, live project domain filtering, expandable leadership drawers, clipboard email copy toast, and the in-app CV reader modal.
- `rafi.jpg` — Portrait asset.
- `CV_Rafi_Ahamed_2026.pdf` — Official Curriculum Vitae PDF.

## Running Locally

Open `index.html` directly in any modern browser, or serve the folder locally:

```bash
python3 -m http.server 8000
```

Then visit `http://localhost:8000`.
