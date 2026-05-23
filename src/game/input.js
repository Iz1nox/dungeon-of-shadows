'use strict';
Object.assign(Game, {
  _matchKey(eventKey,eventCode,bindingKey){
    const bk=bindingKey.toLowerCase();
    if(eventKey.toLowerCase()===bk)return true;
    if(eventCode&&eventCode.toLowerCase()===bk)return true;
    // Tab key: e.key='Tab', e.code='Tab'
    if(eventKey===bindingKey)return true;
    return false;
  },

  _runBoundAction(actionName,event){
    switch(actionName){
      case 'inventory':
        this.toggleInventory();
        break;
      case 'pickup':
        this.pickupItem();
        break;
      case 'interact':
        this.interact();
        break;
      case 'spell1':
        this.castSpell(0);
        break;
      case 'spell2':
        this.castSpell(1);
        break;
      case 'spell3':
        this.castSpell(2);
        break;
      case 'spell4':
        this.castSpell(3);
        break;
      case 'spell5':
        this.castSpell(4);
        break;
      case 'wait':
        event.preventDefault();
        break;
      case 'map':
        event.preventDefault();event.stopPropagation();
        this.showFullMap=!this.showFullMap;
        break;
      case 'settings':
        event.preventDefault();
        this.toggleSettings();
        break;
      case 'quickSave':
        event.preventDefault();
        this.quickSave();
        break;
      case 'quickLoad':
        event.preventDefault();
        this.quickLoad();
        break;
      case 'debugOverlay':
        event.preventDefault();
        this.toggleDebugOverlay();
        break;
      case 'potionHp':
        this.quickUsePotion('hp');
        break;
      case 'potionMp':
        this.quickUsePotion('mp');
        break;
    }
  },

  _getBoundActionOrder(){
    return[
      'inventory','pickup','interact',
      'spell1','spell2','spell3','spell4','spell5',
      'wait','map','settings','quickSave','quickLoad','debugOverlay',
      'potionHp','potionMp'
    ];
  },

  _dispatchMatchingBoundActions(actionOrder,eventKey,eventCode,event){
    const K=KeyBindings;
    for(const actionName of actionOrder){
      if(this._matchKey(eventKey,eventCode,K[actionName])){
        this._runBoundAction(actionName,event);
      }
    }
  },

  _processBoundKeyActions(eventKey,eventCode,event){
    const actionOrder=this._getBoundActionOrder();
    this._dispatchMatchingBoundActions(actionOrder,eventKey,eventCode,event);
  },

  initInput(){
    window.addEventListener('keydown',e=>{
      // if settings key-listening is active, capture key there
      if(this._settingsListening){
        e.preventDefault();
        this._settingsListening(e.key==='Escape'?this._settingsListeningOld:e.key);
        return;
      }
      
      // prevent default for Tab and F-keys immediately
      if(e.key==='Tab'||e.key==='F3'||e.key==='F5'||e.key==='F9'){e.preventDefault();e.stopPropagation();}
      
      this.keys[e.key.toLowerCase()]=true;
      this.keys[e.code]=true;
      
      // skip repeated keydown events for toggle actions
      if(e.repeat)return;
      this._processBoundKeyActions(e.key,e.code,e);
    },true);
    window.addEventListener('keyup',e=>{
      this.keys[e.key.toLowerCase()]=false;
      this.keys[e.code]=false;
    });
    this.canvas.addEventListener('mousemove',e=>{
      this.mouseX=e.clientX;this.mouseY=e.clientY;
    });
    this.canvas.addEventListener('mousedown',e=>{
      e.preventDefault();
      if(e.button===0){
        if(e.shiftKey)this.specialAttack();
        else this.playerAttack();
      }
      if(e.button===2)this.specialAttack();
    });
    this.canvas.addEventListener('contextmenu',e=>e.preventDefault());
    
    // resume audio context on interaction
    document.addEventListener('click',()=>{
      if(this.sound.ctx&&this.sound.ctx.state==='suspended')this.sound.ctx.resume();
    },{once:true});
  },
  
  // ---- SPELL BAR UI ----
});
