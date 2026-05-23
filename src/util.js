'use strict';
// =============================================
// UTILITY
// =============================================
const Util = {
  rand(a,b){return Math.floor(Math.random()*(b-a+1))+a},
  randF(a,b){return Math.random()*(b-a)+a},
  pick(arr){return arr[Math.floor(Math.random()*arr.length)]},
  dist(x1,y1,x2,y2){return Math.hypot(x2-x1,y2-y1)},
  lerp(a,b,t){return a+(b-a)*t},
  clamp(v,mn,mx){return Math.max(mn,Math.min(mx,v))},
  angle(x1,y1,x2,y2){return Math.atan2(y2-y1,x2-x1)},
  hsl(h,s,l){return `hsl(${h},${s}%,${l}%)`},
  rgba(r,g,b,a){return `rgba(${r},${g},${b},${a})`},
  chance(p){return Math.random()<p},
  shuffle(arr){for(let i=arr.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[arr[i],arr[j]]=[arr[j],arr[i]]}return arr}
};

