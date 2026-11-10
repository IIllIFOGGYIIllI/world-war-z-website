/* WWZ Armband Calibration Lab — experimental static export. No Nitrado write API.
   Validate coordinate system, item orientation and persistence in local DayZ first. */
(function(root) {
  'use strict';
  const CLASSES=Object.freeze({
    K:'Armband_Black',W:'Armband_White',R:'Armband_Red',
    G:'Armband_Green',B:'Armband_Blue',O:'Armband_Orange',
    Y:'Armband_Yellow',P:'Armband_Pink'
  });
  const COLOURS=Object.freeze({
    K:'#17191e',W:'#e7e8ea',R:'#d53e46',G:'#319955',
    B:'#2a6dc8',O:'#e49228',Y:'#e8d13c',P:'#d76ba8'
  });
  const SIZE=7;
  function pattern(name) {
    if(!['orientation','contrast'].includes(name))throw new Error('Unknown test pattern');
    const matrix=Array.from({length:SIZE},(_,row)=>
      Array.from({length:SIZE},(_,col)=>
        name==='contrast'
          ? (row+col)%2?'K':'W'
          : (row===0||row===SIZE-1||col===0||col===SIZE-1?'K':'W')));
    if(name==='orientation') {
      matrix[0][0]='R';matrix[0][6]='G';
      matrix[6][0]='B';matrix[6][6]='O';
      matrix[3][3]='Y';matrix[2][4]='P';
      for(let row=1;row<6;row++)matrix[row][1]='K';
      for(let col=1;col<6;col++)matrix[5][col]='K';
    }
    return matrix;
  }
  function requiredNumber(name,input,min,max) {
    if(input===null||input===undefined||String(input).trim()==='')
      throw new Error(name+' is required');
    const value=Number(input);
    if(!Number.isFinite(value)||value<min||value>max)
      throw new Error(name+' must be between '+min+' and '+max);
    return value;
  }
  const round=v=>Number(v.toFixed(6));
  function generate(options) {
    if(!options||typeof options!=='object')throw new Error('Options are required');
    const x=requiredNumber('X',options.x,-100000,100000);
    const y=requiredNumber('Y',options.y,-100000,100000);
    const z=requiredNumber('Z',options.z,-100000,100000);
    const yaw=requiredNumber('Yaw',options.yaw,-360,360);
    const pitch=requiredNumber('Pitch',options.pitch,-180,180);
    const roll=requiredNumber('Roll',options.roll,-180,180);
    const scale=requiredNumber('Scale',options.scale,0.1,2);
    const spacing=requiredNumber('Spacing multiplier',options.spacing,0.5,1.75);
    const flip=Boolean(options.mirror);
    const mode=options.mode||'orientation';
    const grid=pattern(mode);
    // 9.7 cm per unit at scale 1 is an UNVERIFIED starting approximation.
    const step=0.097*scale*spacing;
    const angle=yaw*Math.PI/180;
    const horizontalX=Math.cos(angle);
    const horizontalZ=-Math.sin(angle);
    const center=(SIZE-1)/2;
    const Objects=[];
    grid.forEach((row,r)=>row.forEach((pixel,c)=>{
      const column=flip?SIZE-1-c:c;
      const offset=(column-center)*step;
      const height=(center-r)*step;
      Objects.push({
        name:CLASSES[pixel],
        pos:[round(x+offset*horizontalX),round(y+height),round(z+offset*horizontalZ)],
        ypr:[round(yaw),round(pitch),round(roll)],
        scale:round(scale)
      });
    }));
    return {Objects,grid,count:Objects.length,stepMeters:round(step),
      widthMeters:round(SIZE*step),origin:[x,y,z],mode};
  }
  const api=Object.freeze({CLASSES,COLOURS,SIZE,pattern,generate});
  if(typeof module==='object'&&module.exports)module.exports=api;
  if(root)root.WWZArmbandCalibration=api;
  if(typeof document==='undefined')return;

  function init(){
    const form=document.getElementById('calibration-form');
    const canvas=document.getElementById('calibration-preview');
    const state=document.getElementById('calibration-state');
    const download=document.getElementById('calibration-download');
    const result=document.getElementById('calibration-result');
    if(!form||!canvas||!state||!download||!result)return;
    const ctx=canvas.getContext('2d');
    let current=null;
    const values=()=>{
      const f=new FormData(form);
      return {x:f.get('x'),y:f.get('y'),z:f.get('z'),
        yaw:f.get('yaw'),pitch:f.get('pitch'),roll:f.get('roll'),
        scale:f.get('scale'),spacing:f.get('spacing'),mode:f.get('mode'),
        mirror:f.get('mirror')==='on'};
    };
    function preview(grid) {
      const size=46;
      canvas.width=SIZE*size;canvas.height=SIZE*size;
      grid.forEach((row,r)=>row.forEach((pixel,c)=>{
        ctx.fillStyle=COLOURS[pixel];
        ctx.fillRect(c*size,r*size,size,size);
        ctx.strokeStyle='#243343';ctx.strokeRect(c*size+.5,r*size+.5,size-1,size-1);
      }));
    }
    function refresh(){
      const options=values();
      preview(pattern(options.mode));
      current=null;download.disabled=true;
      result.textContent='No server changes. This lab generates a downloadable file only.';
      try{
        current=generate(options);
        state.textContent=current.count+' armbands · '+current.stepMeters+
          'm spacing · '+current.widthMeters+'m overall width (unverified)';
        download.disabled=false;
      }catch(error){
        state.textContent=error.message;
      }
    }
    form.addEventListener('input',refresh);
    form.addEventListener('change',refresh);
    download.addEventListener('click',()=>{
      if(!current)return;
      const selection=form.elements.namedItem('world').value==='pvp'?'PvP':'PvE';
      const filename='WWZ_Nasdara_'+selection+'_Armband_Calibration_'+current.mode+'.json';
      const json=JSON.stringify({Objects:current.Objects},null,2)+'\n';
      const url=URL.createObjectURL(new Blob([json],{type:'application/json'}));
      const a=document.createElement('a');
      a.href=url;a.download=filename;document.body.appendChild(a);a.click();a.remove();
      setTimeout(()=>URL.revokeObjectURL(url),1000);
      result.textContent='Exported '+filename+'. Test on local dev first. No file uploaded.';
    });
    refresh();
  }
  if(document.readyState==='loading')
    document.addEventListener('DOMContentLoaded',init,{once:true});
  else init();
})(typeof window!=='undefined'?window:null);
