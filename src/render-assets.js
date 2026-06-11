'use strict';
// =============================================
// PROCEDURAL TILE TEXTURES + SPRITE CACHE (2.1 visual rework)
// Pre-rendered offscreen canvases: prettier AND faster than
// per-frame path drawing.
// =============================================

function _mulberry32(seed){
  let a=seed>>>0;
  return function(){
    a|=0;a=a+0x6D2B79F5|0;
    let t=Math.imul(a^a>>>15,1|a);
    t=t+Math.imul(t^t>>>7,61|t)^t;
    return((t^t>>>14)>>>0)/4294967296;
  };
}

const TileArt={
  _themeKey:null,
  floorVariants:[],
  wallVariants:[],
  aoN:null,aoS:null,aoE:null,aoW:null,
  wallFace:null,

  _makeCanvas(w,h){const c=document.createElement('canvas');c.width=w;c.height=h;return c;},

  hash(x,y){return((x*73856093)^(y*19349663))>>>0;},
  floorAt(x,y){return this.floorVariants[this.hash(x,y)%this.floorVariants.length];},
  wallAt(x,y){return this.wallVariants[this.hash(x+7,y+3)%this.wallVariants.length];},

  build(theme){
    const key=theme?theme.name:'default';
    if(key===this._themeKey)return;
    this._themeKey=key;
    this.floorVariants=[];
    this.wallVariants=[];
    for(let v=0;v<6;v++){
      this.floorVariants.push(this._buildFloorTexture(theme||{},v));
      this.wallVariants.push(this._buildWallTexture(theme||{},v));
    }
    if(!this.aoN)this._buildOverlays();
  },

  _buildFloorTexture(theme,variant){
    const T=TILE_SIZE;
    const c=this._makeCanvas(T,T);
    const g=c.getContext('2d');
    const hue=theme.floorHue??30,sat=theme.floorSat??5;
    const rnd=_mulberry32(1234+variant*977+hue*31+sat*7);
    const baseL=14+rnd()*5;
    g.fillStyle=Util.hsl(hue,sat,baseL);
    g.fillRect(0,0,T,T);
    // slab joints (grout)
    g.strokeStyle='rgba(0,0,0,0.30)';g.lineWidth=1;
    const off=Math.floor(rnd()*10)-5;
    g.beginPath();
    g.moveTo(0,T/2+off);g.lineTo(T,T/2-off*.4);
    g.moveTo(T/2+off*.8,0);g.lineTo(T/2-off*.6,T);
    g.stroke();
    // per-slab tonal patches
    for(let i=0;i<3;i++){
      g.fillStyle=`rgba(255,255,255,${0.02+rnd()*0.03})`;
      g.fillRect(rnd()*T*.6,rnd()*T*.6,6+rnd()*14,5+rnd()*12);
    }
    // speckle noise
    for(let i=0;i<26;i++){
      const dark=rnd()<.55;
      g.fillStyle=dark?`rgba(0,0,0,${0.05+rnd()*0.08})`:`rgba(255,255,255,${0.03+rnd()*0.05})`;
      g.fillRect(Math.floor(rnd()*T),Math.floor(rnd()*T),1,1);
    }
    // hairline crack on some variants
    if(variant%3===0){
      g.strokeStyle='rgba(0,0,0,0.32)';g.lineWidth=.8;
      g.beginPath();
      let px=4+rnd()*(T-8),py=0;
      g.moveTo(px,py);
      for(let s=0;s<4;s++){px+=(rnd()-.5)*10;py+=T/4;g.lineTo(px,py);}
      g.stroke();
    }
    // diagonal sheen: lit from the upper-left
    const grad=g.createLinearGradient(0,0,T,T);
    grad.addColorStop(0,'rgba(255,255,255,0.05)');
    grad.addColorStop(.5,'rgba(255,255,255,0)');
    grad.addColorStop(1,'rgba(0,0,0,0.09)');
    g.fillStyle=grad;g.fillRect(0,0,T,T);
    return c;
  },

  _buildWallTexture(theme,variant){
    const T=TILE_SIZE;
    const c=this._makeCanvas(T,T);
    const g=c.getContext('2d');
    const hue=theme.wallHue??20,sat=theme.wallSat??10;
    const rnd=_mulberry32(4321+variant*1409+hue*37+sat*11);
    const baseL=21+rnd()*4;
    g.fillStyle=Util.hsl(hue,sat,baseL-6);
    g.fillRect(0,0,T,T); // mortar background
    // brick courses 16x8, alternating offset
    const bh=8,bw=16;
    for(let row=0;row<T/bh;row++){
      const offX=row%2===0?0:bw/2;
      for(let bx=-1;bx<=2;bx++){
        const x=bx*bw+offX,y=row*bh;
        const l=baseL+(rnd()-.5)*8;
        g.fillStyle=Util.hsl(hue+(rnd()-.5)*8,sat,l);
        g.fillRect(x+1,y+1,bw-2,bh-2);
        // top-lit brick edge
        g.fillStyle=`rgba(255,255,255,${0.05+rnd()*0.04})`;
        g.fillRect(x+1,y+1,bw-2,1);
        // bottom shade
        g.fillStyle='rgba(0,0,0,0.18)';
        g.fillRect(x+1,y+bh-2,bw-2,1);
      }
    }
    // weathering
    for(let i=0;i<16;i++){
      g.fillStyle=rnd()<.5?'rgba(0,0,0,0.18)':'rgba(255,255,255,0.05)';
      g.fillRect(Math.floor(rnd()*T),Math.floor(rnd()*T),1+Math.floor(rnd()*2),1);
    }
    // crack on some variants
    if(variant%2===1){
      g.strokeStyle='rgba(0,0,0,0.38)';g.lineWidth=.9;
      g.beginPath();
      let px=4+rnd()*(T-8),py=0;
      g.moveTo(px,py);
      for(let s=0;s<3;s++){px+=(rnd()-.5)*9;py+=T/3;g.lineTo(px,py);}
      g.stroke();
    }
    return c;
  },

  _buildOverlays(){
    const T=TILE_SIZE;
    const mkAO=(x0,y0,x1,y1)=>{
      const c=this._makeCanvas(T,T);
      const g=c.getContext('2d');
      const grad=g.createLinearGradient(x0,y0,x1,y1);
      grad.addColorStop(0,'rgba(0,0,0,0.30)');
      grad.addColorStop(1,'rgba(0,0,0,0)');
      g.fillStyle=grad;g.fillRect(0,0,T,T);
      return c;
    };
    const D=9;
    this.aoN=mkAO(0,0,0,D);
    this.aoS=mkAO(0,T,0,T-D);
    this.aoW=mkAO(0,0,D,0);
    this.aoE=mkAO(T,0,T-D,0);
    // south-facing wall front (pseudo-3D): darkened lower face + lit lip
    const f=this._makeCanvas(T,T);
    const fg=f.getContext('2d');
    const fgrad=fg.createLinearGradient(0,T*.5,0,T);
    fgrad.addColorStop(0,'rgba(0,0,0,0)');
    fgrad.addColorStop(.4,'rgba(0,0,0,0.28)');
    fgrad.addColorStop(1,'rgba(0,0,0,0.55)');
    fg.fillStyle=fgrad;fg.fillRect(0,0,T,T);
    fg.fillStyle='rgba(255,255,255,0.08)';
    fg.fillRect(0,Math.floor(T*.5),T,1);
    this.wallFace=f;
  },
};

// Emoji/glyph sprites with a baked drop shadow — drawn once, blitted each frame.
const SpriteCache={
  _map:new Map(),
  get(icon,size,color='#fff'){
    const key=icon+'|'+size+'|'+color;
    let s=this._map.get(key);
    if(s)return s;
    const pad=Math.ceil(size*.6);
    const c=document.createElement('canvas');
    c.width=c.height=Math.ceil(size+pad*2);
    const g=c.getContext('2d');
    g.font=size+'px serif';
    g.textAlign='center';g.textBaseline='middle';
    g.shadowColor='rgba(0,0,0,0.55)';
    g.shadowBlur=Math.max(2,size*.16);
    g.shadowOffsetY=1;
    g.fillStyle=color;
    g.fillText(icon,c.width/2,c.height/2+size*.06);
    s={canvas:c,half:c.width/2};
    this._map.set(key,s);
    return s;
  },
  draw(ctx,icon,size,cx,cy,color='#fff'){
    const s=this.get(icon,size,color);
    ctx.drawImage(s.canvas,cx-s.half,cy-s.half);
  },
};
