'use strict';
// =============================================
// ZAPOWIEDZI ATAKÓW (2.4): strefa na podłodze → uderzenie po czasie.
// Obrażenia dostaje tylko ten, kto stoi w strefie W CHWILI uderzenia.
// =============================================
const BOSS_AOE_DAMAGE_MULT = 1.2;      // nieuniknięte, zapowiedziane uderzenie ma boleć
const BOSS_FURY_TELEGRAPH_MULT = .7;   // furia: zapowiedzi krótsze
const RANGED_TELEGRAPH = {duration:.35, width:.15};
const ELITE_PULSE_TELEGRAPH = .4;

Object.assign(Game, {
  telegraphs:[],

  addTelegraph(opts){
    const t={
      shape:'circle',x:0,y:0,r:1,inner:0,angle:0,spread:.5,length:1,width:.5,
      duration:.5,color:'#ff4422',source:null,cancelOnSourceDeath:false,cancelOnSourceCc:false,
      onResolve:null,
      ...opts,
      elapsed:0,done:false,cancelled:false,
    };
    if(!Array.isArray(this.telegraphs))this.telegraphs=[];
    this.telegraphs.push(t);
    return t;
  },

  _pointInTelegraph(t,px,py){
    const dx=px-t.x,dy=py-t.y;
    const d=Math.hypot(dx,dy);
    switch(t.shape){
      case 'circle': return d<=t.r;
      case 'ring': return d<=t.r&&d>=(t.inner||0);
      case 'cone':{
        if(d>t.r)return false;
        if(d<1e-6)return true;
        let diff=Math.abs(Math.atan2(dy,dx)-t.angle)%(Math.PI*2);
        if(diff>Math.PI)diff=Math.PI*2-diff;
        return diff<=t.spread;
      }
      case 'line':{
        const ux=Math.cos(t.angle),uy=Math.sin(t.angle);
        const along=dx*ux+dy*uy;
        if(along<0||along>t.length)return false;
        return Math.abs(-dx*uy+dy*ux)<=t.width/2;
      }
      default: return false;
    }
  },

  isPlayerInTelegraph(t){
    const p=this.player;
    return this._pointInTelegraph(t,p.x+.5,p.y+.5);
  },

  _shouldCancelTelegraph(t){
    const s=t.source;
    if(!s)return false;
    if(t.cancelOnSourceDeath&&s.hp<=0)return true;
    if(t.cancelOnSourceCc&&((s.stunTimer||0)>0||(s.freezeTimer||0)>0))return true;
    return false;
  },

  // wołane z pętli aktualizacji — w pauzie zapowiedzi zamierają
  updateTelegraphs(dt){
    if(!Array.isArray(this.telegraphs)||!this.telegraphs.length)return;
    const list=this.telegraphs.slice();
    for(const t of list){
      if(t.done)continue;
      if(this._shouldCancelTelegraph(t)){t.cancelled=true;t.done=true;continue;}
      t.elapsed+=dt;
      if(t.elapsed<t.duration)continue;
      t.done=true;
      if(typeof t.onResolve==='function')t.onResolve(t);
      if(!this.running)break; // uderzenie zabiło gracza
    }
    this.telegraphs=this.telegraphs.filter(t=>!t.done);
  },

  clearTelegraphs(){
    if(Array.isArray(this.telegraphs))for(const t of this.telegraphs)t.done=true;
    this.telegraphs=[];
  },

  // ---- bossowie: zajęty podczas zapowiedzi, krótsze zapowiedzi w furii ----
  _bossTelegraph(boss,opts){
    const mult=boss.phase>=3?BOSS_FURY_TELEGRAPH_MULT:1;
    const t=this.addTelegraph({...opts,duration:opts.duration*mult,source:boss,cancelOnSourceDeath:true});
    boss._telegraph=t;
    return t;
  },

  _isEnemyTelegraphing(e){
    return !!(e._telegraph&&!e._telegraph.done);
  },

  // ---- rysowanie: kontur + wypełnienie rosnące od środka, rozbłysk tuż przed uderzeniem ----
  _traceTelegraphShape(ctx,t,sx,sy,scale){
    const T=TILE_SIZE;
    switch(t.shape){
      case 'circle':
        ctx.beginPath();ctx.arc(sx,sy,t.r*T*scale,0,Math.PI*2);break;
      case 'ring':{
        const inner=(t.inner||0)*T;
        ctx.beginPath();ctx.arc(sx,sy,inner+(t.r*T-inner)*scale,0,Math.PI*2);
        if(inner>0)ctx.arc(sx,sy,inner,0,Math.PI*2,true);
        break;
      }
      case 'cone':
        ctx.beginPath();ctx.moveTo(sx,sy);ctx.arc(sx,sy,t.r*T*scale,t.angle-t.spread,t.angle+t.spread);ctx.closePath();break;
      case 'line':{
        const ux=Math.cos(t.angle),uy=Math.sin(t.angle),len=t.length*T*scale,hw=t.width*T/2;
        ctx.beginPath();
        ctx.moveTo(sx-uy*hw,sy+ux*hw);ctx.lineTo(sx-uy*hw+ux*len,sy+ux*hw+uy*len);
        ctx.lineTo(sx+uy*hw+ux*len,sy-ux*hw+uy*len);ctx.lineTo(sx+uy*hw,sy-ux*hw);ctx.closePath();
        break;
      }
    }
  },

  _renderTelegraphs(ctx,cx,cy){
    if(!Array.isArray(this.telegraphs)||!this.telegraphs.length)return;
    for(const t of this.telegraphs){
      if(t.done)continue;
      // poza polem widzenia gracza zapowiedź nie zdradza pozycji źródła
      if(!this.dungeon.visible[Math.floor(t.y)]?.[Math.floor(t.x)])continue;
      const prog=Util.clamp(t.elapsed/t.duration,0,1);
      const sx=t.x*TILE_SIZE-cx,sy=t.y*TILE_SIZE-cy;
      ctx.save();
      ctx.fillStyle=t.color;ctx.strokeStyle=t.color;
      ctx.globalAlpha=.18+prog*.17;
      this._traceTelegraphShape(ctx,t,sx,sy,Math.max(.05,prog));ctx.fill();
      ctx.globalAlpha=.55+prog*.35;ctx.lineWidth=t.shape==='line'?1.5:2;
      this._traceTelegraphShape(ctx,t,sx,sy,1);ctx.stroke();
      if(prog>.85){
        ctx.globalAlpha=(prog-.85)/.15*.45;ctx.fillStyle='#fff2d0';
        this._traceTelegraphShape(ctx,t,sx,sy,1);ctx.fill();
      }
      ctx.restore();
    }
  },
});
