/* denk-mal EISWERDER13 — minimal vanilla JS
   - mailto request form (no backend, no third party)
   - lightweight lightbox (keyboard usable)
   - small nav helpers
   No cookies, no tracking, no external requests. */
(function () {
  "use strict";

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
        "Anfrage InselSalon EISWERDER13",
        "================================",
        "",
        "Name: " + val("name"),
        "E-Mail: " + val("email"),
        "Telefon: " + (val("telefon") || "–"),
        "",
        "Art der Veranstaltung: " + art,
        "Wunschtermin: " + termin,
        "Alternativtermin: " + (fmtDate(val("alternativ")) || "–"),
        "Uhrzeit: " + (val("von") || "–") + " bis " + (val("bis") || "–"),
        "Dauer: " + (val("dauer") || "–"),
        "Personenzahl: " + (val("personen") || "–")
      ];

      var bedarf = [];
      form.querySelectorAll('input[name="bedarf"]:checked').forEach(function (c) {
        bedarf.push(c.value);
      });
      lines.push("Bedarf: " + (bedarf.length ? bedarf.join(", ") : "–"));
      lines.push("");
      lines.push("Nachricht:");
      lines.push(val("nachricht") || "–");

      var subject = "Anfrage InselSalon – " + art + " am " + termin;
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
        var done = function () { copyBtn.textContent = "Text kopiert ✓"; };
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
    lb.setAttribute("aria-label", "Bildansicht");
    lb.hidden = true;
    lb.innerHTML =
      '<button type="button" class="lb-btn lb-close" aria-label="Schließen">×</button>' +
      '<button type="button" class="lb-btn lb-prev" aria-label="Vorheriges Bild">←</button>' +
      '<img alt="">' +
      '<p class="lb-cap"></p>' +
      '<button type="button" class="lb-btn lb-next" aria-label="Nächstes Bild">→</button>';
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
