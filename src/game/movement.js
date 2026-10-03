'use strict';
// =============================================
// RUCH GRACZA (2.4): rozpęd/hamowanie zamiast natychmiastowej prędkości
// =============================================
const MOVE_TUNING = {accelTime:.08, decelTime:.06};

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

  _updatePlayerMovement(p,dt){
    if(!Number.isFinite(p.vx))p.vx=0;
    if(!Number.isFinite(p.vy))p.vy=0;
    const {dx,dy}=this._getPlayerInputVector();
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
    if(!p)return;
    p.vx=0;p.vy=0;
  },
});
