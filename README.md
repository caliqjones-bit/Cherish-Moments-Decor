# Cherish Moments Decor — Website

Luxury Holiday Tree Design · Designed to Be Remembered. · Central Florida

A complete, production-ready static website: 10 public pages + 3 legal pages, no build tools or hosting dependencies required. Open `index.html` in any browser to preview.

---

## 1. IMPORTANT — Replace the placeholder photos

**Easiest way: open `photo-installer.html` in Chrome or Edge.** It walks you through every photo visually — click "Connect the photo folder", choose `assets/img`, then click each card and pick the matching picture. Photos are renamed, resized, and saved automatically. Delete `photo-installer.html` when finished (don't upload it to your web host).

Manual alternative: save your photos over these filenames in `assets/img/` (keep the exact names):

| Filename | Which of your photos goes here |
|---|---|
| `tree-lobby-mirror.jpg` | Full-height teal/copper tree beside the gilded mirror (straight-on lobby view) — **also used as hero + social share image** |
| `tree-lobby-angle.jpg` | Same lobby tree, angled view with printer/desk at left |
| `tree-lobby-detail-angle.jpg` | Lobby tree, third angle (closer, more marble visible) |
| `tree-emerald-copper-full.jpg` | Emerald/copper/fuchsia-gem tree, full height (portrait) |
| `tree-tabletop-gold-teal.jpg` | Small tabletop tree in gold/teal on gold pedestal |
| `tree-base-gold-pedestal.jpg` | Close-up of tree base / oversized ornaments over the mirrored gold box |
| `tree-topper-velvet-magnolia.jpg` | Tree topper close-up — teal velvet + gilded magnolia leaves |
| `garland-mantel-orange-teal.jpg` | Garland close-up: orange balls + teal velvet ribbon curls |
| `garland-drop-copper-finial.jpg` | Vertical garland drop with long copper finial against marble |
| `garland-mantel-closeup.jpg` | Mantel garland from above with candlesticks |
| `mantel-fireplace-gold-full.jpg` | Gold fireplace, full view with directory sign + gifts |
| `mantel-fireplace-wide.jpg` | Gold fireplace, second full view |
| `gifts-orange-velvet-stack.jpg` | Orange gifts with teal velvet bows, stack close-up (vertical) |
| `gifts-orange-velvet-closeup.jpg` | Orange gifts, tighter close-up of bows |
| `detail-teal-velvet-leaves.jpg` | Landscape close-up: teal velvet leaves + glitter clusters |
| `detail-teal-bow-ornaments.jpg` | Landscape close-up: teal bow + green glitter ball + ribbon |
| `detail-copper-ball-berries.jpg` | Landscape close-up: copper balls + red berries + copper leaves |
| `detail-copper-leaves-berries.jpg` | Portrait close-up: glittered copper eucalyptus + berries |
| `detail-glitter-leaves-teal-balls.jpg` | Landscape close-up: glitter leaves over teal balls, warm light |
| `detail-magenta-gem-ornament.jpg` | Landscape close-up: faceted magenta gem ornament |
| `hero-tree-lobby.jpg` | Any wide/landscape crop of your strongest installation (used in CTA backgrounds) |
| `video-poster.jpg` | A still frame from your installation video |

Tips: export at ~1600–2000px on the long edge, JPG quality ~80 (or WebP with the same names + update the `src` attributes). Videos go in `assets/video/` — see the marked block in `our-past-work.html` and the commented-out `<video>` block in the homepage hero.

## 2. Connect the forms (5 minutes)

All three forms (consultation booking, contact, priority list) are fully validated and spam-protected. Until a backend is connected, submissions open the visitor's email app pre-addressed to cherishmomentsdecorllc@gmail.com — real, but not ideal.

To upgrade: create a free endpoint at Formspree/Basin/etc., then in `js/main.js` set
`var FORM_ENDPOINT = "https://formspree.io/f/yourcode";`
Never put private API keys in this file — it is public.

## 3. Connect a live scheduling platform (optional)

The booking calendar currently collects **requests awaiting approval** (clearly labeled as such — nothing is auto-confirmed). Availability settings (lead time, closed weekdays, time slots, how far out) are at the top of `js/main.js` in the `BOOKING` object. When you adopt Calendly / Acuity / Square Appointments / Google Calendar, you can either embed it on `book-consultation.html` or keep this request flow.

## 4. Other things to update

- **Domain**: All canonical URLs, sitemap.xml, and schema use the placeholder `https://www.cherishmomentsdecor.com/` — replace with your real domain everywhere (search-and-replace).
- **Business hours**: edit the sentence in the footer (`_src/footer.tpl`, id `business-hours`) and on `contact.html`.
- **Testimonials**: home page placeholders are clearly marked — replace with verified client reviews only.
- **Social links**: footer icons are unlinked placeholders until you have account URLs.
- **Legal pages**: privacy-policy.html, terms.html, accessibility.html contain marked template language — review before launch (add cancellation/deposit/refund policies; before opening the shop add Shipping/Return/Product terms).
- **Questionnaire link**: set in one place — `QUESTIONNAIRE_URL` in `js/main.js` (currently https://forms.gle/RsJgEnLQLiJYpjNt8).

## 5. Editing pages without duplicating work

Header and footer live once in `_src/top.tpl` and `_src/footer.tpl`; page content lives in `_src/body_*.html`. After editing, run `python3 _src/build.py` to regenerate every page consistently. (You can also edit the built `.html` files directly if you prefer — the `_src` folder is optional and can be excluded from your web host.)

## 6. Hosting & clean URLs

Upload everything except `_src/` to any static host (Netlify, Vercel, Cloudflare Pages, shared hosting). Internal links use `.html` so the site also works locally; on Netlify enable **Pretty URLs** (or equivalent rewrite rules) so pages resolve at the clean URLs used in the sitemap (`/services`, `/pricing`, …).

## What's included

- 10 pages: Home, Services, Residential, Corporate, Our Past Work (filterable gallery + lightbox with keyboard/swipe support), Pricing, About, Book a Consultation (date/time picker + questionnaire hand-off), Shop Coming Soon (priority list), Contact (+ FAQ)
- 3 legal starter pages
- SEO: unique titles/descriptions, canonical + Open Graph tags, LocalBusiness/Organization/Service/Breadcrumb/FAQ schema, sitemap.xml, robots.txt
- Accessibility: WCAG 2.2 AA practices — keyboard nav, focus states, labels, alt text, reduced-motion support, accessible lightbox
- Star-glow page transitions (with reduced-motion fallback), scroll reveals, lazy-loaded images with dimensions to prevent layout shift
