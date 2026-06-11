'use strict';
// =============================================
// PROCEDURAL DUNGEON GENERATOR (BSP)
// =============================================
class DungeonGenerator {
  constructor(w,h,floor,endless=false){
    this.w=w;this.h=h;this.floor=floor;this.endless=!!endless;
    this.map=Array.from({length:h},()=>new Uint8Array(w));
    this.rooms=[];this.explored=Array.from({length:h},()=>new Uint8Array(w));
    this.visible=Array.from({length:h},()=>new Uint8Array(w));
    this.bloodStains=[];
    this.lightSources=[];
  }

  generate(){
    // fill with walls
    for(let y=0;y<this.h;y++)for(let x=0;x<this.w;x++)this.map[y][x]=TILE.WALL;
    
    // BSP split
    const leaves=[];
    this._split({x:1,y:1,w:this.w-2,h:this.h-2},leaves,0);
    
    // create rooms from leaves
    for(const leaf of leaves){
      const rw=Util.rand(Math.max(5,Math.floor(leaf.w*.4)),Math.min(15,leaf.w-2));
      const rh=Util.rand(Math.max(4,Math.floor(leaf.h*.4)),Math.min(12,leaf.h-2));
      const rx=Util.rand(leaf.x+1,leaf.x+leaf.w-rw-1);
      const ry=Util.rand(leaf.y+1,leaf.y+leaf.h-rh-1);
      const room={x:rx,y:ry,w:rw,h:rh,cx:Math.floor(rx+rw/2),cy:Math.floor(ry+rh/2)};
      this.rooms.push(room);
      for(let dy=0;dy<rh;dy++)for(let dx=0;dx<rw;dx++){
        if(ry+dy>0&&ry+dy<this.h-1&&rx+dx>0&&rx+dx<this.w-1)
          this.map[ry+dy][rx+dx]=TILE.FLOOR;
      }
    }
    
    // connect rooms
    for(let i=1;i<this.rooms.length;i++){
      const a=this.rooms[i-1],b=this.rooms[i];
      this._corridor(a.cx,a.cy,b.cx,b.cy);
    }
    // extra connections for loops
    for(let i=0;i<Math.floor(this.rooms.length/3);i++){
      const a=Util.pick(this.rooms),b=Util.pick(this.rooms);
      if(a!==b)this._corridor(a.cx,a.cy,b.cx,b.cy);
    }
    
    // place special tiles
    this._placeSpecials();
    
    return this;
  }

  _split(node,leaves,depth){
    if(depth>4||node.w<12||node.h<10||Util.chance(.3)&&depth>2){
      leaves.push(node);return;
    }
    const horiz=node.w<node.h?true:node.h<node.w?false:Util.chance(.5);
    if(horiz){
      const split=Util.rand(Math.floor(node.h*.3),Math.floor(node.h*.7));
      this._split({x:node.x,y:node.y,w:node.w,h:split},leaves,depth+1);
      this._split({x:node.x,y:node.y+split,w:node.w,h:node.h-split},leaves,depth+1);
    }else{
      const split=Util.rand(Math.floor(node.w*.3),Math.floor(node.w*.7));
      this._split({x:node.x,y:node.y,w:split,h:node.h},leaves,depth+1);
      this._split({x:node.x+split,y:node.y,w:node.w-split,h:node.h},leaves,depth+1);
    }
  }

  _corridor(x1,y1,x2,y2){
    let x=x1,y=y1;
    while(x!==x2){
      if(x>0&&x<this.w-1&&y>0&&y<this.h-1){
        if(this.map[y][x]===TILE.WALL)this.map[y][x]=TILE.CORRIDOR;
      }
      x+=x<x2?1:-1;
    }
    while(y!==y2){
      if(x>0&&x<this.w-1&&y>0&&y<this.h-1){
        if(this.map[y][x]===TILE.WALL)this.map[y][x]=TILE.CORRIDOR;
      }
      y+=y<y2?1:-1;
    }
  }

  _placeSpecials(){
    // doors at corridor-room boundaries
    for(let y=1;y<this.h-1;y++)for(let x=1;x<this.w-1;x++){
      if(this.map[y][x]===TILE.CORRIDOR){
        const adj=[[0,-1],[0,1],[-1,0],[1,0]];
        let floorN=0,wallN=0;
        for(const[dx,dy]of adj){
          const t=this.map[y+dy][x+dx];
          if(t===TILE.FLOOR)floorN++;if(t===TILE.WALL)wallN++;
        }
        if(floorN>=1&&wallN>=2&&Util.chance(.3))this.map[y][x]=TILE.DOOR;
      }
    }
    
    // stairs — always present: on the final floor they trigger victory,
    // in the endless Abyss they lead ever deeper
    {
      const lastRoom=this.rooms[this.rooms.length-1];
      this.map[lastRoom.cy][lastRoom.cx]=TILE.STAIRS_DOWN;
    }
    
    // water pools
    for(let i=0;i<2;i++){
      const room=Util.pick(this.rooms);
      const sx=Util.rand(room.x+1,room.x+room.w-2);
      const sy=Util.rand(room.y+1,room.y+room.h-2);
      for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){
        if(Util.chance(.6)&&this.map[sy+dy]&&this.map[sy+dy][sx+dx]===TILE.FLOOR)
          this.map[sy+dy][sx+dx]=TILE.WATER;
      }
    }
    
    // traps
    const trapCount=2+this.floor;
    for(let i=0;i<trapCount;i++){
      const room=Util.pick(this.rooms);
      const tx=Util.rand(room.x+1,room.x+room.w-2);
      const ty=Util.rand(room.y+1,room.y+room.h-2);
      if(this.map[ty][tx]===TILE.FLOOR)this.map[ty][tx]=TILE.TRAP;
    }
    
    // chests
    const chestCount=Util.rand(2,4);
    for(let i=0;i<chestCount;i++){
      const room=Util.pick(this.rooms);
      const cx=Util.rand(room.x,room.x+room.w-1);
      const cy=Util.rand(room.y,room.y+room.h-1);
      if(this.map[cy][cx]===TILE.FLOOR)this.map[cy][cx]=TILE.CHEST;
    }

    // secret caches: a hidden chest behind a disguised wall
    this._placeSecretCaches();

    // vault: a carved treasure pocket behind a locked door (key on the floor's monsters)
    this._placeVault();

    // arena circle: optional wave challenge
    if(this.floor>=4&&Util.chance(.25)){
      const arenaCandidates=this.rooms.slice(1,-1).filter(r=>r.w>=7&&r.h>=6&&this.map[r.cy][r.cx]===TILE.FLOOR);
      if(arenaCandidates.length){
        const ar=Util.pick(arenaCandidates);
        this.map[ar.cy][ar.cx]=TILE.ARENA;
        this.lightSources.push({x:ar.cx,y:ar.cy,r:5,color:[255,110,90]});
      }
    }

    // shrine (1 per floor) — never overwrite stairs
    if(Util.chance(.5)){
      const candidates=this.rooms.filter(r=>this.map[r.cy][r.cx]!==TILE.STAIRS_DOWN&&this.map[r.cy][r.cx]!==TILE.STAIRS_UP);
      if(candidates.length){
        const room=Util.pick(candidates);
        this.map[room.cy][room.cx]=TILE.SHRINE;
      }
    }
    
    // lava on deeper floors
    if(this.floor>=5){
      for(let i=0;i<3;i++){
        const room=Util.pick(this.rooms);
        const sx=Util.rand(room.x+1,room.x+room.w-2);
        const sy=Util.rand(room.y+1,room.y+room.h-2);
        for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){
          if(Util.chance(.4)&&this.map[sy+dy]&&this.map[sy+dy][sx+dx]===TILE.FLOOR)
            this.map[sy+dy][sx+dx]=TILE.LAVA;
        }
      }
    }
    
    // light sources in rooms
    for(const room of this.rooms){
      if(Util.chance(.6)){
        this.lightSources.push({x:room.cx,y:room.cy,r:Util.rand(4,7),color:[255,200,100]});
      }
    }
    
    // shop (1 per floor, not in first or last room) — never overwrite stairs
    if(this.rooms.length>3){
      const shopCandidates=this.rooms.slice(1,-1).filter(r=>this.map[r.cy][r.cx]===TILE.FLOOR);
      if(shopCandidates.length){
        const shopRoom=Util.pick(shopCandidates);
        this.map[shopRoom.cy][shopRoom.cx]=TILE.SHOP;
        this.lightSources.push({x:shopRoom.cx,y:shopRoom.cy,r:5,color:[255,180,60]});
      }
    }

    // mysterious relic event (optional, one per floor)
    if(this.floor>=1&&Util.chance(EVENT_BALANCE.relicSpawnChance)){
      const eventCandidates=this.rooms.slice(1,-1).filter(r=>this.map[r.cy][r.cx]===TILE.FLOOR);
      if(eventCandidates.length){
        const eventRoom=Util.pick(eventCandidates);
        this.map[eventRoom.cy][eventRoom.cx]=TILE.EVENT;
        this.lightSources.push({x:eventRoom.cx,y:eventRoom.cy,r:4,color:[120,220,255]});
      }
    }

    // shadow well event (optional, one per floor)
    if(this.floor>=3&&Util.chance(EVENT_BALANCE.wellSpawnChance)){
      const wellCandidates=this.rooms.slice(1,-1).filter(r=>this.map[r.cy][r.cx]===TILE.FLOOR);
      if(wellCandidates.length){
        const wellRoom=Util.pick(wellCandidates);
        this.map[wellRoom.cy][wellRoom.cx]=TILE.WELL;
        this.lightSources.push({x:wellRoom.cx,y:wellRoom.cy,r:4,color:[170,120,255]});
      }
    }

    // abyss rift event (optional, one per floor)
    if(this.floor>=4&&Util.chance(EVENT_BALANCE.riftSpawnChance)){
      const riftCandidates=this.rooms.slice(1,-1).filter(r=>this.map[r.cy][r.cx]===TILE.FLOOR);
      if(riftCandidates.length){
        const riftRoom=Util.pick(riftCandidates);
        this.map[riftRoom.cy][riftRoom.cx]=TILE.RIFT;
        this.lightSources.push({x:riftRoom.cx,y:riftRoom.cy,r:5,color:[120,90,255]});
      }
    }

    // void obelisk event (optional, one per floor)
    if(this.floor>=6&&Util.chance(EVENT_BALANCE.obeliskSpawnChance)){
      const obeliskCandidates=this.rooms.slice(1,-1).filter(r=>this.map[r.cy][r.cx]===TILE.FLOOR);
      if(obeliskCandidates.length){
        const obeliskRoom=Util.pick(obeliskCandidates);
        this.map[obeliskRoom.cy][obeliskRoom.cx]=TILE.OBELISK;
        this.lightSources.push({x:obeliskRoom.cx,y:obeliskRoom.cy,r:5,color:[95,140,255]});
      }
    }
    
    // safety: ensure stairs still exist
    {
      let hasStairs=false;
      for(let y=0;y<this.h&&!hasStairs;y++)for(let x=0;x<this.w&&!hasStairs;x++)if(this.map[y][x]===TILE.STAIRS_DOWN)hasStairs=true;
      if(!hasStairs){
        const lr=this.rooms[this.rooms.length-1];
        this.map[lr.cy][lr.cx]=TILE.STAIRS_DOWN;
      }
    }
  }

  // skarbiec: 3x3 kieszeń wykuta w litej skale, wejście przez zamknięte drzwi
  _placeVault(){
    if(this.floor<2||!Util.chance(.35))return;
    const dirs=[[0,-1],[0,1],[-1,0],[1,0]];
    // zbierz kandydatów: kafel podłogi + kierunek, za którym jest lity blok 5x5
    const candidates=[];
    for(const room of this.rooms){
      for(let y=room.y;y<room.y+room.h;y++)for(let x=room.x;x<room.x+room.w;x++){
        if(this.map[y]?.[x]!==TILE.FLOOR)continue;
        for(const[dx,dy]of dirs){
          // środek skarbca 3 kafle w głąb ściany
          const cx=x+dx*3,cy=y+dy*3;
          // cały blok 5x5 wokół środka musi być litą ścianą (kieszeń zostanie szczelna)
          let solid=true;
          for(let oy=-2;oy<=2&&solid;oy++)for(let ox=-2;ox<=2;ox++){
            const tx=cx+ox,ty=cy+oy;
            if(tx<1||ty<1||tx>=this.w-1||ty>=this.h-1||this.map[ty][tx]!==TILE.WALL){solid=false;break;}
          }
          if(solid)candidates.push({doorX:x+dx,doorY:y+dy,cx,cy});
        }
      }
    }
    if(!candidates.length)return;
    const v=Util.pick(candidates);
    // wykuj wnętrze 3x3
    for(let oy=-1;oy<=1;oy++)for(let ox=-1;ox<=1;ox++){
      this.map[v.cy+oy][v.cx+ox]=TILE.FLOOR;
    }
    // skarb: trzy skrzynie
    this.map[v.cy][v.cx]=TILE.CHEST;
    this.map[v.cy-1][v.cx-1]=TILE.CHEST;
    this.map[v.cy+1][v.cx+1]=TILE.CHEST;
    this.map[v.doorY][v.doorX]=TILE.LOCKED_DOOR;
    this.lightSources.push({x:v.cx,y:v.cy,r:4,color:[255,210,110]});
  }

  _placeSecretCaches(){
    const dirs=[[0,-1],[0,1],[-1,0],[1,0]];
    const maxCaches=Util.rand(1,2);
    let placed=0;
    for(const room of Util.shuffle(this.rooms.slice())){
      if(placed>=maxCaches)break;
      const spots=[];
      for(let y=room.y;y<room.y+room.h;y++)for(let x=room.x;x<room.x+room.w;x++){
        if(this.map[y]?.[x]!==TILE.FLOOR)continue;
        for(const[dx,dy]of dirs){
          const wx=x+dx,wy=y+dy;        // wall to disguise
          const bx=x+dx*2,by=y+dy*2;    // hidden cache cell
          if(wx<1||wy<1||wx>=this.w-1||wy>=this.h-1)continue;
          if(bx<1||by<1||bx>=this.w-1||by>=this.h-1)continue;
          if(this.map[wy][wx]!==TILE.WALL||this.map[by][bx]!==TILE.WALL)continue;
          // the cache must be a sealed pocket (only opened by the secret wall)
          let sealed=true;
          for(const[ex,ey]of dirs){
            const nx=bx+ex,ny=by+ey;
            if(nx===wx&&ny===wy)continue;
            if(this.map[ny]?.[nx]!==TILE.WALL){sealed=false;break;}
          }
          if(sealed)spots.push({wx,wy,bx,by});
        }
      }
      if(spots.length){
        const s=Util.pick(spots);
        this.map[s.by][s.bx]=TILE.CHEST;
        this.map[s.wy][s.wx]=TILE.SECRET_WALL;
        placed++;
      }
    }
  }

  isPassable(x,y){
    if(x<0||x>=this.w||y<0||y>=this.h)return false;
    const t=this.map[y][x];
    return t!==TILE.VOID&&t!==TILE.WALL&&t!==TILE.SECRET_WALL&&t!==TILE.LOCKED_DOOR;
  }

  isTransparent(x,y){
    if(x<0||x>=this.w||y<0||y>=this.h)return false;
    const t=this.map[y][x];
    return t!==TILE.VOID&&t!==TILE.WALL&&t!==TILE.SECRET_WALL&&t!==TILE.DOOR&&t!==TILE.LOCKED_DOOR;
  }
}

