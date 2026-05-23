# Sprint Smoke Check — Dungeon of Shadows

Data: 2026-02-17
Zakres: save/load, combat feedback, balans ekonomii, nowy enemy + nowy spell, relikt mapowy, debug overlay

## 1) Save / Load (krytyczne)

### S1. Nowa gra -> zapis -> wczytanie
1. Uruchom nową grę dowolną klasą.
2. Zdobądź trochę złota i podnieś minimum 1 przedmiot.
3. Zapisz grę (Esc -> slot 1 lub szybki zapis).
4. Wczytaj ten sam slot.

Oczekiwane:
- Brak błędu JS / crasha.
- Pozycja gracza, HP/MP, gold, inventory, floor i przeciwnicy są odtworzone.
- UI działa normalnie po load (log, spellbar, inventory, minimapa).

### S2. Nieprawidłowe akcje save/load
1. Spróbuj wczytać pusty slot.
2. Spróbuj zapisać/wczytać z ustawień i skrótów klawiszowych.

Oczekiwane:
- Czytelny komunikat (slot pusty / nieprawidłowy), bez zawieszenia gry.

## 2) Combat UX (feedback i brak spamu)

### C1. Atak podstawowy i specjalny
1. Spamuj LPM/PPM, gdy atak jest na cooldownie.
2. Użyj ataku specjalnego bez many.
3. Atakuj, gdy nie ma wroga w zasięgu.

Oczekiwane:
- Są czytelne komunikaty o cooldownie, braku many i braku celu.
- Log nie jest zalewany identycznymi wpisami co klatkę.

### C2. Czary (mana/cd/range/target)
1. Rzuć czar na cooldownie.
2. Rzuć czar bez wystarczającej many.
3. Teleport na niedozwolone pole i poza zasięg.
4. Drain/Backstab bez celu w zasięgu.

Oczekiwane:
- Każdy przypadek zwraca konkretny powód niepowodzenia.
- Brak regresji działania czarów, gdy warunki są spełnione.

## 3) Ekonomia i sklep

### E1. Widoczność kosztów
1. Wejdź do sklepu z małą ilością złota.
2. Sprawdź przedmioty, na które nie stać.

Oczekiwane:
- Widać informację „brakuje X💰”.
- Przycisk kupna jest niedostępny dla zbyt drogich itemów.

### E2. Kupno / sprzedaż
1. Kup 1 przedmiot i sprawdź log.
2. Sprzedaj item stackowalny (mikstury) i zwykły.

Oczekiwane:
- Log kupna pokazuje cenę i stan złota po transakcji.
- Log sprzedaży pokazuje kwotę, stan złota i pozostały stack (jeśli dotyczy).

### E3. Skrzynie
1. Otwórz skrzynię.

Oczekiwane:
- Log ma czytelną formę: item + gold.
- Złoto i loot są rzeczywiście dodane.

## 4) Nowy content

### N1. Burza Otchłani (Mag, slot 5)
1. Wybierz maga i użyj czaru 5 na grupie przeciwników.

Oczekiwane:
- Działa jako chain (wiele trafień).
- Koszt many i cooldown są zgodne z aktualnym balansem.

### N2. Kultysta Otchłani
1. Dojdź do głębszych pięter (mid/late).
2. Zidentyfikuj wroga „Kultysta Otchłani”.

Oczekiwane:
- Wróg pojawia się naturalnie w puli spawnów.
- Ma odróżnialny styl ranged (tempo/kolor/pocisk) od Maga Cieni.

### N3. Relikt mapowy (🜂)
1. Przejdź przez kilka pięter (od 2+) i znajdź pole reliktu.
2. Wejdź na relikt i użyj interakcji.

Oczekiwane:
- Pole reliktu zamienia się po aktywacji na zwykłą podłogę.
- Uruchamia się jeden z efektów (złoto / błogosławieństwo / krwawy pakt).
- Licznik reliktów rośnie i może odblokować achievement po 3 aktywacjach.

### N4. Studnia Cieni (🕳️)
1. Wejdź na piętro 3+ i znajdź Studnię Cieni.
2. Wejdź na pole studni i użyj interakcji.

Oczekiwane:
- Pole studni znika po użyciu (zamiana na podłogę).
- Gracz traci część HP i otrzymuje jedną z nagród ofensywno-magicznych.
- Log pokazuje czytelnie koszt i efekt interakcji.
- Licznik „Studnie” w debug overlay zwiększa się po użyciu.

### N5. Cooldown eventów per floor
1. Schodź piętro po piętrze i obserwuj występowanie Reliktu/Studni.
2. Sprawdź, czy ten sam typ eventu nie pojawia się na dwóch kolejnych piętrach.

Oczekiwane:
- Relikt i Studnia respektują cooldown pięter (bez pojawiania się floor-po-floor tego samego typu).
- Brak crashy i błędów mapy po wymuszeniu cooldownu (usunięcie eventu na floorze).
- W logu piętra pojawia się telemetry wpis eventów (`aktywny / zablokowany / brak`).
- Debug overlay pokazuje skrót statusu `FEvent` dla bieżącego piętra.

## 5) Debug overlay

### D1. Telemetria runtime
1. Uruchom grę i obserwuj panel debug.
2. Wejdź do walki i zmień piętro.

Oczekiwane:
- Overlay pokazuje FPS, floor, enemies, buffs, combo, relikty i czas runa.
- Wartości aktualizują się podczas gry bez błędów UI.

### D2. Toggle i persystencja panelu debug
1. Przełącz panel debug skrótem (domyślnie F3).
2. Zrestartuj grę i sprawdź, czy stan panelu został zapamiętany.

Oczekiwane:
- F3 poprawnie przełącza widoczność panelu debug.
- Po restarcie gry widoczność panelu pozostaje zgodna z ostatnim stanem.

## 6) Save schema i kompatybilność

### V1. Wczytywanie starych zapisów
1. Wczytaj zapis bez pola `mysticEvents` (starszy save).
2. Wczytaj zapis bez pola `shadowWellsUsed`.
3. Wczytaj zapis bez pól `lastRelicFloor` i `lastWellFloor`.

Oczekiwane:
- Save ładuje się poprawnie (migracja/fallback działa).

### V2. Guard na nowszy schema
1. Spróbuj wczytać zapis z wyższym `version` niż bieżący.

Oczekiwane:
- Gra pokazuje czytelny błąd o nowszej wersji zapisu i nie crashuje.

## 7) Kryteria zaliczenia sprintu
- Brak crashy i błędów krytycznych podczas scenariuszy S1-S2, C1-C2, E1-E3, N1-N4, D1, V1-V2.
- Feedback akcji jest czytelny i nie spamuje logu.
- Ekonomia jest bardziej czytelna z perspektywy gracza (koszt, brakujące złoto, bilans po transakcji).
- Save/Load nie gubi kluczowych elementów runa.

## 8) Notatki po teście (uzupełnij)
- Bugi krytyczne:
- Bugi średnie:
- Drobne UX:
- Decyzje balansu na kolejny sprint:
