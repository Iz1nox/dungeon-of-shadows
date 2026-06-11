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
