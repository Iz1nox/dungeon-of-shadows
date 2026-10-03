'use strict';
Object.assign(Game, {
  _getAvailableRelics(){
    const p=this.player;
    const owned=new Set((p.relics||[]).map(r=>r.id));
    return RELIC_DB.filter(r=>
      !owned.has(r.id)&&
      (r.classes.includes(p.class)||r.classes.length===3)
    );
  },

  _showRelicPick(){
    const p=this.player;
    if(!p.relics)p.relics=[];
    const MAX_RELICS=3;
    this.paused=true;
    const pool=Util.shuffle([...this._getAvailableRelics()]).slice(0,3);
    const title='Mistyczny Relikt';
    const subtitle=`Posiadasz ${p.relics.length}/${MAX_RELICS} reliktów`;

    if(pool.length===0){
      // brak reliktów dla klasy: krótka strona pergaminu i samoczynne zamknięcie
      GrimoireUI.openChoice({title,subtitle,cards:[],onPick:()=>{}});
      const page=document.createElement('div');
      page.className='gr-page';
      page.textContent='Brak dostępnych reliktów dla twojej klasy.';
      document.getElementById('level-up-choices').appendChild(page);
      setTimeout(()=>this._closeChoiceScreen(),1500);
      return;
    }

    // przy limicie karty zostają widoczne, ale niedostępne — dostępne jest tylko Pomiń
    const atLimit=p.relics.length>=MAX_RELICS;
    const cards=pool.map(relic=>({
      icon:relic.icon,name:relic.name,desc:relic.desc,category:'Relikt',rarity:relic.rarity,
      disabledReason:atLimit?`Limit reliktów (${MAX_RELICS}/${MAX_RELICS})`:undefined,
    }));

    GrimoireUI.openChoice({title,subtitle,cards,skip:{label:'Pomiń'},onPick:choice=>{
      if(choice==='skip'){
        this.log('🜂 Rezygnujesz z reliktu','info');
        this._closeChoiceScreen();
        return;
      }
      const relic=pool[choice];
      if(!relic)return;
      relic.apply(p);
      p.relics.push({id:relic.id,name:relic.name,icon:relic.icon,desc:relic.desc,rarity:relic.rarity});
      this.particles.magic(p.x+.5,p.y+.5,'#c8a0ff');
      this.particles.burst(p.x+.5,p.y+.5,18,'#a06fff',2.2,.38,2.6);
      this.log(`🜂 Relikt "${relic.name}" ${relic.icon} — ${relic.desc}`,'spell');
      this._inventoryVersion++;
      Achievements.checkAll(this);
      this._closeChoiceScreen();
    }});
  },

  _useShadowWell(tx,ty){
    const p=this.player;
    this.dungeon.map[ty][tx]=TILE.FLOOR;
    this._shadowWellsUsed=(this._shadowWellsUsed||0)+1;
    let costPct=EVENT_BALANCE.wellCostPct;
    if((this._wellMercyCharges||0)>0){
      costPct*=Math.max(0,1-EVENT_BALANCE.wellMercyCostReductionPct);
      this._wellMercyCharges=Math.max(0,(this._wellMercyCharges||0)-1);
    }
    const cost=Math.max(EVENT_BALANCE.wellCostMin,Math.floor(p.maxHp*costPct));
    p.hp=Math.max(1,p.hp-cost);

    const rewardRoll=Util.rand(1,4);
    if(rewardRoll===1){
      p.mp=Math.min(p.maxMp,p.mp+EVENT_BALANCE.wellManaBase+this.floor*EVENT_BALANCE.wellManaPerFloor);
      p.talents.spellPower=(p.talents.spellPower||0)+EVENT_BALANCE.wellSpellPowerGain;
      this.particles.magic(tx+.5,ty+.5,'#a78bff');
      this.log(`🕳️ Studnia Cieni: -${cost} HP, +${Math.round(EVENT_BALANCE.wellSpellPowerGain*100)}% Mocy Zaklęć, +MP`,'spell');
    }else if(rewardRoll===2){
      p.critChance=Math.min(.9,(p.critChance||0)+EVENT_BALANCE.wellCritGain);
      const goldGain=EVENT_BALANCE.wellGoldBase+this.floor*EVENT_BALANCE.wellGoldPerFloor;
      p.gold+=goldGain;
      this.totalGold+=goldGain;
      this.particles.burst(tx+.5,ty+.5,16,'#b58cff',2.1,.4,2.6);
      this.log(`🕳️ Studnia Cieni: -${cost} HP, +${Math.round(EVENT_BALANCE.wellCritGain*100)}% Krytyka, +${goldGain}💰`,'crit');
    }else if(rewardRoll===3){
      this._wellEchoes=(this._wellEchoes||0)+1;
      p.stealthTimer=Math.max(p.stealthTimer||0,EVENT_BALANCE.wellEchoStealthSec);
      if(!p.talents)p.talents={};
      p.talents.dodge=(p.talents.dodge||0)+EVENT_BALANCE.wellEchoDodgeGain;
      const shadowstep=p.spells&&p.spells.find(s=>s.type==='shadowstep');
      if(shadowstep&&Number.isFinite(shadowstep.cdTimer)){
        shadowstep.cdTimer=Math.max(0,shadowstep.cdTimer-EVENT_BALANCE.wellEchoShadowstepCdReduction);
      }
      this.particles.magic(tx+.5,ty+.5,'#d5b4ff');
      this.particles.burst(p.x+.5,p.y+.5,14,'#d5b4ff',2,.3,2.3);
      this.log(`🕳️ Echo Studni: -${cost} HP, +${Math.round(EVENT_BALANCE.wellEchoDodgeGain*100)}% Uniku, ${EVENT_BALANCE.wellEchoStealthSec}s cienia`,'spell');
    }else{
      this._wellSustainBlessings=(this._wellSustainBlessings||0)+1;
      this._wellSustainTimer=Math.max(this._wellSustainTimer||0,EVENT_BALANCE.wellSustainDuration);
      this._wellMercyCharges=(this._wellMercyCharges||0)+1;
      this.particles.magic(tx+.5,ty+.5,'#c29cff');
      this.particles.heal(p.x+.5,p.y+.5);
      this.log(`🕳️ Łaska Studni: -${cost} HP, regen ${EVENT_BALANCE.wellSustainDuration}s, tańsza kolejna studnia`,'spell');
    }
    this.sound.spell();
    Achievements.checkAll(this);
  },

  _useAbyssRift(tx,ty){
    const p=this.player;
    this.dungeon.map[ty][tx]=TILE.FLOOR;
    this._abyssRiftsUsed=(this._abyssRiftsUsed||0)+1;

    const hpCost=Math.max(EVENT_BALANCE.riftCostMin,Math.floor(p.maxHp*EVENT_BALANCE.riftCostPct));
    p.hp=Math.max(1,p.hp-hpCost);

    const roll=Util.rand(1,3);
    if(roll===1){
      this._riftEmpowerments=(this._riftEmpowerments||0)+1;
      p.atk+=EVENT_BALANCE.riftAtkGain;
      p.critChance=Math.min(.9,(p.critChance||0)+EVENT_BALANCE.riftCritGain);
      this.particles.burst(tx+.5,ty+.5,20,'#8f7bff',2.2,.45,2.8);
      this.log(`🌀 Szczelina: -${hpCost} HP, +${EVENT_BALANCE.riftAtkGain} ATK, +${Math.round(EVENT_BALANCE.riftCritGain*100)}% Krytyka`,'crit');
    }else if(roll===2){
      this._riftEmpowerments=(this._riftEmpowerments||0)+1;
      p.def+=EVENT_BALANCE.riftDefGain;
      p.maxHp+=EVENT_BALANCE.riftMaxHpGain;
      p.hp=Math.min(p.maxHp,p.hp+EVENT_BALANCE.riftMaxHpGain);
      this.particles.magic(tx+.5,ty+.5,'#9d86ff');
      this.particles.heal(p.x+.5,p.y+.5);
      this.log(`🌀 Szczelina: -${hpCost} HP, +${EVENT_BALANCE.riftDefGain} DEF, +${EVENT_BALANCE.riftMaxHpGain} Max HP`,'spell');
    }else{
      let goldGain=EVENT_BALANCE.riftGoldBase+this.floor*EVENT_BALANCE.riftGoldPerFloor;
      if(p.talents&&p.talents.goldFind>0)goldGain=Math.floor(goldGain*(1+p.talents.goldFind));
      p.gold+=goldGain;
      this.totalGold+=goldGain;
      const loot=ContentRegistry.generateLoot(this.floor,1);
      loot.x=tx;loot.y=ty;
      this.items.push(loot);
      this.particles.gold(tx+.5,ty+.5);
      this.log(`🌀 Szczelina: -${hpCost} HP, +${goldGain}💰 i ${loot.icon} ${loot.name}`,'item');
    }

    this.sound.spell();
    Achievements.checkAll(this);
  },

  _useVoidObelisk(tx,ty){
    const p=this.player;
    this.dungeon.map[ty][tx]=TILE.FLOOR;
    this._voidObelisksUsed=(this._voidObelisksUsed||0)+1;

    const hpCost=Math.max(EVENT_BALANCE.obeliskCostMin,Math.floor(p.maxHp*EVENT_BALANCE.obeliskCostPct));
    p.hp=Math.max(1,p.hp-hpCost);

    const roll=Util.rand(1,3);
    if(roll===1){
      this._obeliskBoons=(this._obeliskBoons||0)+1;
      p.critChance=Math.min(.9,(p.critChance||0)+EVENT_BALANCE.obeliskCritGain);
      if(!p.talents)p.talents={};
      p.talents.spellPower=(p.talents.spellPower||0)+EVENT_BALANCE.obeliskSpellPowerGain;
      this.particles.magic(tx+.5,ty+.5,'#7ea6ff');
      this.log(`🗿 Obelisk: -${hpCost} HP, +${Math.round(EVENT_BALANCE.obeliskCritGain*100)}% Krytyka, +${Math.round(EVENT_BALANCE.obeliskSpellPowerGain*100)}% Mocy Zaklęć`,'spell');
    }else if(roll===2){
      this._obeliskBoons=(this._obeliskBoons||0)+1;
      p.def+=EVENT_BALANCE.obeliskDefGain;
      p.maxMp+=EVENT_BALANCE.obeliskMaxMpGain;
      p.mp=Math.min(p.maxMp,p.mp+EVENT_BALANCE.obeliskMaxMpGain);
      this.particles.burst(tx+.5,ty+.5,16,'#6f93ff',2,.35,2.4);
      this.log(`🗿 Obelisk: -${hpCost} HP, +${EVENT_BALANCE.obeliskDefGain} DEF, +${EVENT_BALANCE.obeliskMaxMpGain} Max MP`,'spell');
    }else{
      let goldGain=EVENT_BALANCE.obeliskGoldBase+this.floor*EVENT_BALANCE.obeliskGoldPerFloor;
      if(p.talents&&p.talents.goldFind>0)goldGain=Math.floor(goldGain*(1+p.talents.goldFind));
      p.gold+=goldGain;
      this.totalGold+=goldGain;
      const loot=ContentRegistry.generateLoot(this.floor,1);
      loot.x=tx;loot.y=ty;
      this.items.push(loot);
      this.particles.gold(tx+.5,ty+.5);
      this.log(`🗿 Obelisk: -${hpCost} HP, +${goldGain}💰 i ${loot.icon} ${loot.name}`,'item');
    }

    this.sound.spell();
    Achievements.checkAll(this);
  },

  _handleStairsDownInteraction(){
    if(this._floorTransitionPending)return;
    if(this.floor>=MAX_FLOOR&&!this.endlessMode){
      this.victory();
      return;
    }
    this.floor++;
    this._stairsDescended=(this._stairsDescended||0)+1;
    this.shopStock=null;
    this.paused=true;
    this.showFloorTransition(()=>{
      this.generateFloor();
      this.sound.stairs();
      this.paused=this._hasBlockingOverlay();
      Achievements.checkAll(this);
    });
  },

  _handleChestInteraction(tx,ty){
    const p=this.player;
    this.dungeon.map[ty][tx]=TILE.FLOOR;
    // niektóre skrzynie tylko UDAJĄ skrzynie...
    if(this.floor>=3&&Util.chance(.16)){
      const mimic=this._makeEnemy(EnemyDB.special.mimic,tx,ty);
      mimic.alerted=true;
      mimic.guaranteedLoot=true;
      this._applyFloorAffixToEnemy(mimic);
      this.enemies.push(mimic);
      this.log('😱 To MIMIK! Skrzynia ożyła!','boss');
      this.particles.burst(tx+.5,ty+.5,22,'#c9a85a',2.6,.5,3);
      this.screenFX.shake(7,.3);
      this.sound.boss();
      return;
    }
    this._chestsOpened=(this._chestsOpened||0)+1;
    const lootLuck=1+((this.floorAffix&&this.floorAffix.lootLuck)||0);
    const loot=ContentRegistry.generateLoot(this.floor,lootLuck);
    loot.x=tx;loot.y=ty;
    this.items.push(loot);
    let gold=Util.rand(10,30+this.floor*5);
    if(p.talents&&p.talents.goldFind>0)gold=Math.floor(gold*(1+p.talents.goldFind));
    if(this.floorAffix&&this.floorAffix.goldMult)gold=Math.floor(gold*this.floorAffix.goldMult);
    p.gold+=gold;this.totalGold+=gold;
    this.log(`📦 Skrzynia: ${loot.icon} ${loot.name} + ${gold}💰`,'item');
    this.particles.gold(tx+.5,ty+.5);
    this.sound.pickup();
    Achievements.checkAll(this);
  },

  // arena: fale wrogów wokół kręgu, nagroda po wyczyszczeniu
  _handleArenaInteraction(tx,ty){
    this.dungeon.map[ty][tx]=TILE.FLOOR;
    const types=ContentRegistry.getEnemyTypesForFloor(this.floor);
    const count=Math.min(14,5+Math.floor(this.floor*.8));
    let spawned=0;
    for(let i=0;i<count*4&&spawned<count;i++){
      const a=Math.random()*Math.PI*2;
      const r=2.5+Math.random()*2.5;
      const sx=tx+.5+Math.cos(a)*r,sy=ty+.5+Math.sin(a)*r;
      if(!this.dungeon.isPassable(Math.floor(sx),Math.floor(sy)))continue;
      const e=this._makeEnemy(Util.pick(types),sx,sy);
      e.alerted=true;
      e.arenaSpawn=true;
      EliteAffixes.tryMakeElite(e,this.floor+2);
      this._applyFloorAffixToEnemy(e);
      this.enemies.push(e);
      this.particles.magic(sx+.5,sy+.5,'#ff7a66');
      spawned++;
    }
    this._arenaRemaining=spawned;
    this._arenaRewardX=tx;
    this._arenaRewardY=ty;
    this.log(`⚔️ ARENA! Pokonaj ${spawned} przeciwników, a Otchłań cię wynagrodzi!`,'boss');
    this.screenFX.shake(8,.4);
    this.screenFX.flash('#ff6655',.15);
    this.sound.boss();
  },

  // zamknięte drzwi otwiera klucz znaleziony na piętrze
  _tryOpenLockedDoorNearby(){
    const p=this.player;
    const px=Math.floor(p.x+.5),py=Math.floor(p.y+.5);
    for(const[dx,dy]of[[0,-1],[0,1],[-1,0],[1,0]]){
      const tx=px+dx,ty=py+dy;
      if(this.dungeon.map[ty]?.[tx]!==TILE.LOCKED_DOOR)continue;
      const keyIdx=p.inventory.findIndex(i=>i.type==='key');
      if(keyIdx===-1){
        this.log('🔒 Zamknięte na głucho. Klucz 🗝️ nosi ktoś na tym piętrze...','info');
        this.sound.ui();
        return true;
      }
      p.inventory.splice(keyIdx,1);
      this._markInventoryDirty();
      this.dungeon.map[ty][tx]=TILE.FLOOR;
      this.particles.gold(tx+.5,ty+.5);
      this.particles.magic(tx+.5,ty+.5,'#ffd870');
      this.log('🗝️ Skarbiec otwarty!','item');
      this.sound.door();
      this.screenFX.flash('#ffe9b0',.1);
      FOV.compute(this.dungeon,px,py,FOV_RADIUS);
      return true;
    }
    return false;
  },

  // 2.5: karty kapliczki — niedostępne opcje mają powód zamiast komunikatu w logu po kliknięciu
  _shrineUpgradeReason(item,missingLabel){
    const p=this.player;
    if(!item)return missingLabel;
    if(p.gold<75)return `Brakuje ${75-p.gold} 💰`;
    return undefined;
  },

  _buildShrineChoices(){
    const p=this.player;
    return[
      {icon:'💚',name:'Pełne Leczenie',desc:'Przywraca HP i MP do maksimum',category:'Kapliczka',rarity:'common',action:()=>{
        p.hp=p.maxHp;p.mp=p.maxMp;
        this.particles.heal(p.x+.5,p.y+.5);
        this.log('✨ Kapliczka przywraca ci siły!','heal');
      }},
      {icon:'⚔️',name:'Wzmocnij Broń',desc:'+2 ATK dla założonej broni',category:'Kapliczka',rarity:'rare',cost:'75 💰',
        disabledReason:this._shrineUpgradeReason(p.equipment.weapon,'Brak założonej broni'),action:()=>{
        p.gold-=75;p.equipment.weapon.baseAtk+=2;
        p.equipment.weapon.name+=' +';
        this.particles.magic(p.x+.5,p.y+.5,'#f80');
        this.log(`⚔ ${p.equipment.weapon.name} wzmocniona! (ATK +2)`,'item');
      }},
      {icon:'🛡️',name:'Wzmocnij Zbroję',desc:'+2 DEF dla założonej zbroi',category:'Kapliczka',rarity:'rare',cost:'75 💰',
        disabledReason:this._shrineUpgradeReason(p.equipment.armor,'Brak założonej zbroi'),action:()=>{
        p.gold-=75;p.equipment.armor.baseDef+=2;
        p.equipment.armor.name+=' +';
        this.particles.magic(p.x+.5,p.y+.5,'#48f');
        this.log(`🛡 ${p.equipment.armor.name} wzmocniona! (DEF +2)`,'item');
      }},
      {icon:'💎',name:'Błogosławieństwo',desc:'Na stałe +5 HP i +5 MP',category:'Kapliczka',rarity:'rare',action:()=>{
        p.maxHp+=5;p.hp+=5;p.maxMp+=5;p.mp+=5;
        this.particles.magic(p.x+.5,p.y+.5,'#ff0');
        this.log('💎 Otrzymujesz błogosławieństwo!','spell');
      }},
    ];
  },

  _handleShrineInteraction(tx,ty){
    this.dungeon.map[ty][tx]=TILE.FLOOR;
    this._shrineUses=(this._shrineUses||0)+1;
    this.paused=true;
    const choices=this._buildShrineChoices();
    GrimoireUI.openChoice({title:'Kapliczka Mocy',subtitle:'Wybierz błogosławieństwo',cards:choices,onPick:i=>{
      const choice=choices[i];
      if(!choice)return;
      choice.action();
      this._closeChoiceScreen();
      this.sound.levelUp();
      Achievements.checkAll(this);
    }});
  },

  // wspólne zamknięcie ekranu wyboru (awans / relikt / kapliczka); jeśli w kolejce
  // czeka kolejny awans (np. dwa poziomy z jednego bossa) — pokazujemy go od razu
  _closeChoiceScreen(){
    GrimoireUI.close();
    if((this._pendingLevelUps||0)>0&&this.running){
      this.showLevelUp();
      return;
    }
    this.paused=this._hasBlockingOverlay();
  },

  _handleTileInteraction(tile,tx,ty){
    switch(tile){
      case TILE.STAIRS_DOWN:
        this._handleStairsDownInteraction();
        return true;
      case TILE.CHEST:
        this._handleChestInteraction(tx,ty);
        return true;
      case TILE.SHRINE:
        this._handleShrineInteraction(tx,ty);
        return true;
      case TILE.SHOP:
        this.openShop();
        return true;
      case TILE.EVENT:
        this._triggerMysticRelic(tx,ty);
        return true;
      case TILE.WELL:
        this._useShadowWell(tx,ty);
        return true;
      case TILE.RIFT:
        this._useAbyssRift(tx,ty);
        return true;
      case TILE.OBELISK:
        this._useVoidObelisk(tx,ty);
        return true;
      case TILE.ARENA:
        this._handleArenaInteraction(tx,ty);
        return true;
      default:
        return false;
    }
  },
  
  _revealAdjacentSecretWalls(){
    const p=this.player;
    const px=Math.floor(p.x+.5),py=Math.floor(p.y+.5);
    let revealed=0;
    for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){
      const x=px+dx,y=py+dy;
      if(this.dungeon.map[y]&&this.dungeon.map[y][x]===TILE.SECRET_WALL){
        this.dungeon.map[y][x]=TILE.FLOOR;
        this.dungeon.explored[y][x]=1;this.dungeon.visible[y][x]=1;
        this.particles.burst(x+.5,y+.5,14,'#9a8466',2,.5,3);
        revealed++;
      }
    }
    if(revealed){
      this.log('🧱 Odkryto ukrytą komnatę!','item');
      this.sound.door();
      this.screenFX.shake(2,.15);
      FOV.compute(this.dungeon,px,py,FOV_RADIUS);
    }
    return revealed;
  },

  interact(){
    const p=this.player;
    const tx=Math.floor(p.x+.5),ty=Math.floor(p.y+.5);
    const tile=this.dungeon.map[ty][tx];
    if(this._handleTileInteraction(tile,tx,ty))return;
    if(this._tryOpenLockedDoorNearby())return;
    this._revealAdjacentSecretWalls();
  },
  
  // ---- LEVEL UP ----
});
