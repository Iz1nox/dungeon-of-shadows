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
