'use strict';
Object.assign(Game, {
  _isValidSaveSlot(slot){
    return Number.isInteger(slot)&&slot>=1&&slot<=SAVE_SLOTS;
  },

  _normalizeSaveVersion(rawVersion){
    return Number.isFinite(rawVersion)?Math.max(1,Math.floor(rawVersion)):1;
  },

  _applySaveBaseDefaults(d){
    if(!Number.isFinite(d.bossKills))d.bossKills=0;
    if(!Number.isFinite(d.maxCombo))d.maxCombo=0;
    if(!Array.isArray(d.achievements))d.achievements=[];
    if(!Number.isFinite(d.echoVisions))d.echoVisions=0;
    if(!Number.isFinite(d.shadowDances))d.shadowDances=0;
    if(!Number.isFinite(d.wellEchoes))d.wellEchoes=0;
    if(!Number.isFinite(d.mirageElitesSlain))d.mirageElitesSlain=0;
    if(!Number.isFinite(d.mirrorExecutorsSlain))d.mirrorExecutorsSlain=0;
    if(!Number.isFinite(d.mirrorAssassinsSlain))d.mirrorAssassinsSlain=0;
    if(!Number.isFinite(d.mirrorPriestessesSlain))d.mirrorPriestessesSlain=0;
    if(!Number.isFinite(d.mirrorHeraldsSlain))d.mirrorHeraldsSlain=0;
    if(!Number.isFinite(d.mirrorLancersSlain))d.mirrorLancersSlain=0;
    if(!Number.isFinite(d.mirrorWeaversSlain))d.mirrorWeaversSlain=0;
    if(!Number.isFinite(d.riftboundElitesSlain))d.riftboundElitesSlain=0;
    if(!Number.isFinite(d.riftReaversSlain))d.riftReaversSlain=0;
    if(!Number.isFinite(d.riftSowersSlain))d.riftSowersSlain=0;
    if(!Number.isFinite(d.obeliskboundElitesSlain))d.obeliskboundElitesSlain=0;
    if(!Number.isFinite(d.obeliskSentinelsSlain))d.obeliskSentinelsSlain=0;
    if(!Number.isFinite(d.obeliskAugursSlain))d.obeliskAugursSlain=0;
    if(!Number.isFinite(d.riftBurstsCast))d.riftBurstsCast=0;
    if(!Number.isFinite(d.riftBurstHits))d.riftBurstHits=0;
    if(!Number.isFinite(d.riftGuardsCast))d.riftGuardsCast=0;
    if(!Number.isFinite(d.riftGuardHits))d.riftGuardHits=0;
    if(!Number.isFinite(d.riftBladesCast))d.riftBladesCast=0;
    if(!Number.isFinite(d.riftBladeHits))d.riftBladeHits=0;
    if(!Number.isFinite(d.obeliskLancesCast))d.obeliskLancesCast=0;
    if(!Number.isFinite(d.obeliskLanceHits))d.obeliskLanceHits=0;
    if(!Number.isFinite(d.obeliskCrashesCast))d.obeliskCrashesCast=0;
    if(!Number.isFinite(d.obeliskCrashHits))d.obeliskCrashHits=0;
    if(!Number.isFinite(d.obeliskFansCast))d.obeliskFansCast=0;
    if(!Number.isFinite(d.obeliskFanHits))d.obeliskFanHits=0;
    if(!Number.isFinite(d.earthsplittersCast))d.earthsplittersCast=0;
    if(!Number.isFinite(d.earthsplitterHits))d.earthsplitterHits=0;
    if(!Number.isFinite(d.teleportsCast))d.teleportsCast=0;
    if(!Number.isFinite(d.teleportDistance))d.teleportDistance=0;
    if(!Number.isFinite(d.stealthCasts))d.stealthCasts=0;
    if(!Number.isFinite(d.stealthSeconds))d.stealthSeconds=0;
    if(!Number.isFinite(d.rageCasts))d.rageCasts=0;
    if(!Number.isFinite(d.rageSeconds))d.rageSeconds=0;
    if(!Number.isFinite(d.shieldAoeCasts))d.shieldAoeCasts=0;
    if(!Number.isFinite(d.shieldAoeHits))d.shieldAoeHits=0;
    if(!Number.isFinite(d.fireballCasts))d.fireballCasts=0;
    if(!Number.isFinite(d.fireballHits))d.fireballHits=0;
    if(!Number.isFinite(d.chainCasts))d.chainCasts=0;
    if(!Number.isFinite(d.chainHits))d.chainHits=0;
    if(!Number.isFinite(d.beamCasts))d.beamCasts=0;
    if(!Number.isFinite(d.voidstepCasts))d.voidstepCasts=0;
    if(!Number.isFinite(d.voidstepExecutes))d.voidstepExecutes=0;
    if(!Number.isFinite(d.mirrorBladeProcs))d.mirrorBladeProcs=0;
    if(!Number.isFinite(d.mirrorBladeKills))d.mirrorBladeKills=0;
    if(!Number.isFinite(d.mirrorBladeCooldown))d.mirrorBladeCooldown=0;
    if(!Number.isFinite(d.mirrorVeilProcs))d.mirrorVeilProcs=0;
    if(!Number.isFinite(d.mirrorVeilKills))d.mirrorVeilKills=0;
    if(!Number.isFinite(d.mirrorVeilCooldown))d.mirrorVeilCooldown=0;
    if(!Number.isFinite(d.mirrorEchoProcs))d.mirrorEchoProcs=0;
    if(!Number.isFinite(d.mirrorEchoKills))d.mirrorEchoKills=0;
    if(!Number.isFinite(d.mirrorEchoCooldown))d.mirrorEchoCooldown=0;
    if(!Number.isFinite(d.mirrorPotionUses))d.mirrorPotionUses=0;
    if(!Number.isFinite(d.mirrorPotionKills))d.mirrorPotionKills=0;
    if(!Number.isFinite(d.mirrorPotionTimer))d.mirrorPotionTimer=0;
    if(!Number.isFinite(d.riftPulseProcs))d.riftPulseProcs=0;
    if(!Number.isFinite(d.riftPulseKills))d.riftPulseKills=0;
    if(!Number.isFinite(d.riftPulseCooldown))d.riftPulseCooldown=0;
    if(!Number.isFinite(d.riftAegisProcs))d.riftAegisProcs=0;
    if(!Number.isFinite(d.riftAegisKills))d.riftAegisKills=0;
    if(!Number.isFinite(d.riftAegisCooldown))d.riftAegisCooldown=0;
    if(!Number.isFinite(d.riftPotionUses))d.riftPotionUses=0;
    if(!Number.isFinite(d.riftPotionKills))d.riftPotionKills=0;
    if(!Number.isFinite(d.riftSlashProcs))d.riftSlashProcs=0;
    if(!Number.isFinite(d.riftSlashKills))d.riftSlashKills=0;
    if(!Number.isFinite(d.riftSlashCooldown))d.riftSlashCooldown=0;
    if(!Number.isFinite(d.obeliskEchoProcs))d.obeliskEchoProcs=0;
    if(!Number.isFinite(d.obeliskEchoKills))d.obeliskEchoKills=0;
    if(!Number.isFinite(d.obeliskEchoCooldown))d.obeliskEchoCooldown=0;
    if(!Number.isFinite(d.obeliskWardProcs))d.obeliskWardProcs=0;
    if(!Number.isFinite(d.obeliskWardKills))d.obeliskWardKills=0;
    if(!Number.isFinite(d.obeliskWardCooldown))d.obeliskWardCooldown=0;
    if(!Number.isFinite(d.obeliskWardTimer))d.obeliskWardTimer=0;
    if(!Number.isFinite(d.obeliskStrikeProcs))d.obeliskStrikeProcs=0;
    if(!Number.isFinite(d.obeliskStrikeKills))d.obeliskStrikeKills=0;
    if(!Number.isFinite(d.obeliskStrikeCooldown))d.obeliskStrikeCooldown=0;
    if(!Number.isFinite(d.obeliskPotionUses))d.obeliskPotionUses=0;
    if(!Number.isFinite(d.obeliskPotionKills))d.obeliskPotionKills=0;
    if(!Number.isFinite(d.obeliskPotionTimer))d.obeliskPotionTimer=0;
    if(!Number.isFinite(d.mirrorDashSurvived))d.mirrorDashSurvived=0;
    if(!Number.isFinite(d.riftNovaSurvived))d.riftNovaSurvived=0;
    if(!Number.isFinite(d.obeliskStormSurvived))d.obeliskStormSurvived=0;
    if(!Number.isFinite(d.shadowAwakenings))d.shadowAwakenings=0;
    if(!Number.isFinite(d.wellSustainBlessings))d.wellSustainBlessings=0;
    if(!Number.isFinite(d.wellSustainVictories))d.wellSustainVictories=0;
    if(!Number.isFinite(d.beamImpacts))d.beamImpacts=0;
    if(!Number.isFinite(d.backstabCasts))d.backstabCasts=0;
    if(!Number.isFinite(d.backstabKills))d.backstabKills=0;
    if(!Number.isFinite(d.shadowstepCasts))d.shadowstepCasts=0;
    if(!Number.isFinite(d.shadowstepFinishes))d.shadowstepFinishes=0;
    if(!Number.isFinite(d.mirrorDashBossKills))d.mirrorDashBossKills=0;
    if(!Number.isFinite(d.riftNovaBossKills))d.riftNovaBossKills=0;
    if(!Number.isFinite(d.obeliskStormBossKills))d.obeliskStormBossKills=0;
    if(!Number.isFinite(d.bossLegendaryDrops))d.bossLegendaryDrops=0;
    if(!Number.isFinite(d.potionsUsed))d.potionsUsed=0;
    if(!Number.isFinite(d.flawlessVictories))d.flawlessVictories=0;
    if(!Number.isFinite(d.shopPurchases))d.shopPurchases=0;
    if(!Number.isFinite(d.shopSales))d.shopSales=0;
    if(!Number.isFinite(d.chestsOpened))d.chestsOpened=0;
    if(!Number.isFinite(d.shrineUses))d.shrineUses=0;
    if(!Number.isFinite(d.stairsDescended))d.stairsDescended=0;
    if(!Number.isFinite(d.levelUpsGained))d.levelUpsGained=0;
    if(!Number.isFinite(d.spellsCast))d.spellsCast=0;
    if(!Number.isFinite(d.meleeHits))d.meleeHits=0;
    if(!Number.isFinite(d.specialAttacksUsed))d.specialAttacksUsed=0;
    if(!Number.isFinite(d.dodgesPerformed))d.dodgesPerformed=0;
    if(!Number.isFinite(d.meleeCrits))d.meleeCrits=0;
    if(!Number.isFinite(d.rangedHits))d.rangedHits=0;
    if(!Number.isFinite(d.enemyProjectileHitsTaken))d.enemyProjectileHitsTaken=0;
    if(!Number.isFinite(d.eliteKills))d.eliteKills=0;
    if(!Number.isFinite(d.itemsPickedUp))d.itemsPickedUp=0;
    if(!Number.isFinite(d.goldPickups))d.goldPickups=0;
    if(!Number.isFinite(d.hazardHitsTaken))d.hazardHitsTaken=0;
    if(!Number.isFinite(d.hitsTaken))d.hitsTaken=0;
    if(!Number.isFinite(d.ringEquips))d.ringEquips=0;
    if(!Number.isFinite(d.weaponEquips))d.weaponEquips=0;
    if(!Number.isFinite(d.armorEquips))d.armorEquips=0;
    if(!Number.isFinite(d.itemsDropped))d.itemsDropped=0;
    if(!Number.isFinite(d.abyssRiftsUsed))d.abyssRiftsUsed=0;
    if(!Number.isFinite(d.riftEmpowerments))d.riftEmpowerments=0;
    if(!Number.isFinite(d.voidObelisksUsed))d.voidObelisksUsed=0;
    if(!Number.isFinite(d.obeliskBoons))d.obeliskBoons=0;
    if(!Number.isFinite(d.wellMercyCharges))d.wellMercyCharges=0;
    if(!Number.isFinite(d.wellSustainTimer))d.wellSustainTimer=0;
    if(!Number.isFinite(d.lastRiftFloor))d.lastRiftFloor=0;
    if(!Number.isFinite(d.lastObeliskFloor))d.lastObeliskFloor=0;
  },

  _applySaveVersionMigrations(d,version){
    if(version<88){
      if(!Number.isFinite(d.obeliskAugursSlain))d.obeliskAugursSlain=0;
    }
    if(version<87){
      if(!Number.isFinite(d.riftSowersSlain))d.riftSowersSlain=0;
    }
    if(version<86){
      if(!Number.isFinite(d.mirrorWeaversSlain))d.mirrorWeaversSlain=0;
    }
    if(version<85){
      if(!Number.isFinite(d.shadowstepCasts))d.shadowstepCasts=0;
    }
    if(version<84){
      if(!Number.isFinite(d.backstabCasts))d.backstabCasts=0;
      if(!Number.isFinite(d.backstabKills))d.backstabKills=0;
    }
    if(version<83){
      if(!Number.isFinite(d.beamCasts))d.beamCasts=0;
    }
    if(version<82){
      if(!Number.isFinite(d.chainCasts))d.chainCasts=0;
      if(!Number.isFinite(d.chainHits))d.chainHits=0;
    }
    if(version<81){
      if(!Number.isFinite(d.fireballCasts))d.fireballCasts=0;
      if(!Number.isFinite(d.fireballHits))d.fireballHits=0;
    }
    if(version<80){
      if(!Number.isFinite(d.shieldAoeCasts))d.shieldAoeCasts=0;
      if(!Number.isFinite(d.shieldAoeHits))d.shieldAoeHits=0;
    }
    if(version<79){
      if(!Number.isFinite(d.rageCasts))d.rageCasts=0;
      if(!Number.isFinite(d.rageSeconds))d.rageSeconds=0;
    }
    if(version<78){
      if(!Number.isFinite(d.stealthCasts))d.stealthCasts=0;
      if(!Number.isFinite(d.stealthSeconds))d.stealthSeconds=0;
    }
    if(version<77){
      if(!Number.isFinite(d.teleportsCast))d.teleportsCast=0;
      if(!Number.isFinite(d.teleportDistance))d.teleportDistance=0;
    }
    if(version<76){
      if(!Number.isFinite(d.mirrorLancersSlain))d.mirrorLancersSlain=0;
    }
    if(version<75){
      if(!Number.isFinite(d.mirrorHeraldsSlain))d.mirrorHeraldsSlain=0;
    }
    if(version<74){
      if(!Number.isFinite(d.mirrorPriestessesSlain))d.mirrorPriestessesSlain=0;
    }
    if(version<73){
      if(!Number.isFinite(d.mirrorExecutorsSlain))d.mirrorExecutorsSlain=0;
    }
    if(version<72){
      if(!Number.isFinite(d.mirrorPotionUses))d.mirrorPotionUses=0;
      if(!Number.isFinite(d.mirrorPotionKills))d.mirrorPotionKills=0;
      if(!Number.isFinite(d.mirrorPotionTimer))d.mirrorPotionTimer=0;
    }
    if(version<4){
      if(!Number.isFinite(d.mysticEvents))d.mysticEvents=0;
    }
    if(version<5){
      if(!Number.isFinite(d.shadowWellsUsed))d.shadowWellsUsed=0;
    }
    if(version<6){
      if(!Number.isFinite(d.lastRelicFloor))d.lastRelicFloor=0;
      if(!Number.isFinite(d.lastWellFloor))d.lastWellFloor=0;
    }
    if(version<9){
      if(!Number.isFinite(d.shadowDances))d.shadowDances=0;
      if(!Number.isFinite(d.wellEchoes))d.wellEchoes=0;
    }
    if(version<10){
      if(!Number.isFinite(d.mirageElitesSlain))d.mirageElitesSlain=0;
    }
    if(version<44){
      if(!Number.isFinite(d.riftboundElitesSlain))d.riftboundElitesSlain=0;
    }
    if(version<51){
      if(!Number.isFinite(d.obeliskboundElitesSlain))d.obeliskboundElitesSlain=0;
    }
    if(version<52){
      if(!Number.isFinite(d.obeliskLancesCast))d.obeliskLancesCast=0;
      if(!Number.isFinite(d.obeliskLanceHits))d.obeliskLanceHits=0;
    }
    if(version<53){
      if(!Number.isFinite(d.obeliskCrashesCast))d.obeliskCrashesCast=0;
      if(!Number.isFinite(d.obeliskCrashHits))d.obeliskCrashHits=0;
    }
    if(version<54){
      if(!Number.isFinite(d.obeliskFansCast))d.obeliskFansCast=0;
      if(!Number.isFinite(d.obeliskFanHits))d.obeliskFanHits=0;
    }
    if(version<55){
      if(!Number.isFinite(d.obeliskEchoProcs))d.obeliskEchoProcs=0;
      if(!Number.isFinite(d.obeliskEchoKills))d.obeliskEchoKills=0;
      if(!Number.isFinite(d.obeliskEchoCooldown))d.obeliskEchoCooldown=0;
    }
    if(version<56){
      if(!Number.isFinite(d.obeliskWardProcs))d.obeliskWardProcs=0;
      if(!Number.isFinite(d.obeliskWardKills))d.obeliskWardKills=0;
      if(!Number.isFinite(d.obeliskWardCooldown))d.obeliskWardCooldown=0;
      if(!Number.isFinite(d.obeliskWardTimer))d.obeliskWardTimer=0;
    }
    if(version<57){
      if(!Number.isFinite(d.obeliskStrikeProcs))d.obeliskStrikeProcs=0;
      if(!Number.isFinite(d.obeliskStrikeKills))d.obeliskStrikeKills=0;
      if(!Number.isFinite(d.obeliskStrikeCooldown))d.obeliskStrikeCooldown=0;
    }
    if(version<58){
      if(!Number.isFinite(d.obeliskPotionUses))d.obeliskPotionUses=0;
      if(!Number.isFinite(d.obeliskPotionKills))d.obeliskPotionKills=0;
      if(!Number.isFinite(d.obeliskPotionTimer))d.obeliskPotionTimer=0;
    }
    if(version<71){
      if(!Number.isFinite(d.mirrorVeilProcs))d.mirrorVeilProcs=0;
      if(!Number.isFinite(d.mirrorVeilKills))d.mirrorVeilKills=0;
      if(!Number.isFinite(d.mirrorVeilCooldown))d.mirrorVeilCooldown=0;
    }
    if(version<70){
      if(!Number.isFinite(d.mirrorBladeProcs))d.mirrorBladeProcs=0;
      if(!Number.isFinite(d.mirrorBladeKills))d.mirrorBladeKills=0;
      if(!Number.isFinite(d.mirrorBladeCooldown))d.mirrorBladeCooldown=0;
    }
    if(version<69){
      if(!Number.isFinite(d.mirrorEchoProcs))d.mirrorEchoProcs=0;
      if(!Number.isFinite(d.mirrorEchoKills))d.mirrorEchoKills=0;
      if(!Number.isFinite(d.mirrorEchoCooldown))d.mirrorEchoCooldown=0;
    }
    if(version<68){
      if(!Number.isFinite(d.mirrorAssassinsSlain))d.mirrorAssassinsSlain=0;
    }
    if(version<67){
      if(!Number.isFinite(d.obeliskSentinelsSlain))d.obeliskSentinelsSlain=0;
    }
    if(version<66){
      if(!Number.isFinite(d.riftReaversSlain))d.riftReaversSlain=0;
    }
    if(version<65){
      if(!Number.isFinite(d.obeliskStormBossKills))d.obeliskStormBossKills=0;
    }
    if(version<64){
      if(!Number.isFinite(d.riftNovaBossKills))d.riftNovaBossKills=0;
    }
    if(version<63){
      if(!Number.isFinite(d.riftBladesCast))d.riftBladesCast=0;
      if(!Number.isFinite(d.riftBladeHits))d.riftBladeHits=0;
    }
    if(version<62){
      if(!Number.isFinite(d.riftGuardsCast))d.riftGuardsCast=0;
      if(!Number.isFinite(d.riftGuardHits))d.riftGuardHits=0;
    }
    if(version<61){
      if(!Number.isFinite(d.riftPotionUses))d.riftPotionUses=0;
      if(!Number.isFinite(d.riftPotionKills))d.riftPotionKills=0;
    }
    if(version<60){
      if(!Number.isFinite(d.riftAegisProcs))d.riftAegisProcs=0;
      if(!Number.isFinite(d.riftAegisKills))d.riftAegisKills=0;
      if(!Number.isFinite(d.riftAegisCooldown))d.riftAegisCooldown=0;
    }
    if(version<59){
      if(!Number.isFinite(d.riftSlashProcs))d.riftSlashProcs=0;
      if(!Number.isFinite(d.riftSlashKills))d.riftSlashKills=0;
      if(!Number.isFinite(d.riftSlashCooldown))d.riftSlashCooldown=0;
    }
    if(version<45){
      if(!Number.isFinite(d.riftBurstsCast))d.riftBurstsCast=0;
      if(!Number.isFinite(d.riftBurstHits))d.riftBurstHits=0;
    }
    if(version<46){
      if(!Number.isFinite(d.earthsplittersCast))d.earthsplittersCast=0;
      if(!Number.isFinite(d.earthsplitterHits))d.earthsplitterHits=0;
    }
    if(version<47){
      if(!Number.isFinite(d.voidstepCasts))d.voidstepCasts=0;
      if(!Number.isFinite(d.voidstepExecutes))d.voidstepExecutes=0;
    }
    if(version<48){
      if(!Number.isFinite(d.riftPulseProcs))d.riftPulseProcs=0;
      if(!Number.isFinite(d.riftPulseKills))d.riftPulseKills=0;
      if(!Number.isFinite(d.riftPulseCooldown))d.riftPulseCooldown=0;
    }
    if(version<49){
      if(!Number.isFinite(d.voidObelisksUsed))d.voidObelisksUsed=0;
      if(!Number.isFinite(d.obeliskBoons))d.obeliskBoons=0;
      if(!Number.isFinite(d.lastObeliskFloor))d.lastObeliskFloor=0;
    }
    if(version<50){
      if(!Number.isFinite(d.obeliskStormSurvived))d.obeliskStormSurvived=0;
    }
    if(version<11){
      if(!Number.isFinite(d.mirrorDashSurvived))d.mirrorDashSurvived=0;
    }
    if(version<43){
      if(!Number.isFinite(d.riftNovaSurvived))d.riftNovaSurvived=0;
    }
    if(version<12){
      if(!Number.isFinite(d.shadowAwakenings))d.shadowAwakenings=0;
    }
    if(version<13){
      if(!Number.isFinite(d.wellSustainBlessings))d.wellSustainBlessings=0;
      if(!Number.isFinite(d.wellSustainVictories))d.wellSustainVictories=0;
      if(!Number.isFinite(d.wellMercyCharges))d.wellMercyCharges=0;
      if(!Number.isFinite(d.wellSustainTimer))d.wellSustainTimer=0;
    }
    if(version<14){
      if(!Number.isFinite(d.wellSustainVictories))d.wellSustainVictories=0;
    }
    if(version<15){
      if(!Number.isFinite(d.beamImpacts))d.beamImpacts=0;
    }
    if(version<16){
      if(!Number.isFinite(d.shadowstepFinishes))d.shadowstepFinishes=0;
    }
    if(version<17){
      if(!Number.isFinite(d.mirrorDashBossKills))d.mirrorDashBossKills=0;
    }
    if(version<18){
      if(!Number.isFinite(d.bossLegendaryDrops))d.bossLegendaryDrops=0;
    }
    if(version<19){
      if(!Number.isFinite(d.potionsUsed))d.potionsUsed=0;
      if(!Number.isFinite(d.flawlessVictories))d.flawlessVictories=0;
    }
    if(version<20){
      if(!Number.isFinite(d.shopPurchases))d.shopPurchases=0;
    }
    if(version<21){
      if(!Number.isFinite(d.shopSales))d.shopSales=0;
    }
    if(version<22){
      if(!Number.isFinite(d.chestsOpened))d.chestsOpened=0;
    }
    if(version<23){
      if(!Number.isFinite(d.shrineUses))d.shrineUses=0;
    }
    if(version<24){
      if(!Number.isFinite(d.stairsDescended))d.stairsDescended=0;
    }
    if(version<25){
      if(!Number.isFinite(d.levelUpsGained))d.levelUpsGained=0;
    }
    if(version<26){
      if(!Number.isFinite(d.spellsCast))d.spellsCast=0;
    }
    if(version<27){
      if(!Number.isFinite(d.meleeHits))d.meleeHits=0;
    }
    if(version<28){
      if(!Number.isFinite(d.specialAttacksUsed))d.specialAttacksUsed=0;
    }
    if(version<29){
      if(!Number.isFinite(d.dodgesPerformed))d.dodgesPerformed=0;
    }
    if(version<30){
      if(!Number.isFinite(d.meleeCrits))d.meleeCrits=0;
    }
    if(version<31){
      if(!Number.isFinite(d.rangedHits))d.rangedHits=0;
    }
    if(version<32){
      if(!Number.isFinite(d.enemyProjectileHitsTaken))d.enemyProjectileHitsTaken=0;
    }
    if(version<33){
      if(!Number.isFinite(d.eliteKills))d.eliteKills=0;
    }
    if(version<34){
      if(!Number.isFinite(d.itemsPickedUp))d.itemsPickedUp=0;
    }
    if(version<35){
      if(!Number.isFinite(d.goldPickups))d.goldPickups=0;
    }
    if(version<36){
      if(!Number.isFinite(d.hazardHitsTaken))d.hazardHitsTaken=0;
    }
    if(version<37){
      if(!Number.isFinite(d.hitsTaken))d.hitsTaken=0;
    }
    if(version<38){
      if(!Number.isFinite(d.ringEquips))d.ringEquips=0;
    }
    if(version<39){
      if(!Number.isFinite(d.weaponEquips))d.weaponEquips=0;
    }
    if(version<40){
      if(!Number.isFinite(d.armorEquips))d.armorEquips=0;
    }
    if(version<41){
      if(!Number.isFinite(d.itemsDropped))d.itemsDropped=0;
    }
    if(version<42){
      if(!Number.isFinite(d.abyssRiftsUsed))d.abyssRiftsUsed=0;
      if(!Number.isFinite(d.riftEmpowerments))d.riftEmpowerments=0;
      if(!Number.isFinite(d.lastRiftFloor))d.lastRiftFloor=0;
    }
  },

  _migrateSaveData(rawSave){
    const d={...rawSave};
    const version=this._normalizeSaveVersion(d.version);
    this._applySaveBaseDefaults(d);
    this._applySaveVersionMigrations(d,version);

    d.version=SAVE_SCHEMA_VERSION;
    return d;
  },

  _restoreAchievementState(achievementsData){
    if(Array.isArray(achievementsData)){
      const achState=new Map(achievementsData.map(a=>[a.id,!!a.done]));
      for(const ach of Achievements.list)ach.done=!!achState.get(ach.id);
      return;
    }
    Achievements.reset();
  },

  _ensureRuntimeCanvasReady(){
    if(this.canvas)return;
    this.canvas=document.getElementById('gameCanvas');
    this.ctx=this.canvas.getContext('2d');
    this.miniCanvas=document.getElementById('minimap');
    this.miniCtx=this.miniCanvas.getContext('2d');
    this.resize();
    window.addEventListener('resize',()=>this.resize());
    this.initInput();
  },

  _hideRuntimeScreens(){
    document.getElementById('title-screen').style.display='none';
    document.getElementById('death-screen').style.display='none';
    document.getElementById('win-screen').style.display='none';
    document.getElementById('settings-panel').classList.remove('open');
  },

  _safeRunInt(value){
    return Number.isFinite(value)?Math.max(0,Math.floor(value)):0;
  },

  _restoreRunStateFromSave(saveData,loadedClass){
    this.floor=Number.isFinite(saveData.floor)?Util.clamp(Math.floor(saveData.floor),1,MAX_FLOOR):1;
    this.totalKills=this._safeRunInt(saveData.totalKills);
    this.totalGold=this._safeRunInt(saveData.totalGold);
    this.gameTime=Number.isFinite(saveData.gameTime)?Math.max(0,saveData.gameTime):0;
    this.playerClass=loadedClass;
    this._bossKills=this._safeRunInt(saveData.bossKills);
    this._maxCombo=this._safeRunInt(saveData.maxCombo);
    this._mysticEvents=this._safeRunInt(saveData.mysticEvents);
    this._shadowWellsUsed=this._safeRunInt(saveData.shadowWellsUsed);
    this._echoVisions=this._safeRunInt(saveData.echoVisions);
    this._shadowDances=this._safeRunInt(saveData.shadowDances);
    this._wellEchoes=this._safeRunInt(saveData.wellEchoes);
    this._mirageElitesSlain=this._safeRunInt(saveData.mirageElitesSlain);
    this._mirrorExecutorsSlain=this._safeRunInt(saveData.mirrorExecutorsSlain);
    this._mirrorAssassinsSlain=this._safeRunInt(saveData.mirrorAssassinsSlain);
    this._mirrorPriestessesSlain=this._safeRunInt(saveData.mirrorPriestessesSlain);
    this._mirrorHeraldsSlain=this._safeRunInt(saveData.mirrorHeraldsSlain);
    this._mirrorLancersSlain=this._safeRunInt(saveData.mirrorLancersSlain);
    this._mirrorWeaversSlain=this._safeRunInt(saveData.mirrorWeaversSlain);
    this._riftboundElitesSlain=this._safeRunInt(saveData.riftboundElitesSlain);
    this._riftReaversSlain=this._safeRunInt(saveData.riftReaversSlain);
    this._riftSowersSlain=this._safeRunInt(saveData.riftSowersSlain);
    this._obeliskboundElitesSlain=this._safeRunInt(saveData.obeliskboundElitesSlain);
    this._obeliskSentinelsSlain=this._safeRunInt(saveData.obeliskSentinelsSlain);
    this._obeliskAugursSlain=this._safeRunInt(saveData.obeliskAugursSlain);
    this._riftBurstsCast=this._safeRunInt(saveData.riftBurstsCast);
    this._riftBurstHits=this._safeRunInt(saveData.riftBurstHits);
    this._riftGuardsCast=this._safeRunInt(saveData.riftGuardsCast);
    this._riftGuardHits=this._safeRunInt(saveData.riftGuardHits);
    this._riftBladesCast=this._safeRunInt(saveData.riftBladesCast);
    this._riftBladeHits=this._safeRunInt(saveData.riftBladeHits);
    this._obeliskLancesCast=this._safeRunInt(saveData.obeliskLancesCast);
    this._obeliskLanceHits=this._safeRunInt(saveData.obeliskLanceHits);
    this._obeliskCrashesCast=this._safeRunInt(saveData.obeliskCrashesCast);
    this._obeliskCrashHits=this._safeRunInt(saveData.obeliskCrashHits);
    this._obeliskFansCast=this._safeRunInt(saveData.obeliskFansCast);
    this._obeliskFanHits=this._safeRunInt(saveData.obeliskFanHits);
    this._earthsplittersCast=this._safeRunInt(saveData.earthsplittersCast);
    this._earthsplitterHits=this._safeRunInt(saveData.earthsplitterHits);
    this._teleportsCast=this._safeRunInt(saveData.teleportsCast);
    this._teleportDistance=Number.isFinite(saveData.teleportDistance)?Math.max(0,saveData.teleportDistance):0;
    this._stealthCasts=this._safeRunInt(saveData.stealthCasts);
    this._stealthSeconds=Number.isFinite(saveData.stealthSeconds)?Math.max(0,saveData.stealthSeconds):0;
    this._rageCasts=this._safeRunInt(saveData.rageCasts);
    this._rageSeconds=Number.isFinite(saveData.rageSeconds)?Math.max(0,saveData.rageSeconds):0;
    this._shieldAoeCasts=this._safeRunInt(saveData.shieldAoeCasts);
    this._shieldAoeHits=this._safeRunInt(saveData.shieldAoeHits);
    this._fireballCasts=this._safeRunInt(saveData.fireballCasts);
    this._fireballHits=this._safeRunInt(saveData.fireballHits);
    this._chainCasts=this._safeRunInt(saveData.chainCasts);
    this._chainHits=this._safeRunInt(saveData.chainHits);
    this._beamCasts=this._safeRunInt(saveData.beamCasts);
    this._voidstepCasts=this._safeRunInt(saveData.voidstepCasts);
    this._voidstepExecutes=this._safeRunInt(saveData.voidstepExecutes);
    this._mirrorBladeProcs=this._safeRunInt(saveData.mirrorBladeProcs);
    this._mirrorBladeKills=this._safeRunInt(saveData.mirrorBladeKills);
    this._mirrorBladeCooldown=Number.isFinite(saveData.mirrorBladeCooldown)?Math.max(0,saveData.mirrorBladeCooldown):0;
    this._mirrorVeilProcs=this._safeRunInt(saveData.mirrorVeilProcs);
    this._mirrorVeilKills=this._safeRunInt(saveData.mirrorVeilKills);
    this._mirrorVeilCooldown=Number.isFinite(saveData.mirrorVeilCooldown)?Math.max(0,saveData.mirrorVeilCooldown):0;
    this._mirrorEchoProcs=this._safeRunInt(saveData.mirrorEchoProcs);
    this._mirrorEchoKills=this._safeRunInt(saveData.mirrorEchoKills);
    this._mirrorEchoCooldown=Number.isFinite(saveData.mirrorEchoCooldown)?Math.max(0,saveData.mirrorEchoCooldown):0;
    this._mirrorPotionUses=this._safeRunInt(saveData.mirrorPotionUses);
    this._mirrorPotionKills=this._safeRunInt(saveData.mirrorPotionKills);
    this._mirrorPotionTimer=Number.isFinite(saveData.mirrorPotionTimer)?Math.max(0,saveData.mirrorPotionTimer):0;
    if(this._mirrorPotionTimer>0){
      this.player.critChance+=.08;
      if(!this.player.talents)this.player.talents={};
      this.player.talents.dodge=(this.player.talents.dodge||0)+.08;
      this.player.buffs.push({type:'mirage',critValue:.08,dodgeValue:.08,duration:this._mirrorPotionTimer});
    }
    this._riftPulseProcs=this._safeRunInt(saveData.riftPulseProcs);
    this._riftPulseKills=this._safeRunInt(saveData.riftPulseKills);
    this._riftPulseCooldown=Number.isFinite(saveData.riftPulseCooldown)?Math.max(0,saveData.riftPulseCooldown):0;
    this._riftAegisProcs=this._safeRunInt(saveData.riftAegisProcs);
    this._riftAegisKills=this._safeRunInt(saveData.riftAegisKills);
    this._riftAegisCooldown=Number.isFinite(saveData.riftAegisCooldown)?Math.max(0,saveData.riftAegisCooldown):0;
    this._riftPotionUses=this._safeRunInt(saveData.riftPotionUses);
    this._riftPotionKills=this._safeRunInt(saveData.riftPotionKills);
    this._riftSlashProcs=this._safeRunInt(saveData.riftSlashProcs);
    this._riftSlashKills=this._safeRunInt(saveData.riftSlashKills);
    this._riftSlashCooldown=Number.isFinite(saveData.riftSlashCooldown)?Math.max(0,saveData.riftSlashCooldown):0;
    this._obeliskEchoProcs=this._safeRunInt(saveData.obeliskEchoProcs);
    this._obeliskEchoKills=this._safeRunInt(saveData.obeliskEchoKills);
    this._obeliskEchoCooldown=Number.isFinite(saveData.obeliskEchoCooldown)?Math.max(0,saveData.obeliskEchoCooldown):0;
    this._obeliskWardProcs=this._safeRunInt(saveData.obeliskWardProcs);
    this._obeliskWardKills=this._safeRunInt(saveData.obeliskWardKills);
    this._obeliskWardCooldown=Number.isFinite(saveData.obeliskWardCooldown)?Math.max(0,saveData.obeliskWardCooldown):0;
    this._obeliskWardTimer=Number.isFinite(saveData.obeliskWardTimer)?Math.max(0,saveData.obeliskWardTimer):0;
    this._obeliskStrikeProcs=this._safeRunInt(saveData.obeliskStrikeProcs);
    this._obeliskStrikeKills=this._safeRunInt(saveData.obeliskStrikeKills);
    this._obeliskStrikeCooldown=Number.isFinite(saveData.obeliskStrikeCooldown)?Math.max(0,saveData.obeliskStrikeCooldown):0;
    this._obeliskPotionUses=this._safeRunInt(saveData.obeliskPotionUses);
    this._obeliskPotionKills=this._safeRunInt(saveData.obeliskPotionKills);
    this._obeliskPotionTimer=Number.isFinite(saveData.obeliskPotionTimer)?Math.max(0,saveData.obeliskPotionTimer):0;
    if(this._obeliskPotionTimer>0){
      this.player.atk+=6;
      this.player.def+=6;
      this.player.buffs.push({type:'obelisk',atkValue:6,defValue:6,duration:this._obeliskPotionTimer});
    }
    this._mirrorDashSurvived=this._safeRunInt(saveData.mirrorDashSurvived);
    this._riftNovaSurvived=this._safeRunInt(saveData.riftNovaSurvived);
    this._obeliskStormSurvived=this._safeRunInt(saveData.obeliskStormSurvived);
    this._shadowAwakenings=this._safeRunInt(saveData.shadowAwakenings);
    this._wellSustainBlessings=this._safeRunInt(saveData.wellSustainBlessings);
    this._wellSustainVictories=this._safeRunInt(saveData.wellSustainVictories);
    this._beamImpacts=this._safeRunInt(saveData.beamImpacts);
    this._backstabCasts=this._safeRunInt(saveData.backstabCasts);
    this._backstabKills=this._safeRunInt(saveData.backstabKills);
    this._shadowstepCasts=this._safeRunInt(saveData.shadowstepCasts);
    this._shadowstepFinishes=this._safeRunInt(saveData.shadowstepFinishes);
    this._mirrorDashBossKills=this._safeRunInt(saveData.mirrorDashBossKills);
    this._riftNovaBossKills=this._safeRunInt(saveData.riftNovaBossKills);
    this._obeliskStormBossKills=this._safeRunInt(saveData.obeliskStormBossKills);
    this._bossLegendaryDrops=this._safeRunInt(saveData.bossLegendaryDrops);
    this._potionsUsed=this._safeRunInt(saveData.potionsUsed);
    this._flawlessVictories=this._safeRunInt(saveData.flawlessVictories);
    this._shopPurchases=this._safeRunInt(saveData.shopPurchases);
    this._shopSales=this._safeRunInt(saveData.shopSales);
    this._chestsOpened=this._safeRunInt(saveData.chestsOpened);
    this._shrineUses=this._safeRunInt(saveData.shrineUses);
    this._stairsDescended=this._safeRunInt(saveData.stairsDescended);
    this._levelUpsGained=this._safeRunInt(saveData.levelUpsGained);
    this._spellsCast=this._safeRunInt(saveData.spellsCast);
    this._meleeHits=this._safeRunInt(saveData.meleeHits);
    this._specialAttacksUsed=this._safeRunInt(saveData.specialAttacksUsed);
    this._dodgesPerformed=this._safeRunInt(saveData.dodgesPerformed);
    this._meleeCrits=this._safeRunInt(saveData.meleeCrits);
    this._rangedHits=this._safeRunInt(saveData.rangedHits);
    this._enemyProjectileHitsTaken=this._safeRunInt(saveData.enemyProjectileHitsTaken);
    this._eliteKills=this._safeRunInt(saveData.eliteKills);
    this._itemsPickedUp=this._safeRunInt(saveData.itemsPickedUp);
    this._goldPickups=this._safeRunInt(saveData.goldPickups);
    this._hazardHitsTaken=this._safeRunInt(saveData.hazardHitsTaken);
    this._hitsTaken=this._safeRunInt(saveData.hitsTaken);
    this._ringEquips=this._safeRunInt(saveData.ringEquips);
    this._weaponEquips=this._safeRunInt(saveData.weaponEquips);
    this._armorEquips=this._safeRunInt(saveData.armorEquips);
    this._itemsDropped=this._safeRunInt(saveData.itemsDropped);
    this._abyssRiftsUsed=this._safeRunInt(saveData.abyssRiftsUsed);
    this._riftEmpowerments=this._safeRunInt(saveData.riftEmpowerments);
    this._voidObelisksUsed=this._safeRunInt(saveData.voidObelisksUsed);
    this._obeliskBoons=this._safeRunInt(saveData.obeliskBoons);
    this._wellMercyCharges=this._safeRunInt(saveData.wellMercyCharges);
    this._wellSustainTimer=Number.isFinite(saveData.wellSustainTimer)?Math.max(0,saveData.wellSustainTimer):0;
    this._lastRelicFloor=this._safeRunInt(saveData.lastRelicFloor);
    this._lastWellFloor=this._safeRunInt(saveData.lastWellFloor);
    this._lastRiftFloor=this._safeRunInt(saveData.lastRiftFloor);
    this._lastObeliskFloor=this._safeRunInt(saveData.lastObeliskFloor);
    this._restoreAchievementState(saveData.achievements);
  },

  _validateSaveMapData(saveData){
    if(!Array.isArray(saveData.map)||saveData.map.length!==MAP_H||!Array.isArray(saveData.explored)||saveData.explored.length!==MAP_H){
      throw new Error('Uszkodzone dane mapy w zapisie');
    }
    for(let y=0;y<MAP_H;y++){
      if(!saveData.map[y]||saveData.map[y].length!==MAP_W||!saveData.explored[y]||saveData.explored[y].length!==MAP_W){
        throw new Error('Uszkodzone wiersze mapy w zapisie');
      }
    }
  },

  _restoreDungeonFromSave(saveData){
    this.dungeon=new DungeonGenerator(MAP_W,MAP_H,this.floor);
    for(let y=0;y<MAP_H;y++){
      this.dungeon.map[y]=new Uint8Array(saveData.map[y]);
      this.dungeon.explored[y]=new Uint8Array(saveData.explored[y]);
    }
    this.dungeon.rooms=Array.isArray(saveData.rooms)?saveData.rooms:[];
    this.dungeon.lightSources=Array.isArray(saveData.lightSources)?saveData.lightSources:[];
    this.dungeon.bloodStains=Array.isArray(saveData.bloodStains)?saveData.bloodStains:[];
  },

  _restorePlayerFromSave(saveData,loadedClass){
    this.initPlayer(loadedClass);
    Object.assign(this.player,saveData.player);
    this._normalizeInventory();
    this.player.spells=ContentRegistry.getClassSpells(loadedClass).map(s=>({...s}));
    this.player.buffs=[];
    this.player.stealthTimer=0;
    this.player.rageTimer=0;
    this.player.iFrames=0;
    this.player.attackTimer=0;
    if(saveData.player.talents)this.player.talents={...this.player.talents,...saveData.player.talents};
    if(!Array.isArray(this.player.relics))this.player.relics=[];
  },

  _restoreEntitiesFromSave(saveData){
    const loadedEnemies=Array.isArray(saveData.enemies)?saveData.enemies:[];
    this.enemies=loadedEnemies.map(e=>({
      ...e,
      pathTimer:0,path:[],alertTimer:0,animTimer:0,hitFlash:0,
      attackTimer:0,abilityTimer:3,patrolTarget:null,
    }));
    this.items=Array.isArray(saveData.items)?saveData.items:[];
    this.projectiles=[];
  },

  _refreshRuntimeUiAfterLoad(){
    this.initSpellBar();
    this._ensureHudRefs();
    this._resetUICaches();
    FOV.compute(this.dungeon,Math.floor(this.player.x+.5),Math.floor(this.player.y+.5),FOV_RADIUS);
    document.getElementById('message-log').innerHTML='';
  },

  _notifyLoadSuccess(slot){
    this.log(`📂 Gra wczytana (Slot ${slot})`,'info');
    this._showToast(`📂 Wczytano slot ${slot}`);
  },

  _finalizeLoadUI(slot){
    this._refreshRuntimeUiAfterLoad();
    this._notifyLoadSuccess(slot);
  },

  _getSaveInfo(slot){
    if(!this._isValidSaveSlot(slot))return null;
    try{
      const raw=localStorage.getItem('dos_save_'+slot);
      if(!raw)return null;
      const d=JSON.parse(raw);
      const player=d&&typeof d==='object'?d.player:null;
      if(!player||typeof player!=='object')return null;
      return{
        className:player.className||'Nieznana',
        level:Number.isFinite(player.level)?player.level:1,
        floor:Number.isFinite(d.floor)?d.floor:1,
        gold:Number.isFinite(player.gold)?player.gold:0,
        date:d.saveDate||'?'
      };
    }catch(e){return null;}
  },

  _buildSavePlayerState(){
    return{
      x:this.player.x,y:this.player.y,
      hp:this.player.hp,maxHp:this.player.maxHp,
      mp:this.player.mp,maxMp:this.player.maxMp,
      atk:this.player.atk,def:this.player.def,
      speed:this.player.speed,
      critChance:this.player.critChance,critMult:this.player.critMult,
      level:this.player.level,xp:this.player.xp,xpToLevel:this.player.xpToLevel,
      gold:this.player.gold,
      inventory:this.player.inventory,
      equipment:this.player.equipment,
      class:this.player.class,
      className:this.player.className,
      attackCd:this.player.attackCd,
      talents:this.player.talents||{},
      relics:this.player.relics||[],
    };
  },

  _buildSaveEnemyState(e){
    return{
      name:e.name,icon:e.icon,hp:e.hp,maxHp:e.maxHp,atk:e.atk,def:e.def,
      xp:e.xp,gold:e.gold,speed:e.speed,ai:e.ai,color:e.color,
      x:e.x,y:e.y,id:e.id,isBoss:e.isBoss,
      abilities:e.abilities||[],phase:e.phase||1,
      ranged:e.ranged||false,alerted:e.alerted,
      attackCd:e.attackCd,
      burnTimer:e.burnTimer,freezeTimer:e.freezeTimer,poisonTimer:e.poisonTimer,
      stunTimer:e.stunTimer,
    };
  },

  _buildSaveRunMeta(){
    return{
      floor:this.floor,
      totalKills:this.totalKills,
      totalGold:this.totalGold,
      gameTime:this.gameTime,
      playerClass:this.playerClass,
      bossKills:this._bossKills||0,
      maxCombo:this._maxCombo||0,
      mysticEvents:this._mysticEvents||0,
      shadowWellsUsed:this._shadowWellsUsed||0,
      echoVisions:this._echoVisions||0,
      shadowDances:this._shadowDances||0,
      wellEchoes:this._wellEchoes||0,
      mirageElitesSlain:this._mirageElitesSlain||0,
      mirrorExecutorsSlain:this._mirrorExecutorsSlain||0,
      mirrorAssassinsSlain:this._mirrorAssassinsSlain||0,
      mirrorPriestessesSlain:this._mirrorPriestessesSlain||0,
      mirrorHeraldsSlain:this._mirrorHeraldsSlain||0,
      mirrorLancersSlain:this._mirrorLancersSlain||0,
      mirrorWeaversSlain:this._mirrorWeaversSlain||0,
      riftboundElitesSlain:this._riftboundElitesSlain||0,
      riftReaversSlain:this._riftReaversSlain||0,
      riftSowersSlain:this._riftSowersSlain||0,
      obeliskboundElitesSlain:this._obeliskboundElitesSlain||0,
      obeliskSentinelsSlain:this._obeliskSentinelsSlain||0,
      obeliskAugursSlain:this._obeliskAugursSlain||0,
      riftBurstsCast:this._riftBurstsCast||0,
      riftBurstHits:this._riftBurstHits||0,
      riftGuardsCast:this._riftGuardsCast||0,
      riftGuardHits:this._riftGuardHits||0,
      riftBladesCast:this._riftBladesCast||0,
      riftBladeHits:this._riftBladeHits||0,
      obeliskLancesCast:this._obeliskLancesCast||0,
      obeliskLanceHits:this._obeliskLanceHits||0,
      obeliskCrashesCast:this._obeliskCrashesCast||0,
      obeliskCrashHits:this._obeliskCrashHits||0,
      obeliskFansCast:this._obeliskFansCast||0,
      obeliskFanHits:this._obeliskFanHits||0,
      earthsplittersCast:this._earthsplittersCast||0,
      earthsplitterHits:this._earthsplitterHits||0,
      teleportsCast:this._teleportsCast||0,
      teleportDistance:this._teleportDistance||0,
      stealthCasts:this._stealthCasts||0,
      stealthSeconds:this._stealthSeconds||0,
      rageCasts:this._rageCasts||0,
      rageSeconds:this._rageSeconds||0,
      shieldAoeCasts:this._shieldAoeCasts||0,
      shieldAoeHits:this._shieldAoeHits||0,
      fireballCasts:this._fireballCasts||0,
      fireballHits:this._fireballHits||0,
      chainCasts:this._chainCasts||0,
      chainHits:this._chainHits||0,
      beamCasts:this._beamCasts||0,
      voidstepCasts:this._voidstepCasts||0,
      voidstepExecutes:this._voidstepExecutes||0,
      mirrorBladeProcs:this._mirrorBladeProcs||0,
      mirrorBladeKills:this._mirrorBladeKills||0,
      mirrorBladeCooldown:this._mirrorBladeCooldown||0,
      mirrorVeilProcs:this._mirrorVeilProcs||0,
      mirrorVeilKills:this._mirrorVeilKills||0,
      mirrorVeilCooldown:this._mirrorVeilCooldown||0,
      mirrorEchoProcs:this._mirrorEchoProcs||0,
      mirrorEchoKills:this._mirrorEchoKills||0,
      mirrorEchoCooldown:this._mirrorEchoCooldown||0,
      mirrorPotionUses:this._mirrorPotionUses||0,
      mirrorPotionKills:this._mirrorPotionKills||0,
      mirrorPotionTimer:this._mirrorPotionTimer||0,
      riftPulseProcs:this._riftPulseProcs||0,
      riftPulseKills:this._riftPulseKills||0,
      riftPulseCooldown:this._riftPulseCooldown||0,
      riftAegisProcs:this._riftAegisProcs||0,
      riftAegisKills:this._riftAegisKills||0,
      riftAegisCooldown:this._riftAegisCooldown||0,
      riftPotionUses:this._riftPotionUses||0,
      riftPotionKills:this._riftPotionKills||0,
      riftSlashProcs:this._riftSlashProcs||0,
      riftSlashKills:this._riftSlashKills||0,
      riftSlashCooldown:this._riftSlashCooldown||0,
      obeliskEchoProcs:this._obeliskEchoProcs||0,
      obeliskEchoKills:this._obeliskEchoKills||0,
      obeliskEchoCooldown:this._obeliskEchoCooldown||0,
      obeliskWardProcs:this._obeliskWardProcs||0,
      obeliskWardKills:this._obeliskWardKills||0,
      obeliskWardCooldown:this._obeliskWardCooldown||0,
      obeliskWardTimer:this._obeliskWardTimer||0,
      obeliskStrikeProcs:this._obeliskStrikeProcs||0,
      obeliskStrikeKills:this._obeliskStrikeKills||0,
      obeliskStrikeCooldown:this._obeliskStrikeCooldown||0,
      obeliskPotionUses:this._obeliskPotionUses||0,
      obeliskPotionKills:this._obeliskPotionKills||0,
      obeliskPotionTimer:this._obeliskPotionTimer||0,
      mirrorDashSurvived:this._mirrorDashSurvived||0,
      riftNovaSurvived:this._riftNovaSurvived||0,
      obeliskStormSurvived:this._obeliskStormSurvived||0,
      shadowAwakenings:this._shadowAwakenings||0,
      wellSustainBlessings:this._wellSustainBlessings||0,
      wellSustainVictories:this._wellSustainVictories||0,
      beamImpacts:this._beamImpacts||0,
      backstabCasts:this._backstabCasts||0,
      backstabKills:this._backstabKills||0,
      shadowstepCasts:this._shadowstepCasts||0,
      shadowstepFinishes:this._shadowstepFinishes||0,
      mirrorDashBossKills:this._mirrorDashBossKills||0,
      riftNovaBossKills:this._riftNovaBossKills||0,
      obeliskStormBossKills:this._obeliskStormBossKills||0,
      bossLegendaryDrops:this._bossLegendaryDrops||0,
      potionsUsed:this._potionsUsed||0,
      flawlessVictories:this._flawlessVictories||0,
      shopPurchases:this._shopPurchases||0,
      shopSales:this._shopSales||0,
      chestsOpened:this._chestsOpened||0,
      shrineUses:this._shrineUses||0,
      stairsDescended:this._stairsDescended||0,
      levelUpsGained:this._levelUpsGained||0,
      spellsCast:this._spellsCast||0,
      meleeHits:this._meleeHits||0,
      specialAttacksUsed:this._specialAttacksUsed||0,
      dodgesPerformed:this._dodgesPerformed||0,
      meleeCrits:this._meleeCrits||0,
      rangedHits:this._rangedHits||0,
      enemyProjectileHitsTaken:this._enemyProjectileHitsTaken||0,
      eliteKills:this._eliteKills||0,
      itemsPickedUp:this._itemsPickedUp||0,
      goldPickups:this._goldPickups||0,
      hazardHitsTaken:this._hazardHitsTaken||0,
      hitsTaken:this._hitsTaken||0,
      ringEquips:this._ringEquips||0,
      weaponEquips:this._weaponEquips||0,
      armorEquips:this._armorEquips||0,
      itemsDropped:this._itemsDropped||0,
      abyssRiftsUsed:this._abyssRiftsUsed||0,
      riftEmpowerments:this._riftEmpowerments||0,
      voidObelisksUsed:this._voidObelisksUsed||0,
      obeliskBoons:this._obeliskBoons||0,
      wellMercyCharges:this._wellMercyCharges||0,
      wellSustainTimer:this._wellSustainTimer||0,
      lastRelicFloor:this._lastRelicFloor||0,
      lastWellFloor:this._lastWellFloor||0,
      lastRiftFloor:this._lastRiftFloor||0,
      lastObeliskFloor:this._lastObeliskFloor||0,
    };
  },

  _buildSaveDungeonSnapshot(){
    return{
      map:Array.from({length:MAP_H},(_,y)=>Array.from(this.dungeon.map[y])),
      explored:Array.from({length:MAP_H},(_,y)=>Array.from(this.dungeon.explored[y])),
      rooms:this.dungeon.rooms,
      lightSources:this.dungeon.lightSources,
      bloodStains:this.dungeon.bloodStains,
      enemies:this.enemies.map(e=>this._buildSaveEnemyState(e)),
      items:this.items,
    };
  },

  _buildSaveObject(){
    const runMeta=this._buildSaveRunMeta();
    const dungeonSnapshot=this._buildSaveDungeonSnapshot();
    return{
      version:SAVE_SCHEMA_VERSION,
      gameVersion:GAME_VERSION,
      saveCompatTag:SAVE_COMPAT_TAG,
      saveDate:new Date().toLocaleString('pl-PL'),
      ...runMeta,
      achievements:Achievements.list.map(a=>({id:a.id,done:!!a.done})),
      player:this._buildSavePlayerState(),
      ...dungeonSnapshot,
      shopStock:this.shopStock||null,
    };
  },

  _refreshSettingsIfOpen(){
    if(document.getElementById('settings-panel').classList.contains('open'))this._renderSettings();
  },

  _notifySaveSuccess(slot){
    this._showToast(`💾 Gra zapisana w slocie ${slot}`);
    this.log(`💾 Gra zapisana (Slot ${slot})`,'info');
  },

  _finalizeSaveSuccess(slot){
    this._notifySaveSuccess(slot);
    this._refreshSettingsIfOpen();
  },
  
  saveGame(slot){
    if(!this._isValidSaveSlot(slot)){this._showToast('Nieprawidłowy slot zapisu!','#f44');return;}
    if(!this.running&&!this.paused){this._showToast('Nie można zapisać!','#f44');return;}
    try{
      const saveObj=this._buildSaveObject();
      localStorage.setItem('dos_save_'+slot,JSON.stringify(saveObj));
      this._finalizeSaveSuccess(slot);
    }catch(e){
      this._showToast('Błąd zapisu: '+e.message,'#f44');
    }
  },

  _parseSaveRawData(slot){
    const raw=localStorage.getItem('dos_save_'+slot);
    if(!raw)return null;
    return JSON.parse(raw);
  },

  _assertSaveVersionSupported(parsed){
    const parsedVersion=Number.isFinite(parsed&&parsed.version)?Math.floor(parsed.version):1;
    const compatTag=(parsed&&typeof parsed.saveCompatTag==='string')?parsed.saveCompatTag:'';
    if(compatTag!==SAVE_COMPAT_TAG){
      throw new Error(`Zapis nie jest zgodny z linią ${GAME_VERSION}. Wersja 2.0 używa nowego formatu save.`);
    }
    if(parsedVersion!==SAVE_SCHEMA_VERSION){
      throw new Error(`Niezgodna wersja zapisu (save v${parsedVersion}, gra v${SAVE_SCHEMA_VERSION})`);
    }
  },

  _assertSaveDataShapeValid(saveData){
    if(!saveData||typeof saveData!=='object'||!saveData.player||typeof saveData.player!=='object'){
      throw new Error('Nieprawidłowy format zapisu');
    }
  },

  _readAndValidateSaveData(slot){
    const parsed=this._parseSaveRawData(slot);
    if(!parsed)return null;
    this._assertSaveVersionSupported(parsed);
    const d=this._migrateSaveData(parsed);
    this._assertSaveDataShapeValid(d);
    this._validateSaveMapData(d);
    return d;
  },

  _resolveLoadedClassFromSave(d){
    return(d.playerClass&&ContentRegistry.hasClassSpells(d.playerClass))
      ?d.playerClass
      :((d.player.class&&ContentRegistry.hasClassSpells(d.player.class))?d.player.class:'warrior');
  },

  _startGameLoopFromNow(){
    this.running=true;
    this.lastTime=performance.now();
    requestAnimationFrame(t=>this.loop(t));
  },

  _ensureGameLoopRunning(){
    if(this.running)return;
    this._startGameLoopFromNow();
  },

  _restoreGameFromSaveData(saveData,loadedClass,slot){
    this._ensureRuntimeCanvasReady();
    this._hideRuntimeScreens();
    this._restoreRunStateFromSave(saveData,loadedClass);
    this._restorePlayerFromSave(saveData,loadedClass);
    this.shopStock=saveData.shopStock||null;
    this._restoreDungeonFromSave(saveData);
    this._restoreEntitiesFromSave(saveData);
    this._finalizeLoadUI(slot);
  },

  _resumeAfterLoad(){
    this.paused=false;
    this._ensureGameLoopRunning();
  },

  _finalizeLoadFromSaveData(saveData,slot){
    const loadedClass=this._resolveLoadedClassFromSave(saveData);
    this._restoreGameFromSaveData(saveData,loadedClass,slot);
    this._resumeAfterLoad();
  },

  _guardValidLoadSlot(slot){
    if(this._isValidSaveSlot(slot))return true;
    this._showToast('Nieprawidłowy slot zapisu!','#f44');
    return false;
  },

  _guardNonEmptyLoadData(saveData){
    if(saveData)return true;
    this._showToast('Slot pusty!','#f88');
    return false;
  },
  
  loadGame(slot){
    if(!this._guardValidLoadSlot(slot))return;
    try{
      const d=this._readAndValidateSaveData(slot);
      if(!this._guardNonEmptyLoadData(d))return;
      this._finalizeLoadFromSaveData(d,slot);
    }catch(e){
      this._showToast('Błąd wczytywania: '+e.message,'#f44');
      console.error('Load error:',e);
    }
  },

  _removeSaveSlot(slot){
    localStorage.removeItem('dos_save_'+slot);
  },

  _notifySaveDeleted(slot){
    this._renderSettings();
    this._showToast(`Usunięto zapis ze slotu ${slot}`,'#f88');
  },
  
  deleteSave(slot){
    this._removeSaveSlot(slot);
    this._notifySaveDeleted(slot);
  },

  _getQuickSlotNumber(){
    return 1;
  },

  _runQuickSlotAction(action){
    const slot=this._getQuickSlotNumber();
    if(action==='save')this.saveGame(slot);
    else if(action==='load')this.loadGame(slot);
  },
  
  quickSave(){
    this._runQuickSlotAction('save');
  },
  
  quickLoad(){
    this._runQuickSlotAction('load');
  },

});
