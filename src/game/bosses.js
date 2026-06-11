'use strict';
Object.assign(Game, {
  _bossAbilityCharge(boss,dist){
    const p=this.player;
    const a=Util.angle(boss.x,boss.y,p.x,p.y);
    for(let i=0;i<5;i++){
      const nx=boss.x+Math.cos(a)*i;const ny=boss.y+Math.sin(a)*i;
      if(!this.dungeon.isPassable(Math.floor(nx),Math.floor(ny)))break;
      boss.x=nx;boss.y=ny;
    }
    if(dist<2)this._enemyAttack(boss);
    this.screenFX.shake(5,.3);
    this.particles.burst(boss.x+.5,boss.y+.5,20,boss.color,3,.5);
  },

  _bossAbilitySummon(boss){
    const types=ContentRegistry.getEnemyTypesForFloor(this.floor);
    for(let i=0;i<3;i++){
      const et=Util.pick(types);
      const sx=boss.x+Util.rand(-3,3),sy=boss.y+Util.rand(-3,3);
      if(this.dungeon.isPassable(Math.floor(sx),Math.floor(sy))){
        const minion=this._makeEnemy(et,sx,sy);minion.alerted=true;
        this.enemies.push(minion);
      }
    }
    this.log(`${boss.name} przywołuje potwory!`,'boss');
    this.particles.magic(boss.x+.5,boss.y+.5,'#a0f');
  },

  _bossAbilityFireball(boss){
    const p=this.player;
    for(let i=0;i<3;i++){
      const angle=Util.angle(boss.x,boss.y,p.x,p.y)+Util.randF(-.3,.3);
      this.projectiles.push(new Projectile(boss.x+.5,boss.y+.5,boss.x+Math.cos(angle)*10,boss.y+Math.sin(angle)*10,5,boss.atk,'#f80',false,'fire'));
    }
  },

  _bossAbilityTeleport(boss){
    const room=Util.pick(this.dungeon.rooms);
    this.particles.magic(boss.x+.5,boss.y+.5,'#a0f');
    boss.x=room.cx;boss.y=room.cy;
    this.particles.magic(boss.x+.5,boss.y+.5,'#a0f');
  },

  _bossAbilityMirrorDash(boss){
    const p=this.player;
    const fromX=boss.x+.5,fromY=boss.y+.5;
    const a=Util.angle(boss.x,boss.y,p.x,p.y);
    const targetX=p.x-Math.cos(a)*1.2;
    const targetY=p.y-Math.sin(a)*1.2;
    this.particles.magic(fromX,fromY,'#d8c4ff');
    if(this.dungeon.isPassable(Math.floor(targetX),Math.floor(targetY))){
      boss.x=targetX;boss.y=targetY;
    }else{
      this._bossAbilityTeleport(boss);
    }
    this.particles.magic(boss.x+.5,boss.y+.5,'#d8c4ff');
    const dist=Util.dist(boss.x,boss.y,p.x,p.y);
    if(dist<2.2){
      this.damagePlayer(Math.floor(boss.atk*.85),`${boss.name} wykonuje lustrzany doskok!`,'damage');
    }
    if(this.player.hp>0){
      this._mirrorDashSurvived=(this._mirrorDashSurvived||0)+1;
      Achievements.checkAll(this);
    }
    this.screenFX.shake(6,.24);
    this.screenFX.flash('#cfb6ff',.12);
  },

  _bossAbilityRiftNova(boss){
    const p=this.player;
    const centerX=boss.x+.5,centerY=boss.y+.5;
    const radius=4.5;
    const dist=Util.dist(boss.x,boss.y,p.x,p.y);

    if(dist<radius){
      const intensity=1-dist/radius;
      const dmg=Math.max(1,Math.floor(boss.atk*(.45+.35*intensity)));
      this.damagePlayer(dmg,`${boss.name} uwalnia Szczelinową Novę!`,'damage');
    }

    for(let i=0;i<12;i++){
      const a=Math.PI*2*(i/12);
      this.projectiles.push(new Projectile(
        centerX,centerY,
        centerX+Math.cos(a)*8,
        centerY+Math.sin(a)*8,
        4.8,
        Math.max(1,Math.floor(boss.atk*.55)),
        '#9c7bff',
        false,
        'arcane'
      ));
    }

    this.particles.burst(centerX,centerY,28,'#8f7bff',3.3,.55,3.6);
    this.particles.magic(centerX,centerY,'#c7b5ff');
    this.screenFX.shake(8,.32);
    this.screenFX.flash('#ad8cff',.16);
    this.log(`${boss.name} rozdziera przestrzeń Szczelinową Novą!`,'boss');

    if(this.player.hp>0){
      this._riftNovaSurvived=(this._riftNovaSurvived||0)+1;
      Achievements.checkAll(this);
    }
  },

  _bossAbilityObeliskStorm(boss){
    const p=this.player;
    const centerX=boss.x+.5,centerY=boss.y+.5;
    const dist=Util.dist(boss.x,boss.y,p.x,p.y);
    const stormRadius=5.3;

    if(dist<stormRadius){
      const intensity=1-dist/stormRadius;
      const dmg=Math.max(1,Math.floor(boss.atk*(.4+.3*intensity)));
      this.damagePlayer(dmg,`${boss.name} uwalnia Burzę Obelisku!`,'damage');
    }

    const bolts=10;
    for(let i=0;i<bolts;i++){
      const a=Math.PI*2*(i/bolts);
      const ringX=centerX+Math.cos(a)*2.2;
      const ringY=centerY+Math.sin(a)*2.2;
      this.projectiles.push(new Projectile(
        ringX,ringY,
        ringX+Math.cos(a)*10,
        ringY+Math.sin(a)*10,
        5.2,
        Math.max(1,Math.floor(boss.atk*.58)),
        '#6f93ff',
        false,
        'arcane'
      ));
    }

    this.particles.burst(centerX,centerY,26,'#6f93ff',3.2,.5,3.5);
    this.particles.magic(centerX,centerY,'#9cb6ff');
    this.screenFX.shake(8,.28);
    this.screenFX.flash('#89a8ff',.14);
    this.log(`${boss.name} przyzywa Burzę Obelisku!`,'boss');

    if(this.player.hp>0){
      this._obeliskStormSurvived=(this._obeliskStormSurvived||0)+1;
      Achievements.checkAll(this);
    }
  },

  _bossAbilityBreath(boss){
    const p=this.player;
    const ba=Util.angle(boss.x,boss.y,p.x,p.y);
    for(let i=0;i<8;i++){
      const spread=ba+Util.randF(-.5,.5);
      this.projectiles.push(new Projectile(boss.x+.5,boss.y+.5,boss.x+Math.cos(spread)*10,boss.y+Math.sin(spread)*10,4,Math.floor(boss.atk*.7),Util.pick(['#f80','#f40','#ff0']),false,'fire'));
    }
    this.log(`${boss.name} zionie ogniem!`,'boss');
  },

  _bossAbilityStomp(boss,dist){
    if(dist<4){
      this.damagePlayer(Math.floor(boss.atk*.8),`${boss.name} wykonuje potężne uderzenie!`,'damage');
      this.screenFX.shake(10,.5);
    }
    this.particles.burst(boss.x+.5,boss.y+.5,30,'#fa0',4,.6,4);
  },

  _triggerBossAbility(boss,ability,dist){
    const handlers={
      charge:()=>this._bossAbilityCharge(boss,dist),
      summon:()=>this._bossAbilitySummon(boss),
      fireball:()=>this._bossAbilityFireball(boss),
      teleport:()=>this._bossAbilityTeleport(boss),
      mirror_dash:()=>this._bossAbilityMirrorDash(boss),
      rift_nova:()=>this._bossAbilityRiftNova(boss),
      obelisk_storm:()=>this._bossAbilityObeliskStorm(boss),
      breath:()=>this._bossAbilityBreath(boss),
      stomp:()=>this._bossAbilityStomp(boss,dist)
    };
    const handler=handlers[ability];
    if(handler)handler();
  },

  _bossFallbackCombatAndChase(boss,dt,dist){
    const p=this.player;
    if(dist<1.5&&boss.attackTimer<=0){
      this._enemyAttack(boss);
    }else if(dist>1.5){
      this._moveToward(boss,p.x,p.y,dt);
    }
  },
  
  _updateBossAI(boss,dt,dist){
    boss.alerted=true;
    boss.abilityTimer-=dt;
    
    // Phase change
    if(boss.hp<boss.maxHp*.5&&boss.phase===1){
      boss.phase=2;boss.speed*=1.3;boss.atk=Math.floor(boss.atk*1.2);
      this.log(`⚠️ ${boss.name} wpada w szał!`,'boss');
      this.screenFX.shake(8,.4);
      this.screenFX.flash('#f00',.3);
    }
    // Phase 3: fury — abilities come much faster
    if(boss.hp<boss.maxHp*.25&&boss.phase===2){
      boss.phase=3;boss.atk=Math.floor(boss.atk*1.1);
      this.log(`☠️ ${boss.name} wpada w furię! Uciekaj albo dobij!`,'boss');
      this.screenFX.shake(10,.5);
      this.screenFX.flash('#f40',.3);
      this.sound.boss();
    }

    if(boss.abilityTimer<=0&&boss.abilities.length>0){
      const ability=Util.pick(boss.abilities);
      boss.abilityTimer=boss.phase>=3?1.6+Math.random()*1.2:3+Math.random()*2;

      this._triggerBossAbility(boss,ability,dist);
    }

    this._bossFallbackCombatAndChase(boss,dt,dist);
  },

});
