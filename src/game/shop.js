'use strict';
Object.assign(Game, {
  openShop(){
    this.paused=true;
    if(!this.shopStock)this.shopStock=ShopDB.generateShopStock(this.floor);
    const panel=document.getElementById('shop-panel');
    panel.classList.add('open');
    this._shopUIKey='';
    this.updateShopUI();
  },
  
  closeShop(){
    this.paused=false;
    document.getElementById('shop-panel').classList.remove('open');
    this._shopUIKey='';
  },

  _buildShopBuySectionHtml(player){
    let html=`<div class="shop-section"><h3>🛒 Kup przedmioty</h3>`;
    for(let i=0;i<this.shopStock.length;i++){
      const item=this.shopStock[i];
      html+=this._buildShopBuyRowHtml(player,item,i);
    }
    html+=`</div>`;
    return html;
  },

  _buildShopBuyRowHtml(player,item,index){
    const canAfford=player.gold>=item.price;
    const missingGold=canAfford?0:(item.price-player.gold);
    const statsStr=this._getItemStatsStr(item);
    return `<div class="shop-item">
      <span class="item-info"><span class="rarity-${item.rarity}">${item.icon} ${item.name}</span>${statsStr?` <span class="item-stats">${statsStr}</span>`:''}${canAfford?'':` <span class="item-stats" style="color:#f88">(brakuje ${missingGold}💰)</span>`}</span>
      <span style="color:#ff0;font-size:12px;margin:0 8px">${item.price}💰</span>
      <button class="buy-btn${canAfford?'':' cant-afford'}" onclick="Game.buyItem(${index})"${canAfford?'':' disabled'}>Kup</button>
    </div>`;
  },

  _buildShopSellSectionHtml(player){
    let html=`<div class="shop-section"><h3>💰 Sprzedaj przedmioty</h3>`;
    if(player.inventory.length===0){
      html+=`<div style="color:#555;font-style:italic;padding:8px">Ekwipunek pusty</div>`;
    }else{
      for(let i=0;i<player.inventory.length;i++){
        const item=player.inventory[i];
        html+=this._buildShopSellRowHtml(item);
      }
    }
    html+=`</div>`;
    return html;
  },

  _buildShopSellRowHtml(item){
    const sellPrice=ShopDB.getSellPrice(item);
    const statsStr=this._getItemStatsStr(item);
    const stackCount=(item.count&&item.count>1)?` x${item.count}`:'';
    return `<div class="shop-item">
      <span class="item-info"><span class="rarity-${item.rarity}">${item.icon} ${item.name}${stackCount}</span>${statsStr?` <span class="item-stats">${statsStr}</span>`:''}</span>
      <span style="color:#ff0;font-size:12px;margin:0 8px">${sellPrice}💰</span>
      <button class="sell-btn" onclick="Game.sellItem('${item.id}')">Sprzedaj</button>
    </div>`;
  },

  _buildShopHtml(player){
    let html=`<h2>🏪 Sklep Kupca</h2>`;
    html+=`<div class="shop-gold">💰 Twoje złoto: ${player.gold}</div>`;
    html+=this._buildShopBuySectionHtml(player);
    html+=this._buildShopSellSectionHtml(player);
    html+=`<button class="btn-close-shop" onclick="Game.closeShop()">Zamknij sklep</button>`;
    return html;
  },
  
  updateShopUI(){
    const panel=document.getElementById('shop-panel');
    if(!panel.classList.contains('open'))return;
    const p=this.player;
    const uiKey=this._buildShopUIKey();
    if(uiKey===this._shopUIKey)return;
    panel.innerHTML=this._buildShopHtml(p);
    this._shopUIKey=uiKey;
  },

  _appendItemBaseStats(parts,item){
    if(item.baseAtk)parts.push(`ATK+${item.baseAtk}`);
    if(item.baseDef)parts.push(`DEF+${item.baseDef}`);
    if(item.atkBonus)parts.push(`ATK+${item.atkBonus}`);
    if(item.defBonus)parts.push(`DEF+${item.defBonus}`);
    if(item.critBonus)parts.push(`KRYT+${Math.round(item.critBonus*100)}%`);
    if(item.dodgeBonus)parts.push(`UNIK+${Math.round(item.dodgeBonus*100)}%`);
    if(item.hpBonus)parts.push(`HP+${item.hpBonus}`);
    if(item.mpBonus)parts.push(`MP+${item.mpBonus}`);
  },

  _appendItemPotionStats(parts,item){
    if(item.subtype==='hp')parts.push(`Leczy ${item.value} HP`);
    if(item.subtype==='mp')parts.push(`Leczy ${item.value} MP`);
    if(item.subtype==='str')parts.push(`ATK+${item.value} ${item.duration}s`);
    if(item.subtype==='def')parts.push(`DEF+${item.value} ${item.duration}s`);
    if(item.subtype==='mirage')parts.push(`HP+${item.value}, MP+${item.mpValue||0}, KRYT+${Math.round((item.critValue||0)*100)}%, UNIK+${Math.round((item.dodgeValue||0)*100)}% ${item.duration}s`);
  },
  
  _getItemStatsStr(item){
    const parts=[];
    this._appendItemBaseStats(parts,item);
    this._appendItemPotionStats(parts,item);
    return parts.join(', ');
  },

  _buildBoughtItem(item){
    const bought={...item};
    delete bought.price;
    bought.id=Math.random().toString(36).substr(2,9);
    bought.count=1;
    return bought;
  },

  _finalizeBuyItem(item,bought){
    const p=this.player;
    p.gold-=item.price;
    this.log(`🛒 Kupiono: ${bought.icon} ${bought.name} za ${item.price}💰 (zostało: ${p.gold}💰)`,'item');
    this.sound.pickup();
  },

  _validateShopBuyIndex(idx){
    return idx>=0&&idx<this.shopStock.length;
  },

  _canAffordShopItem(player,item){
    if(player.gold>=item.price)return true;
    const missing=item.price-player.gold;
    this._combatFeedback('shop_no_gold',`Nie stać cię na ${item.name} (brakuje ${missing}💰)`,'info',.8);
    return false;
  },

  _tryAddBoughtItemToInventory(item){
    const bought=this._buildBoughtItem(item);
    if(!this._addToInventory(bought)){
      this._combatFeedback('shop_full_inv','Ekwipunek pełny — zwolnij miejsce, aby kupować.','info',.8);
      return null;
    }
    return bought;
  },

  _completeShopPurchase(idx,item,bought){
    this._finalizeBuyItem(item,bought);
    this.shopStock.splice(idx,1);
    this.updateShopUI();
  },

  _consumeInventoryForSell(idx,item){
    const p=this.player;
    let stackLeft=0;
    if(this._isStackableItem(item)&&(item.count||1)>1){
      item.count--;
      stackLeft=item.count;
      this._markInventoryDirty();
    }else{
      p.inventory.splice(idx,1);
      this._markInventoryDirty();
    }
    return stackLeft;
  },
  
  buyItem(idx){
    const p=this.player;
    if(!this._validateShopBuyIndex(idx))return;
    const item=this.shopStock[idx];
    if(!this._canAffordShopItem(p,item))return;
    const bought=this._tryAddBoughtItemToInventory(item);
    if(!bought)return;
    this._completeShopPurchase(idx,item,bought);
    this._shopPurchases=(this._shopPurchases||0)+1;
    Achievements.checkAll(this);
  },

  _findInventoryItemIndexById(itemId){
    return this.player.inventory.findIndex(i=>i.id===itemId);
  },

  _finalizeSellItem(item,sellPrice,stackLeft){
    const p=this.player;
    this.log(`💰 Sprzedano: ${item.icon} ${item.name}${stackLeft>0?` (zostało x${stackLeft})`:''} za ${sellPrice}💰 (masz: ${p.gold}💰)`,'item');
    this.sound.pickup();
    this.updateShopUI();
  },
  
  sellItem(itemId){
    const p=this.player;
    const idx=this._findInventoryItemIndexById(itemId);
    if(idx===-1)return;
    const item=p.inventory[idx];
    const sellPrice=ShopDB.getSellPrice(item);
    p.gold+=sellPrice;
    const stackLeft=this._consumeInventoryForSell(idx,item);
    this._shopSales=(this._shopSales||0)+1;
    Achievements.checkAll(this);
    this._finalizeSellItem(item,sellPrice,stackLeft);
  },

});
