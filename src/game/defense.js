'use strict';
Object.assign(Game, {
  _tryPlayerDodge(){
    const p=this.player;
    if(!(p.talents&&p.talents.dodge>0&&Util.chance(p.talents.dodge)))return false;
    this._dodgesPerformed=(this._dodgesPerformed||0)+1;
    this.floatingText.add(p.x+.5,p.y,'UNIK!','#8f8');
    this.log('💨 Uniknąłeś ataku!','info');
    Achievements.checkAll(this);
    return true;
  },

  _applyPlayerManaShields(dmg){
    const p=this.player;
    const armor=p.equipment.armor;
    if(armor&&armor.effect==='manaShield'&&p.mp>0){
      const absorbed=Math.min(dmg*.5,p.mp);
      p.mp-=absorbed;dmg-=absorbed;
    }
    if(p.talents&&p.talents.manaShield>0&&p.mp>0){
      const manaAbsorb=Math.min(dmg*p.talents.manaShield,p.mp);
      p.mp-=manaAbsorb;dmg-=manaAbsorb;
    }
    return dmg;
  },

  _applyPlayerThornsRetaliation(){
    const p=this.player;
    if(!(p.talents&&p.talents.thorns>0&&this._lastAttacker))return;
    const e=this._lastAttacker;
    // thorns punish melee contact only — never a long-gone attacker
    // (environmental damage like lava/traps used to proc them at any range)
    if(Util.dist(p.x,p.y,e.x,e.y)>2.5)return;
    if(e.hp>0){
      e.hp-=p.talents.thorns;
      this.floatingText.add(e.x+.5,e.y,`-${p.talents.thorns}`,'#a4f');
    }
  },

  _triggerRiftPulseRetaliation(damageTaken){
    const p=this.player;
    const ring=p.equipment&&p.equipment.ring;
    if(!(ring&&ring.effect==='riftPulse'))return;
    if((this._riftPulseCooldown||0)>0)return;

    const radius=3.2;
    const pulseDamage=Math.max(1,Math.floor(8+this.floor*1.2+p.atk*.35+damageTaken*.2));
    let hits=0;
    let kills=0;
    for(const e of this.enemies){
      if(e.hp<=0)continue;
      if(Util.dist(p.x,p.y,e.x,e.y)>radius)continue;
      const hpBefore=e.hp;
      this.damageEnemy(e,pulseDamage,'arcane');
      hits++;
      if(hpBefore>0&&e.hp<=0)kills++;
    }

    this._riftPulseCooldown=4.5;
    if(hits<=0)return;

    this._riftPulseProcs=(this._riftPulseProcs||0)+1;
    if(kills>0)this._riftPulseKills=(this._riftPulseKills||0)+kills;
    this.particles.burst(p.x+.5,p.y+.5,20,'#b794ff',2.6,.35,3);
    this.screenFX.flash('#cbb0ff',.08);
    this.log(`💍 Szczelinowy rezonans: ${hits} trafień${kills>0?`, ${kills} eliminacji`:''}`,'spell');
    Achievements.checkAll(this);
  },

  _triggerRiftAegisOnDamage(damageTaken){
    const p=this.player;
    const armor=p.equipment&&p.equipment.armor;
    if(!(armor&&armor.effect==='riftAegis'))return;
    if((this._riftAegisCooldown||0)>0)return;

    const ox=p.x+.5,oy=p.y+.5;
    const radius=4.8;
    const maxTargets=4;
    const aegisDamage=Math.max(1,Math.floor(8+this.floor*1.15+p.def*.28+damageTaken*.22));
    const targets=this.enemies
      .filter(e=>e.hp>0&&Util.dist(p.x,p.y,e.x,e.y)<=radius)
      .sort((a,b)=>Util.dist(p.x,p.y,a.x,a.y)-Util.dist(p.x,p.y,b.x,b.y))
      .slice(0,maxTargets);

    let hits=0;
    let kills=0;
    let manaRestored=0;
    for(const enemy of targets){
      const hpBefore=enemy.hp;
      this.damageEnemy(enemy,aegisDamage,'arcane');
      this.particles.lightning(ox,oy,enemy.x+.5,enemy.y+.5,'#a978ff');
      hits++;
      manaRestored+=4;
      if(hpBefore>0&&enemy.hp<=0)kills++;
    }

    this._riftAegisCooldown=9.5;
    if(hits<=0)return;

    this._riftAegisProcs=(this._riftAegisProcs||0)+1;
    if(kills>0)this._riftAegisKills=(this._riftAegisKills||0)+kills;
    if(manaRestored>0){
      const actualRestore=Math.min(manaRestored,p.maxMp-p.mp);
      p.mp+=actualRestore;
      if(actualRestore>0)this.floatingText.add(p.x+.5,p.y-.45,`+${actualRestore} MP`,'#b794ff',.45);
    }
    this.particles.burst(ox,oy,18,'#b794ff',2.7,.35,3);
    this.screenFX.flash('#cfb5ff',.09);
    this.log(`🛡️ Tarcza Szczeliny: ${hits} trafień${kills>0?`, ${kills} eliminacji`:''}`,'spell');
    Achievements.checkAll(this);
  },

  _triggerRiftSlashOnMelee(target,baseDamage){
    const p=this.player;
    const weapon=p.equipment&&p.equipment.weapon;
    if(!(weapon&&weapon.effect==='riftSlash'))return;
    if((this._riftSlashCooldown||0)>0)return;

    const ox=target.x+.5,oy=target.y+.5;
    const radius=4.4;
    const maxTargets=3;
    const slashDamage=Math.max(1,Math.floor(7+this.floor*1.1+p.atk*.36+baseDamage*.18));
    const targets=this.enemies
      .filter(e=>e.hp>0&&e!==target&&Util.dist(target.x,target.y,e.x,e.y)<=radius)
      .sort((a,b)=>Util.dist(target.x,target.y,a.x,a.y)-Util.dist(target.x,target.y,b.x,b.y))
      .slice(0,maxTargets);

    let hits=0;
    let kills=0;
    for(const enemy of targets){
      const hpBefore=enemy.hp;
      this.damageEnemy(enemy,slashDamage,'arcane');
      this.particles.lightning(ox,oy,enemy.x+.5,enemy.y+.5,'#b794ff');
      hits++;
      if(hpBefore>0&&enemy.hp<=0)kills++;
    }

    this._riftSlashCooldown=4.8;
    if(hits<=0)return;

    this._riftSlashProcs=(this._riftSlashProcs||0)+1;
    if(kills>0)this._riftSlashKills=(this._riftSlashKills||0)+kills;
    this.particles.burst(ox,oy,14,'#b794ff',2.4,.3,2.7);
    this.screenFX.flash('#cfb5ff',.07);
    this.log(`🪓 Rozcięcie Szczeliny: ${hits} trafień${kills>0?`, ${kills} eliminacji`:''}`,'spell');
    Achievements.checkAll(this);
  },

  _triggerMirrorBladeOnMelee(target,baseDamage){
    const p=this.player;
    const weapon=p.equipment&&p.equipment.weapon;
    if(!(weapon&&weapon.effect==='mirrorBlade'))return;
    if((this._mirrorBladeCooldown||0)>0)return;

    const ox=target.x+.5,oy=target.y+.5;
    const slashDamage=Math.max(1,Math.floor(6+this.floor+p.atk*.34+baseDamage*.16));
    const targets=[target];
    const neighbor=this.enemies
      .filter(e=>e.hp>0&&e!==target&&Util.dist(target.x,target.y,e.x,e.y)<=3.2)
      .sort((a,b)=>Util.dist(target.x,target.y,a.x,a.y)-Util.dist(target.x,target.y,b.x,b.y))[0];
    if(neighbor)targets.push(neighbor);

    let hits=0;
    let kills=0;
    for(const enemy of targets){
      const hpBefore=enemy.hp;
      this.damageEnemy(enemy,slashDamage,'arcane');
      this.particles.lightning(ox,oy,enemy.x+.5,enemy.y+.5,'#dde6ff');
      hits++;
      if(hpBefore>0&&enemy.hp<=0)kills++;
    }

    this._mirrorBladeCooldown=4.4;
    if(hits<=0)return;

    this._mirrorBladeProcs=(this._mirrorBladeProcs||0)+1;
    if(kills>0)this._mirrorBladeKills=(this._mirrorBladeKills||0)+kills;
    this.particles.burst(ox,oy,12,'#dde6ff',2.1,.28,2.3);
    this.screenFX.flash('#f3f6ff',.06);
    this.log(`🗡️ Lustrzane cięcie: ${hits} trafień${kills>0?`, ${kills} eliminacji`:''}`,'spell');
    Achievements.checkAll(this);
  },

  _triggerMirrorEchoOnSpellCast(spell){
    const p=this.player;
    const ring=p.equipment&&p.equipment.ring;
    if(!(ring&&ring.effect==='mirrorEcho'))return;
    if((this._mirrorEchoCooldown||0)>0)return;

    const ox=p.x+.5,oy=p.y+.5;
    const mx=this.mouseWorldX,my=this.mouseWorldY;
    const distToMouse=Util.dist(ox,oy,mx,my);
    const baseAngle=distToMouse>.01?Util.angle(ox,oy,mx,my):0;
    const angles=[baseAngle,baseAngle+Math.PI];
    const range=6.6;
    const width=.85;
    const damage=Math.max(1,Math.floor(8+this.floor+p.atk*.28+(spell&&spell.mpCost?spell.mpCost*.22:0)));
    const hitEnemies=new Set();
    let kills=0;

    for(const angle of angles){
      const nx=Math.cos(angle),ny=Math.sin(angle);
      const endX=ox+nx*range;
      const endY=oy+ny*range;
      this.projectiles.push(new Projectile(ox,oy,endX,endY,6.8,damage,'#d7e1ff',true,'arcane'));
      for(const e of this.enemies){
        if(e.hp<=0||hitEnemies.has(e.id))continue;
        const ex=e.x+.5,ey=e.y+.5;
        const vx=ex-ox,vy=ey-oy;
        const along=vx*nx+vy*ny;
        if(along<0||along>range)continue;
        const cx=ox+nx*along;
        const cy=oy+ny*along;
        if(Util.dist(ex,ey,cx,cy)>width)continue;
        const hpBefore=e.hp;
        this.damageEnemy(e,damage,'arcane');
        hitEnemies.add(e.id);
        if(hpBefore>0&&e.hp<=0)kills++;
      }
    }

    this._mirrorEchoCooldown=5.4;
    if(hitEnemies.size<=0)return;

    this._mirrorEchoProcs=(this._mirrorEchoProcs||0)+1;
    if(kills>0)this._mirrorEchoKills=(this._mirrorEchoKills||0)+kills;
    this.particles.burst(ox,oy,14,'#d7e1ff',2.2,.3,2.4);
    this.screenFX.flash('#eef3ff',.08);
    this.log(`💍 Puste Echo: ${hitEnemies.size} trafień${kills>0?`, ${kills} eliminacji`:''}`,'spell');
    Achievements.checkAll(this);
  },

  _triggerObeliskEchoOnSpellCast(spell){
    const p=this.player;
    const ring=p.equipment&&p.equipment.ring;
    if(!(ring&&ring.effect==='obeliskEcho'))return;
    if((this._obeliskEchoCooldown||0)>0)return;

    const ox=p.x+.5,oy=p.y+.5;
    const mx=this.mouseWorldX,my=this.mouseWorldY;
    const distToMouse=Util.dist(ox,oy,mx,my);
    const baseAngle=distToMouse>.01?Util.angle(ox,oy,mx,my):0;
    const range=6.2;
    const width=.8;
    const count=3;
    const spread=.35;
    const damage=Math.max(1,Math.floor(9+this.floor*1.1+p.atk*.35));
    const hitEnemies=new Set();
    let kills=0;

    for(let i=0;i<count;i++){
      const t=count===1?0:i/(count-1);
      const angle=baseAngle-spread+2*spread*t;
      const nx=Math.cos(angle),ny=Math.sin(angle);
      const endX=ox+nx*range;
      const endY=oy+ny*range;
      this.projectiles.push(new Projectile(ox,oy,endX,endY,6.4,damage,'#a8bbff',true,'arcane'));
      for(const e of this.enemies){
        if(e.hp<=0||hitEnemies.has(e.id))continue;
        const ex=e.x+.5,ey=e.y+.5;
        const vx=ex-ox,vy=ey-oy;
        const along=vx*nx+vy*ny;
        if(along<0||along>range)continue;
        const cx=ox+nx*along;
        const cy=oy+ny*along;
        if(Util.dist(ex,ey,cx,cy)>width)continue;
        const hpBefore=e.hp;
        this.damageEnemy(e,damage,'arcane');
        hitEnemies.add(e.id);
        if(hpBefore>0&&e.hp<=0)kills++;
      }
    }

    this._obeliskEchoCooldown=5.2;
    if(hitEnemies.size<=0)return;

    this._obeliskEchoProcs=(this._obeliskEchoProcs||0)+1;
    if(kills>0)this._obeliskEchoKills=(this._obeliskEchoKills||0)+kills;
    this.particles.burst(ox,oy,16,'#a8bbff',2.3,.32,2.5);
    this.screenFX.flash('#c1cdff',.08);
    this.log(`💍 Echo Obelisku: ${hitEnemies.size} trafień${kills>0?`, ${kills} eliminacji`:''}`,'spell');
    Achievements.checkAll(this);
  },

  _triggerMirrorVeilOnDamage(damageTaken){
    const p=this.player;
    const armor=p.equipment&&p.equipment.armor;
    if(!(armor&&armor.effect==='mirrorVeil'))return;
    if((this._mirrorVeilCooldown||0)>0)return;

    const radius=4.2;
    const maxTargets=2;
    const veilDamage=Math.max(1,Math.floor(6+this.floor+p.def*.35+damageTaken*.22));
    const targets=this.enemies
      .filter(e=>e.hp>0&&Util.dist(p.x,p.y,e.x,e.y)<=radius)
      .sort((a,b)=>Util.dist(p.x,p.y,a.x,a.y)-Util.dist(p.x,p.y,b.x,b.y))
      .slice(0,maxTargets);

    let hits=0;
    let kills=0;
    for(const enemy of targets){
      const hpBefore=enemy.hp;
      this.damageEnemy(enemy,veilDamage,'arcane');
      this.particles.lightning(p.x+.5,p.y+.5,enemy.x+.5,enemy.y+.5,'#e1e8ff');
      hits++;
      if(hpBefore>0&&enemy.hp<=0)kills++;
    }

    this._mirrorVeilCooldown=10.5;
    p.iFrames=Math.max(p.iFrames||0,.75);
    if(hits<=0)return;

    this._mirrorVeilProcs=(this._mirrorVeilProcs||0)+1;
    if(kills>0)this._mirrorVeilKills=(this._mirrorVeilKills||0)+kills;
    this.particles.burst(p.x+.5,p.y+.5,16,'#e1e8ff',2.2,.3,2.5);
    this.screenFX.flash('#f5f8ff',.08);
    this.log(`🛡️ Zasłona Mirażu: ${hits} trafień${kills>0?`, ${kills} eliminacji`:''}`,'spell');
    Achievements.checkAll(this);
  },

  _triggerObeliskWardOnDamage(damageTaken){
    const p=this.player;
    const armor=p.equipment&&p.equipment.armor;
    if(!(armor&&armor.effect==='obeliskWard'))return;
    if((this._obeliskWardCooldown||0)>0)return;

    const radius=2.8;
    const wardDamage=Math.max(1,Math.floor(7+this.floor+p.def*.45+damageTaken*.18));
    let hits=0;
    let kills=0;
    for(const e of this.enemies){
      if(e.hp<=0)continue;
      if(Util.dist(p.x,p.y,e.x,e.y)>radius)continue;
      const hpBefore=e.hp;
      this.damageEnemy(e,wardDamage,'arcane');
      hits++;
      if(hpBefore>0&&e.hp<=0)kills++;
    }

    this._obeliskWardCooldown=11;
    this._obeliskWardTimer=4.5;
    if(hits<=0)return;

    this._obeliskWardProcs=(this._obeliskWardProcs||0)+1;
    if(kills>0)this._obeliskWardKills=(this._obeliskWardKills||0)+kills;
    this.particles.burst(p.x+.5,p.y+.5,18,'#9db2ff',2.5,.34,2.8);
    this.screenFX.flash('#c1d0ff',.08);
    this.log(`🛡️ Warta Obelisku: ${hits} trafień${kills>0?`, ${kills} eliminacji`:''}`,'spell');
    Achievements.checkAll(this);
  },

  _triggerObeliskStrikeOnMelee(target,baseDamage){
    const p=this.player;
    const weapon=p.equipment&&p.equipment.weapon;
    if(!(weapon&&weapon.effect==='obeliskStrike'))return;
    if((this._obeliskStrikeCooldown||0)>0)return;

    const ox=target.x+.5,oy=target.y+.5;
    const radius=2.6;
    const strikeDamage=Math.max(1,Math.floor(8+this.floor+p.atk*.4+baseDamage*.2));
    let hits=0;
    let kills=0;
    for(const e of this.enemies){
      if(e.hp<=0)continue;
      if(Util.dist(target.x,target.y,e.x,e.y)>radius)continue;
      const hpBefore=e.hp;
      this.damageEnemy(e,strikeDamage,'arcane');
      hits++;
      if(hpBefore>0&&e.hp<=0)kills++;
    }

    this._obeliskStrikeCooldown=4.2;
    if(hits<=0)return;

    this._obeliskStrikeProcs=(this._obeliskStrikeProcs||0)+1;
    if(kills>0)this._obeliskStrikeKills=(this._obeliskStrikeKills||0)+kills;
    this.particles.burst(ox,oy,18,'#a9bbff',2.5,.32,2.6);
    this.screenFX.flash('#c3d0ff',.07);
    this.log(`🔨 Uderzenie Monolitu: ${hits} trafień${kills>0?`, ${kills} eliminacji`:''}`,'spell');
    Achievements.checkAll(this);
  },
  
  damagePlayer(dmg,msg,cls='damage'){
    const p=this.player;
    if(p.iFrames>0)return;

    if(this._tryPlayerDodge())return;

    const armor=p.equipment.armor;
    let def=p.def+(armor?armor.baseDef:0)+this._getObeliskWardDefenseBonus();
    dmg=this._applyPlayerManaShields(dmg);
    
    dmg=Math.max(1,Math.floor(dmg-def*.3));
    p.hp-=dmg;
    this._hitsTaken=(this._hitsTaken||0)+1;
    p.iFrames=.3;
    this.floatingText.add(p.x+.5,p.y,`-${dmg}`,'#f44');
    this.log(msg||`Otrzymujesz ${dmg} obrażeń`,cls);
    this.screenFX.flash('#f00',.15);
    this.sound.playerHit();
    this._triggerRiftPulseRetaliation(dmg);
    this._triggerRiftAegisOnDamage(dmg);
    this._triggerMirrorVeilOnDamage(dmg);
    this._triggerObeliskWardOnDamage(dmg);
    Achievements.checkAll(this);

    this._applyPlayerThornsRetaliation();
    
    if(p.hp<=0)this.gameOver();
  },
  
  // ---- SPELLS ----
});
