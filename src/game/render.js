'use strict';
Object.assign(Game, {
  _getFloorTransitionSubtitle(){
    return this.floor%3===0?'⚠️ Wyczuwasz potężną obecność...':'Schodzisz głębiej w mrok...';
  },

  _setFloorTransitionContent(){
    const title=document.getElementById('ft-title');
    const sub=document.getElementById('ft-sub');
    title.textContent=`📍 Piętro ${this.floor}`;
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

  _renderWallTile(ctx,x,y,sx,sy){
    const wt=this.floorTheme||FloorThemes.themes[0];
    const wallShade=((x*7+y*13)%20)+30;
    const baseL=wallShade/100*25;
    ctx.fillStyle=Util.hsl(wt.wallHue,wt.wallSat,baseL);
    ctx.fillRect(sx,sy,TILE_SIZE,TILE_SIZE);
    ctx.strokeStyle='rgba(0,0,0,0.35)';ctx.lineWidth=1;
    const brickOff=y%2===0?0:TILE_SIZE/4;
    ctx.strokeRect(sx+brickOff,sy,TILE_SIZE/2,TILE_SIZE/2);
    ctx.strokeRect(sx+brickOff,sy+TILE_SIZE/2,TILE_SIZE/2,TILE_SIZE/2);
    const aboveTile=y>0?this.dungeon.map[y-1][x]:TILE.WALL;
    if(aboveTile!==TILE.WALL&&aboveTile!==TILE.VOID){
      ctx.fillStyle='rgba(0,0,0,0.5)';ctx.fillRect(sx,sy,TILE_SIZE,3);
    }
    if((x*31+y*17)%13===0){
      ctx.strokeStyle='rgba(0,0,0,0.4)';ctx.lineWidth=.7;
      ctx.beginPath();
      ctx.moveTo(sx+8,sy+4);ctx.lineTo(sx+14,sy+12);ctx.lineTo(sx+20,sy+10);
      ctx.stroke();
    }
  },

  _renderFloorTile(ctx,x,y,sx,sy){
    const ft=this.floorTheme||FloorThemes.themes[0];
    const floorShade=((x*3+y*7)%15)+14;
    ctx.fillStyle=Util.hsl(ft.floorHue,ft.floorSat,floorShade);
    ctx.fillRect(sx,sy,TILE_SIZE,TILE_SIZE);
    ctx.strokeStyle='rgba(0,0,0,0.12)';ctx.lineWidth=.5;
    ctx.strokeRect(sx+.5,sy+.5,TILE_SIZE-1,TILE_SIZE-1);
    if((x+y)%4===0){ctx.fillStyle='rgba(255,255,255,0.025)';ctx.fillRect(sx,sy,TILE_SIZE,TILE_SIZE);}
    if((x*11+y*23)%17===0){ctx.fillStyle='rgba(255,255,255,0.015)';ctx.beginPath();ctx.arc(sx+12,sy+18,5,0,Math.PI*2);ctx.fill();}
    if(y>0&&(this.dungeon.map[y-1][x]===TILE.WALL)){
      const sg=ctx.createLinearGradient(sx,sy,sx,sy+10);
      sg.addColorStop(0,'rgba(0,0,0,0.35)');sg.addColorStop(1,'rgba(0,0,0,0)');
      ctx.fillStyle=sg;ctx.fillRect(sx,sy,TILE_SIZE,10);
    }
  },

  _renderTrapTile(ctx,sx,sy,visible){
    ctx.fillStyle='#1a1510';ctx.fillRect(sx,sy,TILE_SIZE,TILE_SIZE);
    if(visible&&this.player.class==='rogue'){
      ctx.strokeStyle='rgba(255,0,0,0.4)';ctx.setLineDash([2,2]);
      ctx.strokeRect(sx+4,sy+4,TILE_SIZE-8,TILE_SIZE-8);
      ctx.setLineDash([]);
    }
  },

  _renderChestTile(ctx,sx,sy,alpha){
    ctx.fillStyle='#1a1510';ctx.fillRect(sx,sy,TILE_SIZE,TILE_SIZE);
    ctx.font='22px serif';ctx.textAlign='center';
    ctx.fillStyle='#fff';ctx.fillText('📦',sx+TILE_SIZE/2,sy+TILE_SIZE*.8);
    ctx.globalAlpha=Math.abs(Math.sin(this.animTime*3))*.5;
    ctx.fillStyle='#ff0';ctx.beginPath();ctx.arc(sx+TILE_SIZE/2+Math.sin(this.animTime*4)*6,sy+6,2,0,Math.PI*2);ctx.fill();
    ctx.globalAlpha=alpha;
  },

  _renderShrineTile(ctx,sx,sy,alpha){
    ctx.fillStyle='#1a1520';ctx.fillRect(sx,sy,TILE_SIZE,TILE_SIZE);
    ctx.font='22px serif';ctx.textAlign='center';
    ctx.fillStyle='#fff';ctx.fillText('⛩️',sx+TILE_SIZE/2,sy+TILE_SIZE*.8);
    ctx.globalAlpha=Math.abs(Math.sin(this.animTime*2))*.3;
    ctx.fillStyle='#4af';ctx.beginPath();ctx.arc(sx+TILE_SIZE/2,sy+TILE_SIZE/2,TILE_SIZE*.5,0,Math.PI*2);ctx.fill();
    ctx.globalAlpha=alpha;
  },

  _renderShopTile(ctx,sx,sy,alpha){
    ctx.fillStyle='#1a1815';ctx.fillRect(sx,sy,TILE_SIZE,TILE_SIZE);
    ctx.font='22px serif';ctx.textAlign='center';
    ctx.fillStyle='#fff';ctx.fillText('🏪',sx+TILE_SIZE/2,sy+TILE_SIZE*.8);
    ctx.globalAlpha=.2+Math.abs(Math.sin(this.animTime*2.5))*.2;
    ctx.fillStyle='#f80';ctx.beginPath();ctx.arc(sx+TILE_SIZE/2,sy+TILE_SIZE/2,TILE_SIZE*.5,0,Math.PI*2);ctx.fill();
    ctx.globalAlpha=alpha;
  },

  _renderEventTile(ctx,sx,sy,alpha){
    ctx.fillStyle='#141a1f';ctx.fillRect(sx,sy,TILE_SIZE,TILE_SIZE);
    ctx.font='22px serif';ctx.textAlign='center';
    ctx.fillStyle='#fff';ctx.fillText('🜂',sx+TILE_SIZE/2,sy+TILE_SIZE*.78);
    ctx.globalAlpha=.18+Math.abs(Math.sin(this.animTime*3.2))*.22;
    ctx.fillStyle='#6cf';ctx.beginPath();ctx.arc(sx+TILE_SIZE/2,sy+TILE_SIZE/2,TILE_SIZE*.5,0,Math.PI*2);ctx.fill();
    ctx.globalAlpha=alpha;
  },

  _renderWellTile(ctx,sx,sy,alpha){
    ctx.fillStyle='#161423';ctx.fillRect(sx,sy,TILE_SIZE,TILE_SIZE);
    ctx.font='22px serif';ctx.textAlign='center';
    ctx.fillStyle='#fff';ctx.fillText('🕳️',sx+TILE_SIZE/2,sy+TILE_SIZE*.78);
    ctx.globalAlpha=.16+Math.abs(Math.sin(this.animTime*2.7))*.2;
    ctx.fillStyle='#b58cff';ctx.beginPath();ctx.arc(sx+TILE_SIZE/2,sy+TILE_SIZE/2,TILE_SIZE*.46,0,Math.PI*2);ctx.fill();
    ctx.globalAlpha=alpha;
  },

  _renderRiftTile(ctx,sx,sy,alpha){
    ctx.fillStyle='#121027';ctx.fillRect(sx,sy,TILE_SIZE,TILE_SIZE);
    ctx.font='22px serif';ctx.textAlign='center';
    ctx.fillStyle='#fff';ctx.fillText('🌀',sx+TILE_SIZE/2,sy+TILE_SIZE*.78);
    ctx.globalAlpha=.2+Math.abs(Math.sin(this.animTime*3.4))*.2;
    ctx.fillStyle='#7a5bff';ctx.beginPath();ctx.arc(sx+TILE_SIZE/2,sy+TILE_SIZE/2,TILE_SIZE*.48,0,Math.PI*2);ctx.fill();
    ctx.globalAlpha=alpha;
  },

  _renderObeliskTile(ctx,sx,sy,alpha){
    ctx.fillStyle='#111726';ctx.fillRect(sx,sy,TILE_SIZE,TILE_SIZE);
    ctx.font='22px serif';ctx.textAlign='center';
    ctx.fillStyle='#fff';ctx.fillText('🗿',sx+TILE_SIZE/2,sy+TILE_SIZE*.78);
    ctx.globalAlpha=.18+Math.abs(Math.sin(this.animTime*2.8))*.22;
    ctx.fillStyle='#6f93ff';ctx.beginPath();ctx.arc(sx+TILE_SIZE/2,sy+TILE_SIZE/2,TILE_SIZE*.46,0,Math.PI*2);ctx.fill();
    ctx.globalAlpha=alpha;
  },

  _renderInteractiveTile(ctx,tile,sx,sy,alpha,visible){
    switch(tile){
      case TILE.TRAP:
        this._renderTrapTile(ctx,sx,sy,visible);
        return true;
      case TILE.CHEST:
        this._renderChestTile(ctx,sx,sy,alpha);
        return true;
      case TILE.SHRINE:
        this._renderShrineTile(ctx,sx,sy,alpha);
        return true;
      case TILE.SHOP:
        this._renderShopTile(ctx,sx,sy,alpha);
        return true;
      case TILE.EVENT:
        this._renderEventTile(ctx,sx,sy,alpha);
        return true;
      case TILE.WELL:
        this._renderWellTile(ctx,sx,sy,alpha);
        return true;
      case TILE.RIFT:
        this._renderRiftTile(ctx,sx,sy,alpha);
        return true;
      case TILE.OBELISK:
        this._renderObeliskTile(ctx,sx,sy,alpha);
        return true;
      default:
        return false;
    }
  },

  _renderDoorTile(ctx,sx,sy){
    ctx.fillStyle='#543';ctx.fillRect(sx,sy,TILE_SIZE,TILE_SIZE);
    ctx.fillStyle='#876';ctx.fillRect(sx+1,sy,TILE_SIZE-2,3);ctx.fillRect(sx+1,sy+TILE_SIZE-3,TILE_SIZE-2,3);
    ctx.fillRect(sx,sy,3,TILE_SIZE);ctx.fillRect(sx+TILE_SIZE-3,sy,3,TILE_SIZE);
    ctx.fillStyle='#a86';ctx.fillRect(sx+4,sy+4,TILE_SIZE-8,TILE_SIZE-8);
    ctx.strokeStyle='rgba(0,0,0,0.25)';ctx.lineWidth=1;
    ctx.beginPath();ctx.moveTo(sx+4,sy+TILE_SIZE/2);ctx.lineTo(sx+TILE_SIZE-4,sy+TILE_SIZE/2);ctx.stroke();
    ctx.fillStyle='#fe8';ctx.beginPath();ctx.arc(sx+TILE_SIZE*.72,sy+TILE_SIZE*.5,2.5,0,Math.PI*2);ctx.fill();
    ctx.strokeStyle='rgba(255,220,100,0.3)';ctx.beginPath();ctx.arc(sx+TILE_SIZE*.72,sy+TILE_SIZE*.5,4,0,Math.PI*2);ctx.stroke();
  },

  _renderStairsDownTile(ctx,sx,sy,alpha){
    ctx.fillStyle='#181820';ctx.fillRect(sx,sy,TILE_SIZE,TILE_SIZE);
    ctx.strokeStyle='rgba(68,170,255,0.2)';ctx.lineWidth=1;
    for(let s=0;s<3;s++){
      const r=6+s*5;const a2=this.animTime*.8+s*2;
      ctx.beginPath();ctx.arc(sx+TILE_SIZE/2,sy+TILE_SIZE/2,r,a2,a2+Math.PI);ctx.stroke();
    }
    const stGlow=.15+Math.sin(this.animTime*2.5)*.15;
    const stGrad=ctx.createRadialGradient(sx+TILE_SIZE/2,sy+TILE_SIZE/2,0,sx+TILE_SIZE/2,sy+TILE_SIZE/2,TILE_SIZE*.7);
    stGrad.addColorStop(0,`rgba(68,170,255,${stGlow})`);stGrad.addColorStop(1,'rgba(68,170,255,0)');
    ctx.fillStyle=stGrad;ctx.fillRect(sx-4,sy-4,TILE_SIZE+8,TILE_SIZE+8);
    ctx.fillStyle='#4af';ctx.font='20px serif';ctx.textAlign='center';
    const stBob=Math.sin(this.animTime*3)*2;
    ctx.fillText('⬇',sx+TILE_SIZE/2,sy+TILE_SIZE*.75+stBob);
    ctx.globalAlpha=alpha;
  },

  _renderWaterTile(ctx,x,y,sx,sy){
    const wPhase=this.animTime*1.5;
    const waterBase=Util.hsl(210,55,22);
    ctx.fillStyle=waterBase;ctx.fillRect(sx,sy,TILE_SIZE,TILE_SIZE);
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
      const glowColor=ItemDB.rarityColors[item.rarity]||'#ccc';
      ctx.globalAlpha=.2+Math.sin(this.animTime*3)*.1;
      ctx.fillStyle=glowColor;
      ctx.beginPath();ctx.arc(sx+TILE_SIZE/2,sy+TILE_SIZE/2,TILE_SIZE*.4,0,Math.PI*2);ctx.fill();
      ctx.globalAlpha=1;
      ctx.font='18px serif';ctx.textAlign='center';
      ctx.fillText(item.icon,sx+TILE_SIZE/2,sy+TILE_SIZE*.75);
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
    ctx.font=(e.isBoss?'28px':'22px')+' serif';ctx.textAlign='center';
    ctx.save();
    ctx.translate(ecx+lx,sy+TILE_SIZE*.7+bob+ly);
    ctx.scale(2-breathe,breathe);
    ctx.fillText(e.icon,0,0);
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
    return player.class==='warrior'?'#c44':player.class==='mage'?'#44c':'#4a4';
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

    const pIcon=p.class==='warrior'?'⚔️':p.class==='mage'?'🔮':'🗡️';
    const pBob=Math.sin(this.animTime*3.5)*1.5;
    const breathe=1+Math.sin(this.animTime*3.5)*.06;
    ctx.font='18px serif';ctx.textAlign='center';
    ctx.save();ctx.translate(pcx,pcy+5+pBob);ctx.scale(2-breathe,breathe);ctx.fillText(pIcon,0,0);ctx.restore();

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
    for(let y=startTY;y<endTY;y++){
      for(let x=startTX;x<endTX;x++){
        if(!this.dungeon.visible[y][x]&&this.dungeon.explored[y][x]){
          ctx.globalAlpha=.55;ctx.fillStyle='#000';
          ctx.fillRect(x*TILE_SIZE-cx,y*TILE_SIZE-cy,TILE_SIZE,TILE_SIZE);
        }
      }
    }
    ctx.globalAlpha=1;
  },

  _emitFloorAmbientParticles(){
    if(!this.floorTheme||!this.floorTheme.particles)return;
    const pt=this.floorTheme.particles;
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
      case TILE.FLOOR:
      case TILE.CORRIDOR: {
        this._renderFloorTile(ctx,x,y,sx,sy);
        break;
      }
      case TILE.DOOR:
        this._renderDoorTile(ctx,sx,sy);
        break;
      case TILE.STAIRS_DOWN: {
        this._renderStairsDownTile(ctx,sx,sy,alpha);
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
        this._renderInteractiveTile(ctx,tile,sx,sy,alpha,visible);
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
    this._renderFloorItems(ctx,cx,cy);
    this._renderEnemies(ctx,cx,cy);
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
