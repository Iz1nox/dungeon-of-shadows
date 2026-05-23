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
}

