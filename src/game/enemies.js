'use strict';
Object.assign(Game, {
  _applyEnemyDotEffects(e,dt){
    if(e.burnTimer>0){
      e.burnTimer-=dt;
      if(Math.random()<dt*3){this.damageEnemy(e,3+this.floor,'burn');this.particles.fire(e.x+.5,e.y+.5);}
    }
    if(e.poisonTimer>0){
      e.poisonTimer-=dt;
      if(Math.random()<dt*2){this.damageEnemy(e,2+this.floor,'poison');}
    }
  },

  _shouldSkipEnemyAfterStatusTick(e,dt){
    if(e.hp<=0)return true;
    if(e.stunTimer>0){e.stunTimer-=dt;return true;}
    if(e.hitFlash>0)e.hitFlash-=dt;
    if(e.attackTimer>0)e.attackTimer-=dt;
    if(e.attackAnim>0)e.attackAnim-=dt;
    this._applyEnemyDotEffects(e,dt);
    if(e.freezeTimer>0){e.freezeTimer-=dt;return true;}
    return false;
  },

  _tryEliteTeleportBlink(enemy,dist,dt){
    if(!enemy.teleporter)return;
    const p=this.player;
    if(!enemy.teleportTimer)enemy.teleportTimer=0;
    enemy.teleportTimer-=dt;
    if(enemy.teleportTimer<=0&&dist>3&&dist<10){
      const a=Util.angle(p.x,p.y,enemy.x,enemy.y);
      const tpx=p.x+Math.cos(a)*1.5;
      const tpy=p.y+Math.sin(a)*1.5;
      if(this.dungeon.isPassable(Math.floor(tpx),Math.floor(tpy))){
        this.particles.magic(enemy.x+.5,enemy.y+.5,'#a0f');
        enemy.x=tpx;enemy.y=tpy;
        this.particles.magic(enemy.x+.5,enemy.y+.5,'#a0f');
        enemy.teleportTimer=3+Math.random()*2;
      }
    }
  },

  _tryEliteRiftPulse(enemy,dist,dt){
    if(!enemy.riftbound)return;
    if(!Number.isFinite(enemy.riftPulseTimer))enemy.riftPulseTimer=2.6+Math.random()*1.2;
    enemy.riftPulseTimer-=dt;
    if(enemy.riftPulseTimer>0||dist>7)return;

    const cx=enemy.x+.5,cy=enemy.y+.5;
    const bolts=6;
    const boltDamage=Math.max(1,Math.floor(enemy.atk*.55));
    for(let i=0;i<bolts;i++){
      const a=Math.PI*2*(i/bolts);
      this.projectiles.push(new Projectile(cx,cy,cx+Math.cos(a)*7,cy+Math.sin(a)*7,4.2,boltDamage,'#8f7bff',false,'arcane'));
    }

    this.particles.magic(cx,cy,'#c6b4ff');
    this.particles.burst(cx,cy,16,'#8f7bff',2.4,.35,2.8);
    this.screenFX.flash('#8f7bff',.08);
    enemy.riftPulseTimer=3.6+Math.random()*1.7;
  },

  _tryEliteObeliskPulse(enemy,dist,dt){
    if(!enemy.obeliskbound)return;
    if(!Number.isFinite(enemy.obeliskPulseTimer))enemy.obeliskPulseTimer=3+Math.random()*1.2;
    enemy.obeliskPulseTimer-=dt;
    if(enemy.obeliskPulseTimer>0||dist>7.5)return;

    const cx=enemy.x+.5,cy=enemy.y+.5;
    const arcDamage=Math.max(1,Math.floor(enemy.atk*.5));
    const toPlayer=Util.angle(cx,cy,this.player.x+.5,this.player.y+.5);
    const bolts=5;
    const spread=.6;
    for(let i=0;i<bolts;i++){
      const t=bolts===1?0:i/(bolts-1);
      const a=toPlayer-spread+2*spread*t;
      this.projectiles.push(new Projectile(cx,cy,cx+Math.cos(a)*8.5,cy+Math.sin(a)*8.5,4.7,arcDamage,'#6f93ff',false,'arcane'));
    }

    this.particles.magic(cx,cy,'#9cb6ff');
    this.particles.burst(cx,cy,16,'#6f93ff',2.5,.35,2.8);
    this.screenFX.flash('#8da9ff',.08);
    enemy.obeliskPulseTimer=4+Math.random()*1.8;
  },

  _chaseEnemyTowardPlayer(enemy,dt){
    const p=this.player;
    enemy.pathTimer-=dt;
    if(enemy.pathTimer<=0||enemy.path.length===0){
      enemy.path=Pathfinder.find(this.dungeon,Math.floor(enemy.x),Math.floor(enemy.y),Math.floor(p.x),Math.floor(p.y),100);
      enemy.pathTimer=.5+Math.random()*.5;
    }
    if(enemy.path.length>0){
      const next=enemy.path[0];
      this._moveToward(enemy,next.x+.5,next.y+.5,dt);
      if(Util.dist(enemy.x,enemy.y,next.x+.5,next.y+.5)<.3)enemy.path.shift();
    }else{
      this._moveToward(enemy,p.x,p.y,dt);
    }
  },

  _updateEnemyAlertState(e,dist,visible){
    if(dist<8&&visible)e.alerted=true;
    if(dist<3)e.alerted=true;
  },

  _runUnalertedEnemyAi(e,dt){
    if(e.alerted)return false;
    if(e.ai==='wander'||e.ai==='patrol'){
      if(!e.patrolTarget||Util.dist(e.x,e.y,e.patrolTarget.x,e.patrolTarget.y)<1||Math.random()<dt*.1){
        e.patrolTarget={x:e.x+Util.rand(-5,5),y:e.y+Util.rand(-5,5)};
      }
      this._moveToward(e,e.patrolTarget.x,e.patrolTarget.y,dt*.5);
    }
    if(e.ai==='erratic'){
      e.x+=Util.randF(-1,1)*dt*e.speed;
      e.y+=Util.randF(-1,1)*dt*e.speed;
      if(!this.dungeon.isPassable(Math.floor(e.x),Math.floor(e.y))){e.x-=Util.randF(-1,1)*dt*e.speed;e.y-=Util.randF(-1,1)*dt*e.speed;}
    }
    return true;
  },

  _tryFleeEnemy(e,p,dist,dt){
    if(!(e.hp<e.maxHp*0.2&&e.ai!=='boss'))return false;
    const fleeAngle=Util.angle(p.x,p.y,e.x,e.y);
    const fx=e.x+Math.cos(fleeAngle)*e.speed*dt*1.3;
    const fy=e.y+Math.sin(fleeAngle)*e.speed*dt*1.3;
    if(this.dungeon.isPassable(Math.floor(fx),Math.floor(e.y)))e.x=fx;
    if(this.dungeon.isPassable(Math.floor(e.x),Math.floor(fy)))e.y=fy;
    if(dist<1.0&&e.attackTimer<=0)this._enemyAttack(e);
    return true;
  },

  _updateEnemyPackAlert(e,dt){
    if(e.alerted&&e.alertTimer<=0){
      for(const ally of this.enemies){
        if(ally===e||ally.hp<=0||ally.alerted)continue;
        if(Util.dist(e.x,e.y,ally.x,ally.y)<6){ally.alerted=true;}
      }
      e.alertTimer=3;
    }
    if(e.alertTimer>0)e.alertTimer-=dt;
  },

  _runEnemyCombatBehavior(e,dist,dt){
    this._tryEliteRiftPulse(e,dist,dt);
    this._tryEliteObeliskPulse(e,dist,dt);
    if(dist<1.2&&e.attackTimer<=0){
      this._enemyAttack(e);
    }else if(e.ai==='ranged'&&dist<6&&dist>2&&e.attackTimer<=0){
      this._enemyRangedAttack(e);
    }else if(dist>1.2){
      this._tryEliteTeleportBlink(e,dist,dt);
      this._chaseEnemyTowardPlayer(e,dt);
    }
  },

  _handleEnemyDeath(e){
    this.particles.blood(e.x+.5,e.y+.5);
    const dissolveCount=e.isBoss?40:e.elite?22:14;
    this.particles.burst(e.x+.5,e.y+.5,dissolveCount,e.color||'#caa',e.isBoss?4:2.6,.7,3);
    this.particles.burst(e.x+.5,e.y+.5,Math.floor(dissolveCount*.4),'#222',1.4,.9,3.5);
    this.dungeon.bloodStains.push({x:Math.floor(e.x),y:Math.floor(e.y)});
    let xpFloorBonus=0;
    if(this.floor>=PROGRESSION_BALANCE.xpFloorBonusStart){
      const deepFloors=this.floor-PROGRESSION_BALANCE.xpFloorBonusStart+1;
      xpFloorBonus=Math.min(PROGRESSION_BALANCE.xpFloorBonusCap,deepFloors*PROGRESSION_BALANCE.xpFloorBonusPerFloor);
    }
    const xpAward=Math.max(1,Math.floor(e.xp*(1+xpFloorBonus)));
    this.grantXP(xpAward);
    let goldDrop=Util.rand(1,e.gold);
    if(this.player.talents&&this.player.talents.goldFind>0)goldDrop=Math.floor(goldDrop*(1+this.player.talents.goldFind));
    this.player.gold+=goldDrop;this.totalGold+=goldDrop;
    this.totalKills++;
    if(e.elite)this._eliteKills=(this._eliteKills||0)+1;
    if(e.elite&&e.eliteAffix&&e.eliteAffix.name==='Mirażowy'){
      this._mirageElitesSlain=(this._mirageElitesSlain||0)+1;
    }
    if(e.name==='Egzekutor Mirażu'){
      this._mirrorExecutorsSlain=(this._mirrorExecutorsSlain||0)+1;
    }
    if(e.name==='Lustrzany Skrytobójca'){
      this._mirrorAssassinsSlain=(this._mirrorAssassinsSlain||0)+1;
    }
    if(e.name==='Kapłanka Zwierciadeł'){
      this._mirrorPriestessesSlain=(this._mirrorPriestessesSlain||0)+1;
    }
    if(e.name==='Herold Mirażu'){
      this._mirrorHeraldsSlain=(this._mirrorHeraldsSlain||0)+1;
    }
    if(e.name==='Włócznik Zwierciadła'){
      this._mirrorLancersSlain=(this._mirrorLancersSlain||0)+1;
    }
    if(e.name==='Tkacz Mirażu'){
      this._mirrorWeaversSlain=(this._mirrorWeaversSlain||0)+1;
    }
    if(e.elite&&e.eliteAffix&&e.eliteAffix.name==='Szczelinowy'){
      this._riftboundElitesSlain=(this._riftboundElitesSlain||0)+1;
    }
    if(e.name==='Rozpruwacz Szczeliny'){
      this._riftReaversSlain=(this._riftReaversSlain||0)+1;
    }
    if(e.name==='Siewca Szczeliny'){
      this._riftSowersSlain=(this._riftSowersSlain||0)+1;
    }
    if(e.elite&&e.eliteAffix&&e.eliteAffix.name==='Obeliskowy'){
      this._obeliskboundElitesSlain=(this._obeliskboundElitesSlain||0)+1;
    }
    if(e.name==='Strażnik Monolitu'){
      this._obeliskSentinelsSlain=(this._obeliskSentinelsSlain||0)+1;
    }
    if(e.name==='Wieszcz Obelisku'){
      this._obeliskAugursSlain=(this._obeliskAugursSlain||0)+1;
    }
    if((this._obeliskPotionTimer||0)>0){
      this._obeliskPotionKills=(this._obeliskPotionKills||0)+1;
    }
    if((this._mirrorPotionTimer||0)>0){
      this._mirrorPotionKills=(this._mirrorPotionKills||0)+1;
    }
    this.floatingText.add(e.x+.5,e.y,`+${xpAward}xp +${goldDrop}g`,'#ff0');
    this.sound.hit();

    if(Util.chance(e.isBoss?1:.25)){
      const loot=ContentRegistry.generateLoot(this.floor,e.isBoss?2:0);
      loot.x=Math.floor(e.x);loot.y=Math.floor(e.y);
      this.items.push(loot);
      if(e.isBoss&&loot.rarity==='legendary')this._bossLegendaryDrops=(this._bossLegendaryDrops||0)+1;
      this.log(`${e.name} upuścił: ${loot.icon} ${loot.name}`,'item');
    }

    if(e.isBoss){
      this.log(`🏆 ${e.name} pokonany!`,'boss');
      this.screenFX.shake(10,.5);
      this._bossKills=(this._bossKills||0)+1;
      if(Array.isArray(e.abilities)&&e.abilities.includes('mirror_dash')){
        this._mirrorDashBossKills=(this._mirrorDashBossKills||0)+1;
      }
      if(Array.isArray(e.abilities)&&e.abilities.includes('rift_nova')){
        this._riftNovaBossKills=(this._riftNovaBossKills||0)+1;
      }
      if(Array.isArray(e.abilities)&&e.abilities.includes('obelisk_storm')){
        this._obeliskStormBossKills=(this._obeliskStormBossKills||0)+1;
      }
    }

    if(e.explosive){
      const exDist=Util.dist(this.player.x,this.player.y,e.x,e.y);
      if(exDist<3){
        this.damagePlayer(Math.floor(e.atk*.6),'💥 Eksplozja elity!','damage');
      }
      this.particles.burst(e.x+.5,e.y+.5,30,'#f80',3,.5,3);
      this.screenFX.shake(6,.3);
    }
  },
  
  // ---- ENEMY AI ----
  updateEnemies(dt){
    const p=this.player;
    let bossAlive=null;
    
    for(const e of this.enemies){
      if(this._shouldSkipEnemyAfterStatusTick(e,dt))continue;
      
      const dist=Util.dist(e.x,e.y,p.x,p.y);
      const visible=this.dungeon.visible[Math.floor(e.y)]?.[Math.floor(e.x)];

      this._updateEnemyAlertState(e,dist,visible);
      
      if(e.isBoss){
        bossAlive=e;
        this._updateBossAI(e,dt,dist);
        continue;
      }
      
      // stealth check
      if(p.stealthTimer>0&&dist>2&&!e.alerted)continue;

      if(this._runUnalertedEnemyAi(e,dt))continue;
      if(this._tryFleeEnemy(e,p,dist,dt))continue;

      this._updateEnemyPackAlert(e,dt);
      this._runEnemyCombatBehavior(e,dist,dt);
    }

    this._finalizeEnemyUpdate(bossAlive);
  },

  _removeDeadEnemies(){
    for(let i=this.enemies.length-1;i>=0;i--){
      if(this.enemies[i].hp<=0){
        const e=this.enemies[i];
        this._handleEnemyDeath(e);
        this.enemies.splice(i,1);
      }
    }
  },

  _finalizeEnemyUpdate(bossAlive){
    this._removeDeadEnemies();
    Achievements.checkAll(this);
    this._updateBossHpBar(bossAlive);
  },

  _updateBossHpBar(bossAlive){
    const bossBar=document.getElementById('boss-hp');
    if(bossAlive){
      bossBar.style.display='block';
      document.getElementById('boss-name').textContent=`💀 ${bossAlive.name}`;
      document.getElementById('boss-hp-fill').style.width=`${bossAlive.hp/bossAlive.maxHp*100}%`;
      return;
    }
    bossBar.style.display='none';
  },
  
  _moveToward(e,tx,ty,dt){
    const a=Util.angle(e.x,e.y,tx,ty);
    const nx=e.x+Math.cos(a)*e.speed*dt;
    const ny=e.y+Math.sin(a)*e.speed*dt;
    if(this.dungeon.isPassable(Math.floor(nx),Math.floor(e.y)))e.x=nx;
    if(this.dungeon.isPassable(Math.floor(e.x),Math.floor(ny)))e.y=ny;
  },
  
  _enemyAttack(e){
    const p=this.player;
    const dmg=Math.max(1,e.atk-p.def+Util.rand(-2,2));
    this._lastAttacker=e;
    this.damagePlayer(dmg,`${e.icon} ${e.name} zadaje ${dmg} obrażeń`,'damage');
    e.attackTimer=e.attackCd;
    const _aa=Util.angle(e.x,e.y,p.x,p.y);
    e.attackAnim=.18;e.attackDX=Math.cos(_aa);e.attackDY=Math.sin(_aa);
    this.screenFX.shake(3,.15);
    
    // elite: vampiric — heal on hit
    if(e.vampiric){
      const heal=Math.floor(dmg*.3);
      e.hp=Math.min(e.maxHp,e.hp+heal);
      this.floatingText.add(e.x+.5,e.y,`+${heal}`,'#f88');
    }
    // elite: poisonous — poison player
    if(e.poisonous&&Util.chance(.4)){
      const pid=p.buffs.findIndex(b=>b.type==='poison');
      if(pid===-1){
        p.buffs.push({type:'poison',value:2+this.floor,duration:5});
        this.log('☠️ Zatrucie!','damage');
      }
    }
  },
  
  _enemyRangedAttack(e){
    const p=this.player;
    this.projectiles.push(new Projectile(e.x+.5,e.y+.5,p.x+.5,p.y+.5,e.projectileSpeed||6,e.atk,e.projectileColor||'#f4f',false));
    e.attackTimer=e.attackCd*1.5;
    const _ra=Util.angle(e.x,e.y,p.x,p.y);
    e.attackAnim=.18;e.attackDX=Math.cos(_ra);e.attackDY=Math.sin(_ra);
  },

});
