'use strict';
Object.assign(Game, {
  castSpell(index){
    const p=this.player;
    if(index<0||index>=p.spells.length)return;
    const spell=p.spells[index];
    if(!this._canCastSpell(p,spell,index))return;
    
    p.mp-=spell.mpCost;
    spell.cdTimer=spell.cd;
    this._spellsCast=(this._spellsCast||0)+1;
    this.sound.spell();

    const handler=this._resolveSpellCastHandler(spell,index);
    if(handler)handler();
    this._triggerMirrorEchoOnSpellCast(spell);
    this._triggerObeliskEchoOnSpellCast(spell);
  },

  // a cast that fizzled (no target / no direction / blocked) costs nothing
  _refundSpellCast(spell){
    const p=this.player;
    p.mp=Math.min(p.maxMp,p.mp+(spell.mpCost||0));
    spell.cdTimer=0;
    this._spellsCast=Math.max(0,(this._spellsCast||0)-1);
  },

  _canCastSpell(player,spell,index){
    if(spell.cdTimer>0){
      this._combatFeedback(`spell_cd_${index}`,`${spell.name} jeszcze na cooldownie (${spell.cdTimer.toFixed(1)}s)`);
      return false;
    }
    if(player.mp<spell.mpCost){
      this._combatFeedback(`spell_mp_${index}`,`Za mało many na ${spell.name} (brakuje ${Math.ceil(spell.mpCost-player.mp)})`);
      return false;
    }
    return true;
  },

  _resolveSpellCastHandler(spell,index){
    const handlers={
      buff:()=>this._castSpellBuff(spell),
      aoe:()=>this._castSpellAoe(spell),
      heal:()=>this._castSpellHeal(spell),
      projectile:()=>this._castSpellProjectile(spell),
      chain:()=>this._castSpellChain(spell),
      rift_burst:()=>this._castSpellRiftBurst(spell),
      rift_guard:()=>this._castSpellRiftGuard(spell,index),
      obelisk_lance:()=>this._castSpellObeliskLance(spell,index),
      obelisk_crash:()=>this._castSpellObeliskCrash(spell,index),
      earthsplitter:()=>this._castSpellEarthsplitter(spell,index),
      teleport:()=>this._castSpellTeleport(spell,index),
      dash:()=>this._castSpellDash(spell),
      dot:()=>this._castSpellDot(spell),
      rift_blades:()=>this._castSpellRiftBlades(spell,index),
      stealth:()=>this._castSpellStealth(spell),
      multi_proj:()=>this._castSpellMultiProj(spell),
      obelisk_fan:()=>this._castSpellObeliskFan(spell,index),
      drain:()=>this._castSpellDrain(spell,index),
      voidstep:()=>this._castSpellVoidstep(spell,index),
      backstab:()=>this._castSpellBackstab(spell,index),
      beam:()=>this._castSpellBeam(spell,index),
      shadowstep:()=>this._castSpellShadowstep(spell,index),
      summon:()=>this._castSpellSummon(spell),
      corpse_burst:()=>this._castSpellCorpseBurst(spell,index),
      dark_pact:()=>this._castSpellDarkPact(spell,index)
    };
    return handlers[spell.type]||null;
  },

  _findNearestEnemyInRange(range){
    const p=this.player;
    let nearest=null,minD=Infinity;
    for(const e of this.enemies){
      const d=Util.dist(p.x,p.y,e.x,e.y);
      if(d<range&&d<minD){minD=d;nearest=e;}
    }
    return nearest;
  },

  _castSpellBuff(spell){
    const p=this.player;
    p.rageTimer=spell.duration;
    this._rageCasts=(this._rageCasts||0)+1;
    Achievements.checkAll(this);
    this.log(`${spell.icon} ${spell.name} aktywowany!`,'spell');
    this.particles.burst(p.x+.5,p.y+.5,15,'#f44',2,.8,3);
    this.screenFX.flash('#ff6a6a',.09);
    this.floatingText.add(p.x+.5,p.y-.7,'RAGE!','#ff6666',.6);
  },

  _castSpellAoe(spell){
    const p=this.player;
    const range=spell.range||2;
    let hits=0;
    for(const e of this.enemies){
      if(Util.dist(p.x,p.y,e.x,e.y)<range+1){
        let dmg=spell.damage+Math.floor(p.atk*.5);
        this.damageEnemy(e,dmg,spell.element||'');
        if(spell.name.includes('Tarcz'))e.stunTimer=2;
        hits++;
      }
    }
    this._shieldAoeCasts=(this._shieldAoeCasts||0)+1;
    if(hits>0)this._shieldAoeHits=(this._shieldAoeHits||0)+hits;
    const col=spell.element==='ice'?'#8af':spell.element==='fire'?'#f80':'#ff0';
    this.particles.burst(p.x+.5,p.y+.5,25,col,range*1.5,.6,3);
    this.screenFX.flash(spell.element==='ice'?'#aee3ff':spell.element==='fire'?'#ffb06a':'#ffe27a',.1);
    this.screenFX.shake(6,.3);
    Achievements.checkAll(this);
    this.log(`${spell.icon} ${spell.name}! Trafiono: ${hits}`,'spell');
  },

  _castSpellHeal(spell){
    const p=this.player;
    p.hp=Math.min(p.maxHp,p.hp+spell.value);
    this.particles.heal(p.x+.5,p.y+.5);
    this.particles.burst(p.x+.5,p.y+.5,10,'#8fff8f',1.8,.35,2.5);
    this.screenFX.flash('#7dff7d',.08);
    this.floatingText.add(p.x+.5,p.y,`+${spell.value} HP`,'#0f0');
    this.log(`${spell.icon} Wyleczono ${spell.value} HP`,'heal');
  },

  _castSpellProjectile(spell){
    const p=this.player;
    const dmg=spell.damage+Math.floor(p.atk*.8);
    const color=spell.element==='fire'?'#f80':spell.element==='ice'?'#8af':spell.element==='shadow'?'#a875ff':'#88f';
    if(spell.element==='fire')this._fireballCasts=(this._fireballCasts||0)+1;
    this.projectiles.push(new Projectile(p.x+.5,p.y+.5,this.mouseWorldX,this.mouseWorldY,7,dmg,color,true,spell.element,false,spell.element==='fire'?'fireball':''));
    this.particles.burst(p.x+.5,p.y+.5,12,color,2.2,.35,2.4);
    this.screenFX.flash(spell.element==='fire'?'#ffad66':spell.element==='ice'?'#aee3ff':'#95a5ff',.06);
    Achievements.checkAll(this);
    this.log(`${spell.icon} ${spell.name}!`,'spell');
  },

  _getChainSpellTargets(maxRange=9){
    const p=this.player;
    return this.enemies
      .filter(e=>e.hp>0&&Util.dist(p.x,p.y,e.x,e.y)<maxRange)
      .sort((a,b)=>Util.dist(p.x,p.y,a.x,a.y)-Util.dist(p.x,p.y,b.x,b.y));
  },

  _castChainSpellNoTarget(spell){
    const p=this.player;
    this._refundSpellCast(spell);
    this.particles.lightning(p.x+.5,p.y+.5,this.mouseWorldX,this.mouseWorldY);
    this.screenFX.flash('#9fd8ff',.08);
    this.log(`⚡ ${spell.name}: brak celu w zasięgu`,'info');
  },

  _executeChainSpellHits(spell,targets){
    const p=this.player;
    let prev={x:p.x+.5,y:p.y+.5};
    let hits=0;
    for(let i=0;i<(spell.bounces||3)&&i<targets.length;i++){
      const t=targets[i];
      this.damageEnemy(t,spell.damage+p.atk*.5);
      this.particles.lightning(prev.x,prev.y,t.x+.5,t.y+.5);
      this.floatingText.add(t.x+.5,t.y-.5,'⚡','#9fd8ff',.45);
      t.stunTimer=.5;
      prev={x:t.x+.5,y:t.y+.5};
      hits++;
    }
    return hits;
  },

  _castSpellChain(spell){
    const targets=this._getChainSpellTargets(9);
    if(targets.length===0){
      this._castChainSpellNoTarget(spell);
      return;
    }
    this._chainCasts=(this._chainCasts||0)+1;
    const hits=this._executeChainSpellHits(spell,targets);
    if(hits>0)this._chainHits=(this._chainHits||0)+hits;
    Achievements.checkAll(this);
    this.screenFX.flash('#8fc7ff',.11);
    this.screenFX.shake(3,.18);
    this.log(`${spell.icon} ${spell.name}! Trafiono: ${hits}`,'spell');
  },

  _castSpellRiftBurst(spell){
    const p=this.player;
    const ox=p.x+.5,oy=p.y+.5;
    const bolts=Math.max(4,Math.floor(spell.count||8));
    const range=spell.range||4.5;
    const hitRange=range+1;
    const dmg=Math.max(1,Math.floor((spell.damage||16)+p.atk*.45));

    for(let i=0;i<bolts;i++){
      const a=Math.PI*2*(i/bolts);
      this.projectiles.push(new Projectile(ox,oy,ox+Math.cos(a)*7,oy+Math.sin(a)*7,5,dmg,'#a98bff',true,'arcane'));
    }

    let hits=0;
    for(const e of this.enemies){
      if(e.hp<=0)continue;
      if(Util.dist(p.x,p.y,e.x,e.y)<=hitRange){
        this.damageEnemy(e,Math.floor(dmg*.6),'arcane');
        this.floatingText.add(e.x+.5,e.y-.35,'🜔','#c8b3ff',.38);
        hits++;
      }
    }

    this._riftBurstsCast=(this._riftBurstsCast||0)+1;
    if(hits>0)this._riftBurstHits=(this._riftBurstHits||0)+hits;

    this.particles.burst(ox,oy,22,'#9b7cff',range*.7,.42,3);
    this.particles.magic(ox,oy,'#c7b2ff');
    this.screenFX.flash('#bba0ff',.1);
    this.screenFX.shake(4,.18);
    Achievements.checkAll(this);
    this.log(`${spell.icon} ${spell.name}! Trafiono: ${hits}`,'spell');
  },

  _castSpellObeliskLance(spell,index){
    const p=this.player;
    const ox=p.x+.5,oy=p.y+.5;
    const mx=this.mouseWorldX,my=this.mouseWorldY;
    const dirLen=Util.dist(ox,oy,mx,my);
    if(dirLen<.01){
      this._refundSpellCast(spell);
      this._combatFeedback(`spell_target_${index}`,`${spell.name}: wskaż kierunek.`);
      return;
    }

    const range=spell.range||8;
    const width=spell.width||.65;
    const nx=(mx-ox)/dirLen;
    const ny=(my-oy)/dirLen;
    const endX=ox+nx*range;
    const endY=oy+ny*range;

    const baseDamage=Math.max(1,Math.floor((spell.damage||24)+p.atk*.6));
    let hits=0;
    for(const e of this.enemies){
      if(e.hp<=0)continue;
      const ex=e.x+.5,ey=e.y+.5;
      const vx=ex-ox,vy=ey-oy;
      const t=vx*nx+vy*ny;
      if(t<0||t>range)continue;
      const cx=ox+nx*t;
      const cy=oy+ny*t;
      if(Util.dist(ex,ey,cx,cy)>width)continue;
      this.damageEnemy(e,baseDamage,'arcane');
      e.stunTimer=Math.max(e.stunTimer||0,.3);
      this.floatingText.add(ex,ey-.4,'🗿','#9cb6ff',.4);
      hits++;
    }

    this._obeliskLancesCast=(this._obeliskLancesCast||0)+1;
    if(hits>0)this._obeliskLanceHits=(this._obeliskLanceHits||0)+hits;

    this.projectiles.push(new Projectile(ox,oy,endX,endY,0,0,'#8da9ff',true,'arcane'));
    this.particles.lightning(ox,oy,endX,endY);
    this.particles.burst(ox,oy,16,'#8da9ff',2.1,.3,2.6);
    this.particles.burst(endX,endY,12,'#6f93ff',1.7,.22,2.1);
    this.screenFX.flash('#9eb4ff',.09);
    this.screenFX.shake(4,.2);
    Achievements.checkAll(this);
    this.log(`${spell.icon} ${spell.name}! Trafiono: ${hits}`,'spell');
  },

  _castSpellEarthsplitter(spell,index){
    const p=this.player;
    const ox=p.x+.5,oy=p.y+.5;
    const mx=this.mouseWorldX,my=this.mouseWorldY;
    const dirLen=Util.dist(ox,oy,mx,my);
    if(dirLen<.01){
      this._refundSpellCast(spell);
      this._combatFeedback(`spell_target_${index}`,`${spell.name}: wskaż kierunek.`);
      return;
    }

    const range=spell.range||6.5;
    const width=spell.width||1.0;
    const nx=(mx-ox)/dirLen;
    const ny=(my-oy)/dirLen;
    const endX=ox+nx*range;
    const endY=oy+ny*range;

    let hits=0;
    const baseDamage=Math.max(1,Math.floor((spell.damage||22)+p.atk*.7));
    for(const e of this.enemies){
      if(e.hp<=0)continue;
      const ex=e.x+.5,ey=e.y+.5;
      const vx=ex-ox,vy=ey-oy;
      const t=vx*nx+vy*ny;
      if(t<0||t>range)continue;
      const cx=ox+nx*t;
      const cy=oy+ny*t;
      if(Util.dist(ex,ey,cx,cy)>width)continue;
      this.damageEnemy(e,baseDamage);
      e.stunTimer=Math.max(e.stunTimer||0,.45);
      this.floatingText.add(ex,ey-.4,'🪨','#d2b48c',.42);
      hits++;
    }

    this._earthsplittersCast=(this._earthsplittersCast||0)+1;
    if(hits>0)this._earthsplitterHits=(this._earthsplitterHits||0)+hits;

    this.particles.lightning(ox,oy,endX,endY);
    this.particles.burst(ox,oy,16,'#caa77a',2.2,.3,2.8);
    this.particles.burst(endX,endY,12,'#b48a5f',1.8,.24,2.2);
    this.screenFX.shake(5,.22);
    this.screenFX.flash('#d8b88f',.08);
    Achievements.checkAll(this);
    this.log(`${spell.icon} ${spell.name}! Trafiono: ${hits}`,'spell');
  },

  _castSpellRiftGuard(spell,index){
    const p=this.player;
    const radius=spell.range||2.8;
    const pulseDamage=Math.max(1,Math.floor((spell.damage||20)+p.def*.55+p.atk*.25));
    let hits=0;

    for(const e of this.enemies){
      if(e.hp<=0)continue;
      if(Util.dist(p.x,p.y,e.x,e.y)>radius)continue;
      this.damageEnemy(e,pulseDamage,'arcane');
      e.stunTimer=Math.max(e.stunTimer||0,.35);
      this.floatingText.add(e.x+.5,e.y-.4,'🜔','#b794ff',.42);
      hits++;
    }

    const healPerHit=spell.healPerHit||6;
    const healed=Math.min(p.maxHp-p.hp,hits*healPerHit);
    if(healed>0){
      p.hp+=healed;
      this.floatingText.add(p.x+.5,p.y,`+${healed} HP`,'#8fff8f',.5);
      this.particles.heal(p.x+.5,p.y+.5);
    }

    this._riftGuardsCast=(this._riftGuardsCast||0)+1;
    if(hits>0)this._riftGuardHits=(this._riftGuardHits||0)+hits;

    this.particles.burst(p.x+.5,p.y+.5,18,'#b794ff',2.5,.33,2.9);
    this.screenFX.flash('#cbb0ff',.08);
    this.screenFX.shake(4,.18);
    Achievements.checkAll(this);
    this.log(`${spell.icon} ${spell.name}! Trafiono: ${hits}${healed>0?` | +${healed} HP`:''}`,'spell');
  },

  _castSpellRiftBlades(spell,index){
    const p=this.player;
    const range=spell.range||6;
    const maxTargets=Math.max(1,Math.floor(spell.targets||4));
    const targets=this._getChainSpellTargets(range).slice(0,maxTargets);
    if(targets.length===0){
      this._refundSpellCast(spell);
      this._combatFeedback(`spell_target_${index}`,`${spell.name}: brak celu w zasięgu.`);
      return;
    }

    const damage=Math.max(1,Math.floor((spell.damage||18)+p.atk*.55));
    let hits=0;
    let prev={x:p.x+.5,y:p.y+.5};
    for(const target of targets){
      this.damageEnemy(target,damage,'arcane');
      this.particles.lightning(prev.x,prev.y,target.x+.5,target.y+.5,'#c19bff');
      this.floatingText.add(target.x+.5,target.y-.45,'🜔','#c19bff',.4);
      prev={x:target.x+.5,y:target.y+.5};
      hits++;
    }

    if(hits>0)p.stealthTimer=Math.max(p.stealthTimer||0,spell.stealth||1);
    this._riftBladesCast=(this._riftBladesCast||0)+1;
    if(hits>0)this._riftBladeHits=(this._riftBladeHits||0)+hits;

    this.particles.burst(p.x+.5,p.y+.5,14,'#c19bff',2.2,.28,2.5);
    this.screenFX.flash('#d6bbff',.08);
    this.screenFX.shake(3,.14);
    Achievements.checkAll(this);
    this.log(`${spell.icon} ${spell.name}! Trafiono: ${hits}`,'spell');
  },

  _castSpellTeleport(spell,index){
    const p=this.player;
    const dist=Util.dist(p.x,p.y,this.mouseWorldX,this.mouseWorldY);
    if(dist>spell.range){
      this._refundSpellCast(spell);
      this._combatFeedback(`spell_range_${index}`,`${spell.name}: cel poza zasięgiem.`);
      return;
    }
    const tx=Math.floor(this.mouseWorldX),ty=Math.floor(this.mouseWorldY);
    if(this.dungeon.isPassable(tx,ty)){
      const oldX=p.x+.5,oldY=p.y+.5;
      this.particles.magic(p.x+.5,p.y+.5,'#a0f');
      p.x=tx;p.y=ty;
      const travel=Util.dist(oldX,oldY,p.x+.5,p.y+.5);
      this._teleportsCast=(this._teleportsCast||0)+1;
      this._teleportDistance=(this._teleportDistance||0)+travel;
      this.particles.magic(p.x+.5,p.y+.5,'#a0f');
      this.particles.lightning(oldX,oldY,p.x+.5,p.y+.5);
      this.screenFX.flash('#d18cff',.09);
      Achievements.checkAll(this);
      this.log(`${spell.icon} Teleportacja!`,'spell');
    }else{
      this._refundSpellCast(spell);
      this._combatFeedback(`spell_block_${index}`,`${spell.name}: nie można teleportować się w to miejsce.`);
    }
  },

  _performDashMovement(spell){
    const p=this.player;
    const sx=p.x+.5,sy=p.y+.5;
    const a=Util.angle(p.x,p.y,this.mouseWorldX,this.mouseWorldY);
    const dashDist=Math.min(spell.range,Util.dist(p.x,p.y,this.mouseWorldX,this.mouseWorldY));
    for(let d=0;d<dashDist;d+=.5){
      const nx=p.x+Math.cos(a)*d;const ny=p.y+Math.sin(a)*d;
      if(!this.dungeon.isPassable(Math.floor(nx),Math.floor(ny)))break;
      p.x=nx;p.y=ny;
    }
    return{sx,sy};
  },

  _resolveDashSpellHits(spell){
    const p=this.player;
    let hits=0;
    for(const e of this.enemies){
      if(Util.dist(p.x,p.y,e.x,e.y)<1.5){
        this.damageEnemy(e,spell.damage+p.atk);
        hits++;
      }
    }
    return hits;
  },

  _castSpellDash(spell){
    const p=this.player;
    const {sx,sy}=this._performDashMovement(spell);
    const hits=this._resolveDashSpellHits(spell);
    this.particles.lightning(sx,sy,p.x+.5,p.y+.5);
    this.particles.burst(p.x+.5,p.y+.5,15,'#ff0',3,.4,3);
    this.screenFX.flash('#ffe27a',.08);
    this.log(`${spell.icon} ${spell.name}! Trafiono: ${hits}`,'spell');
  },

  _castSpellObeliskCrash(spell,index){
    const p=this.player;
    const dist=Util.dist(p.x,p.y,this.mouseWorldX,this.mouseWorldY);
    if(dist>spell.range){
      this._refundSpellCast(spell);
      this._combatFeedback(`spell_range_${index}`,`${spell.name}: cel poza zasięgiem.`);
      return;
    }

    const {sx,sy}=this._performDashMovement(spell);
    const impactRadius=spell.impactRadius||2;
    const impactDamage=Math.max(1,Math.floor((spell.damage||22)+p.atk*.75));
    let hits=0;
    for(const e of this.enemies){
      if(e.hp<=0)continue;
      if(Util.dist(p.x,p.y,e.x,e.y)>impactRadius)continue;
      this.damageEnemy(e,impactDamage,'arcane');
      e.stunTimer=Math.max(e.stunTimer||0,.45);
      this.floatingText.add(e.x+.5,e.y-.4,'🗿','#a4b8ff',.4);
      hits++;
    }

    this._obeliskCrashesCast=(this._obeliskCrashesCast||0)+1;
    if(hits>0)this._obeliskCrashHits=(this._obeliskCrashHits||0)+hits;

    this.particles.lightning(sx,sy,p.x+.5,p.y+.5);
    this.particles.burst(p.x+.5,p.y+.5,18,'#8da9ff',impactRadius*1.3,.34,2.8);
    this.screenFX.flash('#afc0ff',.09);
    this.screenFX.shake(5,.22);
    Achievements.checkAll(this);
    this.log(`${spell.icon} ${spell.name}! Trafiono: ${hits}`,'spell');
  },

  _castSpellDotHit(spell,target){
    target.poisonTimer=spell.duration;
    this.damageEnemy(target,spell.damage,'poison');
    this.particles.burst(target.x+.5,target.y+.5,10,'#0a0',2,.5);
    this.screenFX.flash('#8cff8c',.07);
    this.log(`${spell.icon} ${target.name} zatruty!`,'spell');
  },

  _castSpellDotNoTarget(spell){
    this._refundSpellCast(spell);
    this.particles.burst(this.mouseWorldX,this.mouseWorldY,8,'#5fa',1.5,.25,2);
    this.log(`${spell.icon} Brak celu dla trucizny`,'info');
  },

  _castSpellDot(spell){
    const nearest=this._findNearestEnemyInRange(6);
    if(nearest){
      this._castSpellDotHit(spell,nearest);
    }else{
      this._castSpellDotNoTarget(spell);
    }
  },

  _castSpellStealth(spell){
    const p=this.player;
    p.stealthTimer=spell.duration;
    this._stealthCasts=(this._stealthCasts||0)+1;
    this.particles.burst(p.x+.5,p.y+.5,15,'#888',2,.5,2);
    this.screenFX.flash('#c0c0c0',.06);
    Achievements.checkAll(this);
    this.log(`${spell.icon} Znikasz w cieniu...`,'spell');
  },

  _castSpellMultiProj(spell){
    const p=this.player;
    for(let i=0;i<(spell.count||5);i++){
      const a=Util.angle(p.x,p.y,this.mouseWorldX,this.mouseWorldY)+Util.randF(-.4,.4);
      const tx=p.x+Math.cos(a)*10;const ty=p.y+Math.sin(a)*10;
      this.projectiles.push(new Projectile(p.x+.5,p.y+.5,tx,ty,8,spell.damage+p.atk*.3,'#ccc',true));
    }
    this.particles.burst(p.x+.5,p.y+.5,18,'#ddd',2.8,.35,2.2);
    this.screenFX.flash('#e0e0e0',.06);
    this.log(`${spell.icon} ${spell.name}!`,'spell');
  },

  _castSpellObeliskFan(spell,index){
    const p=this.player;
    const ox=p.x+.5,oy=p.y+.5;
    const mx=this.mouseWorldX,my=this.mouseWorldY;
    const distToMouse=Util.dist(ox,oy,mx,my);
    if(distToMouse<.01){
      this._refundSpellCast(spell);
      this._combatFeedback(`spell_target_${index}`,`${spell.name}: wskaż kierunek.`);
      return;
    }

    const baseAngle=Util.angle(ox,oy,mx,my);
    const count=Math.max(3,Math.floor(spell.count||5));
    const spread=spell.spread||.5;
    const range=spell.range||7;
    const width=spell.width||.75;
    const damage=Math.max(1,Math.floor((spell.damage||16)+p.atk*.45));
    let hits=0;

    for(let i=0;i<count;i++){
      const t=count===1?0:i/(count-1);
      const angle=baseAngle-spread+2*spread*t;
      const endX=ox+Math.cos(angle)*range;
      const endY=oy+Math.sin(angle)*range;
      this.projectiles.push(new Projectile(ox,oy,endX,endY,7,damage,'#9db6ff',true,'arcane'));
      for(const e of this.enemies){
        if(e.hp<=0)continue;
        const ex=e.x+.5,ey=e.y+.5;
        const vx=ex-ox,vy=ey-oy;
        const nx=Math.cos(angle),ny=Math.sin(angle);
        const along=vx*nx+vy*ny;
        if(along<0||along>range)continue;
        const cx=ox+nx*along;
        const cy=oy+ny*along;
        if(Util.dist(ex,ey,cx,cy)>width)continue;
        this.damageEnemy(e,Math.floor(damage*.7),'arcane');
        this.floatingText.add(ex,ey-.35,'🔷','#b8c8ff',.34);
        hits++;
      }
    }

    this._obeliskFansCast=(this._obeliskFansCast||0)+1;
    if(hits>0)this._obeliskFanHits=(this._obeliskFanHits||0)+hits;

    this.particles.burst(ox,oy,16,'#9db6ff',2.3,.3,2.4);
    this.screenFX.flash('#b7c7ff',.08);
    this.screenFX.shake(3,.14);
    Achievements.checkAll(this);
    this.log(`${spell.icon} ${spell.name}! Trafiono: ${hits}`,'spell');
  },

  _castSpellDrainHit(spell,target){
    const p=this.player;
    const dmg=spell.damage+p.atk;
    this.damageEnemy(target,dmg);
    const healed=Math.floor(dmg*.5);
    p.hp=Math.min(p.maxHp,p.hp+healed);
    this.particles.lightning(p.x+.5,p.y+.5,target.x+.5,target.y+.5);
    this.particles.burst(p.x+.5,p.y+.5,8,'#8fff8f',1.8,.28,2.3);
    this.screenFX.flash('#a3ffb0',.07);
    this.floatingText.add(p.x+.5,p.y,`+${healed} HP`,'#0f0');
    this.log(`${spell.icon} Kradniesz ${healed} HP z ${target.name}!`,'spell');
  },

  _castSpellDrainNoTarget(spell,index){
    this._refundSpellCast(spell);
    this._combatFeedback(`spell_target_${index}`,`${spell.name}: brak celu w zasięgu.`);
  },

  _castSpellDrain(spell,index){
    const nearest=this._findNearestEnemyInRange(4);
    if(nearest){
      this._castSpellDrainHit(spell,nearest);
    }else{
      this._castSpellDrainNoTarget(spell,index);
    }
  },

  _castSpellVoidstep(spell,index){
    const p=this.player;
    const target=this._findNearestEnemyInRange(spell.range||6);
    if(!target){
      this._refundSpellCast(spell);
      this._combatFeedback(`spell_target_${index}`,`${spell.name}: brak celu w zasięgu.`);
      return;
    }

    const a=Util.angle(p.x,p.y,target.x,target.y);
    const behindX=Math.floor(target.x+Math.cos(a)*1.2);
    const behindY=Math.floor(target.y+Math.sin(a)*1.2);
    if(!this.dungeon.isPassable(behindX,behindY)){
      this._refundSpellCast(spell);
      this._combatFeedback(`spell_block_${index}`,`${spell.name}: brak miejsca za celem.`);
      return;
    }

    const fromX=p.x+.5,fromY=p.y+.5;
    p.x=behindX;
    p.y=behindY;

    this._voidstepCasts=(this._voidstepCasts||0)+1;

    const baseDamage=Math.max(1,Math.floor((spell.damage||22)+p.atk*1.05));
    this.damageEnemy(target,baseDamage,'arcane');
    let execute=false;
    const executeThreshold=Math.max(0,Math.min(.95,spell.executeHpPct||.35));
    if(target.hp>0&&target.maxHp>0&&target.hp/target.maxHp<=executeThreshold){
      const executeDamage=Math.max(1,Math.floor(spell.executeBonus||18));
      this.damageEnemy(target,executeDamage,'arcane');
      execute=true;
      this._voidstepExecutes=(this._voidstepExecutes||0)+1;
      this.floatingText.add(target.x+.5,target.y-.55,'EXECUTE','#ff8aa0',.58);
    }

    p.stealthTimer=Math.max(p.stealthTimer||0,1.5);

    this.particles.lightning(fromX,fromY,p.x+.5,p.y+.5);
    this.particles.burst(target.x+.5,target.y+.5,14,'#b89cff',2.1,.28,2.3);
    this.particles.magic(p.x+.5,p.y+.5,'#b89cff');
    this.screenFX.flash('#cdb4ff',.08);
    this.screenFX.shake(4,.16);
    Achievements.checkAll(this);
    this.log(`${spell.icon} ${spell.name}!${execute?' Egzekucja!':''}`,'spell');
  },

  _castSpellBackstabHit(spell,target){
    const p=this.player;
    let dmg=spell.damage+p.atk*2;
    if(p.stealthTimer>0)dmg*=2;
    const targetAliveBefore=target.hp>0;
    this._backstabCasts=(this._backstabCasts||0)+1;
    this.damageEnemy(target,dmg);
    if(targetAliveBefore&&target.hp<=0)this._backstabKills=(this._backstabKills||0)+1;
    this.floatingText.add(target.x+.5,target.y-0.5,'💀 BACKSTAB!','#f44',1.5);
    this.screenFX.shake(6,.3);
    this.screenFX.flash('#ff6666',.08);
    this.particles.blood(target.x+.5,target.y+.5);
    Achievements.checkAll(this);
    this.log(`${spell.icon} Cios w plecy ${target.name}! ${dmg} obrażeń!`,'crit');
  },

  _castSpellBackstabNoTarget(spell,index){
    this._refundSpellCast(spell);
    this._combatFeedback(`spell_target_${index}`,`${spell.name}: brak celu w zasięgu.`);
  },

  _castSpellBackstab(spell,index){
    const nearest=this._findNearestEnemyInRange(2);
    if(nearest){
      this._castSpellBackstabHit(spell,nearest);
    }else{
      this._castSpellBackstabNoTarget(spell,index);
    }
  },

  _castSpellBeam(spell,index){
    const p=this.player;
    const ox=p.x+.5,oy=p.y+.5;
    const mx=this.mouseWorldX,my=this.mouseWorldY;
    const distToMouse=Util.dist(ox,oy,mx,my);
    if(distToMouse<.01){
      this._refundSpellCast(spell);
      this._combatFeedback(`spell_target_${index}`,`${spell.name}: wskaż kierunek.`);
      return;
    }

    const range=spell.range||8;
    const width=spell.width||.7;
    const nx=(mx-ox)/distToMouse;
    const ny=(my-oy)/distToMouse;
    const endX=ox+nx*range;
    const endY=oy+ny*range;

    this._beamCasts=(this._beamCasts||0)+1;

    let hits=0;
    const baseDmg=spell.damage+Math.floor(p.atk*.6);
    for(const e of this.enemies){
      if(e.hp<=0)continue;
      const ex=e.x+.5,ey=e.y+.5;
      const vx=ex-ox,vy=ey-oy;
      const t=vx*nx+vy*ny;
      if(t<0||t>range)continue;
      const cx=ox+nx*t;
      const cy=oy+ny*t;
      if(Util.dist(ex,ey,cx,cy)>width)continue;
      this.damageEnemy(e,baseDmg,'arcane');
      this.floatingText.add(ex,ey-.4,'🜄','#c8a0ff',.45);
      hits++;
    }

    this.particles.lightning(ox,oy,endX,endY);
    this.particles.burst(ox,oy,12,'#c8a0ff',2,.25,2.2);
    this.particles.burst(endX,endY,10,'#d7b8ff',1.7,.22,2);
    this.screenFX.flash('#d4b0ff',.08);
    if(hits<=0){
      Achievements.checkAll(this);
      this._combatFeedback(`spell_target_${index}`,`${spell.name}: brak celu na linii promienia.`);
      this.log(`${spell.icon} ${spell.name}: brak trafień`,'info');
      return;
    }
    this._beamImpacts=(this._beamImpacts||0)+hits;
    Achievements.checkAll(this);
    this.screenFX.shake(2,.12);
    this.log(`${spell.icon} ${spell.name}! Trafiono: ${hits}`,'spell');
  },

  _findShadowstepLandingNearTarget(target){
    const offsets=[
      {x:-1,y:0},{x:1,y:0},{x:0,y:-1},{x:0,y:1},
      {x:-1,y:-1},{x:1,y:-1},{x:-1,y:1},{x:1,y:1}
    ];
    for(const off of offsets){
      const tx=Math.floor(target.x+off.x);
      const ty=Math.floor(target.y+off.y);
      if(this.dungeon.isPassable(tx,ty))return {x:tx,y:ty};
    }
    return null;
  },

  _castSpellShadowstep(spell,index){
    const p=this.player;
    const target=this._findNearestEnemyInRange(spell.range||6);
    if(!target){
      this._refundSpellCast(spell);
      this._combatFeedback(`spell_target_${index}`,`${spell.name}: brak celu w zasięgu.`);
      return;
    }
    const landing=this._findShadowstepLandingNearTarget(target);
    if(!landing){
      this._refundSpellCast(spell);
      this._combatFeedback(`spell_block_${index}`,`${spell.name}: brak miejsca przy celu.`);
      return;
    }

    const fromX=p.x+.5,fromY=p.y+.5;
    p.x=landing.x;
    p.y=landing.y;
    this._shadowstepCasts=(this._shadowstepCasts||0)+1;

    let hits=0;
    let totalDamage=0;
    const targetAliveBefore=target.hp>0;
    const strikes=Math.max(1,Math.floor(spell.strikes||3));
    const baseDamage=spell.damage+Math.floor(p.atk*.9);
    for(let i=0;i<strikes;i++){
      if(target.hp<=0)break;
      const strikeDamage=Math.max(1,Math.floor(baseDamage*(1-i*.15)));
      this.damageEnemy(target,strikeDamage);
      totalDamage+=strikeDamage;
      hits++;
      this.floatingText.add(target.x+.5,target.y-.45,'✦','#ff8aa0',.32);
    }

    const heal=Math.max(0,Math.floor(totalDamage*(spell.healPct||.15)));
    if(heal>0){
      p.hp=Math.min(p.maxHp,p.hp+heal);
      this.floatingText.add(p.x+.5,p.y-.6,`+${heal} HP`,'#8fff8f',.5);
    }

    this.particles.lightning(fromX,fromY,p.x+.5,p.y+.5);
    this.particles.burst(p.x+.5,p.y+.5,14,'#ff8aa0',2.2,.3,2.5);
    this.particles.burst(target.x+.5,target.y+.5,12,'#f55',1.8,.28,2.3);
    this.screenFX.flash('#ff9db0',.07);
    this.screenFX.shake(3,.14);

    if(targetAliveBefore&&target.hp<=0)this._shadowstepFinishes=(this._shadowstepFinishes||0)+1;
    this._shadowDances=(this._shadowDances||0)+1;
    Achievements.checkAll(this);
    this.log(`${spell.icon} ${spell.name}! Trafienia: ${hits}`,'spell');
  },
  
  // ---- ITEMS ----
});
