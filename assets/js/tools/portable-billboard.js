/* WWZ v0.5 — portable highway billboard, DayZ Editor export only.
   Model and Side A geometry are based on the owner's measured editor instance.
   Classname spawn and rotated armband facing still require a local Editor test. */
(function(root){
  'use strict';
  const REFERENCE=Object.freeze({
    pivot:Object.freeze([11220.515,172.661,11103.675]),
    yaw:72,
    model:'StaticObj_Billboard_Highway_Blank'
  });
  const QUALITY=Object.freeze({
    full:Object.freeze({width:88,height:44,scale:.85,label:'Full detail · 3,872 pixels'}),
    balanced:Object.freeze({width:80,height:40,scale:.94,label:'Balanced · 3,200 pixels'}),
    light:Object.freeze({width:64,height:32,scale:1.17,label:'Light · 2,048 pixels'}),
    minimal:Object.freeze({width:48,height:24,scale:1.56,label:'Minimal · 1,152 pixels'})
  });
  const finite=(label,value,min,max)=>{
    if(value===undefined||value===null||String(value).trim()==='')
      throw new Error(label+' is required.');
    const n=Number(value);
    if(!Number.isFinite(n)||n<min||n>max)
      throw new Error(label+' must be from '+min+' to '+max+'.');
    return n;
  };
  const round=n=>Number(n.toFixed(6));
  const normAngle=angle=>round(((angle+180)%360+360)%360-180);
  function validateQuality(name){
    if(!Object.prototype.hasOwnProperty.call(QUALITY,name))throw new Error('Unknown detail level.');
    return QUALITY[name];
  }
  function destination(settings){
    const x=finite('Billboard X',settings.frameX,-100000,100000);
    const y=finite('Billboard Y',settings.frameY,-100000,100000);
    const z=finite('Billboard Z',settings.frameZ,-100000,100000);
    const yaw=finite('Billboard yaw',settings.frameYaw,-360,360);
    return {x,y,z,yaw};
  }
  // Rotation around the billboard pivot, in DayZ's world XZ plane.
  // Positive yaw uses same sign convention as existing sign generator.
  function transformPoint(point,target){
    const rad=(target.yaw-REFERENCE.yaw)*Math.PI/180;
    const cs=Math.cos(rad),sn=Math.sin(rad);
    const dx=point[0]-REFERENCE.pivot[0];
    const dz=point[2]-REFERENCE.pivot[2];
    return [
      round(target.x+dx*cs+dz*sn),
      round(target.y+point[1]-REFERENCE.pivot[1]),
      round(target.z-dx*sn+dz*cs)
    ];
  }
  function generate(grid,settings){
    if(!grid||!Array.isArray(grid)||!grid.length||!Array.isArray(grid[0]))
      throw new Error('A valid sign design is required.');
    const api=root?.WWZSignboardStudio ||
      (typeof module==='object'&&module.exports ? require('./signboard-studio.js') : null);
    if(!api?.HIGHWAY_SIDE_A||!api?.highwayFitGrid)
      throw new Error('Signboard generator is unavailable.');
    const name=settings.highwayQuality||'full',quality=validateQuality(name);
    if(grid.length!==quality.height||grid.some(line=>line.length!==quality.width))
      throw new Error('Design resolution does not match '+name+' quality. Reapply the billboard size.');
    const target=destination(settings);
    const includeFrame=settings.includeBillboard!==false&&settings.includeBillboard!=='false';
    const ref=api.HIGHWAY_SIDE_A;
    const calibrated=api.highwayFitGrid(grid,{
      x:ref.referenceCenter[0],y:ref.referenceCenter[1],z:ref.referenceCenter[2],
      yaw:ref.ypr[0],pitch:ref.ypr[1],roll:ref.ypr[2],
      scale:quality.scale,spacing:1,
      highwayQuality:name,
      highwayClearance:settings.highwayClearance===undefined?ref.clearance:settings.highwayClearance,
      mirror:settings.mirror===true||settings.mirror==='on'
    }).Objects;
    const delta=target.yaw-REFERENCE.yaw;
    const Objects=[];
    if(includeFrame)Objects.push({
      name:REFERENCE.model,
      pos:[round(target.x),round(target.y),round(target.z)],
      ypr:[round(target.yaw),0,0],
      scale:1
    });
    for(const item of calibrated){
      Objects.push({
        name:item.name,
        pos:transformPoint(item.pos,target),
        // DayZ ObjectSpawner ypr = yaw, pitch, roll. Pitch & roll
        // preserve the measured orientation; yaw rotates with the frame.
        ypr:[normAngle(item.ypr[0]+delta),item.ypr[1],item.ypr[2]],
        scale:item.scale
      });
    }
    if(Objects.length>api.MAX_OBJECTS)
      throw new Error('Export would exceed the 5,000-object safety limit.');
    return {Objects};
  }
  const api=Object.freeze({REFERENCE,QUALITY,validateQuality,destination,transformPoint,generate});
  if(typeof module==='object'&&module.exports)module.exports=api;
  if(root)root.WWZPortableBillboard=api;
})(typeof window!=='undefined'?window:null);
