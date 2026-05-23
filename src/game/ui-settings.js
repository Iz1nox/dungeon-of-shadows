'use strict';
Object.assign(Game, {
  _appendLogMessage(logEl,msg,cls='info'){
    const div=document.createElement('div');
    div.className='msg '+(cls||'');
    div.textContent=msg;
    logEl.appendChild(div);
    logEl.scrollTop=logEl.scrollHeight;
  },

  _trimLogMessages(logEl,maxMessages=50){
    while(logEl.children.length>maxMessages)logEl.removeChild(logEl.firstChild);
  },

  // ---- LOGGING ----
  log(msg,cls='info'){
    const logEl=document.getElementById('message-log');
    this._appendLogMessage(logEl,msg,cls);
    this._trimLogMessages(logEl,50);
  },
  
  // =============================================
  // SETTINGS PANEL (Keybindings + Save/Load)
  // =============================================
  _settingsListening:null,
  _settingsListeningOld:null,

  _closeSettingsPanel(){
    const panel=document.getElementById('settings-panel');
    panel.classList.remove('open');
    this.paused=false;
    this._settingsListening=null;
  },

  _openSettingsPanel(){
    const panel=document.getElementById('settings-panel');
    panel.classList.add('open');
    this.paused=true;
    this._renderSettings();
  },
  
  toggleSettings(){
    const panel=document.getElementById('settings-panel');
    const isOpen=panel.classList.contains('open');
    if(isOpen){
      this._closeSettingsPanel();
    }else{
      this._openSettingsPanel();
    }
  },

  _buildSettingsSectionHtml(title,contentHtml){
    return `<div class="section"><h3>${title}</h3>${contentHtml}</div>`;
  },

  _buildSettingsFilledSaveRowHtml(slot,saveData){
    return `<div class="save-row">
          <div><div class="save-name">📁 Slot ${slot}: ${saveData.className} Lv.${saveData.level}</div>
          <div class="save-info">Piętro ${saveData.floor} | Złoto: ${saveData.gold} | ${saveData.date}</div></div>
          <div style="display:flex;gap:4px">
            <button class="btn-save-slot" onclick="Game.saveGame(${slot})">Zapisz</button>
            <button class="btn-load-slot" onclick="Game.loadGame(${slot})">Wczytaj</button>
            <button class="btn-delete-slot" onclick="Game.deleteSave(${slot})">✕</button>
          </div>
        </div>`;
  },

  _buildSettingsEmptySaveRowHtml(slot){
    return `<div class="save-row">
          <div><span class="save-empty">Slot ${slot} — pusty</span></div>
          <div><button class="btn-save-slot" onclick="Game.saveGame(${slot})">Zapisz</button></div>
        </div>`;
  },

  _buildSettingsSaveRowsHtml(){
    let html='';
    for(let slot=1;slot<=SAVE_SLOTS;slot++){
      const saveData=this._getSaveInfo(slot);
      if(saveData){
        html+=this._buildSettingsFilledSaveRowHtml(slot,saveData);
      }else{
        html+=this._buildSettingsEmptySaveRowHtml(slot);
      }
    }
    return html;
  },

  _buildSettingsKeyRowHtml(action){
    const key=KeyBindings[action];
    return `<div class="key-row">
        <span class="key-label">${KEY_LABELS[action]}</span>
        <button class="key-btn" id="keybtn-${action}" onclick="Game._startKeyListen('${action}')">${getKeyDisplay(key)}</button>
      </div>`;
  },

  _buildSettingsKeyRowsHtml(){
    let html='';
    for(const action of Object.keys(KEY_LABELS)){
      html+=this._buildSettingsKeyRowHtml(action);
    }
    return html;
  },

  _buildSettingsDebugHtml(){
    let html='';
    html+=`<div class="key-row">
      <span class="key-label">Status panelu</span>
      <span style="color:${this._debugOverlayVisible?'#8f8':'#f88'};font-size:12px">${this._debugOverlayVisible?'Włączony':'Wyłączony'}</span>
    </div>`;
    html+=`<div class="key-row">
      <span class="key-label">Skrót</span>
      <button class="key-btn" onclick="Game.toggleDebugOverlay()">Przełącz (${getKeyDisplay(KeyBindings.debugOverlay||'F3')})</button>
    </div>`;
    html+=`<div style="margin-top:8px;color:#7f879d;font-size:11px">Ustawienie widoczności panelu debug jest zapisywane między sesjami gry.</div>`;
    return html;
  },

  _buildSettingsFooterHtml(){
    return `<div class="panel-btns">
      <button class="btn-reset" onclick="Game._resetKeys()">Domyślne klawisze</button>
      <button class="btn-close" onclick="Game.toggleSettings()">Zamknij (Esc)</button>
    </div>`;
  },
  
  _renderSettings(){
    const panel=document.getElementById('settings-panel');
    let html=`<h2>⚙️ Ustawienia</h2>`;

    html+=this._buildSettingsSectionHtml('💾 Zapisy gry',this._buildSettingsSaveRowsHtml());
    html+=this._buildSettingsSectionHtml('⌨️ Klawisze sterowania',this._buildSettingsKeyRowsHtml());
    html+=this._buildSettingsSectionHtml('🧪 Panel debug',this._buildSettingsDebugHtml());
    
    html+=this._buildSettingsFooterHtml();
    
    panel.innerHTML=html;
  },
  
  _startKeyListen(action){
    // clear old listener highlight
    document.querySelectorAll('.key-btn.listening').forEach(b=>b.classList.remove('listening'));
    const btn=document.getElementById('keybtn-'+action);
    btn.classList.add('listening');
    btn.textContent='...naciśnij klawisz...';
    this._settingsListeningOld=KeyBindings[action];
    this._settingsListening=(newKey)=>{
      KeyBindings[action]=newKey;
      saveKeyBindings(KeyBindings);
      btn.classList.remove('listening');
      btn.textContent=getKeyDisplay(newKey);
      this._refreshTitleDebugKeyHint();
      this._settingsListening=null;
      this._settingsListeningOld=null;
    };
  },
  
  _resetKeys(){
    KeyBindings={...DEFAULT_KEYS};
    saveKeyBindings(KeyBindings);
    this._refreshTitleDebugKeyHint();
    this._renderSettings();
    this._showToast('Przywrócono domyślne klawisze');
  },

  _applyToastStyle(toast,color){
    toast.style.color=color;
    toast.style.borderColor=color;
  },

  _scheduleToastHide(toast){
    clearTimeout(this._toastTimer);
    this._toastTimer=setTimeout(()=>{toast.style.opacity='0';setTimeout(()=>toast.style.display='none',300);},2000);
  },
  
  _showToast(msg,color='#0f0'){
    const toast=document.getElementById('save-toast');
    toast.textContent=msg;toast.style.display='block';toast.style.opacity='1';
    this._applyToastStyle(toast,color);
    this._scheduleToastHide(toast);
  },
  
  // ---- SAVE SYSTEM ----
});
