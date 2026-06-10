'use strict';
Object.assign(Game, {
  _resolvePlayerProjectileHits(proj){
    for(const e of this.enemies){
      if(e.hp<=0)continue;
      if(Util.dist(proj.x,proj.y,e.x+.5,e.y+.5)<.6){
        this._rangedHits=(this._rangedHits||0)+1;
        if(proj.sourceTag==='fireball')this._fireballHits=(this._fireballHits||0)+1;
        this.damageEnemy(e,proj.damage,proj.element);
        if(!proj.piercing)proj.alive=false;
        this.particles.burst(proj.x,proj.y,8,proj.color,2,.3);
        break;
      }
    }
  },

  _resolveEnemyProjectileHit(proj){
    if(Util.dist(proj.x,proj.y,this.player.x+.5,this.player.y+.5)<.6&&this.player.iFrames<=0){
      this._enemyProjectileHitsTaken=(this._enemyProjectileHitsTaken||0)+1;
      let dmg=Math.max(1,proj.damage-this.player.def);
      this.damagePlayer(dmg,'Trafiony pociskiem!','damage');
      proj.alive=false;
      this.particles.burst(proj.x,proj.y,8,'#f44',2,.3);
    }
  },
  
  // ---- PROJECTILES ----
  updateProjectiles(dt){
    for(let i=this.projectiles.length-1;i>=0;i--){
      const proj=this.projectiles[i];
      proj.update(dt,this.dungeon);
      
      if(proj.fromPlayer){
        this._resolvePlayerProjectileHits(proj);
      }else{
        this._resolveEnemyProjectileHit(proj);
      }
      
      if(!proj.alive)this.projectiles.splice(i,1);
    }
  },
  
  // ---- COMBAT ----
  playerAttack(){
    const p=this.player;
    if(p.attackTimer>0){
      this._combatFeedback('atk_cd',`Atak gotowy za ${p.attackTimer.toFixed(1)}s`);
      return;
    }
    p.attackTimer=p.attackCd;
    const _pa=Util.angle(p.x,p.y,this.mouseWorldX,this.mouseWorldY);
    p.attackAnim=.18;p.attackDX=Math.cos(_pa);p.attackDY=Math.sin(_pa);

    // break stealth
    if(p.stealthTimer>0)p.stealthTimer=0;
    
    const range=(p.class==='mage'||p.class==='necromancer')?6:1.8;

    if(p.class==='mage'){
      this._performMageAutoAttack();
      return;
    }
    if(p.class==='necromancer'){
      this._performNecroAutoAttack();
      return;
    }

    const hit=this._performMeleeAttack(range);
    if(hit)this.sound.hit();
    else this._combatFeedback('atk_range','Brak wroga w zasięgu ataku.');
  },

  _performMageAutoAttack(){
    const p=this.player;
    this.projectiles.push(new Projectile(p.x+.5,p.y+.5,this.mouseWorldX,this.mouseWorldY,8,p.atk+5,'#88f',true));
    this.particles.magic(p.x+.5,p.y+.5,'#88f');
    this.screenFX.flash('#88aaff',.05);
    this.sound.spell();
  },

  _performNecroAutoAttack(){
    const p=this.player;
    this.projectiles.push(new Projectile(p.x+.5,p.y+.5,this.mouseWorldX,this.mouseWorldY,7.5,p.atk+4,'#a875ff',true,'shadow'));
    this.particles.magic(p.x+.5,p.y+.5,'#a875ff');
    this.screenFX.flash('#b9a0ff',.04);
    this.sound.spell();
  },

  _performMeleeAttack(range){
    const p=this.player;
    let hit=false;
    for(const e of this.enemies){
      if(e.hp<=0)continue;
      if(Util.dist(p.x+.5,p.y+.5,e.x+.5,e.y+.5)<range){
        let dmg=p.atk+Util.rand(-2,3);
        let isCrit=Util.chance(p.critChance);
        if(isCrit)dmg=Math.floor(dmg*p.critMult);
        if(p.rageTimer>0)dmg*=2;
        if(p.stealthTimer>0)dmg*=2; // backstab bonus

        // weapon effects
        const weapon=p.equipment.weapon;
        if(weapon){
          dmg+=weapon.baseAtk;
          if(weapon.effect==='freeze')e.freezeTimer=2;
          if(weapon.effect==='burn')e.burnTimer=3;
          if(weapon.effect==='lifesteal'){const heal=Math.floor(dmg*.2);p.hp=Math.min(p.maxHp,p.hp+heal);}
          if(weapon.effect==='execute'&&e.hp<e.maxHp*.2)dmg=e.hp;
          if(weapon.effect==='reap'&&e.hp<e.maxHp*.3)dmg=Math.floor(dmg*1.5);
        }

        dmg=Math.max(1,dmg-e.def);

        // combo system with scaling multiplier
        p.combo++;p.comboTimer=2;
        const comboMult=p.combo>=10?3:p.combo>=7?2.5:p.combo>=5?2:p.combo>=3?1.5:1;
        if(comboMult>1){
          dmg=Math.floor(dmg*comboMult);
          this.floatingText.add(p.x+.5,p.y-1,`COMBO x${p.combo}! (${comboMult}x)`,'#ff0');
        }
        this._maxCombo=Math.max(this._maxCombo||0,p.combo);

        this.damageEnemy(e,dmg,'',isCrit);
        this._triggerMirrorBladeOnMelee(e,dmg);
        this._triggerRiftSlashOnMelee(e,dmg);
        this._triggerObeliskStrikeOnMelee(e,dmg);
        this._meleeHits=(this._meleeHits||0)+1;
        if(isCrit)this._meleeCrits=(this._meleeCrits||0)+1;
        hit=true;
        const hitColor=weapon&&weapon.effect==='burn'?'#f80':weapon&&weapon.effect==='freeze'?'#8af':'#ddd';
        this.particles.burst(e.x+.5,e.y+.5,isCrit?14:8,hitColor,2.6,.35,2.6);

        // update combo HUD
        this._updateComboDisplay();

        if(isCrit){
          this.floatingText.add(e.x+.5,e.y-1.1,'KRYTYK!','#f44',1.2);
          this.log(`💥 Trafienie krytyczne! ${dmg} obrażeń`,'crit');
          this.sound.crit();
          this.screenFX.shake(5,.2);
          this.screenFX.flash('#ffcc44',.05);
        }

        break; // hit one enemy at a time for melee
      }
    }
    this._revealAdjacentSecretWalls();
    return hit;
  },
  
  specialAttack(){
    const p=this.player;
    if(!this._canUseSpecialAttack(p))return;
    p.mp-=10;
    p.attackTimer=p.attackCd*1.5;

    const handler=this._resolveSpecialAttackHandler(p.class);
    if(handler)handler();
    this._specialAttacksUsed=(this._specialAttacksUsed||0)+1;
    Achievements.checkAll(this);
    this.sound.spell();
  },

  _canUseSpecialAttack(player){
    if(player.attackTimer>0){
      this._combatFeedback('special_cd',`Atak specjalny gotowy za ${player.attackTimer.toFixed(1)}s`);
      return false;
    }
    if(player.mp<10){
      this._combatFeedback('special_mp',`Za mało many na atak specjalny (brakuje ${Math.ceil(10-player.mp)})`);
      return false;
    }
    return true;
  },

  _resolveSpecialAttackHandler(playerClass){
    const handlers={
      warrior:()=>this._specialAttackWarrior(),
      mage:()=>this._specialAttackMage(),
      rogue:()=>this._specialAttackRogue(),
      necromancer:()=>this._specialAttackNecromancer()
    };
    return handlers[playerClass]||null;
  },

  _specialAttackWarrior(){
    const p=this.player;
    let hits=0;
    for(const e of this.enemies){
      if(Util.dist(p.x,p.y,e.x,e.y)<2.5){
        this.damageEnemy(e,p.atk+8);
        hits++;
      }
    }
    this.particles.burst(p.x+.5,p.y+.5,30,'#fa0',3.5,.6,3.4);
    this.floatingText.add(p.x+.5,p.y-.8,'🌀','#fa0',.5);
    this.screenFX.flash('#ffb347',.08);
    this.screenFX.shake(5,.24);
    if(hits>0)this.log(`🌀 Wir uderza ${hits} wrogów!`,'spell');
    else this._combatFeedback('special_warrior_miss','🌀 Brak wrogów w zasięgu wiru.');
  },

  _specialAttackMage(){
    const p=this.player;
    this.projectiles.push(new Projectile(p.x+.5,p.y+.5,this.mouseWorldX,this.mouseWorldY,6,p.atk*2+10,'#f0f',true,'arcane',true));
    this.particles.magic(p.x+.5,p.y+.5,'#f0f');
    this.particles.burst(p.x+.5,p.y+.5,12,'#f0f',2.5,.45,2.8);
    this.screenFX.flash('#e88cff',.08);
  },

  _specialAttackRogue(){
    const p=this.player;
    for(let i=0;i<8;i++){
      const a=Math.PI*2*i/8;
      const tx=p.x+.5+Math.cos(a)*10;const ty=p.y+.5+Math.sin(a)*10;
      this.projectiles.push(new Projectile(p.x+.5,p.y+.5,tx,ty,7,p.atk,'#aaa',true));
    }
    this.particles.burst(p.x+.5,p.y+.5,22,'#ddd',3.2,.35,2.2);
    this.screenFX.flash('#d0d0d0',.05);
  },

  _applyEnemyShieldAbsorb(e,dmg){
    if(!(e.shielded&&e.shieldHp>0))return dmg;
    const absorbed=Math.min(dmg,e.shieldHp);
    e.shieldHp-=absorbed;
    dmg-=absorbed;
    if(e.shieldHp<=0){
      e.shielded=false;
      this.floatingText.add(e.x+.5,e.y-0.5,'TARCZA ZNISZCZONA!','#48f');
      this.particles.burst(e.x+.5,e.y+.5,18,'#48f',2.8,.4,2.8);
    }
    return dmg;
  },

  _tryEnemyEvasion(e){
    if(!(e.evasive&&Util.chance(e.evasion||.2)))return false;
    e.hitFlash=.08;
    e.alerted=true;
    this.floatingText.add(e.x+.5,e.y-.45,'UNIK','#c8c8ff',.35);
    return true;
  },

  _getElementHitColor(element){
    return element==='fire'?'#f80':element==='ice'?'#8af':element==='poison'?'#7dff7d':element==='arcane'?'#f0f':element==='shadow'?'#b48cff':'#f44';
  },

  _applyEnemyElementHitEffects(e,element){
    if(element==='fire'&&!e.burnTimer)e.burnTimer=3;
    if(element==='ice'){
      e.freezeTimer=1.5;
      this.particles.burst(e.x+.5,e.y+.5,6,'#d8f0ff',1.6,.28,2.6);
    }
    if(element==='poison')this.particles.burst(e.x+.5,e.y+.5,5,'#8cff8c',1.8,.35,2.2);
    if(element==='arcane')this.particles.burst(e.x+.5,e.y+.5,6,'#ff8cff',2,.28,2.4);
  },

  _applyPlayerLifeStealOnHit(dmg){
    const p=this.player;
    if(!(p.talents&&p.talents.lifeSteal>0))return;
    const heal=Math.floor(dmg*p.talents.lifeSteal);
    if(heal>0){
      p.hp=Math.min(p.maxHp,p.hp+heal);
      this.floatingText.add(p.x+.5,p.y-0.3,`+${heal}`,'#f88');
    }
  },
  
  _applyEnemyKnockback(e,strength){
    if(e.isBoss)strength*=.3;
    const a=Util.angle(this.player.x,this.player.y,e.x,e.y);
    const nx=e.x+Math.cos(a)*strength,ny=e.y+Math.sin(a)*strength;
    if(this.dungeon.isPassable(Math.floor(nx),Math.floor(e.y)))e.x=nx;
    if(this.dungeon.isPassable(Math.floor(e.x),Math.floor(ny)))e.y=ny;
  },

  damageEnemy(e,dmg,element='',crit=false){
    const p=this.player;
    // talent: spell power
    if(p.talents&&p.talents.spellPower>0&&element)dmg=Math.floor(dmg*(1+p.talents.spellPower));

    dmg=Math.max(1,Math.floor(dmg));

    if(this._tryEnemyEvasion(e))return;

    dmg=this._applyEnemyShieldAbsorb(e,dmg);
    if(dmg<=0){e.hitFlash=.15;e.alerted=true;return;}

    e.hp-=dmg;e.hitFlash=crit?.28:.15;e.alerted=true;
    const hitColor=this._getElementHitColor(element);
    if(crit){
      this.floatingText.add(e.x+.5,e.y,`-${dmg}`,'#fff',1.1,{scale:1.7,outline:'#900'});
      this.particles.burst(e.x+.5,e.y+.5,14,'#ffd24a',3.2,.4,3);
    }else{
      this.floatingText.add(e.x+.5,e.y,`-${dmg}`,hitColor);
      this.particles.burst(e.x+.5,e.y+.5,element?8:6,hitColor,2.3,.34,2.2);
    }
    this._applyEnemyKnockback(e,crit?.32:.16);

    this._applyEnemyElementHitEffects(e,element);
    this._applyPlayerLifeStealOnHit(dmg);
  },

});
