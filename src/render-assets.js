'use strict';
// =============================================
// PROCEDURAL TILE TEXTURES + SPRITE CACHE (2.1 visual rework)
// 2.1.2: per-theme texture styles, floor decals, cobwebs,
// corner AO, glowing ember/void veins.
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
  style:'crypt',
  floorVariants:[],
  floorGlow:[],
  corridorVariants:[],
  wallVariants:[],
  decals:[],
  cobwebNW:null,cobwebNE:null,
  aoN:null,aoS:null,aoE:null,aoW:null,
  aoNW:null,aoNE:null,aoSW:null,aoSE:null,
  wallFace:null,

  _makeCanvas(w,h){const c=document.createElement('canvas');c.width=w;c.height=h;return c;},

  hash(x,y){return((x*73856093)^(y*19349663))>>>0;},
  floorAt(x,y){return this.floorVariants[this.hash(x,y)%this.floorVariants.length];},
  floorGlowAt(x,y){return this.floorGlow[this.hash(x,y)%this.floorVariants.length];},
  corridorAt(x,y){return this.corridorVariants[this.hash(x+3,y+9)%this.corridorVariants.length];},
  wallAt(x,y){return this.wallVariants[this.hash(x+7,y+3)%this.wallVariants.length];},

  build(theme){
    const key=theme?theme.name:'default';
    if(key===this._themeKey)return;
    this._themeKey=key;
    this.style=(theme&&theme.style)||'crypt';
    this.floorVariants=[];this.floorGlow=[];
    this.corridorVariants=[];this.wallVariants=[];
    for(let v=0;v<8;v++){
      const f=this._buildFloor(theme||{},v);
      this.floorVariants.push(f.canvas);
      this.floorGlow.push(f.glow||null);
    }
    for(let v=0;v<4;v++)this.corridorVariants.push(this._buildCorridor(theme||{},v));
    for(let v=0;v<6;v++)this.wallVariants.push(this._buildWall(theme||{},v));
    this._buildDecals();
    this._buildCobwebs();
    if(!this.aoN)this._buildOverlays();
  },

  // ---------- shared helpers ----------
  _noise(g,rnd,T,count,darkA,lightA){
    for(let i=0;i<count;i++){
      const dark=rnd()<.55;
      g.fillStyle=dark?`rgba(0,0,0,${darkA+rnd()*darkA})`:`rgba(255,255,255,${lightA+rnd()*lightA})`;
      g.fillRect(Math.floor(rnd()*T),Math.floor(rnd()*T),1,1);
    }
  },

  _sheen(g,T,lightA=.05,darkA=.09){
    const grad=g.createLinearGradient(0,0,T,T);
    grad.addColorStop(0,`rgba(255,255,255,${lightA})`);
    grad.addColorStop(.5,'rgba(255,255,255,0)');
    grad.addColorStop(1,`rgba(0,0,0,${darkA})`);
    g.fillStyle=grad;g.fillRect(0,0,T,T);
  },

  _crackPath(rnd,T){
    const pts=[];
    let px=4+rnd()*(T-8),py=0;
    pts.push([px,py]);
    while(py<T){px+=(rnd()-.5)*9;py+=4+rnd()*5;pts.push([px,py]);}
    return pts;
  },

  _strokePath(g,pts){
    g.beginPath();
    g.moveTo(pts[0][0],pts[0][1]);
    for(let i=1;i<pts.length;i++)g.lineTo(pts[i][0],pts[i][1]);
    g.stroke();
  },

  // ---------- floors ----------
  _buildFloor(theme,variant){
    const T=TILE_SIZE;
    const rnd=_mulberry32(1234+variant*977+(theme.floorHue??30)*31+(theme.floorSat??5)*7);
    switch(this.style){
      case 'cave':return{canvas:this._floorCave(theme,rnd,T,variant),glow:null};
      case 'hell':return this._floorHell(theme,rnd,T,variant);
      case 'shadow':return this._floorObsidian(theme,rnd,T,variant,false);
      case 'abyss':return this._floorObsidian(theme,rnd,T,variant,true);
      default:return{canvas:this._floorSlabs(theme,rnd,T,variant),glow:null};
    }
  },

  // kamienne płyty (Krypta, Katakumby)
  _floorSlabs(theme,rnd,T,variant){
    const c=this._makeCanvas(T,T),g=c.getContext('2d');
    const hue=theme.floorHue??30,sat=theme.floorSat??5;
    g.fillStyle=Util.hsl(hue,sat,14+rnd()*5);
    g.fillRect(0,0,T,T);
    g.strokeStyle='rgba(0,0,0,0.30)';g.lineWidth=1;
    const off=Math.floor(rnd()*10)-5;
    g.beginPath();
    g.moveTo(0,T/2+off);g.lineTo(T,T/2-off*.4);
    g.moveTo(T/2+off*.8,0);g.lineTo(T/2-off*.6,T);
    g.stroke();
    for(let i=0;i<3;i++){
      g.fillStyle=`rgba(255,255,255,${0.02+rnd()*0.03})`;
      g.fillRect(rnd()*T*.6,rnd()*T*.6,6+rnd()*14,5+rnd()*12);
    }
    this._noise(g,rnd,T,26,.06,.04);
    if(variant%3===0){
      g.strokeStyle='rgba(0,0,0,0.32)';g.lineWidth=.8;
      this._strokePath(g,this._crackPath(rnd,T));
    }
    this._sheen(g,T);
    return c;
  },

  // organiczna skała (Jaskinie)
  _floorCave(theme,rnd,T,variant){
    const c=this._makeCanvas(T,T),g=c.getContext('2d');
    const hue=theme.floorHue??100,sat=theme.floorSat??4;
    g.fillStyle=Util.hsl(hue,sat,13+rnd()*4);
    g.fillRect(0,0,T,T);
    // nieregularne plamy gruntu
    for(let i=0;i<4;i++){
      const dark=rnd()<.5;
      g.fillStyle=dark?`rgba(0,0,0,${.05+rnd()*.06})`:`rgba(255,255,255,${.03+rnd()*.04})`;
      g.beginPath();
      g.ellipse(rnd()*T,rnd()*T,4+rnd()*8,3+rnd()*6,rnd()*3.1,0,Math.PI*2);
      g.fill();
    }
    // otoczaki
    const pebbles=2+Math.floor(rnd()*3);
    for(let i=0;i<pebbles;i++){
      const px=3+rnd()*(T-6),py=3+rnd()*(T-6),r=1+rnd()*1.6;
      g.fillStyle=Util.hsl(hue,sat+4,20+rnd()*8);
      g.beginPath();g.arc(px,py,r,0,Math.PI*2);g.fill();
      g.fillStyle='rgba(255,255,255,0.18)';
      g.beginPath();g.arc(px-r*.3,py-r*.35,r*.4,0,Math.PI*2);g.fill();
      g.fillStyle='rgba(0,0,0,0.25)';
      g.beginPath();g.ellipse(px,py+r*.8,r*.9,r*.35,0,0,Math.PI*2);g.fill();
    }
    // wilgotne smugi
    if(variant%2===0){
      g.strokeStyle=`rgba(110,160,140,${.08+rnd()*.06})`;g.lineWidth=2;
      g.beginPath();
      g.moveTo(rnd()*T,0);
      g.quadraticCurveTo(rnd()*T,T/2,rnd()*T,T);
      g.stroke();
    }
    this._noise(g,rnd,T,30,.06,.035);
    this._sheen(g,T,.04,.10);
    return c;
  },

  // spękany bazalt z żyłami żaru (Piekło)
  _floorHell(theme,rnd,T,variant){
    const c=this._makeCanvas(T,T),g=c.getContext('2d');
    const hue=theme.floorHue??10;
    g.fillStyle=Util.hsl(hue,22,9+rnd()*3);
    g.fillRect(0,0,T,T);
    // przypalenia
    for(let i=0;i<3;i++){
      g.fillStyle=`rgba(0,0,0,${.10+rnd()*.12})`;
      g.beginPath();
      g.ellipse(rnd()*T,rnd()*T,4+rnd()*7,3+rnd()*5,rnd()*3.1,0,Math.PI*2);
      g.fill();
    }
    this._noise(g,rnd,T,24,.06,.025);
    const pts=this._crackPath(rnd,T);
    let glow=null;
    if(variant%2===0){
      // szczelina z żarem — animowana poświata w osobnej warstwie
      g.strokeStyle='rgba(96,30,10,0.9)';g.lineWidth=2.2;
      this._strokePath(g,pts);
      glow=this._makeCanvas(T,T);
      const gg=glow.getContext('2d');
      gg.strokeStyle='#ff6a22';gg.lineWidth=1.1;
      gg.shadowColor='#ff4400';gg.shadowBlur=4;
      this._strokePath(gg,pts);
    }else{
      g.strokeStyle='rgba(0,0,0,0.5)';g.lineWidth=1.2;
      this._strokePath(g,pts);
    }
    this._sheen(g,T,.03,.12);
    return{canvas:c,glow};
  },

  // gładki obsydian z runami (Królestwo Cieni / Otchłań)
  _floorObsidian(theme,rnd,T,variant,withVeins){
    const c=this._makeCanvas(T,T),g=c.getContext('2d');
    const hue=theme.floorHue??250,sat=(theme.floorSat??8)+4;
    g.fillStyle=Util.hsl(hue,sat,10+rnd()*3);
    g.fillRect(0,0,T,T);
    // miękkie przebarwienie
    const rg=g.createRadialGradient(T*rnd(),T*rnd(),2,T/2,T/2,T*.8);
    rg.addColorStop(0,`rgba(255,255,255,${.03+rnd()*.03})`);
    rg.addColorStop(1,'rgba(0,0,0,0.06)');
    g.fillStyle=rg;g.fillRect(0,0,T,T);
    // wyblakłe runy
    if(variant%3===2){
      g.strokeStyle='rgba(190,170,255,0.10)';g.lineWidth=1;
      const rx=8+rnd()*(T-16),ry=8+rnd()*(T-16);
      g.beginPath();g.arc(rx,ry,5.5,0,Math.PI*2);g.stroke();
      g.beginPath();g.moveTo(rx-3,ry);g.lineTo(rx+3,ry);g.moveTo(rx,ry-3);g.lineTo(rx,ry+3);g.stroke();
    }
    let glow=null;
    if(withVeins&&variant%2===1){
      // żyły pustki — pulsująca fioletowa poświata
      const pts=this._crackPath(rnd,T);
      g.strokeStyle='rgba(34,20,66,0.9)';g.lineWidth=2;
      this._strokePath(g,pts);
      glow=this._makeCanvas(T,T);
      const gg=glow.getContext('2d');
      gg.strokeStyle='rgba(160,106,255,0.9)';gg.lineWidth=1;
      gg.shadowColor='#8a5aff';gg.shadowBlur=4;
      this._strokePath(gg,pts);
    }
    this._noise(g,rnd,T,12,.05,.03);
    this._sheen(g,T,.09,.14);
    return{canvas:c,glow};
  },

  // korytarz: ten sam styl, ale wydeptany i brudniejszy
  _buildCorridor(theme,variant){
    const T=TILE_SIZE;
    const built=this._buildFloor(theme,variant+11);
    const c=built.canvas,g=c.getContext('2d');
    const rnd=_mulberry32(777+variant*131+(theme.floorHue??30)*13);
    g.fillStyle='rgba(0,0,0,0.10)';
    g.beginPath();g.ellipse(T/2,T/2,12,9,0,0,Math.PI*2);g.fill();
    for(let i=0;i<10;i++){
      g.fillStyle=`rgba(0,0,0,${.05+rnd()*.06})`;
      g.fillRect(Math.floor(rnd()*T),Math.floor(rnd()*T),1,1);
    }
    g.strokeStyle='rgba(0,0,0,0.18)';g.lineWidth=.7;
    for(let i=0;i<2;i++){
      const yy=6+rnd()*20;
      g.beginPath();g.moveTo(3+rnd()*6,yy);g.lineTo(T-3-rnd()*6,yy+(rnd()-.5)*4);g.stroke();
    }
    return c;
  },

  // ---------- walls ----------
  _buildWall(theme,variant){
    const T=TILE_SIZE;
    const rnd=_mulberry32(4321+variant*1409+(theme.wallHue??20)*37+(theme.wallSat??10)*11);
    switch(this.style){
      case 'cave':return this._wallStrata(theme,rnd,T,variant);
      case 'hell':return this._wallBasalt(theme,rnd,T,variant);
      case 'shadow':
      case 'abyss':return this._wallObsidian(theme,rnd,T,variant);
      default:return this._wallBricks(theme,rnd,T,variant);
    }
  },

  // cegły (Krypta, Katakumby)
  _wallBricks(theme,rnd,T,variant){
    const c=this._makeCanvas(T,T),g=c.getContext('2d');
    const hue=theme.wallHue??20,sat=theme.wallSat??10;
    const baseL=21+rnd()*4;
    g.fillStyle=Util.hsl(hue,sat,baseL-6);
    g.fillRect(0,0,T,T);
    const bh=8,bw=16;
    for(let row=0;row<T/bh;row++){
      const offX=row%2===0?0:bw/2;
      for(let bx=-1;bx<=2;bx++){
        const x=bx*bw+offX,y=row*bh;
        const l=baseL+(rnd()-.5)*8;
        g.fillStyle=Util.hsl(hue+(rnd()-.5)*8,sat,l);
        g.fillRect(x+1,y+1,bw-2,bh-2);
        g.fillStyle=`rgba(255,255,255,${0.05+rnd()*0.04})`;
        g.fillRect(x+1,y+1,bw-2,1);
        g.fillStyle='rgba(0,0,0,0.18)';
        g.fillRect(x+1,y+bh-2,bw-2,1);
      }
    }
    for(let i=0;i<16;i++){
      g.fillStyle=rnd()<.5?'rgba(0,0,0,0.18)':'rgba(255,255,255,0.05)';
      g.fillRect(Math.floor(rnd()*T),Math.floor(rnd()*T),1+Math.floor(rnd()*2),1);
    }
    if(variant%2===1){
      g.strokeStyle='rgba(0,0,0,0.38)';g.lineWidth=.9;
      this._strokePath(g,this._crackPath(rnd,T));
    }
    return c;
  },

  // warstwy surowej skały (Jaskinie)
  _wallStrata(theme,rnd,T,variant){
    const c=this._makeCanvas(T,T),g=c.getContext('2d');
    const hue=theme.wallHue??120,sat=theme.wallSat??8;
    const baseL=18+rnd()*4;
    g.fillStyle=Util.hsl(hue,sat,baseL);
    g.fillRect(0,0,T,T);
    // pasy stratygrafii o różnej jasności
    for(let row=0;row<4;row++){
      g.fillStyle=Util.hsl(hue+(rnd()-.5)*10,sat,baseL+(rnd()-.5)*9);
      g.fillRect(0,row*8,T,8);
    }
    // faliste granice warstw
    g.strokeStyle='rgba(0,0,0,0.40)';g.lineWidth=1;
    for(const yLine of[8,16,24]){
      g.beginPath();
      g.moveTo(0,yLine+(rnd()-.5)*2);
      for(let x=4;x<=T;x+=4)g.lineTo(x,yLine+(rnd()-.5)*3);
      g.stroke();
    }
    // pionowe pęknięcie
    if(variant%2===0){
      g.strokeStyle='rgba(0,0,0,0.35)';g.lineWidth=.9;
      this._strokePath(g,this._crackPath(rnd,T));
    }
    // mech przy losowych krawędziach
    if(variant%3===0){
      g.fillStyle='rgba(86,150,74,0.20)';
      for(let i=0;i<3;i++){
        g.beginPath();
        g.ellipse(rnd()*T,T-2-rnd()*6,3+rnd()*4,2+rnd()*2,0,0,Math.PI*2);
        g.fill();
      }
    }
    this._noise(g,rnd,T,20,.06,.04);
    return c;
  },

  // bazaltowe bloki z żarzącymi się spoinami (Piekło)
  _wallBasalt(theme,rnd,T,variant){
    const c=this._makeCanvas(T,T),g=c.getContext('2d');
    const hue=theme.wallHue??5;
    g.fillStyle=Util.hsl(hue,18,10);
    g.fillRect(0,0,T,T);
    const bs=16;
    for(let row=0;row<2;row++){
      const offX=row%2===0?0:bs/2;
      for(let bx=-1;bx<=2;bx++){
        const x=bx*bs+offX,y=row*bs;
        g.fillStyle=Util.hsl(hue+(rnd()-.5)*6,20,12+(rnd()-.5)*5);
        g.fillRect(x+1,y+1,bs-2,bs-2);
        g.fillStyle=`rgba(255,120,60,${0.04+rnd()*0.03})`;
        g.fillRect(x+1,y+1,bs-2,1);
      }
    }
    // żarzące się spoiny
    g.strokeStyle=`rgba(255,70,25,${.14+rnd()*.10})`;g.lineWidth=1;
    g.beginPath();g.moveTo(0,bs+.5);g.lineTo(T,bs+.5);g.stroke();
    const seamX=(variant%2===0?bs:bs/2)+.5;
    g.beginPath();g.moveTo(seamX,0);g.lineTo(seamX,bs);g.stroke();
    g.beginPath();g.moveTo(seamX+bs/2,bs);g.lineTo(seamX+bs/2,T);g.stroke();
    this._noise(g,rnd,T,18,.08,.02);
    return c;
  },

  // wielkie ciemne bloki z kryształami (Cienie / Otchłań)
  _wallObsidian(theme,rnd,T,variant){
    const c=this._makeCanvas(T,T),g=c.getContext('2d');
    const hue=theme.wallHue??250,sat=theme.wallSat??15;
    g.fillStyle=Util.hsl(hue,sat,9);
    g.fillRect(0,0,T,T);
    for(let row=0;row<2;row++){
      const offX=row%2===0?0:T/2;
      for(let bx=-1;bx<=1;bx++){
        const x=bx*T+offX,y=row*16;
        g.fillStyle=Util.hsl(hue+(rnd()-.5)*10,sat,12+(rnd()-.5)*5);
        g.fillRect(x+1,y+1,T-2,14);
        g.fillStyle='rgba(170,150,255,0.07)';
        g.fillRect(x+1,y+1,T-2,1);
      }
    }
    g.strokeStyle='rgba(0,0,0,0.55)';g.lineWidth=1;
    g.beginPath();g.moveTo(0,16.5);g.lineTo(T,16.5);g.stroke();
    // błysk kryształu
    if(variant%2===1){
      const gx=4+rnd()*(T-8),gy=4+rnd()*(T-8);
      g.strokeStyle='rgba(210,195,255,0.55)';g.lineWidth=.8;
      g.beginPath();g.moveTo(gx-2.4,gy);g.lineTo(gx+2.4,gy);g.moveTo(gx,gy-2.4);g.lineTo(gx,gy+2.4);g.stroke();
      g.fillStyle='rgba(235,225,255,0.8)';
      g.beginPath();g.arc(gx,gy,.9,0,Math.PI*2);g.fill();
    }
    this._noise(g,rnd,T,12,.07,.03);
    return c;
  },

  // ---------- floor decals (theme props) ----------
  _buildDecals(){
    const mk=(fn,seed)=>{
      const c=this._makeCanvas(16,16);
      fn.call(this,c.getContext('2d'),_mulberry32(seed));
      return c;
    };
    const sets={
      crypt:[this._decalBone,this._decalRubble,this._decalPebbles],
      catacomb:[this._decalSkull,this._decalBone,this._decalRubble],
      cave:[this._decalMushroom,this._decalPebbles,this._decalMoss],
      hell:[this._decalScorch,this._decalAsh,this._decalEmberRock],
      shadow:[this._decalCrystal,this._decalRubble,this._decalScorch],
      abyss:[this._decalVoidShard,this._decalCrystal,this._decalScorch],
    };
    this.decals=(sets[this.style]||sets.crypt).map((fn,i)=>mk(fn,9000+i*53));
  },

  _decalBone(g,rnd){
    g.strokeStyle='#cfc4a8';g.lineWidth=1.6;g.lineCap='round';
    g.beginPath();g.moveTo(4,11);g.lineTo(11,5);g.stroke();
    g.fillStyle='#cfc4a8';
    for(const[x,y]of[[3.4,10.2],[4.8,12],[10.4,4.2],[12,5.6]]){
      g.beginPath();g.arc(x,y,1.3,0,Math.PI*2);g.fill();
    }
  },

  _decalSkull(g,rnd){
    g.fillStyle='#d6cdb6';
    g.beginPath();g.arc(8,7,4,0,Math.PI*2);g.fill();
    g.fillRect(6,9.5,4,2.5);
    g.fillStyle='#241d14';
    g.beginPath();g.arc(6.6,6.6,1.1,0,Math.PI*2);g.fill();
    g.beginPath();g.arc(9.4,6.6,1.1,0,Math.PI*2);g.fill();
    g.fillRect(7.5,10,.8,1.6);g.fillRect(9,10,.8,1.6);
  },

  _decalRubble(g,rnd){
    for(let i=0;i<4;i++){
      const x=3+rnd()*9,y=4+rnd()*8,s=1.5+rnd()*2.2;
      g.fillStyle=`hsl(30,6%,${22+rnd()*14}%)`;
      g.beginPath();
      g.moveTo(x,y-s);g.lineTo(x+s,y+s*.7);g.lineTo(x-s*.9,y+s*.6);
      g.closePath();g.fill();
    }
  },

  _decalPebbles(g,rnd){
    for(let i=0;i<3;i++){
      const x=4+rnd()*8,y=5+rnd()*7,r=1+rnd()*1.4;
      g.fillStyle=`hsl(40,8%,${26+rnd()*12}%)`;
      g.beginPath();g.arc(x,y,r,0,Math.PI*2);g.fill();
      g.fillStyle='rgba(255,255,255,0.22)';
      g.beginPath();g.arc(x-r*.3,y-r*.3,r*.4,0,Math.PI*2);g.fill();
    }
  },

  _decalMushroom(g,rnd){
    g.fillStyle='#cbb89b';
    g.fillRect(7,8,2.4,4.5);
    g.fillStyle='#a3524a';
    g.beginPath();g.arc(8.2,8,4,Math.PI,0);g.closePath();g.fill();
    g.fillStyle='rgba(255,236,200,0.7)';
    g.beginPath();g.arc(7,6.6,.8,0,Math.PI*2);g.fill();
    g.beginPath();g.arc(9.6,7.1,.6,0,Math.PI*2);g.fill();
  },

  _decalMoss(g,rnd){
    g.fillStyle='rgba(86,150,74,0.40)';
    g.beginPath();g.ellipse(7,8,4.5,3,rnd()*2,0,Math.PI*2);g.fill();
    g.fillStyle='rgba(120,190,100,0.30)';
    g.beginPath();g.ellipse(9.5,9.5,2.6,1.8,rnd()*2,0,Math.PI*2);g.fill();
  },

  _decalScorch(g,rnd){
    const grad=g.createRadialGradient(8,8,0,8,8,7);
    grad.addColorStop(0,'rgba(0,0,0,0.50)');
    grad.addColorStop(1,'rgba(0,0,0,0)');
    g.fillStyle=grad;g.fillRect(0,0,16,16);
  },

  _decalAsh(g,rnd){
    g.fillStyle='rgba(120,112,104,0.55)';
    g.beginPath();g.ellipse(8,9.5,4.5,2.6,0,0,Math.PI*2);g.fill();
    g.fillStyle='rgba(190,182,172,0.5)';
    for(let i=0;i<5;i++){
      g.fillRect(5+rnd()*6,8+rnd()*3,1,1);
    }
  },

  _decalEmberRock(g,rnd){
    g.fillStyle='#2c1b14';
    g.beginPath();g.moveTo(8,4.5);g.lineTo(12,9);g.lineTo(10,12);g.lineTo(5,11.4);g.lineTo(4.4,7.5);g.closePath();g.fill();
    g.shadowColor='#ff5a1e';g.shadowBlur=3;
    g.fillStyle='#ff7a2a';
    g.beginPath();g.arc(7,8.5,.9,0,Math.PI*2);g.fill();
    g.beginPath();g.arc(9.6,9.8,.7,0,Math.PI*2);g.fill();
    g.shadowBlur=0;
  },

  _decalCrystal(g,rnd){
    g.fillStyle='#5a44b8';
    g.beginPath();g.moveTo(8,3);g.lineTo(11,11.5);g.lineTo(5,11.5);g.closePath();g.fill();
    g.strokeStyle='#b9a4ff';g.lineWidth=.8;g.stroke();
    g.strokeStyle='rgba(255,255,255,0.55)';
    g.beginPath();g.moveTo(7.4,4.6);g.lineTo(6.4,10.4);g.stroke();
  },

  _decalVoidShard(g,rnd){
    g.shadowColor='#8a5aff';g.shadowBlur=4;
    g.fillStyle='#7a4ee8';
    g.beginPath();g.moveTo(8,2.6);g.lineTo(11.4,11.8);g.lineTo(4.6,11.8);g.closePath();g.fill();
    g.shadowBlur=0;
    g.strokeStyle='rgba(225,210,255,0.7)';g.lineWidth=.8;
    g.beginPath();g.moveTo(7.2,4.4);g.lineTo(6.2,10.6);g.stroke();
  },

  // ---------- cobwebs ----------
  _buildCobwebs(){
    const webbed=['crypt','catacomb','cave','shadow'];
    if(!webbed.includes(this.style)){this.cobwebNW=null;this.cobwebNE=null;return;}
    const mk=(flip)=>{
      const c=this._makeCanvas(16,16),g=c.getContext('2d');
      if(flip){g.translate(16,0);g.scale(-1,1);}
      g.strokeStyle='rgba(220,226,238,0.30)';g.lineWidth=.7;
      for(const[tx,ty]of[[15,2],[13,8],[8,13],[2,15]]){
        g.beginPath();g.moveTo(0,0);g.lineTo(tx,ty);g.stroke();
      }
      for(const r of[5,9,13]){
        g.beginPath();g.arc(0,0,r,0,Math.PI/2);g.stroke();
      }
      return c;
    };
    this.cobwebNW=mk(false);
    this.cobwebNE=mk(true);
  },

  // ---------- AO + wall face overlays ----------
  _buildOverlays(){
    const T=TILE_SIZE;
    const mkAO=(x0,y0,x1,y1)=>{
      const c=this._makeCanvas(T,T),g=c.getContext('2d');
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
    const mkCorner=(cx,cy)=>{
      const c=this._makeCanvas(T,T),g=c.getContext('2d');
      const grad=g.createRadialGradient(cx,cy,0,cx,cy,11);
      grad.addColorStop(0,'rgba(0,0,0,0.26)');
      grad.addColorStop(1,'rgba(0,0,0,0)');
      g.fillStyle=grad;g.fillRect(0,0,T,T);
      return c;
    };
    this.aoNW=mkCorner(0,0);
    this.aoNE=mkCorner(T,0);
    this.aoSW=mkCorner(0,T);
    this.aoSE=mkCorner(T,T);
    // south-facing wall front (pseudo-3D): darkened lower face + lit lip
    const f=this._makeCanvas(T,T),fg=f.getContext('2d');
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
