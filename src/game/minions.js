'use strict';
// =============================================
// NECROMANCER MINIONS + CLASS SPELLS (2.0)
// =============================================
Object.assign(Game, {
  _makeMinion(x,y,duration){
    const p=this.player;
    return{
      x,y,icon:'💀',color:'#9f8fff',
      atk:Math.floor(4+this.floor*1.1+p.atk*.35),
      maxHp:30,hp:30,
      speed:3.8,duration,
      attackTimer:0,attackCd:.9,
      id:Math.random().toString(36).substr(2,9),
    };
  },

  _castSpellSummon(spell){
    if(!Array.isArray(this.minions))this.minions=[];
    const p=this.player;
    const max=(spell.maxMinions||4)+((p.talents&&p.talents.maxMinions)||0);
    const duration=spell.duration||18;
    let spawned=0;
    for(let i=0;i<(spell.count||2);i++){
      if(this.minions.length>=max){
        let oldest=this.minions[0];
        for(const m of this.minions)if(m.duration<oldest.duration)oldest=m;
        oldest.duration=duration;
        continue;
      }
      const a=Math.random()*Math.PI*2;
      let sx=p.x+Math.cos(a)*1.2,sy=p.y+Math.sin(a)*1.2;
      if(!this.dungeon.isPassable(Math.floor(sx),Math.floor(sy))){sx=p.x;sy=p.y;}
      this.minions.push(this._makeMinion(sx,sy,duration));
      this.particles.magic(sx+.5,sy+.5,'#9f8fff');
      spawned++;
    }
    this._minionsRaised=(this._minionsRaised||0)+spawned;
    this.screenFX.flash('#b9a8ff',.08);
    if(spawned>0)this.log(`${spell.icon} Wskrzeszono ${spawned} sług! (${this.minions.length}/${max})`,'spell');
    else this.log(`${spell.icon} Sługi odnowione (${this.minions.length}/${max})`,'spell');
    Achievements.checkAll(this);
  },

  _castSpellCorpseBurst(spell,index){
    const p=this.player;
    const stains=(this.dungeon&&Array.isArray(this.dungeon.bloodStains))?this.dungeon.bloodStains:[];
    let best=-1,bestD=spell.range||7;
    for(let i=0;i<stains.length;i++){
      const d=Util.dist(p.x,p.y,stains[i].x+.5,stains[i].y+.5);
      if(d<bestD){bestD=d;best=i;}
    }
    if(best===-1){
      this._refundSpellCast(spell);
      this._combatFeedback(`spell_target_${index}`,`${spell.name}: brak szczątków w zasięgu.`);
      return;
    }
    const s=stains.splice(best,1)[0];
    const cx=s.x+.5,cy=s.y+.5;
    const radius=spell.radius||2.6;
    const dmg=Math.max(1,Math.floor((spell.damage||30)+this.floor*1.2+p.atk*.4));
    let hits=0;
    for(const e of this.enemies){
      if(e.hp<=0)continue;
      if(Util.dist(cx,cy,e.x+.5,e.y+.5)>radius)continue;
      this.damageEnemy(e,dmg,'shadow');
      hits++;
    }
    this._corpseBurstsCast=(this._corpseBurstsCast||0)+1;
    this.particles.blood(cx,cy);
    this.particles.burst(cx,cy,26,'#c44a6a',radius*1.3,.5,3.2);
    this.particles.burst(cx,cy,14,'#9f8fff',radius,.4,2.8);
    this.screenFX.shake(6,.25);
    this.screenFX.flash('#c06a8a',.1);
    this.sound.hit();
    Achievements.checkAll(this);
    this.log(`${spell.icon} ${spell.name}! Trafiono: ${hits}`,'spell');
  },

  _castSpellDarkPact(spell,index){
    const p=this.player;
    const hpCost=Math.max(5,Math.floor(p.maxHp*(spell.hpCostPct||.15)));
    if(p.hp<=hpCost){
      this._refundSpellCast(spell);
      this._combatFeedback(`spell_target_${index}`,`${spell.name}: za mało HP na pakt.`);
      return;
    }
    p.hp-=hpCost;
    const gained=Math.min(spell.manaGain||45,p.maxMp-p.mp);
    p.mp+=gained;
    if(!Array.isArray(this.minions))this.minions=[];
    for(const m of this.minions){
      m.atk+=spell.minionAtkBonus||5;
      m.hp=Math.min(m.maxHp,m.hp+(spell.minionHeal||20));
      m.duration+=4;
      this.particles.magic(m.x+.5,m.y+.5,'#d0b8ff');
    }
    this._darkPactsCast=(this._darkPactsCast||0)+1;
    this.particles.burst(p.x+.5,p.y+.5,18,'#7a4a9f',2.4,.45,2.8);
    this.screenFX.flash('#8a5aaf',.1);
    this.floatingText.add(p.x+.5,p.y,`-${hpCost} HP / +${gained} MP`,'#c8a0ff');
    Achievements.checkAll(this);
    this.log(`${spell.icon} ${spell.name}: -${hpCost} HP, +${gained} MP${this.minions.length?`, sługi +${spell.minionAtkBonus||5} ATK`:''}`,'spell');
  },

  _specialAttackNecromancer(){
    const p=this.player;
    let hits=0;
    for(const e of this.enemies){
      if(e.hp<=0)continue;
      if(Util.dist(p.x,p.y,e.x,e.y)<3){
        this.damageEnemy(e,p.atk+6,'shadow');
        hits++;
      }
    }
    if(hits>0){
      const heal=hits*3;
      p.hp=Math.min(p.maxHp,p.hp+heal);
      this.floatingText.add(p.x+.5,p.y,`+${heal} HP`,'#c8a0ff');
      this.log(`🌑 Pulsacja Dusz trafia ${hits} wrogów!`,'spell');
    }else{
      this._combatFeedback('special_necro_miss','🌑 Brak dusz w zasięgu pulsacji.');
    }
    this.particles.burst(p.x+.5,p.y+.5,24,'#9f8fff',3.2,.5,3);
    this.screenFX.flash('#b9a8ff',.08);
  },

  _findMinionTarget(m){
    let nearest=null,minD=9;
    for(const e of this.enemies){
      if(e.hp<=0)continue;
      const d=Util.dist(m.x,m.y,e.x,e.y);
      if(d<minD){minD=d;nearest=e;}
    }
    return nearest;
  },

  _minionAttack(m,target){
    const hpBefore=target.hp;
    const dmg=Math.max(1,m.atk+Util.rand(-1,2));
    this.damageEnemy(target,dmg,'shadow');
    m.attackTimer=m.attackCd;
    if(hpBefore>0&&target.hp<=0){
      this._minionKills=(this._minionKills||0)+1;
      Achievements.checkAll(this);
    }
  },

  _expireMinion(i){
    const m=this.minions[i];
    this.particles.burst(m.x+.5,m.y+.5,10,'#9f8fff',1.8,.4,2.4);
    this.minions.splice(i,1);
  },

  updateMinions(dt){
    if(!Array.isArray(this.minions)||this.minions.length===0)return;
    const p=this.player;
    for(let i=this.minions.length-1;i>=0;i--){
      const m=this.minions[i];
      m.duration-=dt;
      if(m.duration<=0||m.hp<=0){this._expireMinion(i);continue;}
      if(m.attackTimer>0)m.attackTimer-=dt;
      const target=this._findMinionTarget(m);
      if(target){
        const d=Util.dist(m.x,m.y,target.x,target.y);
        if(d<1.2){
          if(m.attackTimer<=0)this._minionAttack(m,target);
        }else{
          this._moveToward(m,target.x,target.y,dt);
        }
      }else{
        // no target nearby: heel to the player
        const dp=Util.dist(m.x,m.y,p.x,p.y);
        if(dp>1.6)this._moveToward(m,p.x,p.y,dt);
        if(dp>14){m.x=p.x;m.y=p.y;} // never lose stragglers
      }
    }
  },

  _renderMinions(ctx,cx,cy){
    if(!Array.isArray(this.minions))return;
    for(const m of this.minions){
      const mx=Math.floor(m.x),my=Math.floor(m.y);
      if(!this.dungeon.visible[my]?.[mx])continue;
      const sx=m.x*TILE_SIZE-cx,sy=m.y*TILE_SIZE-cy;
      const mcx=sx+TILE_SIZE/2,mcy=sy+TILE_SIZE/2;
      const fade=m.duration<3?Math.max(.25,m.duration/3):1;
      ctx.globalAlpha=.3*fade;ctx.fillStyle='#000';
      ctx.beginPath();ctx.ellipse(mcx,sy+TILE_SIZE-2,TILE_SIZE*.22,3.5,0,0,Math.PI*2);ctx.fill();
      ctx.globalAlpha=.12*fade;ctx.fillStyle=m.color;
      ctx.beginPath();ctx.arc(mcx,mcy,TILE_SIZE*.38,0,Math.PI*2);ctx.fill();
      ctx.globalAlpha=fade;
      const bob=Math.sin(this.animTime*4+m.x*2)*1.5;
      ctx.font='15px serif';ctx.textAlign='center';
      ctx.fillText(m.icon,mcx,sy+TILE_SIZE*.62+bob);
      ctx.globalAlpha=1;
    }
  },
});
