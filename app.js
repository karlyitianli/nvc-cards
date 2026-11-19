const DECKS = [
  { id: "needs", file: "data/needs.json", label: "Needs" },
  { id: "feelings-met", file: "data/feelings-met.json", label: "Feelings, met" },
  { id: "feelings-unmet", file: "data/feelings-unmet.json", label: "Feelings, unmet" },
];

const STORE_KEY = "nvc-cards:v1";
const deckEl = document.getElementById("deck");
const cardEl = document.getElementById("card");
const cardInner = document.getElementById("card-inner");
const doneEl = document.getElementById("card-done");
const groupEl = document.getElementById("card-group");
const wordEl = document.getElementById("card-word");
const wordBackEl = document.getElementById("card-word-back");
const exampleEl = document.getElementById("card-example");
const subtitleEl = document.getElementById("deck-subtitle");
const counterEl = document.getElementById("counter");
const progressEl = document.getElementById("progress-bar");
const themeBtn = document.getElementById("theme-toggle");
const titleEl = document.getElementById("app-title");
const langSelect = document.getElementById("lang-select");
const wordPinyinEl = document.getElementById("card-word-pinyin");
const wordBackPinyinEl = document.getElementById("card-word-back-pinyin");
const examplePinyinEl = document.getElementById("card-example-pinyin");
const hintFrontEl = document.getElementById("hint-front");
const hintBackEl = document.getElementById("hint-back");
const doneTitleEl = document.getElementById("done-title");
const doneWordEl = document.getElementById("done-word");
const doneBodyEl = document.getElementById("done-body");
const doneHintEl = document.getElementById("done-hint");
const footerEl = document.getElementById("app-footer");
const prevBtn = document.getElementById("prev-btn");
const shuffleBtn = document.getElementById("shuffle-btn");
const nextBtn = document.getElementById("next-btn");

const STRINGS = {
  en: {
    title: "NVC Cards",
    tabs: { needs: "Needs", "feelings-met": "Feelings, met", "feelings-unmet": "Feelings, unmet" },
    hintReveal: "Tap to reveal",
    hintHide: "Tap to hide",
    prev: "Previous",
    shuffle: "Shuffle",
    next: "Next",
    themeDark: "Dark",
    themeLight: "Light",
    doneTitle: "Deck complete",
    doneWord: "Done",
    doneBody: "You went through all 30 cards.",
    doneHint: "Shuffle or restart to go again.",
    footer: "90 cards. Tap a card to flip it and reveal its example. Swipe or drag either way to move to the next card; Previous goes back. Your place in each deck is saved on this device.",
  },
  zh: {
    title: "非暴力沟通卡片",
    tabs: { needs: "需求", "feelings-met": "满足时的感受", "feelings-unmet": "未满足时的感受" },
    hintReveal: "点按查看",
    hintHide: "点按隐藏",
    prev: "上一张",
    shuffle: "洗牌",
    next: "下一张",
    themeDark: "深色",
    themeLight: "浅色",
    doneTitle: "本组已完成",
    doneWord: "完成",
    doneBody: "你已经看完了全部 30 张卡片。",
    doneHint: "点洗牌或重新开始。",
    footer: "共 90 张卡片。点按卡片翻面查看例句。向左或向右滑动都可以翻到下一张，返回请点“上一张”。你的进度会保存在这台设备上。",
  },
};

let decks = {};
let state = loadState();
let revealed = false;

function loadState() {
  const fallback = { deck: "needs", order: {}, index: {}, theme: null, lang: "en" };
  try {
    const raw = localStorage.getItem(STORE_KEY);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw);
    return {
      deck: parsed.deck || "needs",
      order: parsed.order || {},
      index: parsed.index || {},
      theme: parsed.theme || null,
      lang: parsed.lang || "en",
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
  const s = STRINGS[state.lang];
  themeBtn.textContent = theme === "dark" ? s.themeLight : s.themeDark;
}

function applyLang() {
  const s = STRINGS[state.lang];
  document.documentElement.setAttribute("data-lang", state.lang);
  langSelect.value = state.lang;
  titleEl.textContent = s.title;
  document.querySelectorAll(".deck-tab").forEach((tab) => {
    tab.textContent = s.tabs[tab.dataset.deck];
  });
  hintFrontEl.textContent = s.hintReveal;
  hintBackEl.textContent = s.hintHide;
  prevBtn.textContent = s.prev;
  shuffleBtn.textContent = s.shuffle;
  nextBtn.textContent = s.next;
  doneTitleEl.textContent = s.doneTitle;
  doneWordEl.textContent = s.doneWord;
  doneBodyEl.textContent = s.doneBody;
  doneHintEl.textContent = s.doneHint;
  footerEl.textContent = s.footer;
  applyTheme();
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
  subtitleEl.textContent = state.lang === "zh" && deck.subtitle_zh ? deck.subtitle_zh : deck.subtitle;

  // Toggle with inline display as well as hidden: the .card rule sets
  // display:flex, which overrides the browser's built-in [hidden] rule,
  // and an inline style wins over any stylesheet version.
  if (idx >= total) {
    deckEl.classList.add("empty");
    cardEl.hidden = true;
    doneEl.hidden = false;
    cardEl.style.display = "none";
    doneEl.style.display = "";
    counterEl.textContent = state.lang === "zh" ? total + " / " + total : total + " of " + total;
    progressEl.style.width = "100%";
    return;
  }

  cardEl.hidden = false;
  doneEl.hidden = true;
  deckEl.classList.remove("empty");
  cardEl.style.display = "";
  doneEl.style.display = "none";
  cardInner.classList.remove("flipped");
  const card = deck.cards[order[idx]];
  const zh = state.lang === "zh" && card.zh ? card.zh : null;
  groupEl.textContent = zh ? zh.group : card.group;
  wordEl.textContent = zh ? zh.word : card.word;
  wordBackEl.textContent = zh ? zh.word : card.word;
  exampleEl.textContent = zh ? zh.example : card.example;
  wordPinyinEl.textContent = zh ? zh.pinyin : "";
  wordBackPinyinEl.textContent = zh ? zh.pinyin : "";
  examplePinyinEl.textContent = zh ? zh.example_pinyin : "";
  revealed = false;
  counterEl.textContent = state.lang === "zh" ? (idx + 1) + " / " + total : (idx + 1) + " of " + total;
  progressEl.style.width = ((idx + 1) / total * 100) + "%";
}

function reveal() {
  revealed = !revealed;
  cardInner.classList.toggle("flipped", revealed);
}

function animateAndGo(direction, step) {
  const deck = currentDeck();
  const idx = currentIndex();
  const next = idx + step;
  if (next < 0 || next > deck.cards.length) return;
  const flyClass = direction === "left" ? "fly-left" : "fly-right";
  cardEl.classList.add(flyClass);
  deckEl.classList.add("advancing");
  setTimeout(() => {
    cardEl.classList.remove(flyClass);
    deckEl.classList.remove("advancing");
    setIndex(next);
    render();
  }, 220);
}

function next(direction) {
  if (currentIndex() >= currentDeck().cards.length) return;
  animateAndGo(direction === "right" ? "right" : "left", 1);
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
  deckEl.classList.add("dragging");
});

cardEl.addEventListener("pointermove", (e) => {
  if (!drag) return;
  drag.x = e.clientX - drag.startX;
  if (Math.abs(drag.x) > 10) drag.moved = true;
  if (drag.moved) {
    const rotate = drag.x / 40;
    cardEl.style.transform = "translateX(" + drag.x + "px) rotate(" + rotate + "deg)";
    // The stack rises to meet the card as it is dragged away.
    const lift = Math.min(Math.abs(drag.x) / (cardEl.offsetWidth * 0.25), 1);
    deckEl.style.setProperty("--lift", lift.toFixed(3));
  }
});

function endDrag(e) {
  if (!drag) return;
  const dx = drag.x;
  const dt = Date.now() - drag.startTime;
  const velocity = Math.abs(dx) / Math.max(dt, 1);
  cardEl.classList.remove("dragging");
  deckEl.classList.remove("dragging");
  deckEl.style.setProperty("--lift", 0);
  cardEl.style.transform = "";
  const width = cardEl.offsetWidth;
  const wasDrag = drag.moved;
  drag = null;
  if (wasDrag && (Math.abs(dx) > width * 0.25 || velocity > 0.5)) {
    // Any swipe past the threshold advances, left or right. Only the
    // Previous button goes back. The card flies out the way it was dragged.
    next(dx < 0 ? "left" : "right");
    return;
  }
  if (!wasDrag) reveal();
}

cardEl.addEventListener("pointerup", endDrag);
cardEl.addEventListener("pointercancel", () => {
  if (!drag) return;
  drag = null;
  cardEl.classList.remove("dragging");
  deckEl.classList.remove("dragging");
  deckEl.style.setProperty("--lift", 0);
  cardEl.style.transform = "";
});

cardEl.addEventListener("keydown", (e) => {
  if (e.key === "Enter" || e.key === " ") {
    e.preventDefault();
    reveal();
  }
});

nextBtn.addEventListener("click", () => next());
prevBtn.addEventListener("click", prev);
shuffleBtn.addEventListener("click", shuffle);
document.querySelectorAll(".deck-tab").forEach((tab) => {
  tab.addEventListener("click", () => switchDeck(tab.dataset.deck));
});

// Both arrow keys advance. Previous is the only way back.
document.addEventListener("keydown", (e) => {
  if (e.key === "ArrowRight") next();
  if (e.key === "ArrowLeft") next();
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

langSelect.addEventListener("change", () => {
  state.lang = langSelect.value;
  saveState();
  applyLang();
  render();
});

async function init() {
  applyLang();
  for (const deck of DECKS) {
    const res = await fetch(deck.file);
    const data = await res.json();
    decks[deck.id] = { ...deck, cards: data.cards, subtitle: data.subtitle, subtitle_zh: data.subtitle_zh, title: data.title };
  }
  render();
}

init();
