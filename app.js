const DECKS = [
  { id: "needs", file: "data/needs.json", label: "Needs" },
  { id: "feelings-met", file: "data/feelings-met.json", label: "Feelings, met" },
  { id: "feelings-unmet", file: "data/feelings-unmet.json", label: "Feelings, unmet" },
];

const STORE_KEY = "nvc-cards:v1";
const cardEl = document.getElementById("card");
const doneEl = document.getElementById("card-done");
const groupEl = document.getElementById("card-group");
const wordEl = document.getElementById("card-word");
const exampleEl = document.getElementById("card-example");
const hintEl = document.getElementById("card-hint");
const subtitleEl = document.getElementById("deck-subtitle");
const counterEl = document.getElementById("counter");
const progressEl = document.getElementById("progress-bar");
const themeBtn = document.getElementById("theme-toggle");

let decks = {};
let state = loadState();
let revealed = false;

function loadState() {
  const fallback = { deck: "needs", order: {}, index: {}, theme: null };
  try {
    const raw = localStorage.getItem(STORE_KEY);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw);
    return {
      deck: parsed.deck || "needs",
      order: parsed.order || {},
      index: parsed.index || {},
      theme: parsed.theme || null,
    };
  } catch (e) {
    return fallback;
  }
}

function saveState() {
  try {
    localStorage.setItem(STORE_KEY, JSON.stringify(state));
  } catch (e) {
    // Storage full or unavailable. Progress just won't persist.
  }
}

function applyTheme() {
  const theme = state.theme ||
    (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
  document.documentElement.setAttribute("data-theme", theme);
  themeBtn.textContent = theme === "dark" ? "Light" : "Dark";
}

function shuffledOrder(n) {
  const order = Array.from({ length: n }, (_, i) => i);
  for (let i = order.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [order[i], order[j]] = [order[j], order[i]];
  }
  return order;
}

function currentDeck() {
  return decks[state.deck];
}

function currentOrder() {
  const deck = currentDeck();
  if (!state.order[deck.id]) {
    state.order[deck.id] = shuffledOrder(deck.cards.length);
    state.index[deck.id] = 0;
    saveState();
  }
  return state.order[deck.id];
}

function currentIndex() {
  return state.index[state.deck] || 0;
}

function setIndex(i) {
  state.index[state.deck] = i;
  saveState();
}

function render() {
  const deck = currentDeck();
  const order = currentOrder();
  const idx = currentIndex();
  const total = deck.cards.length;

  document.querySelectorAll(".deck-tab").forEach((tab) => {
    tab.setAttribute("aria-selected", tab.dataset.deck === state.deck ? "true" : "false");
  });
  subtitleEl.textContent = deck.subtitle;

  if (idx >= total) {
    cardEl.hidden = true;
    doneEl.hidden = false;
    counterEl.textContent = total + " of " + total;
    progressEl.style.width = "100%";
    return;
  }

  cardEl.hidden = false;
  doneEl.hidden = true;
  const card = deck.cards[order[idx]];
  groupEl.textContent = card.group;
  wordEl.textContent = card.word;
  exampleEl.textContent = card.example;
  exampleEl.hidden = true;
  hintEl.textContent = "Tap to reveal";
  revealed = false;
  counterEl.textContent = (idx + 1) + " of " + total;
  progressEl.style.width = ((idx + 1) / total * 100) + "%";
}

function reveal() {
  revealed = !revealed;
  exampleEl.hidden = !revealed;
  hintEl.textContent = revealed ? "Tap to hide" : "Tap to reveal";
}

function animateAndGo(direction, step) {
  const deck = currentDeck();
  const idx = currentIndex();
  const next = idx + step;
  if (next < 0 || next > deck.cards.length) return;
  const flyClass = direction === "left" ? "fly-left" : "fly-right";
  cardEl.classList.add(flyClass);
  setTimeout(() => {
    cardEl.classList.remove(flyClass);
    setIndex(next);
    render();
  }, 220);
}

function next() {
  if (currentIndex() >= currentDeck().cards.length) return;
  animateAndGo("left", 1);
}

function prev() {
  if (currentIndex() <= 0) return;
  animateAndGo("right", -1);
}

function shuffle() {
  const deck = currentDeck();
  state.order[deck.id] = shuffledOrder(deck.cards.length);
  state.index[deck.id] = 0;
  saveState();
  render();
}

function restart() {
  setIndex(0);
  render();
}

function switchDeck(id) {
  state.deck = id;
  saveState();
  render();
}

// Tap to reveal, drag to swipe. A drag is any pointer move past 10px.
let drag = null;

cardEl.addEventListener("pointerdown", (e) => {
  drag = { startX: e.clientX, x: 0, moved: false, startTime: Date.now() };
  cardEl.setPointerCapture(e.pointerId);
  cardEl.classList.add("dragging");
});

cardEl.addEventListener("pointermove", (e) => {
  if (!drag) return;
  drag.x = e.clientX - drag.startX;
  if (Math.abs(drag.x) > 10) drag.moved = true;
  if (drag.moved) {
    const rotate = drag.x / 40;
    cardEl.style.transform = "translateX(" + drag.x + "px) rotate(" + rotate + "deg)";
  }
});

function endDrag(e) {
  if (!drag) return;
  const dx = drag.x;
  const dt = Date.now() - drag.startTime;
  const velocity = Math.abs(dx) / Math.max(dt, 1);
  cardEl.classList.remove("dragging");
  cardEl.style.transform = "";
  const width = cardEl.offsetWidth;
  const wasDrag = drag.moved;
  drag = null;
  if (wasDrag && (Math.abs(dx) > width * 0.25 || velocity > 0.5)) {
    if (dx < 0) next();
    else prev();
    return;
  }
  if (!wasDrag) reveal();
}

cardEl.addEventListener("pointerup", endDrag);
cardEl.addEventListener("pointercancel", () => {
  if (!drag) return;
  drag = null;
  cardEl.classList.remove("dragging");
  cardEl.style.transform = "";
});

cardEl.addEventListener("keydown", (e) => {
  if (e.key === "Enter" || e.key === " ") {
    e.preventDefault();
    reveal();
  }
});

document.getElementById("next-btn").addEventListener("click", next);
document.getElementById("prev-btn").addEventListener("click", prev);
document.getElementById("shuffle-btn").addEventListener("click", shuffle);
document.querySelectorAll(".deck-tab").forEach((tab) => {
  tab.addEventListener("click", () => switchDeck(tab.dataset.deck));
});

document.addEventListener("keydown", (e) => {
  if (e.key === "ArrowRight") next();
  if (e.key === "ArrowLeft") prev();
});

doneEl.addEventListener("click", () => {
  shuffle();
});

themeBtn.addEventListener("click", () => {
  const current = document.documentElement.getAttribute("data-theme");
  state.theme = current === "dark" ? "light" : "dark";
  saveState();
  applyTheme();
});

async function init() {
  applyTheme();
  for (const deck of DECKS) {
    const res = await fetch(deck.file);
    const data = await res.json();
    decks[deck.id] = { ...deck, cards: data.cards, subtitle: data.subtitle, title: data.title };
  }
  render();
}

init();
