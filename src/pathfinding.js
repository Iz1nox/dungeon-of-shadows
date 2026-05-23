'use strict';
// =============================================
// PATHFINDING — A*
// =============================================
class Pathfinder {
  static find(map,sx,sy,tx,ty,maxSteps=200){
    const key=(x,y)=>y*map.w+x;
    const open=new Map();
    const closed=new Set();
    const gScore=new Map();
    const parent=new Map();
    const h=(x,y)=>Math.abs(x-tx)+Math.abs(y-ty);
    
    const start=key(sx,sy);
    gScore.set(start,0);
    open.set(start,{x:sx,y:sy,f:h(sx,sy)});
    
    let steps=0;
    while(open.size>0&&steps++<maxSteps){
      let bestK=null,bestF=Infinity;
      for(const[k,v]of open){if(v.f<bestF){bestF=v.f;bestK=k;}}
      const cur=open.get(bestK);
      open.delete(bestK);
      
      if(cur.x===tx&&cur.y===ty){
        const path=[];let k=key(tx,ty);
        while(k!==undefined){const p=parent.get(k);if(p===undefined)break;path.push({x:cur.x,y:cur.y});
          // reconstruct
          const ppath=[];let ck=key(tx,ty);
          while(ck!==start){const pp=parent.get(ck);if(!pp)break;ppath.unshift({x:ck%map.w,y:Math.floor(ck/map.w)});ck=pp;}
          return ppath;
        }
        // simpler reconstruct
        const ppath=[];let ck=key(tx,ty);
        while(ck!==start&&ck!==undefined){ppath.unshift({x:ck%map.w,y:Math.floor(ck/map.w)});ck=parent.get(ck);if(ck===undefined)break;}
        return ppath;
      }
      
      closed.add(bestK);
      const dirs=[[0,-1],[0,1],[-1,0],[1,0],[-1,-1],[1,-1],[-1,1],[1,1]];
      for(const[dx,dy]of dirs){
        const nx=cur.x+dx,ny=cur.y+dy;
        const nk=key(nx,ny);
        if(closed.has(nk))continue;
        if(!map.isPassable(nx,ny))continue;
        const ng=gScore.get(bestK)+(dx&&dy?1.414:1);
        if(!gScore.has(nk)||ng<gScore.get(nk)){
          gScore.set(nk,ng);
          parent.set(nk,bestK);
          open.set(nk,{x:nx,y:ny,f:ng+h(nx,ny)});
        }
      }
    }
    return[];
  }
}

