'use strict';
Object.assign(Game, {
  // 2.4: każda umiejętność = zapowiedź (dane liczone na starcie) + uderzenie w onResolve.
  // Boss stoi w miejscu, dopóki zapowiedź się nie rozstrzygnie (_updateBossAI).

  _bossAngleToPlayer(boss){
    const p=this.player;
    return Util.angle(boss.x+.5,boss.y+.5,p.x+.5,p.y+.5);
  },

  _bossAbilityCharge(boss){
    const a=this._bossAngleToPlayer(boss);
    const length=4;
    // strefa kończy się tam, dokąd boss faktycznie dobiegnie (+ zasięg ciosu) — bez trafień przez ścianę
    let reach=0;
    for(let d=.25;d<=length;d+=.25){
      if(!this.dungeon.isPassable(Math.floor(boss.x+Math.cos(a)*d),Math.floor(boss.y+Math.sin(a)*d)))break;
      reach=d;
    }
    this._bossTelegraph(boss,{shape:'line',x:boss.x+.5,y:boss.y+.5,angle:a,length:Math.min(length,reach+.75),width:1,duration:.55,color:'#ff5522',onResolve:t=>{
      if(boss.hp<=0)return;
      const hit=this.isPlayerInTelegraph(t);
      // szarża po linii zapowiedzi (dawniej kroki sumowały się do ~10 kratek), stop na ścianie
      for(let d=.25;d<=length;d+=.25){
        const nx=boss.x+Math.cos(a)*.25,ny=boss.y+Math.sin(a)*.25;
        if(!this.dungeon.isPassable(Math.floor(nx),Math.floor(ny)))break;
        boss.x=nx;boss.y=ny;
      }
      if(hit)this._enemyAttack(boss);
      this.screenFX.shake(5,.3);
      this.particles.burst(boss.x+.5,boss.y+.5,20,boss.color,3,.5);
    }});
  },

  _pickBossSummonPoints(boss,count){
    const points=[];
    for(let i=0;i<12&&points.length<count;i++){
      const sx=boss.x+Util.rand(-3,3),sy=boss.y+Util.rand(-3,3);
      if(this.dungeon.isPassable(Math.floor(sx),Math.floor(sy)))points.push({x:sx,y:sy});
    }
    return points;
  },

  _bossAbilitySummon(boss){
    const types=ContentRegistry.getEnemyTypesForFloor(this.floor);
    const points=this._pickBossSummonPoints(boss,3);
    if(!points.length)return;
    this.log(`${boss.name} przywołuje potwory!`,'boss');
    this.particles.magic(boss.x+.5,boss.y+.5,'#a0f');
    points.forEach((pt,i)=>{
      const opts={shape:'circle',x:pt.x+.5,y:pt.y+.5,r:.6,duration:.6,color:'#b070ff',onResolve:()=>{
        if(boss.hp<=0)return;
        const minion=this._makeEnemy(Util.pick(types),pt.x,pt.y);minion.alerted=true;
        this.enemies.push(minion);
        this.particles.magic(pt.x+.5,pt.y+.5,'#a0f');
      }};
      // boss jest "zajęty" pierwszą runą; pozostałe też giną razem z nim
      if(i===0)this._bossTelegraph(boss,opts);
      else this.addTelegraph({...opts,duration:opts.duration*(boss.phase>=3?BOSS_FURY_TELEGRAPH_MULT:1),source:boss,cancelOnSourceDeath:true});
    });
  },

  _bossConeVolley(boss,{spread,count,damage,speed,colors,duration}){
    const a=this._bossAngleToPlayer(boss);
    const ox=boss.x+.5,oy=boss.y+.5;
    this._bossTelegraph(boss,{shape:'cone',x:ox,y:oy,r:6,angle:a,spread,duration,color:'#ff8a33',onResolve:()=>{
      if(boss.hp<=0)return;
      for(let i=0;i<count;i++){
        const s=a+Util.randF(-spread,spread);
        this.projectiles.push(new Projectile(ox,oy,ox+Math.cos(s)*10,oy+Math.sin(s)*10,speed,damage,Util.pick(colors),false,'fire'));
      }
    }});
  },

  _bossAbilityFireball(boss){
    this._bossConeVolley(boss,{spread:.3,count:3,damage:boss.atk,speed:5,colors:['#f80'],duration:.45});
  },

  _bossAbilityBreath(boss){
    this.log(`${boss.name} zionie ogniem!`,'boss');
    this._bossConeVolley(boss,{spread:.5,count:8,damage:Math.floor(boss.atk*.7),speed:4,colors:['#f80','#f40','#ff0'],duration:.45});
  },

  _bossAbilityTeleport(boss){
    const room=Util.pick(this.dungeon.rooms);
    this.particles.magic(boss.x+.5,boss.y+.5,'#a0f');
    this._bossTelegraph(boss,{shape:'circle',x:room.cx+.5,y:room.cy+.5,r:.8,duration:.4,color:'#a060ff',onResolve:()=>{
      if(boss.hp<=0)return;
      boss.x=room.cx;boss.y=room.cy;
      this.particles.magic(boss.x+.5,boss.y+.5,'#a0f');
    }});
  },

  _bossAbilityMirrorDash(boss){
    const p=this.player;
    const a=Util.angle(boss.x,boss.y,p.x,p.y);
    let lx=p.x-Math.cos(a)*1.2,ly=p.y-Math.sin(a)*1.2;
    if(!this.dungeon.isPassable(Math.floor(lx),Math.floor(ly))){
      const room=Util.pick(this.dungeon.rooms);lx=room.cx;ly=room.cy;
    }
    this.particles.magic(boss.x+.5,boss.y+.5,'#d8c4ff');
    this._bossTelegraph(boss,{shape:'circle',x:lx+.5,y:ly+.5,r:2.2,duration:.5,color:'#cfb6ff',onResolve:t=>{
      if(boss.hp<=0)return;
      boss.x=lx;boss.y=ly;
      this.particles.magic(boss.x+.5,boss.y+.5,'#d8c4ff');
      if(this.isPlayerInTelegraph(t)){
        this.damagePlayer(Math.max(1,Math.floor(boss.atk*.85*BOSS_AOE_DAMAGE_MULT)),`${boss.name} wykonuje lustrzany doskok!`,'damage');
      }
      if(this.player.hp>0){
        this._mirrorDashSurvived=(this._mirrorDashSurvived||0)+1;
        Achievements.checkAll(this);
      }
      this.screenFX.shake(6,.24);
      this.screenFX.flash('#cfb6ff',.12);
    }});
  },

  // nova / burza: pierścień wokół bossa, obrażenia rosną ku środkowi, potem salwa pocisków
  _bossRadialBlast(boss,{radius,base,scale,bolts,ringOffset,boltReach,boltSpeed,boltMult,color,particleColor,magicColor,flash,logMsg,hitMsg,onSurvive}){
    const cx=boss.x+.5,cy=boss.y+.5;
    this.log(logMsg,'boss');
    this._bossTelegraph(boss,{shape:'ring',x:cx,y:cy,r:radius,inner:0,duration:.8,color,onResolve:t=>{
      if(boss.hp<=0)return;
      if(this.isPlayerInTelegraph(t)){
        const p=this.player;
        const intensity=Math.max(0,1-Util.dist(cx,cy,p.x+.5,p.y+.5)/radius);
        const dmg=Math.max(1,Math.floor(boss.atk*(base+scale*intensity)));
        this.damagePlayer(Math.max(1,Math.floor(dmg*BOSS_AOE_DAMAGE_MULT)),hitMsg,'damage');
      }
      for(let i=0;i<bolts;i++){
        const a=Math.PI*2*(i/bolts);
        const sx=cx+Math.cos(a)*ringOffset,sy=cy+Math.sin(a)*ringOffset;
        this.projectiles.push(new Projectile(sx,sy,sx+Math.cos(a)*boltReach,sy+Math.sin(a)*boltReach,boltSpeed,Math.max(1,Math.floor(boss.atk*boltMult)),particleColor,false,'arcane'));
      }
      this.particles.burst(cx,cy,28,particleColor,3.3,.55,3.6);
      this.particles.magic(cx,cy,magicColor);
      this.screenFX.shake(8,.3);
      this.screenFX.flash(flash,.15);
      if(this.player.hp>0){onSurvive();Achievements.checkAll(this);}
    }});
  },

  _bossAbilityRiftNova(boss){
    this._bossRadialBlast(boss,{radius:4.5,base:.45,scale:.35,bolts:12,ringOffset:0,boltReach:8,boltSpeed:4.8,boltMult:.55,
      color:'#9c7bff',particleColor:'#9c7bff',magicColor:'#c7b5ff',flash:'#ad8cff',
      logMsg:`${boss.name} rozdziera przestrzeń Szczelinową Novą!`,hitMsg:`${boss.name} uwalnia Szczelinową Novę!`,
      onSurvive:()=>{this._riftNovaSurvived=(this._riftNovaSurvived||0)+1;}});
  },

  _bossAbilityObeliskStorm(boss){
    this._bossRadialBlast(boss,{radius:5.3,base:.4,scale:.3,bolts:10,ringOffset:2.2,boltReach:10,boltSpeed:5.2,boltMult:.58,
      color:'#6f93ff',particleColor:'#6f93ff',magicColor:'#9cb6ff',flash:'#89a8ff',
      logMsg:`${boss.name} przyzywa Burzę Obelisku!`,hitMsg:`${boss.name} uwalnia Burzę Obelisku!`,
      onSurvive:()=>{this._obeliskStormSurvived=(this._obeliskStormSurvived||0)+1;}});
  },

  _bossAbilityStomp(boss){
    const cx=boss.x+.5,cy=boss.y+.5;
    this._bossTelegraph(boss,{shape:'circle',x:cx,y:cy,r:4,duration:.75,color:'#ff7a33',onResolve:t=>{
      if(boss.hp<=0)return;
      if(this.isPlayerInTelegraph(t)){
        this.damagePlayer(Math.max(1,Math.floor(boss.atk*.8*BOSS_AOE_DAMAGE_MULT)),`${boss.name} wykonuje potężne uderzenie!`,'damage');
        this.screenFX.shake(10,.5);
      }else{
        this.screenFX.shake(4,.25);
      }
      this.particles.burst(cx,cy,30,'#fa0',4,.6,4);
    }});
  },

  _triggerBossAbility(boss,ability,dist){
    const handlers={
      charge:()=>this._bossAbilityCharge(boss),
      summon:()=>this._bossAbilitySummon(boss),
      fireball:()=>this._bossAbilityFireball(boss),
      teleport:()=>this._bossAbilityTeleport(boss),
      mirror_dash:()=>this._bossAbilityMirrorDash(boss),
      rift_nova:()=>this._bossAbilityRiftNova(boss),
      obelisk_storm:()=>this._bossAbilityObeliskStorm(boss),
      breath:()=>this._bossAbilityBreath(boss),
      stomp:()=>this._bossAbilityStomp(boss)
    };
    const handler=handlers[ability];
    if(handler)handler();
  },

  // dobór umiejętności do sytuacji zamiast czystego losowania
  _pickBossAbility(boss,dist){
    const candidates=[];
    for(const a of boss.abilities){
      if(a==='charge'||a==='stomp'||a==='mirror_dash'){
        if(dist<6.5)candidates.push(a);          // zwarcie tylko z bliska
      }else if(a==='fireball'||a==='breath'){
        if(dist>2.2)candidates.push(a);          // ostrzał z dystansu
      }else if(a==='teleport'){
        if(dist>7||boss.hp<boss.maxHp*.35)candidates.push(a); // pościg / desperacja
      }else if(a==='summon'){
        if(this.enemies.length<28)candidates.push(a);         // bez zalewania areny
      }else{
        candidates.push(a);                       // nova/burza — zawsze groźne
      }
    }
    return Util.pick(candidates.length?candidates:boss.abilities);
  },

  _bossFallbackCombatAndChase(boss,dt,dist){
    const p=this.player;
    // zwykły cios bossa ma ten sam rozmach z kręgiem co zwykli wrogowie (dawniej bił natychmiast)
    if(this._updateEnemyWindup(boss,dt,dist))return;
    if(dist<1.5&&boss.attackTimer<=0){
      this._startEnemyWindup(boss);
    }else if(dist>1.5){
      this._moveToward(boss,p.x,p.y,dt);
    }
  },
  
  _updateBossAI(boss,dt,dist){
    boss.alerted=true;
    if(!this._isEnemyTelegraphing(boss))boss.abilityTimer-=dt;
    
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

    // podczas zapowiedzi boss stoi: nie goni, nie bije, nie odlicza kolejnej umiejętności
    if(this._isEnemyTelegraphing(boss))return;

    if(boss.abilityTimer<=0&&boss.abilities.length>0){
      const ability=this._pickBossAbility(boss,dist);
      boss.abilityTimer=boss.phase>=3?1.6+Math.random()*1.2:3+Math.random()*2;

      this._triggerBossAbility(boss,ability,dist);
    }

    this._bossFallbackCombatAndChase(boss,dt,dist);
  },

});
