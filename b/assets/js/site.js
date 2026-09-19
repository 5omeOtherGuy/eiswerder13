/* denk-mal EISWERDER13 — minimal vanilla JS
   - mailto request form (no backend, no third party)
   - lightweight lightbox (keyboard usable)
   - small nav helpers
   No cookies, no tracking, no external requests. */
(function () {
  "use strict";

  /* ================================================================
   * UI TEXT (German). For the English version, translate ONLY this
   * object — nothing else in this file contains page language.
   * ================================================================ */
  var STRINGS = {
    /* lightbox */
    lbDialogLabel: "Bildansicht",
    lbClose: "Schließen",
    lbPrev: "Vorheriges Bild",
    lbNext: "Nächstes Bild",
    /* copy fallback */
    copied: "Text kopiert ✓",
    /* request e-mail (mailto builder) */
    mailSubject1: "Anfrage InselSalon – ",
    mailSubject2: " am ",
    mailHeader: "Anfrage InselSalon EISWERDER13",
    mailName: "Name",
    mailEmail: "E-Mail",
    mailPhone: "Telefon",
    mailKind: "Art der Veranstaltung",
    mailDate: "Wunschtermin",
    mailDateAlt: "Alternativtermin",
    mailTime: "Uhrzeit",
    mailTimeUntil: " bis ",
    mailDuration: "Dauer",
    mailPersons: "Personenzahl",
    mailNeeds: "Bedarf",
    mailMessage: "Nachricht:",
    mailNone: "–"
  };

  /* ---------- mobile nav: close on Escape / link click ---------- */
  var burger = document.querySelector(".burger");
  if (burger) {
    burger.addEventListener("keydown", function (e) {
      if (e.key === "Escape") burger.removeAttribute("open");
    });
    burger.addEventListener("click", function (e) {
      if (e.target.closest("a")) burger.removeAttribute("open");
    });
  }

  /* ---------- request form → mailto ---------- */
  var form = document.getElementById("anfrage-form");
  if (form) {
    var after = document.getElementById("form-after");
    var copyBtn = document.getElementById("copy-text");
    var lastBody = "";

    var fmtDate = function (iso) {
      if (!iso) return "";
      var p = iso.split("-");
      return p.length === 3 ? p[2] + "." + p[1] + "." + p[0] : iso;
    };

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      if (!form.checkValidity()) { form.reportValidity(); return; }

      var el = form.elements;
      var val = function (n) { return el[n] ? el[n].value.trim() : ""; };
      var art = val("art");
      var termin = fmtDate(val("termin"));

      var lines = [
        STRINGS.mailHeader,
        "================================",
        "",
        STRINGS.mailName + ": " + val("name"),
        STRINGS.mailEmail + ": " + val("email"),
        STRINGS.mailPhone + ": " + (val("telefon") || STRINGS.mailNone),
        "",
        STRINGS.mailKind + ": " + art,
        STRINGS.mailDate + ": " + termin,
        STRINGS.mailDateAlt + ": " + (fmtDate(val("alternativ")) || STRINGS.mailNone),
        STRINGS.mailTime + ": " + (val("von") || STRINGS.mailNone) + STRINGS.mailTimeUntil + (val("bis") || STRINGS.mailNone),
        STRINGS.mailDuration + ": " + (val("dauer") || STRINGS.mailNone),
        STRINGS.mailPersons + ": " + (val("personen") || STRINGS.mailNone)
      ];

      var bedarf = [];
      form.querySelectorAll('input[name="bedarf"]:checked').forEach(function (c) {
        bedarf.push(c.value);
      });
      lines.push(STRINGS.mailNeeds + ": " + (bedarf.length ? bedarf.join(", ") : STRINGS.mailNone));
      lines.push("");
      lines.push(STRINGS.mailMessage);
      lines.push(val("nachricht") || STRINGS.mailNone);

      var subject = STRINGS.mailSubject1 + art + STRINGS.mailSubject2 + termin;
      var body = lines.join("\r\n");
      lastBody = subject + "\r\n\r\n" + body;

      // show the fallback note first so it is visible even if the
      // mail client blocks or swallows the navigation
      if (after) {
        after.hidden = false;
        after.scrollIntoView({ block: "center" });
      }
      try {
        window.location.href =
          "mailto:info@eiswerder13.org?subject=" + encodeURIComponent(subject) +
          "&body=" + encodeURIComponent(body);
      } catch (err) { /* note with mail + phone is already visible */ }
    });

    if (copyBtn) {
      copyBtn.addEventListener("click", function () {
        var done = function () { copyBtn.textContent = STRINGS.copied; };
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(lastBody).then(done, function () { fallbackCopy(); });
        } else { fallbackCopy(); }
        function fallbackCopy() {
          var ta = document.createElement("textarea");
          ta.value = lastBody;
          document.body.appendChild(ta);
          ta.select();
          try { document.execCommand("copy"); done(); } catch (err) { /* leave label */ }
          document.body.removeChild(ta);
        }
      });
    }
  }

  /* ---------- lightbox ---------- */
  var lbLinks = Array.prototype.slice.call(document.querySelectorAll("a[data-lightbox]"));
  if (lbLinks.length) {
    var lb = document.createElement("div");
    lb.className = "lightbox";
    lb.setAttribute("role", "dialog");
    lb.setAttribute("aria-modal", "true");
    lb.setAttribute("aria-label", STRINGS.lbDialogLabel);
    lb.hidden = true;
    lb.innerHTML =
      '<button type="button" class="lb-btn lb-close" aria-label="' + STRINGS.lbClose + '">×</button>' +
      '<button type="button" class="lb-btn lb-prev" aria-label="' + STRINGS.lbPrev + '">←</button>' +
      '<img alt="">' +
      '<p class="lb-cap"></p>' +
      '<button type="button" class="lb-btn lb-next" aria-label="' + STRINGS.lbNext + '">→</button>';
    document.body.appendChild(lb);

    var lbImg = lb.querySelector("img");
    var lbCap = lb.querySelector(".lb-cap");
    var idx = 0;
    var lastFocus = null;

    var show = function (i) {
      idx = (i + lbLinks.length) % lbLinks.length;
      var a = lbLinks[idx];
      lbImg.src = a.getAttribute("href");
      var cap = a.getAttribute("data-caption") || "";
      lbImg.alt = cap;
      lbCap.textContent = cap;
    };
    var open = function (i) {
      lastFocus = document.activeElement;
      show(i);
      lb.hidden = false;
      document.body.style.overflow = "hidden";
      lb.querySelector(".lb-close").focus();
    };
    var close = function () {
      lb.hidden = true;
      document.body.style.overflow = "";
      if (lastFocus) lastFocus.focus();
    };

    lbLinks.forEach(function (a, i) {
      a.addEventListener("click", function (e) { e.preventDefault(); open(i); });
    });
    lb.querySelector(".lb-close").addEventListener("click", close);
    lb.querySelector(".lb-prev").addEventListener("click", function () { show(idx - 1); });
    lb.querySelector(".lb-next").addEventListener("click", function () { show(idx + 1); });
    lb.addEventListener("click", function (e) { if (e.target === lb) close(); });
    document.addEventListener("keydown", function (e) {
      if (lb.hidden) return;
      if (e.key === "Escape") close();
      else if (e.key === "ArrowLeft") show(idx - 1);
      else if (e.key === "ArrowRight") show(idx + 1);
      else if (e.key === "Tab") { /* simple focus trap */
        var btns = lb.querySelectorAll("button");
        var first = btns[0], last = btns[btns.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    });
  }
})();
