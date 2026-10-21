# FWG Group website (fwg.global)

The group website for FWG, built to **FWG Brand Guidelines 1.01** and the **fwg.global Website Structure Plan** (Cyfer Plus, October 2026).

It is a static site: plain HTML, CSS and JavaScript, with no build step. It runs on GitHub Pages or any static web host.

> **Status: staging preview.** The site is set to `noindex` and forms do not send. See [Before launch](#before-launch).

## What's inside

| Area | Contents |
|---|---|
| Home | A 3D city hero with a camera dolly-in; animated 3D scenes for the four services and the three getting-started steps; an FWG in numbers panel with count-up figures; and a 3D site that switches between day and night |
| Group pages | About, Accreditations, Request a quote, Careers, News, Contact, Privacy, Ventures |
| Malaysia | Overview, Security services, Electronic security, Branches, FWG Trustee, Property |
| Countries | India, Singapore (placeholder) |
| Review | `#review` lists every open item for FWG to confirm. The "Show items to confirm" switch in the footer highlights them on each page |

Features:

- **Light and dark mode.** The site follows the visitor's device setting. The sun/moon button overrides it, and the choice is remembered.
- **Logo handling.** The logo always sits on a white plate, as the guideline requires. It is never rendered in 3D.
- **Reduced motion.** When a visitor's device asks for less motion, all animation stops and the 3D scenes show a still frame.
- **Responsive.** Layouts are checked at 390 px and 1440 px.

## Structure

```
fwg-website/
├── index.html              # all pages in one file
├── about/ malaysia/ india/ …  # one static copy per page, each with its own title and description
├── sitemap.xml, vercel.json   # search engines; clean URLs on Vercel
├── assets/
│   ├── css/styles.css      # design tokens (light + dark) and components
│   ├── js/main.js          # router, menus, forms, theme, 3D scenes
│   ├── js/fx3d.js          # animated 3D vignettes (one shared renderer) + motion
│   ├── img/                # logo, photos, pre-rendered 3D icons
│   └── vendor/three.min.js # three.js r128 (MIT)
├── robots.txt              # blocks indexing while staging
├── CONTENT-TODO.md         # what FWG still needs to supply or confirm
├── .nojekyll               # serve files as-is on GitHub Pages
└── README.md
```

### Design tokens

Brand colours and fonts come from Brand Guidelines 1.01. They are defined once at the top of `assets/css/styles.css`.

| Token | Light | Dark |
|---|---|---|
| FWG Burgundy (fills) | `#660220` | `#660220` |
| Accent text | `#660220` | `#CC9AA5` (Burgundy 40%) |
| Background | `#F7F6F6` (Light Neutral 01) | `#231F20` (Deep Charcoal) |
| Surface | `#FFFFFF` | `#2E2A2B` (Deep Charcoal, lifted) |
| Text | `#231F20` (Deep Charcoal) | `#F7F6F6` (Light Neutral 01) |
| Tints | `#853549` `#A96877` `#CC9AA5` `#E6CCD2` | same |
| Neutrals | `#F7F6F6` `#F0EEEE` `#E5E2E3` `#D8D4D5` | same |

- **Fonts (guideline p.15–16):** Manrope for headlines, section titles and key messages (bold; subheads semibold). Inter for body copy, captions and the interface: menu, buttons and labels. Both load from Google Fonts.
- **Dark mode:** the guideline does not define a dark palette yet, so FWG needs to approve these values.

### Pages and routes

Each page is a `<section class="page" data-page="…">` in `index.html`. Pages have real addresses, for example `fwg.global/malaysia/security` or `fwg.global/india`. Each address is a static copy of the site with that page's own title, description and canonical link, so search engines index every page. `assets/js/paths.js` keeps navigation instant once the site is open. Old hash links such as `#security` still work.

Page titles and descriptions are set in one place, the `FWG_META` block in the head of each file. They are generated from `meta.py` in the build.

### WhatsApp button

The WhatsApp button is built but hidden until a number is set. Add each country's number, digits only with the country code, to `var WA={MY:'',IN:'',SG:''}` in `assets/js/fx3d.js`.

## Run locally

```bash
# any static server works, e.g.
python3 -m http.server 8080
# then open http://localhost:8080
```

Opening `index.html` directly also works.

## Deploy to GitHub Pages

1. Create a repository, for example `fwg-website`, and push this folder:
   ```bash
   git remote add origin https://github.com/<org>/fwg-website.git
   git push -u origin main
   ```
2. On GitHub, go to **Settings → Pages**. Under **Source**, choose *Deploy from a branch*, then select branch `main` and folder `/ (root)`.
3. To use the custom domain, add `fwg.global` under **Settings → Pages → Custom domain**. Then point DNS at GitHub Pages:
   - `A` records to 185.199.108.153, 185.199.109.153, 185.199.110.153 and 185.199.111.153
   - `CNAME www` to `<org>.github.io`

## Before launch

- [ ] Remove `<meta name="robots" content="noindex, nofollow">` from `index.html` and update `robots.txt`.
- [ ] Replace placeholder photos in `assets/img/`. The current ones are taken from the brand guideline mock-ups.
- [ ] Connect the quote and careers forms to a form handler (for example Formspree, a serverless function or the CRM), and route quotes to each country team.
- [ ] Write the Malaysia (PDPA 2010) and India (DPDP Act 2023) privacy notices, and have them legally reviewed.
- [ ] Remove the review bar in the footer, the `#review` page and all `.tbc` tags.
- [ ] Set up 301 redirects from fwg.my, fwg.asia, fwgindia.com, fwgdev.my and fwg.sg, following the structure plan.
- [ ] Register the site in Google Search Console.
- [ ] Work through every item in [CONTENT-TODO.md](CONTENT-TODO.md).

## Credits

- **Design and build:** Cyfer Plus Sdn Bhd.
- **3D scenes and icons:** three.js illustrations, not photographs of real sites.
- **three.js:** © three.js authors, MIT licence (see `assets/vendor/three.LICENSE.txt`).
- **Brand assets:** © Freightwatch G Patomotoh Security Services Sdn Bhd.
