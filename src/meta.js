'use strict';
// =============================================
// META PROGRESSION (persistent between runs)
// =============================================
const Meta = {
  KEY:'dos_meta',
  data:null,
  upgrades:[
    {id:'vitality',name:'Witalność',icon:'❤️',desc:'+15 maks. HP / poziom',max:5,cost:l=>40+l*30,apply:(p,l)=>{p.maxHp+=15*l;p.hp+=15*l;}},
    {id:'might',name:'Potęga',icon:'⚔️',desc:'+2 ATK / poziom',max:5,cost:l=>50+l*35,apply:(p,l)=>{p.atk+=2*l;}},
    {id:'ward',name:'Ochrona',icon:'🛡️',desc:'+1 DEF / poziom',max:5,cost:l=>50+l*35,apply:(p,l)=>{p.def+=l;}},
    {id:'focus',name:'Skupienie',icon:'🔮',desc:'+10 maks. MP / poziom',max:5,cost:l=>35+l*25,apply:(p,l)=>{p.maxMp+=10*l;p.mp+=10*l;}},
    {id:'fortune',name:'Fortuna',icon:'💰',desc:'+25 startowego złota / poziom',max:5,cost:l=>30+l*25,apply:(p,l)=>{p.gold+=25*l;}},
    {id:'swiftness',name:'Prędkość',icon:'💨',desc:'+0.2 szybkości / poziom',max:3,cost:l=>60+l*45,apply:(p,l)=>{p.speed+=.2*l;}},
    {id:'precision',name:'Precyzja',icon:'🎯',desc:'+2% szansy na krytyka / poziom',max:5,cost:l=>55+l*40,apply:(p,l)=>{p.critChance+=.02*l;}},
    {id:'alchemy',name:'Alchemik',icon:'🧪',desc:'Zaczynasz z miksturą HP / poziom',max:3,cost:l=>45+l*30,apply:(p,l)=>{p.inventory.push({...ItemDB.potions[0],id:Math.random().toString(36).substr(2,9),count:l});}},
    {id:'harvest',name:'Żniwa Dusz',icon:'🔮',desc:'+10% esencji dusz po wyprawie / poziom',max:5,cost:l=>70+l*50,apply:()=>{}},
  ],
  load(){
    if(!this.data){
      try{this.data=JSON.parse(localStorage.getItem(this.KEY))||{};}catch(e){this.data={};}
    }
    if(typeof this.data.essence!=='number')this.data.essence=0;
    if(!this.data.levels)this.data.levels={};
    return this.data;
  },
  save(){try{localStorage.setItem(this.KEY,JSON.stringify(this.data));}catch(e){}},
  essence(){return this.load().essence;},
  getLevel(id){return this.load().levels[id]||0;},
  nextCost(u){const l=this.getLevel(u.id);return l>=u.max?null:u.cost(l);},
  buy(id){
    this.load();
    const u=this.upgrades.find(x=>x.id===id);
    if(!u)return false;
    const l=this.getLevel(id);
    if(l>=u.max)return false;
    const c=u.cost(l);
    if(this.data.essence<c)return false;
    this.data.essence-=c;
    this.data.levels[id]=l+1;
    this.save();
    return true;
  },
  award(amount){
    this.load();
    this.data.essence+=Math.max(0,Math.floor(amount));
    this.save();
  },
  applyToPlayer(p){
    this.load();
    for(const u of this.upgrades){
      const l=this.getLevel(u.id);
      if(l>0)u.apply(p,l);
    }
  },
};
