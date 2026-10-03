'use strict';
Object.assign(Game, {
  openMeta(){
    if(this.sound&&this.sound.ui)this.sound.ui();
    this._renderMeta();
    document.getElementById('meta-panel').classList.add('open');
  },
  closeMeta(){
    document.getElementById('meta-panel').classList.remove('open');
  },
  buyMetaUpgrade(id){
    if(Meta.buy(id)){if(this.sound&&this.sound.buy)this.sound.buy();}
    else if(this.sound&&this.sound.ui)this.sound.ui();
    this._renderMeta();
  },
  openBestiary(){
    if(this.sound&&this.sound.ui)this.sound.ui();
    this._renderBestiary();
    document.getElementById('meta-panel').classList.add('open');
  },
  openChangelog(){
    if(this.sound&&this.sound.ui)this.sound.ui();
    const versions=[
      {v:'2.5',title:'Grimuar: nowe karty nagród',items:[
        'Awans, relikt i kapliczka jako karty z księgi zaklęć — z ikoną, opisem i kategorią',
        'Woskowe pieczęcie i poświata pokazują rzadkość nagrody',
        'Niedostępne opcje są wyszarzone z powodem (np. „Brakuje 30 💰”, „Limit reliktów”)',
        'Klawisze 1–4 wybierają kartę',
        'Ochrona przed przypadkowym wyborem tuż po otwarciu okna',
        'Przycisk „Pomiń” przy reliktach',
      ]},
      {v:'2.4',title:'Remaster: czucie gry',items:[
        'Płynny ruch z rozpędem i hamowaniem',
        'Unik na Spacji: krótki doskok z nietykalnością, odnawia się co 1 s',
        'Łuk cięcia pokazuje zasięg ciosu; mag i nekromanta mają linię kierunku strzału',
        'Każda umiejętność bossa ma zapowiedź na ziemi — w furii krótszą; nieuniknięte uderzenie boli mocniej',
        'Zwykły cios bossa z rozmachem zamiast bez ostrzeżenia',
        'Strzelcy celują przed strzałem — krok w bok wystarczy',
        'Pulsy elit z zapowiedzią',
        'Pociski wrogów wyraźnie odróżniają się od twoich',
      ]},
      {v:'2.3.1',title:'Łatka poprawek',items:[
        'Szarża / Monolitowy Taran nie wbija już postaci w ścianę i ląduje przy kursorze',
        'Aktywne mikstury i eliksiry nie zostają na stałe po zapisie i wczytaniu',
        'Naprawiono błąd wczytywania zapisu z aktywnym eliksirem z ekranu tytułowego',
        'Kilka awansów naraz = kilka wyborów nagrody (żadna nie przepada)',
        'W pauzie, sklepie i przy wyborze nagrody klawisze akcji są zablokowane',
        'Zapis wstrzymany podczas schodzenia i wyboru nagrody',
        'Cios wręcz trafia wroga, w którego celujesz; egzekucja dobija opancerzonych',
        'Moc Zaklęć działa na wszystkie zaklęcia',
        'Wrogowie nie utykają na rogach ścian, nietoperze nie wchodzą w ściany',
        'Po Alt+Tab postać nie idzie dalej sama',
        'Start piętra nigdy na pułapce ani w lawie; czas biegu nie liczy pauzy',
        'Esc zamyka sklep/ekwipunek; mapa nie zdradza ukrytych ścian',
        'Wybór slotu przy wczytywaniu z menu, potwierdzenie usuwania zapisu',
      ]},
      {v:'2.3',title:'Nowy HUD',items:['Portret postaci, ghost-bary HP, radialne cooldowny, fazy bossa na pasku']},
      {v:'2.2',title:'Głębia i Różnorodność',items:['Mimiki, afiksy Otchłani, skarbce z kluczem, areny, bestiariusz']},
      {v:'2.1.3',title:'Mądrzejsi wrogowie',items:['Kiting, linia wzroku, strzał z wyprzedzeniem, ukrycie']},
      {v:'2.1.2',title:'Wygląd pięter',items:['Style motywów, dekoracje, żyły żaru']},
      {v:'2.1.1',title:'Rebalans walki',items:['Bossowie nie giną już od jednego kliknięcia']},
      {v:'2.1',title:'Rework graficzny',items:['Proceduralne tekstury, nowy ekran tytułowy']},
      {v:'2.0',title:'Echa Otchłani',items:['Nekromanta, nieskończona Otchłań, zwoje, nowi wrogowie']},
      // wcześniejsze aktualizacje nie miały numerów wersji — opisane etapami
      {v:'1.x',title:'Sanktuarium Dusz',items:['Trwałe ulepszenia między biegami za esencję dusz']},
      {v:'1.x',title:'Głębsza walka',items:[
        'Telegrafowane ataki wrogów z oknem na unik',
        'Nowy wróg: szarżujący Dzik Otchłani',
        'Ukryte ściany ze skrytkami pełnymi skarbów',
      ]},
      {v:'1.x',title:'Dźwięk',items:['Ambient pięter, kroki, bicie serca przy niskim HP, dźwięki UI i krytyków']},
      {v:'1.x',title:'Szlify',items:[
        'Balans reliktów, miękka mgła, unoszące się drobinki',
        'Pułapki widoczne dla każdej klasy, kamienno-mosiężny wygląd UI',
        'Postać nie utyka już w wodzie przy ścianie',
      ]},
      {v:'1.x',title:'Eventy i ekonomia',items:[
        'Relikty, Studnie Cieni, Szczeliny i Obeliski na mapie',
        'Czytelniejszy sklep i komunikaty walki, bezpieczniejsze zapisy, panel debug (F3)',
      ]},
      {v:'1.0',title:'Początek',items:['Proceduralne lochy, 3 klasy, oświetlenie, animacje i efekty']},
    ];
    let html=`<h2>📜 Co nowego</h2><div class="meta-body" style="max-height:55vh;overflow-y:auto">`;
    for(const ver of versions){
      html+=`<div style="color:#e8b24a;font-size:13px;margin:12px 0 4px"><b>${ver.v}</b> — ${ver.title}</div>`;
      html+=`<ul style="margin:0 0 4px 18px;padding:0;color:#cbbfa6;font-size:12px;line-height:1.6">`;
      for(const it of ver.items)html+=`<li>${it}</li>`;
      html+=`</ul>`;
    }
    html+=`</div><div class="panel-btns"><button class="btn-close" onclick="Game.closeMeta()">Zamknij</button></div>`;
    const panel=document.getElementById('meta-panel');
    panel.innerHTML=html;
    panel.classList.add('open');
  },
  _renderBestiary(){
    const {discovered,total}=Bestiary.getDiscoveredCount();
    let html=`<h2>📖 Bestiariusz</h2>`
      +`<div class="meta-essence">Odkryto: <b>${discovered}/${total}</b></div>`
      +`<div class="meta-body" style="max-height:55vh;overflow-y:auto">`;
    for(const group of Bestiary.getGroups()){
      html+=`<div style="color:#b6a279;font-size:11px;text-transform:uppercase;letter-spacing:1px;margin:10px 0 4px">${group.label}</div>`;
      for(const t of group.entries){
        const kills=Bestiary.kills(t.name);
        if(kills>0){
          html+=`<div class="meta-row">`
            +`<div class="meta-info"><span class="meta-icon">${t.icon}</span> <b>${t.name}</b>`
            +`<br><span class="meta-desc">❤️ ${t.hp} &nbsp; ⚔ ${t.atk} &nbsp; 🛡 ${t.def||0} &nbsp; 💨 ${t.speed}${t.ranged?' &nbsp; 🏹 dystansowy':''}</span></div>`
            +`<div style="color:#e8b24a;font-size:12px;white-space:nowrap">💀 ${kills}</div>`
            +`</div>`;
        }else{
          html+=`<div class="meta-row" style="opacity:.45">`
            +`<div class="meta-info"><span class="meta-icon">❓</span> <b>???</b><br><span class="meta-desc">Pokonaj, aby odkryć</span></div>`
            +`</div>`;
        }
      }
    }
    html+=`</div>`
      +`<div class="meta-hint">Statystyki bazowe (skalują się z piętrem). Odkrycia są trwałe.</div>`
      +`<div class="panel-btns"><button class="btn-close" onclick="Game.closeMeta()">Zamknij</button></div>`;
    document.getElementById('meta-panel').innerHTML=html;
  },
  _renderMeta(){
    const ess=Meta.essence();
    let rows='';
    for(const u of Meta.upgrades){
      const lvl=Meta.getLevel(u.id);
      const cost=Meta.nextCost(u);
      const maxed=cost===null;
      const afford=!maxed&&ess>=cost;
      const pips='●'.repeat(lvl)+'○'.repeat(u.max-lvl);
      rows+=`<div class="meta-row">`
        +`<div class="meta-info"><span class="meta-icon">${u.icon}</span> <b>${u.name}</b> <span class="meta-pips">${pips}</span><br><span class="meta-desc">${u.desc}</span></div>`
        +`<button class="meta-buy" ${afford?'':'disabled'} onclick="Game.buyMetaUpgrade('${u.id}')">${maxed?'MAKS.':('🔮 '+cost)}</button>`
        +`</div>`;
    }
    document.getElementById('meta-panel').innerHTML=
      `<h2>🔮 Sanktuarium Dusz</h2>`
      +`<div class="meta-essence">Esencja dusz: <b>${ess}</b></div>`
      +`<div class="meta-body">${rows}</div>`
      +`<div class="meta-hint">Esencję zdobywasz kończąc bieg. Ulepszenia są trwałe.</div>`
      +`<div class="panel-btns"><button class="btn-close" onclick="Game.closeMeta()">Zamknij</button></div>`;
  },
});
