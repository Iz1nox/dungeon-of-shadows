'use strict';
// =============================================
// PARTICLE SYSTEM
// =============================================
class Particle {
  constructor(x,y,vx,vy,life,color,size,gravity=0,fade=true){
    this.reset(x,y,vx,vy,life,color,size,gravity,fade);
  }
  reset(x,y,vx,vy,life,color,size,gravity=0,fade=true){
    this.x=x;this.y=y;this.vx=vx;this.vy=vy;this.life=life;this.maxLife=life;
    this.color=color;this.size=size;this.gravity=gravity;this.fade=fade;this.alive=true;
    return this;
  }
  update(dt){
    this.x+=this.vx*dt;this.y+=this.vy*dt;this.vy+=this.gravity*dt;
    this.life-=dt;if(this.life<=0)this.alive=false;
  }
  draw(ctx,camX,camY){
    const a=this.fade?this.life/this.maxLife:1;
    ctx.globalAlpha=a;ctx.fillStyle=this.color;
    const sx=this.x*TILE_SIZE-camX;const sy=this.y*TILE_SIZE-camY;
    ctx.beginPath();ctx.arc(sx,sy,this.size/2,0,Math.PI*2);ctx.fill();
    // glow
    if(this.size>2){ctx.globalAlpha=a*.3;ctx.beginPath();ctx.arc(sx,sy,this.size,0,Math.PI*2);ctx.fill();}
    ctx.globalAlpha=1;
  }
}

class ParticleSystem {
  constructor(){this.particles=[];this.pool=[];}
  _alloc(x,y,vx,vy,life,color,size,gravity=0,fade=true){
    const p=this.pool.pop();
    if(p)return p.reset(x,y,vx,vy,life,color,size,gravity,fade);
    return new Particle(x,y,vx,vy,life,color,size,gravity,fade);
  }
  add(p){this.particles.push(p);}
  update(dt){
    for(let i=this.particles.length-1;i>=0;i--){
      const p=this.particles[i];
      p.update(dt);
      if(!p.alive){
        this.pool.push(p);
        const li=this.particles.length-1;
        if(i!==li)this.particles[i]=this.particles[li];
        this.particles.pop();
      }
    }
  }
  draw(ctx,camX,camY){for(const p of this.particles)p.draw(ctx,camX,camY);}
  
  burst(x,y,count,color,speed=3,life=.5,size=3){
    for(let i=0;i<count;i++){
      const a=Math.random()*Math.PI*2;const s=Util.randF(.5,speed);
      this.add(this._alloc(x,y,Math.cos(a)*s,Math.sin(a)*s,Util.randF(.2,life),color,Util.randF(1,size)));
    }
  }
  blood(x,y){this.burst(x,y,12,'#c00',2,.6,3);}
  magic(x,y,color='#88f'){this.burst(x,y,15,color,2.5,.8,2);}
  gold(x,y){this.burst(x,y,8,'#ff0',1.5,.5,2);}
  fire(x,y){
    for(let i=0;i<6;i++){
      const a=Util.randF(-0.5,0.5);
      this.add(this._alloc(x+Util.randF(-.2,.2),y,Math.sin(a)*1,-Util.randF(1,3),Util.randF(.3,.7),Util.pick(['#f80','#f40','#ff0','#f00']),Util.randF(2,4),0,true));
    }
  }
  heal(x,y){
    for(let i=0;i<10;i++){
      this.add(this._alloc(x+Util.randF(-.3,.3),y+Util.randF(-.3,.3),Util.randF(-.5,.5),-Util.randF(1,2),Util.randF(.5,1),'#0f0',Util.randF(2,3)));
    }
  }
  lightning(x1,y1,x2,y2){
    const dist=Util.dist(x1,y1,x2,y2);
    const steps=Math.max(10,Math.floor(dist*8));
    let prevX=x1,prevY=y1;
    const jitter=.35;
    for(let i=1;i<=steps;i++){
      const t=i/steps;
      const bx=Util.lerp(x1,x2,t);
      const by=Util.lerp(y1,y2,t);
      const px=bx+Util.randF(-jitter,jitter);
      const py=by+Util.randF(-jitter,jitter);

      const segDx=px-prevX,segDy=py-prevY;
      const segLen=Math.hypot(segDx,segDy)||1;
      const nx=segDx/segLen,ny=segDy/segLen;

      this.add(this._alloc(px,py,nx*1.2+Util.randF(-.4,.4),ny*1.2+Util.randF(-.4,.4),Util.randF(.18,.28),'#eaf6ff',Util.randF(3,5),0,true));
      if(i%2===0)this.add(this._alloc(px,py,0,0,Util.randF(.12,.22),Util.pick(['#9fd8ff','#88bbff','#b6e6ff']),Util.randF(4,7),0,true));

      if(i%5===0){
        const branchX=px+Util.randF(-.6,.6);
        const branchY=py+Util.randF(-.6,.6);
        this.add(this._alloc(branchX,branchY,Util.randF(-1,1),Util.randF(-1,1),Util.randF(.10,.20),Util.pick(['#7eb8ff','#bde6ff']),Util.randF(2,4),0,true));
      }

      prevX=px;prevY=py;
    }

    this.burst(x1,y1,5,'#cfefff',1.8,.22,3);
    this.burst(x2,y2,7,'#9fd8ff',2.2,.28,3.5);
  }
}

