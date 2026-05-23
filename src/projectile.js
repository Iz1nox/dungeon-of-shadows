'use strict';
// =============================================
// PROJECTILE SYSTEM
// =============================================
class Projectile {
  constructor(x,y,tx,ty,speed,damage,color,fromPlayer,element='',piercing=false,sourceTag=''){
    this.x=x;this.y=y;
    const a=Util.angle(x,y,tx,ty);
    this.vx=Math.cos(a)*speed;this.vy=Math.sin(a)*speed;
    this.speed=speed;this.damage=damage;this.color=color;
    this.fromPlayer=fromPlayer;this.element=element;this.piercing=piercing;
    this.sourceTag=sourceTag;
    this.alive=true;this.life=3;this.trail=[];this.pulse=Math.random()*Math.PI*2;
  }
  update(dt,map){
    this.trail.push({x:this.x,y:this.y});
    if(this.trail.length>8)this.trail.shift();
    this.x+=this.vx*dt;this.y+=this.vy*dt;
    this.pulse+=dt*10;
    this.life-=dt;
    if(this.life<=0)this.alive=false;
    const tx=Math.floor(this.x),ty=Math.floor(this.y);
    if(!map.isPassable(tx,ty))this.alive=false;
  }
  draw(ctx,camX,camY){
    const isFire=this.element==='fire';
    const isIce=this.element==='ice';
    const isPoison=this.element==='poison';
    const isArcane=this.element==='arcane';
    const pulse=.85+Math.sin(this.pulse)*.2;
    const coreR=isArcane?5:isFire?4.6:isIce?4.2:isPoison?4.2:4;

    // trail
    for(let i=0;i<this.trail.length;i++){
      const a=(i+1)/this.trail.length*0.5;
      ctx.globalAlpha=a;ctx.fillStyle=this.color;
      const sx=this.trail[i].x*TILE_SIZE-camX;const sy=this.trail[i].y*TILE_SIZE-camY;
      const ts=isArcane?3:isFire?2.8:isIce?2.4:2.2;
      ctx.beginPath();ctx.arc(sx,sy,ts,0,Math.PI*2);ctx.fill();
    }
    ctx.globalAlpha=1;ctx.fillStyle=this.color;
    const sx=this.x*TILE_SIZE-camX;const sy=this.y*TILE_SIZE-camY;

    if(isIce){
      ctx.save();ctx.translate(sx,sy);ctx.rotate(this.pulse*.2);
      ctx.beginPath();
      ctx.moveTo(0,-coreR*pulse);
      ctx.lineTo(coreR*.7,0);
      ctx.lineTo(0,coreR*pulse);
      ctx.lineTo(-coreR*.7,0);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }else{
      ctx.beginPath();ctx.arc(sx,sy,coreR*pulse,0,Math.PI*2);ctx.fill();
    }

    if(isArcane){
      ctx.globalAlpha=.45;
      ctx.strokeStyle='#f0f';ctx.lineWidth=1.6;
      ctx.beginPath();ctx.arc(sx,sy,coreR*1.8,0,Math.PI*2);ctx.stroke();
      ctx.globalAlpha=1;
    }

    if(isFire){
      ctx.globalAlpha=.35;ctx.fillStyle='#ffb347';
      ctx.beginPath();ctx.arc(sx,sy,coreR*2.2,0,Math.PI*2);ctx.fill();
      ctx.globalAlpha=1;ctx.fillStyle=this.color;
    }
    if(isPoison){
      ctx.globalAlpha=.28;ctx.fillStyle='#7dff7d';
      ctx.beginPath();ctx.arc(sx,sy,coreR*2,0,Math.PI*2);ctx.fill();
      ctx.globalAlpha=1;ctx.fillStyle=this.color;
    }

    // glow
    ctx.globalAlpha=.3;
    ctx.beginPath();ctx.arc(sx,sy,isArcane?10:isFire?9:isIce?8.5:8,0,Math.PI*2);ctx.fill();
    ctx.globalAlpha=1;
  }
}

