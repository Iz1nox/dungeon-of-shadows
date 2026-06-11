'use strict';
Object.assign(Game, {
  _getFloorTransitionSubtitle(){
    if(this.endlessMode)return this.floor%3===0?'⚠️ Coś pradawnego budzi się w głębi...':'Otchłań nie ma dna...';
    if(this.floor===MAX_FLOOR)return '⚠️ Strażnik lochu czeka...';
    return this.floor%3===0?'⚠️ Wyczuwasz potężną obecność...':'Schodzisz głębiej w mrok...';
  },

  _setFloorTransitionContent(){
    const title=document.getElementById('ft-title');
    const sub=document.getElementById('ft-sub');
    title.textContent=this.endlessMode?`🕳️ Otchłań ${this.floor-MAX_FLOOR}`:`📍 Piętro ${this.floor}`;
    sub.textContent=this._getFloorTransitionSubtitle();
  },

  _deactivateFloorTransition(ft){
    ft.classList.remove('active');
  },

  _startFloorTransitionFadeOut(ft){
    ft.style.opacity='0';
    setTimeout(()=>this._deactivateFloorTransition(ft),400);
  },

  _fadeOutFloorTransition(ft){
    setTimeout(()=>this._startFloorTransitionFadeOut(ft),800);
  },

  _executeFloorTransitionCallback(ft,callback){
    callback();
    this._fadeOutFloorTransition(ft);
  },

  _scheduleFloorTransitionCallback(ft,callback){
    setTimeout(()=>this._executeFloorTransitionCallback(ft,callback),600);
  },
  
  // ---- FLOOR TRANSITION ----
  showFloorTransition(callback){
    const ft=document.getElementById('floor-transition');
    this._setFloorTransitionContent();
    ft.classList.add('active');
    ft.style.opacity='0';
    // fade in
    requestAnimationFrame(()=>{
      ft.style.opacity='1';
      this._scheduleFloorTransitionCallback(ft,callback);
    });
  },

  _isSolidTile(t){
    return t===TILE.WALL||t===TILE.SECRET_WALL||t===TILE.VOID;
  },

  _renderWallTile(ctx,x,y,sx,sy){
    ctx.drawImage(TileArt.wallAt(x,y),sx,sy);
    const below=y<MAP_H-1?this.dungeon.map[y+1][x]:TILE.WALL;
    if(!this._isSolidTile(below)){
      // south-facing wall: shaded front face (pseudo-3D)
      ctx.drawImage(TileArt.wallFace,sx,sy);
      ctx.fillStyle='rgba(255,255,255,0.06)';
      ctx.fillRect(sx,sy+TILE_SIZE-1,TILE_SIZE,1);
    }
    const above=y>0?this.dungeon.map[y-1][x]:TILE.WALL;
    if(!this._isSolidTile(above)){
      ctx.fillStyle='rgba(255,255,255,0.05)';
      ctx.fillRect(sx,sy,TILE_SIZE,1);
    }
  },

  _renderFloorAO(ctx,x,y,sx,sy){
    const m=this.dungeon.map;
    const N=y>0&&this._isSolidTile(m[y-1][x]);
    const S=y<MAP_H-1&&this._isSolidTile(m[y+1][x]);
    const W=x>0&&this._isSolidTile(m[y][x-1]);
    const E=x<MAP_W-1&&this._isSolidTile(m[y][x+1]);
    if(N)ctx.drawImage(TileArt.aoN,sx,sy);
    if(S)ctx.drawImage(TileArt.aoS,sx,sy);
    if(W)ctx.drawImage(TileArt.aoW,sx,sy);
    if(E)ctx.drawImage(TileArt.aoE,sx,sy);
    // diagonal corners only when the orthogonal sides are open
    if(!N&&!W&&y>0&&x>0&&this._isSolidTile(m[y-1][x-1]))ctx.drawImage(TileArt.aoNW,sx,sy);
    if(!N&&!E&&y>0&&x<MAP_W-1&&this._isSolidTile(m[y-1][x+1]))ctx.drawImage(TileArt.aoNE,sx,sy);
    if(!S&&!W&&y<MAP_H-1&&x>0&&this._isSolidTile(m[y+1][x-1]))ctx.drawImage(TileArt.aoSW,sx,sy);
    if(!S&&!E&&y<MAP_H-1&&x<MAP_W-1&&this._isSolidTile(m[y+1][x+1]))ctx.drawImage(TileArt.aoSE,sx,sy);
  },

  _renderFloorDecor(ctx,x,y,sx,sy){
    if(!TileArt.decals.length)return;
    const h=TileArt.hash(x*3+11,y*5+7);
    if(h%13!==0)return;
    const d=TileArt.decals[h%TileArt.decals.length];
    const ox=((h>>3)%7)-3,oy=((h>>5)%7)-3;
    ctx.drawImage(d,sx+(TILE_SIZE-d.width)/2+ox,sy+(TILE_SIZE-d.height)/2+oy);
  },

  _renderCobweb(ctx,x,y,sx,sy){
    if(!TileArt.cobwebNW)return;
    const m=this.dungeon.map;
    const N=y>0&&this._isSolidTile(m[y-1][x]);
    if(!N)return;
    const h=TileArt.hash(x+13,y+29);
    if(h%6===0&&x>0&&this._isSolidTile(m[y][x-1])){
      ctx.drawImage(TileArt.cobwebNW,sx,sy);
    }else if(h%6===1&&x<MAP_W-1&&this._isSolidTile(m[y][x+1])){
      ctx.drawImage(TileArt.cobwebNE,sx+TILE_SIZE-TileArt.cobwebNE.width,sy);
    }
  },

  _renderFloorTile(ctx,x,y,sx,sy){
    const isCorridor=this.dungeon.map[y][x]===TILE.CORRIDOR;
    ctx.drawImage(isCorridor?TileArt.corridorAt(x,y):TileArt.floorAt(x,y),sx,sy);
    if(!isCorridor){
      const glow=TileArt.floorGlowAt(x,y);
      if(glow){
        // pulsujące żyły żaru / pustki
        const prev=ctx.globalAlpha;
        ctx.globalAlpha=prev*(.45+Math.sin(this.animTime*2.1+x*1.3+y*.7)*.3);
        ctx.drawImage(glow,sx,sy);
        ctx.globalAlpha=prev;
      }
      this._renderFloorDecor(ctx,x,y,sx,sy);
    }
    this._renderFloorAO(ctx,x,y,sx,sy);
    this._renderCobweb(ctx,x,y,sx,sy);
  },

  _renderTrapTile(ctx,x,y,sx,sy,visible){
    const cx=sx+TILE_SIZE/2,cy=sy+TILE_SIZE/2;
    this._renderFloorTile(ctx,x,y,sx,sy);
    // stone pressure plate, distinct from plain floor
    ctx.fillStyle='rgba(20,13,9,0.85)';ctx.fillRect(sx+2,sy+2,TILE_SIZE-4,TILE_SIZE-4);
    ctx.strokeStyle='rgba(0,0,0,0.55)';ctx.lineWidth=1;
    ctx.strokeRect(sx+3.5,sy+3.5,TILE_SIZE-7,TILE_SIZE-7);
    ctx.fillStyle='#3a2c20';
    for(const[rx,ry]of[[5,5],[TILE_SIZE-5,5],[5,TILE_SIZE-5],[TILE_SIZE-5,TILE_SIZE-5]]){
      ctx.beginPath();ctx.arc(sx+rx,sy+ry,1.5,0,Math.PI*2);ctx.fill();
    }
    // spike holes
    ctx.fillStyle='#0c0806';
    for(const[dx,dy]of[[0,0],[-6,0],[6,0],[0,-6],[0,6]]){
      ctx.beginPath();ctx.arc(cx+dx,cy+dy,1.7,0,Math.PI*2);ctx.fill();
    }
    if(!visible)return;
    const pulse=.5+Math.sin(this.animTime*5)*.5;
    // pulsing danger glow — readable for ALL classes
    ctx.globalAlpha=.16+pulse*.22;
    ctx.fillStyle='#ff5a1e';
    ctx.fillRect(sx+2,sy+2,TILE_SIZE-4,TILE_SIZE-4);
    ctx.globalAlpha=1;
    // warning triangle (brighter for rogue, who reads traps best)
    ctx.globalAlpha=(this.player.class==='rogue'?.7:.45)+pulse*.3;
    ctx.strokeStyle='#ffb04a';ctx.lineWidth=1.6;ctx.lineJoin='round';
    ctx.beginPath();ctx.moveTo(cx,cy-6);ctx.lineTo(cx+6,cy+5);ctx.lineTo(cx-6,cy+5);ctx.closePath();ctx.stroke();
    ctx.beginPath();ctx.moveTo(cx,cy-2);ctx.lineTo(cx,cy+1.5);ctx.stroke();
    ctx.fillStyle='#ffb04a';ctx.beginPath();ctx.arc(cx,cy+3.5,.85,0,Math.PI*2);ctx.fill();
    ctx.globalAlpha=1;
  },

  // shared look for "special spot" tiles: real floor + rune ring + glowing glyph
  _renderSpecialSpotTile(ctx,x,y,sx,sy,alpha,opts){
    this._renderFloorTile(ctx,x,y,sx,sy);
    const cx=sx+TILE_SIZE/2,cy=sy+TILE_SIZE/2;
    const pulse=.5+Math.sin(this.animTime*(opts.pulseSpeed||2.6)+x*1.7)*.5;
    // soft colored glow
    ctx.globalAlpha=(.10+pulse*.16)*alpha;
    ctx.fillStyle=opts.color;
    ctx.beginPath();ctx.arc(cx,cy,TILE_SIZE*.52,0,Math.PI*2);ctx.fill();
    // rotating rune ring
    ctx.globalAlpha=(.35+pulse*.35)*alpha;
    ctx.strokeStyle=opts.color;ctx.lineWidth=1.2;
    ctx.setLineDash([4,5]);
    ctx.save();
    ctx.translate(cx,cy);ctx.rotate(this.animTime*(opts.spin||.6));
    ctx.beginPath();ctx.arc(0,0,TILE_SIZE*.42,0,Math.PI*2);ctx.stroke();
    ctx.restore();
    ctx.setLineDash([]);
    ctx.globalAlpha=alpha;
    const bob=Math.sin(this.animTime*2.2+x)*1.4;
    SpriteCache.draw(ctx,opts.icon,20,cx,cy+bob-1,opts.glyphColor||'#fff');
  },

  _renderChestTile(ctx,x,y,sx,sy,alpha){
    this._renderFloorTile(ctx,x,y,sx,sy);
    const cx=sx+TILE_SIZE/2;
    ctx.globalAlpha=.3*alpha;ctx.fillStyle='#000';
    ctx.beginPath();ctx.ellipse(cx,sy+TILE_SIZE-6,8,2.6,0,0,Math.PI*2);ctx.fill();
    ctx.globalAlpha=alpha;
    SpriteCache.draw(ctx,'📦',20,cx,sy+TILE_SIZE*.52);
    // wandering sparkle
    ctx.globalAlpha=Math.abs(Math.sin(this.animTime*3+x))*.6*alpha;
    ctx.fillStyle='#ffe27a';
    ctx.beginPath();ctx.arc(cx+Math.sin(this.animTime*4+y)*7,sy+8,1.6,0,Math.PI*2);ctx.fill();
    ctx.globalAlpha=alpha;
  },

  _renderInteractiveTile(ctx,tile,x,y,sx,sy,alpha,visible){
    switch(tile){
      case TILE.TRAP:
        this._renderTrapTile(ctx,x,y,sx,sy,visible);
        return true;
      case TILE.CHEST:
        this._renderChestTile(ctx,x,y,sx,sy,alpha);
        return true;
      case TILE.SHRINE:
        this._renderSpecialSpotTile(ctx,x,y,sx,sy,alpha,{icon:'⛩️',color:'#4af',pulseSpeed:2});
        return true;
      case TILE.SHOP:
        this._renderSpecialSpotTile(ctx,x,y,sx,sy,alpha,{icon:'🏪',color:'#f80',pulseSpeed:2.4,spin:.4});
        return true;
      case TILE.EVENT:
        this._renderSpecialSpotTile(ctx,x,y,sx,sy,alpha,{icon:'🜂',color:'#6cf',pulseSpeed:3.2,glyphColor:'#bfe6ff'});
        return true;
      case TILE.WELL:
        this._renderSpecialSpotTile(ctx,x,y,sx,sy,alpha,{icon:'🕳️',color:'#b58cff',pulseSpeed:2.7});
        return true;
      case TILE.RIFT:
        this._renderSpecialSpotTile(ctx,x,y,sx,sy,alpha,{icon:'🌀',color:'#7a5bff',pulseSpeed:3.4,spin:1.4});
        return true;
      case TILE.OBELISK:
        this._renderSpecialSpotTile(ctx,x,y,sx,sy,alpha,{icon:'🗿',color:'#6f93ff',pulseSpeed:2.8,spin:.3});
        return true;
      case TILE.ARENA:
        this._renderSpecialSpotTile(ctx,x,y,sx,sy,alpha,{icon:'⚔️',color:'#ff6655',pulseSpeed:3.6,spin:1.1});
        return true;
      default:
        return false;
    }
  },

  _renderLockedDoorTile(ctx,sx,sy){
    this._renderDoorTile(ctx,sx,sy);
    // złota kłódka
    const cx=sx+TILE_SIZE/2,cy=sy+TILE_SIZE*.5;
    const glow=.4+Math.sin(this.animTime*2.5)*.2;
    ctx.globalAlpha=glow;
    ctx.fillStyle='#ffd870';
    ctx.beginPath();ctx.arc(cx,cy,7,0,Math.PI*2);ctx.fill();
    ctx.globalAlpha=1;
    ctx.fillStyle='#e8b24a';
    ctx.fillRect(cx-3.5,cy-2,7,6.5);
    ctx.strokeStyle='#e8b24a';ctx.lineWidth=1.6;
    ctx.beginPath();ctx.arc(cx,cy-2,2.6,Math.PI,0);ctx.stroke();
    ctx.fillStyle='#5a4010';
    ctx.beginPath();ctx.arc(cx,cy+.6,1.1,0,Math.PI*2);ctx.fill();
    ctx.fillRect(cx-.5,cy+.6,1,2);
  },

  _renderDoorTile(ctx,sx,sy){
    // stone arch frame
    ctx.fillStyle='#2c241a';ctx.fillRect(sx,sy,TILE_SIZE,TILE_SIZE);
    ctx.fillStyle='#46392a';
    ctx.fillRect(sx,sy,3,TILE_SIZE);ctx.fillRect(sx+TILE_SIZE-3,sy,3,TILE_SIZE);
    ctx.fillRect(sx,sy,TILE_SIZE,3);
    // wooden planks
    const px=sx+4,pw=TILE_SIZE-8;
    const plankGrad=ctx.createLinearGradient(sx,sy,sx,sy+TILE_SIZE);
    plankGrad.addColorStop(0,'#8a6a44');plankGrad.addColorStop(1,'#5e4527');
    ctx.fillStyle=plankGrad;ctx.fillRect(px,sy+3,pw,TILE_SIZE-6);
    ctx.strokeStyle='rgba(40,26,12,0.7)';ctx.lineWidth=1;
    for(let i=1;i<4;i++){
      ctx.beginPath();ctx.moveTo(px+i*pw/4,sy+3);ctx.lineTo(px+i*pw/4,sy+TILE_SIZE-3);ctx.stroke();
    }
    // iron bands + rivets
    ctx.fillStyle='#3b3b42';
    ctx.fillRect(px,sy+7,pw,3);ctx.fillRect(px,sy+TILE_SIZE-11,pw,3);
    ctx.fillStyle='#6a6a74';
    for(const bx of[px+2,px+pw/2-1,px+pw-4]){
      ctx.fillRect(bx,sy+7.5,2,2);ctx.fillRect(bx,sy+TILE_SIZE-10.5,2,2);
    }
    // handle ring
    ctx.strokeStyle='#d8b15e';ctx.lineWidth=1.4;
    ctx.beginPath();ctx.arc(sx+TILE_SIZE*.7,sy+TILE_SIZE*.52,3.2,0,Math.PI*2);ctx.stroke();
    ctx.fillStyle='#f2cd7c';
    ctx.beginPath();ctx.arc(sx+TILE_SIZE*.7,sy+TILE_SIZE*.43,1.2,0,Math.PI*2);ctx.fill();
  },

  _renderStairsDownTile(ctx,x,y,sx,sy,alpha){
    this._renderFloorTile(ctx,x,y,sx,sy);
    // descending steps into darkness
    const steps=4;
    for(let s=0;s<steps;s++){
      const inset=3+s*3.5;
      const shade=.35+s*.18;
      ctx.fillStyle=`rgba(0,0,0,${shade})`;
      ctx.fillRect(sx+inset,sy+inset,TILE_SIZE-inset*2,TILE_SIZE-inset*2);
      ctx.fillStyle='rgba(255,255,255,0.05)';
      ctx.fillRect(sx+inset,sy+inset,TILE_SIZE-inset*2,1);
    }
    // cool glow seeping up
    const stGlow=.14+Math.sin(this.animTime*2.5)*.12;
    const cx=sx+TILE_SIZE/2,cyy=sy+TILE_SIZE/2;
    const stGrad=ctx.createRadialGradient(cx,cyy,0,cx,cyy,TILE_SIZE*.7);
    stGrad.addColorStop(0,`rgba(68,170,255,${stGlow})`);stGrad.addColorStop(1,'rgba(68,170,255,0)');
    ctx.fillStyle=stGrad;ctx.fillRect(sx-4,sy-4,TILE_SIZE+8,TILE_SIZE+8);
    const stBob=Math.sin(this.animTime*3)*2;
    SpriteCache.draw(ctx,'⬇',16,cx,cyy+stBob,'#8fc8ff');
    ctx.globalAlpha=alpha;
  },

  _renderWaterTile(ctx,x,y,sx,sy){
    const wPhase=this.animTime*1.5;
    const waterBase=Util.hsl(210,55,22);
    ctx.fillStyle=waterBase;ctx.fillRect(sx,sy,TILE_SIZE,TILE_SIZE);
    // foam line where water meets land
    {
      const m=this.dungeon.map;
      ctx.strokeStyle=`rgba(170,220,255,${.22+Math.sin(wPhase*2+x+y)*.08})`;
      ctx.lineWidth=1.2;
      if(y>0&&m[y-1][x]!==TILE.WATER){ctx.beginPath();ctx.moveTo(sx+1,sy+1);ctx.lineTo(sx+TILE_SIZE-1,sy+1);ctx.stroke();}
      if(y<MAP_H-1&&m[y+1][x]!==TILE.WATER){ctx.beginPath();ctx.moveTo(sx+1,sy+TILE_SIZE-1);ctx.lineTo(sx+TILE_SIZE-1,sy+TILE_SIZE-1);ctx.stroke();}
      if(x>0&&m[y][x-1]!==TILE.WATER){ctx.beginPath();ctx.moveTo(sx+1,sy+1);ctx.lineTo(sx+1,sy+TILE_SIZE-1);ctx.stroke();}
      if(x<MAP_W-1&&m[y][x+1]!==TILE.WATER){ctx.beginPath();ctx.moveTo(sx+TILE_SIZE-1,sy+1);ctx.lineTo(sx+TILE_SIZE-1,sy+TILE_SIZE-1);ctx.stroke();}
    }
    ctx.strokeStyle='rgba(100,180,255,0.18)';ctx.lineWidth=1;
    for(let w=0;w<3;w++){
      const wy=sy+8+w*9+Math.sin(wPhase+x*.7+w*2)*3;
      ctx.beginPath();ctx.moveTo(sx,wy);
      for(let wx=0;wx<=TILE_SIZE;wx+=4)ctx.lineTo(sx+wx,wy+Math.sin(wPhase*1.3+wx*.15+x+w)*2);
      ctx.stroke();
    }
    const shimmer=Math.sin(wPhase*2+x*1.1+y*.7)*.5+.5;
    ctx.fillStyle=`rgba(140,200,255,${shimmer*.08})`;ctx.fillRect(sx,sy,TILE_SIZE,TILE_SIZE);
    if((x*7+y*3)%5===0){
      const rr=4+Math.sin(wPhase+x*2)*3;
      ctx.strokeStyle=`rgba(150,210,255,${.12+Math.sin(wPhase+x)*0.06})`;ctx.lineWidth=.7;
      ctx.beginPath();ctx.arc(sx+TILE_SIZE/2+Math.sin(wPhase+x)*5,sy+TILE_SIZE/2+Math.cos(wPhase*.8+y)*4,rr,0,Math.PI*2);ctx.stroke();
    }
  },

  _renderLavaTile(ctx,x,y,sx,sy,visible){
    const lT=this.animTime;
    const lPhase=Math.sin(lT*2.5+x*1.3+y);
    const lHue=15+lPhase*12;
    ctx.fillStyle=Util.hsl(lHue,85,30+lPhase*8);ctx.fillRect(sx,sy,TILE_SIZE,TILE_SIZE);
    ctx.strokeStyle=`rgba(255,${180+Math.floor(lPhase*40)},0,0.5)`;ctx.lineWidth=1.2;
    ctx.beginPath();
    ctx.moveTo(sx+4+Math.sin(lT+x)*3,sy+TILE_SIZE/2);
    ctx.quadraticCurveTo(sx+TILE_SIZE/2,sy+8+Math.cos(lT*1.5+y)*6,sx+TILE_SIZE-4+Math.cos(lT+y)*3,sy+TILE_SIZE/2);
    ctx.stroke();
    const glowA=.15+Math.sin(lT*3+x+y)*.08;
    ctx.fillStyle=`rgba(255,120,0,${glowA})`;ctx.fillRect(sx,sy,TILE_SIZE,TILE_SIZE);
    if(visible&&Util.chance(.003)){this.particles.fire(x+.5,y+.5);}
    const bubX=sx+TILE_SIZE/2+Math.sin(lT*2+x)*6;
    const bubY=sy+TILE_SIZE/2+Math.cos(lT*1.7+y)*6;
    const bubR=2+Math.sin(lT*3+x*y);
    ctx.fillStyle=`rgba(255,220,0,${.2+Math.sin(lT*4+x)*0.1})`;ctx.beginPath();ctx.arc(bubX,bubY,bubR,0,Math.PI*2);ctx.fill();
  },

  _renderFloorItems(ctx,cx,cy){
    for(const item of this.items){
      const ix=Math.floor(item.x),iy=Math.floor(item.y);
      if(!this.dungeon.visible[iy]?.[ix])continue;
      const sx=item.x*TILE_SIZE-cx;const sy=item.y*TILE_SIZE-cy;
      const icx=sx+TILE_SIZE/2;
      const glowColor=ItemDB.rarityColors[item.rarity]||'#ccc';
      const pulse=.5+Math.sin(this.animTime*3+item.x*1.3)*.5;
      // ground shadow
      ctx.globalAlpha=.3;ctx.fillStyle='#000';
      ctx.beginPath();ctx.ellipse(icx,sy+TILE_SIZE-7,7,2.4,0,0,Math.PI*2);ctx.fill();
      // soft rarity glow + pulsing ring
      ctx.globalAlpha=.10+pulse*.12;
      ctx.fillStyle=glowColor;
      ctx.beginPath();ctx.arc(icx,sy+TILE_SIZE/2+1,TILE_SIZE*.36,0,Math.PI*2);ctx.fill();
      ctx.globalAlpha=.25+pulse*.3;
      ctx.strokeStyle=glowColor;ctx.lineWidth=1.4;
      ctx.beginPath();ctx.arc(icx,sy+TILE_SIZE/2+1,9+pulse*2.5,0,Math.PI*2);ctx.stroke();
      ctx.globalAlpha=1;
      const bob=Math.sin(this.animTime*2.2+item.x*1.7)*1.6;
      SpriteCache.draw(ctx,item.icon,18,icx,sy+TILE_SIZE/2+bob);
    }
  },

  // standing braziers at room light sources — the world's light has a source now
  _renderBraziers(ctx,cx,cy){
    const m=this.dungeon.map;
    for(const light of this.dungeon.lightSources){
      const t=m[light.y]?.[light.x];
      if(t!==TILE.FLOOR&&t!==TILE.CORRIDOR)continue;
      if(!this.dungeon.visible[light.y]?.[light.x])continue;
      const bx=light.x*TILE_SIZE-cx+TILE_SIZE/2;
      const by=light.y*TILE_SIZE-cy+TILE_SIZE/2;
      ctx.globalAlpha=.3;ctx.fillStyle='#000';
      ctx.beginPath();ctx.ellipse(bx,by+10,6,2,0,0,Math.PI*2);ctx.fill();
      ctx.globalAlpha=1;
      // stem + bowl
      ctx.fillStyle='#241b13';
      ctx.fillRect(bx-1.5,by+1,3,9);
      ctx.beginPath();ctx.moveTo(bx-6.5,by-1);ctx.lineTo(bx+6.5,by-1);ctx.lineTo(bx+4,by+3.5);ctx.lineTo(bx-4,by+3.5);ctx.closePath();ctx.fill();
      ctx.strokeStyle='#4a3826';ctx.lineWidth=1;ctx.stroke();
      // layered flame with flicker
      const fl=Math.sin(this.animTime*9+light.x*3.1)*1.5;
      const sway=Math.sin(this.animTime*13+light.y*2.3);
      ctx.globalAlpha=.85;
      ctx.fillStyle='#ff7a1e';
      ctx.beginPath();ctx.ellipse(bx+sway*.8,by-6+fl*.4,4,6.5+fl,0,0,Math.PI*2);ctx.fill();
      ctx.fillStyle='#ffc23e';
      ctx.beginPath();ctx.ellipse(bx+sway*.5,by-5.5,2.6,4.2+fl*.7,0,0,Math.PI*2);ctx.fill();
      ctx.fillStyle='#fff3c4';
      ctx.beginPath();ctx.ellipse(bx+sway*.3,by-4.6,1.2,2,0,0,Math.PI*2);ctx.fill();
      ctx.globalAlpha=1;
      if(Util.chance(.015))this.particles.fire(light.x+.5,light.y+.2);
    }
  },

  _renderEnemyShadow(ctx,ecx,sy){
    ctx.globalAlpha=.35;ctx.fillStyle='#000';
    ctx.beginPath();ctx.ellipse(ecx,sy+TILE_SIZE-1,TILE_SIZE*.32,4,0,0,Math.PI*2);ctx.fill();
    ctx.globalAlpha=1;
  },

  _renderEnemyHitFlash(ctx,e,ecx,ecy){
    if(e.hitFlash<=0)return;
    ctx.globalAlpha=e.hitFlash*.8;ctx.fillStyle='#fff';
    ctx.beginPath();ctx.arc(ecx,ecy,TILE_SIZE*.45,0,Math.PI*2);ctx.fill();ctx.globalAlpha=1;
  },

  _renderEnemyFreezeEffect(ctx,e,ecx,ecy){
    if(e.freezeTimer<=0)return;
    ctx.globalAlpha=.4;ctx.strokeStyle='#8df';ctx.lineWidth=2;
    ctx.beginPath();ctx.arc(ecx,ecy,TILE_SIZE*.45,0,Math.PI*2);ctx.stroke();
    for(let ic=0;ic<4;ic++){
      const ia=this.animTime*2+ic*Math.PI/2;
      const idx=ecx+Math.cos(ia)*TILE_SIZE*.4,idy=ecy+Math.sin(ia)*TILE_SIZE*.4;
      ctx.fillStyle='#cef';ctx.beginPath();ctx.arc(idx,idy,1.5,0,Math.PI*2);ctx.fill();
    }
    ctx.globalAlpha=1;
  },

  _renderEnemyBody(ctx,e,ecx,ecy,sy){
    if(e.burnTimer>0&&Util.chance(.06))this.particles.fire(e.x+.5,e.y+.3);
    if(!e.elite){
      ctx.globalAlpha=.08;ctx.fillStyle=e.color||'#a88';
      ctx.beginPath();ctx.arc(ecx,ecy,TILE_SIZE*.5,0,Math.PI*2);ctx.fill();ctx.globalAlpha=1;
    }
    const bob=Math.sin(this.animTime*3+e.x*2.1)*2;
    const la=(e.attackAnim||0)>0?Math.sin((1-e.attackAnim/.18)*Math.PI)*7:0;
    const lx=la*(e.attackDX||0),ly=la*(e.attackDY||0);
    const breathe=1+Math.sin(this.animTime*3+e.x*2.1)*.05;
    ctx.save();
    ctx.translate(ecx+lx,sy+TILE_SIZE*.45+bob+ly);
    ctx.scale(2-breathe,breathe);
    SpriteCache.draw(ctx,e.icon,e.isBoss?28:22,0,0);
    ctx.restore();
  },

  _renderEnemyNameLabel(ctx,e,ecx,sy){
    if(e.isBoss||Util.dist(this.player.x,this.player.y,e.x,e.y)>=5)return;
    ctx.font='bold 8px monospace';ctx.fillStyle='rgba(255,255,255,0.5)';
    ctx.fillText(e.name,ecx,sy-14);
  },

  _renderEnemyHpBar(ctx,e,sx,sy){
    if(e.hp>=e.maxHp)return;
    const barW=TILE_SIZE-4;const barH=4;
    const barX=sx+2;const barY=sy-7;
    ctx.fillStyle='rgba(0,0,0,0.6)';
    ctx.beginPath();ctx.roundRect(barX-1,barY-1,barW+2,barH+2,2);ctx.fill();
    const hpPct=e.hp/e.maxHp;
    const hpColor=hpPct>.5?'#0c0':hpPct>.25?'#fa0':'#f00';
    ctx.fillStyle=hpColor;
    ctx.beginPath();ctx.roundRect(barX,barY,barW*hpPct,barH,1.5);ctx.fill();
  },

  _renderEnemyWindup(ctx,e,ecx,ecy){
    if(!(e.windup>0))return;
    const wt=e.windupTime||.4;
    const prog=Util.clamp(1-e.windup/wt,0,1); // 0 -> 1 as the strike nears
    const r=TILE_SIZE*(.5+prog*.35);
    ctx.globalAlpha=.35+prog*.45;
    ctx.strokeStyle='#ff3322';ctx.lineWidth=2+prog*1.5;
    ctx.beginPath();ctx.arc(ecx,ecy,r,0,Math.PI*2);ctx.stroke();
    // strike direction wedge
    const a=Math.atan2(e.attackDY||0,e.attackDX||0);
    ctx.beginPath();ctx.moveTo(ecx,ecy);
    ctx.lineTo(ecx+Math.cos(a)*r,ecy+Math.sin(a)*r);
    ctx.stroke();
    if(prog>.82){ctx.globalAlpha=(prog-.82)*3;ctx.fillStyle='#ff5533';ctx.beginPath();ctx.arc(ecx,ecy,r*.55,0,Math.PI*2);ctx.fill();}
    ctx.globalAlpha=1;
  },

  _renderBomberFuse(ctx,e,ecx,ecy){
    if(!(e.fuse>0))return;
    const ft=e.fuseTime||.9;
    const prog=Util.clamp(1-e.fuse/ft,0,1);
    const r=(e.blastRadius||2.2)*TILE_SIZE;
    ctx.globalAlpha=.14+prog*.22;
    ctx.fillStyle='#f40';
    ctx.beginPath();ctx.arc(ecx,ecy,r*(.35+prog*.65),0,Math.PI*2);ctx.fill();
    ctx.globalAlpha=.45+prog*.5;
    ctx.strokeStyle='#ff0';ctx.lineWidth=2;
    ctx.setLineDash([5,4]);
    ctx.beginPath();ctx.arc(ecx,ecy,r,0,Math.PI*2);ctx.stroke();
    ctx.setLineDash([]);
    ctx.globalAlpha=1;
  },

  _renderChargerWindup(ctx,e,ecx,ecy){
    if(e.chargeState!=='windup')return;
    const wt=e.chargeWindupTime||.6;
    const prog=Util.clamp(1-e.chargeWindup/wt,0,1);
    const a=Math.atan2(e.chargeDY||0,e.chargeDX||0);
    const len=TILE_SIZE*(2.5+prog*3.5);
    ctx.globalAlpha=.35+prog*.45;
    ctx.strokeStyle='#ff5522';ctx.lineWidth=2.5;ctx.setLineDash([6,5]);
    ctx.beginPath();ctx.moveTo(ecx,ecy);ctx.lineTo(ecx+Math.cos(a)*len,ecy+Math.sin(a)*len);ctx.stroke();
    ctx.setLineDash([]);
    ctx.globalAlpha=.3+prog*.5;
    ctx.beginPath();ctx.arc(ecx,ecy,TILE_SIZE*(.55+prog*.2),0,Math.PI*2);ctx.stroke();
    ctx.globalAlpha=1;
  },

  _renderBossAura(ctx,e,sx,sy){
    if(!e.isBoss)return;
    ctx.globalAlpha=.3+Math.sin(this.animTime*4)*.15;
    ctx.strokeStyle=e.color;ctx.lineWidth=2;
    ctx.beginPath();ctx.arc(sx+TILE_SIZE/2,sy+TILE_SIZE/2,TILE_SIZE*.6,0,Math.PI*2);ctx.stroke();
    ctx.globalAlpha=1;
  },

  _renderEnemy(ctx,e,cx,cy){
    const sx=e.x*TILE_SIZE-cx;const sy=e.y*TILE_SIZE-cy;
    const ecx=sx+TILE_SIZE/2,ecy=sy+TILE_SIZE/2;

    this._renderEnemyShadow(ctx,ecx,sy);
    this._renderEnemyHitFlash(ctx,e,ecx,ecy);
    this._renderEnemyFreezeEffect(ctx,e,ecx,ecy);
    this._renderEnemyBody(ctx,e,ecx,ecy,sy);
    this._renderEnemyWindup(ctx,e,ecx,ecy);
    this._renderChargerWindup(ctx,e,ecx,ecy);
    this._renderBomberFuse(ctx,e,ecx,ecy);
    this._renderEnemyNameLabel(ctx,e,ecx,sy);
    this._renderEnemyHpBar(ctx,e,sx,sy);
    this._renderBossAura(ctx,e,sx,sy);

    if(e.elite&&e.eliteAffix){
      ctx.globalAlpha=.25+Math.sin(this.animTime*5)*.15;
      ctx.strokeStyle=e.eliteAffix.color;ctx.lineWidth=1.5;
      ctx.setLineDash([3,3]);
      ctx.beginPath();ctx.arc(sx+TILE_SIZE/2,sy+TILE_SIZE/2,TILE_SIZE*.55,0,Math.PI*2);ctx.stroke();
      ctx.setLineDash([]);
      ctx.globalAlpha=1;
      ctx.font='8px monospace';ctx.textAlign='center';
      ctx.fillStyle=e.eliteAffix.color;
      ctx.fillText(e.eliteAffix.name,sx+TILE_SIZE/2,sy-10);
    }

    if(e.shielded&&e.shieldHp>0){
      const shBarW=TILE_SIZE-4;const shBarH=2;
      const shBarX=sx+2;const shBarY=sy-2;
      ctx.fillStyle='rgba(80,120,255,0.5)';
      ctx.fillRect(shBarX,shBarY,shBarW*(e.shieldHp/(e.maxHp*.4)),shBarH);
    }
  },

  _renderEnemies(ctx,cx,cy){
    for(const e of this.enemies){
      if(e.hp<=0)continue;
      const ex=Math.floor(e.x),ey=Math.floor(e.y);
      if(!this.dungeon.visible[ey]?.[ex])continue;
      this._renderEnemy(ctx,e,cx,cy);
    }
  },

  _getPlayerClassColor(player){
    return player.class==='warrior'?'#c44':player.class==='mage'?'#44c':player.class==='necromancer'?'#84c':'#4a4';
  },

  _renderPlayerShadow(ctx,pcx,py){
    ctx.globalAlpha=.35;ctx.fillStyle='#000';
    ctx.beginPath();ctx.ellipse(pcx,py+TILE_SIZE-1,TILE_SIZE*.35,5,0,0,Math.PI*2);ctx.fill();
    ctx.globalAlpha=1;
  },

  _renderPlayerClassAura(ctx,pcx,pcy,classColor){
    const auraR=TILE_SIZE*.65+Math.sin(this.animTime*3)*.04*TILE_SIZE;
    const auraG=ctx.createRadialGradient(pcx,pcy,TILE_SIZE*.15,pcx,pcy,auraR);
    const _cc=classColor.length===4?classColor[1]+classColor[1]+classColor[2]+classColor[2]+classColor[3]+classColor[3]:classColor.slice(1);
    auraG.addColorStop(0,`rgba(${parseInt(_cc.slice(0,2),16)},${parseInt(_cc.slice(2,4),16)},${parseInt(_cc.slice(4,6),16)},0.15)`);
    auraG.addColorStop(1,'rgba(0,0,0,0)');
    ctx.fillStyle=auraG;ctx.beginPath();ctx.arc(pcx,pcy,auraR,0,Math.PI*2);ctx.fill();
  },

  _renderPlayerBodyAndIcon(ctx,p,pcx,pcy,classColor){
    const la=(p.attackAnim||0)>0?Math.sin((1-p.attackAnim/.18)*Math.PI)*7:0;
    const lx=la*(p.attackDX||0),ly=la*(p.attackDY||0);
    ctx.save();ctx.translate(lx,ly);

    const bodyGrad=ctx.createRadialGradient(pcx-3,pcy-3,1,pcx,pcy,TILE_SIZE*.38);
    bodyGrad.addColorStop(0,classColor.replace(/4/g,'8'));bodyGrad.addColorStop(1,classColor);
    ctx.fillStyle=bodyGrad;
    ctx.beginPath();ctx.arc(pcx,pcy,TILE_SIZE*.36,0,Math.PI*2);ctx.fill();
    ctx.strokeStyle='rgba(255,255,255,0.6)';ctx.lineWidth=1.5;
    ctx.stroke();
    ctx.strokeStyle=classColor;ctx.lineWidth=.8;
    ctx.beginPath();ctx.arc(pcx,pcy,TILE_SIZE*.40,0,Math.PI*2);ctx.stroke();

    const pIcon=p.class==='warrior'?'⚔️':p.class==='mage'?'🔮':p.class==='necromancer'?'💀':'🗡️';
    const pBob=Math.sin(this.animTime*3.5)*1.5;
    const breathe=1+Math.sin(this.animTime*3.5)*.06;
    ctx.save();ctx.translate(pcx,pcy-1+pBob);ctx.scale(2-breathe,breathe);
    SpriteCache.draw(ctx,pIcon,18,0,0);
    ctx.restore();

    ctx.restore();
  },

  _renderPlayerRageAura(ctx,pcx,pcy){
    ctx.save();ctx.translate(pcx,pcy);ctx.rotate(this.animTime*4);
    ctx.globalAlpha=.25+Math.sin(this.animTime*6)*.1;
    ctx.strokeStyle='#f00';ctx.lineWidth=2.5;
    ctx.setLineDash([8,6]);ctx.beginPath();ctx.arc(0,0,TILE_SIZE*.58,0,Math.PI*2);ctx.stroke();
    ctx.setLineDash([]);ctx.restore();ctx.globalAlpha=1;
    ctx.globalAlpha=.12;ctx.fillStyle='#f00';ctx.beginPath();ctx.arc(pcx,pcy,TILE_SIZE*.5,0,Math.PI*2);ctx.fill();ctx.globalAlpha=1;
  },

  _renderPlayer(ctx,cx,cy){
    const p=this.player;
    const px=p.x*TILE_SIZE-cx;const py=p.y*TILE_SIZE-cy;
    const pcx=px+TILE_SIZE/2,pcy=py+TILE_SIZE/2;

    this._renderPlayerShadow(ctx,pcx,py);

    const classColor=this._getPlayerClassColor(p);
    this._renderPlayerClassAura(ctx,pcx,pcy,classColor);

    if(p.stealthTimer>0)ctx.globalAlpha=.35;
    if(p.iFrames>0&&Math.floor(this.animTime*20)%2===0)ctx.globalAlpha=.3;

    this._renderPlayerBodyAndIcon(ctx,p,pcx,pcy,classColor);

    ctx.globalAlpha=1;

    if(p.rageTimer>0){
      this._renderPlayerRageAura(ctx,pcx,pcy);
    }
  },

  _renderProjectilesAndEffects(ctx,cx,cy){
    for(const proj of this.projectiles)proj.draw(ctx,cx,cy);
    this.particles.draw(ctx,cx,cy);
    this.floatingText.draw(ctx,cx,cy);
  },

  _renderFogOfWar(ctx,startTX,startTY,endTX,endTY,cx,cy){
    const vis=this.dungeon.visible,exp=this.dungeon.explored;
    ctx.fillStyle='#05070d'; // cold "memory" tint instead of flat black
    for(let y=startTY;y<endTY;y++){
      for(let x=startTX;x<endTX;x++){
        if(vis[y][x]||!exp[y][x])continue;
        // lighter fog on tiles bordering the visible area -> soft gradient edge
        let nearVisible=false;
        for(let dy=-1;dy<=1&&!nearVisible;dy++)for(let dx=-1;dx<=1;dx++){
          const ny=y+dy,nx=x+dx;
          if(vis[ny]&&vis[ny][nx]){nearVisible=true;break;}
        }
        ctx.globalAlpha=nearVisible?.34:.62;
        ctx.fillRect(x*TILE_SIZE-cx,y*TILE_SIZE-cy,TILE_SIZE,TILE_SIZE);
      }
    }
    ctx.globalAlpha=1;
  },

  _emitFloorAmbientParticles(){
    if(!this.floorTheme)return;
    const pt=this.floorTheme.particles;
    if(!pt){
      // floors without a signature effect still get faint drifting dust motes
      if(Util.chance(.015)){
        const rx=this.player.x+Util.randF(-8,8),ry=this.player.y+Util.randF(-6,6);
        this.particles.burst(rx,ry,1,'#6a5f4a',.6,.12,.5);
      }
      return;
    }
    if(pt==='drip'&&Util.chance(.02)){
      const rx=this.player.x+Util.randF(-8,8),ry=this.player.y+Util.randF(-6,6);
      this.particles.burst(rx,ry,1,'#48a',1,.2,1);
    }
    if(pt==='dust'&&Util.chance(.03)){
      const rx=this.player.x+Util.randF(-8,8),ry=this.player.y+Util.randF(-6,6);
      this.particles.burst(rx,ry,1,'#886',1,.1,.5);
    }
    if(pt==='ember'&&Util.chance(.04)){
      const rx=this.player.x+Util.randF(-8,8),ry=this.player.y+Util.randF(-6,6);
      this.particles.burst(rx,ry,2,'#f80',1.5,.15,2);
    }
    if(pt==='shadow'&&Util.chance(.03)){
      const rx=this.player.x+Util.randF(-8,8),ry=this.player.y+Util.randF(-6,6);
      this.particles.burst(rx,ry,1,'#40a',2,.1,1.5);
    }
  },

  _renderFloorFogOverlay(ctx,W,H){
    if(!this.floorTheme||!this.floorTheme.fog)return;
    ctx.globalAlpha=.06+Math.sin(this.animTime*.5)*.02;
    ctx.fillStyle='#888';
    ctx.fillRect(0,0,W,H);
    ctx.globalAlpha=1;
  },

  _drawCrosshair(ctx){
    const crLen=10,crGap=4;
    const crPulse=.3+Math.sin(this.animTime*4)*.1;
    ctx.strokeStyle=`rgba(255,255,255,${crPulse})`;ctx.lineWidth=1.5;
    ctx.beginPath();ctx.moveTo(this.mouseX-crLen,this.mouseY);ctx.lineTo(this.mouseX-crGap,this.mouseY);ctx.stroke();
    ctx.beginPath();ctx.moveTo(this.mouseX+crGap,this.mouseY);ctx.lineTo(this.mouseX+crLen,this.mouseY);ctx.stroke();
    ctx.beginPath();ctx.moveTo(this.mouseX,this.mouseY-crLen);ctx.lineTo(this.mouseX,this.mouseY-crGap);ctx.stroke();
    ctx.beginPath();ctx.moveTo(this.mouseX,this.mouseY+crGap);ctx.lineTo(this.mouseX,this.mouseY+crLen);ctx.stroke();
    ctx.fillStyle=`rgba(255,255,255,${crPulse+.1})`;ctx.beginPath();ctx.arc(this.mouseX,this.mouseY,1.5,0,Math.PI*2);ctx.fill();
  },

  _getRenderFrameState(){
    const ctx=this.ctx;
    const W=this.canvas.width,H=this.canvas.height;
    const shake=this.screenFX.getOffset();
    const cx=Math.floor(this.camX+shake.x);
    const cy=Math.floor(this.camY+shake.y);
    const startTX=Math.max(0,Math.floor(cx/TILE_SIZE)-1);
    const startTY=Math.max(0,Math.floor(cy/TILE_SIZE)-1);
    const endTX=Math.min(MAP_W,Math.ceil((cx+W)/TILE_SIZE)+1);
    const endTY=Math.min(MAP_H,Math.ceil((cy+H)/TILE_SIZE)+1);
    return{
      ctx,W,H,cx,cy,
      startTX,startTY,endTX,endTY,
      bloodStainSet:this._getBloodStainSet()
    };
  },

  _renderTileByType(ctx,tile,x,y,sx,sy,alpha,visible){
    switch(tile){
      case TILE.WALL: {
        this._renderWallTile(ctx,x,y,sx,sy);
        break;
      }
      case TILE.SECRET_WALL: {
        this._renderWallTile(ctx,x,y,sx,sy);
        // faint crack hint only when the player is right beside it
        if(Math.abs(x-Math.floor(this.player.x+.5))<=1&&Math.abs(y-Math.floor(this.player.y+.5))<=1){
          ctx.globalAlpha=.22+Math.sin(this.animTime*3)*.1;
          ctx.strokeStyle='#6a5640';ctx.lineWidth=1;
          ctx.beginPath();ctx.moveTo(sx+9,sy+3);ctx.lineTo(sx+15,sy+15);ctx.lineTo(sx+11,sy+28);ctx.stroke();
          ctx.globalAlpha=1;
        }
        break;
      }
      case TILE.FLOOR:
      case TILE.CORRIDOR: {
        this._renderFloorTile(ctx,x,y,sx,sy);
        break;
      }
      case TILE.DOOR:
        this._renderDoorTile(ctx,sx,sy);
        break;
      case TILE.LOCKED_DOOR:
        this._renderLockedDoorTile(ctx,sx,sy);
        break;
      case TILE.STAIRS_DOWN: {
        this._renderStairsDownTile(ctx,x,y,sx,sy,alpha);
        break;
      }
      case TILE.WATER: {
        this._renderWaterTile(ctx,x,y,sx,sy);
        break;
      }
      case TILE.LAVA: {
        this._renderLavaTile(ctx,x,y,sx,sy,visible);
        break;
      }
      case TILE.TRAP:
      case TILE.CHEST:
      case TILE.SHRINE:
      case TILE.SHOP:
      case TILE.EVENT:
      case TILE.WELL:
      case TILE.RIFT:
      case TILE.OBELISK:
      case TILE.ARENA:
        this._renderInteractiveTile(ctx,tile,x,y,sx,sy,alpha,visible);
        break;
    }
  },

  _renderTileBloodStain(ctx,sx,sy,alpha){
    ctx.globalAlpha=alpha*.3;
    ctx.fillStyle='#600';
    ctx.beginPath();
    ctx.arc(sx+TILE_SIZE/2,sy+TILE_SIZE/2,6,0,Math.PI*2);
    ctx.fill();
    ctx.globalAlpha=alpha;
  },

  _drawVisibleTiles(frame){
    const {ctx,cx,cy,startTX,startTY,endTX,endTY,bloodStainSet}=frame;
    TileArt.build(this.floorTheme||FloorThemes.themes[0]);
    for(let y=startTY;y<endTY;y++){
      for(let x=startTX;x<endTX;x++){
        const sx=x*TILE_SIZE-cx;const sy=y*TILE_SIZE-cy;
        const tile=this.dungeon.map[y][x];
        const visible=this.dungeon.visible[y][x];
        const explored=this.dungeon.explored[y][x];

        if(!explored&&!this.showFullMap)continue;

        let alpha=visible?1:.35;
        if(this.showFullMap&&!explored)alpha=.15;
        ctx.globalAlpha=alpha;

        this._renderTileByType(ctx,tile,x,y,sx,sy,alpha,visible);

        if(bloodStainSet.has(`${x},${y}`)){
          this._renderTileBloodStain(ctx,sx,sy,alpha);
        }
      }
    }
    ctx.globalAlpha=1;
  },

  _renderSceneActors(ctx,cx,cy){
    this._renderBraziers(ctx,cx,cy);
    this._renderFloorItems(ctx,cx,cy);
    this._renderEnemies(ctx,cx,cy);
    this._renderMinions(ctx,cx,cy);
    this._renderPlayer(ctx,cx,cy);
    this._renderProjectilesAndEffects(ctx,cx,cy);
  },

  _renderScenePostEffects(ctx,startTX,startTY,endTX,endTY,cx,cy,W,H){
    this._renderFogOfWar(ctx,startTX,startTY,endTX,endTY,cx,cy);
    this._emitFloorAmbientParticles();
    this._renderFloorFogOverlay(ctx,W,H);
  },

  _renderSceneActorsAndEffects(frame){
    const {ctx,cx,cy,startTX,startTY,endTX,endTY,W,H}=frame;
    this._renderSceneActors(ctx,cx,cy);
    this._renderScenePostEffects(ctx,startTX,startTY,endTX,endTY,cx,cy,W,H);
  },

  _renderScreenFxOverlays(ctx,cx,cy,W,H){
    this._drawLighting(ctx,cx,cy,W,H);
    this.screenFX.drawFlash(ctx,W,H);
    this.screenFX.drawVignette(ctx,W,H);
    this._drawMoodGrade(ctx,W,H);
  },

  _renderScreenUiOverlays(ctx){
    this._drawCrosshair(ctx);
    this._updateHUD();
  },

  _renderScreenOverlays(frame){
    const {ctx,cx,cy,W,H}=frame;
    this._renderScreenFxOverlays(ctx,cx,cy,W,H);
    this._renderScreenUiOverlays(ctx);
  },

  _shouldRefreshMinimap(){
    return this._minimapDirty||this._minimapElapsed>=this._minimapInterval;
  },

  _finalizeMinimapRefresh(){
    this._minimapElapsed=0;
    this._minimapDirty=false;
  },

  _updateMinimapIfNeeded(){
    if(!this._shouldRefreshMinimap())return;
    this._drawMinimap();
    this._finalizeMinimapRefresh();
  },

  _clearRenderBackground(ctx,W,H){
    ctx.fillStyle='#080808';
    ctx.fillRect(0,0,W,H);
  },

  _renderFullMapOverlayIfNeeded(ctx,W,H){
    if(this.showFullMap)this._drawFullMap(ctx,W,H);
  },

  // ---- RENDER ----
  render(){
    const frame=this._getRenderFrameState();
    const {ctx,W,H}=frame;

    this._clearRenderBackground(ctx,W,H);

    this._drawVisibleTiles(frame);
    this._renderSceneActorsAndEffects(frame);
    this._renderScreenOverlays(frame);
    this._updateMinimapIfNeeded();

    this._renderFullMapOverlayIfNeeded(ctx,W,H);
  },

  _drawPlayerLight(ctx,camX,camY,W,H){
    const px=this.player.x*TILE_SIZE-camX+TILE_SIZE/2;
    const py=this.player.y*TILE_SIZE-camY+TILE_SIZE/2;
    const playerR=TILE_SIZE*FOV_RADIUS*.8;
    const pg=ctx.createRadialGradient(px,py,0,px,py,playerR);
    const flicker=.85+Math.sin(this.animTime*8)*.05+Math.sin(this.animTime*13)*.03;
    pg.addColorStop(0,`rgba(255,220,180,${.25*flicker})`);
    pg.addColorStop(.3,`rgba(255,200,150,${.15*flicker})`);
    pg.addColorStop(1,'rgba(0,0,0,0)');
    ctx.fillStyle=pg;ctx.fillRect(0,0,W,H);
  },

  _drawRoomLights(ctx,camX,camY){
    for(const light of this.dungeon.lightSources){
      if(!this.dungeon.visible[light.y]?.[light.x])continue;
      const lx=light.x*TILE_SIZE-camX+TILE_SIZE/2;
      const ly=light.y*TILE_SIZE-camY+TILE_SIZE/2;
      const lr=light.r*TILE_SIZE;
      const lg=ctx.createRadialGradient(lx,ly,0,lx,ly,lr);
      const lf=.7+Math.sin(this.animTime*5+light.x)*.1;
      lg.addColorStop(0,`rgba(${light.color[0]},${light.color[1]},${light.color[2]},${.12*lf})`);
      lg.addColorStop(1,'rgba(0,0,0,0)');
      ctx.fillStyle=lg;ctx.fillRect(lx-lr,ly-lr,lr*2,lr*2);
    }
  },

  _drawProjectileLights(ctx,camX,camY){
    for(const proj of this.projectiles){
      const ppx=proj.x*TILE_SIZE-camX;const ppy=proj.y*TILE_SIZE-camY;
      const prg=ctx.createRadialGradient(ppx,ppy,0,ppx,ppy,TILE_SIZE*2);
      prg.addColorStop(0,proj.color.replace(')',',0.15)').replace('rgb','rgba'));
      prg.addColorStop(1,'rgba(0,0,0,0)');
      ctx.fillStyle=prg;ctx.fillRect(ppx-TILE_SIZE*2,ppy-TILE_SIZE*2,TILE_SIZE*4,TILE_SIZE*4);
    }
  },
  
  _drawEmissiveTileLights(ctx,camX,camY,W,H){
    const startTX=Math.max(0,Math.floor(camX/TILE_SIZE)-1);
    const startTY=Math.max(0,Math.floor(camY/TILE_SIZE)-1);
    const endTX=Math.min(MAP_W,Math.ceil((camX+W)/TILE_SIZE)+1);
    const endTY=Math.min(MAP_H,Math.ceil((camY+H)/TILE_SIZE)+1);
    const map=this.dungeon.map,vis=this.dungeon.visible;
    for(let y=startTY;y<endTY;y++){
      for(let x=startTX;x<endTX;x++){
        const t=map[y][x];
        if(t!==TILE.LAVA&&t!==TILE.WATER)continue;
        if(!vis[y]?.[x])continue;
        const lx=x*TILE_SIZE-camX+TILE_SIZE/2;
        const ly=y*TILE_SIZE-camY+TILE_SIZE/2;
        let r,c0,c1,c2,a;
        if(t===TILE.LAVA){
          const f=.8+Math.sin(this.animTime*6+x*1.7+y)*.2;
          r=TILE_SIZE*2.6;c0=255;c1=110;c2=30;a=.22*f;
        }else{
          const f=.7+Math.sin(this.animTime*3+x+y*1.3)*.15;
          r=TILE_SIZE*1.8;c0=70;c1=150;c2=230;a=.12*f;
        }
        const g=ctx.createRadialGradient(lx,ly,0,lx,ly,r);
        g.addColorStop(0,`rgba(${c0},${c1},${c2},${a})`);
        g.addColorStop(1,'rgba(0,0,0,0)');
        ctx.fillStyle=g;ctx.fillRect(lx-r,ly-r,r*2,r*2);
      }
    }
  },

  _drawLighting(ctx,camX,camY,W,H){
    const th=this.floorTheme||FloorThemes.themes[0];
    const ar=th.ambientR??20,ag=th.ambientG??15,ab=th.ambientB??30;
    ctx.globalCompositeOperation='multiply';
    ctx.fillStyle=`rgba(${ar},${ag},${ab},0.5)`;
    ctx.fillRect(0,0,W,H);
    ctx.globalCompositeOperation='screen';

    this._drawPlayerLight(ctx,camX,camY,W,H);
    this._drawRoomLights(ctx,camX,camY);
    this._drawEmissiveTileLights(ctx,camX,camY,W,H);
    this._drawProjectileLights(ctx,camX,camY);

    ctx.globalCompositeOperation='source-over';
  },

  _drawMoodGrade(ctx,W,H){
    const th=this.floorTheme||FloorThemes.themes[0];
    const ar=Math.min(255,(th.ambientR??20)*2.2|0);
    const ag=Math.min(255,(th.ambientG??15)*2.2|0);
    const ab=Math.min(255,(th.ambientB??30)*2.2|0);
    const grd=ctx.createRadialGradient(W/2,H/2,W*.3,W/2,H/2,W*.8);
    grd.addColorStop(0,'rgba(0,0,0,0)');
    grd.addColorStop(1,`rgba(${ar},${ag},${ab},0.22)`);
    ctx.fillStyle=grd;ctx.fillRect(0,0,W,H);
  },

});
