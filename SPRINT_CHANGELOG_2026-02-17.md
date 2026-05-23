# Sprint Changelog — 2026-02-17

## Zakres sprintu
- Stabilizacja save/load i walidacja danych zapisu.
- Combat UX polish (czytelne powody nieudanych akcji, mniej spamu logów).
- Balans ekonomii (mikstury/sklep/sprzedaż).
- Mały pakiet contentu (nowy wróg + nowy czar maga).
- Smoke-check checklista do regresji manualnej.

## Co zostało wdrożone

### 1) Save/Load hardening
- Dodano wersjonowanie zapisu przez stałą schematu.
- Dodano walidację slotu zapisu/wczytania.
- Dodano walidację struktury danych podczas load (obiekt zapisu, player, map/explored i ich rozmiary).
- Dodano fallbacki dla brakujących danych (np. rooms/lightSources/items/enemies).
- Dodano odtwarzanie dodatkowych metryk runa (bossKills, maxCombo, achievements).
- Utrzymano kompatybilność przez bezpieczne wartości domyślne.

### 2) Combat UX polish
- Dodano throttlowany mechanizm komunikatów feedbacku, aby ograniczyć spam.
- Uspójniono komunikaty dla:
  - cooldown ataku,
  - braku many,
  - braku celu w zasięgu,
  - teleportu poza zasięgiem/na niedozwolone pole.
- Rozszerzono feedback dla wybranych umiejętności (m.in. special, drain, backstab).

### 3) Economy + shop polish
- Lekko podniesiono wartość podstawowych mikstur HP/MP.
- Dostosowano ceny podstawowych mikstur w sklepie i współczynnik sprzedaży.
- W UI sklepu dodano informację „brakuje X💰”, gdy gracza nie stać na przedmiot.
- Ulepszono logi kupna/sprzedaży (koszt/przychód i stan złota po transakcji).
- Doprecyzowano log skrzyni, aby był bardziej skanowalny.

### 4) Nowy content
- Dodano nowego przeciwnika: Kultysta Otchłani (ranged).
- Dodano nowy czar maga w slocie 5: Burza Otchłani (chain).
- Wykonano micro-balance nowego contentu pod piętra 5–10.
- Dodano opcjonalne parametry per enemy dla ataku dystansowego (attackCd, projectileColor, projectileSpeed), bez przebudowy AI.

## Wynik walidacji
- Po każdej paczce zmian: brak błędów składni/compile w index.html.
- Checklista testów manualnych została dodana do pliku smoke-check.

## Znane ryzyka
- Projekt nadal działa jako monolit w jednym pliku, co zwiększa ryzyko regresji przy większych zmianach.
- Brak automatycznych testów; regresja opiera się na manualnym smoke-checku.
- localStorage pozostaje jedynym storage, więc uszkodzone dane użytkownika nadal mogą wymagać ręcznej interwencji.

## Sugerowany następny sprint
1. Lekka modularizacja bez bundlera:
   - wydzielenie sekcji danych (DB),
   - wydzielenie save/load,
   - wydzielenie combat logic.
2. Dodanie prostego trybu debug overlay (fps, floor, enemy count, active buffs) do szybszego balansu.
3. Drugi pakiet contentu low-risk:
   - 1 event mapowy,
   - 1 achievement powiązany z nowym eventem,
   - drobny pass balansu loot drop.

## Artefakty sprintu
- index.html
- SPRINT_SMOKE_CHECK.md

## Update po wdrożeniu Sprint 2 (kontynuacja)

### A) Save/Load v4 i modularizacja loadGame
- Podniesiono schema zapisu do wersji 4.
- Dodano migrację danych save (`_migrateSaveData`) z fallbackami dla starszych zapisów.
- Dodano guard na zapis z nowszej wersji gry (bez crasha, czytelny komunikat).
- Rozdzielono `loadGame` na mniejsze metody:
   - `_validateSaveMapData`,
   - `_restoreDungeonFromSave`,
   - `_restorePlayerFromSave`,
   - `_restoreEntitiesFromSave`,
   - `_restoreAchievementState`,
   - `_finalizeLoadUI`.

### A2) Save/Load v5 (kontynuacja)
- Podniesiono schema zapisu do wersji 5.
- Dodano pole `shadowWellsUsed` z migracją/fallback dla starszych zapisów.
- Utrzymano kompatybilność wsteczną dla zapisów bez nowych pól eventowych.

### A3) Save/Load v6 (cooldown eventów)
- Podniesiono schema zapisu do wersji 6.
- Dodano pola: `lastRelicFloor`, `lastWellFloor`.
- Dodano migrację fallback dla zapisów bez pól cooldown.

### B) Debug overlay
- Dodano panel debug w HUD z telemetrią runtime:
   - fps,
   - floor,
   - liczba wrogów,
   - aktywne buffy,
   - combo / max combo,
   - licznik reliktów,
   - czas runa.
- Aktualizacja overlay została wydzielona i uproszczona przez helper `_buildDebugOverlayText`.

### C) Event mapowy + achievement
- Dodano nowy tile eventowy „Relikt” (`TILE.EVENT`) i jego render na mapie/minimapie/fullmapie.
- Dodano spawn reliktu w generatorze lochu (low-risk, opcjonalnie od floor 2).
- Dodano interakcję z reliktem (3 warianty efektu: gold / blessing / blood pact).
- Dodano achievement powiązany z eventem (`event_3`, aktywacja 3 reliktów).
- Dodano drugi event low-risk: „Studnia Cieni” (`TILE.WELL`) ze spawnem od floor 3 i interakcją ryzyko/nagroda.
- Dodano render/kolory „Studni Cieni” na mapie głównej, minimapie i fullmapie.

### C2) Pass balansu eventów
- Przeniesiono liczby eventów do centralnego `EVENT_BALANCE` (łatwiejszy tuning).
- Zmniejszono swing losowych nagród (niższe piki mocy/złota, bardziej stabilny pacing).
- Dostosowano szanse spawnu reliktu/studni dla floor 3–8.

### C3) Cooldown eventów między piętrami
- Dodano cooldown występowania eventów per floor (`eventRepeatCooldownFloors`).
- Dodano post-processing po generacji mapy, który usuwa event, jeśli narusza cooldown.
- Mechanika działa osobno dla Reliktu i Studni Cieni.

### D) Smoke-check rozszerzony
- Rozszerzono checklistę o scenariusze:
   - relikt mapowy,
   - debug overlay,
   - kompatybilność save schema (stary i nowszy zapis).

## Update: Sprint 3 (architecture-first, kontynuacja)

### E) Dalsze odchudzenie ścieżki load/run
- Wydzielono helpery runtime podczas load:
   - `_ensureRuntimeCanvasReady`,
   - `_hideRuntimeScreens`,
   - `_restoreRunStateFromSave`.
- `loadGame` został skrócony do czytelnej orkiestracji kroków restore.

### F) Ujednolicenie telemetry eventów
- Dodano `_getFloorEventTraceSummary` jako wspólne źródło formatu telemetry eventów.
- Ten sam format jest używany w logu generacji piętra i w debug overlay (`FEvent`).

### G) Refaktor interakcji i inputu (bez zmian UX)
- Rozbito `interact()` na dedykowane handlery kafli:
   - `_handleStairsDownInteraction`,
   - `_handleChestInteraction`,
   - `_handleShrineInteraction`,
   - `_handleTileInteraction` (dispatcher).
- Odchudzono `initInput()` przez dispatcher keybindów:
   - `_processBoundKeyActions`,
   - `_runBoundAction`.
- Ujednolicono mapowanie kolorów kafli minimapy/fullmapy przez `_getMapTileColor`.

### G2) Refaktor renderu kafli (bez zmian wizualnych)
- Wydzielono helpery renderu dla głównych grup tile’i:
   - `_renderWallTile`,
   - `_renderFloorTile`,
   - `_renderInteractiveTile`,
   - `_renderDoorTile`,
   - `_renderStairsDownTile`.
- `render()` ma krótszy `switch(tile)`, co upraszcza dalsze zmiany i zmniejsza ryzyko regresji.

### G3) Refaktor animowanych kafli środowiskowych
- Wydzielono render animowanych tile’i do helperów:
   - `_renderWaterTile`,
   - `_renderLavaTile`.
- `render()` został dalej odchudzony bez zmian gameplay i bez zmiany wyglądu kafli.

### G4) Mikro-optymalizacja renderu plam krwi
- Zastąpiono kosztowny check tablicy `bloodStains.some(...)` w pętli renderu cachem `Set` (`_getBloodStainSet`).
- Efekt wizualny pozostał bez zmian; poprawa dotyczy wyłącznie kosztu sprawdzeń per-tile.

### G5) Dalsze odchudzenie render()
- Wydzielono render itemów i wrogów do helperów:
   - `_renderFloorItems`,
   - `_renderEnemy`,
   - `_renderEnemies`.
- `render()` pełni teraz bardziej rolę orkiestratora etapów rysowania (łatwiejsze utrzymanie i dalsze refaktory).

### G6) Refaktor renderu gracza
- Wydzielono blok rysowania postaci do `_renderPlayer` (shadow, aura klasy, icon, iFrames/stealth, rage aura).
- `render()` został dalej skrócony bez zmiany efektu wizualnego i bez zmian mechanik.

### G7) Refaktor końcówki render()
- Wydzielono kolejne etapy rysowania do helperów:
   - `_renderProjectilesAndEffects`,
   - `_renderFogOfWar`,
   - `_emitFloorAmbientParticles`,
   - `_renderFloorFogOverlay`,
   - `_drawCrosshair`.
- Główna metoda `render()` jest teraz głównie sekwencją wywołań etapów, co upraszcza dalsze utrzymanie.

### G8) Refaktor systemu oświetlenia
- `_drawLighting` został odchudzony do orkiestracji helperów:
   - `_drawPlayerLight`,
   - `_drawRoomLights`,
   - `_drawProjectileLights`.
- Efekty świetlne i kolejność kompozycji (`multiply`/`screen`) pozostają bez zmian wizualnych.

### G9) Odchudzenie aktualizacji HUD
- Wydzielono budowę HTML buff-bar do helpera `_buildBuffBarHtml`.
- `_updateHUD` ma krótszą ścieżkę aktualizacji i zachowuje identyczny output UI.

### G10) Refaktor minimapy i full mapy
- Wydzielono helpery markerów i warstw informacyjnych:
   - `_drawMinimapMarkers`,
   - `_drawFullMapMarkers`,
   - `_drawFullMapHeaderAndLegend`.
- `_drawMinimap` i `_drawFullMap` zostały skrócone do bardziej czytelnej orkiestracji etapów rysowania.

### G11) Refaktor UI sklepu i przejścia piętra
- Wydzielono budowę HTML sklepu do helperów:
   - `_buildShopBuySectionHtml`,
   - `_buildShopSellSectionHtml`,
   - `_buildShopHtml`.
- Wydzielono teksty/przygotowanie przejścia piętra:
   - `_getFloorTransitionSubtitle`,
   - `_setFloorTransitionContent`.
- `updateShopUI` i `showFloorTransition` są krótsze i bardziej modularne, bez zmiany UX.

### G12) Usunięcie duplikacji init runtime
- `loadFromTitle` używa teraz istniejącego helpera `_ensureRuntimeCanvasReady` zamiast własnej, powielonej inicjalizacji canvas/input.
- Mniej powielonego kodu, zachowanie bez zmian.

### G13) Refaktor ekranów końca gry
- Wydzielono wspólny formatter statystyk runa: `_buildRunSummaryLine`.
- `gameOver` i `victory` korzystają z jednego źródła HTML podsumowania (mniej duplikacji, łatwiejsze utrzymanie).

### G14) Refaktor UI wyborów (kapliczka / level-up)
- Dodano wspólny renderer przycisków wyboru: `_renderChoiceButtons`.
- Zarówno flow kapliczki (`_handleShrineInteraction`), jak i level-up (`showLevelUp`) korzystają z jednego helpera tworzenia przycisków.
- Mniej duplikacji DOM/UI przy zachowaniu tej samej logiki nagród i zamykania panelu.

### G15) Refaktor wyszukiwania pierwszego zapisu
- Dodano helpery:
   - `_findFirstSaveSlot`,
   - `_loadFirstAvailableSave`.
- `loadFromTitle` nie duplikuje już pętli po slotach zapisu.

### G16) Odchudzenie inventory UI
- Wydzielono helpery budowy panelu inventory:
   - `_buildInventoryEquipmentHtml`,
   - `_groupAndSortInventoryItems`,
   - `_getInventoryItemDesc`,
   - `_buildInventoryItemRowHtml`,
   - `_buildInventorySectionsHtml`.
- `updateInventoryUI` została uproszczona do orkiestracji sekcji (nagłówek, equipment, lista itemów).

### G17) Refaktor panelu ustawień
- `_renderSettings` został podzielony na helpery sekcyjne:
   - `_buildSettingsSaveRowsHtml`,
   - `_buildSettingsKeyRowsHtml`,
   - `_buildSettingsDebugHtml`,
   - `_buildSettingsFooterHtml`.
- Mniej duplikacji i prostsza rozbudowa sekcji settings.

### G18) Refaktor tooltipów itemów
- Wydzielono helpery budowy tooltipa:
   - `_buildTooltipBaseStatsHtml`,
   - `_buildTooltipComparisonHtml`,
   - `_buildTooltipSellHintHtml`,
   - `_buildItemTooltipHtml`.
- `showItemTooltip` odpowiada teraz głównie za pobranie itemu i pozycjonowanie tooltipa.

### G19) Mikro-cleanup tooltip DOM
- Dodano `_getItemTooltipEl` i podpięto go pod `showItemTooltip` oraz `hideItemTooltip`.
- Mniej powtarzalnych odwołań do `document.getElementById`.

### G20) Refaktor ścieżki użycia przedmiotów
- `useItem` odchudzone do dispatchera typów itemów.
- Wydzielono helpery:
   - `_usePotionItem`,
   - `_swapEquipmentFromInventory`,
   - `_equipWeaponItem`,
   - `_equipArmorItem`,
   - `_applyRingBonuses`,
   - `_equipRingItem`.
- Logika efektów i komunikatów gameplay pozostała bez zmian.

### G21) Mikro-cleanup zdejmowania pierścienia
- `unequipItem` (slot `ring`) korzysta teraz ze wspólnego helpera `_applyRingBonuses(item,-1)`.
- Usunięto duplikację modyfikacji statystyk przy zdejmowaniu pierścienia.

### G22) Refaktor podnoszenia i wyrzucania itemów
- Wydzielono helpery pickup:
   - `_findPickupCandidateIndex`,
   - `_pickupGoldItem`,
   - `_pickupInventoryItem`.
- Wydzielono helpery drop:
   - `_createDroppedItem`,
   - `_consumeInventoryForDrop`.
- `pickupItem` i `dropItem` są krótsze i czytelniejsze przy niezmienionym zachowaniu.

### G23) Mikro-cleanup pozycjonowania tooltipa
- Dodano `_getTooltipPosition(clientX, clientY)` i wykorzystano go w `showItemTooltip`.
- Uproszczono kod ustawiania `left/top` tooltipa.

### G24) Refaktor logiki castSpell
- Rozbito duży `switch` w `castSpell` na dedykowane handlery:
   - `_castSpellBuff`, `_castSpellAoe`, `_castSpellHeal`, `_castSpellProjectile`, `_castSpellChain`,
   - `_castSpellTeleport`, `_castSpellDash`, `_castSpellDot`, `_castSpellStealth`,
   - `_castSpellMultiProj`, `_castSpellDrain`, `_castSpellBackstab`.
- Dodano helper `_findNearestEnemyInRange` do wspólnego wyszukiwania celu.
- Zachowanie mechanik i komunikatów zostało zachowane.

### G25) Uproszczenie dispatchera castSpell
- `castSpell` korzysta teraz z mapy handlerów (`handlers[spell.type]`) zamiast rozbudowanego `switch`.
- Punkt wejścia do castowania jest krótszy i prostszy do rozszerzania o nowe typy czarów.

### G26) Refaktor special attack i boss HP UI
- `specialAttack` działa przez dispatcher klas i helpery:
   - `_specialAttackWarrior`,
   - `_specialAttackMage`,
   - `_specialAttackRogue`.
- Wydzielono aktualizację paska bossa do `_updateBossHpBar` i uproszczono `updateEnemies`.

### G27) Mikro-refaktor ścigania i teleportu elit
- W `updateEnemies` wydzielono helpery:
   - `_tryEliteTeleportBlink`,
   - `_chaseEnemyTowardPlayer`.
- Główna pętla AI jest krótsza, przy zachowaniu dotychczasowego zachowania pościgu/pathfindingu.

### G28) Refaktor ability AI bossa
- Wydzielono handlery umiejętności bossa:
   - `_bossAbilityCharge`,
   - `_bossAbilitySummon`,
   - `_bossAbilityFireball`,
   - `_bossAbilityTeleport`,
   - `_bossAbilityBreath`,
   - `_bossAbilityStomp`.
- Dodano dispatcher `_triggerBossAbility` i podpięto go w `_updateBossAI`.
- `_updateBossAI` pełni teraz bardziej rolę orkiestratora (timery/fazy/ruch), bez zmiany efektów gameplay.

### G29) Odchudzenie fallbacku bossa
- Wydzielono regularne zachowanie bossa (atak wręcz / pościg) do helpera `_bossFallbackCombatAndChase`.
- `_updateBossAI` deleguje teraz fallback walki/ruchu zamiast trzymać inline warunki.
- Zachowanie AI i progi dystansu pozostały bez zmian.

### G30) Refaktor hit-checków projectile
- Wydzielono rozpatrywanie trafień pocisków do helperów:
   - `_resolvePlayerProjectileHits`,
   - `_resolveEnemyProjectileHit`.
- `updateProjectiles` został uproszczony do orkiestracji update + dispatch hit-checków.
- Zachowanie obrażeń, iFrames, piercing oraz efektów cząsteczkowych pozostało bez zmian.

### G31) Refaktor `playerAttack`
- Wydzielono auto-atak maga do helpera `_performMageAutoAttack`.
- Wydzielono logikę melee (trafienie, crit, combo, efekty broni) do helpera `_performMeleeAttack`.
- `playerAttack` jest krótszy i działa jako kontrola flow/cooldownów, bez zmian mechanik obrażeń i efektów.

### G32) Refaktor `damageEnemy`
- Wydzielono obsługę absorpcji tarczy elity do `_applyEnemyShieldAbsorb`.
- Wydzielono kolor trafienia i efekty żywiołów do `_getElementHitColor` oraz `_applyEnemyElementHitEffects`.
- Wydzielono talent lifesteal gracza do `_applyPlayerLifeStealOnHit`.
- `damageEnemy` został uproszczony do sekwencji orkiestracyjnej bez zmian obrażeń/efektów.

### G33) Refaktor `damagePlayer`
- Wydzielono unik gracza do `_tryPlayerDodge`.
- Wydzielono absorpcję obrażeń przez manę do `_applyPlayerManaShields` (armor manaShield + talent manaShield).
- Wydzielono kontratak kolcami do `_applyPlayerThornsRetaliation`.
- `damagePlayer` zachowuje te same obliczenia def/iFrames/death-check, ale ma prostszy flow.

### G34) Refaktor czarów `chain` i `dash`
- Dla `chain` wydzielono helpery:
   - `_getChainSpellTargets`,
   - `_castChainSpellNoTarget`,
   - `_executeChainSpellHits`.
- Dla `dash` wydzielono helpery:
   - `_performDashMovement`,
   - `_resolveDashSpellHits`.
- `_castSpellChain` i `_castSpellDash` zostały skrócone do orkiestracji kroków bez zmian efektów/obrażeń.

### G35) Refaktor czarów `dot` / `drain` / `backstab`
- Wydzielono ścieżki trafienia i braku celu do helperów:
   - `_castSpellDotHit`, `_castSpellDotNoTarget`,
   - `_castSpellDrainHit`, `_castSpellDrainNoTarget`,
   - `_castSpellBackstabHit`, `_castSpellBackstabNoTarget`.
- Główne handlery tych czarów są krótsze i bardziej deklaratywne.
- Efekty wizualne, logi, komunikaty o braku celu oraz wartości obrażeń/heal pozostały bez zmian.

### G36) Refaktor `showLevelUp`
- Wydzielono budowę puli wyborów do helperów:
   - `_buildLevelUpBaseChoices`,
   - `_buildLevelUpClassTalentChoices`,
   - `_appendLevelUpRegenChoices`,
   - `_pickLevelUpChoices`.
- `showLevelUp` został skrócony do orkiestracji ekranu i wyboru opcji.
- Lista opcji, progi levelowe i efekty talentów/statów pozostały bez zmian.

### G37) Refaktor wyborów kapliczki
- Wydzielono budowę opcji kapliczki do helpera `_buildShrineChoices`.
- `_handleShrineInteraction` został odchudzony do logiki ekranu + renderu przycisków + zamknięcia flow.
- Treść opcji, koszty, walidacje i efekty pozostały bez zmian.

### G38) Odchudzenie `updateInventoryUI`
- Wydzielono budowę nagłówka panelu do `_buildInventoryHeaderHtml`.
- Wydzielono budowę zawartości panelu (eq + sekcje/empty-state) do `_buildInventoryContentHtml`.
- `updateInventoryUI` pełni teraz rolę krótkiej orkiestracji cache-key + renderu.

### G39) Refaktor pipeline panelu ustawień
- Wydzielono flow otwierania/zamykania ustawień do helperów:
   - `_openSettingsPanel`,
   - `_closeSettingsPanel`.
- Dodano wspólny builder sekcji `_buildSettingsSectionHtml` i podpięto go w `_renderSettings`.
- `toggleSettings` i `_renderSettings` mają krótszy, bardziej deklaratywny przebieg bez zmian UX.

### G40) Refaktor budowy payloadu `saveGame`
- Wydzielono helpery serializacji zapisu:
   - `_buildSavePlayerState`,
   - `_buildSaveEnemyState`,
   - `_buildSaveObject`.
- `saveGame` zostało skrócone do walidacji + persist + komunikaty UI.
- Zakres zapisywanych pól i format danych pozostają bez zmian.

### G41) Refaktor przepływu `loadGame`
- Wydzielono helpery:
   - `_readAndValidateSaveData` (odczyt + migracja + walidacja),
   - `_resolveLoadedClassFromSave` (wybór klasy z fallbackiem),
   - `_ensureGameLoopRunning` (bezpieczny start loopa po load).
- `loadGame` został uproszczony do orkiestracji restore kroków i UI.
- Komunikaty błędów, fallbacki klasy i zachowanie pętli gry pozostają bez zmian.

### G42) Refaktor HUD quickslotów i achievement toast
- Dla achievement toast wydzielono helpery:
   - `_buildAchievementToastHtml`,
   - `_queueAchievementToastHide`.
- Dla quickslotów mikstur wydzielono helpery:
   - `_computeQuickslotPotionCounts`,
   - `_buildQuickslotsCacheKey`,
   - `_buildQuickslotsHtml`.
- `_showAchievement` i `_updateQuickslots` zostały skrócone do orkiestracji, bez zmian UX i skrótów klawiszowych.

### G43) Refaktor transakcji sklepu (`buyItem` / `sellItem`)
- Wydzielono helpery:
   - `_buildBoughtItem` (normalizacja kupowanego itemu),
   - `_finalizeBuyItem` (odjęcie złota + log + sfx),
   - `_consumeInventoryForSell` (obsługa stackowalnych/non-stackowalnych przy sprzedaży).
- `buyItem` i `sellItem` są krótszymi orkiestratorami przepływu transakcji.
- Ceny, komunikaty, logi i zasady stacków pozostały bez zmian.

### G44) Odchudzenie `showFloorTransition`
- Wydzielono helpery harmonogramu animacji:
   - `_scheduleFloorTransitionCallback`,
   - `_fadeOutFloorTransition`.
- `showFloorTransition` odpowiada teraz głównie za setup + fade-in + delegację sekwencji.
- Timingi (600ms callback, 800ms przed fade-out, 400ms cleanup) pozostały bez zmian.

### G45) Refaktor renderu pojedynczego przeciwnika
- `_renderEnemy` został podzielony na helpery etapowe:
   - `_renderEnemyShadow`, `_renderEnemyHitFlash`, `_renderEnemyFreezeEffect`,
   - `_renderEnemyBody`, `_renderEnemyNameLabel`, `_renderEnemyHpBar`, `_renderBossAura`.
- Główna metoda renderu przeciwnika jest teraz krótką orkiestracją kroków wizualnych.
- Efekty (burn/freeze flash, etykiety, hp bar, aura bossa) i kolejność rysowania pozostały bez zmian.

### G46) Refaktor `_renderInteractiveTile`
- Wydzielono per-tile handlery renderu:
   - `_renderTrapTile`, `_renderChestTile`, `_renderShrineTile`, `_renderShopTile`, `_renderEventTile`, `_renderWellTile`.
- `_renderInteractiveTile` pełni teraz rolę lekkiego dispatchera po typie tile.
- Animacje, kolory, glowy i warunki widoczności (np. trap dla rogue) pozostały bez zmian.

### G47) Refaktor renderu gracza
- `_renderPlayer` został podzielony na helpery:
   - `_getPlayerClassColor`, `_renderPlayerShadow`, `_renderPlayerClassAura`,
   - `_renderPlayerBodyAndIcon`, `_renderPlayerRageAura`.
- Główna metoda renderu gracza jest teraz krótszą orkiestracją etapów wizualnych.
- Efekty stealth/iFrames, ikona klasy i aura rage pozostały bez zmian.

### G48) Refaktor głównej pętli `render()`
- Wydzielono helpery orkiestracji klatki:
   - `_getRenderFrameState`,
   - `_drawVisibleTiles`,
   - `_renderSceneActorsAndEffects`,
   - `_renderScreenOverlays`,
   - `_updateMinimapIfNeeded`.
- `render()` jest teraz krótkim przepływem etapów renderingu.
- Kolejność rysowania (kafle → aktorzy/fx → lighting/flash/vignette/crosshair → HUD/minimapa/fullmap) pozostała bez zmian.

### G49) Refaktor `_updateHUD`
- Wydzielono helpery:
   - `_buildHudSnapshot`,
   - `_applyHudSnapshot`,
   - `_updateHudDebugOverlay`,
   - `_updateHudBuffBar`.
- `_updateHUD` został skrócony do orkiestracji: build snapshot → apply diff → debug/buffy → quicksloty.
- Zawartość HUD i mechanika cache/diff pozostały bez zmian.

### G50) Refaktor markerów minimapy
- Wydzielono osobne passy markerów:
   - `_drawMinimapEnemyMarkers`,
   - `_drawMinimapItemMarkers`,
   - `_drawMinimapPlayerMarker`.
- `_drawMinimapMarkers` deleguje teraz kroki zamiast trzymać cały blok inline.
- Widoczność markerów i kolory (wróg/boss/item/gracz) pozostały bez zmian.

### G51) Refaktor renderu overlay full mapy
- Wydzielono helpery:
   - `_drawFullMapOverlayBackground`,
   - `_getFullMapLayout`,
   - `_drawFullMapExploredTiles`.
- `_drawFullMap` został skrócony do orkiestracji tło → layout → tiles → markery → legenda.
- Skala, padding i finalny wygląd overlay mapy pozostały bez zmian.

### G52) Refaktor `_drawMinimap`
- Wydzielono helpery:
   - `_getMinimapViewport`,
   - `_drawMinimapExploredTiles`,
   - `_drawMinimapBorder`.
- `_drawMinimap` został skrócony do flow: tło → viewport → tiles → markery → border.
- Zakres minimapy, skala i kolory tile/markerów pozostały bez zmian.

### G53) Refaktor `loop()` i `update(dt)`
- Wydzielono etapy timingu i ticka do helperów:
   - `_updateFrameTiming`,
   - `_updateCoreSystems`,
   - `_updateCameraPosition`,
   - `_updatePlayerRuntimeTimers`.
- `loop()` i `update(dt)` są krótszymi orkiestratorami sekwencji aktualizacji.
- Kolejność update’ów, clamp `dt`, regen MP i timery combat (iFrames/combo/attack) pozostały bez zmian.

### G54) Refaktor `updatePlayer`
- Wydzielono helpery etapu ruchu i efektów:
   - `_getPlayerInputVector`, `_computePlayerMoveTarget`, `_applyPlayerCollisionMovement`,
   - `_updatePlayerAnimationState`, `_applyPlayerTileEffects`,
   - `_updateMouseWorldPosition`, `_autoPickupNearbyGold`, `_updatePlayerFov`.
- `updatePlayer` został skrócony do deklaratywnej orkiestracji kroków.
- Kolejność operacji (input → collision → tile effects → pickup gold → FOV) pozostała bez zmian.

### G55) Refaktor pre-tick statusów w `updateEnemies`
- Wydzielono helpery:
   - `_applyEnemyDotEffects`,
   - `_shouldSkipEnemyAfterStatusTick`.
- Główna pętla `updateEnemies` deleguje teraz wstępny etap statusów (stun/hitFlash/attackTimer/DOT/freeze).
- Semantyka `continue` i kolejność rozliczania statusów pozostały bez zmian.

### G56) Refaktor gałęzi decyzyjnych `updateEnemies`
- Wydzielono helpery:
   - `_updateEnemyAlertState`,
   - `_runUnalertedEnemyAi`,
   - `_tryFleeEnemy`,
   - `_updateEnemyPackAlert`,
   - `_runEnemyCombatBehavior`.
- Pętla AI została uproszczona do czytelnego flow decyzji i delegacji.
- Warunki `continue`, progi dystansu i zachowanie chase/ranged/flee pozostały bez zmian.

### G57) Refaktor cleanupu śmierci wroga
- Wydzielono obsługę śmierci pojedynczego przeciwnika do helpera `_handleEnemyDeath`.
- Pętla usuwania martwych wrogów w `updateEnemies` deleguje teraz efekty XP/gold/loot/boss/explosive.
- Kolejność nagród i efektów po śmierci pozostała bez zmian.

### G58) Refaktor `updateSpellCooldowns`
- Wydzielono helpery:
   - `_tickSpellCooldownTimers`,
   - `_applySpellSlotCooldownUi`.
- `updateSpellCooldowns` jest krótszym przepływem: tick cooldownów + aktualizacja slotów UI.
- Wizualny stan slotów (`on-cd`, overlay, timer) pozostał bez zmian.

### G59) Refaktor `updatePlayerBuffs`
- Wydzielono helpery:
   - `_tickAndExpirePlayerBuffs`,
   - `_applyPlayerTalentPassiveRegen`.
- `updatePlayerBuffs` został uproszczony do orkiestracji wygasania buffów, timerów stealth/rage i pasywnej regeneracji.
- Efekty zdejmowania buffów (`str`/`def`) oraz regen talentów pozostały bez zmian.

### G60) Refaktor markerów full mapy
- Wydzielono passy markerów:
   - `_drawFullMapItemMarkers`,
   - `_drawFullMapEnemyMarkers`,
   - `_drawFullMapPlayerMarker`.
- `_drawFullMapMarkers` deleguje teraz trzy etapy rysowania markerów.
- Kolory, warunki widoczności i blink markera gracza pozostały bez zmian.

### G61) Refaktor `_getItemStatsStr`
- Wydzielono helpery budowy fragmentów opisu:
   - `_appendItemBaseStats`,
   - `_appendItemPotionStats`.
- `_getItemStatsStr` odpowiada teraz głównie za orkiestrację i składanie `parts.join(', ')`.
- Treść statystyk w UI sklepu pozostała bez zmian.

### G62) Refaktor `_buildTooltipBaseStatsHtml`
- Wydzielono helpery sekcyjne:
   - `_buildTooltipCoreStatsHtml`,
   - `_buildTooltipEffectStatsHtml`,
   - `_buildTooltipPotionStatsHtml`.
- `_buildTooltipBaseStatsHtml` został uproszczony do składania sekcji HTML.
- Zawartość tooltipa itemów pozostała bez zmian.

### G63) Mikro-refaktor `_showToast`
- Wydzielono helpery:
   - `_applyToastStyle`,
   - `_scheduleToastHide`.
- `_showToast` deleguje teraz styl i harmonogram wygaszenia.
- Czas wyświetlania/fade-out i wygląd toasta pozostały bez zmian.

### G64) Refaktor loggera wiadomości
- Wydzielono helpery:
   - `_appendLogMessage`,
   - `_trimLogMessages`.
- `log(msg, cls)` został uproszczony do delegacji append + trim.
- Limit wiadomości (50) i zachowanie scrollowania pozostały bez zmian.

### G65) Refaktor `_buildSettingsSaveRowsHtml`
- Wydzielono buildery pojedynczych wierszy:
   - `_buildSettingsFilledSaveRowHtml`,
   - `_buildSettingsEmptySaveRowHtml`.
- Główna metoda budowy sekcji save slotów jest krótsza i bardziej deklaratywna.
- Treść i akcje przycisków (zapis/wczytanie/usunięcie) pozostały bez zmian.

### G66) Refaktor `_buildSettingsKeyRowsHtml`
- Wydzielono builder pojedynczego wiersza klawisza: `_buildSettingsKeyRowHtml`.
- `_buildSettingsKeyRowsHtml` deleguje teraz składanie listy keybindów do helpera per-action.
- Wyświetlane etykiety i przypisane akcje `onclick` pozostały bez zmian.

### G67) Refaktor legendy full mapy
- Wydzielono helpery:
   - `_drawFullMapLegendEntry`,
   - `_drawFullMapLegend`.
- `_drawFullMapHeaderAndLegend` odpowiada teraz za nagłówek + delegację rysowania legendy.
- Pozycje, kolory i etykiety legendy pozostały bez zmian.

### G68) Refaktor `_migrateSaveData`
- Wydzielono helpery migracji i defaultów:
   - `_normalizeSaveVersion`,
   - `_applySaveBaseDefaults`,
   - `_applySaveVersionMigrations`.
- `_migrateSaveData` został uproszczony do krótkiej orkiestracji kroków migracji.
- Kompatybilność wersji zapisu i fallbacki pól pozostały bez zmian.

### G69) Refaktor `_restoreRunStateFromSave`
- Dodano helper normalizacji liczników runa: `_safeRunInt`.
- `totalKills/totalGold/bossKills/maxCombo/mysticEvents/shadowWellsUsed/lastRelicFloor/lastWellFloor` korzystają z jednego źródła normalizacji.
- Zakres wartości i fallbacki liczników pozostały bez zmian.

### G70) Refaktor sekwencji restore w `loadGame`
- Wydzielono helper `_restoreGameFromSaveData` obejmujący sekwencję:
   runtime init → hide screens → restore run/player/shop/dungeon/entities → finalize UI.
- `loadGame` został skrócony do walidacji danych i wywołania jednego kroku restore.
- Kolejność restore i efekt końcowy po wczytaniu pozostały bez zmian.

### G71) Mikro-refaktor końcówki `loadGame`
- Wydzielono helper `_resumeAfterLoad` (`paused=false` + `_ensureGameLoopRunning`).
- `loadGame` ma krótszy, bardziej deklaratywny tail po restore.
- Zachowanie uruchamiania pętli gry po load pozostało bez zmian.

### G72) Hotfix regresji runtime (`_tryEliteTeleportBlink`)
- Naprawiono błąd `TypeError: this._tryEliteTeleportBlink is not a function` w `updateEnemies`.
- Przyczyna: helpery `_tryEliteTeleportBlink` i `_chaseEnemyTowardPlayer` były omyłkowo umieszczone w obiekcie `Achievements` zamiast `Game`.
- Fix: przeniesiono oba helpery do `Game` (sekcja AI), usuwając je z `Achievements`.

### G73) Mikro-refaktor wierszy UI sklepu
- Wydzielono helpery pojedynczych wierszy:
   - `_buildShopBuyRowHtml`,
   - `_buildShopSellRowHtml`.
- `_buildShopBuySectionHtml` i `_buildShopSellSectionHtml` delegują teraz budowę elementów listy do helperów per-item.
- HTML, warunki `canAfford/cant-afford`, ceny i akcje `onclick` pozostały bez zmian.

### G74) Refaktor logiki kupna/sprzedaży w sklepie
- Wydzielono helpery ścieżki kupna:
   - `_validateShopBuyIndex`,
   - `_canAffordShopItem`,
   - `_tryAddBoughtItemToInventory`,
   - `_completeShopPurchase`.
- Wydzielono helpery ścieżki sprzedaży:
   - `_findInventoryItemIndexById`,
   - `_finalizeSellItem`.
- `buyItem` i `sellItem` pełnią teraz rolę krótkich orkiestratorów; kolejność operacji, komunikaty i efekty (`gold`, log, dźwięk, odświeżenie UI) pozostały bez zmian.

### G75) Mikro-refaktor pipeline floor transition
- Wydzielono etapy wygaszania przejścia piętra:
   - `_deactivateFloorTransition`,
   - `_startFloorTransitionFadeOut`.
- Wydzielono etap callbacku + fade out:
   - `_executeFloorTransitionCallback`.
- `_fadeOutFloorTransition` i `_scheduleFloorTransitionCallback` delegują teraz do helperów etapowych; czasy `600/800/400 ms` i efekt UX pozostały bez zmian.

### G76) Mikro-refaktor ekranów końca runa
- Dodano wspólny helper `_showEndScreen(screenId, statsId, statsHtml)`.
- `gameOver` i `victory` delegują wyświetlenie panelu/statystyk do jednego miejsca.
- Treść statystyk, tekst zwycięstwa i dźwięk śmierci pozostały bez zmian.

### G77) Refaktor `_drawVisibleTiles` (render kafli)
- Wydzielono helper dispatchu typu kafla: `_renderTileByType`.
- Wydzielono helper rysowania plamy krwi: `_renderTileBloodStain`.
- `_drawVisibleTiles` deleguje teraz render tile + blood stain do helperów, zachowując tę samą logikę widoczności (`alpha`, `explored/fullMap`) i ten sam wynik wizualny.

### G78) Mikro-refaktor prechecków i dispatchu combat/spells

### G165) Legendarny młot Obelisku
- Dodano legendarną broń `Młot Monolitu` z efektem `obeliskStrike`.
- Trafienie wręcz może teraz wyzwolić falę obrażeń obszarowych wokół celu z własnym cooldownem runtime.
- Dodano telemetry runa, achievementy, save/load migrację v57 oraz linie debug overlay dla proców/killi/cooldownu efektu.

### G166) Legendarny eliksir Obelisku
- Dodano legendarną miksturę `Eliksir Monolitu` z natychmiastowym odzyskiem HP/MP i czasowym buffem ATK/DEF.
- Zabójstwa podczas działania eliksiru są liczone osobno do telemetry runa i achievementów.
- Dodano save/load migrację v58 oraz debug overlay dla użyć, killi i czasu działania efektu.

### G167) Legendarna broń Szczeliny
- Dodano legendarną broń `Tasak Szczeliny` z efektem `riftSlash`.
- Trafienie wręcz może teraz rozciąć energią Szczeliny do 3 pobliskich celów wokół trafionego przeciwnika.
- Dodano telemetry runa, achievementy, save/load migrację v59 oraz debug overlay dla proców, killi i cooldownu efektu.

### G168) Legendarny pancerz Szczeliny
- Dodano legendarny armor `Kirys Szczelinowej Straży` z efektem `riftAegis`.
- Po otrzymaniu obrażeń pancerz emituje łańcuch Szczeliny do kilku pobliskich wrogów i częściowo odnawia manę gracza.
- Dodano telemetry runa, achievementy, save/load migrację v60 oraz debug overlay dla proców, killi i cooldownu efektu.

### G169) Legendarny eliksir Szczeliny
- Dodano legendarną miksturę `Eliksir Szczeliny` z natychmiastowym odzyskiem MP i pulsem arcane wokół gracza.
- Zabójstwa wykonane przez puls eliksiru są liczone osobno do telemetry runa i achievementów.
- Dodano save/load migrację v61 oraz debug overlay dla użyć i killi efektu.

### G170) Ryt wojownika Szczeliny
- Zmieniono 3. slot wojownika na nowy czar `Bastion Szczeliny` (`type: rift_guard`).
- Czar emituje puls arcane wokół wojownika, ogłusza trafionych przeciwników i leczy gracza za każde trafienie.
- Dodano telemetry runa, achievementy, save/load migrację v62 oraz debug overlay dla castów i trafień efektu.

### G171) Ryt łotrzyka Szczeliny
- Zmieniono 1. slot łotrzyka na nowy czar `Ostrza Szczeliny` (`type: rift_blades`).
- Czar razi kilku pobliskich przeciwników kolejnymi cięciami arcane i odświeża krótki cień po trafieniu.
- Dodano telemetry runa, achievementy, save/load migrację v63 oraz debug overlay dla castów i trafień efektu.

### G172) Boss Szczelinowej Novy: kill telemetry + achievement
- Dodano licznik runa `riftNovaBossKills` zliczający pokonanych bossów posiadających ability `rift_nova`.
- W `_handleEnemyDeath` licznik rośnie przy killu bossa z `Szczelinową Novą`, analogicznie do wcześniejszego follow-upu dla `mirror_dash`.
- Dodano achievement `rift_lord_2` (**Władca Rozdarcia**) za pokonanie 2 takich bossów.
- Save/load rozszerzony o migrację v64, restore/meta oraz debug overlay (`Rift Boss Kills`).

### G173) Boss Burzy Obelisku: kill telemetry + achievement
- Dodano licznik runa `obeliskStormBossKills` zliczający pokonanych bossów posiadających ability `obelisk_storm`.
- W `_handleEnemyDeath` licznik rośnie przy killu bossa z `Burzą Obelisku`, domykając follow-up telemetry dla drugiego boss skilla z linii Obelisku.
- Dodano achievement `obelisk_lord_2` (**Pan Monolitów**) za pokonanie 2 takich bossów.
- Save/load rozszerzony o migrację v65, restore/meta oraz debug overlay (`Obelisk Boss Kills`).

### G174) Nowy przeciwnik Rift: Rozpruwacz Szczeliny
- Dodano do `content/enemies.js` nowy endgame enemy **Rozpruwacz Szczeliny** (`🜔`) jako szybkie zagrożenie dystansowe linii Rift.
- W `_handleEnemyDeath` dodano licznik runa `riftReaversSlain`, rosnący przy zabójstwie tego konkretnego typu przeciwnika.
- Dodano achievement `rift_reaver_8` (**Rzeźnik Szczeliny**) za pokonanie 8 Rozpruwaczy Szczeliny.
- Save/load rozszerzony o migrację v66, restore/meta oraz debug overlay (`Rift Reavers`).

### G175) Nowy przeciwnik Obelisku: Strażnik Monolitu
- Dodano do `content/enemies.js` nowy endgame enemy **Strażnik Monolitu** (`🗿`) jako cięższe zagrożenie patrolowe linii Obelisku.
- W `_handleEnemyDeath` dodano licznik runa `obeliskSentinelsSlain`, rosnący przy zabójstwie tego konkretnego typu przeciwnika.
- Dodano achievement `obelisk_sentinel_8` (**Burzyciel Bastionów**) za pokonanie 8 Strażników Monolitu.
- Save/load rozszerzony o migrację v67, restore/meta oraz debug overlay (`Obelisk Sentinels`).

### G176) Nowy przeciwnik Mirażu: Lustrzany Skrytobójca
- Dodano do `content/enemies.js` nowy endgame enemy **Lustrzany Skrytobójca** (`🪞`) jako szybkie zagrożenie pościgowe linii Mirażu.
- W `_handleEnemyDeath` dodano licznik runa `mirrorAssassinsSlain`, rosnący przy zabójstwie tego konkretnego typu przeciwnika.
- Dodano achievement `mirror_assassin_8` (**Łowca Odbić**) za pokonanie 8 Lustrzanych Skrytobójców.
- Save/load rozszerzony o migrację v68, restore/meta oraz debug overlay (`Mirror Assassins`).

### G177) Legendarny efekt Mirażu: Puste Echo
- Rozszerzono istniejący item `Pierścień Pustego Echa` o aktywny efekt `mirrorEcho`.
- Po rzuceniu czaru pierścień wysyła dwa lustrzane przebicia w przeciwnych kierunkach względem celu kursora, trafiając wrogów na linii.
- Dodano telemetry runa `mirrorEchoProcs`, `mirrorEchoKills`, `mirrorEchoCooldown` oraz achievementy `mirror_echo_20` i `mirror_echo_kills_35`.
- Save/load rozszerzony o migrację v69, restore/meta oraz debug overlay (`MirrorEcho Proc`, `MirrorEcho Kills`, `MirrorEcho CD`).

### G178) Legendarna broń Mirażu
- Dodano legendarną broń `Szabla Zwierciadła` z efektem `mirrorBlade`.
- Trafienie wręcz może teraz uruchomić lustrzane cięcie, które ponawia cios na trafionym celu i najbliższym przeciwniku obok niego.
- Dodano telemetry runa `mirrorBladeProcs`, `mirrorBladeKills`, `mirrorBladeCooldown` oraz achievementy `mirror_blade_20` i `mirror_blade_kills_30`.
- Save/load rozszerzony o migrację v70, restore/meta oraz debug overlay (`MirrorBlade Proc`, `MirrorBlade Kills`, `MirrorBlade CD`).

### G179) Legendarny pancerz Mirażu
- Dodano legendarny armor `Płaszcz Zwierciadlanego Pyłu` z efektem `mirrorVeil`.
- Po otrzymaniu obrażeń pancerz uruchamia lustrzaną zasłonę, która razi najbliższych wrogów i wydłuża krótkie iFrames gracza.
- Dodano telemetry runa `mirrorVeilProcs`, `mirrorVeilKills`, `mirrorVeilCooldown` oraz achievementy `mirror_veil_18` i `mirror_veil_kills_25`.
- Save/load rozszerzony o migrację v71, restore/meta oraz debug overlay (`MirrorVeil Proc`, `MirrorVeil Kills`, `MirrorVeil CD`).

### G180) Legendarny eliksir Mirażu
- Dodano legendarną miksturę `Eliksir Mirażu`, która leczy HP/MP oraz daje czasowy bonus do krytyka i uniku.
- Dodano telemetry runa `mirrorPotionUses`, `mirrorPotionKills`, `mirrorPotionTimer` oraz achievementy `mirror_elixir_8` i `mirror_elixir_kills_25`.
- Save/load rozszerzony o migrację v72, restore/meta oraz debug overlay (`MirrorPotion Use`, `MirrorPotion Kills`, `MirrorPotion Up`).

### G181) Telemetryka Egzekutora Mirażu
- Dodano licznik runa `mirrorExecutorsSlain`, rosnący przy zabójstwie przeciwnika `Egzekutor Mirażu`.
- Dodano achievement `mirror_executor_8` za pokonanie 8 Egzekutorów Mirażu.
- Save/load rozszerzony o migrację v73, restore/meta oraz debug overlay (`Mirror Executors`).

### G182) Nowy przeciwnik Mirażu: Kapłanka Zwierciadeł
- Dodano do `content/enemies.js` nowego endgame enemy `Kapłanka Zwierciadeł` (`🔹`) jako wolniejsze, dystansowe zagrożenie linii Mirażu.
- W `_handleEnemyDeath` dodano licznik runa `mirrorPriestessesSlain`, rosnący przy zabójstwie tego konkretnego typu przeciwnika.
- Dodano achievement `mirror_priestess_8` oraz rozszerzono save/load do v74 z restore/meta i debug overlay (`Mirror Priestesses`).

### G183) Nowy przeciwnik Mirażu: Herold Mirażu
- Dodano do `content/enemies.js` nowego endgame enemy `Herold Mirażu` (`✨`) jako cięższe zagrożenie patrolowe linii Mirażu.
- W `_handleEnemyDeath` dodano licznik runa `mirrorHeraldsSlain`, rosnący przy zabójstwie tego konkretnego typu przeciwnika.
- Dodano achievement `mirror_herald_8` oraz rozszerzono save/load do v75 z restore/meta i debug overlay (`Mirror Heralds`).

### G184) Nowy przeciwnik Mirażu: Włócznik Zwierciadła
- Dodano do `content/enemies.js` nowego endgame enemy `Włócznik Zwierciadła` (`🔱`) jako agresywne zagrożenie pościgowe linii Mirażu.
- W `_handleEnemyDeath` dodano licznik runa `mirrorLancersSlain`, rosnący przy zabójstwie tego konkretnego typu przeciwnika.
- Dodano achievement `mirror_lancer_8` oraz rozszerzono save/load do v76 z restore/meta i debug overlay (`Mirror Lancers`).

### G185) Telemetryka Teleportacji
- Dodano telemetrykę udanych castów `teleportsCast` oraz łącznego dystansu `teleportDistance` dla czaru `Teleportacja`.
- Dodano achievementy `teleport_18` i `teleport_distance_120` bez zmiany mechaniki samego skilla.
- Save/load rozszerzony o migrację v77, restore/meta oraz debug overlay (`Teleport Cast`, `Teleport Dist`).

### G186) Telemetryka Kroku Cienia
- Dodano telemetrykę castów `stealthCasts` oraz łącznego czasu ukrycia `stealthSeconds` dla czaru `Krok Cienia`.
- Dodano achievementy `stealth_18` i `stealth_time_60` bez zmiany mechaniki samego skilla.
- Save/load rozszerzony o migrację v78, restore/meta oraz debug overlay (`Stealth Cast`, `Stealth Time`).

### G187) Telemetryka Szału
- Dodano telemetrykę castów `rageCasts` oraz łącznego czasu działania `rageSeconds` dla skilla `Szał`.
- Dodano achievementy `rage_18` i `rage_time_75` bez zmiany mechaniki samego skilla.
- Save/load rozszerzony o migrację v79, restore/meta oraz debug overlay (`Rage Cast`, `Rage Time`).

### G188) Telemetryka Uderzenia Tarczą
- Dodano telemetrykę castów `shieldAoeCasts` oraz trafień `shieldAoeHits` dla skilla `Uderzenie Tarcz.`.
- Dodano achievementy `shield_bash_18` i `shield_bash_hits_90` bez zmiany mechaniki samego skilla.
- Save/load rozszerzony o migrację v80, restore/meta oraz debug overlay (`ShieldAoe Cast`, `ShieldAoe Hits`).

### G189) Telemetryka Kuli Ognia
- Rozszerzono wspólny system projectile o opcjonalny tag źródła, bez zmiany dotychczasowej mechaniki innych pocisków.
- Dodano telemetrykę castów `fireballCasts` oraz trafień `fireballHits` dla skilla `Kula Ognia`.
- Dodano achievementy `fireball_25` i `fireball_hits_120` oraz rozszerzono save/load do v81 z debug overlay (`Fireball Cast`, `Fireball Hits`).

### G190) Telemetryka Burzy Otchłani
- Dodano telemetrykę castów `chainCasts` oraz trafień `chainHits` dla skilla `Burza Otchłani`.
- Dodano achievementy `chain_20` i `chain_hits_90` bez zmiany mechaniki samego skilla.
- Save/load rozszerzony o migrację v82, restore/meta oraz debug overlay (`Chain Cast`, `Chain Hits`).

### G191) Telemetryka Promienia Pustki
- Dodano telemetrykę castów `beamCasts` dla skilla `Promień Pustki`, uzupełniając istniejący licznik trafień `beamImpacts`.
- Dodano achievement `beam_18` bez zmiany mechaniki samego skilla.
- Save/load rozszerzony o migrację v83, restore/meta oraz debug overlay (`Beam Cast`).

### G192) Telemetryka Ciosu w Plecy
- Dodano telemetrykę castów `backstabCasts` oraz zabójstw `backstabKills` dla skilla `Cios w Plecy`.
- Dodano achievementy `backstab_18` i `backstab_kills_30` bez zmiany mechaniki samego skilla.
- Save/load rozszerzony o migrację v84, restore/meta oraz debug overlay (`Backstab Cast`, `Backstab Kills`).

### G193) Telemetryka Tańca Ostrzy
- Dodano telemetrykę castów `shadowstepCasts` dla skilla `Taniec Ostrzy`, uzupełniając istniejący licznik zabójstw `shadowstepFinishes`.
- Dodano achievement `shadowstep_18` bez zmiany mechaniki samego skilla.
- Save/load rozszerzony o migrację v85, restore/meta oraz debug overlay (`Shadowstep Cast`).

### G194) Nowy przeciwnik Mirażu: Tkacz Mirażu
- Dodano nowego przeciwnika `Tkacz Mirażu` jako kolejny ranged elite w końcówce progresji puli przeciwników.
- Dodano kill telemetrykę `mirrorWeaversSlain` oraz achievement `mirror_weaver_8`.
- Save/load rozszerzony o migrację v86, restore/meta oraz debug overlay (`Mirror Weavers`).

### G195) Nowy przeciwnik Szczeliny: Siewca Szczeliny
- Dodano nowego przeciwnika `Siewca Szczeliny` jako kolejny ranged elite w końcówce progresji puli przeciwników.
- Dodano kill telemetrykę `riftSowersSlain` oraz achievement `rift_sower_8`.
- Save/load rozszerzony o migrację v87, restore/meta oraz debug overlay (`Rift Sowers`).

### G196) Nowy przeciwnik Obelisku: Wieszcz Obelisku
- Dodano nowego przeciwnika `Wieszcz Obelisku` jako kolejny ranged elite w końcówce progresji puli przeciwników.
- Dodano kill telemetrykę `obeliskAugursSlain` oraz achievement `obelisk_augur_8`.
- Save/load rozszerzony o migrację v88, restore/meta oraz debug overlay (`Obelisk Augurs`).

### G197) Drugi tier dropów bossów
- Dodano achievement `boss_legend_3` dla 3 legendarnych dropów z bossów na bazie istniejącego licznika `bossLegendaryDrops`.
- Zmiana nie wymagała modyfikacji save/load ani runtime, bo licznik był już zbierany i serializowany.

### G198) Drugi tier flawless runów
- Dodano achievement `flawless_win_2` dla 2 wygranych runów bez użycia mikstur na bazie istniejącego licznika `flawlessVictories`.
- Zmiana nie wymagała modyfikacji save/load ani runtime, bo licznik był już zbierany i serializowany.

### G199) Drugi tier boss tracków specjalnych
- Dodano achievementy `mirror_lord_4`, `rift_lord_4` i `obelisk_lord_4` dla rozszerzonych progów istniejących liczników bossów ze specjalnymi ability.
- Zmiana nie wymagała modyfikacji save/load ani runtime, bo liczniki `mirrorDashBossKills`, `riftNovaBossKills` i `obeliskStormBossKills` były już zbierane i serializowane.

### G200) Drugi tier progresji ekonomii i runa
- Dodano achievementy `well_victory_2`, `shop_buy_25`, `shop_sell_25`, `chest_30`, `shrine_10` i `stairs_12` na bazie istniejących liczników runowych.
- Zmiana nie wymagała modyfikacji save/load ani runtime, bo liczniki były już zbierane, serializowane i widoczne w debug overlay.
- Wydzielono helpery ataku specjalnego:
   - `_canUseSpecialAttack`,
   - `_resolveSpecialAttackHandler`.
- Wydzielono helpery castu czarów:
   - `_canCastSpell`,
   - `_resolveSpellCastHandler`.
- `specialAttack` i `castSpell` zostały skrócone do orkiestracji; kolejność kosztów many/cooldownów, komunikaty feedback i efekty (`sound.spell`) pozostały bez zmian.

### G79) Mikro-refaktor `_updateCoreSystems`
- Wydzielono etap aktualizacji bytów/combatu do `_updateEntityCombatSystems`.
- Wydzielono etap runtime efektów wizualnych do `_updateRuntimeVisualSystems`.
- `_updateCoreSystems` deleguje teraz etapy helperom i zachowuje identyczną kolejność wywołań (w tym `updateSpellCooldowns` na końcu).

### G80) Mikro-refaktor końcówki `updateEnemies`
- Wydzielono czyszczenie martwych przeciwników do `_removeDeadEnemies`.
- Wydzielono etap post-process po pętli do `_finalizeEnemyUpdate`.
- `updateEnemies` deleguje finalizację helperowi; zachowano kolejność operacji (`_handleEnemyDeath` → `Achievements.checkAll` → `_updateBossHpBar`).

### G81) Mikro-refaktor `_updatePlayerRuntimeTimers`
- Wydzielono etap regeneracji many do `_updatePlayerManaRegenTimer`.
- Wydzielono etap timerów bojowych do `_updatePlayerCombatRuntimeTimers` (`iFrames`, `comboTimer`, `attackTimer`).
- `_updatePlayerRuntimeTimers` deleguje teraz oba etapy helperom; wartości ticków i reset combo HUD pozostały bez zmian.

### G82) Mikro-refaktor orkiestracji save/load
- Dodano helpery sukcesu zapisu:
   - `_refreshSettingsIfOpen`,
   - `_finalizeSaveSuccess`.
- Dodano helper końcowego restore po load: `_finalizeLoadFromSaveData`.
- `saveGame` i `loadGame` delegują teraz finalizację helperom; komunikaty toast/log, kolejność restore i obsługa błędów pozostały bez zmian.

### G83) Mikro-refaktor `_renderSceneActorsAndEffects`
- Wydzielono etap rysowania aktorów do `_renderSceneActors`.
- Wydzielono etap post-efektów sceny do `_renderScenePostEffects`.
- `_renderSceneActorsAndEffects` deleguje teraz oba etapy helperom; kolejność rysowania (`items/enemies/player/projectiles` → `fog/ambient/floorFog`) pozostała bez zmian.

### G84) Mikro-refaktor `_renderScreenOverlays`
- Wydzielono etap FX ekranowych do `_renderScreenFxOverlays`.
- Wydzielono etap UI overlay do `_renderScreenUiOverlays`.
- `_renderScreenOverlays` deleguje oba etapy helperom; kolejność efektów (`lighting/flash/vignette` → `crosshair/HUD`) pozostała bez zmian.

### G85) Mikro-refaktor dispatchu keybindów
- Wydzielono źródło kolejności akcji do `_getBoundActionOrder`.
- Wydzielono etap dopasowania i wywołania akcji do `_dispatchMatchingBoundActions`.
- `_processBoundKeyActions` deleguje teraz oba kroki helperom; mapowanie bindów i brak `break` po trafieniu (obecne zachowanie) pozostały bez zmian.

### G86) Mikro-refaktor odświeżania minimapy
- Wydzielono warunek odświeżenia do `_shouldRefreshMinimap`.
- Wydzielono finalizację odświeżenia do `_finalizeMinimapRefresh`.
- `_updateMinimapIfNeeded` deleguje teraz check + finalize helperom; warunki i reset flag (`_minimapElapsed`, `_minimapDirty`) pozostały bez zmian.

### G87) Mikro-refaktor `_updateFrameTiming`
- Wydzielono etap wygładzania FPS do `_updateSmoothedFps`.
- Wydzielono etap inkrementacji timerów globalnych do `_advanceGlobalTimers`.
- `_updateFrameTiming` deleguje oba kroki helperom; obliczenia `dt/fps` oraz kolejność aktualizacji czasu pozostały bez zmian.

### G88) Mikro-refaktor `_updateCameraPosition`
- Wydzielono wyznaczenie celu kamery do `_getCameraTargetPosition`.
- Wydzielono aplikację wygładzania do `_applyCameraSmoothing`.
- `_updateCameraPosition` deleguje teraz oba etapy helperom; współczynnik wygładzania (`5*dt`) i wynik ruchu kamery pozostały bez zmian.

### G89) Mikro-refaktor głównego `render()`
- Wydzielono czyszczenie tła do `_clearRenderBackground`.
- Wydzielono warunkowe rysowanie full mapy do `_renderFullMapOverlayIfNeeded`.
- `render()` deleguje oba etapy helperom; kolejność pipeline’u renderu pozostała bez zmian.

### G90) Mikro-refaktor budowy payloadu zapisu
- Wydzielono metadane runa do `_buildSaveRunMeta`.
- Wydzielono snapshot lochu do `_buildSaveDungeonSnapshot`.
- `_buildSaveObject` składa teraz payload przez helpery etapowe (`...runMeta`, `...dungeonSnapshot`); schema i pola zapisu pozostały bez zmian.

### G91) Mikro-refaktor `_getPlayerInputVector`
- Wydzielono odczyt osi pionowej do `_getVerticalInputAxis`.
- Wydzielono odczyt osi poziomej do `_getHorizontalInputAxis`.
- Wydzielono normalizację ruchu diagonalnego do `_normalizeDiagonalInputVector`.
- `_getPlayerInputVector` deleguje teraz etapy helperom; mapowanie klawiszy i współczynnik diagonalny `0.707` pozostały bez zmian.

### G92) Mikro-refaktor finalizacji UI po load
- Wydzielono etap odświeżenia runtime UI do `_refreshRuntimeUiAfterLoad`.
- Wydzielono etap komunikatów sukcesu load do `_notifyLoadSuccess`.
- `_finalizeLoadUI` deleguje teraz oba etapy helperom; kolejność odświeżenia HUD/FOV/loga oraz komunikaty (`log` + `toast`) pozostały bez zmian.

### G93) Mikro-refaktor finalizacji sukcesu zapisu
- Wydzielono etap notyfikacji zapisu do `_notifySaveSuccess`.
- `_finalizeSaveSuccess` deleguje teraz notyfikację + odświeżenie settings panelu.
- Treść komunikatów (`toast`, `log`) i kolejność działań po zapisie pozostały bez zmian.

### G94) Mikro-refaktor walidacji danych load
- Wydzielono etapy `_readAndValidateSaveData` do helperów:
   - `_parseSaveRawData`,
   - `_assertSaveVersionSupported`,
   - `_assertSaveDataShapeValid`.
- Główna metoda deleguje teraz parse + walidację wersji/kształtu przed sprawdzeniem mapy.
- Treść wyjątków i flow błędów load pozostały bez zmian.

### G95) Mikro-refaktor startu pętli gry
- Wydzielono etap uruchomienia pętli do `_startGameLoopFromNow`.
- `_ensureGameLoopRunning` deleguje teraz start do helpera po sprawdzeniu guardu `running`.
- Zachowanie startu loopa (`running=true`, `lastTime=performance.now()`, `requestAnimationFrame`) pozostało bez zmian.

### G96) Mikro-refaktor guardów `loadGame`
- Wydzielono guard poprawności slotu do `_guardValidLoadSlot`.
- Wydzielono guard pustego zapisu do `_guardNonEmptyLoadData`.
- `loadGame` deleguje teraz oba warunki helperom; toasty i wcześniejsze `return` pozostały bez zmian.

### G97) Mikro-refaktor quick save/load
- Wydzielono stały slot quick akcji do `_getQuickSlotNumber`.
- Wydzielono wspólny dispatcher quick akcji do `_runQuickSlotAction`.
- `quickSave` i `quickLoad` delegują teraz wywołanie helperowi; quick slot `1` i zachowanie zapisu/wczytania pozostały bez zmian.

### G98) Mikro-refaktor `deleteSave`
- Wydzielono usuwanie slotu do `_removeSaveSlot`.
- Wydzielono etap odświeżenia UI i komunikatu do `_notifySaveDeleted`.
- `deleteSave` deleguje teraz oba kroki helperom; usunięcie wpisu localStorage i toast po usunięciu pozostały bez zmian.

### G99) Mikro-refaktor achievement toast
- Wydzielono etap renderu i pokazania toasta do `_renderAchievementToastContent`.
- `_showAchievement` deleguje teraz przygotowanie widoku do helpera oraz harmonogram ukrycia do `_queueAchievementToastHide`.
- Treść HTML i timing wygaszenia achievement toast pozostały bez zmian.

### G100) Mikro-refaktor cache guardu quickslots
- Wydzielono warunek pomijania renderu quickslots do `_shouldSkipQuickslotsRender`.
- `_updateQuickslots` deleguje teraz check cache-hit helperowi przed aktualizacją DOM.
- Logika dirty-count, cache key i wynik renderu quickslots pozostały bez zmian.

### G101) Smoke pass techniczny (po G100)
- Wykonano statyczny audyt `this._*` calls vs definicje helperów:
   - brak brakujących metod runtime (1 fałszywy alarm: `_settingsListening` jako callback-state, nie metoda).
   - brak duplikatów nazw helperów.
- Potwierdzono kluczowe ścieżki po refaktorach:
   - elite AI: `_tryEliteTeleportBlink` / `_chaseEnemyTowardPlayer` (def + call),
   - save/load: `_readAndValidateSaveData`, `_finalizeLoadFromSaveData`, `_finalizeSaveSuccess`,
   - render pipeline: `_renderSceneActorsAndEffects`, `_renderScreenOverlays`, `_updateMinimapIfNeeded`.
- Walidacja edytorowa: brak błędów w `index.html`.

### G102) Hotfix tooltipa ekwipunku (stuck)
- Naprawiono przypadek, w którym tooltip przedmiotu mógł pozostać widoczny po zmianie/ukryciu panelu EQ.
- Fix: wymuszone `hideItemTooltip()` przy zamknięciu `toggleInventory` oraz przed re-renderem / przy nieotwartym panelu w `updateInventoryUI`.
- Efekt: tooltip nie zostaje „przyklejony” po hoverze i zmianach DOM inventory.

### G103) Start implementacji warstwy data-driven (`ContentRegistry`)
- Dodano `ContentRegistry` jako warstwę pośrednią nad `ItemDB` / `SpellDB` / `EnemyDB`.
- Dodano inicjalizację i walidację contentu (`_validateSpellClasses`, `_validateEnemyCollections`, `_validateItemGenerators`) z ostrzeżeniami w konsoli.
- Podpięto runtime pod registry w kluczowych ścieżkach:
   - spells: `initPlayer`, `_restorePlayerFromSave`, `_resolveLoadedClassFromSave`,
   - enemies/boss/loot: `generateFloor`, `_updateBossAI`, loot drops i rewardy eventów.
- Zachowano kompatybilność zachowania dzięki fallbackom na istniejące DB.

### G104) Wydzielenie contentu do plików `content/*`
- Przeniesiono definicje danych do osobnych plików:
   - `content/items.js` (`ItemDB`),
   - `content/spells.js` (`SpellDB`),
   - `content/enemies.js` (`EnemyDB`).
- `index.html` ładuje teraz te pliki przed głównym skryptem runtime.
- Usunięto z `index.html` duplikaty definicji `ItemDB`/`SpellDB`/`EnemyDB`, pozostawiając bez zmian `ShopDB` i pozostałą logikę gry.
- Walidacja edytorowa: brak błędów w `index.html` i nowych plikach contentu.

### G105) Polityka save: strict schema match (bez kompatybilności wstecz)
- Podniesiono `SAVE_SCHEMA_VERSION` do `7`.
- Zmieniono guard wersji w `_assertSaveVersionSupported` na ścisłe dopasowanie (`parsedVersion===SAVE_SCHEMA_VERSION`).
- Wczytanie zapisu z inną wersją kończy się czytelnym błędem: `Niezgodna wersja zapisu (...)`.
- To realizuje założenie sprintowe: szybszy rozwój contentu kosztem migracji starych save’ów.

### G106) Mini-pakiet nowego contentu (enemy + event + achievement)
- Dodano nowego przeciwnika ranged w `content/enemies.js`: **Widmowy Łowca** (`👻`).
- Rozszerzono Relikt o 4. wariant efektu: **Echo Reliktu**
   - `+3%` krytyka,
   - `+15 MP`,
   - dedykowany log i efekty cząsteczek.
- Dodano nowy licznik runa `echoVisions` (runtime + save/load + debug overlay).
- Dodano achievement `echo_2` (**Szept Pustki**) za 2 Echa Reliktu (`+5% Krytyk +10 Max MP`).
- Walidacja edytorowa: brak błędów w `index.html` i `content/enemies.js`.

### G107) Nowy czar maga: Promień Pustki (`beam`)
- Podmieniono slot 5 maga w `content/spells.js` na nowy czar: **Promień Pustki** (`type: beam`).
- Dodano obsługę typu `beam` w dispatcherze castów (`_resolveSpellCastHandler`).
- Dodano nowy handler `_castSpellBeam`:
   - obrażenia liniowe po trajektorii kursora,
   - trafia wielu wrogów w szerokości promienia,
   - dedykowane VFX/SFX feedback i czytelny komunikat przy 0 trafień.
- Walidacja edytorowa: brak błędów w `index.html` i `content/spells.js`.

### G108) Nowy czar łotrzyka: Taniec Ostrzy (`shadowstep`)
- Podmieniono slot 5 łotrzyka w `content/spells.js` na **Taniec Ostrzy** (`type: shadowstep`).
- Dodano obsługę `shadowstep` w dispatcherze castów oraz nowy handler `_castSpellShadowstep`.
- Mechanika czaru:
   - skok na wolne pole przy najbliższym celu,
   - seria 3 cięć z malejącymi obrażeniami,
   - częściowy lifesteal z łącznych obrażeń.
- Dodano licznik runa `shadowDances` (runtime + save/load + debug overlay).
- Dodano achievement `shadowdance_3` (**Wir Cieni**) za 3 użycia Tańca Ostrzy (`+2 ATK +5% Uniku`).
- Podniesiono `SAVE_SCHEMA_VERSION` do `8` (strict schema match pozostaje aktywny).
- Walidacja edytorowa: brak błędów w `index.html` i `content/spells.js`.

### G109) Rozszerzenie eventu mapowego: Studnia Cieni (Echo)
- Rozbudowano `Studnię Cieni` o 3. wariant nagrody: **Echo Studni**.
- Nowy wariant daje:
   - krótki stealth,
   - stały bonus do uniku,
   - skrócenie cooldownu `shadowstep` (jeśli gracz ma ten czar).
- Dodano licznik runa `wellEchoes` (runtime + save/load + debug overlay).
- Dodano achievement `well_echo_2` (**Echo Studni**) za 2 aktywacje nowego wariantu (`+3% Krytyk +5 Max HP`).
- Podniesiono `SAVE_SCHEMA_VERSION` do `9` (strict schema match pozostaje aktywny).
- Walidacja edytorowa: brak błędów w `index.html`.

### G110) Nowy elite affix: Mirażowy (anti-burst)
- Dodano nowy affix elit do puli `EliteAffixes`: **Mirażowy** (`🌫️`).
- Affix nadaje elite’owi:
   - szansę uniku (`evasion`),
   - lekki bonus mobilności.
- Dodano centralny guard uniku po stronie celu (`_tryEnemyEvasion`) i podpięto go w `damageEnemy`.
- Efekt działa dla wszystkich źródeł obrażeń (melee, projectile, spelle), bez duplikacji logiki.
- Walidacja edytorowa: brak błędów w `index.html`.

### G111) Endgame enemy pack + korekta progresji spawnów
- Dodano nowy typ przeciwnika w `content/enemies.js`: **Egzekutor Mirażu** (`🫥`) jako zagrożenie endgame.
- Rozszerzono progresję `EnemyDB.getForFloor`, aby skala od floor 1→10 obejmowała pełną pulę typów.
- Efekt uboczny fixu: najwyższe tiery enemy nie są już przypadkowo pomijane przez samą długość tablicy.
- Integracja odbywa się data-driven przez istniejący `ContentRegistry.getEnemyTypesForFloor` (bez zmian UI/game loop).
- Walidacja edytorowa: brak błędów w `content/enemies.js`.

### G112) Nowa umiejętność bossów: `mirror_dash`
- Dodano nowy skill bossa w `index.html`: **lustrzany doskok** (`_bossAbilityMirrorDash`).
- Mechanika:
   - szybkie przemieszczenie w okolice gracza,
   - fallback do teleportu przy braku wolnego pola,
   - natychmiastowy hit w zwarciu + dedykowane VFX.
- Skill został podpięty do dispatchera ability (`_triggerBossAbility`) jako `mirror_dash`.
- Data-driven podpięcie w `content/enemies.js`:
   - `Lich` i `Smok Cieni` otrzymały `mirror_dash` w swoich listach `abilities`.
- Walidacja edytorowa: brak błędów w `index.html` i `content/enemies.js`.

### G113) Legendary ring pod build shadow/crit
- Dodano nowy legendarny ring do `content/items.js`: **Pierścień Pustego Echa**.
- Ring daje bonusy: `critBonus`, `dodgeBonus`, `mpBonus`.
- Rozszerzono logikę equippowania ringów (`_applyRingBonuses`) o obsługę `critBonus` i `dodgeBonus`.
- Rozszerzono opisy/statystyki UI:
   - inventory row (`_getInventoryItemDesc`),
   - tooltip (`_buildTooltipCoreStatsHtml`),
   - sklep (`_appendItemBaseStats`),
   - sortowanie wartości itemów (`_groupAndSortInventoryItems`).
- Drobny pass dropów endgame: `generateLoot` ma wyższy bias na rzadkość od floor 7+ (najmocniej 9–10).
- Walidacja edytorowa: brak błędów w `index.html` i `content/items.js`.

### G114) Achievement za equip legendy
- Dodano nowy achievement: **Korona Cienia** (`ring_legendary`) za założenie legendarnego pierścienia.
- Warunek sprawdza aktywnie slot `equipment.ring` gracza (`rarity==='legendary'`).
- Reward: `+5 Max MP` oraz `+2% Krytyk`.
- Podpięto natychmiastowy `Achievements.checkAll(this)` po akcji `_equipRingItem`, więc unlock dzieje się od razu po założeniu.
- Walidacja edytorowa: brak błędów w `index.html`.

### G115) Achievement za polowanie na elitę Mirażową
- Dodano licznik runa `mirageElitesSlain` (zlicza zabite elity z affixem `Mirażowy`).
- Dodano achievement **Łamacz Miraży** (`mirage_3`) za 3 takie zabójstwa.
- Reward: `+2 DEF +3% Uniku`.
- Licznik został podpięty end-to-end:
   - runtime (`_handleEnemyDeath`),
   - save/load (`_buildSaveRunMeta`, `_restoreRunStateFromSave`, defaults/migrations),
   - debug overlay (`Miraże: ...`).
- Podniesiono `SAVE_SCHEMA_VERSION` do `10` (strict schema match pozostaje aktywny).
- Walidacja edytorowa: brak błędów w `index.html`.

   ### G116) Achievement za przetrwanie `mirror_dash`
   - Dodano licznik runa `mirrorDashSurvived` (zlicza użycia `mirror_dash`, które gracz przeżył).
   - Dodano achievement **Nietykalny Refleks** (`mirror_dash_3`) za 3 przetrwane lustrzane doskoki bossa.
   - Reward: `+8 Max HP +2 DEF`.
   - Licznik został podpięty end-to-end:
      - runtime (`_bossAbilityMirrorDash`),
      - save/load (`_buildSaveRunMeta`, `_restoreRunStateFromSave`, defaults/migrations),
      - debug overlay (`MirrorDash: ...`).
   - Podniesiono `SAVE_SCHEMA_VERSION` do `11` (strict schema match pozostaje aktywny).
   - Walidacja edytorowa: brak błędów w `index.html`.

      ### G117) Relikt: nowy wariant `Przebudzenie Cienia`
      - Rozszerzono `Tajemniczy Relikt` do 5 wariantów efektu.
      - Dodano nowy wariant: **Przebudzenie Cienia**:
         - bonus do uniku,
         - krótki stealth,
         - dedykowany VFX i log.
      - Dodano licznik runa `shadowAwakenings` oraz achievement **Przebudzenie Cienia** (`shadow_awake_2`) za 2 aktywacje.
      - Reward achievementu: `+5% Uniku +5 Max MP`.
      - Licznik został podpięty end-to-end:
         - runtime (`_triggerMysticRelic`),
         - save/load (`_buildSaveRunMeta`, `_restoreRunStateFromSave`, defaults/migrations),
         - debug overlay (`Przebudzenia: ...`).
      - Podniesiono `SAVE_SCHEMA_VERSION` do `12` (strict schema match pozostaje aktywny).
      - Walidacja edytorowa: brak błędów w `index.html`.

### G118) Studnia Cieni: wariant sustain + tańsza kolejna studnia
- Rozszerzono `Studnię Cieni` do 4 wariantów efektu.
- Dodano nowy wariant sustain (`Łaska Studni`):
   - czasowa regeneracja HP/MP,
   - zniżka kosztu HP przy kolejnej aktywacji studni.
- Dodano runtime telemetry:
   - `wellSustainBlessings`,
   - `wellMercyCharges`,
   - `wellSustainTimer`.
- Dodano achievement **Łaska Studni** (`well_sustain_2`) za 2 aktywacje wariantu sustain.
- Reward achievementu: `+10 Max HP +5 Max MP`.
- Licznik i stany zostały podpięte end-to-end:
   - runtime (`_useShadowWell`, `updatePlayerBuffs`),
   - save/load (`_buildSaveRunMeta`, `_restoreRunStateFromSave`, defaults/migrations),
   - debug overlay (`Sustain`, `Tania Studnia`).
- Podniesiono `SAVE_SCHEMA_VERSION` do `13` (strict schema match pozostaje aktywny).
- Walidacja edytorowa: brak błędów w `index.html`.

### G119) Achievement za zwycięstwo z aktywną Łaską Studni
- Dodano licznik runa `wellSustainVictories`.
- Dodano achievement **Błogosławiony Finał** (`well_victory_1`) za ukończenie runa z aktywnym buffem sustain ze Studni.
- Reward: `+3 DEF +5% Krytyk`.
- Podpięto warunek i increment w ścieżce `victory()` (unlock przy faktycznym zwycięstwie).
- Licznik został podpięty end-to-end:
   - save/load (`_buildSaveRunMeta`, `_restoreRunStateFromSave`, defaults/migrations),
   - debug overlay (`Sustain Win`).
- Podniesiono `SAVE_SCHEMA_VERSION` do `14` (strict schema match pozostaje aktywny).
- Walidacja edytorowa: brak błędów w `index.html`.

   ### G120) Promień Pustki: telemetry + achievement trafień
   - Dodano licznik runa `beamImpacts` (sumaryczna liczba trafień czarem `Promień Pustki`).
   - W `_castSpellBeam` po udanym rzuceniu inkrementowany jest licznik o realną liczbę trafionych celów (`hits`).
   - Dodano achievement **Próżniowy Rezonans** (`beam_hits_25`) za 25 trafień Promieniem Pustki.
   - Reward achievementu: `+4 ATK +5 Max MP`.
   - Licznik podpięty end-to-end:
      - runtime (`_castSpellBeam`),
      - save/load (`_buildSaveRunMeta`, `_restoreRunStateFromSave`, defaults/migrations),
      - debug overlay (`Beam Hits`).
   - Podniesiono `SAVE_SCHEMA_VERSION` do `15` (strict schema match pozostaje aktywny).
   - Walidacja edytorowa: brak błędów w `index.html`.

### G121) Taniec Ostrzy: kill telemetry + achievement
- Dodano licznik runa `shadowstepFinishes` (liczba dobić wykonanych `Tańcem Ostrzy`).
- W `_castSpellShadowstep` po sekwencji ciosów licznik rośnie o 1, jeśli cel żył przed atakiem i zginął po ataku.
- Dodano achievement **Krwawy Taniec** (`shadowstep_finish_10`) za 10 dobić `Tańcem Ostrzy`.
- Reward achievementu: `+3 ATK +2 DEF`.
- Licznik podpięty end-to-end:
   - runtime (`_castSpellShadowstep`),
   - save/load (`_buildSaveRunMeta`, `_restoreRunStateFromSave`, defaults/migrations),
   - debug overlay (`Shadowstep Kills`).
- Podniesiono `SAVE_SCHEMA_VERSION` do `16` (strict schema match pozostaje aktywny).
- Walidacja edytorowa: brak błędów w `index.html`.

   ### G122) Boss mirror-dash: kill telemetry + achievement
   - Dodano licznik runa `mirrorDashBossKills` (liczba pokonanych bossów posiadających ability `mirror_dash`).
   - W `_handleEnemyDeath` licznik rośnie przy killu bossa, jeśli jego `abilities` zawiera `mirror_dash`.
   - Dodano achievement **Pan Luster** (`mirror_lord_2`) za pokonanie 2 takich bossów.
   - Reward achievementu: `+2 DEF +4% Uniku`.
   - Licznik podpięty end-to-end:
      - runtime (`_handleEnemyDeath`),
      - save/load (`_buildSaveRunMeta`, `_restoreRunStateFromSave`, defaults/migrations),
      - debug overlay (`Mirror Boss Kills`).
   - Podniesiono `SAVE_SCHEMA_VERSION` do `17` (strict schema match pozostaje aktywny).
   - Walidacja edytorowa: brak błędów w `index.html`.

### G123) Boss legendary drop: telemetry + achievement
- Dodano licznik runa `bossLegendaryDrops` (liczba legendarnych itemów upuszczonych przez bossów).
- W `_handleEnemyDeath` licznik rośnie przy dropie, gdy zginął boss i wygenerowany loot ma `rarity==='legendary'`.
- Dodano achievement **Dziedzic Korony** (`boss_legend_1`) za zdobycie 1 legendarnego dropu z bossa.
- Reward achievementu: `+6 Max HP +3 Max MP`.
- Licznik podpięty end-to-end:
   - runtime (`_handleEnemyDeath`),
   - save/load (`_buildSaveRunMeta`, `_restoreRunStateFromSave`, defaults/migrations),
   - debug overlay (`Boss Leg Drop`).
- Podniesiono `SAVE_SCHEMA_VERSION` do `18` (strict schema match pozostaje aktywny).
- Walidacja edytorowa: brak błędów w `index.html`.

   ### G124) Zwycięstwo bez mikstur: telemetry + achievement
   - Dodano liczniki runa `potionsUsed` oraz `flawlessVictories`.
   - `potionsUsed` rośnie przy realnym użyciu mikstury w `_usePotionItem`.
   - W `victory()` dodano warunek flawless: jeśli `potionsUsed===0`, inkrementowany jest `flawlessVictories`.
   - Dodano achievement **Nieskazitelny Triumf** (`flawless_win_1`) za ukończenie runa bez użycia mikstur.
   - Reward achievementu: `+2 DEF +4% Krytyk`.
   - Liczniki podpięte end-to-end:
      - runtime (`_usePotionItem`, `victory`),
      - save/load (`_buildSaveRunMeta`, `_restoreRunStateFromSave`, defaults/migrations),
      - debug overlay (`Potions Used`, `Flawless Win`).
   - Podniesiono `SAVE_SCHEMA_VERSION` do `19` (strict schema match pozostaje aktywny).
   - Walidacja edytorowa: brak błędów w `index.html`.

### G125) Sklep: telemetry zakupów + achievement
- Dodano licznik runa `shopPurchases`.
- W `buyItem()` licznik rośnie przy każdej udanej transakcji kupna.
- Dodano achievement **Klient Kupca** (`shop_buy_10`) za 10 zakupionych przedmiotów.
- Reward achievementu: `+20 Max HP`.
- Licznik podpięty end-to-end:
   - runtime (`buyItem`),
   - save/load (`_buildSaveRunMeta`, `_restoreRunStateFromSave`, defaults/migrations),
   - debug overlay (`Shop Buys`).
- Podniesiono `SAVE_SCHEMA_VERSION` do `20` (strict schema match pozostaje aktywny).
- Walidacja edytorowa: brak błędów w `index.html`.

   ### G126) Sklep: telemetry sprzedaży + achievement
   - Dodano licznik runa `shopSales`.
   - W `sellItem()` licznik rośnie przy każdej udanej transakcji sprzedaży.
   - Dodano achievement **Handlarz Cieni** (`shop_sell_10`) za sprzedaż 10 przedmiotów.
   - Reward achievementu: `+10 Max MP +2 DEF`.
   - Licznik podpięty end-to-end:
      - runtime (`sellItem`),
      - save/load (`_buildSaveRunMeta`, `_restoreRunStateFromSave`, defaults/migrations),
      - debug overlay (`Shop Sales`).
   - Podniesiono `SAVE_SCHEMA_VERSION` do `21` (strict schema match pozostaje aktywny).
   - Walidacja edytorowa: brak błędów w `index.html`.

      ### G127) Skrzynie: telemetry otwarć + achievement
      - Dodano licznik runa `chestsOpened`.
      - W `_handleChestInteraction()` licznik rośnie przy każdym otwarciu skrzyni.
      - Dodano achievement **Łowca Skarbów** (`chest_15`) za otwarcie 15 skrzyń.
      - Reward achievementu: `+1 ATK +1 DEF +5 Max HP`.
      - Licznik podpięty end-to-end:
         - runtime (`_handleChestInteraction`),
         - save/load (`_buildSaveRunMeta`, `_restoreRunStateFromSave`, defaults/migrations),
         - debug overlay (`Chests`).
      - Podniesiono `SAVE_SCHEMA_VERSION` do `22` (strict schema match pozostaje aktywny).
      - Walidacja edytorowa: brak błędów w `index.html`.

   ### G128) Kapliczka: telemetry użyć + achievement
   - Dodano licznik runa `shrineUses`.
   - W `_handleShrineInteraction()` licznik rośnie przy każdym użyciu kapliczki.
   - Dodano achievement **Pielgrzym Mocy** (`shrine_5`) za 5 użyć kapliczki.
   - Reward achievementu: `+6 Max MP +3% Krytyk`.
   - Licznik podpięty end-to-end:
      - runtime (`_handleShrineInteraction`),
      - save/load (`_buildSaveRunMeta`, `_restoreRunStateFromSave`, defaults/migrations),
      - debug overlay (`Shrines`).
   - Podniesiono `SAVE_SCHEMA_VERSION` do `23` (strict schema match pozostaje aktywny).
   - Walidacja edytorowa: brak błędów w `index.html`.

### G129) Schody w dół: telemetry zejść + achievement
- Dodano licznik runa `stairsDescended`.
- W `_handleStairsDownInteraction()` licznik rośnie przy każdym zejściu na kolejne piętro.
- Dodano achievement **W Głąb Otchłani** (`stairs_5`) za 5 zejść schodami w dół.
- Reward achievementu: `+2 DEF +8 Max HP`.
- Licznik podpięty end-to-end:
   - runtime (`_handleStairsDownInteraction`),
   - save/load (`_buildSaveRunMeta`, `_restoreRunStateFromSave`, defaults/migrations),
   - debug overlay (`Stairs Down`).
- Podniesiono `SAVE_SCHEMA_VERSION` do `24` (strict schema match pozostaje aktywny).
- Walidacja edytorowa: brak błędów w `index.html`.

   ### G130) Level-upy: telemetry progresji + achievement
   - Dodano licznik runa `levelUpsGained`.
   - W `grantXP()` licznik rośnie przy każdym realnym awansie poziomu.
   - Dodano achievement **Weteran Rozwoju** (`levelups_8`) za 8 level-upów w runie.
   - Reward achievementu: `+1 ATK +5 Max MP`.
   - Licznik podpięty end-to-end:
      - runtime (`grantXP`),
      - save/load (`_buildSaveRunMeta`, `_restoreRunStateFromSave`, defaults/migrations),
      - debug overlay (`LevelUps`).
   - Podniesiono `SAVE_SCHEMA_VERSION` do `25` (strict schema match pozostaje aktywny).
   - Walidacja edytorowa: brak błędów w `index.html`.

### G131) Zaklęcia: telemetry rzutów + achievement
- Dodano licznik runa `spellsCast`.
- W `castSpell()` licznik rośnie przy każdym poprawnym rzuceniu zaklęcia.
- Dodano achievement **Arkanista** (`spells_50`) za rzucenie 50 zaklęć.
- Reward achievementu: `+2 ATK +5 Max MP`.
- Licznik podpięty end-to-end:
   - runtime (`castSpell`),
   - save/load (`_buildSaveRunMeta`, `_restoreRunStateFromSave`, defaults/migrations),
   - debug overlay (`Spells`).
- Podniesiono `SAVE_SCHEMA_VERSION` do `26` (strict schema match pozostaje aktywny).
- Walidacja edytorowa: brak błędów w `index.html`.

   ### G132) Walka wręcz: telemetry trafień + achievement
   - Dodano licznik runa `meleeHits`.
   - W `_performMeleeAttack()` licznik rośnie przy każdym realnym trafieniu atakiem wręcz.
   - Dodano achievement **Mistrz Ostrza** (`melee_40`) za 40 trafień wręcz.
   - Reward achievementu: `+2 ATK +2 DEF`.
   - Licznik podpięty end-to-end:
      - runtime (`_performMeleeAttack`),
      - save/load (`_buildSaveRunMeta`, `_restoreRunStateFromSave`, defaults/migrations),
      - debug overlay (`Melee Hits`).
   - Podniesiono `SAVE_SCHEMA_VERSION` do `27` (strict schema match pozostaje aktywny).
   - Walidacja edytorowa: brak błędów w `index.html`.

      ### G133) Atak specjalny: telemetry użyć + achievement
      - Dodano licznik runa `specialAttacksUsed`.
      - W `specialAttack()` licznik rośnie przy każdym poprawnym użyciu ataku specjalnego.
      - Dodano achievement **Mistrz Technik** (`special_20`) za 20 użyć ataku specjalnego.
      - Reward achievementu: `+2 ATK +5 Max HP`.
      - Licznik podpięty end-to-end:
         - runtime (`specialAttack`),
         - save/load (`_buildSaveRunMeta`, `_restoreRunStateFromSave`, defaults/migrations),
         - debug overlay (`Specials`).
      - Podniesiono `SAVE_SCHEMA_VERSION` do `28` (strict schema match pozostaje aktywny).
      - Walidacja edytorowa: brak błędów w `index.html`.

   ### G134) Uniki gracza: telemetry + achievement
   - Dodano licznik runa `dodgesPerformed`.
   - W `_tryPlayerDodge()` licznik rośnie przy każdym skutecznym uniku.
   - Dodano achievement **Nietykalny Cień** (`dodge_20`) za 20 uników.
   - Reward achievementu: `+2 DEF +3% Krytyk`.
   - Licznik podpięty end-to-end:
      - runtime (`_tryPlayerDodge`),
      - save/load (`_buildSaveRunMeta`, `_restoreRunStateFromSave`, defaults/migrations),
      - debug overlay (`Dodges`).
   - Podniesiono `SAVE_SCHEMA_VERSION` do `29` (strict schema match pozostaje aktywny).
   - Walidacja edytorowa: brak błędów w `index.html`.

      ### G135) Krytyki wręcz: telemetry + achievement
      - Dodano licznik runa `meleeCrits`.
      - W `_performMeleeAttack()` licznik rośnie przy każdym trafieniu krytycznym wręcz.
      - Dodano achievement **Precyzyjne Ostrze** (`crit_melee_20`) za 20 krytyków wręcz.
      - Reward achievementu: `+3 ATK +5% Krytyk`.
      - Licznik podpięty end-to-end:
         - runtime (`_performMeleeAttack`),
         - save/load (`_buildSaveRunMeta`, `_restoreRunStateFromSave`, defaults/migrations),
         - debug overlay (`Melee Crits`).
      - Podniesiono `SAVE_SCHEMA_VERSION` do `30` (strict schema match pozostaje aktywny).
      - Walidacja edytorowa: brak błędów w `index.html`.

   ### G136) Trafienia dystansowe: telemetry + achievement
   - Dodano licznik runa `rangedHits`.
   - W `_resolvePlayerProjectileHits(proj)` licznik rośnie przy każdym trafieniu pociskiem gracza.
   - Dodano achievement **Strzelec Otchłani** (`ranged_40`) za 40 trafień dystansowych.
   - Reward achievementu: `+2 ATK +8 Max MP`.
   - Licznik podpięty end-to-end:
      - runtime (`_resolvePlayerProjectileHits`),
      - save/load (`_buildSaveRunMeta`, `_restoreRunStateFromSave`, defaults/migrations),
      - debug overlay (`Ranged Hits`).
   - Podniesiono `SAVE_SCHEMA_VERSION` do `31` (strict schema match pozostaje aktywny).
   - Walidacja edytorowa: brak błędów w `index.html`.

### G137) Trafienia pociskami wroga: telemetry + achievement
- Dodano licznik runa `enemyProjectileHitsTaken`.
- W `_resolveEnemyProjectileHit(proj)` licznik rośnie przy każdym trafieniu gracza pociskiem wroga.
- Dodano achievement **Skóra ze Stali** (`enemy_proj_hit_30`) za 30 przyjętych trafień dystansowych.
- Reward achievementu: `+3 DEF +12 Max HP`.
- Licznik podpięty end-to-end:
   - runtime (`_resolveEnemyProjectileHit`),
   - save/load (`_buildSaveRunMeta`, `_restoreRunStateFromSave`, defaults/migrations),
   - debug overlay (`Enemy Proj Hits`).
- Podniesiono `SAVE_SCHEMA_VERSION` do `32` (strict schema match pozostaje aktywny).
- Walidacja edytorowa: brak błędów w `index.html`.

### G138) Balans: ekonomia sklepu + pacing elit (bez nowych achievementów)
- Sklep:
   - podniesiono `sellMultiplier` z `0.45` do `0.5`,
   - obniżono ceny podstawowych/dużych mikstur HP i MP,
   - spowolniono wzrost cen ekwipunku z floor (`0.20` → `0.17`).
- Elity:
   - zmniejszono szansę spawnu elit i dodano cap (`max 26%`),
   - obniżono mnożniki statystyk/rewardów elit (HP/ATK/XP/Gold) dla łagodniejszego spike’u trudności.
- Wrogowie dystansowi (late game):
   - osłabiono presję **Widmowego Łowcy** i **Egzekutora Mirażu** (niższy ATK, wolniejszy cadence i wolniejsze pociski).
- Brak zmian w systemie achievementów i brak zmiany schematu zapisu.
- Walidacja edytorowa: brak błędów w `index.html` i `content/enemies.js`.

### G139) Balans: progresja XP i tempo levelowania (bez nowych achievementów)
- Dodano centralny blok `PROGRESSION_BALANCE` dla parametrów progresji.
- Wygładzono krzywą levelowania:
   - wzrost `xpToLevel` po level-up zmniejszono z `1.4` do bazowego `1.37`,
   - od levelu `8` działa łagodniejszy mnożnik (`1.33`), co redukuje zbyt stromy late-game spike wymagań XP.
- Dodano bonus XP zależny od głębokości piętra (od floor `6`, cap `+18%`) przy killach wrogów.
- Floating text po zabiciu pokazuje teraz faktycznie przyznane XP po modyfikatorze piętra.
- Brak zmian w systemie achievementów i brak zmiany schematu zapisu.
- Walidacja edytorowa: brak błędów w `index.html`.

### G140) Balans: pacing starć i spike bossów (bez nowych achievementów)
- Dodano blok `ENCOUNTER_BALANCE` do centralnego strojenia intensywności walk.
- Zmniejszono zagęszczenie wrogów na piętrach (`enemyCountPerFloor: 2.6` zamiast efektywnie `3`), co obniża presję attrition w mid/late game.
- Złagodzono skalowanie bossów z piętrem:
   - HP per floor: `0.17` (było `0.20`),
   - ATK per floor: `0.13` (było `0.15`).
- Cel: utrzymać wyzwanie boss fightów bez gwałtownego spike’u TTK i burstu obrażeń na floor 9–10.
- Brak zmian w systemie achievementów i brak zmiany schematu zapisu.
- Walidacja edytorowa: brak błędów w `index.html`.

### G141) Elity: telemetry zabójstw + achievement
- Dodano licznik runa `eliteKills`.
- W `_handleEnemyDeath(e)` licznik rośnie przy każdym zabiciu przeciwnika z flagą `elite`.
- Dodano achievement **Pogromca Elit** (`elite_kills_20`) za 20 zabitych elit.
- Reward achievementu: `+2 ATK +2 DEF +10 Max HP`.
- Licznik podpięty end-to-end:
   - runtime (`_handleEnemyDeath`),
   - save/load (`_buildSaveRunMeta`, `_restoreRunStateFromSave`, defaults/migrations),
   - debug overlay (`Elity`).
- Podniesiono `SAVE_SCHEMA_VERSION` do `33` (strict schema match pozostaje aktywny).
- Walidacja edytorowa: brak błędów w `index.html`.

### G142) Loot: telemetry podnoszonych przedmiotów + achievement
- Dodano licznik runa `itemsPickedUp` (dotyczy podnoszonych itemów z podłogi, bez złota).
- W `_pickupInventoryItem(item)` licznik rośnie po każdym udanym podniesieniu przedmiotu.
- Dodano achievement **Zbieracz Łupów** (`loot_pickups_30`) za podniesienie 30 przedmiotów.
- Reward achievementu: `+1 ATK +1 DEF +6 Max MP`.
- Licznik podpięty end-to-end:
   - runtime (`_pickupInventoryItem`),
   - save/load (`_buildSaveRunMeta`, `_restoreRunStateFromSave`, defaults/migrations),
   - debug overlay (`Loot Pickups`).
- Podniesiono `SAVE_SCHEMA_VERSION` do `34` (strict schema match pozostaje aktywny).
- Walidacja edytorowa: brak błędów w `index.html`.

### G143) Złoto: telemetry podniesionych stosów + achievement
- Dodano licznik runa `goldPickups` (liczba podniesionych stosów złota z podłogi).
- W `_pickupGoldItem(item)` licznik rośnie przy każdym podniesieniu złota.
- Dodano achievement **Chciwy Kolekcjoner** (`gold_pickups_80`) za podniesienie 80 stosów złota.
- Reward achievementu: `+20 Max HP +10% Gold Find`.
- Licznik podpięty end-to-end:
   - runtime (`_pickupGoldItem`),
   - save/load (`_buildSaveRunMeta`, `_restoreRunStateFromSave`, defaults/migrations),
   - debug overlay (`Gold Pickups`).
- Podniesiono `SAVE_SCHEMA_VERSION` do `35` (strict schema match pozostaje aktywny).
- Walidacja edytorowa: brak błędów w `index.html`.

### G144) Środowisko: telemetry trafień hazardowych + achievement
- Dodano licznik runa `hazardHitsTaken` (realnie otrzymane trafienia od lawy i pułapek).
- W `_applyPlayerTileEffects(p,nx)` licznik rośnie tylko wtedy, gdy po obrażeniach środowiskowych faktycznie spada HP gracza.
- Dodano achievement **Hartowany w Ogniu** (`hazard_hits_25`) za 25 trafień od zagrożeń środowiskowych.
- Reward achievementu: `+3 DEF +12 Max HP`.
- Licznik podpięty end-to-end:
   - runtime (`_applyPlayerTileEffects`),
   - save/load (`_buildSaveRunMeta`, `_restoreRunStateFromSave`, defaults/migrations),
   - debug overlay (`Hazard Hits`).
- Podniesiono `SAVE_SCHEMA_VERSION` do `36` (strict schema match pozostaje aktywny).
- Walidacja edytorowa: brak błędów w `index.html`.

### G145) Obrona: telemetry przyjętych trafień + achievement
- Dodano licznik runa `hitsTaken` (wszystkie realnie otrzymane trafienia gracza).
- W `damagePlayer(dmg,msg,cls)` licznik rośnie po każdym skutecznym trafieniu i od razu wykonywany jest check achievementów.
- Dodano achievement **Niezłomny** (`hits_taken_120`) za przyjęcie 120 trafień.
- Reward achievementu: `+4 DEF +20 Max HP`.
- Licznik podpięty end-to-end:
   - runtime (`damagePlayer`),
   - save/load (`_buildSaveRunMeta`, `_restoreRunStateFromSave`, defaults/migrations),
   - debug overlay (`Hits Taken`).
- Podniesiono `SAVE_SCHEMA_VERSION` do `37` (strict schema match pozostaje aktywny).
- Walidacja edytorowa: brak błędów w `index.html`.

### G146) Ekwipunek: telemetry zakładania pierścieni + achievement
- Dodano licznik runa `ringEquips`.
- W `_equipRingItem(idx,item)` licznik rośnie przy każdym założeniu pierścienia.
- Dodano achievement **Mistrz Pierścieni** (`ring_equips_10`) za założenie 10 pierścieni.
- Reward achievementu: `+2 DEF +8 Max MP`.
- Licznik podpięty end-to-end:
   - runtime (`_equipRingItem`),
   - save/load (`_buildSaveRunMeta`, `_restoreRunStateFromSave`, defaults/migrations),
   - debug overlay (`Ring Equips`).
- Podniesiono `SAVE_SCHEMA_VERSION` do `38` (strict schema match pozostaje aktywny).
- Walidacja edytorowa: brak błędów w `index.html`.

### G147) Ekwipunek: telemetry zakładania broni + achievement
- Dodano licznik runa `weaponEquips`.
- W `_equipWeaponItem(idx,item)` licznik rośnie przy każdym założeniu broni.
- Dodano achievement **Zbrojmistrz Ostrza** (`weapon_equips_12`) za założenie 12 broni.
- Reward achievementu: `+3 ATK +5% Krytyk`.
- Licznik podpięty end-to-end:
   - runtime (`_equipWeaponItem`),
   - save/load (`_buildSaveRunMeta`, `_restoreRunStateFromSave`, defaults/migrations),
   - debug overlay (`Weapon Equips`).
- Podniesiono `SAVE_SCHEMA_VERSION` do `39` (strict schema match pozostaje aktywny).
- Walidacja edytorowa: brak błędów w `index.html`.

### G148) Ekwipunek: telemetry zakładania pancerzy + achievement
- Dodano licznik runa `armorEquips`.
- W `_equipArmorItem(idx,item)` licznik rośnie przy każdym założeniu pancerza.
- Dodano achievement **Żelazna Garda** (`armor_equips_10`) za założenie 10 pancerzy.
- Reward achievementu: `+4 DEF +12 Max HP`.
- Licznik podpięty end-to-end:
   - runtime (`_equipArmorItem`),
   - save/load (`_buildSaveRunMeta`, `_restoreRunStateFromSave`, defaults/migrations),
   - debug overlay (`Armor Equips`).
- Podniesiono `SAVE_SCHEMA_VERSION` do `40` (strict schema match pozostaje aktywny).
- Walidacja edytorowa: brak błędów w `index.html`.

### G149) Ekwipunek: telemetry wyrzucanych przedmiotów + achievement
- Dodano licznik runa `itemsDropped`.
- W `dropItem(itemId)` licznik rośnie przy każdym wyrzuceniu przedmiotu z ekwipunku.
- Dodano achievement **Czyściciel Plecaka** (`items_dropped_20`) za wyrzucenie 20 przedmiotów.
- Reward achievementu: `+1 ATK +2 DEF`.
- Licznik podpięty end-to-end:
   - runtime (`dropItem`),
   - save/load (`_buildSaveRunMeta`, `_restoreRunStateFromSave`, defaults/migrations),
   - debug overlay (`Items Dropped`).
- Podniesiono `SAVE_SCHEMA_VERSION` do `41` (strict schema match pozostaje aktywny).
- Walidacja edytorowa: brak błędów w `index.html`.

## Roadmap 2.0 (start implementacji)

### 2.0.0 — Fundament kompatybilności zapisu (breaking change)
- Dodano jawny kontrakt wersji gry i kompatybilności save:
   - `GAME_VERSION = '2.0.0'`,
   - `SAVE_COMPAT_TAG = 'DOS-2.x'`.
- Save zapisuje teraz metadane `gameVersion` oraz `saveCompatTag`.
- Loader wymaga zgodnego `saveCompatTag`; stare save'y (1.x/bez tagu) są odrzucane czytelnym komunikatem o nowym formacie w 2.0.
- Polityka 2.0: **breaking save** (świadome odcięcie kompatybilności wstecznej).

### 2.0.0 — Kolejne kroki (w toku)
- Pakiet content expansion: nowe klasy/spelle/wrogowie/eventy/itemy.
- Utrzymanie pełnego podpięcia telemetry/save/debug dla nowych mechanik.
- Finalny pass balansu floor 7–10 po wdrożeniu pakietu contentu.

### 2.0.1 — Stabilizacja po release
- Poprawki balansu i regresji po smoke-check 2.0.0.
- Bez dokładania nowych systemów wysokiego ryzyka.

### H) Walidacja
- Po refaktorach: brak błędów składni/compile w `index.html`.
- Zmiany mają charakter architektoniczny i nie wprowadzają nowych mechanik gameplay.

### G150) 2.0 Content Expansion: event „Szczelina Otchłani”
- Dodano nowy event mapowy `TILE.RIFT` (spawn od piętra 4, osobna szansa i osobny kolor/światło).
- Dodano pełny flow interakcji `_useAbyssRift(tx,ty)`:
   - koszt HP (`riftCostMin`/`riftCostPct`),
   - 3 wyniki ryzyko/nagroda (ofensywny, defensywny, ekonomiczny z lootem),
   - check achievementów po użyciu.
- Event został podpięty end-to-end:
   - generator lochu,
   - system cooldownów eventów między piętrami (`_lastRiftFloor`, trace `V-on/off/blk`),
   - render tile + minimapa + fullmapa + legenda,
   - interakcja (`_handleTileInteraction`).
- Dodano nowe telemetry/achievementy:
   - licznik `abyssRiftsUsed` + achievement `rift_3` (**Pęknięta Granica**),
   - licznik `riftEmpowerments` + achievement `rift_emp_2` (**Znak Otchłani**).
- Save/load rozszerzony o nowe pola telemetry i cooldown (`abyssRiftsUsed`, `riftEmpowerments`, `lastRiftFloor`).
- Podniesiono `SAVE_SCHEMA_VERSION` do `42`.

### G151) 2.0 Content Expansion: nowa umiejętność bossa „Szczelinowa Nova”
- Dodano nową aktywną umiejętność bossa `rift_nova`:
   - obrażenia obszarowe zależne od dystansu,
   - pierścień 12 pocisków arcane,
   - wyraźny FX/log (`shake`, `flash`, burst/magic).
- Umiejętność została przypięta do bossów late-game:
   - `Lich`,
   - `Smok Cieni`.
- Dodano telemetry runa `riftNovaSurvived` (przetrwane casty novy bossa).
- Dodano achievement `rift_nova_3` (**Rozrywacz Próżni**) za przetrwanie 3 Szczelinowych Nov.
- Telemetry podpięte end-to-end:
   - runtime (`_bossAbilityRiftNova`),
   - save/load (`_buildSaveRunMeta`, `_restoreRunStateFromSave`, defaults/migrations),
   - debug overlay (`RiftNova`).
- Podniesiono `SAVE_SCHEMA_VERSION` do `43`.

### G152) 2.0 Content Expansion: nowy afiks elit „Szczelinowy”
- Dodano nowy afiks do puli elit: **Szczelinowy** (`🜔`).
- Mechanika afiksu:
   - elita okresowo emituje puls Szczeliny,
   - puls tworzy pierścień pocisków arcane (zagrożenie strefowe),
   - dodane dedykowane FX (magic/burst/flash).
- Dodano telemetry `riftboundElitesSlain` (zabite elity Szczelinowe).
- Dodano achievement `rift_elite_6` (**Łamacz Szczelin**) za zabicie 6 elit Szczelinowych.
- Telemetry podpięte end-to-end:
   - runtime (`_tryEliteRiftPulse`, `_handleEnemyDeath`),
   - save/load (`_buildSaveRunMeta`, `_restoreRunStateFromSave`, defaults/migrations),
   - debug overlay (`Szczelinowe Elity`).
- Podniesiono `SAVE_SCHEMA_VERSION` do `44`.

### G153) 2.0 Content Expansion: nowy czar maga „Szczelinowa Salwa”
- Zmieniono 2. slot maga na nowy czar **Szczelinowa Salwa** (`type: rift_burst`).
- Dodano nowy handler `_castSpellRiftBurst(spell)`:
   - radialna salwa pocisków arcane,
   - puls AoE z natychmiastowym trafianiem pobliskich celów,
   - dedykowane FX (burst/magic/flash/shake).
- Dodano telemetry czaru:
   - `riftBurstsCast`,
   - `riftBurstHits`.
- Dodano nowe achievementy:
   - `rift_burst_12` (**Arcykanał Szczeliny**),
   - `rift_burst_hits_70` (**Nadprzewodnik Próżni**).
- Telemetry podpięte end-to-end:
   - runtime (`_castSpellRiftBurst`),
   - save/load (`_buildSaveRunMeta`, `_restoreRunStateFromSave`, defaults/migrations),
   - debug overlay (`RiftBurst Cast`, `RiftBurst Hits`).
- Podniesiono `SAVE_SCHEMA_VERSION` do `45`.

### G154) 2.0 Content Expansion: nowy czar wojownika „Rozdarcie Ziemi”
- Zmieniono 5. slot wojownika na nowy czar **Rozdarcie Ziemi** (`type: earthsplitter`).
- Dodano nowy handler `_castSpellEarthsplitter(spell,index)`:
   - liniowa fala uderzeniowa w kierunku kursora,
   - trafia cele w korytarzu szerokości,
   - krótko ogłusza trafionych przeciwników,
   - dedykowane FX (burst/flash/shake).
- Dodano telemetry czaru:
   - `earthsplittersCast`,
   - `earthsplitterHits`.
- Dodano nowe achievementy:
   - `earthsplitter_10` (**Wstrząs Wojny**),
   - `earthsplitter_hits_50` (**Pęknięty Front**).
- Telemetry podpięte end-to-end:
   - runtime (`_castSpellEarthsplitter`),
   - save/load (`_buildSaveRunMeta`, `_restoreRunStateFromSave`, defaults/migrations),
   - debug overlay (`Earthsplitter Cast`, `Earthsplitter Hits`).
- Podniesiono `SAVE_SCHEMA_VERSION` do `46`.

### G155) 2.0 Content Expansion: nowy czar łotrzyka „Przebicie Pustki”
- Zmieniono 4. slot łotrzyka na nowy czar **Przebicie Pustki** (`type: voidstep`).
- Dodano nowy handler `_castSpellVoidstep(spell,index)`:
   - doskok przez cel i ustawienie pozycji za przeciwnikiem,
   - dodatkowa egzekucja osłabionych celów (próg HP),
   - krótki stealth po wykonaniu,
   - dedykowane FX (lightning/burst/magic/flash/shake).
- Dodano telemetry czaru:
   - `voidstepCasts`,
   - `voidstepExecutes`.
- Dodano nowe achievementy:
   - `voidstep_12` (**Przeszycie Mroku**),
   - `voidstep_exec_8` (**Egzekutor Cieni**).
- Telemetry podpięte end-to-end:
   - runtime (`_castSpellVoidstep`),
   - save/load (`_buildSaveRunMeta`, `_restoreRunStateFromSave`, defaults/migrations),
   - debug overlay (`Voidstep Cast`, `Voidstep Exec`).
- Podniesiono `SAVE_SCHEMA_VERSION` do `47`.

### G156) 2.0 Content Expansion: nowy legendarny efekt itemu „Szczelinowy Rezonans”
- Dodano nowy legendarny ring: **Pierścień Szczelinowego Rezonansu** (`effect: riftPulse`).
- Dodano runtime efekt defensywno-ofensywny:
   - po otrzymaniu obrażeń pierścień emituje puls arcane wokół gracza,
   - puls zadaje obrażenia pobliskim wrogom,
   - efekt ma cooldown runtime (`_riftPulseCooldown`).
- Dodano telemetry efektu:
   - `riftPulseProcs`,
   - `riftPulseKills`.
- Dodano nowe achievementy:
   - `rift_pulse_20` (**Szczelinowy Rezonans**),
   - `rift_pulse_kills_40` (**Władca Rezonansu**).
- Telemetry podpięte end-to-end:
   - runtime (`_triggerRiftPulseRetaliation`),
   - save/load (`_buildSaveRunMeta`, `_restoreRunStateFromSave`, defaults/migrations),
   - debug overlay (`RiftPulse Proc`, `RiftPulse Kills`, `RiftPulse CD`).
- Podniesiono `SAVE_SCHEMA_VERSION` do `48`.

### G157) 2.0 Content Expansion: event „Obelisk Pustki”
- Dodano nowy event mapowy `TILE.OBELISK` (spawn od piętra 6, osobna szansa i osobny kolor/światło).
- Dodano pełny flow interakcji `_useVoidObelisk(tx,ty)`:
   - koszt HP (`obeliskCostMin`/`obeliskCostPct`),
   - 3 wyniki ryzyko/nagroda (ofensywny, defensywno-many, ekonomiczny z lootem),
   - check achievementów po użyciu.
- Event został podpięty end-to-end:
   - generator lochu,
   - system cooldownów eventów między piętrami (`_lastObeliskFloor`, trace `O-on/off/blk`),
   - render tile + minimapa + fullmapa + legenda,
   - interakcja (`_handleTileInteraction`).
- Dodano nowe telemetry/achievementy:
   - licznik `voidObelisksUsed` + achievement `obelisk_3` (**Szept Monolitu**),
   - licznik `obeliskBoons` + achievement `obelisk_boon_2` (**Pieczęć Pustki**).
- Save/load rozszerzony o nowe pola telemetry i cooldown (`voidObelisksUsed`, `obeliskBoons`, `lastObeliskFloor`).
- Podniesiono `SAVE_SCHEMA_VERSION` do `49`.

### G158) 2.0 Content Expansion: nowa umiejętność bossa „Burza Obelisku”
- Dodano nową aktywną umiejętność bossa `obelisk_storm`:
   - obrażenia obszarowe zależne od dystansu,
   - pierścień 10 pocisków arcane emitowanych z orbity wokół bossa,
   - dedykowane FX/log (`shake`, `flash`, burst/magic).
- Umiejętność została przypięta do bossów late-game:
   - `Lich`,
   - `Smok Cieni`.
- Dodano telemetry runa `obeliskStormSurvived` (przetrwane casty Burzy Obelisku).
- Dodano achievement `obelisk_storm_3` (**Monolit Niezłomny**) za przetrwanie 3 Burz Obelisku.
- Telemetry podpięte end-to-end:
   - runtime (`_bossAbilityObeliskStorm`),
   - save/load (`_buildSaveRunMeta`, `_restoreRunStateFromSave`, defaults/migrations),
   - debug overlay (`ObeliskStorm`).
- Podniesiono `SAVE_SCHEMA_VERSION` do `50`.

### G159) 2.0 Content Expansion: nowy afiks elit „Obeliskowy”
- Dodano nowy afiks do puli elit: **Obeliskowy** (`🗿`).
- Mechanika afiksu:
   - elita okresowo emituje wachlarz pocisków arcane w kierunku gracza,
   - atak strefowy działa w średnim dystansie i tworzy presję pozycyjną,
   - dodane dedykowane FX (magic/burst/flash).
- Dodano telemetry `obeliskboundElitesSlain` (zabite elity Obeliskowe).
- Dodano achievement `obelisk_elite_6` (**Kruszyciel Monolitów**) za zabicie 6 elit Obeliskowych.
- Telemetry podpięte end-to-end:
   - runtime (`_tryEliteObeliskPulse`, `_handleEnemyDeath`),
   - save/load (`_buildSaveRunMeta`, `_restoreRunStateFromSave`, defaults/migrations),
   - debug overlay (`Obeliskowe Elity`).
- Podniesiono `SAVE_SCHEMA_VERSION` do `51`.

### G160) 2.0 Content Expansion: nowy czar maga „Lanca Obelisku”
- Zmieniono 3. slot maga na nowy czar **Lanca Obelisku** (`type: obelisk_lance`).
- Dodano nowy handler `_castSpellObeliskLance(spell,index)`:
   - przebijająca linia arcane w kierunku kursora,
   - trafia cele w korytarzu szerokości,
   - krótko ogłusza trafionych przeciwników,
   - dedykowane FX (lightning/burst/flash/shake).
- Dodano telemetry czaru:
   - `obeliskLancesCast`,
   - `obeliskLanceHits`.
- Dodano nowe achievementy:
   - `obelisk_lance_12` (**Sztych Monolitu**),
   - `obelisk_lance_hits_60` (**Przebicie Monolitu**).
- Telemetry podpięte end-to-end:
   - runtime (`_castSpellObeliskLance`),
   - save/load (`_buildSaveRunMeta`, `_restoreRunStateFromSave`, defaults/migrations),
   - debug overlay (`ObeliskLance Cast`, `ObeliskLance Hits`).
- Podniesiono `SAVE_SCHEMA_VERSION` do `52`.

### G161) 2.0 Content Expansion: nowy czar wojownika „Monolitowy Taran”
- Zmieniono 4. slot wojownika na nowy czar **Monolitowy Taran** (`type: obelisk_crash`).
- Dodano nowy handler `_castSpellObeliskCrash(spell,index)`:
   - skok do celu w zasięgu,
   - uderzenie obszarowe przy lądowaniu,
   - krótko ogłusza trafionych przeciwników,
   - dedykowane FX (lightning/burst/flash/shake).
- Dodano telemetry czaru:
   - `obeliskCrashesCast`,
   - `obeliskCrashHits`.
- Dodano nowe achievementy:
   - `obelisk_crash_10` (**Taran Monolitu**),
   - `obelisk_crash_hits_45` (**Impakt Bastionu**).
- Telemetry podpięte end-to-end:
   - runtime (`_castSpellObeliskCrash`),
   - save/load (`_buildSaveRunMeta`, `_restoreRunStateFromSave`, defaults/migrations),
   - debug overlay (`ObeliskCrash Cast`, `ObeliskCrash Hits`).
- Podniesiono `SAVE_SCHEMA_VERSION` do `53`.

### G162) 2.0 Content Expansion: nowy czar łotrzyka „Odłamki Monolitu”
- Zmieniono 3. slot łotrzyka na nowy czar **Odłamki Monolitu** (`type: obelisk_fan`).
- Dodano nowy handler `_castSpellObeliskFan(spell,index)`:
   - wachlarz odłamków arcane przed graczem,
   - natychmiastowe trafienia w stożku średniego zasięgu,
   - dedykowane FX (projectiles/burst/flash/shake).
- Dodano telemetry czaru:
   - `obeliskFansCast`,
   - `obeliskFanHits`.
- Dodano nowe achievementy:
   - `obelisk_fan_12` (**Wachlarz Monolitu**),
   - `obelisk_fan_hits_70` (**Szrapnel Pustki**).
- Telemetry podpięte end-to-end:
   - runtime (`_castSpellObeliskFan`),
   - save/load (`_buildSaveRunMeta`, `_restoreRunStateFromSave`, defaults/migrations),
   - debug overlay (`ObeliskFan Cast`, `ObeliskFan Hits`).
- Podniesiono `SAVE_SCHEMA_VERSION` do `54`.

### G163) 2.0 Content Expansion: nowy legendarny efekt itemu „Echo Obelisku”
- Dodano nowy legendarny ring: **Pierścień Echa Obelisku** (`effect: obeliskEcho`).
- Dodano runtime efekt ofensywny:
   - po rzuceniu czaru pierścień emituje wachlarz trzech lanc arcane w kierunku kursora,
   - echo trafia przeciwników na linii i ma cooldown runtime (`_obeliskEchoCooldown`),
   - efekt ma własne FX/log i nie dubluje trafień tego samego celu w jednym procu.
- Dodano telemetry efektu:
   - `obeliskEchoProcs`,
   - `obeliskEchoKills`.
- Dodano nowe achievementy:
   - `obelisk_echo_20` (**Echo Monolitu**),
   - `obelisk_echo_kills_35` (**Władca Monolitu**).
- Telemetry podpięte end-to-end:
   - runtime (`_triggerObeliskEchoOnSpellCast`),
   - save/load (`_buildSaveRunMeta`, `_restoreRunStateFromSave`, defaults/migrations),
   - debug overlay (`ObeliskEcho Proc`, `ObeliskEcho Kills`, `ObeliskEcho CD`).
- Podniesiono `SAVE_SCHEMA_VERSION` do `55`.

### G164) 2.0 Content Expansion: nowy legendarny efekt itemu „Warta Obelisku”
- Dodano nowy legendarny armor: **Pancerz Straży Obelisku** (`effect: obeliskWard`).
- Dodano runtime efekt defensywno-ofensywny:
   - po otrzymaniu obrażeń pancerz uruchamia wartę Obelisku,
   - warta zadaje obrażenia pobliskim przeciwnikom, daje czasowy bonus obrony i ma cooldown runtime,
   - efekt został pokazany także na buff-bar HUD.
- Dodano telemetry efektu:
   - `obeliskWardProcs`,
   - `obeliskWardKills`.
- Dodano nowe achievementy:
   - `obelisk_ward_18` (**Straż Monolitu**),
   - `obelisk_ward_kills_25` (**Bastion Egzekucji**).
- Telemetry podpięte end-to-end:
   - runtime (`_triggerObeliskWardOnDamage`),
   - save/load (`_buildSaveRunMeta`, `_restoreRunStateFromSave`, defaults/migrations),
   - HUD/debug overlay (`ObeliskWard Proc`, `ObeliskWard Kills`, `ObeliskWard CD`, `ObeliskWard Up`).
- Podniesiono `SAVE_SCHEMA_VERSION` do `56`.
