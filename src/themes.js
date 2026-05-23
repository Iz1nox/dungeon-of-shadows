'use strict';
// =============================================
// FLOOR THEMES
// =============================================
const FloorThemes = {
  themes:[
    {name:'Krypta',floors:[1,2],wallHue:20,wallSat:10,floorHue:30,floorSat:5,ambientR:20,ambientG:15,ambientB:30,fog:false,particles:null,ambientFreq:55,ambientVol:.04},
    {name:'Jaskinie',floors:[3,4],wallHue:120,wallSat:8,floorHue:100,floorSat:4,ambientR:10,ambientG:25,ambientB:15,fog:false,particles:'drip',ambientFreq:49,ambientVol:.045},
    {name:'Katakumby',floors:[5,6],wallHue:280,wallSat:12,floorHue:270,floorSat:6,ambientR:20,ambientG:10,ambientB:30,fog:true,particles:'dust',ambientFreq:44,ambientVol:.05},
    {name:'Piekło',floors:[7,8],wallHue:5,wallSat:20,floorHue:10,floorSat:10,ambientR:40,ambientG:10,ambientB:5,fog:false,particles:'ember',ambientFreq:38,ambientVol:.06},
    {name:'Królestwo Cieni',floors:[9,10],wallHue:240,wallSat:15,floorHue:250,floorSat:8,ambientR:10,ambientG:10,ambientB:40,fog:true,particles:'shadow',ambientFreq:33,ambientVol:.06},
  ],
  
  getTheme(floor){
    for(const t of this.themes){
      if(t.floors.includes(floor))return t;
    }
    return this.themes[0];
  }
};

