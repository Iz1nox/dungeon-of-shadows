'use strict';
Object.assign(Game, {
  _buildAchievementToastHtml(ach){
    return `<div class="ach-title">🏆 ${ach.icon} ${ach.name}</div><div class="ach-desc">${ach.desc}</div><div class="ach-reward">Nagroda: ${ach.reward}</div>`;
  },

  _queueAchievementToastHide(toast){
    clearTimeout(this._achTimer);
    this._achTimer=setTimeout(()=>{toast.style.opacity='0';setTimeout(()=>{toast.style.display='none';},500);},4000);
  },

  _renderAchievementToastContent(toast,ach){
    toast.innerHTML=this._buildAchievementToastHtml(ach);
    toast.style.display='block';
    toast.style.opacity='1';
  },
  
  // ---- ACHIEVEMENT TOAST ----
  _showAchievement(ach){
    const toast=document.getElementById('achievement-toast');
    this._renderAchievementToastContent(toast,ach);
    this._queueAchievementToastHide(toast);
  },
  
  // ---- POTION QUICKSLOTS ----
  quickUsePotion(subtype){
    const p=this.player;
    const idx=p.inventory.findIndex(i=>i.type==='potion'&&i.subtype===subtype);
    if(idx===-1){this.log(subtype==='hp'?'Brak mikstur HP!':'Brak mikstur MP!','info');return;}
    const item=p.inventory[idx];
    const meta=this._getItemUseMeta(item);
    if(!meta.canUse){
      this.log(meta.reason||'Nie można użyć tego przedmiotu','info');
      return;
    }
    this.useItem(item.id);
  },

  _computeQuickslotPotionCounts(){
    let hpCount=0,mpCount=0;
    for(const item of this.player.inventory){
      if(item.type!=='potion')continue;
      const amount=item.count||1;
      if(item.subtype==='hp')hpCount+=amount;
      else if(item.subtype==='mp')mpCount+=amount;
    }
    return{hp:hpCount,mp:mpCount};
  },

  _buildQuickslotsCacheKey(hpCount,mpCount,hpKey,mpKey){
    return `${hpCount}|${mpCount}|${hpKey}|${mpKey}`;
  },

  _buildQuickslotsHtml(hpCount,mpCount,hpKey,mpKey){
    return `<div class="qs" onclick="Game.quickUsePotion('hp')" title="Mikstura HP (${hpKey})"><span class="qs-key">${hpKey}</span>❤️<span class="qs-count">${hpCount}</span></div>`+
      `<div class="qs" onclick="Game.quickUsePotion('mp')" title="Mikstura MP (${mpKey})"><span class="qs-key">${mpKey}</span>💙<span class="qs-count">${mpCount}</span></div>`;
  },

  _shouldSkipQuickslotsRender(force,cacheKey){
    return !force&&cacheKey===this._quickslotsCacheKey;
  },
  
  _updateQuickslots(force=false){
    this._ensureHudRefs();
    const qs=this._hudEls.quickslots;
    const hpKey=getKeyDisplay(KeyBindings.potionHp);
    const mpKey=getKeyDisplay(KeyBindings.potionMp);
    if(this._quickslotsDirty){
      this._quickslotCounts=this._computeQuickslotPotionCounts();
      this._quickslotsDirty=false;
    }
    const hpCount=this._quickslotCounts.hp;
    const mpCount=this._quickslotCounts.mp;
    const cacheKey=this._buildQuickslotsCacheKey(hpCount,mpCount,hpKey,mpKey);
    if(this._shouldSkipQuickslotsRender(force,cacheKey))return;
    this._quickslotsCacheKey=cacheKey;
    qs.innerHTML=this._buildQuickslotsHtml(hpCount,mpCount,hpKey,mpKey);
  },
  
  _updateComboDisplay(){
    const cd=document.getElementById('combo-display');
    const p=this.player;
    if(p.combo>=2){
      const mult=p.combo>=10?3:p.combo>=7?2.5:p.combo>=5?2:p.combo>=3?1.5:1;
      cd.innerHTML=`⚡ COMBO x${p.combo}<br><span class="combo-mult">${mult>1?mult+'x DMG':''}</span>`;
      cd.classList.add('active');
      cd.style.fontSize=Math.min(28+p.combo*2,50)+'px';
    }else{
      cd.classList.remove('active');
    }
  },
  
  loadFromTitle(){
    if(!this._findFirstSaveSlot()){
      alert('Brak zapisanych gier!');
      return;
    }
    // show settings panel with save slots
    document.getElementById('title-screen').style.display='none';

    this._ensureRuntimeCanvasReady();

    this._loadFirstAvailableSave();
  },

  _findFirstSaveSlot(){
    for(let i=1;i<=SAVE_SLOTS;i++){
      if(localStorage.getItem('dos_save_'+i))return i;
    }
    return 0;
  },

  _loadFirstAvailableSave(){
    const firstSlot=this._findFirstSaveSlot();
    if(!firstSlot)return false;
    this.loadGame(firstSlot);
    return true;
  },

  _buildRunSummaryLine(){
    return `${this.player.className} — Poziom ${this.player.level}<br>Piętro: ${this.floor} | Zabici: ${this.totalKills} | Złoto: ${this.totalGold}<br>Czas: ${Math.floor(this.gameTime/60)}m ${Math.floor(this.gameTime%60)}s`;
  },

  _showEndScreen(screenId,statsId,statsHtml){
    const screen=document.getElementById(screenId);
    screen.style.display='flex';
    document.getElementById(statsId).innerHTML=statsHtml;
  },

  // ---- GAME OVER ----
  gameOver(){
    this.running=false;
    this.sound.death();
    this._showEndScreen('death-screen','death-stats',this._buildRunSummaryLine());
  },
  
  victory(){
    if((this._wellSustainTimer||0)>0){
      this._wellSustainVictories=(this._wellSustainVictories||0)+1;
    }
    if((this._potionsUsed||0)===0)this._flawlessVictories=(this._flawlessVictories||0)+1;
    Achievements.checkAll(this);
    this.running=false;
    this._showEndScreen('win-screen','win-stats',`${this._buildRunSummaryLine()}<br>Pokonałeś wszystkie ${MAX_FLOOR} pięter lochu!`);
  },
  
  // ---- SHOP UI ----
});
