#!/usr/bin/env python3
"""Assembles the Cherish Moments Decor pages from partials + body files.
Run from the _src directory:  python3 build.py
Edit top.tpl / footer.tpl once and rebuild to update every page."""
import json, os, pathlib

SRC = pathlib.Path(__file__).parent
OUT = SRC.parent

NAV = [
    ("index.html", "Home"),
    ("services.html", "Services"),
    ("residential-holiday-design.html", "Residential"),
    ("corporate-holiday-design.html", "Corporate"),
    ("our-past-work.html", "Past Work"),
    ("pricing.html", "Pricing"),
    ("about.html", "About"),
    ("shop.html", "Shop"),
    ("contact.html", "Contact"),
]

PAGES = {
    "index.html": {
        "title": "Luxury Christmas Decorators in Central Florida | Cherish Moments Decor",
        "desc": "Cherish Moments Decor provides luxury Christmas tree design, residential holiday styling, corporate installations, premium décor sourcing, installation, and post-season takedown throughout Central Florida.",
        "canon": "", "transparent": True,
    },
    "services.html": {
        "title": "Luxury Holiday Decorating Services | Cherish Moments Decor",
        "desc": "White-glove holiday design services in Central Florida: consultations, custom Christmas tree design, premium décor sourcing, professional installation, garland and mantel styling, and post-season takedown.",
        "canon": "services",
    },
    "residential-holiday-design.html": {
        "title": "Residential Holiday Decorating in Central Florida | Cherish Moments Decor",
        "desc": "Luxury residential Christmas decorating in Central Florida — custom trees, mantels, staircases, entryways, and coordinated whole-home holiday installations, fully managed from design to takedown.",
        "canon": "residential-holiday-design",
    },
    "corporate-holiday-design.html": {
        "title": "Corporate Christmas Decorating in Central Florida | Cherish Moments Decor",
        "desc": "Sophisticated corporate holiday installations for offices, hotel lobbies, museums, wedding venues, showrooms, and retail spaces throughout Central Florida — designed, installed, and removed by one team.",
        "canon": "corporate-holiday-design",
    },
    "our-past-work.html": {
        "title": "Our Past Work — Luxury Holiday Installations | Cherish Moments Decor",
        "desc": "A portfolio of luxury Christmas trees, garlands, mantels, and holiday installations designed by Cherish Moments Decor for residential and corporate clients in Central Florida.",
        "canon": "our-past-work",
    },
    "pricing.html": {
        "title": "Holiday Design Investment | Cherish Moments Decor",
        "desc": "Luxury holiday design investment levels — Standard Tree Design from $1,000 and Luxury Tree Design from $2,500. Every project receives a customized proposal after a private consultation.",
        "canon": "pricing",
    },
    "about.html": {
        "title": "About Us — Luxury Holiday Tree Design Studio | Cherish Moments Decor",
        "desc": "Cherish Moments Decor is a luxury holiday tree design studio creating custom seasonal installations for residential and corporate clients throughout Central Florida.",
        "canon": "about",
    },
    "book-consultation.html": {
        "title": "Book a Holiday Design Consultation | Cherish Moments Decor",
        "desc": "Request a private holiday design consultation with Cherish Moments Decor. Choose a preferred date and time, share your project details, and begin your luxury holiday design experience.",
        "canon": "book-consultation",
    },
    "shop.html": {
        "title": "Shop — The Cherish Moments Collection, Coming Soon | Cherish Moments Decor",
        "desc": "A curated collection of premium holiday décor — luxury ribbon, ornaments, tree accessories, and coordinated collections — is coming soon. Join the Priority List for early access.",
        "canon": "shop",
    },
    "contact.html": {
        "title": "Contact Us | Cherish Moments Decor",
        "desc": "Contact Cherish Moments Decor — luxury Christmas decorators serving Central Florida. Call (347) 409-4115 or send a message to begin your holiday design experience.",
        "canon": "contact",
    },
    "privacy-policy.html": {
        "title": "Privacy Policy | Cherish Moments Decor",
        "desc": "Privacy policy for the Cherish Moments Decor website.",
        "canon": "privacy-policy", "noindex": True,
    },
    "terms.html": {
        "title": "Terms & Conditions | Cherish Moments Decor",
        "desc": "Terms and conditions for the Cherish Moments Decor website.",
        "canon": "terms", "noindex": True,
    },
    "accessibility.html": {
        "title": "Accessibility Statement | Cherish Moments Decor",
        "desc": "Accessibility statement for the Cherish Moments Decor website.",
        "canon": "accessibility", "noindex": True,
    },
}

top = (SRC / "top.tpl").read_text(encoding="utf-8")
footer = (SRC / "footer.tpl").read_text(encoding="utf-8")

for fname, meta in PAGES.items():
    body_file = SRC / ("body_" + fname)
    if not body_file.exists():
        print("SKIP (no body):", fname)
        continue
    body = body_file.read_text(encoding="utf-8")

    nav_links = []
    for href, label in NAV:
        cur = ' aria-current="page"' if href == fname else ""
        nav_links.append(f'        <a href="{href}"{cur}>{label}</a>')

    extra = ""
    ex_file = SRC / ("head_" + fname.replace(".html", ".txt"))
    if ex_file.exists():
        extra = ex_file.read_text(encoding="utf-8")
    if meta.get("noindex"):
        extra += '  <meta name="robots" content="noindex, follow">\n'

    html = (top
            .replace("{TITLE}", meta["title"])
            .replace("{DESC}", meta["desc"])
            .replace("{CANON}", meta["canon"])
            .replace("{EXTRA_HEAD}", extra)
            .replace("{HEADER_SOLID}", "" if meta.get("transparent") else " solid")
            .replace("{NAV_LINKS}", "\n".join(nav_links)))
    html += body + "\n" + footer
    (OUT / fname).write_text(html, encoding="utf-8")
    print("BUILT:", fname)
