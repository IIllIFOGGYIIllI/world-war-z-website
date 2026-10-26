/* WWZ Nasdara static structures — native DVMOBJ1 footprint renderer.
 * Deliberately loads only for Nasdara close-up views and draws on a
 * noninteractive Leaflet canvas beneath roads, markers and labels.
 * World metres stay in DayZ X/Z: +Z is north, no paper-grid inversion.
 */
(() => {
  'use strict';
  const SIZE=16384, CELL=256, GRID=64;
  const clamp=(n,a,b)=>Math.max(a,Math.min(n,b));
  const stateByMap=new WeakMap();

  const readBinary=async url=>{
    const response=await fetch(url,{cache:'force-cache'});
    if(!response.ok)throw Error('Nasdara structures returned HTTP '+response.status);
    return response.arrayBuffer();
  };
  const readClasses=async url=>{
    const response=await fetch(url,{cache:'force-cache'});
    if(!response.ok)throw Error('Nasdara structure classes returned HTTP '+response.status);
    return response.json();
  };
  function parse(buffer, names){
    const view=new DataView(buffer);
    const signature='DVMOBJ1';
    if(view.byteLength<28||[...signature].some((char,i)=>view.getUint8(i)!==char.charCodeAt(0))||view.getUint8(7)!==0)
      throw Error('Invalid Nasdara structure binary');
    const world=view.getFloat32(8,true),n=view.getUint32(12,true),count=view.getUint32(16,true),
      nRings=view.getUint32(20,true),nPoints=view.getUint32(24,true);
    if(world!==SIZE||n!==1697||count!==295195||!Array.isArray(names)||names.length!==n)
      throw Error('Incompatible Nasdara structure dataset');
    const ringsStart=28+n*60,pointsStart=ringsStart+nRings*8,instancesStart=pointsStart+nPoints*8;
    if(instancesStart+count*20!==view.byteLength)throw Error('Incomplete Nasdara structures');
    const models=Array.from({length:n},(_,i)=>{
      const off=28+i*60,first=view.getUint32(off,true),length=view.getUint32(off+4,true);
      const allowed=/^Land_(?!.*(?:wall|fence|pole))/i.test(names[i]);
      if(!allowed||!length||first>=nRings)return null;
      const rings=[];
      for(let j=first;j<first+Math.min(length,3);j++){
        const r=ringsStart+j*8,start=view.getUint32(r,true),vertices=view.getUint32(r+4,true);
        if(vertices<3||vertices>150||start+vertices>nPoints)continue;
        const pts=[];
        for(let k=0;k<vertices;k++){
          const x=view.getFloat32(pointsStart+(start+k)*8,true);
          const z=view.getFloat32(pointsStart+(start+k)*8+4,true);
          if(!Number.isFinite(x)||!Number.isFinite(z))continue;
          pts.push([x,z]);
        }
        if(pts.length>=3)rings.push(pts);
      }
      return rings.length?rings:null;
    });
    const cells=Array.from({length:GRID*GRID},()=>[]);
    let included=0;
    for(let i=0;i<count;i++){
      const p=instancesStart+i*20,model=view.getUint32(p,true);
      if(!models[model])continue;
      const x=view.getFloat32(p+4,true),z=view.getFloat32(p+8,true),
        angle=view.getFloat32(p+12,true)*Math.PI/180,scale=view.getFloat32(p+16,true);
      if(!Number.isFinite(x)||!Number.isFinite(z)||!Number.isFinite(angle)||!Number.isFinite(scale)||scale<=0||
        x<0||z<0||x>SIZE||z>SIZE)continue;
      const cx=Math.min(GRID-1,Math.floor(x/CELL)),cz=Math.min(GRID-1,Math.floor(z/CELL));
      cells[cz*GRID+cx].push({x,z,c:Math.cos(angle)*scale,s:Math.sin(angle)*scale,model});
      included++;
    }
    return {models,cells,included};
  }
  function attach(map,config){
    if(stateByMap.has(map))return stateByMap.get(map).controller;
    const pane=map.createPane('wwzNasdaraBuildings');
    pane.style.zIndex='325';
    pane.style.pointerEvents='none';
    const canvas=window.L.DomUtil.create('canvas','wwz-nasdara-structures',pane);
    canvas.style.pointerEvents='none';
    canvas.style.position='absolute';
    const state={visible:true,destroyed:false,layer:null,lastZoom:-1,canvas};
    let loaded=null,loading=null;
    function draw(){
      if(state.destroyed)return;
      const zoom=map.getZoom(),size=map.getSize(),dpr=Math.min(window.devicePixelRatio||1,2);
      const w=Math.max(1,Math.ceil(size.x)),h=Math.max(1,Math.ceil(size.y));
      window.L.DomUtil.setPosition(canvas,map.containerPointToLayerPoint([0,0]));
      canvas.style.width=w+'px';canvas.style.height=h+'px';
      if(canvas.width!==Math.ceil(w*dpr)||canvas.height!==Math.ceil(h*dpr)){
        canvas.width=Math.ceil(w*dpr);canvas.height=Math.ceil(h*dpr);
      }
      const ctx=canvas.getContext('2d');
      if(!ctx)return;
      ctx.setTransform(dpr,0,0,dpr,0,0);ctx.clearRect(0,0,w,h);
      if(!state.visible||zoom<4.75||!loaded)return;
      const unit=config.mapUnits/SIZE*Math.pow(2,zoom);
      const origin=map.latLngToContainerPoint([0,0]);
      const xStart=clamp(Math.floor((-origin.x-320*unit)/unit/CELL),0,GRID-1);
      const xEnd=clamp(Math.floor((w-origin.x+320*unit)/unit/CELL),0,GRID-1);
      const zStart=clamp(Math.floor((origin.y-h-320*unit)/unit/CELL),0,GRID-1);
      const zEnd=clamp(Math.floor((origin.y+320*unit)/unit/CELL),0,GRID-1);
      ctx.lineJoin='round';
      ctx.lineWidth=zoom>6.2?1.3:.85;
      ctx.strokeStyle='rgba(37,29,25,.82)';
      ctx.fillStyle='rgba(241,215,177,.29)';
      let drawn=0;
      for(let gz=zStart;gz<=zEnd;gz++)for(let gx=xStart;gx<=xEnd;gx++){
        for(const item of loaded.cells[gz*GRID+gx]){
          const screenX=origin.x+item.x*unit,screenY=origin.y-item.z*unit;
          if(screenX < -350||screenY < -350||screenX > w+350||screenY>h+350)continue;
          const rings=loaded.models[item.model];
          for(const ring of rings){
            ctx.beginPath();
            for(let i=0;i<ring.length;i++){
              const [u,v]=ring[i];
              const x=screenX+(item.c*u-item.s*v)*unit,y=screenY-(item.s*u+item.c*v)*unit;
              if(i)ctx.lineTo(x,y);else ctx.moveTo(x,y);
            }
            ctx.closePath();ctx.fill();ctx.stroke();
          }
          if(++drawn>=14000)return;
        }
      }
    }
    const onMove=()=>{draw();if(state.visible&&map.getZoom()>=4.75)load();};
    function load(){
      if(loaded||loading||state.destroyed)return loading;
      loading=Promise.all([readBinary(config.structureUrl),readClasses(config.structureClassUrl)])
        .then(([data,names])=>{if(!state.destroyed){loaded=parse(data,names);draw();}})
        .catch(error=>{console.warn('Nasdara structure outlines unavailable:',error);})
        .finally(()=>{loading=null;});
      return loading;
    }
    map.on('moveend zoomend resize',onMove);
    const controller={
      setVisible(value){state.visible=Boolean(value);onMove();},
      getVisible(){return state.visible;},
      destroy(){state.destroyed=true;map.off('moveend zoomend resize',onMove);canvas.remove();stateByMap.delete(map);}
    };
    state.controller=controller;stateByMap.set(map,state);
    onMove();
    return controller;
  }
  window.WWZNasdaraStructures=Object.freeze({attach,parse});
})();
