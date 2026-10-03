'use strict';
// =============================================
// KEY BINDINGS
// =============================================
const DEFAULT_KEYS = {
  moveUp:'w', moveDown:'s', moveLeft:'a', moveRight:'d',
  inventory:'i', pickup:'e', interact:'f', dodge:' ',
  map:'Tab', spell1:'1', spell2:'2', spell3:'3', spell4:'4', spell5:'5',
  potionHp:'q', potionMp:'r',
  settings:'Escape', quickSave:'F5', quickLoad:'F9', debugOverlay:'F3'
};
const KEY_LABELS = {
  moveUp:'Ruch w górę', moveDown:'Ruch w dół', moveLeft:'Ruch w lewo', moveRight:'Ruch w prawo',
  inventory:'Ekwipunek', pickup:'Podnoszenie', interact:'Interakcja', dodge:'Unik',
  map:'Pełna mapa', spell1:'Zaklęcie 1', spell2:'Zaklęcie 2', spell3:'Zaklęcie 3',
  spell4:'Zaklęcie 4', spell5:'Zaklęcie 5',
  potionHp:'Mikstura HP', potionMp:'Mikstura MP',
  settings:'Ustawienia', quickSave:'Szybki zapis', quickLoad:'Szybki odczyt', debugOverlay:'Panel debug'
};
const KEY_DISPLAY_NAMES = {
  ' ':'Spacja','Tab':'Tab','Escape':'Esc','ArrowUp':'↑','ArrowDown':'↓','ArrowLeft':'←','ArrowRight':'→',
  'F1':'F1','F2':'F2','F3':'F3','F4':'F4','F5':'F5','F6':'F6','F7':'F7','F8':'F8','F9':'F9','F10':'F10','F11':'F11','F12':'F12',
  'Shift':'Shift','Control':'Ctrl','Alt':'Alt'
};

function getKeyDisplay(key){
  if(KEY_DISPLAY_NAMES[key])return KEY_DISPLAY_NAMES[key];
  if(key.length===1)return key.toUpperCase();
  return key;
}

function loadKeyBindings(){
  try{
    const saved=localStorage.getItem('dos_keybindings');
    if(saved){
      const parsed=JSON.parse(saved)||{};
      // 2.4: bezczynne "Czekaj" stało się "Unikiem" — przenosimy własne przypisanie gracza
      if('wait' in parsed){
        if(!('dodge' in parsed))parsed.dodge=parsed.wait;
        delete parsed.wait;
      }
      return {...DEFAULT_KEYS,...parsed};
    }
  }catch(e){}
  return {...DEFAULT_KEYS};
}
function saveKeyBindings(bindings){
  try{localStorage.setItem('dos_keybindings',JSON.stringify(bindings));}catch(e){}
}
let KeyBindings = loadKeyBindings();

function loadDebugOverlayVisible(){
  try{
    const raw=localStorage.getItem(DEBUG_OVERLAY_STORAGE_KEY);
    if(raw===null)return false;
    return raw==='1';
  }catch(e){
    return false;
  }
}
function saveDebugOverlayVisible(isVisible){
  try{localStorage.setItem(DEBUG_OVERLAY_STORAGE_KEY,isVisible?'1':'0');}catch(e){}
}

