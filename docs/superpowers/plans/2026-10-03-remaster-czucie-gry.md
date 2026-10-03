# Remaster 2.4 „Czucie gry” — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Płynny ruch z rozpędem, unik na Spacji, czytelny atak gracza oraz system zapowiedzi ataków dla bossów, strzelców i elit w Części I Dungeon of Shadows.

**Architecture:** Dwa nowe klasyczne skrypty (`src/game/movement.js`, `src/game/telegraphs.js`) rozszerzają obiekt `Game` przez `Object.assign(Game,{...})`, jak reszta `src/game/*`. Istniejące funkcje bossów/wrogów są dzielone na „zapowiedz” (tworzy telegraf) i „uderz” (dotychczasowa logika w `onResolve`). Brak zmian formatu zapisu poza nowym licznikiem z domyślnym 0.

**Tech Stack:** Vanilla JS (ES2020, klasyczne `<script src>`, `'use strict';` w każdym pliku), Canvas 2D, Web Audio. Bez buildu, bez npm.

**Spec:** `docs/superpowers/specs/2026-10-03-remaster-czucie-gry-design.md`

## Global Constraints

- Bez buildu i bez modułów ES; gra otwiera się podwójnym kliknięciem `index.html`. Nowe pliki = klasyczne `<script src>` z własnym `'use strict';`.
- Nowe skrypty ładowane w `index.html` po `src/game/minions.js`, przed `src/game/inventory.js`.
- Format zapisu bez zmian (`SAVE_COMPAT_TAG` i `SAVE_SCHEMA_VERSION` bez zmian); stare zapisy muszą się wczytywać.
- Ruch: rozpęd ≈ 0,08 s, hamowanie ≈ 0,06 s, niezależnie od FPS.
- Unik: 2,5 kratki w 0,18 s, nietykalność przez doskok + 0,1 s, cooldown 1,0 s od startu, domyślnie Spacja.
- Faza furii bossa (`phase>=3`): czasy zapowiedzi ×0,7. Obrażenia obszarowe zapowiedzianych umiejętności bossów ×1,2.
- Komentarze w kodzie po polsku, w stylu istniejącego kodu (zwięzłe, „dlaczego”).
- Każde zadanie kończy się commitem z linią `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`; pliku testów nie commitujemy.

## Jak testować (wspólne dla wszystkich zadań)

Gra nie ma frameworka testowego. Testy żyją w **tymczasowym, niecommitowanym** pliku `.claude/remaster-tests.js` (tworzony w Task 1, rozbudowywany w kolejnych, usuwany w Task 7), ładowanym do działającej gry.

- Serwer podglądu: `preview_start` z nazwą `giera` (port 8123, `.claude/launch.json`).
- **Uruchomienie testów** (narzędzie `javascript_tool` w karcie podglądu, po `navigate` na `http://localhost:8123/`):

```js
await new Promise(r=>{const s=document.createElement('script');s.src='.claude/remaster-tests.js?'+Date.now();s.onload=r;document.head.appendChild(s);});
JSON.stringify(await RT.run('<prefiks>'))
```

  Wynik: `{passed:N, failed:[{name,error}]}`. „PASS” = `failed` puste.
- **Fuzz** (regresja całej gry): ten sam harness co przy 2.3.1 — funkcja `RT.fuzz(cls, floors=12, frames=400)` w tym samym pliku (Task 1), uruchamiana po świeżym `navigate` dla każdej z 4 klas; „PASS” = `errs` i `consoleErrs` puste.

---

### Task 1: Harness testowy + ruch z rozpędem

**Files:**
- Create: `.claude/remaster-tests.js` (niecommitowany)
- Create: `src/game/movement.js`
- Modify: `index.html` (dołączenie `movement.js`), `src/game/player.js:3-22` (`updatePlayer`), `src/game/loop.js:169-192` (`_computePlayerMoveTarget`, `_applyPlayerCollisionMovement` przestają być używane przez `updatePlayer`; usuń je, jeśli nic innego ich nie woła), `src/game/lifecycle.js` (`start`), `src/game/world.js` (`generateFloor`), `src/game/save.js` (`_restoreEntitiesFromSave`)

**Interfaces:**
- Produces (harness): `RT.test(name, async fn)`, `RT.run(prefix) -> {passed, failed}`, `RT.eq(a,b,msg)`, `RT.ok(cond,msg)`, `RT.near(a,b,eps,msg)`, `RT.setup(cls='warrior') -> {p, open}` (startuje grę, jeśli nie działa; gdy gra działa inną klasą — `Game.initPlayer(cls)` + `Game.initSpellBar()`; czyści `Game.enemies`, `projectiles`, `telegraphs` jeśli istnieją; zamyka modale; `paused=false`; stawia gracza na kaflu `open` z co najmniej 4 wolnymi kaflami w każdą stronę), `RT.spotNextToWall(dir) -> {x,y}` (wolny kafel z ścianą dokładnie 2 kafle dalej w kierunku `dir`), `RT.step(seconds, dt=1/60)` (woła `Game.update(dt)` w pętli), `RT.fuzz(cls,floors,frames)` (kopia `__fuzz2` z sesji 2.3.1: teleport do wroga, ataki, czary, przedmioty, interakcje, zapis/odczyt, kolejne piętra; zwraca `{errs, consoleErrs}`).
- Produces (gra): `MOVE_TUNING = {accelTime:.08, decelTime:.06}` (stała w `movement.js`); `Game._updatePlayerMovement(p, dt)`; pola gracza `p.vx`, `p.vy` (kratki/s); `Game._resetMovementState()` (zeruje `vx,vy` i stan uniku z Task 2).

- [ ] **Step 1: Napisz harness i testy ruchu (prefiks `move:`)**

```js
RT.test('move: rozpędza się do ≥90% prędkości w 0,08 s', async()=>{
  const {p}=RT.setup(); Game.keys={d:true}; RT.step(.08);
  RT.ok(p.vx>=.9*p.speed, `vx=${p.vx} speed=${p.speed}`);
});
RT.test('move: hamuje do ≤10% w 0,06 s', async()=>{
  const {p}=RT.setup(); Game.keys={d:true}; RT.step(.3); Game.keys={}; RT.step(.06);
  RT.ok(Math.abs(p.vx)<=.1*p.speed, `vx=${p.vx}`);
});
RT.test('move: ten sam dystans przy 30 i 144 FPS (±5%)', async()=>{
  const a=RT.setup(); Game.keys={d:true}; const x0=a.p.x; RT.step(.4,1/30); const d30=a.p.x-x0;
  const b=RT.setup(); Game.keys={d:true}; const x1=b.p.x; RT.step(.4,1/144); const d144=b.p.x-x1;
  RT.near(d30,d144,.05*d144);
});
RT.test('move: woda spowalnia o połowę prędkość docelową', async()=>{
  const {p,open}=RT.setup(); Game.dungeon.map[open.y][open.x]=TILE.WATER; Game.dungeon.map[open.y][open.x+1]=TILE.WATER;
  Game.keys={d:true}; RT.step(.1); RT.ok(p.vx<=.5*p.speed+.01, `vx=${p.vx}`);
});
RT.test('move: 600 klatek losowego ruchu przy ścianach — nigdy w ścianie', async()=>{
  const {p}=RT.setup(); const s=RT.spotNextToWall('right'); p.x=s.x;p.y=s.y;
  const ks=['w','a','s','d'];
  for(let i=0;i<600;i++){ if(i%20===0){Game.keys={};Game.keys[ks[i/20%4|0]]=true;Game.keys[ks[(i/20+1)%4|0]]=i%40===0;} Game.update(1/60);
    RT.ok(Game._canPlayerOccupy(p.x,p.y),`klatka ${i}: ${p.x},${p.y}`); }
});
RT.test('move: zmiana piętra zeruje prędkość', async()=>{
  const {p}=RT.setup(); Game.keys={d:true}; RT.step(.2); Game.keys={}; Game.generateFloor(); RT.eq(p.vx,0); RT.eq(p.vy,0);
});
```

- [ ] **Step 2: Uruchom testy `move:` — oczekiwane FAIL** (rozpęd: `vx` undefined / brak `_updatePlayerMovement`).

- [ ] **Step 3: Zaimplementuj `src/game/movement.js`**
  - `Game._updatePlayerMovement(p, dt)`: wektor wejścia z `_getPlayerInputVector()`; prędkość docelowa = wektor × `p.speed` × (ukrycie 0,7) × (woda 0,5 — kafel pod środkiem gracza, jak dziś); dążenie wykładnicze `k = 1 - Math.exp(-dt / tau)`, gdzie `tau = (cel≠0 ? accelTime : decelTime) / 3` (≈95% w zadanym czasie); ruch per oś przez `_canPlayerOccupy`, blokada osi zeruje jej składową prędkości.
  - `updatePlayer` woła `_updatePlayerMovement(p, dt)` w miejsce `_computePlayerMoveTarget`+`_applyPlayerCollisionMovement`; reszta `updatePlayer` (wygładzona prędkość dla strzelców, kroki, animacja z `dx,dy` wejścia, kafle, FOV) bez zmian.
  - `_resetMovementState()` wołane w `start`, `generateFloor` i po wczytaniu (`_restoreEntitiesFromSave`).
  - `index.html`: `<script src="src/game/movement.js"></script>` po `minions.js`.

- [ ] **Step 4: Uruchom testy `move:` — oczekiwane PASS.** Następnie fuzz `warrior` — PASS.

- [ ] **Step 5: Commit** — `git add index.html src/game/movement.js src/game/player.js src/game/loop.js src/game/lifecycle.js src/game/world.js src/game/save.js` → „2.4 krok 1: ruch z rozpędem”.

---

### Task 2: Unik (Spacja) — mechanika, klawisz, HUD, dźwięk, licznik

**Files:**
- Modify: `src/game/movement.js`, `src/keybindings.js` (`DEFAULT_KEYS`, `KEY_LABELS`, `loadKeyBindings`), `src/game/input.js` (`_runBoundAction`, `_getBoundActionOrder`, `_isWorldAction`), `src/sound.js` (nowa metoda), `src/game/render.js` (`_renderSceneActors`, `_renderPlayer`), `src/game/hud.js` (`_updateHUD`), `index.html` (element wskaźnika + opis sterowania), `src/styles.css`, `src/game/core.js`, `src/game/lifecycle.js` (`start`), `src/game/save.js` (`_applySaveBaseDefaults`, `_restoreRunStateFromSave`, `_buildSaveRunMeta`)

**Interfaces:**
- Consumes: `MOVE_TUNING`, `_updatePlayerMovement`, `_resetMovementState`, `_canPlayerOccupy`, `_isGameplayBlocked`, `_combatFeedback`.
- Produces: `DODGE_TUNING = {distance:2.5, duration:.18, cooldown:1.0, graceIFrames:.1, ghostCount:4, ghostLife:.2}`; `Game.tryDodge() -> boolean`; pola `p.dodgeTimer` (pozostały czas doskoku), `p.dodgeCd` (pozostały cooldown), `p.dodgeDX`, `p.dodgeDY`; `Game._dodgeGhosts` (tablica `{x,y,life}`); `Game._renderDodgeGhosts(ctx,cx,cy)`; `SoundFX.prototype.dodge()`; akcja klawisza `dodge` (domyślnie `' '`, etykieta „Unik”); licznik `Game._dodgeRolls` (zapis: `dodgeRolls`).

- [ ] **Step 1: Napisz testy `dodge:`**

```js
RT.test('dodge: doskok ≈2,5 kratki w otwartym terenie', async()=>{
  const {p}=RT.setup(); Game.keys={d:true}; RT.step(.05); const x0=p.x;
  RT.ok(Game.tryDodge()); Game.keys={}; RT.step(.25); RT.near(p.x-x0,2.5,.3,`dx=${p.x-x0}`);
});
RT.test('dodge: na stojąco leci w stronę kursora', async()=>{
  const {p}=RT.setup(); Game.mouseWorldX=p.x+.5; Game.mouseWorldY=p.y+5.5; const y0=p.y;
  Game.tryDodge(); RT.step(.25); RT.ok(p.y-y0>2, `dy=${p.y-y0}`);
});
RT.test('dodge: nietykalny przez doskok, po 0,18+0,1 s już nie', async()=>{
  const {p}=RT.setup(); Game.tryDodge(); RT.step(.15); RT.ok(p.iFrames>0);
  const hp=p.hp; Game.damagePlayer(30,'t'); RT.eq(p.hp,hp,'cios w trakcie uniku');
  RT.step(.15); RT.ok(p.iFrames<=0, `iFrames=${p.iFrames}`);
});
RT.test('dodge: cooldown 1 s', async()=>{
  RT.setup(); RT.ok(Game.tryDodge()); RT.step(.5); RT.ok(!Game.tryDodge(),'za wcześnie'); RT.step(.55); RT.ok(Game.tryDodge(),'po cooldownie');
});
RT.test('dodge: w ścianę — kończy na wolnym polu, potem można chodzić', async()=>{
  for(const dir of ['right','left','up','down']){
    const {p}=RT.setup(); const s=RT.spotNextToWall(dir); p.x=s.x;p.y=s.y; p.dodgeCd=0;
    const k={right:'d',left:'a',up:'w',down:'s'}[dir]; Game.keys={[k]:true}; Game.tryDodge(); RT.step(.3);
    RT.ok(Game._canPlayerOccupy(p.x,p.y),`${dir}: ${p.x},${p.y}`);
    const back={right:'a',left:'d',up:'s',down:'w'}[dir]; Game.keys={[back]:true}; const x=p.x,y=p.y; RT.step(.2);
    RT.ok(Math.abs(p.x-x)+Math.abs(p.y-y)>.3,`${dir}: utknął`);
  }
});
RT.test('dodge: zablokowany w pauzie i po śmierci', async()=>{
  RT.setup(); Game.paused=true; RT.ok(!Game.tryDodge()); Game.paused=false;
  Game.running=false; RT.ok(!Game.tryDodge()); Game.running=true;
});
RT.test('dodge: nie przerywa ukrycia', async()=>{
  const {p}=RT.setup(); p.stealthTimer=3; Game.tryDodge(); RT.step(.1); RT.ok(p.stealthTimer>2.5);
});
RT.test('dodge: Spacja uruchamia unik', async()=>{
  const {p}=RT.setup(); window.dispatchEvent(new KeyboardEvent('keydown',{key:' ',code:'Space'}));
  window.dispatchEvent(new KeyboardEvent('keyup',{key:' ',code:'Space'})); RT.ok(p.dodgeTimer>0||p.dodgeCd>0);
});
RT.test('dodge: migracja klawisza wait→dodge', async()=>{
  const saved=localStorage.getItem('dos_keybindings');
  localStorage.setItem('dos_keybindings',JSON.stringify({wait:'x'}));
  const kb=loadKeyBindings(); RT.eq(kb.dodge,'x'); RT.ok(!('wait' in kb),'wait usunięte');
  if(saved===null)localStorage.removeItem('dos_keybindings');else localStorage.setItem('dos_keybindings',saved);
});
RT.test('dodge: zapis/odczyt w trakcie uniku — brak resztek, licznik zachowany', async()=>{
  const {p}=RT.setup(); Game.tryDodge(); const n=Game._dodgeRolls; Game.saveGame(3); Game.loadGame(3);
  RT.eq(Game.player.dodgeTimer,0); RT.eq(Game.player.iFrames,0); RT.eq(Game._dodgeGhosts.length,0); RT.eq(Game._dodgeRolls,n);
  localStorage.removeItem('dos_save_3');
});
```

- [ ] **Step 2: Uruchom testy `dodge:` — oczekiwane FAIL** (`Game.tryDodge` nie istnieje).

- [ ] **Step 3: Zaimplementuj unik**
  - `tryDodge()`: odmowa gdy `_isGameplayBlocked()` lub `p.dodgeCd>0` (wtedy `_combatFeedback('dodge_cd', ...)`); kierunek = znormalizowany wektor wejścia, a gdy zerowy — kąt od środka gracza do kursora; ustawia `dodgeTimer=duration`, `dodgeCd=cooldown`, `p.iFrames=Math.max(p.iFrames,duration+graceIFrames)`, `_dodgeRolls++`, dźwięk `sound.dodge()`, kurz (`particles.burst`, szare, ~8).
  - W `_updatePlayerMovement`: gdy `dodgeTimer>0`, prędkość = kierunek × `distance/duration` (wejście ignorowane), ruch krokowo co ≤0,25 kratki przez `_canPlayerOccupy`; przeszkoda kończy doskok (`dodgeTimer=0`, prędkość 0); co `duration/ghostCount` dodaj ducha `{x:p.x,y:p.y,life:ghostLife}`. `dodgeCd` i życie duchów maleją co klatkę.
  - `_resetMovementState()` zeruje też `dodgeTimer`, `dodgeCd`, `_dodgeGhosts`.
  - `_renderDodgeGhosts`: ikona klasy gracza (jak w `_renderPlayerBodyAndIcon`) z `globalAlpha = .35*life/ghostLife`; wołane w `_renderSceneActors` przed `_renderPlayer`. W `_renderPlayer` miganie od `iFrames` pomijane, gdy `dodgeTimer>0` lub `iFrames` pochodzą z uniku (`p.dodgeCd>DODGE_TUNING.cooldown-DODGE_TUNING.duration-DODGE_TUNING.graceIFrames`).
  - `SoundFX.dodge()`: krótki świst, np. `_play(900,'triangle',.07,.05)` i po 30 ms `_play(500,'sine',.08,.04)`.
  - Klawisze: `DEFAULT_KEYS.dodge=' '` zamiast `wait`; `KEY_LABELS.dodge='Unik'`; `loadKeyBindings` przenosi `wait`→`dodge`, gdy brak `dodge`, i usuwa `wait`. W `input.js` akcja `dodge` w `_getBoundActionOrder` zamiast `wait`, `_runBoundAction` → `event.preventDefault(); this.tryDodge();`, `_isWorldAction` obejmuje `dodge`.
  - HUD: `<div id="dodge-indicator"><span>💨</span></div>` w `#ui-overlay` (obok `#quickslots`; CSS: pozycja `bottom:8px; left:100px`, 40×40, styl jak `.qs`, nakładka `conic-gradient` z `--p` jak `.cd-radial`, klasa `ready-flash` przy powrocie gotowości). Aktualizacja w `_updateHUD`, tylko gdy zmienia się zaokrąglona wartość `--p` (cache jak inne elementy HUD).
  - Ekran tytułowy: w linii sterowania „Spacja — Czekaj” → „Spacja — Unik”.
  - Licznik: `core.js` `_dodgeRolls:0`; `start` zeruje; `_buildSaveRunMeta` → `dodgeRolls`; `_restoreRunStateFromSave` → `_safeRunInt(saveData.dodgeRolls)`; `_applySaveBaseDefaults` → domyślne 0.

- [ ] **Step 4: Uruchom testy `move:` i `dodge:` — PASS.** Fuzz `rogue` — PASS. Zrzut ekranu uniku (smuga duchów) do oceny.

- [ ] **Step 5: Commit** — „2.4 krok 2: unik na Spacji”.

---

### Task 3: Czytelny atak gracza — łuk cięcia i linia kierunku

**Files:**
- Modify: `src/game/combat.js` (`playerAttack`), `src/game/movement.js` (stan efektu), `src/game/loop.js` (`_updateRuntimeVisualSystems`), `src/game/render.js` (`_renderSceneActors`)

**Interfaces:**
- Produces: `Game._slashFx` (tablica `{x,y,angle,range,life,maxLife}`); `Game._spawnSlashFx(angle, range)`; `Game._updateSlashFx(dt)`; `Game._renderSlashFx(ctx,cx,cy)`; `Game._renderAimLine(ctx,cx,cy)`. Stałe w `movement.js`: `SLASH_FX = {spread: 50*Math.PI/180, life:.15}`, `AIM_LINE = {length:1.2, alpha:.25}`.

- [ ] **Step 1: Napisz testy `slash:`**

```js
RT.test('slash: wojownik — łuk o zasięgu 1,8 w stronę kursora, także przy chybieniu', async()=>{
  const {p}=RT.setup('warrior'); Game.mouseWorldX=p.x+.5; Game.mouseWorldY=p.y+3.5; p.attackTimer=0; Game.playerAttack();
  RT.eq(Game._slashFx.length,1); RT.near(Game._slashFx[0].range,1.8,1e-9); RT.near(Game._slashFx[0].angle,Math.PI/2,.05);
});
RT.test('slash: znika po 0,15 s', async()=>{
  const {p}=RT.setup('warrior'); p.attackTimer=0; Game.playerAttack(); RT.step(.2); RT.eq(Game._slashFx.length,0);
});
RT.test('slash: mag nie tworzy łuku', async()=>{
  const {p}=RT.setup('mage'); p.attackTimer=0; Game.playerAttack(); RT.eq((Game._slashFx||[]).length,0);
});
RT.test('slash: render łuku i linii kierunku bez błędów', async()=>{
  const {p}=RT.setup('warrior'); p.attackTimer=0; Game.playerAttack(); Game.render(); RT.ok(true);
});
RT.test('slash: łuk nie powstaje na cooldownie ataku', async()=>{
  const {p}=RT.setup('warrior'); p.attackTimer=0; Game.playerAttack(); Game.playerAttack(); RT.eq(Game._slashFx.length,1);
});
```

- [ ] **Step 2: Uruchom `slash:` — FAIL.**

- [ ] **Step 3: Zaimplementuj** — w `playerAttack` dla `warrior`/`rogue`, po przejściu sprawdzenia cooldownu, `_spawnSlashFx(kąt do kursora, range)` przed `_performMeleeAttack`; `_updateSlashFx` w `_updateRuntimeVisualSystems`; `_renderSlashFx` — wycinek łuku (`ctx.arc` ±`spread` wokół `angle`, promień `range*TILE_SIZE` od środka gracza), jasny obrys + półprzezroczyste wypełnienie, alfa ∝ `life/maxLife`; `_renderAimLine` — tylko `mage`/`necromancer`, gdy gra nie w pauzie: linia od środka gracza w stronę kursora długości `AIM_LINE.length` kratki, `globalAlpha=AIM_LINE.alpha`, kolor klasy. Oba wołane w `_renderSceneActors` po `_renderPlayer`.

- [ ] **Step 4: `move:`, `dodge:`, `slash:` — PASS.** Zrzut ekranu łuku do oceny.

- [ ] **Step 5: Commit** — „2.4 krok 3: łuk cięcia i linia kierunku”.

---

### Task 4: Moduł zapowiedzi + „zajęty” boss + tupnięcie

**Files:**
- Create: `src/game/telegraphs.js`
- Modify: `index.html` (po `movement.js`), `src/game/loop.js` (`_updateCoreSystems`), `src/game/render.js` (`_renderSceneActors` — przed postaciami), `src/game/world.js` (`generateFloor`), `src/game/lifecycle.js` (`start`), `src/game/save.js` (`_restoreEntitiesFromSave`), `src/game/bosses.js` (`_updateBossAI`, `_bossAbilityStomp`)

**Interfaces:**
- Consumes: `damagePlayer`, `screenFX`, `particles`, `dungeon.visible`.
- Produces:
  - `Game.telegraphs` (tablica).
  - `Game.addTelegraph(opts) -> t`; `opts`: `shape` (`'circle'|'ring'|'cone'|'line'`), `x,y` (świat, środek), `r`, `inner` (ring, domyślnie 0), `angle`, `spread` (cone), `length`, `width` (line), `duration`, `color`, `source`, `cancelOnSourceDeath` (bool), `cancelOnSourceCc` (bool — anuluj przy `stunTimer>0` lub `freezeTimer>0`), `onResolve(t)`. Obiekt dostaje `elapsed=0`, `done=false`, `cancelled=false`.
  - `Game._pointInTelegraph(t, px, py) -> boolean` (circle: `d<=r`; ring: `inner<=d<=r`; cone: `d<=r` i różnica kąta `<=spread`; line: rzut na oś w `[0,length]` i odległość od osi `<=width/2`).
  - `Game.isPlayerInTelegraph(t) -> boolean` (środek gracza `p.x+.5,p.y+.5`).
  - `Game.updateTelegraphs(dt)` — wołane w `_updateCoreSystems` (więc nie w pauzie); po rozstrzygnięciu/anulowaniu `done=true` i usunięcie z listy.
  - `Game.clearTelegraphs()`; `Game._renderTelegraphs(ctx,cx,cy)`.
  - `Game._bossTelegraph(boss, opts) -> t` — skraca `duration` ×0,7 przy `boss.phase>=3`, ustawia `cancelOnSourceDeath:true`, `source:boss`, zapisuje `boss._telegraph=t`.
  - `Game._isEnemyTelegraphing(e) -> boolean` — `!!(e._telegraph && !e._telegraph.done)`.
  - Stała `BOSS_AOE_DAMAGE_MULT = 1.2` w `telegraphs.js`.

- [ ] **Step 1: Napisz testy `tele:`**

```js
const mkBoss=(p,ab)=>{const b=Game._makeEnemy({name:'TBoss',icon:'👹',hp:2000,atk:20,def:0,xp:1,gold:1,speed:1,ai:'boss'},p.x+2,p.y);
  b.isBoss=true;b.abilities=[ab];b.abilityTimer=99;b.phase=1;Game.enemies=[b];return b;};
RT.test('tele: geometria circle/ring/cone/line', async()=>{
  RT.setup(); const P=Game._pointInTelegraph.bind(Game);
  RT.ok(P({shape:'circle',x:0,y:0,r:2},1.9,0)); RT.ok(!P({shape:'circle',x:0,y:0,r:2},2.1,0));
  RT.ok(P({shape:'ring',x:0,y:0,r:3,inner:1},2,0)); RT.ok(!P({shape:'ring',x:0,y:0,r:3,inner:1},.5,0));
  RT.ok(P({shape:'cone',x:0,y:0,r:5,angle:0,spread:.3},4,.5)); RT.ok(!P({shape:'cone',x:0,y:0,r:5,angle:0,spread:.3},0,4));
  RT.ok(P({shape:'line',x:0,y:0,angle:0,length:5,width:.6},3,.2)); RT.ok(!P({shape:'line',x:0,y:0,angle:0,length:5,width:.6},3,.5));
});
RT.test('tele: obrażenia tylko w chwili rozstrzygnięcia i tylko w strefie', async()=>{
  const {p}=RT.setup(); let hits=0;
  Game.addTelegraph({shape:'circle',x:p.x+.5,y:p.y+.5,r:1,duration:.5,onResolve:t=>{if(Game.isPlayerInTelegraph(t))hits++;}});
  RT.step(.4); RT.eq(hits,0,'za wcześnie'); RT.step(.15); RT.eq(hits,1); RT.eq(Game.telegraphs.length,0);
  Game.addTelegraph({shape:'circle',x:p.x+.5,y:p.y+.5,r:1,duration:.2,onResolve:t=>{if(Game.isPlayerInTelegraph(t))hits++;}});
  p.x+=3; RT.step(.3); RT.eq(hits,1,'gracz uciekł ze strefy');
});
RT.test('tele: anulowanie przy śmierci źródła i przy CC', async()=>{
  const {p}=RT.setup(); let fired=0; const e={hp:10,stunTimer:0,freezeTimer:0};
  Game.addTelegraph({shape:'circle',x:0,y:0,r:1,duration:.2,source:e,cancelOnSourceDeath:true,onResolve:()=>fired++});
  e.hp=0; RT.step(.3); RT.eq(fired,0);
  const e2={hp:10,stunTimer:0,freezeTimer:0};
  Game.addTelegraph({shape:'circle',x:0,y:0,r:1,duration:.2,source:e2,cancelOnSourceCc:true,onResolve:()=>fired++});
  e2.stunTimer=1; RT.step(.3); RT.eq(fired,0);
});
RT.test('tele: nie postępuje w pauzie (prawdziwa pętla gry)', async()=>{
  RT.setup(); let fired=0; Game.addTelegraph({shape:'circle',x:0,y:0,r:1,duration:.3,onResolve:()=>fired++});
  Game.paused=true; await new Promise(r=>setTimeout(r,500)); RT.eq(fired,0);
  Game.paused=false; await new Promise(r=>setTimeout(r,500)); RT.eq(fired,1);
});
RT.test('tele: czyszczone przy zmianie piętra i wczytaniu', async()=>{
  RT.setup(); Game.addTelegraph({shape:'circle',x:0,y:0,r:1,duration:5,onResolve:()=>{}}); Game.generateFloor(); RT.eq(Game.telegraphs.length,0);
  Game.addTelegraph({shape:'circle',x:0,y:0,r:1,duration:5,onResolve:()=>{}}); Game.saveGame(3); Game.loadGame(3); RT.eq(Game.telegraphs.length,0);
  localStorage.removeItem('dos_save_3');
});
RT.test('tele: tupnięcie — zapowiedź 0,75 s, potem obrażenia ×1,2', async()=>{
  const {p}=RT.setup(); const b=mkBoss(p,'stomp'); const hp0=p.hp;
  Game._triggerBossAbility(b,'stomp',2); RT.eq(Game.telegraphs.length,1); RT.near(Game.telegraphs[0].duration,.75,1e-9);
  RT.eq(Game.telegraphs[0].shape,'circle'); RT.near(Game.telegraphs[0].r,4,1e-9);
  RT.eq(p.hp,hp0,'brak obrażeń przed uderzeniem'); p.iFrames=0; RT.step(.8); RT.ok(p.hp<hp0,'trafiony po uderzeniu');
});
RT.test('tele: furia skraca zapowiedź ×0,7', async()=>{
  const {p}=RT.setup(); const b=mkBoss(p,'stomp'); b.phase=3; Game._triggerBossAbility(b,'stomp',2);
  RT.near(Game.telegraphs[0].duration,.75*.7,1e-9);
});
RT.test('tele: boss zabity w trakcie — brak obrażeń', async()=>{
  const {p}=RT.setup(); const b=mkBoss(p,'stomp'); const hp0=p.hp; Game._triggerBossAbility(b,'stomp',2);
  b.hp=0; RT.step(.9); RT.eq(p.hp,hp0);
});
RT.test('tele: boss stoi i nie bije wręcz podczas zapowiedzi', async()=>{
  const {p}=RT.setup(); const b=mkBoss(p,'stomp'); b.x=p.x+1;b.y=p.y; Game._triggerBossAbility(b,'stomp',1);
  const bx=b.x; Game.updateEnemies(.3); RT.eq(b.x,bx); RT.ok(!(b.windup>0),'brak rozmachu w trakcie zapowiedzi');
});
RT.test('tele: render bez błędów', async()=>{
  const {p}=RT.setup(); for(const shape of ['circle','ring','cone','line'])Game.addTelegraph({shape,x:p.x+.5,y:p.y+.5,r:3,inner:1,angle:0,spread:.4,length:4,width:.5,duration:1,color:'#f40',onResolve:()=>{}});
  RT.step(.5); Game.render(); RT.ok(true);
});
```

- [ ] **Step 2: Uruchom `tele:` — FAIL.**

- [ ] **Step 3: Zaimplementuj `telegraphs.js` i tupnięcie**
  - Moduł wg Interfaces. `updateTelegraphs`: przyrost `elapsed`; sprawdzenie anulowania (`cancelOnSourceDeath` → `source.hp<=0`; `cancelOnSourceCc` → `source.stunTimer>0||source.freezeTimer>0`); po `elapsed>=duration` → `onResolve(t)` w `try/finally` z `done=true`.
  - `_renderTelegraphs`: pomija zapowiedzi, których kafel środka nie jest `dungeon.visible`; kontur w `color` (domyślnie `#ff4422`) + wypełnienie rosnące od środka (promień/długość × `elapsed/duration`), alfa wypełnienia ~.18→.35; w ostatnich 15% czasu dodatkowy rozbłysk (jak `_renderEnemyWindup`, `prog>.85`).
  - `clearTelegraphs` w `start`, `generateFloor`, `_restoreEntitiesFromSave`; `Game.telegraphs=[]` także w `core.js`.
  - `_updateBossAI`: po aktualizacji faz — jeśli `_isEnemyTelegraphing(boss)`, `return` (boss stoi, nie odlicza `abilityTimer`, nie atakuje).
  - `_bossAbilityStomp(boss)`: `_bossTelegraph(boss,{shape:'circle',x:boss.x+.5,y:boss.y+.5,r:4,duration:.75,color:'#ff7a33',onResolve:t=>{...}})`; w `onResolve`: jeśli `isPlayerInTelegraph(t)` → `damagePlayer(Math.floor(boss.atk*.8*BOSS_AOE_DAMAGE_MULT), ...)` + mocny shake; cząsteczki zawsze. Środek liczony przy starcie (boss i tak stoi).

- [ ] **Step 4: `move:`, `dodge:`, `slash:`, `tele:` — PASS.** Fuzz `warrior` i `mage` — PASS. Zrzut ekranu zapowiedzi tupnięcia.

- [ ] **Step 5: Commit** — „2.4 krok 4: system zapowiedzi + tupnięcie bossa”.

---

### Task 5: Pozostałe umiejętności bossów + cios bossa z rozmachem

**Files:**
- Modify: `src/game/bosses.js` (wszystkie `_bossAbility*`, `_bossFallbackCombatAndChase`)

**Interfaces:**
- Consumes: `_bossTelegraph`, `isPlayerInTelegraph`, `BOSS_AOE_DAMAGE_MULT`, `_startEnemyWindup`, `_updateEnemyWindup` (z `enemies.js`).
- Produces: brak nowych publicznych nazw; umiejętności zachowują sygnatury wołane przez `_triggerBossAbility`.

Wartości (ze specyfikacji, przed mnożnikiem furii):

| Umiejętność | shape | parametry | duration | onResolve |
|---|---|---|---|---|
| `rift_nova` | ring | r=4,5, inner=0, kolor `#9c7bff` | 0,8 | obrażenia jak dziś (intensywność wg odległości od bossa) ×1,2 gdy w strefie; 12 pocisków; licznik `_riftNovaSurvived` jeśli gracz żyje |
| `obelisk_storm` | ring | r=5,3, inner=0, `#6f93ff` | 0,8 | jak wyżej, 10 pocisków, `_obeliskStormSurvived` |
| `mirror_dash` | circle | r=2,2 w punkcie lądowania (liczonym na starcie jak dziś; niedostępny → losowy pokój jak dziś) | 0,5 | przeniesienie bossa w punkt, obrażenia `atk*.85*1.2` gdy w strefie, `_mirrorDashSurvived` |
| `charge` | line | od bossa, kąt do gracza na starcie, length=4, width=1 | 0,55 | ruch bossa po linii jak dziś (przerwanie na ścianie), `_enemyAttack(boss)` gdy gracz w strefie linii |
| `breath` | cone | r=6, spread=.5, kąt do gracza na starcie | 0,45 | 8 pocisków jak dziś w zakresie stożka |
| `fireball` | cone | r=6, spread=.3 | 0,45 | 3 pociski jak dziś |
| `summon` | circle ×3 | r=.6 w wylosowanych na starcie wolnych punktach | 0,6 | wróg w każdym punkcie (tylko jedna zapowiedź jest `boss._telegraph`; wszystkie z `cancelOnSourceDeath`) |
| `teleport` | circle | r=.8 w środku wylosowanego na starcie pokoju | 0,4 | przeniesienie bossa |

- [ ] **Step 1: Napisz testy `boss:`** (użyj `mkBoss` z Task 4)

```js
const abilities={rift_nova:['ring',.8,4.5],obelisk_storm:['ring',.8,5.3],mirror_dash:['circle',.5,2.2],charge:['line',.55],breath:['cone',.45,6],fireball:['cone',.45,6],summon:['circle',.6,.6],teleport:['circle',.4,.8]};
for(const [ab,[shape,dur,r]] of Object.entries(abilities)){
  RT.test(`boss: ${ab} — zapowiedź ${shape} ${dur}s, brak efektu przed uderzeniem`, async()=>{
    const {p}=RT.setup(); const b=mkBoss(p,ab); const hp0=p.hp, n0=Game.enemies.length, pr0=Game.projectiles.length, bx=b.x, by=b.y;
    Game._triggerBossAbility(b,ab,Util.dist(b.x,b.y,p.x,p.y));
    const t=Game.telegraphs[0]; RT.eq(t.shape,shape); RT.near(t.duration,dur,1e-9); if(r!==undefined)RT.near(t.r,r,1e-9);
    RT.eq(p.hp,hp0); RT.eq(Game.enemies.length,n0); RT.eq(Game.projectiles.length,pr0); RT.eq(b.x,bx); RT.eq(b.y,by);
    RT.step(dur+.05); RT.ok(Game.telegraphs.filter(x=>x.source===b).length===0,'rozstrzygnięte');
  });
}
RT.test('boss: summon — potwory pojawiają się dopiero po zapowiedzi', async()=>{
  const {p}=RT.setup(); const b=mkBoss(p,'summon'); Game._triggerBossAbility(b,'summon',2); RT.eq(Game.enemies.length,1); RT.step(.7); RT.ok(Game.enemies.length>1);
});
RT.test('boss: mirror_dash ląduje w punkcie zapowiedzi, nawet gdy gracz się ruszy', async()=>{
  const {p}=RT.setup(); const b=mkBoss(p,'mirror_dash'); Game._triggerBossAbility(b,'mirror_dash',2);
  const t=Game.telegraphs[0]; p.x+=3; RT.step(.6); RT.near(b.x+.5,t.x,.01); RT.near(b.y+.5,t.y,.01);
});
RT.test('boss: nova trafia mocniej niż przed remasterem (×1,2)', async()=>{
  const {p}=RT.setup(); const b=mkBoss(p,'rift_nova'); b.x=p.x;b.y=p.y; p.def=0; p.equipment.armor=null; p.talents.dodge=0; p.talents.manaShield=0;
  const hp0=p.hp; Game._triggerBossAbility(b,'rift_nova',0); RT.step(.85);
  RT.eq(hp0-p.hp, Math.max(1,Math.floor(Math.max(1,Math.floor(b.atk*.8))*1.2)));
});
RT.test('boss: zwykły cios z rozmachem, nie natychmiast', async()=>{
  const {p}=RT.setup(); const b=mkBoss(p,'stomp'); b.abilityTimer=99; b.x=p.x+1;b.y=p.y; b.attackTimer=0; const hp0=p.hp;
  Game.updateEnemies(1/60); RT.ok(b.windup>0,'rozmach'); RT.eq(p.hp,hp0,'brak natychmiastowego ciosu');
});
```

  (Oczekiwana wartość w teście novy: intensywność 1 przy `dist=0` → `floor(atk*(.45+.35))=floor(atk*.8)`, potem ×1,2 i floor; `damagePlayer` przy zerowej obronie odejmuje `floor(0)` — implementacja liczy obrażenia jako `Math.max(1,Math.floor(base*BOSS_AOE_DAMAGE_MULT))`.)

- [ ] **Step 2: Uruchom `boss:` — FAIL.**

- [ ] **Step 3: Zaimplementuj** wg tabeli: każda funkcja liczy dane „na starcie” (kąt, punkt lądowania, punkty przywołania, pokój), wywołuje `_bossTelegraph`, a dotychczasowy kod efektu przenosi do `onResolve` (wewnątrz: wyjście, jeśli `boss.hp<=0`). Logi „X przywołuje / zionie / rozdziera…” na starcie zapowiedzi (ostrzeżenie dla gracza). `_bossFallbackCombatAndChase(boss,dt,dist)`: najpierw `if(this._updateEnemyWindup(boss,dt,dist))return;`, potem `dist<1.5&&boss.attackTimer<=0` → `_startEnemyWindup(boss)`, inaczej gonienie jak dziś.

- [ ] **Step 4: `tele:` i `boss:` — PASS;** fuzz wszystkich 4 klas — PASS. Zrzuty ekranu: nova (ring), szarża (line), zionięcie (cone).

- [ ] **Step 5: Commit** — „2.4 krok 5: zapowiedzi wszystkich umiejętności bossów”.

---

### Task 6: Strzelcy i pulsy elit

**Files:**
- Modify: `src/game/enemies.js` (`_enemyRangedAttack`, `_runEnemyCombatBehavior`, `_tryEliteRiftPulse`, `_tryEliteObeliskPulse`)

**Interfaces:**
- Consumes: `addTelegraph`, `_isEnemyTelegraphing`.
- Produces: brak nowych publicznych nazw. Stała `RANGED_TELEGRAPH = {duration:.35, width:.15}` w `telegraphs.js`; `ELITE_PULSE_TELEGRAPH = .4`.

- [ ] **Step 1: Napisz testy `ranged:`**

```js
const mkShooter=(p)=>{const e=Game._makeEnemy({name:'TShooter',icon:'🏹',hp:50,atk:10,def:0,xp:1,gold:1,speed:2,ai:'ranged',projectileSpeed:6},p.x+4,p.y);
  e.alerted=true;e.attackTimer=0;Game.enemies=[e];return e;};
RT.test('ranged: linia celowania 0,35 s, pocisk dopiero po niej', async()=>{
  const {p}=RT.setup(); const e=mkShooter(p); Game._enemyRangedAttack(e);
  RT.eq(Game.telegraphs.length,1); RT.eq(Game.telegraphs[0].shape,'line'); RT.near(Game.telegraphs[0].duration,.35,1e-9);
  RT.eq(Game.projectiles.length,0); RT.step(.4); RT.eq(Game.projectiles.length,1);
});
RT.test('ranged: kierunek ustalony na starcie — krok w bok wystarcza', async()=>{
  const {p}=RT.setup(); const e=mkShooter(p); Game._playerVelX=0;Game._playerVelY=0; Game._enemyRangedAttack(e);
  const ang=Game.telegraphs[0].angle; p.y+=2; RT.step(.4);
  const pr=Game.projectiles[0]; RT.near(Math.atan2(pr.vy,pr.vx),ang,.01);
});
RT.test('ranged: zabity lub ogłuszony strzelec nie strzela', async()=>{
  const {p}=RT.setup(); const e=mkShooter(p); Game._enemyRangedAttack(e); e.hp=0; RT.step(.4); RT.eq(Game.projectiles.length,0);
  const e2=mkShooter(p); Game._enemyRangedAttack(e2); e2.stunTimer=1; RT.step(.4); RT.eq(Game.projectiles.length,0);
});
RT.test('ranged: stoi podczas celowania i nie zaczyna drugiego', async()=>{
  const {p}=RT.setup(); const e=mkShooter(p); Game._enemyRangedAttack(e); const x=e.x;
  Game.updateEnemies(.2); RT.eq(e.x,x); RT.eq(Game.telegraphs.length,1);
});
RT.test('ranged: puls elity szczelinowej i obeliskowej z zapowiedzią 0,4 s', async()=>{
  for(const flag of ['riftbound','obeliskbound']){
    const {p}=RT.setup(); const e=mkShooter(p); e[flag]=true; e.riftPulseTimer=0; e.obeliskPulseTimer=0;
    const fn=flag==='riftbound'?'_tryEliteRiftPulse':'_tryEliteObeliskPulse'; Game[fn](e,3,1/60);
    RT.eq(Game.projectiles.length,0,flag); RT.near(Game.telegraphs[0].duration,.4,1e-9); RT.step(.45); RT.ok(Game.projectiles.length>0,flag);
  }
});
```

- [ ] **Step 2: Uruchom `ranged:` — FAIL.**

- [ ] **Step 3: Zaimplementuj**
  - `_enemyRangedAttack(e)`: oblicz punkt celowania z wyprzedzeniem jak dziś; `e.attackTimer=e.attackCd*1.5` na starcie; `e._telegraph = addTelegraph({shape:'line', x:e.x+.5, y:e.y+.5, angle, length: dist+1, width: RANGED_TELEGRAPH.width, duration: RANGED_TELEGRAPH.duration, color: e.projectileColor||'#f4f', source:e, cancelOnSourceDeath:true, cancelOnSourceCc:true, onResolve: ...})`; w `onResolve` pocisk z aktualnej pozycji strzelca w zapisanym kierunku (punkt docelowy = start + kierunek × 10), animacja `attackAnim` jak dziś.
  - `_runEnemyCombatBehavior` (i `updateEnemies` dla strzelców): na początku `if(this._isEnemyTelegraphing(e))return;` — stoi, nie ucieka, nie strzela ponownie.
  - Pulsy elit: `riftbound` → `ring` r=1,5 wokół elity, 0,4 s, kolor `#8f7bff`, bolce w `onResolve`; `obeliskbound` → `cone` r=8,5, spread=.6, kąt do gracza na starcie, 0,4 s, `#6f93ff`, bolce w `onResolve` po tym kącie. Oba z `cancelOnSourceDeath:true, cancelOnSourceCc:true`; timery pulsów resetowane na starcie zapowiedzi.

- [ ] **Step 4: `tele:`, `boss:`, `ranged:` — PASS;** fuzz 4 klas — PASS. Zrzut ekranu linii celowania.

- [ ] **Step 5: Commit** — „2.4 krok 6: zapowiedzi strzelców i pulsów elit”.

---

### Task 7: Styl pocisków wrogów, changelog, wersja, sprzątanie

**Files:**
- Modify: `src/projectile.js` (`draw`), `src/game/meta-ui.js` (`openChangelog`), `src/config.js` (`GAME_VERSION`), `index.html` (banner)
- Delete: `.claude/remaster-tests.js`

**Interfaces:**
- Consumes: wszystko powyżej.
- Produces: brak.

- [ ] **Step 1: Napisz testy `final:`**

```js
RT.test('final: render pocisków wroga i gracza bez błędów', async()=>{
  const {p}=RT.setup(); Game.projectiles.push(new Projectile(p.x+.5,p.y+.5,p.x+5,p.y,6,5,'#f4f',false,'fire'));
  Game.projectiles.push(new Projectile(p.x+.5,p.y+.5,p.x+5,p.y,6,5,'#88f',true)); Game.render(); RT.ok(true);
});
RT.test('final: wersja 2.4.0 i wpis w changelogu', async()=>{
  RT.eq(GAME_VERSION,'2.4.0'); Game.openChangelog(); RT.ok(document.getElementById('meta-panel').textContent.includes('2.4')); Game.closeMeta();
});
```

- [ ] **Step 2: Uruchom `final:` — FAIL.**

- [ ] **Step 3: Zaimplementuj**
  - `Projectile.draw`: gałąź `!this.fromPlayer` — rdzeń ciemny (`#1a0606`), obwódka `#ff4a3a` (lineWidth ~1.8), pulsująca poświata czerwonawa (alfa ∝ `pulse`), kolor elementu (`this.color`) jako wewnętrzny akcent; ślad w ciemnej czerwieni. Gałąź gracza bez zmian.
  - `config.js`: `GAME_VERSION = '2.4.0'`.
  - `meta-ui.js`: na początku listy `versions` wpis `{v:'2.4',title:'Remaster: czucie gry',items:[...]}` z punktami: płynny ruch z rozpędem; unik na Spacji (nietykalność, cooldown 1 s); łuk cięcia i linia celowania; zapowiedzi wszystkich umiejętności bossów (krótsze w furii) i mocniejsze uderzenia, gdy trafią; zwykły cios bossa z rozmachem; strzelcy celują przed strzałem; pulsy elit z zapowiedzią; wyraźne pociski wrogów.
  - `index.html`: banner „✦ Aktualizacja 2.0 „Echa Otchłani”…” → „✦ Aktualizacja 2.4 „Remaster: czucie gry”: płynny ruch, unik, zapowiedzi ataków ✦”.

- [ ] **Step 4: Weryfikacja końcowa**
  - Wszystkie prefiksy testów (`move:`, `dodge:`, `slash:`, `tele:`, `boss:`, `ranged:`, `final:`) — PASS.
  - Fuzz każdej z 4 klas po świeżym `navigate` — PASS; `read_console_messages` z `onlyErrors` — brak nowych błędów.
  - Zrzuty ekranu: pocisk wroga obok pocisku gracza, okno „Co nowego”, ekran tytułowy.
  - Usuń `.claude/remaster-tests.js`; `git status` nie pokazuje plików testowych.

- [ ] **Step 5: Commit** — „2.4 Remaster: czucie gry — pociski wrogów, changelog, wersja”.

- [ ] **Step 6: Lista do ręcznego sprawdzenia przez autora** (przekaż w podsumowaniu): wyczucie rozpędu i uniku; czy zapowiedzi są czytelne i uczciwe; trudność bossów 3/6/9/10 z unikiem; czy linia celowania maga/nekromanty nie przeszkadza.

## Review Focus

- **Unik w zamkniętym korytarzu / w rogu** — gracz nigdy nie kończy w ścianie i może się od razu ruszyć. Pokryte: Task 2, test „w ścianę” (4 kierunki) + Task 1 test 600 klatek.
- **Zapis, odczyt lub zmiana piętra w trakcie uniku albo zapowiedzi** — żadnej pozostałej nietykalności ani „zabłąkanego” uderzenia na nowej mapie. Pokryte: Task 2 test zapisu w trakcie uniku, Task 4 test czyszczenia.
- **Boss lub strzelec ginie w trakcie zapowiedzi** — atak się nie wykonuje. Pokryte: Task 4 „boss zabity”, Task 6 „zabity lub ogłuszony”.
- **Awans/okno otwiera się w trakcie zapowiedzi (pauza)** — zapowiedź zamiera i nie trafia gracza, który wybiera nagrodę. Pokryte: Task 4 test z prawdziwą pętlą gry.
- **Gracz z własnym przypisaniem klawisza „Czekaj”** — po aktualizacji jego klawisz robi unik, bez dwóch akcji na jednym klawiszu. Pokryte: Task 2 test migracji.
