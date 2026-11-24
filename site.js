(function () {
  "use strict";

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  var canObserve = "IntersectionObserver" in window;

  /* ---------- Barra superior: menú móvil y sección activa ---------- */
  var top = document.getElementById("top");
  var menuBtn = document.querySelector(".menu-btn");
  var nav = document.getElementById("nav");

  function setMenu(open) {
    nav.classList.toggle("is-open", open);
    menuBtn.setAttribute("aria-expanded", String(open));
    menuBtn.textContent = open ? "Cerrar" : "Menú";
  }
  menuBtn.addEventListener("click", function () {
    setMenu(menuBtn.getAttribute("aria-expanded") !== "true");
  });
  nav.addEventListener("click", function (e) {
    if (e.target.closest("a")) setMenu(false);
  });
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && nav.classList.contains("is-open")) {
      setMenu(false);
      menuBtn.focus();
    }
  });
  document.addEventListener("click", function (e) {
    if (nav.classList.contains("is-open") && !top.contains(e.target)) setMenu(false);
  });

  function onScroll() { top.classList.toggle("is-scrolled", window.scrollY > 8); }
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  var navLinks = Array.prototype.slice.call(nav.querySelectorAll("a"));
  if (canObserve) {
    var spy = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        navLinks.forEach(function (a) {
          if (a.getAttribute("href") === "#" + entry.target.id) a.setAttribute("aria-current", "true");
          else a.removeAttribute("aria-current");
        });
      });
    }, { rootMargin: "-45% 0px -50% 0px" });
    navLinks.forEach(function (a) {
      var s = document.querySelector(a.getAttribute("href"));
      if (s) spy.observe(s);
    });
  }

  /* ---------- Aparición suave ---------- */
  if (canObserve && !reduceMotion.matches) {
    var revealer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-in");
          revealer.unobserve(entry.target);
        }
      });
    }, { rootMargin: "0px 0px -8% 0px" });
    document.querySelectorAll(
      ".scene__copy, .actib__shot, .week, .oyetris__head, .reel, .contact"
    ).forEach(function (el) {
      el.classList.add("reveal");
      revealer.observe(el);
    });
  }

  /* ---------- Conversación de Whaapy ---------- */
  var chat = document.querySelector(".chat");
  var log = document.getElementById("chat-log");
  var steps = Array.prototype.slice.call(log.querySelectorAll("[data-step]"));
  var label = chat.querySelector(".chat__label");
  var stateEl = document.getElementById("chat-state");
  var replay = document.getElementById("chat-replay");
  var timers = [];
  var typing = null;

  function setState(human) {
    stateEl.textContent = human ? "entra Ana, con el contexto" : "contesta la IA";
    label.classList.toggle("is-human", human);
  }
  function dropTyping() {
    if (typing && typing.parentNode) typing.parentNode.removeChild(typing);
    typing = null;
  }
  function clearTimers() {
    timers.forEach(clearTimeout);
    timers = [];
    dropTyping();
  }
  function showAll() {
    clearTimers();
    steps.forEach(function (s) { s.classList.add("is-shown"); });
    setState(true);
  }
  function makeTyping(human) {
    var li = document.createElement("li");
    li.className = "typing" + (human ? " typing--human" : "");
    li.setAttribute("aria-hidden", "true");
    li.innerHTML = "<i></i><i></i><i></i>";
    return li;
  }
  function play() {
    if (reduceMotion.matches) { showAll(); return; }
    clearTimers();
    chat.classList.add("is-animated");
    steps.forEach(function (s) { s.classList.remove("is-shown"); });
    setState(false);

    var t = 300;
    steps.forEach(function (step) {
      var isAI = step.classList.contains("msg--ai");
      var isHuman = step.classList.contains("msg--human");
      var isHandoff = step.classList.contains("handoff");
      if (isAI || isHuman) {
        timers.push(setTimeout(function () {
          typing = makeTyping(isHuman);
          log.insertBefore(typing, step);
        }, t));
        t += 1100;
      }
      timers.push(setTimeout(function () {
        dropTyping();
        step.classList.add("is-shown");
        if (isHandoff) setState(true);
      }, t));
      t += isHandoff ? 1600 : 1000;
    });
  }

  replay.addEventListener("click", play);
  if (canObserve && !reduceMotion.matches) {
    chat.classList.add("is-animated");
    var chatSeen = new IntersectionObserver(function (entries) {
      if (entries[0].isIntersecting) { play(); chatSeen.disconnect(); }
    }, { threshold: 0.35 });
    chatSeen.observe(chat);
  } else {
    showAll();
  }

  /* ---------- Semana de actib.ai ---------- */
  // [día, sesión, clases, etiqueta]
  var WEEK = {
    "tab-plan": {
      note: "una semana normal: dos días de fuerza, tres de carrera y dos de descanso.",
      days: [
        ["lun", "Fuerza, tren inferior", "fuerza", "fuerza"],
        ["mar", "Rodaje 8 km", "run", "carrera"],
        ["mié", "Descanso", "rest", "descanso"],
        ["jue", "Series 6 × 800 m", "run", "carrera"],
        ["vie", "Fuerza, tren superior", "fuerza", "fuerza"],
        ["sáb", "Fondo 18 km", "run", "carrera"],
        ["dom", "Descanso", "rest", "descanso"]
      ]
    },
    "tab-real": {
      note: "el martes no saliste a correr. la fuerza del lunes sí quedó.",
      days: [
        ["lun", "Fuerza, tren inferior", "fuerza done", "hecho"],
        ["mar", "Rodaje 8 km", "miss", "no se hizo"],
        ["mié", "Descanso", "rest", "descanso"],
        ["jue", "Series 6 × 800 m", "run", "pendiente"],
        ["vie", "Fuerza, tren superior", "fuerza", "pendiente"],
        ["sáb", "Fondo 18 km", "run", "pendiente"],
        ["dom", "Descanso", "rest", "descanso"]
      ]
    },
    "tab-ajuste": {
      note: "el jueves recupera el rodaje en lugar de las series y el fondo baja a 16 km. la fuerza del viernes se queda.",
      days: [
        ["lun", "Fuerza, tren inferior", "fuerza done", "hecho"],
        ["mar", "Rodaje 8 km", "miss", "no se hizo"],
        ["mié", "Descanso", "rest", "descanso"],
        ["jue", "Rodaje suave 8 km", "run changed", "cambió"],
        ["vie", "Fuerza, tren superior", "fuerza", "fuerza"],
        ["sáb", "Fondo 16 km", "run changed", "cambió"],
        ["dom", "Descanso", "rest", "descanso"]
      ]
    }
  };

  var tabs = Array.prototype.slice.call(document.querySelectorAll(".week__tabs [role=tab]"));
  var panel = document.getElementById("week-panel");
  var daysEl = document.getElementById("week-days");
  var noteEl = document.getElementById("week-note");

  function renderWeek(id) {
    var data = WEEK[id];
    daysEl.innerHTML = "";
    data.days.forEach(function (d) {
      var li = document.createElement("li");
      li.className = "day " + d[2].split(" ").map(function (c) { return "day--" + c; }).join(" ");
      li.innerHTML =
        '<div class="day__body"><span class="day__kind"></span><span class="day__s"></span></div><p class="day__d"></p>';
      li.querySelector(".day__kind").textContent = d[3];
      li.querySelector(".day__s").textContent = d[1];
      li.querySelector(".day__d").textContent = d[0];
      daysEl.appendChild(li);
    });
    noteEl.textContent = data.note;
  }

  function selectTab(tab, focus) {
    tabs.forEach(function (t) {
      var on = t === tab;
      t.setAttribute("aria-selected", String(on));
      t.tabIndex = on ? 0 : -1;
    });
    panel.setAttribute("aria-labelledby", tab.id);
    renderWeek(tab.id);
    if (focus) tab.focus();
  }

  tabs.forEach(function (tab, i) {
    tab.addEventListener("click", function () { selectTab(tab, false); });
    tab.addEventListener("keydown", function (e) {
      var next = null;
      if (e.key === "ArrowRight") next = tabs[(i + 1) % tabs.length];
      else if (e.key === "ArrowLeft") next = tabs[(i - 1 + tabs.length) % tabs.length];
      else if (e.key === "Home") next = tabs[0];
      else if (e.key === "End") next = tabs[tabs.length - 1];
      if (next) { e.preventDefault(); selectTab(next, true); }
    });
  });
  renderWeek("tab-plan");

  /* ---------- Reproductor de oyetris ---------- */
  var dialog = document.getElementById("player");
  var video = document.getElementById("player-video");
  var title = document.getElementById("player-title");
  var closeBtn = document.getElementById("player-close");
  var lastTrigger = null;

  if (typeof dialog.showModal === "function") {
    document.querySelectorAll("[data-video]").forEach(function (link) {
      link.addEventListener("click", function (e) {
        e.preventDefault();
        lastTrigger = link;
        title.textContent = link.getAttribute("data-title");
        video.poster = link.getAttribute("data-poster");
        video.src = link.getAttribute("data-video");
        video.setAttribute("aria-label", "Video de oyetris: " + link.getAttribute("data-title"));
        dialog.showModal();
        var p = video.play();
        if (p && p.catch) p.catch(function () {});
      });
    });
    closeBtn.addEventListener("click", function () { dialog.close(); });
    dialog.addEventListener("click", function (e) { if (e.target === dialog) dialog.close(); });
    dialog.addEventListener("close", function () {
      video.pause();
      video.removeAttribute("src");
      video.load();
      if (lastTrigger) lastTrigger.focus();
    });
  }
})();
