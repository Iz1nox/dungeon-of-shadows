'use strict';
// =============================================
// RUCH GRACZA (2.4): rozpęd/hamowanie zamiast natychmiastowej prędkości
// =============================================
const MOVE_TUNING = {accelTime:.08, decelTime:.06};
const DODGE_TUNING = {distance:2.5, duration:.18, cooldown:1.0, graceIFrames:.1, ghostCount:4, ghostLife:.2};

Object.assign(Game, {
  _getPlayerTargetSpeed(p){
    let speed=p.speed*(p.stealthTimer>0?0.7:1);
    const tx=Math.floor(p.x+.5),ty=Math.floor(p.y+.5);
    const curTile=this.dungeon.map[ty]?this.dungeon.map[ty][tx]:0;
    if(curTile===TILE.WATER)speed*=0.5;
    return speed;
  },

  // wykładnicze dążenie do prędkości docelowej — niezależne od FPS;
  // tau = czas/3, więc ~95% celu osiągamy w accelTime / decelTime
  _approachVelocity(cur,target,dt){
    const tau=(target!==0?MOVE_TUNING.accelTime:MOVE_TUNING.decelTime)/3;
    return target+(cur-target)*Math.exp(-dt/tau);
  },

  // ruch per oś przez pełny hitbox; blokada osi zeruje jej prędkość
  _movePlayerAxes(p,dx,dy){
    if(dx!==0){
      if(this._canPlayerOccupy(p.x+dx,p.y))p.x+=dx;
      else p.vx=0;
    }
    if(dy!==0){
      if(this._canPlayerOccupy(p.x,p.y+dy))p.y+=dy;
      else p.vy=0;
    }
  },

  // ---- UNIK (Spacja) ----
  tryDodge(){
    if(this._isGameplayBlocked())return false;
    const p=this.player;
    if((p.dodgeCd||0)>0){
      this._combatFeedback('dodge_cd',`Unik gotowy za ${p.dodgeCd.toFixed(1)}s`);
      return false;
    }
    // kierunek ruchu, a na stojąco — w stronę kursora
    let {dx,dy}=this._getPlayerInputVector();
    let len=Math.hypot(dx,dy);
    if(len<1e-6){
      const a=Util.angle(p.x+.5,p.y+.5,this.mouseWorldX,this.mouseWorldY);
      dx=Math.cos(a);dy=Math.sin(a);len=1;
    }
    p.dodgeDX=dx/len;p.dodgeDY=dy/len;
    p.dodgeTimer=DODGE_TUNING.duration;
    p.dodgeCd=DODGE_TUNING.cooldown;
    p._ghostAcc=DODGE_TUNING.duration/DODGE_TUNING.ghostCount; // pierwszy duch od razu
    p.iFrames=Math.max(p.iFrames||0,DODGE_TUNING.duration+DODGE_TUNING.graceIFrames);
    this._dodgeRolls=(this._dodgeRolls||0)+1;
    this.sound.dodge();
    this.particles.burst(p.x+.5,p.y+.85,8,'#9a8f80',1.4,.3,2);
    return true;
  },

  // doskok: stała prędkość, kroki ≤0,25 kratki przez pełny hitbox; przeszkoda kończy unik
  _updateDodgeMovement(p,dt){
    const t=Math.min(dt,p.dodgeTimer);
    const speed=DODGE_TUNING.distance/DODGE_TUNING.duration;
    const dist=speed*t;
    const steps=Math.max(1,Math.ceil(dist/.25));
    let blocked=false;
    for(let i=0;i<steps&&!blocked;i++){
      const sx=p.dodgeDX*dist/steps,sy=p.dodgeDY*dist/steps;
      if(this._canPlayerOccupy(p.x+sx,p.y+sy)){p.x+=sx;p.y+=sy;}
      else blocked=true;
    }
    p._ghostAcc=(p._ghostAcc||0)+t;
    const ghostEvery=DODGE_TUNING.duration/DODGE_TUNING.ghostCount;
    while(p._ghostAcc>=ghostEvery){
      p._ghostAcc-=ghostEvery;
      this._dodgeGhosts.push({x:p.x,y:p.y,life:DODGE_TUNING.ghostLife});
    }
    p.dodgeTimer-=t;
    if(blocked||p.dodgeTimer<=0){
      p.dodgeTimer=0;
      // wyjście z uniku z normalną prędkością ruchu — bez szarpnięcia
      p.vx=blocked?0:p.dodgeDX*p.speed;
      p.vy=blocked?0:p.dodgeDY*p.speed;
    }
  },

  _updateDodgeTimers(dt){
    const p=this.player;
    if((p.dodgeCd||0)>0)p.dodgeCd=Math.max(0,p.dodgeCd-dt);
    for(let i=this._dodgeGhosts.length-1;i>=0;i--){
      this._dodgeGhosts[i].life-=dt;
      if(this._dodgeGhosts[i].life<=0)this._dodgeGhosts.splice(i,1);
    }
  },

  // miganie od iFrames pomijamy, gdy nietykalność pochodzi z uniku (zamiast tego smuga)
  _isDodgeInvulnerable(p){
    return (p.dodgeTimer||0)>0||(p.dodgeCd||0)>DODGE_TUNING.cooldown-DODGE_TUNING.duration-DODGE_TUNING.graceIFrames;
  },

  _renderDodgeGhosts(ctx,cx,cy){
    if(!this._dodgeGhosts.length)return;
    const icon=this._getPlayerClassIcon(this.player);
    const color=this._getPlayerClassColor(this.player);
    for(const g of this._dodgeGhosts){
      const gx=g.x*TILE_SIZE-cx+TILE_SIZE/2,gy=g.y*TILE_SIZE-cy+TILE_SIZE/2;
      const fade=Math.max(0,g.life/DODGE_TUNING.ghostLife);
      // sylwetka w kolorze klasy — sama ikona ginęła na ciemnej podłodze
      ctx.globalAlpha=.45*fade;ctx.fillStyle=color;
      ctx.beginPath();ctx.arc(gx,gy,TILE_SIZE*.36,0,Math.PI*2);ctx.fill();
      ctx.globalAlpha=.6*fade;
      SpriteCache.draw(ctx,icon,18,gx,gy-1);
    }
    ctx.globalAlpha=1;
  },

  _updatePlayerMovement(p,dt){
    if(!Number.isFinite(p.vx))p.vx=0;
    if(!Number.isFinite(p.vy))p.vy=0;
    if(!Array.isArray(this._dodgeGhosts))this._dodgeGhosts=[];
    this._updateDodgeTimers(dt);
    const {dx,dy}=this._getPlayerInputVector();
    if((p.dodgeTimer||0)>0){
      this._updateDodgeMovement(p,dt);
      return {dx,dy};
    }
    const speed=this._getPlayerTargetSpeed(p);
    p.vx=this._approachVelocity(p.vx,dx*speed,dt);
    p.vy=this._approachVelocity(p.vy,dy*speed,dt);
    if(Math.abs(p.vx)<1e-3)p.vx=0;
    if(Math.abs(p.vy)<1e-3)p.vy=0;
    this._movePlayerAxes(p,p.vx*dt,p.vy*dt);
    return {dx,dy};
  },

  _resetMovementState(){
    const p=this.player;
    this._dodgeGhosts=[];
    if(!p)return;
    p.vx=0;p.vy=0;
    p.dodgeTimer=0;p.dodgeCd=0;p._ghostAcc=0;
  },
});
