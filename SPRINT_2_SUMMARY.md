# Sprint 2 Summary (2026-02-17)

## Status
- Zakres sprintu 2 został wdrożony.
- Kod przechodzi walidację (brak błędów składni/compile).
- Projekt gotowy do manualnego smoke-check.

## Najważniejsze zmiany

### 1) Save/Load i kompatybilność
- Save schema podniesione do v6.
- Dodane migracje fallback dla nowych pól:
  - `mysticEvents`
  - `shadowWellsUsed`
  - `lastRelicFloor`
  - `lastWellFloor`
- Guard na zapis z nowszej wersji gry.
- `loadGame` zmodularyzowane helperami (czytelniejsza i bezpieczniejsza ścieżka odtwarzania).

### 2) Eventy mapowe
- Event 1: `Relikt` (`TILE.EVENT`) — 3 warianty efektów.
- Event 2: `Studnia Cieni` (`TILE.WELL`) — ryzyko/nagroda.
- Cooldown eventów per floor (osobno dla Reliktu i Studni).
- Post-processing po generacji mapy usuwa event naruszający cooldown.

### 3) Balans eventów
- Wprowadzono centralny tuning przez `EVENT_BALANCE`.
- Ograniczono swing nagród i kar.
- Dostosowano spawn chance eventów pod stabilniejszy pacing (floor 3–8).

### 4) Debug overlay
- Overlay pokazuje telemetry runtime (FPS, floor, enemies, buffs, combo, event counters, cooldown status).
- Dodano status per-floor eventów (`FEvent`) i log telemetry po generacji piętra.
- Overlay ma toggle pod keybind (`debugOverlay`, domyślnie F3).
- Widoczność overlay zapisywana między sesjami.

### 5) UX i ustawienia
- Ekran startowy pokazuje skrót debug (dynamicznie, zgodnie z keybindem).
- Settings zawiera sekcję statusu panelu debug i przycisk przełączania.

## Pliki objęte sprintem
- `index.html`
- `SPRINT_SMOKE_CHECK.md`
- `SPRINT_CHANGELOG_2026-02-17.md`

## Ready-to-test checklist
1. Uruchom scenariusze z `SPRINT_SMOKE_CHECK.md` (S/C/E/N/D/V).
2. Sprawdź event cooldown per floor (`N5`) i telemetry (`FEvent`).
3. Sprawdź toggle + persystencję debug overlay (`D2`).
4. Sprawdź kompatybilność save migracji (`V1`, `V2`).

## Proponowany następny krok
- Po pozytywnym smoke-check: zamrozić liczby z `EVENT_BALANCE` i przejść do kolejnego małego pakietu contentu (1 event + 1 achievement) bez rozbudowy core systems.

## Known issues / Out of scope
- Projekt nadal działa jako monolit (`index.html`), więc większe zmiany nadal mają podwyższone ryzyko regresji.
- Brak automatycznych testów — jakość nadal opiera się o manualny smoke-check.
- Debug overlay jest narzędziem developerskim i nie jest częścią "czystego" UI gameplayowego.
- Brak zewnętrznego backupu zapisów (tylko localStorage), więc uszkodzone dane użytkownika mogą wymagać ręcznego resetu slotu.
