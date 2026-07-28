/* Cherish Moments Decor — shared site scripts
   Sections: config, header/nav, page transitions, reveal-on-scroll,
   gallery/lightbox, forms (contact / booking / priority list), booking calendar.
*/
(function () {
  "use strict";

  /* ================= CONFIG (owner-editable) =================
     To connect a form backend (e.g. Formspree, Basin, Netlify Forms endpoint),
     set FORM_ENDPOINT to your endpoint URL. While it is empty, submissions
     open the visitor's email app pre-addressed to the studio, so every
     request still reaches you — no data is silently discarded.
     NEVER place private API keys in this file. */
  var FORM_ENDPOINT = ""; // e.g. "https://formspree.io/f/xxxxxxx"
  var BUSINESS_EMAIL = "cherishmomentsdecorllc@gmail.com";

  /* Consultation availability (owner-editable until a live scheduling
     platform — Calendly, Acuity, Square Appointments, Google Calendar —
     is connected). Times are labels only; all submissions are REQUESTS
     awaiting confirmation, never auto-confirmed. */
  var BOOKING = {
    daysAhead: 365,           // how far out dates may be requested (a full year, so the whole holiday season is bookable)
    minLeadDays: 2,           // earliest selectable date = today + minLeadDays
    closedWeekdays: []        // e.g. [0] to close Sundays (0=Sun ... 6=Sat)
  };

  var prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ================= Header ================= */
  var header = document.querySelector(".site-header");
  function onScroll() {
    if (!header) return;
    header.classList.toggle("scrolled", window.scrollY > 40);
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  var navToggle = document.querySelector(".nav-toggle");
  var mainNav = document.getElementById("main-nav");
  if (navToggle && mainNav) {
    // Dimming scrim behind the mobile menu (created once, no HTML change needed)
    var scrim = document.createElement("div");
    scrim.className = "nav-scrim";
    scrim.hidden = true;
    document.body.appendChild(scrim);

    function openNav() {
      mainNav.classList.add("open");
      scrim.hidden = false;
      requestAnimationFrame(function () { scrim.classList.add("show"); });
      navToggle.setAttribute("aria-expanded", "true");
      navToggle.textContent = "Close";
      document.body.classList.add("nav-open");
    }
    function closeNav(refocus) {
      if (!mainNav.classList.contains("open")) return;
      mainNav.classList.remove("open");
      scrim.classList.remove("show");
      navToggle.setAttribute("aria-expanded", "false");
      navToggle.textContent = "Menu";
      document.body.classList.remove("nav-open");
      setTimeout(function () { if (!mainNav.classList.contains("open")) scrim.hidden = true; }, 400);
      if (refocus) navToggle.focus();
    }
    navToggle.addEventListener("click", function () {
      mainNav.classList.contains("open") ? closeNav(false) : openNav();
    });
    scrim.addEventListener("click", function () { closeNav(false); });
    // Tapping any menu link closes the menu (before navigation)
    mainNav.addEventListener("click", function (e) {
      if (e.target.closest("a")) closeNav(false);
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape") closeNav(true);
    });
    // Reset cleanly when resizing/rotating up to desktop
    var mqDesktop = window.matchMedia("(min-width: 1025px)");
    var onMq = function () { if (mqDesktop.matches) closeNav(false); };
    if (mqDesktop.addEventListener) mqDesktop.addEventListener("change", onMq);
    else if (mqDesktop.addListener) mqDesktop.addListener(onMq);
    // Safety: restore state on back/forward navigation
    window.addEventListener("pageshow", function () { closeNav(false); });
  }

  /* ================= Page transition (star glow veil) ================= */
  var veil = document.querySelector(".page-veil");
  function isInternalLink(a) {
    if (!a || a.target === "_blank" || a.hasAttribute("download")) return false;
    var href = a.getAttribute("href");
    if (!href || href.charAt(0) === "#" || href.indexOf("mailto:") === 0 || href.indexOf("tel:") === 0) return false;
    if (/^https?:\/\//i.test(href) && a.host !== location.host) return false;
    return true;
  }
  if (veil) {
    document.addEventListener("click", function (e) {
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
      var a = e.target.closest("a");
      if (!a || !isInternalLink(a)) return;
      var href = a.href;
      if (href.split("#")[0] === location.href.split("#")[0] && href.indexOf("#") > -1) return;
      e.preventDefault();
      if (prefersReduced) {
        veil.classList.add("active");
        setTimeout(function () { location.href = href; }, 120);
      } else {
        veil.classList.add("active");
        setTimeout(function () { location.href = href; }, 620);
      }
      // Safety: never trap the visitor if navigation stalls
      setTimeout(function () { veil.classList.remove("active"); }, 4000);
    });
    window.addEventListener("pageshow", function () { veil.classList.remove("active"); });
  }

  /* ================= Hero script line — "written out" on load =================
     Splits "Designed to Be Remembered." into characters and reveals them in
     sequence so the script font appears to be handwritten. The full phrase is
     kept on the parent as aria-label so screen readers announce it normally.
     If JS doesn't run (or reduced motion is on), the line simply displays. */
  var heroScript = document.querySelector(".hero .hero-script");
  if (heroScript && !prefersReduced) {
    var scriptText = heroScript.textContent.trim();
    heroScript.setAttribute("aria-label", scriptText);
    heroScript.textContent = "";
    var startMs = 850, stepMs = 38;
    for (var ci = 0; ci < scriptText.length; ci++) {
      var chSpan = document.createElement("span");
      chSpan.className = "ch";
      chSpan.setAttribute("aria-hidden", "true");
      chSpan.textContent = scriptText.charAt(ci);
      chSpan.style.animationDelay = (startMs + ci * stepMs) + "ms";
      heroScript.appendChild(chSpan);
    }
  }

  /* ================= Reveal on scroll ================= */
  var revealEls = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window && !prefersReduced) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add("visible"); io.unobserve(en.target); }
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -40px 0px" });
    revealEls.forEach(function (el) { io.observe(el); });
  } else {
    revealEls.forEach(function (el) { el.classList.add("visible"); });
  }

  /* ================= Gallery filters + lightbox ================= */
  var filterBar = document.querySelector(".filter-bar");
  var galleryItems = Array.prototype.slice.call(document.querySelectorAll(".masonry .g-item"));
  if (filterBar && galleryItems.length) {
    filterBar.addEventListener("click", function (e) {
      var btn = e.target.closest("button[data-filter]");
      if (!btn) return;
      filterBar.querySelectorAll("button").forEach(function (b) { b.setAttribute("aria-pressed", "false"); });
      btn.setAttribute("aria-pressed", "true");
      var f = btn.getAttribute("data-filter");
      galleryItems.forEach(function (item) {
        var cats = (item.getAttribute("data-cat") || "").split(" ");
        item.classList.toggle("hidden", f !== "all" && cats.indexOf(f) === -1);
      });
    });
  }

  var lightbox = document.querySelector(".lightbox");
  if (lightbox && galleryItems.length) {
    var lbImg = lightbox.querySelector("img");
    var lbCap = lightbox.querySelector(".lb-caption");
    var lbClose = lightbox.querySelector(".lb-close");
    var lbPrev = lightbox.querySelector(".lb-prev");
    var lbNext = lightbox.querySelector(".lb-next");
    var current = -1, lastFocus = null;

    function visibleItems() {
      return galleryItems.filter(function (i) { return !i.classList.contains("hidden"); });
    }
    function openLb(item) {
      var vis = visibleItems();
      current = vis.indexOf(item);
      lastFocus = document.activeElement;
      render(vis);
      lightbox.classList.add("open");
      document.body.style.overflow = "hidden";
      lbClose.focus();
    }
    function render(vis) {
      var item = vis[current];
      var img = item.querySelector("img");
      lbImg.src = img.currentSrc || img.src;
      lbImg.alt = img.alt;
      lbCap.textContent = item.getAttribute("data-caption") || img.alt;
    }
    function closeLb() {
      lightbox.classList.remove("open");
      document.body.style.overflow = "";
      if (lastFocus) lastFocus.focus();
    }
    function step(dir) {
      var vis = visibleItems();
      current = (current + dir + vis.length) % vis.length;
      render(vis);
    }
    galleryItems.forEach(function (item) {
      item.addEventListener("click", function () { openLb(item); });
    });
    lbClose.addEventListener("click", closeLb);
    lbPrev.addEventListener("click", function () { step(-1); });
    lbNext.addEventListener("click", function () { step(1); });
    lightbox.addEventListener("click", function (e) { if (e.target === lightbox) closeLb(); });
    document.addEventListener("keydown", function (e) {
      if (!lightbox.classList.contains("open")) return;
      if (e.key === "Escape") closeLb();
      if (e.key === "ArrowLeft") step(-1);
      if (e.key === "ArrowRight") step(1);
      if (e.key === "Tab") { // simple focus trap among the three buttons
        var f = [lbPrev, lbNext, lbClose];
        var idx = f.indexOf(document.activeElement);
        e.preventDefault();
        var next = e.shiftKey ? (idx <= 0 ? f.length - 1 : idx - 1) : (idx + 1) % f.length;
        f[next].focus();
      }
    });
    // swipe
    var touchX = null;
    lightbox.addEventListener("touchstart", function (e) { touchX = e.changedTouches[0].clientX; }, { passive: true });
    lightbox.addEventListener("touchend", function (e) {
      if (touchX === null) return;
      var dx = e.changedTouches[0].clientX - touchX;
      if (Math.abs(dx) > 48) step(dx > 0 ? -1 : 1);
      touchX = null;
    }, { passive: true });
  }

  /* ================= Generic form handling ================= */
  function setInvalid(field, msg) {
    var wrap = field.closest(".field");
    if (!wrap) return;
    wrap.classList.add("invalid");
    var em = wrap.querySelector(".error-msg");
    if (em && msg) em.textContent = msg;
    field.setAttribute("aria-invalid", "true");
  }
  function clearInvalid(field) {
    var wrap = field.closest(".field");
    if (wrap) wrap.classList.remove("invalid");
    field.removeAttribute("aria-invalid");
  }
  function validateForm(form) {
    var ok = true, firstBad = null;
    form.querySelectorAll("[required]").forEach(function (f) {
      clearInvalid(f);
      var val = (f.value || "").trim();
      if (!val) { setInvalid(f, "This field is required."); ok = false; firstBad = firstBad || f; return; }
      if (f.type === "email" && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(val)) {
        setInvalid(f, "Please enter a valid email address."); ok = false; firstBad = firstBad || f;
      }
      if (f.type === "tel" && val.replace(/\D/g, "").length < 10) {
        setInvalid(f, "Please enter a valid phone number."); ok = false; firstBad = firstBad || f;
      }
    });
    if (firstBad) firstBad.focus();
    return ok;
  }
  function formToLines(form) {
    var lines = [];
    form.querySelectorAll("input, select, textarea").forEach(function (f) {
      if (f.type === "hidden" || f.closest(".hp-field") || f.type === "submit") return;
      var label = f.closest(".field") ? (f.closest(".field").querySelector("label") || {}).textContent : f.name;
      if (f.value) lines.push((label || f.name || "").replace("*", "").trim() + ": " + f.value);
    });
    return lines.join("\n");
  }
  function showStatus(form, kind, msg) {
    var st = form.querySelector(".form-status");
    if (!st) return;
    st.className = "form-status " + kind;
    st.textContent = msg;
    st.setAttribute("role", "status");
  }

  function wireForm(form, opts) {
    if (!form) return;
    var submitting = false;
    form.setAttribute("novalidate", "novalidate");
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      if (submitting) return; // prevent duplicate submissions
      var hp = form.querySelector(".hp-field input");
      if (hp && hp.value) return; // spam honeypot
      if (!validateForm(form)) {
        showStatus(form, "err", "Please review the highlighted fields above.");
        return;
      }
      if (opts && opts.extraValidate && !opts.extraValidate()) return;

      submitting = true;
      var btn = form.querySelector('[type="submit"]');
      var oldTxt = btn ? btn.textContent : "";
      if (btn) { btn.disabled = true; btn.textContent = "Sending…"; }

      var body = (opts && opts.prefix ? opts.prefix + "\n\n" : "") + formToLines(form);

      function done(ok) {
        submitting = false;
        if (btn) { btn.disabled = false; btn.textContent = oldTxt; }
        if (ok) {
          if (opts && opts.onSuccess) { opts.onSuccess(); }
          else { showStatus(form, "ok", opts && opts.successMsg ? opts.successMsg : "Thank you — your message has been prepared. We will be in touch soon."); }
          form.reset();
        } else {
          showStatus(form, "err", "Something went wrong sending your request. Please email us directly at " + BUSINESS_EMAIL + " or call (352) 349-9494.");
        }
      }

      if (FORM_ENDPOINT) {
        fetch(FORM_ENDPOINT, {
          method: "POST",
          headers: { "Content-Type": "application/json", "Accept": "application/json" },
          body: JSON.stringify({ subject: (opts && opts.subject) || "Website inquiry — Cherish Moments Decor", message: body })
        }).then(function (r) { done(r.ok); }).catch(function () { done(false); });
      } else {
        // No backend connected yet: open the visitor's email app with the
        // request pre-addressed to the studio. The request is real — it is
        // sent through the visitor's own email.
        var mail = "mailto:" + BUSINESS_EMAIL +
          "?subject=" + encodeURIComponent((opts && opts.subject) || "Website inquiry — Cherish Moments Decor") +
          "&body=" + encodeURIComponent(body);
        window.location.href = mail;
        setTimeout(function () { done(true); }, 400);
      }
    });
    form.querySelectorAll("input, select, textarea").forEach(function (f) {
      f.addEventListener("input", function () { clearInvalid(f); });
    });
  }

  // Contact page form
  wireForm(document.getElementById("contact-form"), {
    subject: "Contact request — Cherish Moments Decor website",
    successMsg: "Thank you — your message is on its way. We respond to inquiries as quickly as possible."
  });

  // Shop priority list form
  wireForm(document.getElementById("priority-form"), {
    subject: "Priority List signup — Cherish Moments Collection",
    successMsg: "Welcome to the Priority List. You will be among the first to hear when the collection arrives."
  });

  /* ================= Booking calendar ================= */
  var calRoot = document.getElementById("cal");
  if (calRoot) {
    var monthTitle = document.getElementById("cal-title");
    var grid = document.getElementById("cal-grid");
    var prevBtn = document.getElementById("cal-prev");
    var nextBtn = document.getElementById("cal-next");
    var summary = document.getElementById("booking-summary");
    var dateInput = document.getElementById("bk-date");

    var today = new Date(); today.setHours(0, 0, 0, 0);
    var minDate = new Date(today); minDate.setDate(minDate.getDate() + BOOKING.minLeadDays);
    var maxDate = new Date(today); maxDate.setDate(maxDate.getDate() + BOOKING.daysAhead);
    var view = new Date(minDate.getFullYear(), minDate.getMonth(), 1);
    var selDate = null;

    // Constrain the native consultation-date picker to the same booking window.
    (function () {
      var ci = document.getElementById("bk-consult-date");
      if (!ci) return;
      function iso(d) {
        return d.getFullYear() + "-" +
          String(d.getMonth() + 1).padStart(2, "0") + "-" +
          String(d.getDate()).padStart(2, "0");
      }
      ci.min = iso(minDate);
      ci.max = iso(maxDate);
    })();

    var MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];
    var fmt = function (d) {
      return d.toLocaleDateString(undefined, { weekday: "long", year: "numeric", month: "long", day: "numeric" });
    };

    function renderCal() {
      monthTitle.textContent = MONTHS[view.getMonth()] + " " + view.getFullYear();
      grid.querySelectorAll(".day").forEach(function (n) { n.remove(); });
      var first = new Date(view.getFullYear(), view.getMonth(), 1);
      var startPad = first.getDay();
      var daysInMonth = new Date(view.getFullYear(), view.getMonth() + 1, 0).getDate();
      for (var p = 0; p < startPad; p++) {
        var pad = document.createElement("span");
        pad.className = "day"; pad.setAttribute("aria-hidden", "true"); pad.style.visibility = "hidden";
        grid.appendChild(pad);
      }
      for (var d = 1; d <= daysInMonth; d++) {
        var date = new Date(view.getFullYear(), view.getMonth(), d);
        var b = document.createElement("button");
        b.type = "button"; b.className = "day"; b.textContent = d;
        b.setAttribute("aria-label", fmt(date));
        var closed = BOOKING.closedWeekdays.indexOf(date.getDay()) !== -1;
        if (date < minDate || date > maxDate || closed) {
          b.disabled = true;
        } else {
          (function (date) {
            b.addEventListener("click", function () {
              selDate = date;
              grid.querySelectorAll(".day.selected").forEach(function (n) { n.classList.remove("selected"); });
              this.classList.add("selected");
              updateSummary();
            });
          })(date);
        }
        if (selDate && date.getTime() === selDate.getTime()) b.classList.add("selected");
        grid.appendChild(b);
      }
      var prevMonthEnd = new Date(view.getFullYear(), view.getMonth(), 0);
      prevBtn.disabled = prevMonthEnd < minDate;
      var nextMonthStart = new Date(view.getFullYear(), view.getMonth() + 1, 1);
      nextBtn.disabled = nextMonthStart > maxDate;
    }
    function updateSummary() {
      if (dateInput) dateInput.value = selDate ? fmt(selDate) : "";
      if (!summary) return;
      if (selDate) {
        summary.hidden = false;
        summary.innerHTML = "<strong>Requested installation date:</strong> " + fmt(selDate) +
          "<br><span class='small'>This is a request — our team will confirm availability with you directly.</span>";
      } else {
        summary.hidden = true;
      }
    }
    prevBtn.addEventListener("click", function () { view.setMonth(view.getMonth() - 1); renderCal(); });
    nextBtn.addEventListener("click", function () { view.setMonth(view.getMonth() + 1); renderCal(); });
    renderCal();

    /* Booking form submission — posts structured JSON to the automation API
       (/api/book-consultation), then redirects to the branded confirmation
       page. The backend saves the request and sends the email/SMS/staff alert. */
    var bookingForm = document.getElementById("booking-form");
    var BOOKING_ENDPOINT = "/api/book-consultation";
    // One idempotency key per page load → prevents duplicate records if the
    // visitor double-clicks or the network retries.
    var idempotencyKey = (window.crypto && crypto.randomUUID)
      ? crypto.randomUUID()
      : "bk-" + Date.now() + "-" + Math.random().toString(16).slice(2);

    if (bookingForm) {
      var val = function (id) { var el = document.getElementById(id); return el ? el.value.trim() : ""; };
      bookingForm.setAttribute("novalidate", "novalidate");
      var submitting = false;

      bookingForm.addEventListener("submit", function (e) {
        e.preventDefault();
        if (submitting) return;
        var hp = bookingForm.querySelector(".hp-field input");
        if (hp && hp.value) return; // spam honeypot
        if (!validateForm(bookingForm)) {
          showStatus(bookingForm, "err", "Please review the highlighted fields above.");
          return;
        }
        if (!selDate) {
          showStatus(bookingForm, "err", "Please select a preferred installation date from the calendar before submitting.");
          return;
        }

        var payload = {
          idempotency_key: idempotencyKey,
          first_name: val("bk-first"),
          last_name: val("bk-last"),
          email: val("bk-email"),
          phone: val("bk-phone"),
          project_type: val("bk-type"),
          city: val("bk-city"),
          preferred_installation_date: val("bk-date"),
          consultation_date: (function () {
            var v = val("bk-consult-date");
            if (!v) return "";
            var p = v.split("-"); // native date input value is YYYY-MM-DD
            var d = new Date(+p[0], (+p[1]) - 1, +p[2]);
            return isNaN(d) ? v : d.toLocaleDateString(undefined, { weekday: "long", year: "numeric", month: "long", day: "numeric" });
          })(),
          tree_height: val("bk-height"),
          tree_count: val("bk-count"),
          areas: val("bk-areas"),
          budget: val("bk-budget"),
          format: val("bk-format"),
          notes: val("bk-notes"),
          company_website: hp ? hp.value : ""
        };

        submitting = true;
        var btn = bookingForm.querySelector('[type="submit"]');
        var label = btn ? btn.textContent : "";
        if (btn) { btn.disabled = true; btn.textContent = "Sending…"; }
        showStatus(bookingForm, "", "");

        fetch(BOOKING_ENDPOINT, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        }).then(function (r) {
          if (!r.ok) throw new Error("bad_status");
          window.location.href = "/thank-you"; // branded confirmation page
        }).catch(function () {
          submitting = false;
          if (btn) { btn.disabled = false; btn.textContent = label; }
          showStatus(bookingForm, "err",
            "We couldn't submit your request just now. Please try again, or call (352) 349-9494 and we'll be glad to help.");
        });
      });

      bookingForm.querySelectorAll("input, select, textarea").forEach(function (f) {
        f.addEventListener("input", function () { clearInvalid(f); });
      });
    }
  }

  /* ================= Footer year ================= */
  var yr = document.getElementById("copyright-year");
  if (yr) yr.textContent = new Date().getFullYear();

})();
