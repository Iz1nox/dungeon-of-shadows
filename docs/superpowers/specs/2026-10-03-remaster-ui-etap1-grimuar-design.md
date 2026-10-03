# Remaster UI — etap 1: fundament „Grimuar” i ekrany wyboru (2.5)

Data: 2026-10-03
Dotyczy: Dungeon of Shadows — Część I (`E:\giera`), gałąź `remaster-ui` (z `remaster-2.4`)

## 1. Cel i kontekst

Remaster UI podzielono na 4 etapy, każdy z własną specyfikacją:
1. **Fundament wizualny + ekrany wyboru** (ten dokument),
2. menu pauzy i ekrany końca gry,
3. ekwipunek i sklep,
4. HUD w grze.

**Cel etapu 1:** stworzyć wspólny język wizualny „Grimuar” (wybrany przez autora: wariant B — pergamin, atrament, woskowe pieczęcie; duże okna w wariancie 2 — skórzana oprawa z pergaminową stroną w środku) i przenieść na niego ekrany wyboru: awans, relikt, kapliczka.

**Sukces:** wybór nagrody to czytelne karty z ikoną, nazwą, opisem, kategorią i rzadkością; niedostępne opcje są wyraźnie niedostępne z powodem; nie da się wybrać nagrody przypadkiem; klawisze 1–4 działają; logika nagród się nie zmienia.

**Ograniczenia (stałe):** czysty JavaScript bez buildu i bez modułów ES (klasyczne `<script src>` z `'use strict';`), gra otwiera się podwójnym kliknięciem i działa offline — **żadnych zewnętrznych czcionek ani zasobów**; zmiany o niskim ryzyku; format zapisu bez zmian.

**Poza zakresem:** menu pauzy, ekrany końca gry, ekwipunek, sklep, HUD, ustawienia, ekran tytułowy (etapy 2–4).

## 2. Fundament wizualny — `src/ui-grimoire.css`

Nowy arkusz dołączony w `index.html` **po** `src/styles.css`.

### 2.1 Zmienne (`:root`)
| Zmienna | Wartość | Rola |
|---|---|---|
| `--gr-parch-1` / `--gr-parch-2` | `#ecdcb4` / `#cdb27c` | pergamin (gradient) |
| `--gr-ink` / `--gr-ink-soft` | `#3a2a14` / `#5a4426` | atrament na pergaminie |
| `--gr-leather-1` / `--gr-leather-2` | `#3a2216` / `#1e110a` | skórzana oprawa |
| `--gr-tool` / `--gr-tool-lt` | `#8a6a34` / `#e8c878` | złote tłoczenie, tytuły |
| `--gr-wax-common` | `#7a6a58` | pieczęć: zwykła |
| `--gr-wax-rare` | `#2a5ab0` | pieczęć: rzadka |
| `--gr-wax-epic` | `#7a3ab0` | pieczęć: epicka |
| `--gr-wax-legendary` | `#c8841a` | pieczęć: legendarna |
| `--gr-wax-red` | `#a8281a` | akcja główna |
| `--gr-serif` | `Georgia,'Times New Roman',serif` | typografia (systemowa) |

### 2.2 Komponenty
- **`.gr-book`** — skórzana oprawa okna: gradient skóry, potrójna tłoczona ramka (`inset` box-shadow: `#6b4a24`, `#24140b`, `--gr-tool`), zaokrąglenie 8 px, cień `0 14px 34px rgba(0,0,0,.8)`.
- **`.gr-title`** / **`.gr-sub`** — tytuł złotą kursywą (`--gr-tool-lt`, 26 px) i podtytuł kursywą (`#b8955a`, 12 px).
- **`.gr-page`** — pergaminowa strona (gradient pergaminu, `inset` cień, tekst `--gr-ink`).
- **`.gr-cards`** — rząd kart (flex, odstęp 16 px, zawijanie, wyśrodkowanie).
- **`.gr-card`** — karta nagrody 148×≥176 px na pergaminie; elementy: `.gr-key` (numer klawisza, lewy górny róg), `.gr-seal` (pieczęć 28 px w prawym górnym rogu), `.gr-ic` (ikona 32 px, lekka sepia), `.gr-nm` (nazwa, pogrubiona), `.gr-ds` (opis kursywą), `.gr-cat` (kategoria, kapitaliki), `.gr-cost` (koszt), `.gr-why` (powód niedostępności, czerwony).
  - Przekrzywienie: co 3 karta kolejno `-1.2°`, `0.8°`, `-0.5°`.
  - Rzadkość — klasy `gr-r-common|rare|epic|legendary`: kolor pieczęci wg zmiennych; rzadka — cienka niebieska obwódka; epicka — fioletowa poświata; legendarna — złota poświata.
  - Stany: `:hover` (i fokus klawiatury) — prostuje się, `translateY(-5px)`, 0,12 s ease-out; `.is-disabled` — `grayscale(.75) brightness(.72)`, kursor zabroniony, bez uniesienia; `.is-picked` — `translateY(-8px) scale(1.06)`, złoty obrys i poświata.
- **`.gr-btn`** / **`.gr-btn--primary`** — skórzany przycisk; wariant główny w czerwonym wosku.

### 2.3 Ruch
- Wejście kart: kolejno co 60 ms, `opacity 0→1` + `translateY(10px→0)`, 180 ms ease-out.
- Błysk wyboru: `.is-picked` przez 250 ms, potem zamknięcie okna.
- `@media (prefers-reduced-motion: reduce)`: brak animacji wejścia, uniesienia i błysku (zamknięcie natychmiast).

## 3. Okno wyboru — `src/ui-grimoire.js`

Nowy plik ładowany w `index.html` przed skryptami `src/game/*` (po `src/bestiary.js`).

### 3.1 API
```
GrimoireUI.openChoice({
  title: string,            // np. "Awans"
  subtitle: string,         // np. "Wojownik · Poziom 5 · jeszcze 1 do wyboru"
  cards: CardData[],        // 1–4 karty
  skip?: {label: string},   // np. {label:'Pomiń'} — przycisk pod kartami
  onPick(index|'skip'): void
})
GrimoireUI.close()
GrimoireUI.isOpen(): boolean
GrimoireUI.pickByIndex(i): boolean   // wybór z klawiatury; false gdy nie można
```
`CardData = {icon, name, desc, category, rarity:'common'|'rare'|'epic'|'legendary', cost?: string, disabledReason?: string}`

### 3.2 Zachowanie
- Okno to istniejący `#level-up-screen` w klasie `.gr-book`; tytuł/podtytuł w `#level-up-info`, karty w `#level-up-choices` (`.gr-cards`). Statyczny nagłówek `<h2>` z `index.html` zostaje zastąpiony tytułem z `openChoice`.
- **Blokada przypadkowego wyboru:** przez 350 ms od otwarcia kliknięcia i klawisze są ignorowane.
- **Klawisze 1–4** (`event.key` `'1'`–`'4'`, niezależnie od przypisań zaklęć): gdy okno jest otwarte, wybierają kartę o danym numerze; obsługiwane w `input.js` przed akcjami z przypisań i bez ich wykonywania.
- Karta z `disabledReason` nie daje się wybrać ani kliknięciem, ani klawiszem; pokazuje powód.
- Po wyborze: `.is-picked` na 250 ms (0 ms przy ograniczonym ruchu), potem `onPick(index)`. W tym czasie kolejne kliknięcia są ignorowane.
- `onPick` decyduje o zamknięciu (np. kolejka awansów otwiera następne okno) — dotychczasowe `_closeChoiceScreen` zostaje.

## 4. Ekrany wyboru

### 4.1 Awans (`progression.js`)
- Tytuł „Awans”, podtytuł `"<klasa> · Poziom <N>"` + `" · jeszcze <K> do wyboru"` gdy w kolejce czeka więcej awansów.
- Wybory budowane jako `CardData` (ikona wyjęta z obecnej etykiety):
  - bazowe statystyki (+HP, +MP, +Atak, +Obrona, +Szybkość, +Krytyk): `category:'Statystyka'`, `rarity:'common'`;
  - regeneracja HP/MP: `category:'Talent'`, `rarity:'common'`;
  - talenty klasy dostępne od poziomu 1 i 3: `category:'Talent'`, `rarity:'rare'`;
  - talenty klasy od poziomu 5 (Berserker, Arcymag, Zabójca, Arcylisz): `category:'Talent'`, `rarity:'epic'`.
- Losowanie (2 bazowe + do 2 talentów), efekty, pełne uleczenie po wyborze i kolejka awansów — bez zmian.

### 4.2 Relikt (`events.js`)
- Tytuł „Mistyczny Relikt”, podtytuł `"Posiadasz <n>/3 reliktów"`.
- Karty: `icon`, `name`, `desc` reliktu, `category:'Relikt'`, `rarity` reliktu.
- Przycisk „Pomiń” (`skip`) — zamyka bez nagrody, z dotychczasowym komunikatem.
- Przy 3/3 reliktach wszystkie karty mają `disabledReason:'Limit reliktów (3/3)'` (dostępne tylko „Pomiń”).
- Brak dostępnych reliktów: zachowanie bez zmian (komunikat, zamknięcie po 1,5 s), w stylu `.gr-page`.

### 4.3 Kapliczka (`events.js`)
- Tytuł „Kapliczka Mocy”, podtytuł „Wybierz błogosławieństwo”.
- Karty: Pełne Leczenie (`common`), Wzmocnij Broń / Wzmocnij Zbroję (`rare`, `cost:'75 💰'`), Błogosławieństwo (`rare`); `category:'Kapliczka'`.
- `disabledReason`: `"Brakuje <X> 💰"` gdy złota < 75; `"Brak założonej broni"` / `"Brak założonej zbroi"`.
- Efekty i koszty bez zmian.

## 5. Sprzątanie i wersja
- `styles.css`: usunięte reguły `#level-up-screen .choices`, `#level-up-screen .choice-btn` (i hover); pozycjonowanie okna (`position:fixed`, środek ekranu, `z-index:50`, `display:none`) zostaje w `styles.css` lub przechodzi do `ui-grimoire.css` — bez zmiany zachowania.
- `events.js`: `_renderChoiceButtons` usunięte (zastąpione `GrimoireUI.openChoice`).
- `config.js`: `GAME_VERSION = '2.5.0'`; `meta-ui.js`: wpis „2.5 — Grimuar: nowe karty nagród” w „Co nowego”.

## 6. Testowanie
Tymczasowe testy w przeglądarce (niecommitowane, usuwane po pracy), uruchamiane bezgłowym Chrome jak w 2.4:
- każde okno (awans, relikt, kapliczka) tworzy właściwą liczbę kart z poprawną ikoną, nazwą, kategorią i rzadkością;
- kliknięcie i klawisz 1–4 wybierają właściwą nagrodę (efekt zastosowany);
- kliknięcie/klawisz w pierwszych 350 ms nie robi nic;
- karta niedostępna (brak złota, brak broni/zbroi, limit reliktów) nie daje się wybrać i pokazuje powód;
- „Pomiń” zamyka relikt bez nagrody;
- dwa awanse naraz → dwa okna po kolei, oba wybory zastosowane;
- klawisze 1–4 przy otwartym oknie nie rzucają zaklęć;
- fuzz 4 klas bez błędów;
- zrzuty ekranu każdego okna; sprawdzenie `prefers-reduced-motion` (emulacja) — brak animacji.
