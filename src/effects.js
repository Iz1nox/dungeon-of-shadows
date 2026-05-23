'use strict';
// =============================================
// SCREEN EFFECTS
// =============================================
class ScreenFX {
  constructor(){
    this.shakeAmount=0;this.shakeDuration=0;
    this.flashColor=null;this.flashDuration=0;this.flashAlpha=0;
    this.flashCooldown=0;
    this.vignetteIntensity=0;
  }
  shake(amount,duration){this.shakeAmount=amount;this.shakeDuration=duration;}
  flash(color,duration){
    // anti-flicker: throttle and keep flashes subtle
    if(this.flashCooldown>0&&this.flashAlpha>.08)return;
    const d=Math.max(.03,Math.min(.16,duration||.06));
    const targetAlpha=Math.max(.08,Math.min(.18,.07+d*.5));
    this.flashColor=color;
    this.flashDuration=Math.max(this.flashDuration,d);
    this.flashAlpha=Math.max(this.flashAlpha,targetAlpha);
    this.flashCooldown=.07;
  }
  update(dt){
    if(this.shakeDuration>0)this.shakeDuration-=dt;else this.shakeAmount=0;
    if(this.flashCooldown>0)this.flashCooldown=Math.max(0,this.flashCooldown-dt);
    if(this.flashAlpha>0){this.flashAlpha=Math.max(0,this.flashAlpha-3.2*dt);}
    if(this.flashDuration>0)this.flashDuration-=dt;
  }
  getOffset(){
    if(this.shakeAmount<=0)return{x:0,y:0};
    return{x:Util.randF(-this.shakeAmount,this.shakeAmount),y:Util.randF(-this.shakeAmount,this.shakeAmount)};
  }
  drawFlash(ctx,w,h){
    if(this.flashColor&&this.flashAlpha>0){
      ctx.globalAlpha=this.flashAlpha;ctx.fillStyle=this.flashColor;
      ctx.fillRect(0,0,w,h);ctx.globalAlpha=1;
    }
  }
  drawVignette(ctx,w,h){
    const grd=ctx.createRadialGradient(w/2,h/2,w*.25,w/2,h/2,w*.75);
    grd.addColorStop(0,'rgba(0,0,0,0)');
    grd.addColorStop(.6,'rgba(0,0,0,0.15)');
    grd.addColorStop(1,'rgba(0,0,0,0.7)');
    ctx.fillStyle=grd;ctx.fillRect(0,0,w,h);
  }
}

