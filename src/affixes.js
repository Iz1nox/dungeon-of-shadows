'use strict';
// =============================================
// ELITE AFFIXES
// =============================================
const EliteAffixes = {
  pool:[
    {name:'Szybki',nameTag:'⚡',color:'#ff0',apply(e){e.speed*=1.5;e.attackCd*=.7;}},
    {name:'Wampirycz.',nameTag:'🩸',color:'#f44',apply(e){e.vampiric=true;}},
    {name:'Wybuchowy',nameTag:'💥',color:'#f80',apply(e){e.explosive=true;}},
    {name:'Tarczowy',nameTag:'🛡',color:'#48f',apply(e){e.shielded=true;e.shieldHp=Math.floor(e.maxHp*.4);}},
    {name:'Teleporter',nameTag:'🌀',color:'#a0f',apply(e){e.teleporter=true;e.teleportTimer=4;}},
    {name:'Trujący',nameTag:'☠️',color:'#0a0',apply(e){e.poisonous=true;}},
    {name:'Mirażowy',nameTag:'🌫️',color:'#c8c8ff',apply(e){e.evasive=true;e.evasion=.2;e.speed*=1.15;}},
    {name:'Szczelinowy',nameTag:'🜔',color:'#8f7bff',apply(e){e.riftbound=true;e.riftPulseTimer=2.6+Math.random()*1.2;}},
    {name:'Obeliskowy',nameTag:'🗿',color:'#6f93ff',apply(e){e.obeliskbound=true;e.obeliskPulseTimer=3+Math.random()*1.2;}},
  ],
  
  tryMakeElite(enemy,floor){
    // chance increases with floor depth, never elites on floor 1
    if(floor<=1)return;
    const chance=Math.min(0.26,0.04+floor*0.022); // 8.4% on floor 2 → cap 26%
    if(!Util.chance(chance))return;
    
    const affix=Util.pick(this.pool);
    enemy.elite=true;
    enemy.eliteAffix=affix;
    enemy.name=`${affix.nameTag} ${enemy.name}`;
    enemy.maxHp=Math.floor(enemy.maxHp*1.4);
    enemy.hp=enemy.maxHp;
    enemy.atk=Math.floor(enemy.atk*1.25);
    enemy.xp=Math.floor(enemy.xp*1.8);
    enemy.gold=Math.floor(enemy.gold*1.8);
    affix.apply(enemy);
  }
};

