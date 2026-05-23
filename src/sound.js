'use strict';
// =============================================
// SOUND SYNTHESIZER (Web Audio API)
// =============================================
class SoundFX {
  constructor(){
    try{this.ctx=new(window.AudioContext||window.webkitAudioContext)();this.enabled=true;}
    catch(e){this.enabled=false;}
  }
  _play(freq,type,duration,vol=.15){
    if(!this.enabled)return;
    try{
      const o=this.ctx.createOscillator();const g=this.ctx.createGain();
      o.connect(g);g.connect(this.ctx.destination);
      o.type=type;o.frequency.value=freq;
      g.gain.setValueAtTime(vol,this.ctx.currentTime);
      g.gain.exponentialRampToValueAtTime(.001,this.ctx.currentTime+duration);
      o.start();o.stop(this.ctx.currentTime+duration);
    }catch(e){}
  }
  hit(){this._play(150,'sawtooth',.1,.1);}
  playerHit(){this._play(100,'square',.15,.12);}
  pickup(){this._play(600,'sine',.1,.08);setTimeout(()=>this._play(800,'sine',.1,.08),80);}
  spell(){this._play(400,'sine',.2,.1);this._play(500,'triangle',.15,.08);}
  levelUp(){
    [400,500,600,800].forEach((f,i)=>setTimeout(()=>this._play(f,'sine',.15,.1),i*100));
  }
  death(){this._play(200,'sawtooth',.3,.15);setTimeout(()=>this._play(100,'sawtooth',.5,.15),200);}
  door(){this._play(300,'triangle',.15,.08);}
  stairs(){this._play(500,'sine',.2,.1);setTimeout(()=>this._play(700,'sine',.2,.1),150);}
  boss(){
    [200,150,100,80].forEach((f,i)=>setTimeout(()=>this._play(f,'sawtooth',.3,.12),i*200));
  }
  footstep(){this._play(52+Math.random()*16,'triangle',.04,.018);}
  crit(){this._play(720,'square',.05,.13);setTimeout(()=>this._play(300,'sawtooth',.13,.13),30);}
  heartbeat(){this._play(58,'sine',.16,.2);setTimeout(()=>this._play(48,'sine',.22,.16),170);}
  ui(){this._play(440,'triangle',.05,.05);}
  buy(){this._play(520,'sine',.07,.07);setTimeout(()=>this._play(740,'sine',.1,.07),70);}
  startAmbient(theme){
    if(!this.enabled)return;
    this.stopAmbient();
    try{
      if(this.ctx.state==='suspended')this.ctx.resume();
      const base=(theme&&theme.ambientFreq)||50;
      const vol=(theme&&theme.ambientVol)||.05;
      const g=this.ctx.createGain();g.gain.value=0;g.connect(this.ctx.destination);
      const o1=this.ctx.createOscillator();o1.type='sine';o1.frequency.value=base;
      const o2=this.ctx.createOscillator();o2.type='sine';o2.frequency.value=base*1.5+.4;
      o1.connect(g);o2.connect(g);o1.start();o2.start();
      g.gain.setTargetAtTime(vol,this.ctx.currentTime,2);
      this._ambient={g,o1,o2};
    }catch(e){}
  }
  stopAmbient(){
    if(!this._ambient)return;
    try{
      const {g,o1,o2}=this._ambient;
      g.gain.setTargetAtTime(0,this.ctx.currentTime,.4);
      o1.stop(this.ctx.currentTime+1);o2.stop(this.ctx.currentTime+1);
    }catch(e){}
    this._ambient=null;
  }
}

