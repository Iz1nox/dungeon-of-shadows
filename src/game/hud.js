'use strict';
Object.assign(Game, {
  _buildBuffBarHtml(player){
    let buffHtml='';
    for(const b of player.buffs){
      const icon=b.type==='str'?'💪':b.type==='def'?'🛡️':b.type==='obelisk'?'🗿':'✨';
      const cls=b.type==='str'?'buff-str':b.type==='def'?'buff-def':'buff-shield';
      const title=b.type==='str'?`Siła +${b.value}`:b.type==='def'?`Obrona +${b.value}`:`Eliksir Monolitu +${b.atkValue||0} ATK / +${b.defValue||0} DEF`;
      buffHtml+=`<div class="buff-icon ${cls}" title="${title}">${icon}<span class="buff-timer">${Math.ceil(b.duration)}s</span></div>`;
    }
    if(player.rageTimer>0)buffHtml+=`<div class="buff-icon buff-rage" title="Szał">😡<span class="buff-timer">${Math.ceil(player.rageTimer)}s</span></div>`;
    if(player.stealthTimer>0)buffHtml+=`<div class="buff-icon buff-stealth" title="Ukrycie">👤<span class="buff-timer">${Math.ceil(player.stealthTimer)}s</span></div>`;
    if(player.iFrames>0)buffHtml+=`<div class="buff-icon buff-shield" title="Nietykalność">💫<span class="buff-timer">${player.iFrames.toFixed(1)}s</span></div>`;
    if((this._obeliskWardTimer||0)>0)buffHtml+=`<div class="buff-icon buff-shield" title="Warta Obelisku +4 DEF">🛡️<span class="buff-timer">${Math.ceil(this._obeliskWardTimer)}s</span></div>`;
    if(player.talents){
      if(player.talents.lifeSteal)buffHtml+=`<div class="buff-icon buff-str" title="Kradzież życia ${Math.floor(player.talents.lifeSteal*100)}%">🩸</div>`;
      if(player.talents.manaShield)buffHtml+=`<div class="buff-icon buff-shield" title="Tarcza Many">🔮</div>`;
      if(player.talents.dodge)buffHtml+=`<div class="buff-icon buff-stealth" title="Unik ${Math.floor(player.talents.dodge*100)}%">💨</div>`;
    }
    return buffHtml;
  },

  _buildHudSnapshot(player){
    const totalAtk=player.atk+(player.equipment.weapon?player.equipment.weapon.baseAtk:0);
    const totalDef=player.def+(player.equipment.armor?player.equipment.armor.baseDef:0)+this._getObeliskWardDefenseBonus();
    return{
      name:`${player.className} Lv.${player.level}`,
      hpPct:Math.max(0,Math.min(100,Math.round(player.hp/player.maxHp*100))),
      hpText:`${Math.floor(player.hp)}/${player.maxHp}`,
      mpPct:Math.max(0,Math.min(100,Math.round(player.mp/player.maxMp*100))),
      mpText:`${Math.floor(player.mp)}/${player.maxMp}`,
      xpPct:Math.max(0,Math.min(100,Math.round(player.xp/player.xpToLevel*100))),
      xpText:`${player.xp}/${player.xpToLevel}`,
      atk:`⚔ ATK: ${totalAtk}`,
      def:`🛡 DEF: ${totalDef}`,
      gold:`💰 Złoto: ${player.gold}`,
      floor:`📍 Piętro ${this.floor}/${MAX_FLOOR}`,
      kills:`💀 Zabici: ${this.totalKills}`
    };
  },

  _applyHudSnapshot(ui,prev,next){
    if(!prev||prev.name!==next.name)ui.name.textContent=next.name;
    if(!prev||prev.hpPct!==next.hpPct)ui.hpBar.style.width=`${next.hpPct}%`;
    if(!prev||prev.hpText!==next.hpText)ui.hpText.textContent=next.hpText;
    if(!prev||prev.mpPct!==next.mpPct)ui.mpBar.style.width=`${next.mpPct}%`;
    if(!prev||prev.mpText!==next.mpText)ui.mpText.textContent=next.mpText;
    if(!prev||prev.xpPct!==next.xpPct)ui.xpBar.style.width=`${next.xpPct}%`;
    if(!prev||prev.xpText!==next.xpText)ui.xpText.textContent=next.xpText;
    if(!prev||prev.atk!==next.atk)ui.atk.textContent=next.atk;
    if(!prev||prev.def!==next.def)ui.def.textContent=next.def;
    if(!prev||prev.gold!==next.gold)ui.gold.textContent=next.gold;
    if(!prev||prev.floor!==next.floor)ui.floor.textContent=next.floor;
    if(!prev||prev.kills!==next.kills)ui.kills.textContent=next.kills;
  },

  _updateHudDebugOverlay(ui){
    const debugText=this._buildDebugOverlayText();
    if(debugText!==this._debugOverlayKey&&ui.debugOverlay){
      ui.debugOverlay.textContent=debugText;
      this._debugOverlayKey=debugText;
    }
  },

  _updateHudBuffBar(player,ui){
    const buffHtml=this._buildBuffBarHtml(player);
    if(buffHtml!==this._buffHtmlCache){
      ui.buffBar.innerHTML=buffHtml;
      this._buffHtmlCache=buffHtml;
    }
  },
  
  _updateHUD(){
    this._ensureHudRefs();
    const p=this.player;
    const ui=this._hudEls;
    const next=this._buildHudSnapshot(p);
    const prev=this._hudCache;
    this._applyHudSnapshot(ui,prev,next);
    this._hudCache=next;
    this._updateHudDebugOverlay(ui);
    this._updateHudBuffBar(p,ui);
    
    // update quickslots
    this._updateQuickslots();
  },

  _buildDebugOverlayText(){
    const p=this.player;
    const relicCd=this._eventCooldownRemaining(this._lastRelicFloor);
    const wellCd=this._eventCooldownRemaining(this._lastWellFloor);
    const riftCd=this._eventCooldownRemaining(this._lastRiftFloor);
    const obeliskCd=this._eventCooldownRemaining(this._lastObeliskFloor);
    const traceSummary=this._getFloorEventTraceSummary();
    const floorEventStatus=`FEvent: ${traceSummary?traceSummary.shortStatus:'R-off W-off V-off O-off'}`;
    const lines=[
      `FPS: ${Math.round(this._fpsSmoothed||0)}`,
      `Floor: ${this.floor}/${MAX_FLOOR}`,
      `Enemies: ${this.enemies.length}`,
      `Buffs: ${p.buffs.length}`,
      `Combo: x${p.combo||0} (max ${this._maxCombo||0})`,
      floorEventStatus,
      `Relikty: ${this._mysticEvents||0}`,
      `Studnie: ${this._shadowWellsUsed||0}`,
      `Szczeliny: ${this._abyssRiftsUsed||0}`,
      `Wzmocn. Szcz.: ${this._riftEmpowerments||0}`,
      `Obeliski: ${this._voidObelisksUsed||0}`,
      `Błog. Obelisku: ${this._obeliskBoons||0}`,
      `Echa: ${this._echoVisions||0}`,
      `Tańce: ${this._shadowDances||0}`,
      `Echo Studni: ${this._wellEchoes||0}`,
      `Elity: ${this._eliteKills||0}`,
      `Miraże: ${this._mirageElitesSlain||0}`,
      `Mirror Executors: ${this._mirrorExecutorsSlain||0}`,
      `Mirror Assassins: ${this._mirrorAssassinsSlain||0}`,
      `Mirror Priestesses: ${this._mirrorPriestessesSlain||0}`,
      `Mirror Heralds: ${this._mirrorHeraldsSlain||0}`,
      `Mirror Lancers: ${this._mirrorLancersSlain||0}`,
      `Mirror Weavers: ${this._mirrorWeaversSlain||0}`,
      `Szczelinowe Elity: ${this._riftboundElitesSlain||0}`,
      `Rift Reavers: ${this._riftReaversSlain||0}`,
      `Rift Sowers: ${this._riftSowersSlain||0}`,
      `Obeliskowe Elity: ${this._obeliskboundElitesSlain||0}`,
      `Obelisk Sentinels: ${this._obeliskSentinelsSlain||0}`,
      `Obelisk Augurs: ${this._obeliskAugursSlain||0}`,
      `RiftBurst Cast: ${this._riftBurstsCast||0}`,
      `RiftBurst Hits: ${this._riftBurstHits||0}`,
      `RiftGuard Cast: ${this._riftGuardsCast||0}`,
      `RiftGuard Hits: ${this._riftGuardHits||0}`,
      `RiftBlades Cast: ${this._riftBladesCast||0}`,
      `RiftBlades Hits: ${this._riftBladeHits||0}`,
      `ObeliskLance Cast: ${this._obeliskLancesCast||0}`,
      `ObeliskLance Hits: ${this._obeliskLanceHits||0}`,
      `ObeliskCrash Cast: ${this._obeliskCrashesCast||0}`,
      `ObeliskCrash Hits: ${this._obeliskCrashHits||0}`,
      `ObeliskFan Cast: ${this._obeliskFansCast||0}`,
      `ObeliskFan Hits: ${this._obeliskFanHits||0}`,
      `Earthsplitter Cast: ${this._earthsplittersCast||0}`,
      `Earthsplitter Hits: ${this._earthsplitterHits||0}`,
      `Teleport Cast: ${this._teleportsCast||0}`,
      `Teleport Dist: ${(this._teleportDistance||0).toFixed(1)}`,
      `Stealth Cast: ${this._stealthCasts||0}`,
      `Stealth Time: ${(this._stealthSeconds||0).toFixed(1)}s`,
      `Rage Cast: ${this._rageCasts||0}`,
      `Rage Time: ${(this._rageSeconds||0).toFixed(1)}s`,
      `ShieldAoe Cast: ${this._shieldAoeCasts||0}`,
      `ShieldAoe Hits: ${this._shieldAoeHits||0}`,
      `Fireball Cast: ${this._fireballCasts||0}`,
      `Fireball Hits: ${this._fireballHits||0}`,
      `Chain Cast: ${this._chainCasts||0}`,
      `Chain Hits: ${this._chainHits||0}`,
      `Beam Cast: ${this._beamCasts||0}`,
      `Voidstep Cast: ${this._voidstepCasts||0}`,
      `Voidstep Exec: ${this._voidstepExecutes||0}`,
      `MirrorBlade Proc: ${this._mirrorBladeProcs||0}`,
      `MirrorBlade Kills: ${this._mirrorBladeKills||0}`,
      `MirrorBlade CD: ${(this._mirrorBladeCooldown||0)>0?`${(this._mirrorBladeCooldown||0).toFixed(1)}s`:'ready'}`,
      `MirrorVeil Proc: ${this._mirrorVeilProcs||0}`,
      `MirrorVeil Kills: ${this._mirrorVeilKills||0}`,
      `MirrorVeil CD: ${(this._mirrorVeilCooldown||0)>0?`${(this._mirrorVeilCooldown||0).toFixed(1)}s`:'ready'}`,
      `MirrorEcho Proc: ${this._mirrorEchoProcs||0}`,
      `MirrorEcho Kills: ${this._mirrorEchoKills||0}`,
      `MirrorEcho CD: ${(this._mirrorEchoCooldown||0)>0?`${(this._mirrorEchoCooldown||0).toFixed(1)}s`:'ready'}`,
      `MirrorPotion Use: ${this._mirrorPotionUses||0}`,
      `MirrorPotion Kills: ${this._mirrorPotionKills||0}`,
      `MirrorPotion Up: ${(this._mirrorPotionTimer||0)>0?`${(this._mirrorPotionTimer||0).toFixed(1)}s`:'off'}`,
      `RiftPulse Proc: ${this._riftPulseProcs||0}`,
      `RiftPulse Kills: ${this._riftPulseKills||0}`,
      `RiftPulse CD: ${(this._riftPulseCooldown||0)>0?`${(this._riftPulseCooldown||0).toFixed(1)}s`:'ready'}`,
      `RiftAegis Proc: ${this._riftAegisProcs||0}`,
      `RiftAegis Kills: ${this._riftAegisKills||0}`,
      `RiftAegis CD: ${(this._riftAegisCooldown||0)>0?`${(this._riftAegisCooldown||0).toFixed(1)}s`:'ready'}`,
      `RiftPotion Use: ${this._riftPotionUses||0}`,
      `RiftPotion Kills: ${this._riftPotionKills||0}`,
      `RiftSlash Proc: ${this._riftSlashProcs||0}`,
      `RiftSlash Kills: ${this._riftSlashKills||0}`,
      `RiftSlash CD: ${(this._riftSlashCooldown||0)>0?`${(this._riftSlashCooldown||0).toFixed(1)}s`:'ready'}`,
      `ObeliskEcho Proc: ${this._obeliskEchoProcs||0}`,
      `ObeliskEcho Kills: ${this._obeliskEchoKills||0}`,
      `ObeliskEcho CD: ${(this._obeliskEchoCooldown||0)>0?`${(this._obeliskEchoCooldown||0).toFixed(1)}s`:'ready'}`,
      `ObeliskWard Proc: ${this._obeliskWardProcs||0}`,
      `ObeliskWard Kills: ${this._obeliskWardKills||0}`,
      `ObeliskWard CD: ${(this._obeliskWardCooldown||0)>0?`${(this._obeliskWardCooldown||0).toFixed(1)}s`:'ready'}`,
      `ObeliskWard Up: ${(this._obeliskWardTimer||0)>0?`${(this._obeliskWardTimer||0).toFixed(1)}s`:'off'}`,
      `ObeliskStrike Proc: ${this._obeliskStrikeProcs||0}`,
      `ObeliskStrike Kills: ${this._obeliskStrikeKills||0}`,
      `ObeliskStrike CD: ${(this._obeliskStrikeCooldown||0)>0?`${(this._obeliskStrikeCooldown||0).toFixed(1)}s`:'ready'}`,
      `ObeliskPotion Use: ${this._obeliskPotionUses||0}`,
      `ObeliskPotion Kills: ${this._obeliskPotionKills||0}`,
      `ObeliskPotion Up: ${(this._obeliskPotionTimer||0)>0?`${(this._obeliskPotionTimer||0).toFixed(1)}s`:'off'}`,
      `MirrorDash: ${this._mirrorDashSurvived||0}`,
      `RiftNova: ${this._riftNovaSurvived||0}`,
      `ObeliskStorm: ${this._obeliskStormSurvived||0}`,
      `Przebudzenia: ${this._shadowAwakenings||0}`,
      `Sustain: ${this._wellSustainBlessings||0}`,
      `Sustain Win: ${this._wellSustainVictories||0}`,
      `Beam Hits: ${this._beamImpacts||0}`,
      `Backstab Cast: ${this._backstabCasts||0}`,
      `Backstab Kills: ${this._backstabKills||0}`,
      `Shadowstep Cast: ${this._shadowstepCasts||0}`,
      `Shadowstep Kills: ${this._shadowstepFinishes||0}`,
      `Mirror Boss Kills: ${this._mirrorDashBossKills||0}`,
      `Rift Boss Kills: ${this._riftNovaBossKills||0}`,
      `Obelisk Boss Kills: ${this._obeliskStormBossKills||0}`,
      `Boss Leg Drop: ${this._bossLegendaryDrops||0}`,
      `Potions Used: ${this._potionsUsed||0}`,
      `Flawless Win: ${this._flawlessVictories||0}`,
      `Gold Pickups: ${this._goldPickups||0}`,
      `Hazard Hits: ${this._hazardHitsTaken||0}`,
      `Hits Taken: ${this._hitsTaken||0}`,
      `Ring Equips: ${this._ringEquips||0}`,
      `Weapon Equips: ${this._weaponEquips||0}`,
      `Armor Equips: ${this._armorEquips||0}`,
      `Items Dropped: ${this._itemsDropped||0}`,
      `Shop Buys: ${this._shopPurchases||0}`,
      `Shop Sales: ${this._shopSales||0}`,
      `Loot Pickups: ${this._itemsPickedUp||0}`,
      `Chests: ${this._chestsOpened||0}`,
      `Shrines: ${this._shrineUses||0}`,
      `Stairs Down: ${this._stairsDescended||0}`,
      `LevelUps: ${this._levelUpsGained||0}`,
      `Spells: ${this._spellsCast||0}`,
      `Melee Hits: ${this._meleeHits||0}`,
      `Specials: ${this._specialAttacksUsed||0}`,
      `Dodges: ${this._dodgesPerformed||0}`,
      `Melee Crits: ${this._meleeCrits||0}`,
      `Ranged Hits: ${this._rangedHits||0}`,
      `Enemy Proj Hits: ${this._enemyProjectileHitsTaken||0}`,
      `Tania Studnia: ${this._wellMercyCharges||0}`,
      `CD Relikt: ${relicCd>0?`${relicCd} floor`: 'ready'}`,
      `CD Studnia: ${wellCd>0?`${wellCd} floor`: 'ready'}`,
      `CD Szczelina: ${riftCd>0?`${riftCd} floor`: 'ready'}`,
      `CD Obelisk: ${obeliskCd>0?`${obeliskCd} floor`: 'ready'}`,
      `Run: ${Math.floor(this.gameTime/60)}m ${Math.floor(this.gameTime%60)}s`
    ];
    return lines.join('\n');
  },

  _getMapTileColor(tile,vis,mode='mini'){
    if(mode==='full'){
      switch(tile){
        case TILE.WALL: return vis?'#555':'#333';
        case TILE.FLOOR:
        case TILE.CORRIDOR: return vis?'#776':'#443';
        case TILE.DOOR: return '#986';
        case TILE.STAIRS_DOWN: return '#4af';
        case TILE.WATER: return '#248';
        case TILE.LAVA: return '#a40';
        case TILE.TRAP: return this.player.class==='rogue'?'#a22':'#443';
        case TILE.CHEST: return '#ff0';
        case TILE.SHRINE: return '#4af';
        case TILE.SHOP: return '#f80';
        case TILE.EVENT: return '#6cf';
        case TILE.WELL: return '#b58cff';
        case TILE.RIFT: return '#7a5bff';
        case TILE.OBELISK: return '#6f93ff';
        default: return null;
      }
    }

    switch(tile){
      case TILE.WALL: return '#444';
      case TILE.FLOOR:
      case TILE.CORRIDOR: return vis?'#666':'#333';
      case TILE.DOOR: return '#864';
      case TILE.STAIRS_DOWN: return '#4af';
      case TILE.WATER: return '#248';
      case TILE.LAVA: return '#a40';
      case TILE.CHEST: return '#ff0';
      case TILE.SHRINE: return '#4af';
      case TILE.SHOP: return '#f80';
      case TILE.EVENT: return '#6cf';
      case TILE.WELL: return '#b58cff';
      case TILE.RIFT: return '#7a5bff';
      case TILE.OBELISK: return '#6f93ff';
      default: return '#333';
    }
  },

  _drawMinimapEnemyMarkers(mc,ox,oy,scale,mw,mh){
    for(const e of this.enemies){
      if(e.hp<=0)continue;
      const ex=Math.floor(e.x)-ox,ey=Math.floor(e.y)-oy;
      if(ex<0||ex>=mw/scale||ey<0||ey>=mh/scale)continue;
      if(!this.dungeon.visible[Math.floor(e.y)]?.[Math.floor(e.x)])continue;
      mc.fillStyle=e.isBoss?'#f80':'#f44';
      mc.fillRect(ex*scale,ey*scale,scale+(e.isBoss?2:0),scale+(e.isBoss?2:0));
    }
  },

  _drawMinimapItemMarkers(mc,ox,oy,scale,mw,mh){
    for(const item of this.items){
      const ix=Math.floor(item.x)-ox,iy=Math.floor(item.y)-oy;
      if(ix<0||ix>=mw/scale||iy<0||iy>=mh/scale)continue;
      if(!this.dungeon.visible[Math.floor(item.y)]?.[Math.floor(item.x)])continue;
      mc.fillStyle='#ff0';mc.fillRect(ix*scale,iy*scale,scale,scale);
    }
  },

  _drawMinimapPlayerMarker(mc,mw,mh){
    const ppx=Math.floor(mw/2);const ppy=Math.floor(mh/2);
    mc.fillStyle='#0f0';
    mc.fillRect(ppx-1,ppy-1,4,4);
  },

  _drawMinimapMarkers(mc,ox,oy,scale,mw,mh){
    this._drawMinimapEnemyMarkers(mc,ox,oy,scale,mw,mh);
    this._drawMinimapItemMarkers(mc,ox,oy,scale,mw,mh);
    this._drawMinimapPlayerMarker(mc,mw,mh);
  },

  _drawFullMapItemMarkers(ctx,ox,oy,scale){
    for(const item of this.items){
      const ix=Math.floor(item.x),iy=Math.floor(item.y);
      if(!this.dungeon.explored[iy]?.[ix])continue;
      ctx.fillStyle=item.type==='gold'?'#ff0':'#fa0';
      ctx.fillRect(ox+ix*scale,oy+iy*scale,Math.ceil(scale),Math.ceil(scale));
    }
  },

  _drawFullMapEnemyMarkers(ctx,ox,oy,scale){
    for(const e of this.enemies){
      if(e.hp<=0)continue;
      const ex=Math.floor(e.x),ey=Math.floor(e.y);
      if(!this.dungeon.visible[ey]?.[ex])continue;
      ctx.fillStyle=e.isBoss?'#f80':'#f44';
      const s=e.isBoss?Math.ceil(scale*2):Math.ceil(scale);
      ctx.fillRect(ox+ex*scale,oy+ey*scale,s,s);
    }
  },

  _drawFullMapPlayerMarker(ctx,ox,oy,scale){
    const blink=Math.floor(this.animTime*4)%2===0;
    if(!blink)return;
    const px=Math.floor(this.player.x+.5);
    const py=Math.floor(this.player.y+.5);
    ctx.fillStyle='#0f0';
    ctx.fillRect(ox+px*scale-2,oy+py*scale-2,Math.ceil(scale)+4,Math.ceil(scale)+4);
  },

  _drawFullMapMarkers(ctx,ox,oy,scale){
    this._drawFullMapItemMarkers(ctx,ox,oy,scale);
    this._drawFullMapEnemyMarkers(ctx,ox,oy,scale);
    this._drawFullMapPlayerMarker(ctx,ox,oy,scale);
  },

  _drawFullMapLegendEntry(ctx,x,y,color,label){
    ctx.fillStyle=color;ctx.fillRect(x,y,8,8);
    ctx.fillStyle='#aaa';ctx.fillText(label,x+12,y+8);
  },

  _drawFullMapLegend(ctx,ox,oy,scale){
    const lx=ox,ly=oy+MAP_H*scale+16;
    this._drawFullMapLegendEntry(ctx,lx,ly,'#0f0','Ty');
    this._drawFullMapLegendEntry(ctx,lx+50,ly,'#f44','Wróg');
    this._drawFullMapLegendEntry(ctx,lx+110,ly,'#f80','Boss');
    this._drawFullMapLegendEntry(ctx,lx+170,ly,'#4af','Schody');
    this._drawFullMapLegendEntry(ctx,lx+240,ly,'#ff0','Przedmiot');
    this._drawFullMapLegendEntry(ctx,lx+320,ly,'#f80','Sklep');
    this._drawFullMapLegendEntry(ctx,lx+390,ly,'#6cf','Relikt');
    this._drawFullMapLegendEntry(ctx,lx+470,ly,'#b58cff','Studnia');
    this._drawFullMapLegendEntry(ctx,lx+560,ly,'#7a5bff','Szczelina');
    this._drawFullMapLegendEntry(ctx,lx+660,ly,'#6f93ff','Obelisk');
  },

  _drawFullMapHeaderAndLegend(ctx,W,ox,oy,scale){
    ctx.fillStyle='#4af';
    ctx.font='bold 18px monospace';
    ctx.textAlign='center';
    ctx.fillText(`📍 Piętro ${this.floor}/${MAX_FLOOR} — Naciśnij Tab aby zamknąć`,W/2,oy-12);

    ctx.font='12px monospace';ctx.textAlign='left';
    this._drawFullMapLegend(ctx,ox,oy,scale);
  },

  _getMinimapViewport(mw,mh,scale){
    const p=this.player;
    return{
      ox:Math.floor(p.x+.5)-Math.floor(mw/scale/2),
      oy:Math.floor(p.y+.5)-Math.floor(mh/scale/2)
    };
  },

  _drawMinimapExploredTiles(mc,ox,oy,scale,mw,mh){
    for(let y=0;y<mh/scale;y++){
      for(let x=0;x<mw/scale;x++){
        const mx=ox+x,my=oy+y;
        if(mx<0||mx>=MAP_W||my<0||my>=MAP_H)continue;
        if(!this.dungeon.explored[my][mx])continue;

        const tile=this.dungeon.map[my][mx];
        const vis=this.dungeon.visible[my][mx];
        const color=this._getMapTileColor(tile,vis,'mini');

        mc.fillStyle=color;
        mc.fillRect(x*scale,y*scale,scale,scale);
      }
    }
  },

  _drawMinimapBorder(mc,mw,mh){
    mc.strokeStyle='#555';mc.lineWidth=1;mc.strokeRect(0,0,mw,mh);
  },
  
  _drawMinimap(){
    const mc=this.miniCtx;
    const mw=150,mh=150;
    mc.fillStyle='rgba(0,0,0,0.8)';mc.fillRect(0,0,mw,mh);
    
    const scale=2;
    const {ox,oy}=this._getMinimapViewport(mw,mh,scale);

    this._drawMinimapExploredTiles(mc,ox,oy,scale,mw,mh);
    
    this._drawMinimapMarkers(mc,ox,oy,scale,mw,mh);
    this._drawMinimapBorder(mc,mw,mh);
  },

  _drawFullMapOverlayBackground(ctx,W,H){
    ctx.fillStyle='rgba(0,0,0,0.85)';
    ctx.fillRect(0,0,W,H);
  },

  _getFullMapLayout(W,H){
    const pad=40;
    const scaleX=(W-pad*2)/MAP_W;
    const scaleY=(H-pad*2)/MAP_H;
    const scale=Math.min(scaleX,scaleY);
    const ox=Math.floor((W-MAP_W*scale)/2);
    const oy=Math.floor((H-MAP_H*scale)/2);
    return{ox,oy,scale};
  },

  _drawFullMapExploredTiles(ctx,ox,oy,scale){
    for(let y=0;y<MAP_H;y++){
      for(let x=0;x<MAP_W;x++){
        if(!this.dungeon.explored[y][x])continue;
        const tile=this.dungeon.map[y][x];
        const vis=this.dungeon.visible[y][x];

        const color=this._getMapTileColor(tile,vis,'full');
        if(!color)continue;

        ctx.fillStyle=color;
        ctx.fillRect(ox+x*scale,oy+y*scale,Math.ceil(scale),Math.ceil(scale));
      }
    }
  },

  _drawFullMap(ctx,W,H){
    this._drawFullMapOverlayBackground(ctx,W,H);
    const {ox,oy,scale}=this._getFullMapLayout(W,H);
    this._drawFullMapExploredTiles(ctx,ox,oy,scale);
    
    this._drawFullMapMarkers(ctx,ox,oy,scale);
    this._drawFullMapHeaderAndLegend(ctx,W,ox,oy,scale);
  }
});
