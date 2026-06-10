// =============================================
// DUNGEON OF SHADOWS — Full Game Engine
// =============================================
'use strict';

const TILE_SIZE = 32;
const MAP_W = 80;
const MAP_H = 60;
const MAX_FLOOR = 10;
const FOV_RADIUS = 12;
const SAVE_SLOTS = 3;
const SAVE_SCHEMA_VERSION = 90;
const GAME_VERSION = '2.0.0';
const SAVE_COMPAT_TAG = 'DOS-2.x';

const EVENT_BALANCE = {
  eventRepeatCooldownFloors:1,
  relicSpawnChance:.38,
  wellSpawnChance:.28,
  riftSpawnChance:.22,
  obeliskSpawnChance:.17,
  relicGoldBase:20,
  relicGoldPerFloor:6,
  relicBlessingMaxBoost:6,
  relicBlessingHeal:10,
  relicBloodCostMin:12,
  relicBloodCostPct:.14,
  relicBloodAtk:2,
  relicEchoCritGain:.03,
  relicEchoManaGain:15,
  relicShadowDodgeGain:.04,
  relicShadowStealthSec:3,
  wellCostMin:12,
  wellCostPct:.15,
  wellSpellPowerGain:.04,
  wellCritGain:.04,
  wellManaBase:18,
  wellManaPerFloor:2,
  wellGoldBase:12,
  wellGoldPerFloor:3,
  wellEchoDodgeGain:.03,
  wellEchoStealthSec:2,
  wellEchoShadowstepCdReduction:4,
  wellSustainDuration:8,
  wellSustainRegenHp:2,
  wellSustainRegenMp:3,
  wellMercyCostReductionPct:.35,
  riftCostMin:10,
  riftCostPct:.12,
  riftAtkGain:2,
  riftDefGain:2,
  riftCritGain:.03,
  riftMaxHpGain:8,
  riftGoldBase:16,
  riftGoldPerFloor:5,
  obeliskCostMin:12,
  obeliskCostPct:.14,
  obeliskCritGain:.02,
  obeliskSpellPowerGain:.05,
  obeliskDefGain:2,
  obeliskMaxMpGain:10,
  obeliskGoldBase:14,
  obeliskGoldPerFloor:4,
};

