'use strict';
Object.assign(Game, {
  updatePlayer(dt){
    const p=this.player;
    const {dx,dy}=this._getPlayerInputVector();
    const {nx,ny}=this._computePlayerMoveTarget(p,dx,dy,dt);
    const ox=p.x,oy=p.y;
    this._applyPlayerCollisionMovement(p,nx,ny);
    this._footstepTimer=(this._footstepTimer||0)-dt;
    if((p.x!==ox||p.y!==oy)&&this._footstepTimer<=0){this.sound.footstep();this._footstepTimer=.3;}
    this._updatePlayerAnimationState(p,dx,dy,dt);
    this._applyPlayerTileEffects(p);
    this._updateMouseWorldPosition();
    this._autoPickupNearbyGold(p);
    this._updatePlayerFov(p);
  },

  _tickAndExpirePlayerBuffs(dt){
    const p=this.player;
    let obeliskDuration=0;
    let mirageDuration=0;
    for(let i=p.buffs.length-1;i>=0;i--){
      p.buffs[i].duration-=dt;
      if(p.buffs[i].duration<=0){
        if(p.buffs[i].type==='str')p.atk-=p.buffs[i].value;
        if(p.buffs[i].type==='def')p.def-=p.buffs[i].value;
        if(p.buffs[i].type==='obelisk'){
          p.atk-=p.buffs[i].atkValue||0;
          p.def-=p.buffs[i].defValue||0;
        }
        if(p.buffs[i].type==='mirage'){
          p.critChance-=p.buffs[i].critValue||0;
          if(!p.talents)p.talents={};
          p.talents.dodge=(p.talents.dodge||0)-(p.buffs[i].dodgeValue||0);
        }
        p.buffs.splice(i,1);
        continue;
      }
      if(p.buffs[i].type==='obelisk')obeliskDuration=Math.max(obeliskDuration,p.buffs[i].duration);
      if(p.buffs[i].type==='mirage')mirageDuration=Math.max(mirageDuration,p.buffs[i].duration);
    }
    this._obeliskPotionTimer=obeliskDuration;
    this._mirrorPotionTimer=mirageDuration;
  },

  _applyPlayerTalentPassiveRegen(dt){
    const p=this.player;
    if(!p.talents)return;
    if(p.talents.regenHp>0)p.hp=Math.min(p.maxHp,p.hp+p.talents.regenHp*dt);
    if(p.talents.regenMp>0)p.mp=Math.min(p.maxMp,p.mp+p.talents.regenMp*dt);
  },

  _applyWellSustainRegen(dt){
    const p=this.player;
    if((this._wellSustainTimer||0)<=0)return;
    const tick=Math.min(dt,this._wellSustainTimer);
    p.hp=Math.min(p.maxHp,p.hp+EVENT_BALANCE.wellSustainRegenHp*tick);
    p.mp=Math.min(p.maxMp,p.mp+EVENT_BALANCE.wellSustainRegenMp*tick);
    this._wellSustainTimer=Math.max(0,this._wellSustainTimer-dt);
  },
  
  updatePlayerBuffs(dt){
    const p=this.player;
    this._tickAndExpirePlayerBuffs(dt);
    if(p.stealthTimer>0){
      this._stealthSeconds=(this._stealthSeconds||0)+dt;
      p.stealthTimer-=dt;
    }
    if(p.rageTimer>0){
      this._rageSeconds=(this._rageSeconds||0)+dt;
      p.rageTimer-=dt;
      if(p.rageTimer<=0)this.log('Szał zakończony','info');
    }

    this._applyPlayerTalentPassiveRegen(dt);
    this._applyWellSustainRegen(dt);
  },

  _tickSpellCooldownTimers(dt){
    for(const s of this.player.spells){
      if(s.cdTimer>0)s.cdTimer=Math.max(0,s.cdTimer-dt);
    }
  },

  _applySpellSlotCooldownUi(slot,spell){
    if(spell.cdTimer>0){
      slot.classList.add('on-cd');
      let cdDiv=slot.querySelector('.cd-overlay');
      if(!cdDiv){cdDiv=document.createElement('div');cdDiv.className='cd-overlay';slot.appendChild(cdDiv);}
      cdDiv.textContent=spell.cdTimer.toFixed(1);
      return;
    }
    slot.classList.remove('on-cd');
    const cdDiv=slot.querySelector('.cd-overlay');
    if(cdDiv)cdDiv.remove();
  },
  
  updateSpellCooldowns(dt){
    this._tickSpellCooldownTimers(dt);
    const slots=document.querySelectorAll('#spell-bar .spell-slot');
    this.player.spells.forEach((s,i)=>{
      if(!slots[i])return;
      this._applySpellSlotCooldownUi(slots[i],s);
    });
  },

});
