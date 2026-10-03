# Remaster UI etap 1 „Grimuar” — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Wspólny fundament wizualny „Grimuar” (CSS + `GrimoireUI`) i przeniesienie na niego ekranów wyboru: awans, relikt, kapliczka.

**Architecture:** Nowy arkusz `src/ui-grimoire.css` (zmienne + komponenty) i nowy skrypt `src/ui-grimoire.js` z globalnym obiektem `GrimoireUI`, który buduje karty z danych i obsługuje okno `#level-up-screen` (blokada 350 ms, błysk wyboru, klawisze). Ekrany wyboru w `progression.js`/`events.js` przestają składać HTML i przekazują `CardData` do `GrimoireUI.openChoice`. Logika nagród bez zmian.

**Tech Stack:** Vanilla JS (klasyczne `<script src>`, `'use strict';`), CSS, bez buildu.

**Spec:** `docs/superpowers/specs/2026-10-03-remaster-ui-etap1-grimuar-design.md`

## Global Constraints

- Bez buildu i bez modułów ES; gra działa po podwójnym kliknięciu i offline — żadnych zewnętrznych czcionek/zasobów; typografia `--gr-serif: Georgia,'Times New Roman',serif`.
- `src/ui-grimoire.css` dołączony po `src/styles.css`; `src/ui-grimoire.js` po `src/bestiary.js`, przed `src/game/core.js`.
- Wartości ze specyfikacji: blokada kliknięć 350 ms; błysk wyboru 250 ms (0 ms przy `prefers-reduced-motion`); wejście kart co 60 ms, 180 ms; uniesienie 5 px / 0,12 s; przekrzywienie −1,2° / 0,8° / −0,5°.
- Rzadkości: `common|rare|epic|legendary`; kolory wosku: `#7a6a58`, `#2a5ab0`, `#7a3ab0`, `#c8841a`; akcja główna `#a8281a`.
- Format zapisu bez zmian; logika nagród (efekty, koszty, losowanie, kolejka awansów) bez zmian.
- `GAME_VERSION = '2.5.0'`; komentarze po polsku w stylu kodu; commity z `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`; pliki testów niecommitowane.

## Jak testować

Tymczasowe, niecommitowane pliki (jak w 2.4):
- `.claude/ui-tests.js` — harness `RT` (`test`, `run(prefix)`, `ok`, `eq`, `near`, `setup(cls)`, `wait(ms)`) + testy; `RT.fuzz(cls)` — przegląd całej gry jak w 2.4 (z zamykaniem okien wyboru przez `GrimoireUI.pickByIndex(0)` po 400 ms zamiast klikania `button`).
- `.claude/ui-run.mjs` — runner: bezgłowy Chrome (`C:/Program Files/Google/Chrome/Application/chrome.exe`, `--headless=new --remote-debugging-port`), DevTools Protocol przez wbudowany `WebSocket` Node 22, `Page.navigate` na `http://localhost:8123/`, wstrzyknięcie `.claude/ui-tests.js`, `Runtime.evaluate(RT.run(prefix) | RT.fuzz(cls), awaitPromise)`; wypisuje `FAIL …` i `N passed, M failed`; kod wyjścia ≠0 przy porażce, błędach strony lub 0 testach.
- Serwer: `preview_start` „giera” (port 8123).
- **Run:** `node .claude/ui-run.mjs <prefiks|all>`; fuzz: `node .claude/ui-run.mjs --fuzz <klasa>`. **PASS** = `0 failed` / puste `errs`.

---

### Task 1: Fundament — `ui-grimoire.css` + `GrimoireUI.openChoice`

**Files:**
- Create: `src/ui-grimoire.css`, `src/ui-grimoire.js`, `.claude/ui-tests.js`, `.claude/ui-run.mjs`
- Modify: `index.html` (link CSS, skrypt; `#level-up-screen` dostaje klasę `gr-book`, statyczny `<h2>` usunięty), `src/game/save.js` (`_hideRuntimeScreens`), `src/game/hud-misc.js` (`gameOver`)

**Interfaces:**
- Produces:
  - `CardData = {icon, name, desc, category, rarity, cost?, disabledReason?}`.
  - `GrimoireUI.LOCK_MS = 350`, `GrimoireUI.PICK_FLASH_MS = 250`.
  - `GrimoireUI.openChoice({title, subtitle, cards, skip?, onPick}) -> void` — renderuje w `#level-up-info` (`.gr-title` + `.gr-sub`) i `#level-up-choices` (`.gr-cards`), pokazuje `#level-up-screen` (`display:block`); karta: `.gr-card.gr-r-<rarity>` (+ `.is-disabled`) z `.gr-key` (numer 1–4), `.gr-seal`, `.gr-ic`, `.gr-nm`, `.gr-ds`, `.gr-cat`, opcjonalnie `.gr-cost`, `.gr-why`; `skip` → `button.gr-btn` z `data-skip`.
  - `GrimoireUI.pickByIndex(i) -> boolean`; `GrimoireUI.isOpen() -> boolean`; `GrimoireUI.close() -> void` (ukrywa okno i **anuluje oczekujący błysk** — `onPick` już nie zostanie wywołane).
  - `GrimoireUI._prefersReducedMotion() -> boolean` (przez `window.matchMedia('(prefers-reduced-motion: reduce)')`).

- [ ] **Step 1: Napisz runner, harness i testy `ui:`**

```js
const C=(o={})=>({icon:'❤️',name:'Karta',desc:'opis',category:'Statystyka',rarity:'common',...o});
RT.test('ui: renderuje karty z danymi, rzadkością i numerem', async()=>{
  RT.setup(); GrimoireUI.openChoice({title:'Awans',subtitle:'Wojownik · Poziom 5',cards:[C({name:'A'}),C({name:'B',rarity:'rare'}),C({name:'C',rarity:'legendary',cost:'75 💰'})],onPick:()=>{}});
  const cards=[...document.querySelectorAll('#level-up-choices .gr-card')];
  RT.eq(cards.length,3); RT.eq(cards[1].querySelector('.gr-nm').textContent,'B'); RT.ok(cards[1].classList.contains('gr-r-rare'));
  RT.eq(cards[2].querySelector('.gr-key').textContent,'3'); RT.eq(cards[2].querySelector('.gr-cost').textContent,'75 💰');
  RT.ok(document.querySelector('#level-up-info .gr-title').textContent==='Awans'); RT.ok(GrimoireUI.isOpen());
  RT.ok(document.getElementById('level-up-screen').classList.contains('gr-book')); GrimoireUI.close(); RT.ok(!GrimoireUI.isOpen());
});
RT.test('ui: kliknięcie w pierwszych 350 ms ignorowane, potem wybór po błysku', async()=>{
  RT.setup(); let got=null; GrimoireUI.openChoice({title:'T',subtitle:'',cards:[C(),C()],onPick:i=>got=i});
  document.querySelectorAll('#level-up-choices .gr-card')[1].click(); await RT.wait(300); RT.eq(got,null,'za wcześnie');
  await RT.wait(100); document.querySelectorAll('#level-up-choices .gr-card')[1].click();
  RT.ok(document.querySelectorAll('#level-up-choices .gr-card')[1].classList.contains('is-picked')); RT.eq(got,null,'przed końcem błysku');
  await RT.wait(300); RT.eq(got,1);
});
RT.test('ui: karta niedostępna — powód widoczny, wybór niemożliwy', async()=>{
  RT.setup(); let got=null; GrimoireUI.openChoice({title:'T',subtitle:'',cards:[C({disabledReason:'Brakuje 30 💰'})],onPick:i=>got=i});
  const c=document.querySelector('#level-up-choices .gr-card'); RT.ok(c.classList.contains('is-disabled')); RT.eq(c.querySelector('.gr-why').textContent,'Brakuje 30 💰');
  await RT.wait(400); c.click(); RT.ok(!GrimoireUI.pickByIndex(0)); await RT.wait(300); RT.eq(got,null); GrimoireUI.close();
});
RT.test('ui: przycisk Pomiń wywołuje onPick("skip")', async()=>{
  RT.setup(); let got=null; GrimoireUI.openChoice({title:'T',subtitle:'',cards:[C()],skip:{label:'Pomiń'},onPick:i=>got=i});
  const b=document.querySelector('#level-up-screen [data-skip]'); RT.eq(b.textContent,'Pomiń'); await RT.wait(400); b.click(); await RT.wait(300); RT.eq(got,'skip');
});
RT.test('ui: szybkie podwójne kliknięcie = jeden wybór', async()=>{
  RT.setup(); let n=0; GrimoireUI.openChoice({title:'T',subtitle:'',cards:[C(),C()],onPick:()=>n++});
  await RT.wait(400); const cs=document.querySelectorAll('#level-up-choices .gr-card'); cs[0].click(); cs[1].click(); GrimoireUI.pickByIndex(0); await RT.wait(300); RT.eq(n,1);
});
RT.test('ui: close() w trakcie błysku anuluje wybór (wczytanie gry / śmierć)', async()=>{
  RT.setup(); let n=0; GrimoireUI.openChoice({title:'T',subtitle:'',cards:[C()],onPick:()=>n++});
  await RT.wait(400); GrimoireUI.pickByIndex(0); Game._hideRuntimeScreens(); await RT.wait(300); RT.eq(n,0); RT.ok(!GrimoireUI.isOpen());
});
RT.test('ui: ograniczony ruch — wybór bez błysku', async()=>{
  RT.setup(); const orig=GrimoireUI._prefersReducedMotion; GrimoireUI._prefersReducedMotion=()=>true;
  try{ let got=null; GrimoireUI.openChoice({title:'T',subtitle:'',cards:[C()],onPick:i=>got=i}); await RT.wait(400); GrimoireUI.pickByIndex(0); await RT.wait(20); RT.eq(got,0); }
  finally{ GrimoireUI._prefersReducedMotion=orig; GrimoireUI.close(); }
});
```

- [ ] **Step 2: Run** `node .claude/ui-run.mjs ui:` — **Expected:** FAIL (`GrimoireUI is not defined`).

- [ ] **Step 3: Zaimplementuj** `src/ui-grimoire.css` wg specyfikacji §2 (zmienne, `.gr-book`, `.gr-title`, `.gr-sub`, `.gr-page`, `.gr-cards`, `.gr-card` + elementy, rzadkości, stany, `.gr-btn`, `.gr-btn--primary`, animacja wejścia z `animation-delay` = indeks×60 ms ustawianym inline, `@media (prefers-reduced-motion: reduce)`), oraz `src/ui-grimoire.js` wg Interfaces (czas blokady liczony od `performance.now()` przy otwarciu; po wyborze flaga „zablokowane” do zamknięcia/ponownego otwarcia; timer błysku w polu obiektu, kasowany w `close()` i `openChoice()`). `Game._hideRuntimeScreens` i `Game.gameOver` wołają `GrimoireUI.close()` zamiast samego ukrywania `#level-up-screen`.

- [ ] **Step 4: Run** `node .claude/ui-run.mjs ui:` — **Expected:** `7 passed, 0 failed`. Fuzz `warrior` — PASS.

- [ ] **Step 5: Commit** — „2.5 krok 1: fundament Grimuar (CSS + GrimoireUI)”.

---

### Task 2: Awans na kartach

**Files:**
- Modify: `src/game/progression.js` (`_buildLevelUpBaseChoices`, `_buildLevelUpClassTalentChoices`, `_appendLevelUpRegenChoices`, `showLevelUp`)

**Interfaces:**
- Consumes: `GrimoireUI.openChoice`, `CardData`, `Game._closeChoiceScreen` (bez zmian).
- Produces: każdy wybór awansu to `CardData & {action: () => void}`; mapowanie (spec §4.1): bazowe → `category:'Statystyka', rarity:'common'`; regeneracja → `'Talent','common'`; talenty klasy (próg poziomu 1 i 3) → `'Talent','rare'`; talenty od poziomu 5 → `'Talent','epic'`. Ikona osobno (`icon`), nazwa bez ikony (np. `icon:'❤️', name:'+25 Max HP'`).

- [ ] **Step 1: Napisz testy `lvl:`**

```js
RT.test('lvl: wybory bazowe i talenty jako CardData z kategorią i rzadkością', async()=>{
  const {p}=RT.setup('warrior'); p.level=5;
  const base=Game._buildLevelUpBaseChoices(); RT.eq(base.length,6);
  RT.ok(base.every(c=>c.icon&&c.name&&!c.name.includes(c.icon)&&c.category==='Statystyka'&&c.rarity==='common'&&typeof c.action==='function'));
  const t=Game._buildLevelUpClassTalentChoices();
  RT.eq(t.find(c=>c.name.includes('Kradzież Życia')).rarity,'rare'); RT.eq(t.find(c=>c.name.includes('Mistrz Broni')).rarity,'rare');
  RT.eq(t.find(c=>c.name.includes('Berserker')).rarity,'epic'); RT.ok(t.every(c=>c.category==='Talent'));
  Game._appendLevelUpRegenChoices(t); RT.eq(t.find(c=>c.name.includes('Regeneracja HP')).rarity,'common');
});
RT.test('lvl: okno awansu — 4 karty, tytuł i podtytuł z poziomem', async()=>{
  const {p}=RT.setup('mage'); p.xp=0;p.xpToLevel=100; Game.grantXP(100);
  RT.eq(document.querySelectorAll('#level-up-choices .gr-card').length,4);
  RT.eq(document.querySelector('#level-up-info .gr-title').textContent,'Awans');
  RT.ok(document.querySelector('#level-up-info .gr-sub').textContent.includes(`Mag · Poziom ${p.level}`)); GrimoireUI.close(); Game._pendingLevelUps=0; Game.paused=false;
});
RT.test('lvl: dwa awanse — "jeszcze 1 do wyboru", dwa okna po kolei, oba zastosowane', async()=>{
  const {p}=RT.setup('warrior'); p.xp=0;p.xpToLevel=100; const l0=p.level; Game.grantXP(260);
  RT.ok(document.querySelector('#level-up-info .gr-sub').textContent.includes('jeszcze 1 do wyboru'));
  RT.ok(document.querySelector('#level-up-info .gr-sub').textContent.includes(`Poziom ${l0+1}`));
  await RT.wait(400); GrimoireUI.pickByIndex(0); await RT.wait(300);
  RT.ok(GrimoireUI.isOpen(),'drugie okno'); RT.ok(document.querySelector('#level-up-info .gr-sub').textContent.includes(`Poziom ${l0+2}`));
  await RT.wait(400); GrimoireUI.pickByIndex(0); await RT.wait(300);
  RT.ok(!GrimoireUI.isOpen()); RT.eq(Game._pendingLevelUps,0); RT.eq(Game.paused,false);
});
RT.test('lvl: przy szerokości 800 px karty się zawijają bez poziomego przewijania', async()=>{
  RT.setup('warrior'); const p=Game.player; p.xp=0;p.xpToLevel=100; Game.grantXP(100);
  const box=document.getElementById('level-up-screen'); const old=box.style.maxWidth; box.style.maxWidth='800px';
  const c=document.getElementById('level-up-choices'); RT.ok(c.scrollWidth<=c.clientWidth+1,`${c.scrollWidth}>${c.clientWidth}`);
  box.style.maxWidth=old; GrimoireUI.close(); Game._pendingLevelUps=0; Game.paused=false;
});
```

- [ ] **Step 2: Run** `node .claude/ui-run.mjs lvl:` — **Expected:** FAIL (brak `icon`/`category` w wyborach; brak `.gr-card`).

- [ ] **Step 3: Zaimplementuj** — buildery zwracają `CardData & {action}` wg Interfaces (opisy z obecnych pól `desc`, dla bazowych krótki opis, np. „Więcej zdrowia na resztę biegu”); `showLevelUp` woła `GrimoireUI.openChoice({title:'Awans', subtitle, cards, onPick:i=>{...dotychczasowa logika wyboru z allChoices[i]...}})`; podtytuł `"<className> · Poziom <shownLevel>"` + `" · jeszcze <pending-1> do wyboru"` gdy `pending>1`.

- [ ] **Step 4: Run** `node .claude/ui-run.mjs lvl:` i `ui:` — PASS; fuzz `mage` — PASS; zrzut ekranu okna awansu.

- [ ] **Step 5: Commit** — „2.5 krok 2: awans na kartach”.

---

### Task 3: Relikt i kapliczka na kartach

**Files:**
- Modify: `src/game/events.js` (`_showRelicPick`, `_buildShrineChoices`, `_handleShrineInteraction`; usunięcie `_renderChoiceButtons`)

**Interfaces:**
- Consumes: `GrimoireUI.openChoice`, `Game._closeChoiceScreen`.
- Produces: `_buildShrineChoices() -> (CardData & {action})[]` z `disabledReason` liczonym przy budowaniu (spec §4.3); relikt: karty `category:'Relikt'`, `rarity` reliktu, `skip:{label:'Pomiń'}`.

- [ ] **Step 1: Napisz testy `relic:` i `shrine:`**

```js
RT.test('relic: karty z rzadkością reliktu, Pomiń zamyka bez nagrody', async()=>{
  const {p}=RT.setup('rogue'); p.relics=[]; Game._showRelicPick();
  const cs=[...document.querySelectorAll('#level-up-choices .gr-card')]; RT.ok(cs.length>=1&&cs.length<=3);
  RT.ok(cs.every(c=>c.querySelector('.gr-cat').textContent==='Relikt'));
  RT.ok(cs.every(c=>/gr-r-(rare|epic|legendary)/.test(c.className)));
  await RT.wait(400); document.querySelector('#level-up-screen [data-skip]').click(); await RT.wait(300);
  RT.eq(p.relics.length,0); RT.ok(!GrimoireUI.isOpen()); RT.eq(Game.paused,false);
});
RT.test('relic: wybór karty dodaje relikt', async()=>{
  const {p}=RT.setup('rogue'); p.relics=[]; Game._showRelicPick(); await RT.wait(400); GrimoireUI.pickByIndex(0); await RT.wait(300); RT.eq(p.relics.length,1);
});
RT.test('relic: przy 3/3 karty niedostępne z powodem, Pomiń działa', async()=>{
  const {p}=RT.setup('rogue'); p.relics=[{id:'x1'},{id:'x2'},{id:'x3'}]; Game._showRelicPick();
  const cs=[...document.querySelectorAll('#level-up-choices .gr-card')]; RT.ok(cs.length>0&&cs.every(c=>c.classList.contains('is-disabled')));
  RT.eq(cs[0].querySelector('.gr-why').textContent,'Limit reliktów (3/3)'); await RT.wait(400); RT.ok(!GrimoireUI.pickByIndex(0)); GrimoireUI.close(); Game.paused=false;
});
RT.test('shrine: brak złota i brak broni — powody; leczenie działa', async()=>{
  const {p}=RT.setup('warrior'); p.gold=45; p.equipment.weapon=null; p.equipment.armor={name:'Z',baseDef:3,type:'armor',rarity:'common',id:'a'};
  const ch=Game._buildShrineChoices();
  RT.eq(ch.find(c=>c.name.includes('Broń')).disabledReason,'Brak założonej broni');
  RT.eq(ch.find(c=>c.name.includes('Zbroj')).disabledReason,'Brakuje 30 💰');
  RT.eq(ch.find(c=>c.name.includes('Zbroj')).cost,'75 💰');
  RT.ok(ch.every(c=>c.category==='Kapliczka'));
  p.hp=1; Game._handleShrineInteraction(Math.floor(p.x+.5),Math.floor(p.y+.5)); await RT.wait(400);
  const idx=ch.findIndex(c=>c.name.includes('Leczenie')); GrimoireUI.pickByIndex(idx); await RT.wait(300); RT.eq(p.hp,p.maxHp); RT.eq(Game.paused,false);
});
RT.test('shrine: stary przycisk-generator usunięty', async()=>{ RT.ok(typeof Game._renderChoiceButtons==='undefined'); });
```

- [ ] **Step 2: Run** `node .claude/ui-run.mjs relic:` i `shrine:` — **Expected:** FAIL.

- [ ] **Step 3: Zaimplementuj** — relikt: tytuł „Mistyczny Relikt”, podtytuł `"Posiadasz <n>/3 reliktów"`, karty z `RELIC_DB` (ikona, nazwa, opis, rzadkość), `disabledReason:'Limit reliktów (3/3)'` przy limicie, `skip` → dotychczasowy komunikat rezygnacji i `_closeChoiceScreen()`; pusta pula — dotychczasowe zachowanie, treść w `.gr-page`. Kapliczka: tytuł „Kapliczka Mocy”, podtytuł „Wybierz błogosławieństwo”; karty wg spec §4.3 (`icon` osobno: 💚, ⚔️, 🛡️, 💎); powody braku złota `"Brakuje <75-gold> 💰"` i braku sprzętu. Usuń `_renderChoiceButtons`.

- [ ] **Step 4: Run** `relic:`, `shrine:`, `lvl:`, `ui:` — PASS; fuzz `rogue` i `necromancer` — PASS; zrzuty ekranu reliktu i kapliczki.

- [ ] **Step 5: Commit** — „2.5 krok 3: relikt i kapliczka na kartach”.

---

### Task 4: Klawisze 1–4, sprzątanie, changelog, wersja

**Files:**
- Modify: `src/game/input.js` (keydown), `src/styles.css` (usunięcie `.choices`/`.choice-btn` dla `#level-up-screen`), `src/game/meta-ui.js`, `src/config.js`

**Interfaces:**
- Consumes: `GrimoireUI.isOpen`, `GrimoireUI.pickByIndex`.

- [ ] **Step 1: Napisz testy `keys:` i `final:`**

```js
const key=k=>{window.dispatchEvent(new KeyboardEvent('keydown',{key:k,code:'Digit'+k}));window.dispatchEvent(new KeyboardEvent('keyup',{key:k,code:'Digit'+k}));};
RT.test('keys: klawisz 2 wybiera drugą kartę i nie rzuca zaklęcia', async()=>{
  const {p}=RT.setup('mage'); let got=null; p.spells.forEach(s=>s.cdTimer=0); const mp=p.mp;
  GrimoireUI.openChoice({title:'T',subtitle:'',cards:[{icon:'a',name:'A',desc:'',category:'x',rarity:'common'},{icon:'b',name:'B',desc:'',category:'x',rarity:'common'}],onPick:i=>got=i});
  Game.paused=true; key('2'); await RT.wait(50); RT.eq(got,null,'w trakcie blokady');
  await RT.wait(400); key('2'); await RT.wait(300); RT.eq(got,1); RT.eq(p.mp,mp); RT.ok(p.spells.every(s=>s.cdTimer===0)); Game.paused=false;
});
RT.test('keys: przy otwartych ustawieniach cyfry nie wybierają karty', async()=>{
  RT.setup(); let got=null; GrimoireUI.openChoice({title:'T',subtitle:'',cards:[{icon:'a',name:'A',desc:'',category:'x',rarity:'common'}],onPick:i=>got=i});
  await RT.wait(400); document.getElementById('settings-panel').classList.add('open'); key('1'); await RT.wait(300);
  RT.eq(got,null); document.getElementById('settings-panel').classList.remove('open'); GrimoireUI.close(); Game.paused=false;
});
RT.test('keys: cyfra spoza zakresu kart nic nie robi', async()=>{
  RT.setup(); let got=null; GrimoireUI.openChoice({title:'T',subtitle:'',cards:[{icon:'a',name:'A',desc:'',category:'x',rarity:'common'}],onPick:i=>got=i});
  await RT.wait(400); key('4'); await RT.wait(300); RT.eq(got,null); GrimoireUI.close();
});
RT.test('final: brak starych przycisków wyboru, wersja 2.5.0, wpis w changelogu', async()=>{
  RT.setup(); Game.player.xp=0; Game.player.xpToLevel=100; Game.grantXP(100); RT.eq(document.querySelectorAll('.choice-btn').length,0); GrimoireUI.close(); Game._pendingLevelUps=0; Game.paused=false;
  RT.eq(GAME_VERSION,'2.5.0'); Game.openChangelog(); RT.ok(document.getElementById('meta-panel').textContent.includes('Grimuar')); Game.closeMeta();
});
```

- [ ] **Step 2: Run** `node .claude/ui-run.mjs keys:` i `final:` — **Expected:** FAIL.

- [ ] **Step 3: Zaimplementuj** — w handlerze `keydown` (`input.js`), po bloku `_settingsListening` i przed przetwarzaniem akcji: jeśli `GrimoireUI.isOpen()`, panel ustawień zamknięty i `e.key` ∈ `'1'..'4'` → `e.preventDefault(); GrimoireUI.pickByIndex(Number(e.key)-1); return;`. Usuń z `styles.css` reguły `#level-up-screen .choices`, `.choice-btn` (+hover) — zostaw pozycjonowanie okna. `config.js`: `'2.5.0'`. `meta-ui.js`: na początku `versions` wpis `{v:'2.5',title:'Grimuar: nowe karty nagród',items:[...]}` (karty z rzadkością i pieczęciami; niedostępne opcje z powodem; klawisze 1–4; ochrona przed przypadkowym wyborem; „Pomiń” przy reliktach).

- [ ] **Step 4: Weryfikacja końcowa** — `node .claude/ui-run.mjs all` — PASS; fuzz 4 klas — PASS; zrzuty: awans, relikt (z limitem), kapliczka (niedostępne karty), stan wybrany; emulacja `prefers-reduced-motion` (`resize_window` nie obsługuje — użyj `Emulation.setEmulatedMedia` w runnerze lub ręcznego zrzutu po podmianie `_prefersReducedMotion`).

- [ ] **Step 5: Commit** — „2.5 Grimuar: klawisze 1–4, sprzątanie, changelog, wersja”. Pliki `.claude/ui-tests.js` i `.claude/ui-run.mjs` usuwane po przeglądzie końcowym.

## Review Focus

- **Wczytanie gry lub śmierć w trakcie błysku wyboru** — nagroda nie może zostać przyznana po fakcie. Pokryte: Task 1 „close() w trakcie błysku…”.
- **Szybkie podwójne kliknięcie / klik + klawisz** — dokładnie jedna nagroda. Pokryte: Task 1 „szybkie podwójne kliknięcie”.
- **Cyfry przy otwartych ustawieniach (np. przypisywanie klawiszy)** — nie wybierają karty. Pokryte: Task 4.
- **Wąskie okno (800 px) z 4 kartami** — karty się zawijają, nic nie wystaje. Pokryte: Task 2.
- **Cyfra większa niż liczba kart** — nic się nie dzieje. Pokryte: Task 4.
