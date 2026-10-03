'use strict';
Object.assign(Game, {
  grantXP(amount){
    const p=this.player;
    p.xp+=amount;
    let gained=0;
    while(p.xp>=p.xpToLevel){
      p.xp-=p.xpToLevel;
      p.level++;
      this._levelUpsGained=(this._levelUpsGained||0)+1;
      const lateGame=p.level>=PROGRESSION_BALANCE.xpToLevelGrowthLateLevel;
      const growthRaw=lateGame
        ? PROGRESSION_BALANCE.xpToLevelGrowthBase-PROGRESSION_BALANCE.xpToLevelGrowthLateReduction
        : PROGRESSION_BALANCE.xpToLevelGrowthBase;
      const growth=Math.max(PROGRESSION_BALANCE.xpToLevelGrowthMin,growthRaw);
      p.xpToLevel=Math.floor(p.xpToLevel*growth);
      // kilka poziomów naraz = kilka wyborów po kolei (wcześniej drugi ekran
      // nadpisywał pierwszy i jedna nagroda przepadała)
      this._pendingLevelUps=(this._pendingLevelUps||0)+1;
      gained++;
      Achievements.checkAll(this);
    }
    if(!gained)return;
    this.sound.levelUp();
    if(document.getElementById('level-up-screen').style.display!=='block')this.showLevelUp();
  },

  // 2.5: każdy wybór to CardData (ikona osobno) + action; rzadkość = waga nagrody
  _levelUpCard(icon,name,desc,category,rarity,action){
    return {icon,name,desc,category,rarity,action};
  },

  _buildLevelUpBaseChoices(){
    const p=this.player;
    const S=(icon,name,desc,action)=>this._levelUpCard(icon,name,desc,'Statystyka','common',action);
    return[
      S('❤️','+25 Max HP','Więcej zdrowia na resztę biegu',()=>{p.maxHp+=25;p.hp+=25;}),
      S('💙','+20 Max MP','Większy zapas many',()=>{p.maxMp+=20;p.mp+=20;}),
      S('⚔️','+3 Atak','Mocniejszy każdy cios',()=>{p.atk+=3;}),
      S('🛡️','+2 Obrona','Mniej obrażeń od każdego trafienia',()=>{p.def+=2;}),
      S('💨','+0.5 Szybkość','Szybszy ruch po lochu',()=>{p.speed+=.5;}),
      S('🎯','+5% Krytyk','Częstsze trafienia krytyczne',()=>{p.critChance+=.05;}),
    ];
  },

  _buildLevelUpClassTalentChoices(){
    const p=this.player;
    const talentChoices=[];
    // talenty od poziomu 1 i 3 — rzadkie; wielkie talenty od poziomu 5 — epickie
    const T=(icon,name,desc,action)=>talentChoices.push(this._levelUpCard(icon,name,desc,'Talent','rare',action));
    const E=(icon,name,desc,action)=>talentChoices.push(this._levelUpCard(icon,name,desc,'Talent','epic',action));
    if(p.class==='warrior'){
      T('🩸','Kradzież Życia +5%','Leczysz się za % obrażeń',()=>{p.talents.lifeSteal+=.05;});
      T('🔥','Ciernie +3','Wrogowie otrzymują obrażenia atakując cię',()=>{p.talents.thorns+=3;});
      if(p.level>=3)T('💪','Mistrz Broni +8 ATK','Ogromny bonus do ataku',()=>{p.atk+=8;});
      if(p.level>=5)E('❤️‍🔥','Berserker +50 HP +5 ATK','Siła i wytrzymałość',()=>{p.maxHp+=50;p.hp+=50;p.atk+=5;});
    }
    if(p.class==='mage'){
      T('🔮','Tarcza Many +10%','Mana absorbuje część obrażeń',()=>{p.talents.manaShield+=.1;});
      T('✨','Moc Zaklęć +10%','Zaklęcia zadają więcej obrażeń',()=>{p.talents.spellPower+=.1;});
      if(p.level>=3)T('💙','Fontanna Many +40 MP','Ogromny zasób many',()=>{p.maxMp+=40;p.mp+=40;});
      if(p.level>=5)E('⚡','Arcymag +30 MP +15% Moc','Potęga magii',()=>{p.maxMp+=30;p.mp+=30;p.talents.spellPower+=.15;});
    }
    if(p.class==='rogue'){
      T('💨','Unik +8%','Szansa na uniknięcie ataku',()=>{p.talents.dodge+=.08;});
      T('🎯','Obrażenia Kryt. +25%','Trafienia krytyczne mocniejsze',()=>{p.talents.critDmg+=.25;p.critMult+=.25;});
      if(p.level>=3)T('💰','Łowca Złota +30%','Więcej złota ze skrzyń i wrogów',()=>{p.talents.goldFind+=.3;});
      if(p.level>=5)E('🗡️','Zabójca +10 ATK +15% Kryt','Mistrz skrytobójstwa',()=>{p.atk+=10;p.critChance+=.15;});
    }
    if(p.class==='necromancer'){
      T('✨','Moc Zaklęć +10%','Zaklęcia i sługi zadają więcej obrażeń',()=>{p.talents.spellPower+=.1;});
      T('🔮','Tarcza Many +10%','Mana absorbuje część obrażeń',()=>{p.talents.manaShield+=.1;});
      if(p.level>=3)T('💀','Władca Śmierci +1 sługa','Wyższy limit wskrzeszonych sług',()=>{p.talents.maxMinions=(p.talents.maxMinions||0)+1;});
      if(p.level>=5)E('🕯️','Arcylisz +30 MP +15% Moc','Potęga nekromancji',()=>{p.maxMp+=30;p.mp+=30;p.talents.spellPower+=.15;});
    }
    return talentChoices;
  },

  _appendLevelUpRegenChoices(talentChoices){
    const p=this.player;
    talentChoices.push(this._levelUpCard('💚','Regeneracja HP','+1 HP/s pasywnie','Talent','common',()=>{p.talents.regenHp+=1;}));
    talentChoices.push(this._levelUpCard('💧','Regeneracja MP','+1 MP/s pasywnie','Talent','common',()=>{p.talents.regenMp+=1;}));
  },

  _pickLevelUpChoices(baseChoices,talentChoices){
    const selectedBase=Util.shuffle([...baseChoices]).slice(0,2);
    const selectedTalent=Util.shuffle([...talentChoices]).slice(0,Math.min(2,talentChoices.length));
    return [...selectedBase,...selectedTalent];
  },

  showLevelUp(){
    const p=this.player;
    if(!p.talents)p.talents={lifeSteal:0,manaShield:0,dodge:0,thorns:0,critDmg:0,spellPower:0,goldFind:0,regenHp:0,regenMp:0};
    if(!(this._pendingLevelUps>0))this._pendingLevelUps=1;
    this.paused=true;
    // poziom, za który teraz wybieramy nagrodę (przy kolejce — kolejne po sobie)
    const shownLevel=p.level-this._pendingLevelUps+1;
    let subtitle=`${p.className} · Poziom ${shownLevel}`;
    if(this._pendingLevelUps>1)subtitle+=` · jeszcze ${this._pendingLevelUps-1} do wyboru`;

    const baseChoices=this._buildLevelUpBaseChoices();
    const talentChoices=this._buildLevelUpClassTalentChoices();
    this._appendLevelUpRegenChoices(talentChoices);
    const allChoices=this._pickLevelUpChoices(baseChoices,talentChoices);

    GrimoireUI.openChoice({title:'Awans',subtitle,cards:allChoices,onPick:i=>{
      const choice=allChoices[i];
      if(!choice)return;
      choice.action();
      this._pendingLevelUps=Math.max(0,(this._pendingLevelUps||1)-1);
      p.hp=p.maxHp;p.mp=p.maxMp;
      this.particles.magic(p.x+.5,p.y+.5,'#4af');
      this.log(`⬆️ Awans na poziom ${shownLevel}!`,'info');
      this._closeChoiceScreen();
    }});
  },

  // ---- INVENTORY UI ----
});
