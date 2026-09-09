/* ==========================================================================
   AMBRA — Cocktail Bar, Torino — main.js
   Routing tra viste, animazioni scroll, contatori, parallax, lightbox
   ========================================================================== */
(function () {
  "use strict";

  /* ------------------------------------------------------------------
     1. ROUTER
     Ogni <section class="view" data-view="..."> viene mostrata/nascosta
     in base all'hash. Le sotto-rotte del menu usano #/menu/<categoria>.
     ------------------------------------------------------------------ */
  var views = Array.prototype.slice.call(document.querySelectorAll(".view"));
  var navLinks = Array.prototype.slice.call(document.querySelectorAll("[data-route]"));
  var homeAnchors = ["chi-siamo", "cocktail-in-evidenza", "galleria", "contatti"];

  function parseHash() {
    var hash = window.location.hash.replace(/^#\/?/, "");
    if (!hash) return { view: "home", sub: null };
    var parts = hash.split("/").filter(Boolean);
    if (parts[0] === "menu" && parts[1]) return { view: "menu-detail", sub: parts[1] };
    if (parts[0] === "menu") return { view: "menu", sub: null };
    if (homeAnchors.indexOf(parts[0]) !== -1) return { view: "home", sub: parts[0] };
    return { view: "home", sub: null };
  }

  function showView(name) {
    views.forEach(function (v) {
      var match = v.getAttribute("data-view") === name;
      v.classList.toggle("active", match);
    });
  }

  function updateActiveNav(route) {
    navLinks.forEach(function (a) {
      var target = a.getAttribute("data-route");
      var isActive = false;
      if (route.view === "home" && !route.sub) isActive = target === "home";
      else if (route.view === "home" && route.sub) isActive = target === route.sub;
      else if (route.view === "menu") isActive = target === "menu";
      else if (route.view === "menu-detail") isActive = target === "menu" || target === route.sub;
      a.classList.toggle("active", isActive);
    });
  }

  function setCategoryDetail(slug) {
    var all = document.querySelectorAll("[data-category]");
    var found = false;
    all.forEach(function (el) {
      var match = el.getAttribute("data-category") === slug;
      el.classList.toggle("cat-active", match);
      el.style.display = match ? "" : "none";
      if (match) found = true;
    });
    return found;
  }

  function render(fromPopstate) {
    var route = parseHash();

    if (route.view === "menu-detail") {
      var ok = setCategoryDetail(route.sub);
      showView(ok ? "menu-detail" : "menu");
    } else {
      showView(route.view);
    }

    updateActiveNav(route);
    closeMobileNav();

    // Scroll behaviour: top on view change, smooth to anchor within home
    if (route.view === "home" && route.sub) {
      var target = document.getElementById(route.sub);
      if (target) {
        window.requestAnimationFrame(function () {
          target.scrollIntoView({ behavior: "smooth", block: "start" });
        });
      }
    } else if (!fromPopstate) {
      window.scrollTo({ top: 0, behavior: "instant" in window ? "instant" : "auto" });
    }

    // Re-trigger reveal check for newly visible view
    checkReveals();
  }

  window.addEventListener("hashchange", function () { render(false); });
  document.addEventListener("DOMContentLoaded", function () { render(false); });

  /* ------------------------------------------------------------------
     2. HEADER: scroll shadow + mobile toggle
     ------------------------------------------------------------------ */
  var header = document.querySelector(".site-header");
  var navToggle = document.querySelector(".nav-toggle");

  function onScrollHeader() {
    if (!header) return;
    header.classList.toggle("scrolled", window.scrollY > 40);
  }
  window.addEventListener("scroll", onScrollHeader, { passive: true });
  onScrollHeader();

  function closeMobileNav() {
    if (header) header.classList.remove("mobile-open");
    if (navToggle) navToggle.classList.remove("open");
  }
  if (navToggle) {
    navToggle.addEventListener("click", function () {
      header.classList.toggle("mobile-open");
      navToggle.classList.toggle("open");
    });
  }

  /* ------------------------------------------------------------------
     3. INTERSECTION OBSERVER — reveal on scroll
     ------------------------------------------------------------------ */
  var revealObserver = new IntersectionObserver(
    function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add("in-view");
          revealObserver.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.15, rootMargin: "0px 0px -60px 0px" }
  );

  function checkReveals() {
    document.querySelectorAll(".reveal:not(.in-view)").forEach(function (el) {
      revealObserver.observe(el);
    });
  }
  checkReveals();

  /* ------------------------------------------------------------------
     4. ANIMATED COUNTERS
     ------------------------------------------------------------------ */
  function animateCounter(el) {
    var raw = el.getAttribute("data-count-to") || el.textContent;
    var suffix = el.getAttribute("data-suffix") || "";
    var decimals = raw.indexOf(".") !== -1 ? raw.split(".")[1].length : 0;
    var target = parseFloat(raw);
    if (isNaN(target)) return;
    var duration = 1800;
    var start = null;

    function step(ts) {
      if (start === null) start = ts;
      var progress = Math.min((ts - start) / duration, 1);
      var eased = 1 - Math.pow(1 - progress, 3); // ease-out cubic
      var value = target * eased;
      el.textContent = value.toFixed(decimals) + suffix;
      if (progress < 1) {
        window.requestAnimationFrame(step);
      } else {
        el.textContent = target.toFixed(decimals) + suffix;
      }
    }
    window.requestAnimationFrame(step);
  }

  var counterObserver = new IntersectionObserver(
    function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          animateCounter(entry.target);
          counterObserver.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.6 }
  );
  document.querySelectorAll(".stat-number").forEach(function (el) {
    counterObserver.observe(el);
  });

  /* ------------------------------------------------------------------
     5. PARALLAX HERO
     ------------------------------------------------------------------ */
  var heroMedia = document.querySelector(".hero-media");
  var ticking = false;
  function updateParallax() {
    if (!heroMedia) { ticking = false; return; }
    var y = window.scrollY;
    if (y < window.innerHeight * 1.2) {
      heroMedia.style.transform = "translate3d(0," + (y * 0.32) + "px,0)";
    }
    ticking = false;
  }
  window.addEventListener(
    "scroll",
    function () {
      if (!ticking) {
        window.requestAnimationFrame(updateParallax);
        ticking = true;
      }
    },
    { passive: true }
  );

  /* ------------------------------------------------------------------
     6. GALLERY LIGHTBOX
     ------------------------------------------------------------------ */
  var galleryItems = Array.prototype.slice.call(document.querySelectorAll(".gallery-item"));
  var lightbox = document.querySelector(".lightbox");
  var lightboxImg = lightbox ? lightbox.querySelector("img") : null;
  var lightboxCaption = lightbox ? lightbox.querySelector(".lightbox-caption span") : null;
  var currentIndex = 0;

  function openLightbox(index) {
    if (!lightbox || !galleryItems.length) return;
    currentIndex = (index + galleryItems.length) % galleryItems.length;
    var item = galleryItems[currentIndex];
    var img = item.querySelector("img");
    lightboxImg.src = img.getAttribute("data-full") || img.src;
    lightboxImg.alt = img.alt || "";
    if (lightboxCaption) lightboxCaption.textContent = img.getAttribute("data-caption") || img.alt || "";
    lightbox.classList.add("open");
    document.body.style.overflow = "hidden";
  }

  function closeLightbox() {
    if (!lightbox) return;
    lightbox.classList.remove("open");
    document.body.style.overflow = "";
  }

  galleryItems.forEach(function (item, i) {
    item.addEventListener("click", function () { openLightbox(i); });
  });

  if (lightbox) {
    var closeBtn = lightbox.querySelector(".lightbox-close");
    var prevBtn = lightbox.querySelector(".lightbox-prev");
    var nextBtn = lightbox.querySelector(".lightbox-next");
    if (closeBtn) closeBtn.addEventListener("click", closeLightbox);
    if (prevBtn) prevBtn.addEventListener("click", function () { openLightbox(currentIndex - 1); });
    if (nextBtn) nextBtn.addEventListener("click", function () { openLightbox(currentIndex + 1); });
    lightbox.addEventListener("click", function (e) {
      if (e.target === lightbox) closeLightbox();
    });
    document.addEventListener("keydown", function (e) {
      if (!lightbox.classList.contains("open")) return;
      if (e.key === "Escape") closeLightbox();
      if (e.key === "ArrowRight") openLightbox(currentIndex + 1);
      if (e.key === "ArrowLeft") openLightbox(currentIndex - 1);
    });
  }

  /* ------------------------------------------------------------------
     7. CONTACT FORM (demo — no backend)
     ------------------------------------------------------------------ */
  var contactForm = document.querySelector(".contact-form");
  if (contactForm) {
    contactForm.addEventListener("submit", function (e) {
      e.preventDefault();
      var btn = contactForm.querySelector("button[type='submit']");
      if (!btn) return;
      var original = btn.textContent;
      btn.textContent = "Richiesta inviata";
      btn.disabled = true;
      setTimeout(function () {
        btn.textContent = original;
        btn.disabled = false;
        contactForm.reset();
      }, 2400);
    });
  }

  /* ------------------------------------------------------------------
     8. Footer year
     ------------------------------------------------------------------ */
  var yearEl = document.querySelector("[data-year]");
  if (yearEl) yearEl.textContent = new Date().getFullYear();
})();
