'use strict';
// =============================================
// BESTIARY (persistent across runs, localStorage)
// =============================================
const Bestiary={
  KEY:'dos_bestiary',
  data:null,
  _dirty:false,

  load(){
    if(!this.data){
      try{this.data=JSON.parse(localStorage.getItem(this.KEY))||{};}catch(e){this.data={};}
    }
    if(!this.data.kills)this.data.kills={};
    return this.data;
  },

  save(){
    try{localStorage.setItem(this.KEY,JSON.stringify(this.data));}catch(e){}
    this._dirty=false;
  },

  recordKill(e){
    const name=e.baseName||e.name;
    if(!name)return;
    this.load();
    this.data.kills[name]=(this.data.kills[name]||0)+1;
    this.save();
  },

  kills(name){
    return this.load().kills[name]||0;
  },

  // wszystkie wpisy w kolejności grup
  getGroups(){
    return[
      {label:'🗡️ Potwory lochu',entries:EnemyDB.types},
      {label:'🕳️ Stwory Otchłani',entries:EnemyDB.abyssTypes},
      {label:'👑 Bossowie',entries:EnemyDB.bosses},
      {label:'❓ Osobliwości',entries:[EnemyDB.special.mimic]},
    ];
  },

  getDiscoveredCount(){
    this.load();
    let total=0,discovered=0;
    for(const g of this.getGroups()){
      for(const t of g.entries){
        total++;
        if(this.kills(t.name)>0)discovered++;
      }
    }
    return{discovered,total};
  },
};
