'use strict';

const SpellDB = {
  warrior:[
    {name:'Szał',icon:'😡',key:'1',mpCost:10,cd:8,cdTimer:0,desc:'Podwójne obrażenia na 5s',type:'buff',duration:5},
    {name:'Uderzenie Tarcz.',icon:'🛡️',key:'2',mpCost:15,cd:12,cdTimer:0,desc:'AoE dookoła, ogłuszenie',type:'aoe',range:1.5,damage:15},
    {name:'Bastion Szczeliny',icon:'🜔',key:'3',mpCost:20,cd:13,cdTimer:0,desc:'Puls arcane wokół wojownika i leczenie za trafienia',type:'rift_guard',damage:20,range:2.8,healPerHit:7},
    {name:'Monolitowy Taran',icon:'🗿',key:'4',mpCost:18,cd:11,cdTimer:0,desc:'Skok i uderzenie obszarowe przy lądowaniu',type:'obelisk_crash',damage:24,range:5.5,impactRadius:2.1},
    {name:'Rozdarcie Ziemi',icon:'🪨',key:'5',mpCost:28,cd:16,cdTimer:0,desc:'Fala uderzeniowa w linii przed wojownikiem',type:'earthsplitter',damage:26,range:7,width:1.15},
  ],
  mage:[
    {name:'Kula Ognia',icon:'🔥',key:'1',mpCost:12,cd:3,cdTimer:0,desc:'Ognisty pocisk',type:'projectile',damage:25,element:'fire'},
    {name:'Szczelinowa Salwa',icon:'🜔',key:'2',mpCost:22,cd:9,cdTimer:0,desc:'Puls arcane i salwa pocisków dookoła',type:'rift_burst',damage:18,count:8,range:4.5},
    {name:'Lanca Obelisku',icon:'🗿',key:'3',mpCost:24,cd:10,cdTimer:0,desc:'Przebijająca lanca arcane w linii do kursora',type:'obelisk_lance',damage:26,range:8.5,width:.65},
    {name:'Teleportacja',icon:'🌀',key:'4',mpCost:15,cd:8,cdTimer:0,desc:'Teleport do kursora',type:'teleport',range:8},
    {name:'Promień Pustki',icon:'🜄',key:'5',mpCost:30,cd:14,cdTimer:0,desc:'Przeszywający promień energii',type:'beam',damage:24,range:9,width:.8},
  ],
  rogue:[
    {name:'Ostrza Szczeliny',icon:'🜔',key:'1',mpCost:14,cd:8,cdTimer:0,desc:'Arcane ciosy w kilku pobliskich przeciwników i krótki cień',type:'rift_blades',damage:18,range:6.2,targets:4,stealth:1.2},
    {name:'Krok Cienia',icon:'👤',key:'2',mpCost:12,cd:6,cdTimer:0,desc:'Niewidzialność na 3s',type:'stealth',duration:3},
    {name:'Odłamki Monolitu',icon:'🔷',key:'3',mpCost:20,cd:10,cdTimer:0,desc:'Wachlarz odłamków arcane przed łotrzykiem',type:'obelisk_fan',damage:18,count:5,range:7,spread:.55,width:.75},
    {name:'Przebicie Pustki',icon:'🕳️',key:'4',mpCost:18,cd:11,cdTimer:0,desc:'Doskok przez cel i egzekucja osłabionych',type:'voidstep',damage:24,range:6.5,executeHpPct:.35,executeBonus:20},
    {name:'Taniec Ostrzy',icon:'🩸',key:'5',mpCost:24,cd:14,cdTimer:0,desc:'Skok do celu i seria cięć',type:'shadowstep',damage:22,range:7,strikes:3,healPct:.2},
  ],
  necromancer:[
    {name:'Pocisk Pustki',icon:'🜏',key:'1',mpCost:9,cd:2.5,cdTimer:0,desc:'Mroczny pocisk raniący wroga',type:'projectile',damage:22,element:'shadow'},
    {name:'Wskrzeszenie',icon:'💀',key:'2',mpCost:24,cd:9,cdTimer:0,desc:'Przyzywa 2 szkieletowe sługi na 18s (max 4)',type:'summon',count:2,duration:18,maxMinions:4},
    {name:'Żniwa Dusz',icon:'🌑',key:'3',mpCost:16,cd:7,cdTimer:0,desc:'Wysysa życie z najbliższego wroga',type:'drain',damage:24},
    {name:'Eksplozja Zwłok',icon:'🩸',key:'4',mpCost:20,cd:9,cdTimer:0,desc:'Detonuje pobliskie szczątki poległych, raniąc wrogów w okolicy',type:'corpse_burst',damage:30,range:7,radius:2.6},
    {name:'Mroczny Pakt',icon:'🕯️',key:'5',mpCost:0,cd:14,cdTimer:0,desc:'Poświęć 15% maks. HP: odzyskaj 45 MP i wzmocnij sługi',type:'dark_pact',hpCostPct:.15,manaGain:45,minionAtkBonus:5,minionHeal:20},
  ]
};
