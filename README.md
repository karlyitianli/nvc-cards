# NVC Cards

Swipable flashcard decks for reviewing Nonviolent Communication feelings and needs words. Built for Karl and Rachel.

Live at https://karls.design/nvc-cards/

## Decks

Three decks, 30 cards each, 90 total. Curated from the standard CNVC feelings and needs inventories; the full lists can be added later.

- **Needs**: what we all need, for example connection, rest, choice.
- **Feelings when needs are met**: for example grateful, calm, curious.
- **Feelings when needs are unmet**: for example frustrated, lonely, overwhelmed.

Each card shows the word big. Tap the card to flip it and reveal its example, written in the full NVC frame: "I feel ___ because I need ___."

Chinese is built in: the language dropdown next to the theme button switches the whole app to simplified Chinese, with pinyin under the word and under the example sentence. All 90 words and examples are translated, and the choice is saved on the device.

## Use

- Swipe or drag either way, or use the arrow keys, to move to the next card. The Previous button is the only way back.
- Tap a card to reveal or hide its example.
- The cards sit as a visible stack: the next two cards peek out above the top one, and the stack settles up as you move through a deck. Dragging the top card lifts the stack to meet it.
- Shuffle reshuffles the current deck and starts from the top.
- Your place in each deck is saved in localStorage on your device, so you pick up where you left off.

## Tech

Static site, no framework, no backend. Vanilla HTML, CSS, and JavaScript. Data lives in `data/*.json`, one file per deck. Hosted on GitHub Pages.

## Type

Allo by Josh Puckett, a free open source variable font under the SIL Open Font License 1.1. The file `fonts/AlloVariable.woff2` is self-hosted in this repo. Source: https://allo.joshpuckett.me/

## Adding cards

Add an entry to the right file in `data/`, with a word, a group, and an example in the full NVC frame:

```json
{"word": "patient", "group": "Peaceful", "example": "I feel patient because I need trust in the process."}
```

Keep the curated decks at 30 cards each unless the deck is being expanded on purpose.
