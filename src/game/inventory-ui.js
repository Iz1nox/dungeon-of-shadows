'use strict';
Object.assign(Game, {
  toggleInventory(){
    const panel=document.getElementById('inventory-panel');
    this.sound.ui();
    panel.classList.toggle('open');
    if(panel.classList.contains('open'))this.updateInventoryUI();
    else this.hideItemTooltip();
  },

  _buildInventoryUIKey(){
    const p=this.player;
    const eq=p.equipment;
    const w=eq.weapon?`${eq.weapon.id||''}:${eq.weapon.baseAtk||0}:${eq.weapon.name||''}`:'-';
    const a=eq.armor?`${eq.armor.id||''}:${eq.armor.baseDef||0}:${eq.armor.name||''}`:'-';
    const r=eq.ring?`${eq.ring.id||''}:${eq.ring.name||''}`:'-';
    const rel=(p.relics||[]).map(r=>r.id).join(',');
    return `${this._inventoryVersion}|${Math.floor(p.hp)}|${p.maxHp}|${Math.floor(p.mp)}|${p.maxMp}|${w}|${a}|${r}|${rel}`;
  },

  _buildShopUIKey(){
    const p=this.player;
    const invKey=p.inventory.map(i=>`${i.id}:${i.count||1}`).join(';');
    const stockKey=(this.shopStock||[]).map(i=>`${i.id}:${i.price||0}`).join(';');
    return `${p.gold}|${this._inventoryVersion}|${stockKey}|${invKey}`;
  },

  _buildInventoryEquipmentHtml(eq){
    let html='<div class="inv-eq">';
    html+=`<div style="color:#94a5d1;font-size:10px;letter-spacing:1px;text-transform:uppercase;margin-bottom:4px">Założone</div>`;
    html+=`<div class="eq-row"><div class="eq-info">⚔ Broń: ${eq.weapon?`<span class="rarity-${eq.weapon.rarity}">${eq.weapon.name} (+${eq.weapon.baseAtk} ATK)</span>`:'<span class="eq-empty">brak</span>'}</div>${eq.weapon?`<button class="unequip-btn" onclick="Game.unequipItem('weapon')">Zdejmij</button>`:''}</div>`;
    html+=`<div class="eq-row"><div class="eq-info">🛡 Zbroja: ${eq.armor?`<span class="rarity-${eq.armor.rarity}">${eq.armor.name} (+${eq.armor.baseDef} DEF)</span>`:'<span class="eq-empty">brak</span>'}</div>${eq.armor?`<button class="unequip-btn" onclick="Game.unequipItem('armor')">Zdejmij</button>`:''}</div>`;
    html+=`<div class="eq-row"><div class="eq-info">💍 Pierścień: ${eq.ring?`<span class="rarity-${eq.ring.rarity}">${eq.ring.name}</span>`:'<span class="eq-empty">brak</span>'}</div>${eq.ring?`<button class="unequip-btn" onclick="Game.unequipItem('ring')">Zdejmij</button>`:''}</div>`;
    html+='</div>';
    html+=this._buildRelicsHtml();
    return html;
  },

  _buildRelicsHtml(){
    const relics=this.player.relics||[];
    const rarityColor={common:'#aaa',rare:'#4af',epic:'#a06fff',legendary:'#f90'};
    let html=`<div style="margin-top:10px;border-top:1px solid #2a2a3a;padding-top:8px">`;
    html+=`<div style="color:#94a5d1;font-size:10px;letter-spacing:1px;text-transform:uppercase;margin-bottom:6px">Reliktów: ${relics.length}/3</div>`;
    if(relics.length===0){
      html+=`<div style="color:#555;font-size:11px">Brak reliktów — znajdź 🜂 na mapie</div>`;
    }else{
      for(const r of relics){
        const col=rarityColor[r.rarity]||'#fff';
        html+=`<div style="display:flex;align-items:flex-start;gap:6px;margin-bottom:6px">`;
        html+=`<span style="font-size:16px;line-height:1">${r.icon}</span>`;
        html+=`<div><div style="color:${col};font-size:12px;font-weight:bold">${r.name}</div>`;
        html+=`<div style="color:#888;font-size:10px">${r.desc}</div></div>`;
        html+=`</div>`;
      }
    }
    html+=`</div>`;
    return html;
  },

  _groupAndSortInventoryItems(inventory){
    const groups={potion:[],weapon:[],armor:[],ring:[],other:[]};
    const rarityRank={common:0,uncommon:1,rare:2,epic:3,legendary:4};
    for(const item of inventory){
      if(groups[item.type])groups[item.type].push(item);
      else groups.other.push(item);
    }
    const score=item=>(item.baseAtk||0)*3+(item.baseDef||0)*3+(item.atkBonus||0)*2+(item.defBonus||0)*2+(item.hpBonus||0)+(item.mpBonus||0)+(item.critBonus||0)*100+(item.dodgeBonus||0)*90+(item.value||0);
    const sortItems=(a,b)=>{
      const rr=(rarityRank[b.rarity]||0)-(rarityRank[a.rarity]||0);
      if(rr!==0)return rr;
      const ss=score(b)-score(a);
      if(ss!==0)return ss;
      return (a.name||'').localeCompare(b.name||'pl');
    };
    for(const key of Object.keys(groups))groups[key].sort(sortItems);
    return groups;
  },

  _getInventoryItemDesc(item){
    let desc='';
    if(item.baseAtk)desc=`ATK +${item.baseAtk}`;
    if(item.baseDef)desc=`DEF +${item.baseDef}`;
    if(item.value&&item.type==='potion'){
      if(item.subtype==='hp')desc=`Leczy +${item.value} HP`;
      else if(item.subtype==='mp')desc=`Przywraca +${item.value} MP`;
      else if(item.subtype==='str')desc=`ATK +${item.value} (${item.duration}s)`;
      else if(item.subtype==='def')desc=`DEF +${item.value} (${item.duration}s)`;
      else if(item.subtype==='rift')desc=`MP+${item.value} + puls ${item.damage} DMG (${item.radius})`;
      else if(item.subtype==='obelisk')desc=`HP+${item.value} MP+${item.mpValue||0} ATK+${item.atkValue||0} DEF+${item.defValue||0} (${item.duration}s)`;
      else desc=`+${item.value}`;
    }
    if(item.atkBonus)desc+=`ATK +${item.atkBonus} `;
    if(item.defBonus)desc+=`DEF +${item.defBonus} `;
    if(item.critBonus)desc+=`KRYT +${Math.round(item.critBonus*100)}% `;
    if(item.dodgeBonus)desc+=`UNIK +${Math.round(item.dodgeBonus*100)}% `;
    return desc;
  },

  _buildInventoryItemRowHtml(item){
    const rclass='rarity-'+(item.rarity||'common');
    const desc=this._getInventoryItemDesc(item);
    const countLabel=(item.count&&item.count>1)?` <span style="color:#ff0">x${item.count}</span>`:'';
    const action=this._getItemUseMeta(item);
    const actionTitle=action.canUse?'':` title="${action.reason}"`;
    const actionDisabled=action.canUse?'':' disabled style="opacity:.45;cursor:not-allowed"';
    const rarityDot=`<span class="rarity-dot rarity-${item.rarity||'common'}"></span>`;
    return `<div class="inv-item ${rclass}" onmouseenter="Game.showItemTooltip(event,'${item.id}')" onmouseleave="Game.hideItemTooltip()"><span class="${rclass}">${rarityDot}${item.icon} ${item.name}${countLabel} <span style="color:#8a93aa;font-size:10px">(${desc})</span></span><span><button class="use-btn" onclick="Game.useItem('${item.id}')"${actionTitle}${actionDisabled}>${action.label}</button><button class="drop-btn" onclick="Game.dropItem('${item.id}')">Wyrzuć</button></span></div>`;
  },

  _buildInventorySectionsHtml(groups){
    const ordered=[
      ['potion','🧪 MIKSTURY'],
      ['weapon','⚔ BROŃ'],
      ['armor','🛡 ZBROJE'],
      ['ring','💍 PIERŚCIENIE'],
      ['other','📦 INNE']
    ];
    let html='';
    for(const [key,label] of ordered){
      const items=groups[key];
      if(!items||items.length===0)continue;
      html+=`<div class="inv-section-label">${label}</div>`;
      for(const item of items)html+=this._buildInventoryItemRowHtml(item);
    }
    return html;
  },

  _buildInventoryHeaderHtml(){
    const p=this.player;
    return `<div class="inv-head"><div style="font-size:14px;color:#8fc3ff;font-weight:bold;letter-spacing:.5px">📦 EKWIPUNEK <span style="font-size:11px;color:#8a98bb;font-weight:normal">(${p.inventory.length}/20 slotów)</span></div></div><div class="inv-body">`;
  },

  _buildInventoryContentHtml(){
    const p=this.player;
    let html=this._buildInventoryEquipmentHtml(p.equipment);
    if(p.inventory.length===0){
      html+='<div style="color:#666">Plecak pusty</div>';
      return html;
    }
    const groups=this._groupAndSortInventoryItems(p.inventory);
    html+=this._buildInventorySectionsHtml(groups);
    return html;
  },
  
  updateInventoryUI(){
    const panel=document.getElementById('inventory-panel');
    if(!panel.classList.contains('open')){this.hideItemTooltip();return;}
    const uiKey=this._buildInventoryUIKey();
    if(uiKey===this._inventoryUIKey)return;
    this.hideItemTooltip();
    let html=this._buildInventoryHeaderHtml();
    html+=this._buildInventoryContentHtml();
    panel.innerHTML=html+'</div>';
    this._inventoryUIKey=uiKey;
  },

  _buildTooltipCoreStatsHtml(item){
    let html='';
    if(item.count&&item.count>1)html+=`<div class="tt-stat">📦 Ilość: ${item.count}</div>`;
    if(item.baseAtk)html+=`<div class="tt-stat">⚔ Atak: +${item.baseAtk}</div>`;
    if(item.baseDef)html+=`<div class="tt-stat">🛡 Obrona: +${item.baseDef}</div>`;
    if(item.atkBonus)html+=`<div class="tt-stat">⚔ Atak: +${item.atkBonus}</div>`;
    if(item.defBonus)html+=`<div class="tt-stat">🛡 Obrona: +${item.defBonus}</div>`;
    if(item.critBonus)html+=`<div class="tt-stat">🎯 Krytyk: +${Math.round(item.critBonus*100)}%</div>`;
    if(item.dodgeBonus)html+=`<div class="tt-stat">💨 Unik: +${Math.round(item.dodgeBonus*100)}%</div>`;
    if(item.hpBonus)html+=`<div class="tt-stat">❤ HP: +${item.hpBonus}</div>`;
    if(item.mpBonus)html+=`<div class="tt-stat">💙 MP: +${item.mpBonus}</div>`;
    return html;
  },

  _buildTooltipEffectStatsHtml(item){
    let html='';
    if(item.effect)html+=`<div class="tt-stat">✨ Efekt: ${item.effect}</div>`;
    return html;
  },

  _buildTooltipPotionStatsHtml(item){
    let html='';
    if(item.subtype==='hp')html+=`<div class="tt-stat">❤ Leczy: ${item.value} HP</div>`;
    if(item.subtype==='mp')html+=`<div class="tt-stat">💙 Przywraca: ${item.value} MP</div>`;
    if(item.subtype==='str')html+=`<div class="tt-stat">💪 ATK +${item.value} na ${item.duration}s</div>`;
    if(item.subtype==='def')html+=`<div class="tt-stat">🛡 DEF +${item.value} na ${item.duration}s</div>`;
    if(item.subtype==='rift')html+=`<div class="tt-stat">🜔 Przywraca: ${item.value} MP</div><div class="tt-stat">✨ Puls: ${item.damage} DMG w promieniu ${item.radius}</div>`;
    if(item.subtype==='obelisk')html+=`<div class="tt-stat">🗿 Leczy: ${item.value} HP i ${item.mpValue||0} MP</div><div class="tt-stat">⚔/🛡 +${item.atkValue||0}/+${item.defValue||0} na ${item.duration}s</div>`;
    return html;
  },

  _buildTooltipBaseStatsHtml(item){
    let html='';
    html+=this._buildTooltipCoreStatsHtml(item);
    html+=this._buildTooltipEffectStatsHtml(item);
    html+=this._buildTooltipPotionStatsHtml(item);
    return html;
  },

  _buildTooltipComparisonHtml(item,equipment){
    let html='';
    if(item.type==='weapon'&&equipment.weapon){
      const eq=equipment.weapon;
      const diff=item.baseAtk-eq.baseAtk;
      if(diff>0)html+=`<div class="tt-compare-better">▲ +${diff} ATK vs ${eq.name}</div>`;
      else if(diff<0)html+=`<div class="tt-compare-worse">▼ ${diff} ATK vs ${eq.name}</div>`;
      else html+=`<div class="tt-stat">= Taki sam ATK jak ${eq.name}</div>`;
    }
    if(item.type==='armor'&&equipment.armor){
      const eq=equipment.armor;
      const diff=item.baseDef-eq.baseDef;
      if(diff>0)html+=`<div class="tt-compare-better">▲ +${diff} DEF vs ${eq.name}</div>`;
      else if(diff<0)html+=`<div class="tt-compare-worse">▼ ${diff} DEF vs ${eq.name}</div>`;
      else html+=`<div class="tt-stat">= Taka sama DEF jak ${eq.name}</div>`;
    }
    return html;
  },

  _buildTooltipSellHintHtml(item){
    const sellPrice=ShopDB.getSellPrice(item);
    const stackCount=item.count||1;
    const totalSell=sellPrice*stackCount;
    return `<div class="tt-sell">💰 Wartość sprzedaży: ${sellPrice} złota${stackCount>1?` / szt. (razem ${totalSell})`:''}</div>`;
  },

  _buildItemTooltipHtml(item,equipment){
    let html=`<div class="tt-name rarity-${item.rarity}">${item.icon} ${item.name}</div>`;
    html+=`<div class="tt-rarity rarity-${item.rarity}">${item.rarity.toUpperCase()}</div>`;
    html+=this._buildTooltipBaseStatsHtml(item);
    html+=this._buildTooltipComparisonHtml(item,equipment);
    html+=this._buildTooltipSellHintHtml(item);
    return html;
  },

  _getItemTooltipEl(){
    return document.getElementById('item-tooltip');
  },

  _getTooltipPosition(clientX,clientY){
    return{
      left:Math.min(clientX+12,window.innerWidth-290),
      top:Math.min(clientY-10,window.innerHeight-200)
    };
  },
  
  showItemTooltip(event,itemId){
    const p=this.player;
    const item=p.inventory.find(i=>i.id===itemId);
    if(!item)return;
    const tt=this._getItemTooltipEl();
    const pos=this._getTooltipPosition(event.clientX,event.clientY);
    tt.innerHTML=this._buildItemTooltipHtml(item,p.equipment);
    tt.style.display='block';
    tt.style.left=pos.left+'px';
    tt.style.top=pos.top+'px';
  },
  
  hideItemTooltip(){
    this._getItemTooltipEl().style.display='none';
  },

  _createDroppedItem(item){
    const p=this.player;
    return{...item,x:Math.floor(p.x+.5),y:Math.floor(p.y+.5)};
  },

  _consumeInventoryForDrop(idx,item){
    const p=this.player;
    const dropped=this._createDroppedItem(item);
    if(this._isStackableItem(item)&&(item.count||1)>1){
      item.count--;
      dropped.count=1;
      this._markInventoryDirty();
      return dropped;
    }
    p.inventory.splice(idx,1);
    this._markInventoryDirty();
    return dropped;
  },
  
  dropItem(itemId){
    const p=this.player;
    const idx=p.inventory.findIndex(i=>i.id===itemId);
    if(idx===-1)return;
    const item=p.inventory[idx];
    const dropped=this._consumeInventoryForDrop(idx,item);
    this.items.push(dropped);
    this._itemsDropped=(this._itemsDropped||0)+1;
    this.log(`${item.icon} Wyrzucono: ${item.name}`,'info');
    Achievements.checkAll(this);
    this.updateInventoryUI();
  },

  unequipItem(slot){
    const p=this.player;
    const item=p.equipment[slot];
    if(!item)return;
    if(p.inventory.length>=20){this.log('Plecak pełny! Nie można zdjąć.','info');return;}
    if(slot==='ring'){
      this._applyRingBonuses(item,-1);
    }
    this._addToInventory(item);
    p.equipment[slot]=null;
    this.log(`Zdjęto: ${item.name}`,'info');
    this.updateInventoryUI();
  },

});
