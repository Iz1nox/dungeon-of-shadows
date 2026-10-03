'use strict';
// =============================================
// GRIMUAR UI (2.5): okno wyboru nagrody na kartach (awans / relikt / kapliczka).
// CardData = {icon, name, desc, category, rarity, cost?, disabledReason?}
// =============================================
const GrimoireUI = {
  LOCK_MS:350,        // ochrona przed przypadkowym wyborem (awans wyskakuje w trakcie klikania atakiem)
  PICK_FLASH_MS:250,  // błysk wybranej karty przed zamknięciem
  CARD_STAGGER_MS:60,

  _open:false,
  _openedAt:0,
  _picked:false,
  _flashTimer:null,
  _cards:[],
  _onPick:null,

  _screen(){return document.getElementById('level-up-screen');},

  _prefersReducedMotion(){
    try{return !!(window.matchMedia&&window.matchMedia('(prefers-reduced-motion: reduce)').matches);}
    catch(e){return false;}
  },

  _el(tag,cls,text){
    const el=document.createElement(tag);
    if(cls)el.className=cls;
    if(text!==undefined&&text!==null)el.textContent=text;
    return el;
  },

  _buildCard(data,index){
    const card=this._el('div',`gr-card gr-r-${data.rarity||'common'}`);
    card.tabIndex=0;
    card.style.setProperty('--gr-delay',`${index*this.CARD_STAGGER_MS}ms`);
    card.appendChild(this._el('span','gr-key',String(index+1)));
    card.appendChild(this._el('div','gr-seal','✦'));
    card.appendChild(this._el('div','gr-ic',data.icon||''));
    card.appendChild(this._el('div','gr-nm',data.name||''));
    if(data.desc)card.appendChild(this._el('div','gr-ds',data.desc));
    if(data.category)card.appendChild(this._el('div','gr-cat',data.category));
    if(data.cost)card.appendChild(this._el('div','gr-cost',data.cost));
    if(data.disabledReason){
      card.classList.add('is-disabled');
      card.appendChild(this._el('div','gr-why',data.disabledReason));
    }
    card.addEventListener('click',()=>this.pickByIndex(index));
    card.addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();this.pickByIndex(index);}});
    return card;
  },

  openChoice({title,subtitle,cards,skip,onPick}){
    this._cancelFlash();
    const screen=this._screen();
    screen.classList.add('gr-book');
    const info=document.getElementById('level-up-info');
    info.innerHTML='';
    info.appendChild(this._el('div','gr-title',title||''));
    if(subtitle)info.appendChild(this._el('div','gr-sub',subtitle));
    const box=document.getElementById('level-up-choices');
    box.innerHTML='';
    box.className='gr-cards';
    this._cards=(cards||[]).slice(0,4);
    this._cards.forEach((c,i)=>box.appendChild(this._buildCard(c,i)));
    // przycisk "Pomiń" pod kartami (poza rzędem kart)
    const old=screen.querySelector('.gr-actions');
    if(old)old.remove();
    if(skip){
      const actions=this._el('div','gr-actions');
      const btn=this._el('button','gr-btn',skip.label||'Pomiń');
      btn.dataset.skip='1';
      btn.addEventListener('click',()=>this._choose('skip',null));
      actions.appendChild(btn);
      screen.appendChild(actions);
    }
    this._onPick=onPick||null;
    this._picked=false;
    this._open=true;
    this._openedAt=performance.now();
    screen.style.display='block';
  },

  isOpen(){return this._open;},

  _isLocked(){
    return this._picked||!this._open||performance.now()-this._openedAt<this.LOCK_MS;
  },

  pickByIndex(i){
    if(this._isLocked())return false;
    const data=this._cards[i];
    if(!data||data.disabledReason)return false;
    const cardEl=document.querySelectorAll('#level-up-choices .gr-card')[i]||null;
    this._choose(i,cardEl);
    return true;
  },

  _choose(result,cardEl){
    if(this._isLocked())return;
    this._picked=true;
    const onPick=this._onPick;
    const delay=this._prefersReducedMotion()?0:this.PICK_FLASH_MS;
    if(cardEl)cardEl.classList.add('is-picked');
    if(delay<=0){if(onPick)onPick(result);return;}
    this._flashTimer=setTimeout(()=>{
      this._flashTimer=null;
      if(onPick)onPick(result);
    },delay);
  },

  _cancelFlash(){
    if(this._flashTimer){clearTimeout(this._flashTimer);this._flashTimer=null;}
  },

  // zamknięcie bez wyboru — anuluje też oczekujący błysk (wczytanie gry, śmierć)
  close(){
    this._cancelFlash();
    this._open=false;
    this._picked=false;
    this._onPick=null;
    const screen=this._screen();
    if(screen)screen.style.display='none';
  },
};
