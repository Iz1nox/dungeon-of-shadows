'use strict';
Object.assign(Game, {
  initSpellBar(){
    const bar=document.getElementById('spell-bar');
    bar.innerHTML='';
    this.player.spells.forEach((spell,i)=>{
      const slot=document.createElement('div');
      slot.className='spell-slot';
      const keyLabel=getKeyDisplay(KeyBindings['spell'+(i+1)]||spell.key);
      slot.innerHTML=`<span class="key">${keyLabel}</span><span class="icon">${spell.icon}</span><span style="font-size:9px">${spell.name}</span>`;
      slot.title=`${spell.name}: ${spell.desc} (MP: ${spell.mpCost}, CD: ${spell.cd}s)`;
      slot.addEventListener('click',()=>this.castSpell(i));
      bar.appendChild(slot);
    });
  },

  _updateFrameTiming(time){
    const dt=Math.min((time-this.lastTime)/1000,.05);
    this._updateSmoothedFps(dt);
    this.lastTime=time;
    this._advanceGlobalTimers(dt);
    return dt;
  },

  _updateSmoothedFps(dt){
    const fps=dt>0?1/dt:60;
    this._fpsSmoothed=Util.lerp(this._fpsSmoothed||60,fps,.12);
  },

  _advanceGlobalTimers(dt){
    this.gameTime+=dt;
    this.animTime+=dt;
    this.ambientPhase+=dt*.5;
    this._minimapElapsed+=dt;
  },

  _updateEntityCombatSystems(dt){
    this.updatePlayer(dt);
    this.updateEnemies(dt);
    this.updateMinions(dt);
    this.updateProjectiles(dt);
    this.updatePlayerBuffs(dt);
  },

  _updateRuntimeVisualSystems(dt){
    this.particles.update(dt);
    this.floatingText.update(dt);
    this.screenFX.update(dt);
  },

  _updateLowHpHeartbeat(dt){
    const p=this.player;
    if(p&&p.hp>0&&p.hp/p.maxHp<.25){
      this._heartbeatTimer=(this._heartbeatTimer||0)-dt;
      if(this._heartbeatTimer<=0){this.sound.heartbeat();this._heartbeatTimer=1.1;}
    }else{
      this._heartbeatTimer=0;
    }
  },

  _updateCoreSystems(dt){
    this._updateEntityCombatSystems(dt);
    this._updateRuntimeVisualSystems(dt);
    this.updateSpellCooldowns(dt);
    this._updateLowHpHeartbeat(dt);
  },

  _getCameraTargetPosition(){
    return{
      targetX:this.player.x*TILE_SIZE-this.canvas.width/2,
      targetY:this.player.y*TILE_SIZE-this.canvas.height/2
    };
  },

  _applyCameraSmoothing(targetX,targetY,dt){
    this.camX+=(targetX-this.camX)*5*dt;
    this.camY+=(targetY-this.camY)*5*dt;
  },

  _updateCameraPosition(dt){
    const {targetX,targetY}=this._getCameraTargetPosition();
    this._applyCameraSmoothing(targetX,targetY,dt);
  },

  _updatePlayerManaRegenTimer(dt){
    const regen=this.player.class==='mage'?3:this.player.class==='necromancer'?2.5:1;
    this.player.mp=Math.min(this.player.maxMp,this.player.mp+dt*regen);
  },

  _updatePlayerCombatRuntimeTimers(dt){
    if(this.player.iFrames>0)this.player.iFrames-=dt;
    if(this.player.comboTimer>0){
      this.player.comboTimer-=dt;
      if(this.player.comboTimer<=0){
        this.player.combo=0;
        this._updateComboDisplay();
      }
    }
    if(this.player.attackTimer>0)this.player.attackTimer-=dt;
    if(this.player.attackAnim>0)this.player.attackAnim-=dt;
    if((this._mirrorBladeCooldown||0)>0)this._mirrorBladeCooldown=Math.max(0,this._mirrorBladeCooldown-dt);
    if((this._mirrorVeilCooldown||0)>0)this._mirrorVeilCooldown=Math.max(0,this._mirrorVeilCooldown-dt);
    if((this._mirrorEchoCooldown||0)>0)this._mirrorEchoCooldown=Math.max(0,this._mirrorEchoCooldown-dt);
    if((this._riftPulseCooldown||0)>0)this._riftPulseCooldown=Math.max(0,this._riftPulseCooldown-dt);
    if((this._riftAegisCooldown||0)>0)this._riftAegisCooldown=Math.max(0,this._riftAegisCooldown-dt);
    if((this._riftSlashCooldown||0)>0)this._riftSlashCooldown=Math.max(0,this._riftSlashCooldown-dt);
    if((this._obeliskEchoCooldown||0)>0)this._obeliskEchoCooldown=Math.max(0,this._obeliskEchoCooldown-dt);
    if((this._obeliskWardCooldown||0)>0)this._obeliskWardCooldown=Math.max(0,this._obeliskWardCooldown-dt);
    if((this._obeliskWardTimer||0)>0)this._obeliskWardTimer=Math.max(0,this._obeliskWardTimer-dt);
    if((this._obeliskStrikeCooldown||0)>0)this._obeliskStrikeCooldown=Math.max(0,this._obeliskStrikeCooldown-dt);
  },

  _getObeliskWardDefenseBonus(){
    const armor=this.player&&this.player.equipment?this.player.equipment.armor:null;
    if(!(armor&&armor.effect==='obeliskWard'))return 0;
    return (this._obeliskWardTimer||0)>0?4:0;
  },

  _updatePlayerRuntimeTimers(dt){
    this._updatePlayerManaRegenTimer(dt);
    this._updatePlayerCombatRuntimeTimers(dt);
  },
  
  // ---- GAME LOOP ----
  loop(time){
    if(!this.running)return;
    const dt=this._updateFrameTiming(time);
    
    if(!this.paused){
      this.update(dt);
    }
    this.render();
    requestAnimationFrame(t=>this.loop(t));
  },
  
  // ---- UPDATE ----
  update(dt){
    this._updateCoreSystems(dt);
    this._updateCameraPosition(dt);
    this._updatePlayerRuntimeTimers(dt);
  },

  _getVerticalInputAxis(K){
    if(this.keys[K.moveUp.toLowerCase()]||this.keys['arrowup'])return -1;
    if(this.keys[K.moveDown.toLowerCase()]||this.keys['arrowdown'])return 1;
    return 0;
  },

  _getHorizontalInputAxis(K){
    if(this.keys[K.moveLeft.toLowerCase()]||this.keys['arrowleft'])return -1;
    if(this.keys[K.moveRight.toLowerCase()]||this.keys['arrowright'])return 1;
    return 0;
  },

  _normalizeDiagonalInputVector(dx,dy){
    if(dx&&dy){
      return{dx:dx*0.707,dy:dy*0.707};
    }
    return{dx,dy};
  },

  _getPlayerInputVector(){
    const K=KeyBindings;
    const dy=this._getVerticalInputAxis(K);
    const dx=this._getHorizontalInputAxis(K);
    return this._normalizeDiagonalInputVector(dx,dy);
  },

  _computePlayerMoveTarget(p,dx,dy,dt){
    let speed=p.speed*(p.stealthTimer>0?0.7:1);
    // water slows movement — applied BEFORE collision so it never bypasses walls
    const tx=Math.floor(p.x+.5),ty=Math.floor(p.y+.5);
    const curTile=this.dungeon.map[ty]?this.dungeon.map[ty][tx]:0;
    if(curTile===TILE.WATER)speed*=0.5;
    return{
      nx:p.x+dx*speed*dt,
      ny:p.y+dy*speed*dt
    };
  },

  _applyPlayerCollisionMovement(p,nx,ny){
    if(this.dungeon.isPassable(Math.floor(nx+.3),Math.floor(p.y+.3))&&
       this.dungeon.isPassable(Math.floor(nx+.7),Math.floor(p.y+.7))&&
       this.dungeon.isPassable(Math.floor(nx+.3),Math.floor(p.y+.7))&&
       this.dungeon.isPassable(Math.floor(nx+.7),Math.floor(p.y+.3)))
      p.x=nx;
    if(this.dungeon.isPassable(Math.floor(p.x+.3),Math.floor(ny+.3))&&
       this.dungeon.isPassable(Math.floor(p.x+.7),Math.floor(ny+.7))&&
       this.dungeon.isPassable(Math.floor(p.x+.3),Math.floor(ny+.7))&&
       this.dungeon.isPassable(Math.floor(p.x+.7),Math.floor(ny+.3)))
      p.y=ny;
  },

  _updatePlayerAnimationState(p,dx,dy,dt){
    if(dx!==0)p.facing=dx>0?1:-1;
    p.animState=(dx||dy)?'walk':'idle';
    p.animTimer+=dt;
  },

  _applyPlayerTileEffects(p){
    const tileX=Math.floor(p.x+.5),tileY=Math.floor(p.y+.5);
    const tile=this.dungeon.map[tileY]?this.dungeon.map[tileY][tileX]:0;
    if(tile===TILE.LAVA){
      if(!this._lavaTick||this.gameTime-this._lavaTick>.5){
        const hpBefore=p.hp;
        let lavaDmg=5+this.floor;
        const armor=p.equipment&&p.equipment.armor;
        if(armor&&armor.effect==='fireResist')lavaDmg=Math.max(1,Math.floor(lavaDmg*.5));
        this.damagePlayer(lavaDmg,'Obrażenia od lawy!','damage');
        if(p.hp<hpBefore){
          this._hazardHitsTaken=(this._hazardHitsTaken||0)+1;
          Achievements.checkAll(this);
        }
        this._lavaTick=this.gameTime;
        this.particles.fire(p.x+.5,p.y+.5);
      }
    }
    if(tile===TILE.TRAP&&!this._trapCooldown){
      const trapDmg=10+this.floor*3;
      const hpBefore=p.hp;
      this.damagePlayer(trapDmg,'Pułapka!','damage');
      if(p.hp<hpBefore){
        this._hazardHitsTaken=(this._hazardHitsTaken||0)+1;
        Achievements.checkAll(this);
      }
      this.dungeon.map[tileY][tileX]=TILE.FLOOR;
      this.screenFX.shake(5,.2);
      this.sound.hit();
      this._trapCooldown=true;
      setTimeout(()=>this._trapCooldown=false,1000);
    }
  },

  _updateMouseWorldPosition(){
    this.mouseWorldX=(this.mouseX+this.camX)/TILE_SIZE;
    this.mouseWorldY=(this.mouseY+this.camY)/TILE_SIZE;
  },

  _autoPickupNearbyGold(p){
    for(let i=this.items.length-1;i>=0;i--){
      const item=this.items[i];
      if(item.type==='gold'&&Util.dist(p.x+.5,p.y+.5,item.x+.5,item.y+.5)<1.2){
        p.gold+=item.value;this.totalGold+=item.value;
        this.floatingText.add(item.x+.5,item.y,`+${item.value}💰`,'#ff0');
        this.particles.gold(item.x+.5,item.y+.5);
        this.items.splice(i,1);
      }
    }
  },

  _updatePlayerFov(p){
    let radius=FOV_RADIUS+(p.class==='rogue'?2:0);
    if(this.floorAffix&&this.floorAffix.fovPenalty)radius=Math.max(5,radius-this.floorAffix.fovPenalty);
    FOV.compute(this.dungeon,Math.floor(p.x+.5),Math.floor(p.y+.5),radius);
  },
  
});
