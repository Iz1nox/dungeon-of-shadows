'use strict';
Object.assign(Game, {
  _markInventoryDirty(){
    this._inventoryVersion++;
    this._inventoryUIKey='';
    this._shopUIKey='';
    this._quickslotsDirty=true;
  },

  _isStackableItem(item){
    return !!item&&item.type==='potion';
  },

  _getStackKey(item){
    return [
      item.type||'',
      item.subtype||'',
      item.value||0,
      item.duration||0,
      item.rarity||'common',
      item.name||'',
      item.effect||''
    ].join('|');
  },

  _addToInventory(item){
    const p=this.player;
    if(!item)return false;
    const normalized={...item};

    if(this._isStackableItem(normalized)){
      const key=this._getStackKey(normalized);
      const existing=p.inventory.find(i=>this._isStackableItem(i)&&this._getStackKey(i)===key);
      if(existing){
        existing.count=(existing.count||1)+(normalized.count||1);
        this._markInventoryDirty();
        return true;
      }
      if(p.inventory.length>=20)return false;
      normalized.count=Math.max(1,normalized.count||1);
      p.inventory.push(normalized);
      this._markInventoryDirty();
      return true;
    }

    if(p.inventory.length>=20)return false;
    p.inventory.push(normalized);
    this._markInventoryDirty();
    return true;
  },

  _consumeInventoryAt(idx,amount=1){
    const p=this.player;
    if(idx<0||idx>=p.inventory.length)return null;
    const item=p.inventory[idx];
    if(this._isStackableItem(item)&&(item.count||1)>amount){
      item.count-=amount;
      this._markInventoryDirty();
      return item;
    }
    p.inventory.splice(idx,1);
    this._markInventoryDirty();
    return item;
  },

  _normalizeInventory(){
    const p=this.player;
    const merged=[];
    for(const rawItem of p.inventory||[]){
      if(!rawItem)continue;
      const item={...rawItem};
      if(this._isStackableItem(item)){
        const key=this._getStackKey(item);
        const amount=Math.max(1,item.count||1);
        const existing=merged.find(i=>this._isStackableItem(i)&&this._getStackKey(i)===key);
        if(existing)existing.count=(existing.count||1)+amount;
        else{
          item.count=amount;
          merged.push(item);
        }
      }else{
        merged.push(item);
      }
    }
    p.inventory=merged;
    this._markInventoryDirty();
  },

  _getItemUseMeta(item){
    if(!item)return{label:'Użyj',canUse:false,reason:'Brak przedmiotu'};
    const p=this.player;

    if(item.type==='potion'){
      if(item.subtype==='hp'){
        if(p.hp>=p.maxHp)return{label:'Wypij',canUse:false,reason:'HP jest pełne'};
        return{label:'Wypij',canUse:true,reason:''};
      }
      if(item.subtype==='mp'){
        if(p.mp>=p.maxMp)return{label:'Wypij',canUse:false,reason:'MP jest pełne'};
        return{label:'Wypij',canUse:true,reason:''};
      }
      return{label:'Wypij',canUse:true,reason:''};
    }

    if(item.type==='weapon'||item.type==='armor'||item.type==='ring'){
      return{label:'Załóż',canUse:true,reason:''};
    }

    return{label:'Użyj',canUse:true,reason:''};
  },

  _findPickupCandidateIndex(){
    const p=this.player;
    for(let i=this.items.length-1;i>=0;i--){
      const item=this.items[i];
      if(Util.dist(p.x+.5,p.y+.5,item.x+.5,item.y+.5)<1.5)return i;
    }
    return -1;
  },

  _pickupGoldItem(item){
    const p=this.player;
    this._goldPickups=(this._goldPickups||0)+1;
    p.gold+=item.value;this.totalGold+=item.value;
    this.floatingText.add(item.x+.5,item.y,`+${item.value} złota`,'#ff0');
    this.particles.gold(item.x+.5,item.y+.5);
    this.log(`💰 +${item.value} złota`,'item');
    this.sound.pickup();
    Achievements.checkAll(this);
    return true;
  },

  _pickupInventoryItem(item){
    if(!this._addToInventory(item)){
      this.log('Ekwipunek pełny!','info');
      return false;
    }
    this._itemsPickedUp=(this._itemsPickedUp||0)+1;
    this.log(`${item.icon} Podniesiono: ${item.name}`,'item');
    this.sound.pickup();
    Achievements.checkAll(this);
    if(document.getElementById('inventory-panel').classList.contains('open'))this.updateInventoryUI();
    return true;
  },

  pickupItem(){
    const idx=this._findPickupCandidateIndex();
    if(idx===-1)return;
    const item=this.items[idx];
    const picked=item.type==='gold'?this._pickupGoldItem(item):this._pickupInventoryItem(item);
    if(!picked)return;
    this.items.splice(idx,1);
  },
  
  useItem(itemId){
    const p=this.player;
    const idx=p.inventory.findIndex(i=>i.id===itemId);
    if(idx===-1)return;
    const item=p.inventory[idx];
    const meta=this._getItemUseMeta(item);
    if(!meta.canUse){
      if(meta.reason)this.log(meta.reason,'info');
      return;
    }

    if(item.type==='potion')this._usePotionItem(idx,item);
    else if(item.type==='weapon')this._equipWeaponItem(idx,item);
    else if(item.type==='armor')this._equipArmorItem(idx,item);
    else if(item.type==='ring')this._equipRingItem(idx,item);
    
    this.updateInventoryUI();
  },

  _usePotionItem(idx,item){
    const p=this.player;
    this._consumeInventoryAt(idx,1);
    this._potionsUsed=(this._potionsUsed||0)+1;
    if(item.subtype==='hp'){
      const healed=Math.min(item.value,p.maxHp-p.hp);
      p.hp+=healed;
      this.floatingText.add(p.x+.5,p.y,`+${healed} HP`,'#0f0');
      this.particles.heal(p.x+.5,p.y+.5);
      this.log(`🧪 Wypito: ${item.name} (+${healed} HP)`,'heal');
    }else if(item.subtype==='mp'){
      const restored=Math.min(item.value,p.maxMp-p.mp);
      p.mp+=restored;
      this.floatingText.add(p.x+.5,p.y,`+${restored} MP`,'#88f');
      this.log(`💧 Wypito: ${item.name} (+${restored} MP)`,'heal');
    }else if(item.subtype==='str'){
      p.atk+=item.value;
      p.buffs.push({type:'str',value:item.value,duration:item.duration});
      this.log(`💪 Siła +${item.value} na ${item.duration}s`,'spell');
    }else if(item.subtype==='def'){
      p.def+=item.value;
      p.buffs.push({type:'def',value:item.value,duration:item.duration});
      this.log(`🛡 Obrona +${item.value} na ${item.duration}s`,'spell');
    }else if(item.subtype==='rift'){
      const restored=Math.min(item.value,p.maxMp-p.mp);
      p.mp+=restored;
      const radius=item.radius||3.4;
      const pulseDamage=Math.max(1,Math.floor((item.damage||0)+this.floor*.9+p.atk*.22));
      let hits=0;
      let kills=0;
      for(const enemy of this.enemies){
        if(enemy.hp<=0)continue;
        if(Util.dist(p.x,p.y,enemy.x,enemy.y)>radius)continue;
        const hpBefore=enemy.hp;
        this.damageEnemy(enemy,pulseDamage,'arcane');
        hits++;
        if(hpBefore>0&&enemy.hp<=0)kills++;
      }
      this._riftPotionUses=(this._riftPotionUses||0)+1;
      if(kills>0)this._riftPotionKills=(this._riftPotionKills||0)+kills;
      this.floatingText.add(p.x+.5,p.y,`+${restored} MP`,'#b794ff');
      this.particles.burst(p.x+.5,p.y+.5,18,'#b794ff',2.6,.33,2.9);
      this.screenFX.flash('#cbb0ff',.08);
      this.log(`🜔 Eliksir Szczeliny: +${restored} MP, ${hits} trafień${kills>0?`, ${kills} eliminacji`:''}`,'spell');
    }else if(item.subtype==='obelisk'){
      for(let i=p.buffs.length-1;i>=0;i--){
        if(p.buffs[i].type!=='obelisk')continue;
        p.atk-=p.buffs[i].atkValue||0;
        p.def-=p.buffs[i].defValue||0;
        p.buffs.splice(i,1);
      }
      const healed=Math.min(item.value,p.maxHp-p.hp);
      const restored=Math.min(item.mpValue||0,p.maxMp-p.mp);
      p.hp+=healed;
      p.mp+=restored;
      p.atk+=item.atkValue||0;
      p.def+=item.defValue||0;
      p.buffs.push({type:'obelisk',atkValue:item.atkValue||0,defValue:item.defValue||0,duration:item.duration});
      this._obeliskPotionTimer=item.duration;
      this._obeliskPotionUses=(this._obeliskPotionUses||0)+1;
      this.floatingText.add(p.x+.5,p.y,`+${healed} HP / +${restored} MP`,'#7fb4ff');
      this.particles.heal(p.x+.5,p.y+.5);
      this.particles.burst(p.x+.5,p.y+.5,12,'#6f93ff',2.2,.24,2.3);
      this.log(`🗿 Eliksir Monolitu: +${healed} HP, +${restored} MP, +${item.atkValue||0} ATK, +${item.defValue||0} DEF na ${item.duration}s`,'spell');
    }else if(item.subtype==='mirage'){
      for(let i=p.buffs.length-1;i>=0;i--){
        if(p.buffs[i].type!=='mirage')continue;
        p.critChance-=p.buffs[i].critValue||0;
        if(!p.talents)p.talents={};
        p.talents.dodge=(p.talents.dodge||0)-(p.buffs[i].dodgeValue||0);
        p.buffs.splice(i,1);
      }
      const healed=Math.min(item.value,p.maxHp-p.hp);
      const restored=Math.min(item.mpValue||0,p.maxMp-p.mp);
      p.hp+=healed;
      p.mp+=restored;
      p.critChance+=item.critValue||0;
      if(!p.talents)p.talents={};
      p.talents.dodge=(p.talents.dodge||0)+(item.dodgeValue||0);
      p.buffs.push({type:'mirage',critValue:item.critValue||0,dodgeValue:item.dodgeValue||0,duration:item.duration});
      this._mirrorPotionTimer=item.duration;
      this._mirrorPotionUses=(this._mirrorPotionUses||0)+1;
      this.floatingText.add(p.x+.5,p.y,`+${healed} HP / +${restored} MP`,'#d8e2ff');
      this.particles.heal(p.x+.5,p.y+.5);
      this.particles.burst(p.x+.5,p.y+.5,14,'#d8e2ff',2.4,.28,2.6);
      this.screenFX.flash('#eef3ff',.08);
      this.log(`🪞 Eliksir Mirażu: +${healed} HP, +${restored} MP, +${Math.round((item.critValue||0)*100)}% KRYT, +${Math.round((item.dodgeValue||0)*100)}% UNIK na ${item.duration}s`,'spell');
    }
    Achievements.checkAll(this);
    this.sound.pickup();
  },

  _swapEquipmentFromInventory(idx,slot,item){
    const p=this.player;
    const oldItem=p.equipment[slot];
    p.inventory.splice(idx,1);
    this._markInventoryDirty();
    p.equipment[slot]=item;
    if(oldItem)this._addToInventory(oldItem);
    return oldItem;
  },

  _equipWeaponItem(idx,item){
    this._swapEquipmentFromInventory(idx,'weapon',item);
    this._weaponEquips=(this._weaponEquips||0)+1;
    this.log(`⚔ Założono: ${item.name} (ATK +${item.baseAtk})`,'item');
    Achievements.checkAll(this);
  },

  _equipArmorItem(idx,item){
    this._swapEquipmentFromInventory(idx,'armor',item);
    this._armorEquips=(this._armorEquips||0)+1;
    this.log(`🛡 Założono: ${item.name} (DEF +${item.baseDef})`,'item');
    Achievements.checkAll(this);
  },

  _applyRingBonuses(ring,sign=1){
    if(!ring)return;
    const p=this.player;
    if(ring.atkBonus)p.atk+=ring.atkBonus*sign;
    if(ring.defBonus)p.def+=ring.defBonus*sign;
    if(ring.critBonus)p.critChance=Math.min(.9,Math.max(0,(p.critChance||0)+ring.critBonus*sign));
    if(ring.dodgeBonus){
      if(!p.talents)p.talents={};
      p.talents.dodge=Math.max(0,(p.talents.dodge||0)+ring.dodgeBonus*sign);
    }
    if(ring.hpBonus){
      p.maxHp+=ring.hpBonus*sign;
      if(sign>0)p.hp+=ring.hpBonus;
      else p.hp=Math.min(p.hp,p.maxHp);
    }
    if(ring.mpBonus){
      p.maxMp+=ring.mpBonus*sign;
      if(sign>0)p.mp+=ring.mpBonus;
      else p.mp=Math.min(p.mp,p.maxMp);
    }
  },

  _equipRingItem(idx,item){
    const p=this.player;
    const oldRing=p.equipment.ring;
    this._applyRingBonuses(oldRing,-1);
    this._swapEquipmentFromInventory(idx,'ring',item);
    this._applyRingBonuses(item,1);
    this._ringEquips=(this._ringEquips||0)+1;
    this.log(`💍 Założono: ${item.name}`,'item');
    Achievements.checkAll(this);
  },

  _triggerMysticRelic(tx,ty){
    const p=this.player;
    this.dungeon.map[ty][tx]=TILE.FLOOR;
    this._mysticEvents=(this._mysticEvents||0)+1;
    this.sound.spell();
    this.particles.magic(tx+.5,ty+.5,'#c8a0ff');
    this._showRelicPick();
  },

});
