/* WWZ Nasdara native 3D-model roof pictures and exact game X/Z placements.
 * Model art and transforms are from the pinned user-supplied DayZ map archive.
 */
(() => {
'use strict';
const WORLD=16384,CELL=256,GRID=64,MIN_ZOOM=3.8,PICTURE_ZOOM=5.5;
const clamp=(x,a,b)=>Math.min(b,Math.max(a,x)),instances=new WeakMap();
const getJson=async url=>{const r=await fetch(url,{cache:'force-cache'});if(!r.ok)throw Error('HTTP '+r.status+': '+url);return r.json()};
const getBinary=async url=>{const r=await fetch(url,{cache:'force-cache'});if(!r.ok)throw Error('HTTP '+r.status+': '+url);return r.arrayBuffer()};
function parse(buffer,names,atlas){
  const view=new DataView(buffer),signature='DVMOBJ1';
  if(view.byteLength<28||[...signature].some((c,i)=>view.getUint8(i)!==c.charCodeAt(0))||view.getUint8(7)!==0)
    throw Error('Invalid Nasdara objects signature');
  const world=view.getFloat32(8,true),modelCount=view.getUint32(12,true),count=view.getUint32(16,true),
    ringCount=view.getUint32(20,true),pointCount=view.getUint32(24,true);
  if(world!==WORLD||modelCount!==1697||count!==295195||!Array.isArray(names)||names.length!==modelCount)
    throw Error('Nasdara building source does not match the published map');
  const ringsStart=28+modelCount*60,pointsStart=ringsStart+ringCount*8,placementsStart=pointsStart+pointCount*8;
  if(placementsStart+count*20!==view.byteLength)throw Error('Truncated building coordinate data');
  if(!atlas||atlas.version!==1||atlas.count!==1694||!Array.isArray(atlas.pages)||
     !atlas.pages.length||!atlas.sprites)throw Error('Detailed building picture atlas is missing');
  const models=Array.from({length:modelCount},(_,i)=>{
    const off=28+i*60,first=view.getUint32(off,true),length=view.getUint32(off+4,true),
      flags=view.getUint32(off+8,true),width=view.getUint32(off+12,true),height=view.getUint32(off+16,true),
      top=Array.from({length:6},(_,j)=>view.getFloat32(off+20+j*4,true)),
      bounds=Array.from({length:4},(_,j)=>view.getFloat32(off+44+j*4,true)),rings=[];
    if(first+length>ringCount)throw Error('Invalid building ring reference');
    for(let j=first;j<first+length;j++){
      const r=ringsStart+j*8,start=view.getUint32(r,true),vertices=view.getUint32(r+4,true);
      if(vertices<3||start+vertices>pointCount)throw Error('Invalid building outline');
      const ring=new Float32Array(vertices*2);
      for(let k=0;k<vertices;k++){
        ring[2*k]=view.getFloat32(pointsStart+(start+k)*8,true);
        ring[2*k+1]=view.getFloat32(pointsStart+(start+k)*8+4,true);
      }
      rings.push(ring);
    }
    const sprite=atlas.sprites[String(i)]||null;
    if((flags&4)&&(!sprite||sprite[3]!==width||sprite[4]!==height))
      throw Error('Building picture dimensions do not match model '+i);
    const name=String(names[i]),prominent=/^Land_/i.test(name)&&!/(?:wall|fence|pole|wreck)/i.test(name);
    const area=Math.abs((bounds[2]-bounds[0])*(bounds[3]-bounds[1]));
    return {name,flags,top,bounds,rings,sprite,prominent,area};
  });
  const cells=Array.from({length:GRID*GRID},()=>[]);
  let valid=0;
  for(let i=0;i<count;i++){
    const off=placementsStart+i*20,id=view.getUint32(off,true),x=view.getFloat32(off+4,true),
      z=view.getFloat32(off+8,true),scale=view.getFloat32(off+16,true);
    if(id>=models.length||!Number.isFinite(x)||!Number.isFinite(z)||!Number.isFinite(scale)||
       scale<=0||x<0||x>WORLD||z<0||z>WORLD)continue;
    cells[clamp(Math.floor(z/CELL),0,GRID-1)*GRID+clamp(Math.floor(x/CELL),0,GRID-1)].push(i);
    valid++;
  }
  return Object.freeze({view,models,cells,placementsStart,count,atlas,valid});
}
function attach(map,config){
  const existing=instances.get(map);if(existing)return existing;
  const pane=map.createPane('wwzNasdaraBuildings');
  pane.style.zIndex='325';pane.style.pointerEvents='none';
  const canvas=window.L.DomUtil.create('canvas','wwz-nasdara-structures',pane);
  canvas.style.position='absolute';canvas.style.pointerEvents='none';
  const state={visible:true,destroyed:false,loaded:null,loading:null,images:new Map(),failures:new Set(),
    frame:null,drawn:0,detail:0,loadError:null};
  const base=config.structureAtlasUrl.split('?')[0].replace(/[^/]+$/,'');
  const report=status=>config.onStructureStatus?.(status);
  function getImage(sprite){
    const page=sprite[0],cached=state.images.get(page);
    if(cached)return cached;
    if(state.failures.has(page))return null;
    state.failures.add(page);
    const filename=state.loaded.atlas.pages[page];
    if(!/^buildings-\d\d\.webp$/.test(filename))return null;
    const image=new Image();
    image.onload=()=>{if(state.destroyed)return;state.images.set(page,image);schedule()};
    image.onerror=()=>{console.warn('Nasdara building atlas unavailable:',filename);report('error')};
    image.src=base+filename;
    return null;
  }
  function paint(){
    if(state.destroyed)return;
    const size=map.getSize(),zoom=map.getZoom(),w=Math.ceil(size.x),h=Math.ceil(size.y),
      dpr=Math.min(window.devicePixelRatio||1,2);
    window.L.DomUtil.setPosition(canvas,map.containerPointToLayerPoint([0,0]));
    canvas.style.width=w+'px';canvas.style.height=h+'px';
    if(canvas.width!==Math.round(w*dpr)||canvas.height!==Math.round(h*dpr)){
      canvas.width=Math.round(w*dpr);canvas.height=Math.round(h*dpr);
    }
    const ctx=canvas.getContext('2d');if(!ctx)return;
    ctx.setTransform(dpr,0,0,dpr,0,0);ctx.clearRect(0,0,w,h);
    state.drawn=0;state.detail=0;
    if(!state.visible||!state.loaded||zoom<MIN_ZOOM){report('drawn',{drawn:0,detailed:0,zoom});return;}
    const source=state.loaded,unit=config.mapUnits/WORLD*Math.pow(2,zoom);
    // The Leaflet CRS.Simple point [0,0] is NORTHWEST (Z=16384).
    // Buildings are measured northward from SOUTHWEST (Z=0).
    // Using [0,0] incorrectly put every building far outside the viewport.
    const origin=map.latLngToContainerPoint([-config.mapUnits,0]);
    const x0=clamp(Math.floor((-origin.x-100)/unit/CELL),0,GRID-1),
      x1=clamp(Math.floor((w-origin.x+100)/unit/CELL),0,GRID-1),
      z0=clamp(Math.floor((origin.y-h-100)/unit/CELL),0,GRID-1),
      z1=clamp(Math.floor((origin.y+100)/unit/CELL),0,GRID-1);
    if(x1<x0||z1<z0)return;
    const usePictures=zoom>=PICTURE_ZOOM;
    // Match ZedForge's native-structure density and close-zoom thresholds.
    const minSize=1.5;
    let drawn=0;ctx.lineJoin='round';ctx.lineCap='round';
    for(let zz=z0;zz<=z1;zz++)for(let xx=x0;xx<=x1;xx++){
      for(const index of source.cells[zz*GRID+xx]){
        const off=source.placementsStart+index*20,view=source.view,
          model=source.models[view.getUint32(off,true)];
        if((model.flags&2)&&zoom<6)continue;
        if(!model.rings.length)continue;
        const x=view.getFloat32(off+4,true),z=view.getFloat32(off+8,true),
          scale=view.getFloat32(off+16,true),angle=view.getFloat32(off+12,true)*Math.PI/180;
        const maxSize=Math.max(model.bounds[2]-model.bounds[0],model.bounds[3]-model.bounds[1]);
        if(maxSize*scale*unit<minSize)continue;
        const px=origin.x+x*unit,py=origin.y-z*unit;
        if(px< -200||px>w+200||py< -200||py>h+200)continue;
        const c=Math.cos(angle)*scale,s=Math.sin(angle)*scale;
        ctx.save();ctx.transform(c*unit,-s*unit,-s*unit,-c*unit,px,py);
        let painted=false;
        if(usePictures&&model.sprite){
          const sprite=model.sprite,image=getImage(sprite);
          if(image){
            ctx.save();ctx.transform(...model.top);
            ctx.drawImage(image,sprite[1],sprite[2],sprite[3],sprite[4],0,0,sprite[3],sprite[4]);
            ctx.restore();painted=true;state.detail++;
          }
        }
        ctx.beginPath();
        for(const ring of model.rings){
          for(let k=0;k<ring.length;k+=2){
            if(k===0)ctx.moveTo(ring[0],ring[1]);else ctx.lineTo(ring[k],ring[k+1]);
          }
          ctx.closePath();
        }
        ctx.fillStyle=(model.flags&1)?'#8d614d':'#525e5c';
        ctx.strokeStyle='#1b2728';
        ctx.lineWidth=Math.max(.5,1/(unit*scale));
        if(!painted)ctx.fill();
        ctx.stroke();
        ctx.restore();state.drawn++;
        if(++drawn>=14000){report('limited');return}
      }
    }
    report('drawn',{drawn:state.drawn,detailed:state.detail,zoom});
  }
  function schedule(){
    if(state.frame!==null||state.destroyed)return;
    state.frame=window.requestAnimationFrame(()=>{state.frame=null;paint()});
  }
  function load(){
    if(state.loaded||state.loading||state.destroyed||!state.visible)return state.loading;
    report('loading');
    state.loading=Promise.all([
      getBinary(config.structureUrl),getJson(config.structureClassUrl),getJson(config.structureAtlasUrl)
    ]).then(([data,names,atlas])=>{
      if(state.destroyed)return;
      state.loaded=parse(data,names,atlas);report('ready');schedule();
    }).catch(error=>{
      state.loadError=String(error?.message||error);
      console.warn('WWZ detailed Nasdara buildings unavailable:',error);report('error');
    }).finally(()=>{state.loading=null});
    return state.loading;
  }
  function onMove(){if(state.visible&&map.getZoom()>=MIN_ZOOM)load();schedule()}
  map.on('moveend zoomend resize',onMove);
  const controller={
    setVisible(value){state.visible=Boolean(value);onMove()},
    getVisible(){return state.visible},
    getStatus(){return {visible:state.visible,loaded:Boolean(state.loaded),error:state.loadError,
      placements:state.loaded?.valid||0,drawn:state.drawn,detailed:state.detail}},
    destroy(){
      state.destroyed=true;map.off('moveend zoomend resize',onMove);
      if(state.frame!==null)window.cancelAnimationFrame(state.frame);
      pane.remove();instances.delete(map);
    }
  };
  instances.set(map,controller);onMove();return controller;
}
window.WWZNasdaraStructures=Object.freeze({attach,parse,MIN_ZOOM,PICTURE_ZOOM});
})();