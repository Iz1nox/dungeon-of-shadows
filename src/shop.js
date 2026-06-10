'use strict';
// =============================================
// SHOP DATABASE
// =============================================
const ShopDB = {
  // Price multiplier per rarity
  priceByRarity:{common:15,uncommon:40,rare:100,epic:250,legendary:600},
  sellMultiplier:0.5,
  
  generateShopStock(floor){
    const stock=[];
    // Always sell HP and MP potions
    stock.push({...ItemDB.potions[0],price:16+floor*3,id:Math.random().toString(36).substr(2,9)});
    stock.push({...ItemDB.potions[2],price:14+floor*2,id:Math.random().toString(36).substr(2,9)});
    if(floor>=3){
      stock.push({...ItemDB.potions[1],price:46+floor*4,id:Math.random().toString(36).substr(2,9)});
      stock.push({...ItemDB.potions[3],price:42+floor*3,id:Math.random().toString(36).substr(2,9)});
    }
    if(floor>=5){
      stock.push({...ItemDB.potions[4],price:80+floor*6,id:Math.random().toString(36).substr(2,9)});
      stock.push({...ItemDB.potions[5],price:80+floor*6,id:Math.random().toString(36).substr(2,9)});
      stock.push({...ItemDB.potions[6],price:80+floor*6,id:Math.random().toString(36).substr(2,9)});
    }
    // Scrolls (from floor 2 up)
    if(floor>=2){
      const scrollCount=Util.rand(1,2);
      for(let i=0;i<scrollCount;i++){
        const scroll={...Util.pick(ItemDB.scrolls),id:Math.random().toString(36).substr(2,9)};
        scroll.price=Math.floor((scroll.rarity==='rare'?55:32)*(1+floor*0.12));
        stock.push(scroll);
      }
    }
    // Random equipment items (2-4 pieces)
    const eqCount=Util.rand(2,4);
    for(let i=0;i<eqCount;i++){
      const item=ItemDB.generateLoot(floor,0);
      item.price=this.priceByRarity[item.rarity]||50;
      item.price=Math.floor(item.price*(1+floor*0.17));
      if(item.baseAtk)item.price+=item.baseAtk*5;
      if(item.baseDef)item.price+=item.baseDef*5;
      stock.push(item);
    }
    return stock;
  },
  
  getSellPrice(item){
    const base=this.priceByRarity[item.rarity]||10;
    let price=Math.floor(base*this.sellMultiplier);
    if(item.baseAtk)price+=Math.floor(item.baseAtk*2);
    if(item.baseDef)price+=Math.floor(item.baseDef*2);
    return Math.max(1,price);
  }
};

