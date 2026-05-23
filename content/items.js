'use strict';

const ItemDB = {
  rarities:['common','uncommon','rare','epic','legendary'],
  rarityColors:{common:'#ccc',uncommon:'#0f0',rare:'#44f',epic:'#a0f',legendary:'#f80'},
  rarityChance:[.50,.25,.15,.07,.03],
  
  weapons:[
    {name:'Zardzewiały Miecz',icon:'🗡️',type:'weapon',baseAtk:3,rarity:'common'},
    {name:'Krótki Miecz',icon:'⚔️',type:'weapon',baseAtk:5,rarity:'common'},
    {name:'Topór Bojowy',icon:'🪓',type:'weapon',baseAtk:8,rarity:'uncommon'},
    {name:'Lodowy Miecz',icon:'🗡️',type:'weapon',baseAtk:12,rarity:'rare',effect:'freeze'},
    {name:'Ognisty Topór',icon:'🪓',type:'weapon',baseAtk:15,rarity:'rare',effect:'burn'},
    {name:'Miecz Cieni',icon:'⚔️',type:'weapon',baseAtk:20,rarity:'epic',effect:'lifesteal'},
    {name:'Ostrze Zagłady',icon:'🗡️',type:'weapon',baseAtk:30,rarity:'legendary',effect:'execute'},
    {name:'Młot Monolitu',icon:'🔨',type:'weapon',baseAtk:28,rarity:'legendary',effect:'obeliskStrike'},
    {name:'Tasak Szczeliny',icon:'🪓',type:'weapon',baseAtk:29,rarity:'legendary',effect:'riftSlash'},
    {name:'Szabla Zwierciadła',icon:'🗡️',type:'weapon',baseAtk:28,rarity:'legendary',effect:'mirrorBlade'},
  ],
  
  armors:[
    {name:'Skórzana Zbroja',icon:'🦺',type:'armor',baseDef:2,rarity:'common'},
    {name:'Kolczuga',icon:'🛡️',type:'armor',baseDef:5,rarity:'uncommon'},
    {name:'Płytowa Zbroja',icon:'🛡️',type:'armor',baseDef:8,rarity:'rare'},
    {name:'Zbroja Smoka',icon:'🛡️',type:'armor',baseDef:14,rarity:'epic',effect:'fireResist'},
    {name:'Eteryczna Zbroja',icon:'🛡️',type:'armor',baseDef:22,rarity:'legendary',effect:'manaShield'},
    {name:'Kirys Szczelinowej Straży',icon:'🛡️',type:'armor',baseDef:21,rarity:'legendary',effect:'riftAegis'},
    {name:'Pancerz Straży Obelisku',icon:'🛡️',type:'armor',baseDef:20,rarity:'legendary',effect:'obeliskWard'},
    {name:'Płaszcz Zwierciadlanego Pyłu',icon:'🛡️',type:'armor',baseDef:20,rarity:'legendary',effect:'mirrorVeil'},
  ],
  
  potions:[
    {name:'Mikstura HP',icon:'🧪',type:'potion',subtype:'hp',value:35,rarity:'common'},
    {name:'Duża Mikstura HP',icon:'🧪',type:'potion',subtype:'hp',value:70,rarity:'uncommon'},
    {name:'Mikstura MP',icon:'💧',type:'potion',subtype:'mp',value:30,rarity:'common'},
    {name:'Duża Mikstura MP',icon:'💧',type:'potion',subtype:'mp',value:60,rarity:'uncommon'},
    {name:'Eliksir Siły',icon:'💪',type:'potion',subtype:'str',value:5,duration:30,rarity:'rare'},
    {name:'Eliksir Obrony',icon:'🛡️',type:'potion',subtype:'def',value:5,duration:30,rarity:'rare'},
    {name:'Eliksir Szczeliny',icon:'🜔',type:'potion',subtype:'rift',value:42,damage:26,radius:3.4,rarity:'legendary'},
    {name:'Eliksir Monolitu',icon:'🗿',type:'potion',subtype:'obelisk',value:55,mpValue:40,atkValue:6,defValue:6,duration:18,rarity:'legendary'},
    {name:'Eliksir Mirażu',icon:'🪞',type:'potion',subtype:'mirage',value:34,mpValue:34,critValue:.08,dodgeValue:.08,duration:16,rarity:'legendary'},
  ],
  
  rings:[
    {name:'Pierścień Siły',icon:'💍',type:'ring',atkBonus:3,rarity:'uncommon'},
    {name:'Pierścień Ochrony',icon:'💍',type:'ring',defBonus:3,rarity:'uncommon'},
    {name:'Pierścień Życia',icon:'💍',type:'ring',hpBonus:20,rarity:'rare'},
    {name:'Pierścień Magii',icon:'💍',type:'ring',mpBonus:15,rarity:'rare'},
    {name:'Pierścień Mocy',icon:'💍',type:'ring',atkBonus:8,defBonus:5,hpBonus:30,rarity:'epic'},
    {name:'Pierścień Pustego Echa',icon:'💍',type:'ring',critBonus:.08,dodgeBonus:.04,mpBonus:20,rarity:'legendary',effect:'mirrorEcho'},
    {name:'Pierścień Szczelinowego Rezonansu',icon:'💍',type:'ring',defBonus:4,mpBonus:12,rarity:'legendary',effect:'riftPulse'},
    {name:'Pierścień Echa Obelisku',icon:'💍',type:'ring',critBonus:.05,mpBonus:14,rarity:'legendary',effect:'obeliskEcho'},
  ],
  
  generateLoot(floor,luck=0){
    const lateFloorBonus=floor>=9?.08:floor>=7?.04:0;
    let roll=Math.random()-luck*0.05-lateFloorBonus;
    let rarity='common';
    let cum=0;
    for(let i=0;i<this.rarityChance.length;i++){
      cum+=this.rarityChance[i];
      if(roll<cum){rarity=this.rarities[i];break;}
    }
    const riShift=Math.min(2,Math.floor(floor/3));
    const ri=Math.min(this.rarities.length-1,this.rarities.indexOf(rarity)+riShift);
    rarity=this.rarities[ri];
    
    const pool=[];
    for(const w of this.weapons)if(this.rarities.indexOf(w.rarity)<=ri)pool.push(w);
    for(const a of this.armors)if(this.rarities.indexOf(a.rarity)<=ri)pool.push(a);
    for(const p of this.potions)if(this.rarities.indexOf(p.rarity)<=ri)pool.push(p);
    for(const r of this.rings)if(this.rarities.indexOf(r.rarity)<=ri)pool.push(r);
    
    const itemBase=Util.pick(pool);
    const item={...itemBase,id:Math.random().toString(36).substr(2,9)};
    
    if(item.baseAtk)item.baseAtk=Math.floor(item.baseAtk*(1+floor*0.15));
    if(item.baseDef)item.baseDef=Math.floor(item.baseDef*(1+floor*0.15));
    if(item.value)item.value=Math.floor(item.value*(1+floor*0.1));
    
    return item;
  }
};
