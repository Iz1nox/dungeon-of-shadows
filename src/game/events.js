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
    const screen=document.getElementById('level-up-screen');
    screen.style.display='block';
    document.getElementById('level-up-info').innerHTML=
      `<span style="color:#c8a0ff;font-size:20px">🜂 Mistyczny Relikt</span><br>`+
      `<span style="font-size:11px;color:#888">Posiadasz ${p.relics.length}/${MAX_RELICS} reliktów</span>`;

    const container=document.getElementById('level-up-choices');
    const available=this._getAvailableRelics();
    const pool=Util.shuffle([...available]).slice(0,3);

    const rarityColor={common:'#aaa',rare:'#4af',epic:'#a06fff',legendary:'#f90'};

    const choices=pool.map(relic=>({
      label:`${relic.icon} <span style="color:${rarityColor[relic.rarity]||'#fff'}">${relic.name}</span>`,
      desc:relic.desc,
      action:()=>{
        if(p.relics.length>=MAX_RELICS){
          this.log(`🜂 Masz już ${MAX_RELICS} reliktów — limit osiągnięty`,'info');
          return false;
        }
        relic.apply(p);
        p.relics.push({id:relic.id,name:relic.name,icon:relic.icon,desc:relic.desc,rarity:relic.rarity});
        this.particles.magic(p.x+.5,p.y+.5,'#c8a0ff');
        this.particles.burst(p.x+.5,p.y+.5,18,'#a06fff',2.2,.38,2.6);
        this.log(`🜂 Relikt "${relic.name}" ${relic.icon} — ${relic.desc}`,'spell');
        this._inventoryVersion++;
        Achievements.checkAll(this);
      },
    }));

    choices.push({
      label:'⏭️ Pomiń',
      desc:'Odmów reliktu',
      action:()=>{this.log('🜂 Rezygnujesz z reliktu','info');}
    });

    if(pool.length===0){
      container.innerHTML='<div style="color:#888;padding:12px">Brak dostępnych reliktów dla twojej klasy.</div>';
      setTimeout(()=>{this.paused=false;screen.style.display='none';},1500);
      return;
    }

    this._renderChoiceButtons(container,choices,(choice)=>{
      const result=choice.action();
      if(result===false)return;
      this.paused=false;
      screen.style.display='none';
    });
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
    if(this.floor>=MAX_FLOOR){
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
      this.paused=false;
      Achievements.checkAll(this);
    });
  },

  _handleChestInteraction(tx,ty){
    const p=this.player;
    this.dungeon.map[ty][tx]=TILE.FLOOR;
    this._chestsOpened=(this._chestsOpened||0)+1;
    const loot=ContentRegistry.generateLoot(this.floor,1);
    loot.x=tx;loot.y=ty;
    this.items.push(loot);
    let gold=Util.rand(10,30+this.floor*5);
    if(p.talents&&p.talents.goldFind>0)gold=Math.floor(gold*(1+p.talents.goldFind));
    p.gold+=gold;this.totalGold+=gold;
    this.log(`📦 Skrzynia: ${loot.icon} ${loot.name} + ${gold}💰`,'item');
    this.particles.gold(tx+.5,ty+.5);
    this.sound.pickup();
    Achievements.checkAll(this);
  },

  _renderChoiceButtons(container,choices,onSelect){
    container.innerHTML='';
    for(const c of choices){
      const btn=document.createElement('button');
      btn.className='choice-btn';
      btn.innerHTML=c.label+(c.desc?`<br><span style="font-size:10px;color:#888">${c.desc}</span>`:'');
      btn.onclick=()=>onSelect(c);
      container.appendChild(btn);
    }
  },

  _buildShrineChoices(){
    const p=this.player;
    return[
      {label:'💚 Pełne Leczenie',desc:'Przywróć HP i MP do max',action:()=>{
        p.hp=p.maxHp;p.mp=p.maxMp;
        this.particles.heal(p.x+.5,p.y+.5);
        this.log('✨ Kapliczka przywraca ci siły!','heal');
      }},
      {label:'⚔️ Wzmocnij Broń (+3 ATK)',desc:'Kosztuje 50 złota',action:()=>{
        if(p.gold<50){this.log('Za mało złota!','info');return false;}
        if(!p.equipment.weapon){this.log('Brak broni!','info');return false;}
        p.gold-=50;p.equipment.weapon.baseAtk+=3;
        p.equipment.weapon.name+=' +';
        this.particles.magic(p.x+.5,p.y+.5,'#f80');
        this.log(`⚔ ${p.equipment.weapon.name} wzmocniona! (ATK +3)`,'item');
      }},
      {label:'🛡️ Wzmocnij Zbroję (+2 DEF)',desc:'Kosztuje 50 złota',action:()=>{
        if(p.gold<50){this.log('Za mało złota!','info');return false;}
        if(!p.equipment.armor){this.log('Brak zbroi!','info');return false;}
        p.gold-=50;p.equipment.armor.baseDef+=2;
        p.equipment.armor.name+=' +';
        this.particles.magic(p.x+.5,p.y+.5,'#48f');
        this.log(`🛡 ${p.equipment.armor.name} wzmocniona! (DEF +2)`,'item');
      }},
      {label:'💎 Błogosławieństwo (+5 HP +5 MP)',desc:'Permanentny bonus',action:()=>{
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
    const screen=document.getElementById('level-up-screen');
    screen.style.display='block';
    document.getElementById('level-up-info').innerHTML=
      `<span style="color:#4af;font-size:20px">✨ Kapliczka Mocy</span><br><span style="font-size:12px;color:#888">Wybierz błogosławieństwo</span>`;
    const container=document.getElementById('level-up-choices');
    const choices=this._buildShrineChoices();

    this._renderChoiceButtons(container,choices,(choice)=>{
      const result=choice.action();
      if(result===false)return;
      this.paused=false;screen.style.display='none';
      this.sound.levelUp();
      Achievements.checkAll(this);
    });
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
      default:
        return false;
    }
  },
  
  interact(){
    const p=this.player;
    const tx=Math.floor(p.x+.5),ty=Math.floor(p.y+.5);
    const tile=this.dungeon.map[ty][tx];
    this._handleTileInteraction(tile,tx,ty);
  },
  
  // ---- LEVEL UP ----
});
