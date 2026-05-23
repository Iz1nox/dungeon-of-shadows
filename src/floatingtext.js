'use strict';
// =============================================
// FLOATING TEXT SYSTEM
// =============================================
class FloatingText {
  constructor(){this.texts=[];this.pool=[];}
  add(x,y,text,color='#fff',duration=1,opts){
    const t=this.pool.pop()||{};
    t.x=x;t.y=y;t.text=text;t.color=color;t.life=duration;t.maxLife=duration;t.vy=-2;
    t.scale=(opts&&opts.scale)||1;t.outline=(opts&&opts.outline)||null;
    this.texts.push(t);
  }
  update(dt){
    for(let i=this.texts.length-1;i>=0;i--){
      const t=this.texts[i];
      t.y+=t.vy*dt;t.life-=dt;
      if(t.life<=0){
        this.pool.push(t);
        const li=this.texts.length-1;
        if(i!==li)this.texts[i]=this.texts[li];
        this.texts.pop();
      }
    }
  }
  draw(ctx,camX,camY){
    for(const t of this.texts){
      const a=t.life/t.maxLife;
      ctx.globalAlpha=a;
      const size=Math.round(14*(t.scale||1));
      ctx.font=`bold ${size}px monospace`;ctx.textAlign='center';
      const dx=t.x*TILE_SIZE-camX,dy=t.y*TILE_SIZE-camY;
      if(t.outline){ctx.lineWidth=3;ctx.strokeStyle=t.outline;ctx.lineJoin='round';ctx.strokeText(t.text,dx,dy);}
      ctx.fillStyle=t.color;
      ctx.fillText(t.text,dx,dy);
    }
    ctx.globalAlpha=1;
  }
}

// ItemDB moved to content/items.js

