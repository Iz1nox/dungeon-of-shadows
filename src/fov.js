'use strict';
// =============================================
// FOV — Shadow Casting
// =============================================
class FOV {
  static compute(map,ox,oy,radius){
    const w=map.w,h=map.h;
    for(let y=0;y<h;y++)for(let x=0;x<w;x++)map.visible[y][x]=0;
    map.visible[oy][ox]=1;map.explored[oy][ox]=1;
    
    for(let oct=0;oct<8;oct++){
      FOV._castLight(map,ox,oy,radius,1,1.0,0.0,
        FOV.mult[0][oct],FOV.mult[1][oct],FOV.mult[2][oct],FOV.mult[3][oct]);
    }
  }

  static _castLight(map,ox,oy,r,row,startSlope,endSlope,xx,xy,yx,yy){
    if(startSlope<endSlope)return;
    let newStart=startSlope;
    for(let j=row;j<=r;j++){
      let blocked=false;
      for(let dx=-j,dy=-j;dx<=0;dx++){
        const lSlope=(dx-0.5)/(dy+0.5);
        const rSlope=(dx+0.5)/(dy-0.5);
        if(rSlope>newStart)continue;
        if(lSlope<endSlope)break;
        const ax=ox+dx*xx+dy*xy;
        const ay=oy+dx*yx+dy*yy;
        if(ax<0||ax>=map.w||ay<0||ay>=map.h)continue;
        const dist2=dx*dx+dy*dy;
        if(dist2<=r*r){
          map.visible[ay][ax]=1;
          map.explored[ay][ax]=1;
        }
        if(blocked){
          if(!map.isTransparent(ax,ay)){newStart=rSlope;continue;}
          blocked=false;newStart=lSlope;
        }else if(!map.isTransparent(ax,ay)&&j<r){
          blocked=true;
          FOV._castLight(map,ox,oy,r,j+1,newStart,rSlope,xx,xy,yx,yy);
          newStart=rSlope;
        }
      }
      if(blocked)break;
    }
  }
}
FOV.mult=[[1,0,0,-1,-1,0,0,1],[0,1,-1,0,0,-1,1,0],[0,1,1,0,0,-1,-1,0],[1,0,0,1,-1,0,0,-1]];

