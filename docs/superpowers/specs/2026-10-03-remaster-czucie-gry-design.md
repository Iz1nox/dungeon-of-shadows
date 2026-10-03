# Remaster 2.4 „Czucie gry” — specyfikacja

Data: 2026-10-03
Dotyczy: Dungeon of Shadows — Część I (`E:\giera`)

## 1. Cel i kontekst

**Cel:** lekki remaster poprawiający *czucie gry*. Konkretnie dwa najsłabsze obszary wskazane przez autora:
1. **Ruch i sterowanie** — sztywny ruch, brak uniku, niewidoczny zasięg/kierunek ataku wręcz.
2. **Czytelność wrogów** — strzelcy i bossowie atakują bez zapowiedzi (umiejętności bossów zadają obrażenia w tej samej klatce, w której się zaczynają), pociski wrogów wyglądają jak pociski gracza.

**Sukces:** gracz widzi każdy groźny atak zanim trafi i ma narzędzie (unik), żeby na niego zareagować; ruch jest płynny, a ciosy czytelne. Reszta gry (content, UI, ekonomia) zostaje bez zmian.

**Ograniczenia (stałe):**
- Czysty JavaScript, bez buildu, bez modułów ES — klasyczne `<script src>` ładowane w `index.html`, każdy plik z własnym `'use strict';`. Gra otwiera się podwójnym kliknięciem.
- Zmiany o niskim ryzyku: nowe moduły wpięte w istniejący kod, bez przepisywania działającej logiki walki.
- Format zapisu bez zmian — stare zapisy wczytują się poprawnie.

**Poza zakresem:** nowe dźwięki dla wszystkich akcji, nowy content (wrogowie, przedmioty, klasy), przebudowa UI/menu, hit-stop i inne „soczystości” trafień.

## 2. Ruch i unik (`src/game/movement.js`)

### 2.1 Ruch z rozpędem
- Prędkość gracza dąży do prędkości docelowej (kierunek wejścia × `p.speed` × modyfikatory) zamiast przyjmować ją natychmiast.
- Czas rozpędu ≈ 0,08 s, czas hamowania ≈ 0,06 s (wykładnicze dążenie, niezależne od FPS).
- Modyfikatory prędkości docelowej bez zmian względem obecnego kodu: woda ×0,5, ukrycie ×0,7, bonusy `p.speed`.
- Kolizja przez istniejące `Game._canPlayerOccupy(x,y)` z rozdzieleniem osi (jak `_applyPlayerCollisionMovement`). Uderzenie w ścianę zeruje składową prędkości na tej osi.
- Wygładzona prędkość `_playerVelX/_playerVelY` (używana przez strzelców do wyprzedzenia) nadal liczona z faktycznego przesunięcia.

### 2.2 Unik
- Akcja **„Unik”** (domyślnie Spacja) zastępuje bezczynną akcję „Czekaj”.
- Kierunek: kierunek wejścia ruchu; gdy gracz stoi — w stronę kursora.
- Dystans ≈ 2,5 kratki w czasie 0,18 s (stała prędkość doskoku), cooldown 1,0 s liczony od startu.
- Nietykalność: przez cały doskok + 0,1 s po nim (`p.iFrames = max(p.iFrames, czas)`).
- Ruch doskoku krokowo sprawdzany `_canPlayerOccupy`; przeszkoda kończy doskok (bez wchodzenia w ścianę).
- Unik **nie** przerywa ukrycia łotrzyka; nie zmienia combo.
- Zablokowany, gdy `_isGameplayBlocked()` (pauza, wybór, śmierć) lub na cooldownie (bez spamu komunikatów — najwyżej `_combatFeedback`).
- Efekty: smuga 3–4 półprzezroczystych „duchów” postaci zanikających w ~0,2 s, cząsteczki kurzu na starcie, krótki dźwięk świstu (nowa metoda w `SoundFX`, syntetyczna jak pozostałe).
- Statystyka `_dodgeRolls` (licznik w stanie biegu, zapisywany jak inne liczniki, z migracją domyślnego 0). Bez nowych osiągnięć.

### 2.3 Klawisze
- `DEFAULT_KEYS.wait` → `DEFAULT_KEYS.dodge = ' '`; etykieta „Unik”.
- Migracja przy wczytaniu klawiszy: jeśli w `localStorage` istnieje `wait`, a nie ma `dodge`, wartość `wait` przechodzi do `dodge`; klucz `wait` jest usuwany.
- Ekran tytułowy: „Spacja — Czekaj” → „Spacja — Unik”.

### 2.4 HUD
- Mały wskaźnik gotowości uniku przy pasku zaklęć/quickslotach, w stylu radialnych cooldownów (conic-gradient), z błyskiem gotowości.

## 3. Czytelny atak gracza

- **Wojownik/Łotrzyk (melee):** przy każdym ataku rysowany łuk cięcia w stronę kursora, promień = faktyczny zasięg (1,8 kratki), rozwarcie ~100°, zanik ~0,15 s. Rysowany także przy chybieniu (pokazuje zasięg).
- **Mag/Nekromanta (dystans):** dyskretna linia kierunku strzału od postaci w stronę kursora (krótka, ~1,2 kratki, niska nieprzezroczystość), widoczna stale podczas gry.
- Logika trafień bez zmian (wybór celu z 2.3.1).

## 4. System zapowiedzi ataków (`src/game/telegraphs.js`)

### 4.1 Model
`Game.telegraphs` — tablica obiektów:

| Pole | Opis |
|---|---|
| `shape` | `'circle'`, `'ring'`, `'cone'`, `'line'` |
| `x, y` | środek/początek (współrzędne świata, środek kafla) |
| `r` | promień (circle/ring/cone) |
| `inner` | promień wewnętrzny (ring) |
| `angle, spread` | kierunek i połowa rozwarcia (cone) |
| `length, width` | długość i szerokość (line) |
| `duration, elapsed` | czas zapowiedzi i upływ |
| `color` | kolor bazowy |
| `source` | wróg-źródło (opcjonalnie) |
| `cancelOnSourceDeath` | czy anulować, gdy źródło zginie / zostanie ogłuszone lub zamrożone |
| `onResolve(t)` | wywoływane w chwili uderzenia |

API:
- `Game.addTelegraph(opts)` → zwraca obiekt.
- `Game.updateTelegraphs(dt)` — tylko gdy gra nie jest w pauzie (wołane z `_updateCoreSystems`).
- `Game.isPlayerInTelegraph(t)` — test geometrii względem środka gracza (`p.x+.5, p.y+.5`).
- `Game.clearTelegraphs()` — przy `generateFloor`, wczytaniu gry, starcie gry.
- `Game._renderTelegraphs(ctx,cx,cy)` — po kaflach, przed postaciami.

### 4.2 Wygląd
- Kontur kształtu + wypełnienie rosnące od środka proporcjonalnie do `elapsed/duration`.
- W ostatnich ~15% czasu mocniejszy rozbłysk (jak obecny `_renderEnemyWindup`).
- Czerwień/pomarańcz dla obrażeń; kolor umiejętności (fiolet nowej, błękit burzy) jako akcent konturu.
- Rysowane tylko na kaflach widocznych (pole widzenia gracza) — zapowiedzi poza wzrokiem nie zdradzają pozycji.

### 4.3 Reguła trafienia
Obrażenia obszarowe trafiają gracza tylko, jeśli **w chwili rozstrzygnięcia** stoi w strefie i nie ma `iFrames`. Pociski wystrzeliwane w `onResolve` zachowują się jak dziś.

## 5. Zapowiedzi bossów i wrogów

### 5.1 Umiejętności bossów (`src/game/bosses.js`)
Każda umiejętność dzielona na „zapowiedz” (wołane jak dziś przez `_triggerBossAbility`) i „uderz” (dotychczasowa logika przeniesiona do `onResolve`).

| Umiejętność | Zapowiedź | Czas | Uwagi |
|---|---|---|---|
| `stomp` | circle r=4 wokół bossa | 0,75 s | obrażenia gdy gracz w kole |
| `rift_nova` | ring r=4,5 | 0,8 s | obrażenia w strefie + wystrzał 12 pocisków |
| `obelisk_storm` | ring r=5,3 | 0,8 s | obrażenia w strefie + 10 pocisków |
| `mirror_dash` | circle r=2,2 w miejscu lądowania | 0,5 s | miejsce lądowania ustalane na starcie zapowiedzi |
| `charge` | line od bossa w stronę gracza, dł. 4 | 0,55 s | kierunek ustalany na starcie |
| `breath` | cone r=6, rozwarcie ±0,5 rad | 0,45 s | potem pociski jak dziś |
| `fireball` | cone r=6, rozwarcie ±0,3 rad | 0,45 s | potem pociski jak dziś |
| `summon` | circle r=0,6 w każdym miejscu pojawienia | 0,6 s | potwory pojawiają się w `onResolve` |
| `teleport` | circle r=0,8 w miejscu docelowym | 0,4 s | |

- Faza 3 (furia): czasy zapowiedzi ×0,7.
- Podczas zapowiedzi boss stoi w miejscu (nie goni, nie bije wręcz), dopóki zapowiedź się nie rozstrzygnie.
- Zapowiedzi bossa **nie** są anulowane przez jego ogłuszenie (bossowie i tak mają skrócone CC); anulowane, gdy boss zginie.
- Liczniki „przetrwanych” umiejętności (`_mirrorDashSurvived` itd.) naliczane w `onResolve`, jak dziś.
- Obrażenia obszarowe zapowiedzianych umiejętności: ×1,2 względem obecnych wartości.

### 5.2 Zwykły cios bossa
`_bossFallbackCombatAndChase` zamiast natychmiastowego `_enemyAttack` używa istniejącego mechanizmu rozmachu (`_startEnemyWindup` / `_updateEnemyWindup`) z kręgiem, jak zwykli wrogowie.

### 5.3 Strzelcy (`src/game/enemies.js`)
- `_enemyRangedAttack` zamiast strzału tworzy zapowiedź `line` (szer. ~0,15, dł. = dystans do celu + 1) na 0,35 s, z `cancelOnSourceDeath: true`.
- Punkt celowania (z wyprzedzeniem) ustalany na starcie zapowiedzi; pocisk wylatuje w `onResolve` w tym kierunku.
- Podczas zapowiedzi strzelec stoi w miejscu; `attackTimer` ustawiany na starcie (bez podwójnych strzałów).
- Pulsy elit (`riftbound`, `obeliskbound`): krótka zapowiedź ring/cone 0,4 s.

### 5.4 Pociski wrogów (`src/projectile.js`)
- Pociski `fromPlayer === false`: ciemny rdzeń, czerwonawa obwódka, pulsująca poświata; kolor elementu zachowany jako akcent.
- Pociski gracza bez zmian.

## 6. Wpięcie w kod

**Nowe pliki** (w `index.html` po `minions.js`, przed `inventory.js`):
- `src/game/movement.js`
- `src/game/telegraphs.js`

**Zmiany punktowe:**
- `loop.js` / `player.js` — ruch przez `movement.js`; `updateTelegraphs` w `_updateCoreSystems`.
- `bosses.js` — podział umiejętności na zapowiedź/uderzenie; cios bossa przez rozmach; boss stoi podczas zapowiedzi.
- `enemies.js` — strzał przez zapowiedź; pulsy elit.
- `combat.js` / `render.js` — łuk cięcia, linia kierunku, warstwa zapowiedzi, smuga uniku.
- `projectile.js` — styl pocisków wrogów.
- `input.js` / `keybindings.js` — akcja „Unik”, migracja klawiszy.
- `hud.js` / `index.html` / `styles.css` — wskaźnik uniku, opis sterowania.
- `sound.js` — dźwięk uniku.
- `save.js` / `lifecycle.js` / `world.js` — czyszczenie zapowiedzi i stanu uniku; licznik `_dodgeRolls` w zapisie (z domyślnym 0 dla starszych zapisów, bez podnoszenia `SAVE_COMPAT_TAG`).
- `meta-ui.js` / `config.js` — wpis 2.4 w „Co nowego”, `GAME_VERSION = '2.4.0'`, tekst bannera na ekranie tytułowym.

## 7. Kolejność wdrożenia
Każdy krok osobnym commitem; po każdym gra działa.
1. Rozpęd + unik (+ klawisz, HUD, dźwięk).
2. Łuk cięcia + linia kierunku.
3. Moduł zapowiedzi + `stomp` jako próba.
4. Pozostałe umiejętności bossów, cios bossa, strzelcy, pulsy elit.
5. Styl pocisków wrogów, balans (×1,2), changelog, wersja.

## 8. Testowanie
Gra nie ma frameworka testowego (i bez buildu go nie dostanie), więc:
- **Skrypty testowe w przeglądarce** (tymczasowy plik w `.claude/`, usuwany po pracy), sprawdzające m.in.:
  - unik nie kończy się w ścianie (`_canPlayerOccupy` po każdym doskoku przy ścianach i w korytarzach);
  - nietykalność trwa dokładnie okno uniku; cooldown blokuje ponowny unik;
  - unik i ruch nie działają w pauzie / podczas wyboru / po śmierci;
  - zapowiedź trafia gracza w strefie, nie trafia poza strefą ani w trakcie `iFrames`;
  - zabity/ogłuszony strzelec nie wystrzeliwuje zapowiedzianego pocisku;
  - zmiana piętra, zapis i odczyt w trakcie zapowiedzi — lista zapowiedzi pusta, brak błędów;
  - migracja klawisza `wait` → `dodge`.
- **Fuzz wszystkich 4 klas** (jak przy 2.3.1) po każdym kroku — zero błędów w konsoli.
- **Zrzuty ekranu** zapowiedzi, łuku cięcia i uniku do oceny wizualnej.
- **Lista do ręcznego sprawdzenia** przez autora: wyczucie uniku i rozpędu, czytelność zapowiedzi, trudność bossów.
