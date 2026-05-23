'use strict';
// =============================================
// RELIC DATABASE
// =============================================
const RELIC_DB = [
  // --- Generyczne (każda klasa) ---
  {id:'relic_iron_heart',   name:'Żelazne Serce',      icon:'❤️‍🔥', rarity:'epic',
   desc:'+40 Max HP, +1 HP/s regeneracji',
   classes:['warrior','mage','rogue'],
   apply(p){p.maxHp+=40;p.hp=Math.min(p.maxHp,p.hp+40);p.talents.regenHp=(p.talents.regenHp||0)+1;}},

  {id:'relic_void_eye',     name:'Oko Pustki',          icon:'👁️', rarity:'epic',
   desc:'+12% Krytyk, +30% obrażenia krytyczne',
   classes:['warrior','mage','rogue'],
   apply(p){p.critChance=Math.min(.9,(p.critChance||0)+.12);p.critMult=(p.critMult||1.5)+.3;p.talents.critDmg=(p.talents.critDmg||0)+.3;}},

  {id:'relic_gold_idol',    name:'Złoty Idol',          icon:'🏺', rarity:'rare',
   desc:'+40% złota ze skrzyń i wrogów',
   classes:['warrior','mage','rogue'],
   apply(p){p.talents.goldFind=(p.talents.goldFind||0)+.4;}},

  {id:'relic_shadow_cloak', name:'Płaszcz Cienia',      icon:'🌑', rarity:'rare',
   desc:'+10% szansa na unik',
   classes:['warrior','mage','rogue'],
   apply(p){p.talents.dodge=(p.talents.dodge||0)+.10;}},

  // --- Wojownik ---
  {id:'relic_blood_rune',   name:'Krwawa Runa',         icon:'🩸', rarity:'legendary',
   desc:'+15% lifesteal, +5 ciernie',
   classes:['warrior'],
   apply(p){p.talents.lifeSteal=(p.talents.lifeSteal||0)+.15;p.talents.thorns=(p.talents.thorns||0)+5;}},

  {id:'relic_titan_core',   name:'Rdzeń Tytana',        icon:'💪', rarity:'epic',
   desc:'+25 ATK, -15 Max HP (siła kosztem wytrzymałości)',
   classes:['warrior'],
   apply(p){p.atk+=25;p.maxHp=Math.max(20,p.maxHp-15);p.hp=Math.min(p.maxHp,p.hp);}},

  // --- Mag ---
  {id:'relic_arcane_lens',  name:'Arkanowa Soczewka',   icon:'🔮', rarity:'legendary',
   desc:'+25% moc zaklęć, +2 MP/s regeneracji',
   classes:['mage'],
   apply(p){p.talents.spellPower=(p.talents.spellPower||0)+.25;p.talents.regenMp=(p.talents.regenMp||0)+2;}},

  {id:'relic_mana_vein',    name:'Żyła Many',           icon:'💎', rarity:'epic',
   desc:'+60 Max MP',
   classes:['mage'],
   apply(p){p.maxMp+=60;p.mp=Math.min(p.maxMp,p.mp+60);}},

  // --- Łotrzyk ---
  {id:'relic_phantom_fang', name:'Kieł Fantomu',        icon:'🗡️', rarity:'legendary',
   desc:'+10% unik, +25% obrażenia krytyczne',
   classes:['rogue'],
   apply(p){p.talents.dodge=(p.talents.dodge||0)+.10;p.talents.critDmg=(p.talents.critDmg||0)+.25;p.critMult=(p.critMult||1.5)+.25;}},

  {id:'relic_twin_shadows', name:'Bliźniacze Cienie',   icon:'☯️', rarity:'epic',
   desc:'+15% Krytyk, +0.5 szybkości',
   classes:['rogue'],
   apply(p){p.critChance=Math.min(.9,(p.critChance||0)+.15);p.speed=(p.speed||4)+.5;}},
];

const PROGRESSION_BALANCE = {
  baseXpToLevel:100,
  xpToLevelGrowthBase:1.37,
  xpToLevelGrowthLateLevel:8,
  xpToLevelGrowthLateReduction:0.04,
  xpToLevelGrowthMin:1.24,
  xpFloorBonusStart:6,
  xpFloorBonusPerFloor:0.03,
  xpFloorBonusCap:0.18,
};

const ENCOUNTER_BALANCE = {
  baseEnemyCount:10,
  enemyCountPerFloor:2.6,
  bossHpScalePerFloor:0.17,
  bossAtkScalePerFloor:0.13,
};

const TILE = {VOID:0,WALL:1,FLOOR:2,CORRIDOR:3,DOOR:4,STAIRS_DOWN:5,STAIRS_UP:6,WATER:7,LAVA:8,TRAP:9,CHEST:10,SHRINE:11,SHOP:12,EVENT:13,WELL:14,RIFT:15,OBELISK:16};
const DEBUG_OVERLAY_STORAGE_KEY = 'dos_debug_overlay_visible';

