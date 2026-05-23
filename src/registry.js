'use strict';
// =============================================
// ENEMY DEFINITIONS
// =============================================
// EnemyDB moved to content/enemies.js

// =============================================
// CONTENT REGISTRY (DATA-DRIVEN LAYER)
// =============================================
const ContentRegistry = {
  initialized:false,
  errors:[],
  data:null,

  init(){
    if(this.initialized)return;
    this.data={
      items:ItemDB,
      spells:SpellDB,
      enemies:EnemyDB,
    };
    this._validateCoreContent();
    this.initialized=true;
  },

  _pushError(message){
    this.errors.push(message);
    console.warn('[ContentRegistry]',message);
  },

  _validateCoreContent(){
    this._validateSpellClasses();
    this._validateEnemyCollections();
    this._validateItemGenerators();
  },

  _validateSpellClasses(){
    const spells=this.data.spells||{};
    const required=['warrior','mage','rogue'];
    for(const cls of required){
      if(!Array.isArray(spells[cls])||spells[cls].length===0){
        this._pushError(`Spell set missing/empty for class: ${cls}`);
      }
    }
  },

  _validateEnemyCollections(){
    const enemies=this.data.enemies||{};
    if(!Array.isArray(enemies.types)||enemies.types.length===0){
      this._pushError('Enemy types collection missing/empty');
    }
    if(!Array.isArray(enemies.bosses)||enemies.bosses.length===0){
      this._pushError('Enemy bosses collection missing/empty');
    }
  },

  _validateItemGenerators(){
    const items=this.data.items||{};
    if(typeof items.generateLoot!=='function'){
      this._pushError('Item loot generator missing');
    }
  },

  hasClassSpells(cls){
    this.init();
    return !!(this.data.spells&&Array.isArray(this.data.spells[cls]));
  },

  getClassSpells(cls){
    this.init();
    if(this.hasClassSpells(cls))return this.data.spells[cls];
    return this.data.spells.warrior||[];
  },

  getEnemyTypesForFloor(floor){
    this.init();
    return this.data.enemies.getForFloor(floor);
  },

  getBossForFloor(floor){
    this.init();
    return this.data.enemies.getBoss(floor);
  },

  generateLoot(floor,luck=0){
    this.init();
    return this.data.items.generateLoot(floor,luck);
  },
};

