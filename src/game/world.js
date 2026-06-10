'use strict';
Object.assign(Game, {
  resize(){
    this.canvas.width=window.innerWidth;
    this.canvas.height=window.innerHeight;
  },
  
  // ---- PLAYER ----
  initPlayer(cls){
    const stats={
      warrior:{hp:120,maxHp:120,mp:40,maxMp:40,atk:12,def:8,speed:4,critChance:.1,critMult:1.5},
      mage:{hp:70,maxHp:70,mp:100,maxMp:100,atk:6,def:3,speed:4,critChance:.05,critMult:1.5},
      rogue:{hp:85,maxHp:85,mp:60,maxMp:60,atk:10,def:4,speed:5.5,critChance:.25,critMult:2},
      necromancer:{hp:80,maxHp:80,mp:90,maxMp:90,atk:7,def:4,speed:4.2,critChance:.08,critMult:1.6},
    };
    const classNames={warrior:'Wojownik',mage:'Mag',rogue:'Łotrzyk',necromancer:'Nekromanta'};
    this.player={
      ...stats[cls],x:0,y:0,level:1,xp:0,xpToLevel:PROGRESSION_BALANCE.baseXpToLevel,
      gold:0,inventory:[],equipment:{weapon:null,armor:null,ring:null},relics:[],
      spells:ContentRegistry.getClassSpells(cls).map(s=>({...s})),
      className:classNames[cls],class:cls,
      buffs:[],stealthTimer:0,rageTimer:0,
      attackTimer:0,attackCd:.4,
      iFrames:0,combo:0,comboTimer:0,
      moveAccX:0,moveAccY:0,
      animState:'idle',animTimer:0,facing:1,
      talents:{lifeSteal:0,manaShield:0,dodge:0,thorns:0,critDmg:0,spellPower:0,goldFind:0,regenHp:0,regenMp:0},
    };
    if(cls==='warrior')this.player.attackCd=.5;
    if(cls==='rogue')this.player.attackCd=.25;
    if(cls==='mage')this.player.attackCd=.6;
    if(cls==='necromancer')this.player.attackCd=.55;
    Meta.applyToPlayer(this.player); // persistent meta upgrades
    this._quickslotCounts={hp:0,mp:0};
    this._quickslotsCacheKey='';
    this._quickslotsDirty=true;
  },
  
  // ---- FLOOR GENERATION ----
  _findTiles(tileType){
    const found=[];
    for(let y=0;y<MAP_H;y++){
      for(let x=0;x<MAP_W;x++){
        if(this.dungeon.map[y][x]===tileType)found.push({x,y});
      }
    }
    return found;
  },

  _clearSpecialTile(x,y){
    this.dungeon.map[y][x]=TILE.FLOOR;
    this.dungeon.lightSources=this.dungeon.lightSources.filter(l=>!(l.x===x&&l.y===y));
  },

  _applyEventCooldownToFloor(){
    const cd=EVENT_BALANCE.eventRepeatCooldownFloors||1;
    const relicTiles=this._findTiles(TILE.EVENT);
    const wellTiles=this._findTiles(TILE.WELL);
    const riftTiles=this._findTiles(TILE.RIFT);
    const obeliskTiles=this._findTiles(TILE.OBELISK);
    this._eventSpawnTrace={
      relicGenerated:relicTiles.length>0,
      relicBlocked:false,
      relicActive:false,
      wellGenerated:wellTiles.length>0,
      wellBlocked:false,
      wellActive:false,
      riftGenerated:riftTiles.length>0,
      riftBlocked:false,
      riftActive:false,
      obeliskGenerated:obeliskTiles.length>0,
      obeliskBlocked:false,
      obeliskActive:false,
    };

    if(relicTiles.length>0){
      if(this.floor-(this._lastRelicFloor||0)<=cd){
        for(const pos of relicTiles)this._clearSpecialTile(pos.x,pos.y);
        this._eventSpawnTrace.relicBlocked=true;
      }else{
        this._lastRelicFloor=this.floor;
        this._eventSpawnTrace.relicActive=true;
      }
    }

    if(wellTiles.length>0){
      if(this.floor-(this._lastWellFloor||0)<=cd){
        for(const pos of wellTiles)this._clearSpecialTile(pos.x,pos.y);
        this._eventSpawnTrace.wellBlocked=true;
      }else{
        this._lastWellFloor=this.floor;
        this._eventSpawnTrace.wellActive=true;
      }
    }

    if(riftTiles.length>0){
      if(this.floor-(this._lastRiftFloor||0)<=cd){
        for(const pos of riftTiles)this._clearSpecialTile(pos.x,pos.y);
        this._eventSpawnTrace.riftBlocked=true;
      }else{
        this._lastRiftFloor=this.floor;
        this._eventSpawnTrace.riftActive=true;
      }
    }

    if(obeliskTiles.length>0){
      if(this.floor-(this._lastObeliskFloor||0)<=cd){
        for(const pos of obeliskTiles)this._clearSpecialTile(pos.x,pos.y);
        this._eventSpawnTrace.obeliskBlocked=true;
      }else{
        this._lastObeliskFloor=this.floor;
        this._eventSpawnTrace.obeliskActive=true;
      }
    }
  },

  _eventCooldownRemaining(lastFloor){
    const cd=EVENT_BALANCE.eventRepeatCooldownFloors||1;
    if(!lastFloor||lastFloor<=0)return 0;
    return Math.max(0,cd-(this.floor-lastFloor)+1);
  },

  _getFloorEventTraceSummary(trace=this._eventSpawnTrace){
    if(!trace)return null;
    const relicState=trace.relicActive?'aktywny':trace.relicBlocked?'zablokowany':'brak';
    const wellState=trace.wellActive?'aktywna':trace.wellBlocked?'zablokowana':'brak';
    const riftState=trace.riftActive?'aktywna':trace.riftBlocked?'zablokowana':'brak';
    const obeliskState=trace.obeliskActive?'aktywny':trace.obeliskBlocked?'zablokowany':'brak';
    const shortStatus=`R-${trace.relicActive?'on':trace.relicBlocked?'blk':'off'} W-${trace.wellActive?'on':trace.wellBlocked?'blk':'off'} V-${trace.riftActive?'on':trace.riftBlocked?'blk':'off'} O-${trace.obeliskActive?'on':trace.obeliskBlocked?'blk':'off'}`;
    return{
      relicState,
      wellState,
      riftState,
      obeliskState,
      shortStatus,
      longText:`🧭 Eventy -> relikt: ${relicState}, studnia: ${wellState}, szczelina: ${riftState}, obelisk: ${obeliskState}`
    };
  },

  generateFloor(){
    this.dungeon=new DungeonGenerator(MAP_W,MAP_H,this.floor,this.endlessMode).generate();
    this._applyEventCooldownToFloor();
    this.enemies=[];this.items=[];this.projectiles=[];
    this._minimapDirty=true;
    
    // place player in first room
    const firstRoom=this.dungeon.rooms[0];
    this.player.x=firstRoom.cx;this.player.y=firstRoom.cy;

    // summoned minions follow the necromancer down the stairs
    if(!Array.isArray(this.minions))this.minions=[];
    for(const m of this.minions){m.x=this.player.x;m.y=this.player.y;}
    
    // spawn enemies
    const enemyTypes=ContentRegistry.getEnemyTypesForFloor(this.floor);
    const enemyCount=Math.floor(ENCOUNTER_BALANCE.baseEnemyCount+this.floor*ENCOUNTER_BALANCE.enemyCountPerFloor);
    for(let i=0;i<enemyCount;i++){
      const room=Util.pick(this.dungeon.rooms.slice(1));
      const et=Util.pick(enemyTypes);
      const ex=Util.rand(room.x+1,room.x+room.w-2);
      const ey=Util.rand(room.y+1,room.y+room.h-2);
      if(!this.dungeon.isPassable(ex,ey))continue;
      const enemy=this._makeEnemy(et,ex,ey);
      EliteAffixes.tryMakeElite(enemy,this.floor);
      this.enemies.push(enemy);
    }
    
    // boss every 3 floors
    if(this.floor%3===0){
      const bossData=ContentRegistry.getBossForFloor(this.floor);
      if(bossData){
        const bossRoom=this.dungeon.rooms[this.dungeon.rooms.length-1];
        const boss=this._makeEnemy(bossData,bossRoom.cx,bossRoom.cy);
        boss.isBoss=true;boss.abilities=bossData.abilities||[];
        boss.abilityTimer=3;boss.phase=1;
        // scale boss to floor
        boss.maxHp=Math.floor(boss.maxHp*(1+this.floor*ENCOUNTER_BALANCE.bossHpScalePerFloor));
        boss.hp=boss.maxHp;
        boss.atk=Math.floor(boss.atk*(1+this.floor*ENCOUNTER_BALANCE.bossAtkScalePerFloor));
        this.enemies.push(boss);
      }
    }
    
    // drop some items on the floor
    const itemCount=Util.rand(3,6);
    for(let i=0;i<itemCount;i++){
      const room=Util.pick(this.dungeon.rooms);
      const ix=Util.rand(room.x,room.x+room.w-1);
      const iy=Util.rand(room.y,room.y+room.h-1);
      if(this.dungeon.isPassable(ix,iy)){
        this.items.push({...ContentRegistry.generateLoot(this.floor),x:ix,y:iy});
      }
    }
    
    // gold scattered
    for(let i=0;i<8+this.floor*2;i++){
      const room=Util.pick(this.dungeon.rooms);
      const gx=Util.rand(room.x,room.x+room.w-1);
      const gy=Util.rand(room.y,room.y+room.h-1);
      if(this.dungeon.isPassable(gx,gy)){
        this.items.push({name:'Złoto',icon:'💰',type:'gold',value:Util.rand(3,10+this.floor*3),rarity:'common',x:gx,y:gy,id:Math.random().toString(36).substr(2,9)});
      }
    }
    
    this.log(`📍 Piętro ${this.floor}`,this.floor%3===0?'boss':'info');
    this.floorTheme=FloorThemes.getTheme(this.floor);
    this.sound.startAmbient(this.floorTheme);
    this.log(`🏰 ${this.floorTheme.name}`,'info');
    const eventTrace=this._getFloorEventTraceSummary();
    if(eventTrace)this.log(eventTrace.longText,'info');
    if(this.floor%3===0){
      this.log('⚠️ Wyczuwasz potężną obecność...','boss');
      this.sound.boss();
    }
    
    FOV.compute(this.dungeon,this.player.x,this.player.y,FOV_RADIUS);
  },
  
  _makeEnemy(data,x,y){
    const scale=1+this.floor*0.12;
    return{
      ...data,x,y,maxHp:Math.floor(data.hp*scale),hp:Math.floor(data.hp*scale),
      atk:Math.floor(data.atk*scale),def:Math.floor((data.def||0)*scale),
      id:Math.random().toString(36).substr(2,9),
      pathTimer:0,path:[],alertTimer:0,alerted:false,
      stunTimer:0,burnTimer:0,freezeTimer:0,poisonTimer:0,
      isBoss:false,attackTimer:0,attackCd:data.attackCd||1.2,
      animTimer:0,hitFlash:0,
      patrolTarget:null,
    };
  },
  
  // ---- INPUT ----
});
