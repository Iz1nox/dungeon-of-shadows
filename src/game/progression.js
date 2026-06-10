'use strict';
Object.assign(Game, {
  grantXP(amount){
    const p=this.player;
    p.xp+=amount;
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
      this.showLevelUp();
      this.sound.levelUp();
      Achievements.checkAll(this);
    }
  },

  _buildLevelUpBaseChoices(){
    const p=this.player;
    return[
      {label:'❤️ +25 Max HP',action:()=>{p.maxHp+=25;p.hp+=25;}},
      {label:'💙 +20 Max MP',action:()=>{p.maxMp+=20;p.mp+=20;}},
      {label:'⚔️ +3 Atak',action:()=>{p.atk+=3;}},
      {label:'🛡️ +2 Obrona',action:()=>{p.def+=2;}},
      {label:'💨 +0.5 Szybkość',action:()=>{p.speed+=.5;}},
      {label:'🎯 +5% Krytyk',action:()=>{p.critChance+=.05;}},
    ];
  },

  _buildLevelUpClassTalentChoices(){
    const p=this.player;
    const talentChoices=[];
    if(p.class==='warrior'){
      talentChoices.push({label:'🩸 Kradzież Życia +5%',desc:'Leczysz się za % obrażeń',action:()=>{p.talents.lifeSteal+=.05;}});
      talentChoices.push({label:'🔥 Ciernie +3',desc:'Wrogowie otrzymują obrażenia atakując cię',action:()=>{p.talents.thorns+=3;}});
      if(p.level>=3)talentChoices.push({label:'💪 Mistrz Broni +8 ATK',desc:'Ogromny bonus do ataku',action:()=>{p.atk+=8;}});
      if(p.level>=5)talentChoices.push({label:'❤️‍🔥 Berserker +50 HP +5 ATK',desc:'Siła i wytrzymałość',action:()=>{p.maxHp+=50;p.hp+=50;p.atk+=5;}});
    }
    if(p.class==='mage'){
      talentChoices.push({label:'🔮 Tarcza Many +10%',desc:'Mana absorbuje część obrażeń',action:()=>{p.talents.manaShield+=.1;}});
      talentChoices.push({label:'✨ Moc Zaklęć +10%',desc:'Zaklęcia zadają więcej obrażeń',action:()=>{p.talents.spellPower+=.1;}});
      if(p.level>=3)talentChoices.push({label:'💙 Fontanna Many +40 MP',desc:'Ogromny zasób many',action:()=>{p.maxMp+=40;p.mp+=40;}});
      if(p.level>=5)talentChoices.push({label:'⚡ Arcymag +30 MP +15% Moc',desc:'Potęga magii',action:()=>{p.maxMp+=30;p.mp+=30;p.talents.spellPower+=.15;}});
    }
    if(p.class==='rogue'){
      talentChoices.push({label:'💨 Unik +8%',desc:'Szansa na uniknięcie ataku',action:()=>{p.talents.dodge+=.08;}});
      talentChoices.push({label:'🎯 Obrażenia Kryt. +25%',desc:'Trafienia krytyczne mocniejsze',action:()=>{p.talents.critDmg+=.25;p.critMult+=.25;}});
      if(p.level>=3)talentChoices.push({label:'💰 Łowca Złota +30%',desc:'Więcej złota ze skrzyń i wrogów',action:()=>{p.talents.goldFind+=.3;}});
      if(p.level>=5)talentChoices.push({label:'🗡️ Zabójca +10 ATK +15% Kryt',desc:'Mistrz skrytobójstwa',action:()=>{p.atk+=10;p.critChance+=.15;}});
    }
    if(p.class==='necromancer'){
      talentChoices.push({label:'✨ Moc Zaklęć +10%',desc:'Zaklęcia i sługi zadają więcej obrażeń',action:()=>{p.talents.spellPower+=.1;}});
      talentChoices.push({label:'🔮 Tarcza Many +10%',desc:'Mana absorbuje część obrażeń',action:()=>{p.talents.manaShield+=.1;}});
      if(p.level>=3)talentChoices.push({label:'💀 Władca Śmierci +1 sługa',desc:'Wyższy limit wskrzeszonych sług',action:()=>{p.talents.maxMinions=(p.talents.maxMinions||0)+1;}});
      if(p.level>=5)talentChoices.push({label:'🕯️ Arcylisz +30 MP +15% Moc',desc:'Potęga nekromancji',action:()=>{p.maxMp+=30;p.mp+=30;p.talents.spellPower+=.15;}});
    }
    return talentChoices;
  },

  _appendLevelUpRegenChoices(talentChoices){
    const p=this.player;
    talentChoices.push({label:'💚 Regeneracja HP',desc:'+1 HP/s pasywnie',action:()=>{p.talents.regenHp+=1;}});
    talentChoices.push({label:'💧 Regeneracja MP',desc:'+1 MP/s pasywnie',action:()=>{p.talents.regenMp+=1;}});
  },

  _pickLevelUpChoices(baseChoices,talentChoices){
    const selectedBase=Util.shuffle([...baseChoices]).slice(0,2);
    const selectedTalent=Util.shuffle([...talentChoices]).slice(0,Math.min(2,talentChoices.length));
    return [...selectedBase,...selectedTalent];
  },
  
  showLevelUp(){
    const p=this.player;
    if(!p.talents)p.talents={lifeSteal:0,manaShield:0,dodge:0,thorns:0,critDmg:0,spellPower:0,goldFind:0,regenHp:0,regenMp:0};
    this.paused=true;
    const screen=document.getElementById('level-up-screen');
    screen.style.display='block';
    document.getElementById('level-up-info').innerHTML=
      `<span style="color:#4af;font-size:20px">${p.className} Poziom ${p.level}</span>`;

    const baseChoices=this._buildLevelUpBaseChoices();
    const talentChoices=this._buildLevelUpClassTalentChoices();
    this._appendLevelUpRegenChoices(talentChoices);
    const allChoices=this._pickLevelUpChoices(baseChoices,talentChoices);
    
    const container=document.getElementById('level-up-choices');
    this._renderChoiceButtons(container,allChoices,(choice)=>{
      choice.action();this.paused=false;screen.style.display='none';
        p.hp=p.maxHp;p.mp=p.maxMp;
        this.particles.magic(p.x+.5,p.y+.5,'#4af');
        this.log(`⬆️ Awans na poziom ${p.level}!`,'info');
    });
  },
  
  // ---- INVENTORY UI ----
});
