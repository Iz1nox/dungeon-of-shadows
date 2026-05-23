'use strict';

const EnemyDB = {
  types:[
    {name:'Szczur',icon:'🐀',hp:15,atk:3,def:0,xp:8,gold:2,speed:1.2,ai:'wander',color:'#a88'},
    {name:'Nietoperz',icon:'🦇',hp:10,atk:4,def:0,xp:6,gold:1,speed:2,ai:'erratic',color:'#88a'},
    {name:'Szkielet',icon:'💀',hp:30,atk:6,def:2,xp:15,gold:5,speed:.8,ai:'chase',color:'#dda'},
    {name:'Goblin',icon:'👺',hp:25,atk:8,def:1,xp:12,gold:8,speed:1,ai:'chase',color:'#6a6'},
    {name:'Dzik Otchłani',icon:'🐗',hp:46,atk:11,def:2,xp:24,gold:9,speed:.9,ai:'charger',color:'#b6764a',attackCd:1.1,chargeWindupTime:.6,chargeSpeed:10,chargeDashTime:.4,chargeCdMax:3.5,chargeBonus:7},
    {name:'Zombie',icon:'🧟',hp:50,atk:10,def:3,xp:20,gold:6,speed:.5,ai:'chase',color:'#686'},
    {name:'Ork',icon:'👹',hp:60,atk:12,def:5,xp:25,gold:12,speed:.7,ai:'patrol',color:'#8a6'},
    {name:'Mag Cieni',icon:'🧙',hp:35,atk:15,def:2,xp:30,gold:15,speed:.6,ai:'ranged',color:'#a6a',ranged:true,attackCd:1.35,projectileColor:'#d7a8ff',projectileSpeed:6.2},
    {name:'Kultysta Otchłani',icon:'🔮',hp:48,atk:15,def:2,xp:34,gold:16,speed:.8,ai:'ranged',color:'#6cf',ranged:true,attackCd:1.6,projectileColor:'#7fd8ff',projectileSpeed:5.2},
    {name:'Widmowy Łowca',icon:'👻',hp:62,atk:16,def:3,xp:42,gold:18,speed:1.15,ai:'ranged',color:'#9ef',ranged:true,attackCd:1.2,projectileColor:'#bde6ff',projectileSpeed:6.4},
    {name:'Ogr',icon:'👾',hp:100,atk:18,def:8,xp:40,gold:20,speed:.4,ai:'chase',color:'#aa8'},
    {name:'Demon',icon:'😈',hp:80,atk:22,def:6,xp:50,gold:25,speed:1,ai:'chase',color:'#f66'},
    {name:'Rycerz Śmierci',icon:'⚔️',hp:120,atk:25,def:12,xp:60,gold:30,speed:.6,ai:'patrol',color:'#88f'},
    {name:'Egzekutor Mirażu',icon:'🫥',hp:135,atk:26,def:10,xp:72,gold:34,speed:1.05,ai:'ranged',color:'#c7d4ff',ranged:true,attackCd:1.15,projectileColor:'#e5ecff',projectileSpeed:6.6},
    {name:'Rozpruwacz Szczeliny',icon:'🜔',hp:142,atk:28,def:10,xp:78,gold:38,speed:1.1,ai:'ranged',color:'#8f7bff',ranged:true,attackCd:1.05,projectileColor:'#c7a6ff',projectileSpeed:7},
    {name:'Strażnik Monolitu',icon:'🗿',hp:156,atk:27,def:13,xp:82,gold:40,speed:.82,ai:'patrol',color:'#aeb6d4'},
    {name:'Lustrzany Skrytobójca',icon:'🪞',hp:138,atk:30,def:9,xp:80,gold:39,speed:1.22,ai:'chase',color:'#d7e0ff'},
    {name:'Kapłanka Zwierciadeł',icon:'🔹',hp:148,atk:27,def:11,xp:81,gold:39,speed:.94,ai:'ranged',color:'#dbe4ff',ranged:true,attackCd:1.22,projectileColor:'#f1f4ff',projectileSpeed:6.1},
    {name:'Herold Mirażu',icon:'✨',hp:152,atk:29,def:12,xp:83,gold:41,speed:1.02,ai:'patrol',color:'#e6ecff'},
    {name:'Włócznik Zwierciadła',icon:'🔱',hp:158,atk:31,def:12,xp:85,gold:42,speed:1.08,ai:'chase',color:'#eef2ff'},
    {name:'Tkacz Mirażu',icon:'🪡',hp:166,atk:32,def:13,xp:88,gold:44,speed:.96,ai:'ranged',color:'#f4f7ff',ranged:true,attackCd:1.08,projectileColor:'#ffffff',projectileSpeed:6.8},
    {name:'Siewca Szczeliny',icon:'🌀',hp:170,atk:33,def:13,xp:90,gold:45,speed:1.04,ai:'ranged',color:'#c8b5ff',ranged:true,attackCd:1.02,projectileColor:'#dbc7ff',projectileSpeed:7.1},
    {name:'Wieszcz Obelisku',icon:'🔷',hp:174,atk:34,def:14,xp:92,gold:46,speed:.9,ai:'ranged',color:'#d9e3ff',ranged:true,attackCd:1.1,projectileColor:'#c7d6ff',projectileSpeed:6.9},
  ],
  bosses:[
    {name:'Król Goblinów',icon:'👑',hp:200,atk:20,def:8,xp:100,gold:100,speed:.6,ai:'boss',color:'#0f0',
      abilities:['charge','summon'],floor:3},
    {name:'Lich',icon:'☠️',hp:350,atk:30,def:10,xp:200,gold:200,speed:.5,ai:'boss',color:'#a0f',
      abilities:['fireball','teleport','mirror_dash','rift_nova','obelisk_storm','summon'],floor:6},
    {name:'Smok Cieni',icon:'🐉',hp:600,atk:45,def:15,xp:500,gold:500,speed:.8,ai:'boss',color:'#f80',
      abilities:['breath','charge','mirror_dash','rift_nova','obelisk_storm','stomp'],floor:10},
  ],
  
  getForFloor(floor){
    const progression=Math.max(0,floor-1);
    const spread=Math.max(1,this.types.length-3);
    const maxTier=Math.min(this.types.length,3+Math.floor(progression*spread/9));
    return this.types.slice(0,maxTier);
  },
  getBoss(floor){
    for(let i=this.bosses.length-1;i>=0;i--){
      if(floor>=this.bosses[i].floor)return this.bosses[i];
    }
    return null;
  }
};
