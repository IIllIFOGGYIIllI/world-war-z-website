/* WWZ Signboard Studio v0.2 — client-side artwork -> vanilla armband ObjectSpawner JSON.
   Based on successful editor-only 7x7 calibration (scale .5, spacing 1, pitch -90).
   No Railway/Nitrado endpoints, no deployments, no automatic server writes. */
(function (root) {
  'use strict';
  const PALETTE=Object.freeze({
    K:Object.freeze({name:'Black',hex:'#17191e',cls:'Armband_Black'}),
    W:Object.freeze({name:'White',hex:'#e7e8ea',cls:'Armband_White'}),
    R:Object.freeze({name:'Red',hex:'#d53e46',cls:'Armband_Red'}),
    G:Object.freeze({name:'Green',hex:'#319955',cls:'Armband_Green'}),
    B:Object.freeze({name:'Blue',hex:'#2a6dc8',cls:'Armband_Blue'}),
    O:Object.freeze({name:'Orange',hex:'#e49228',cls:'Armband_Orange'}),
    Y:Object.freeze({name:'Yellow',hex:'#e8d13c',cls:'Armband_Yellow'}),
    P:Object.freeze({name:'Pink',hex:'#d76ba8',cls:'Armband_Pink'})
  });
  const PRESETS=Object.freeze({
    compact:[48,20],small:[64,24],standard:[80,30],medium:[96,36],
    busstop:[107,30],stump:[32,35],custom:null
  });
  const MAX_OBJECTS=5000;
  const FONT=Object.freeze({
    'A':'01110/10001/10001/11111/10001/10001/10001',
    'B':'11110/10001/10001/11110/10001/10001/11110',
    'C':'01111/10000/10000/10000/10000/10000/01111',
    'D':'11110/10001/10001/10001/10001/10001/11110',
    'E':'11111/10000/10000/11110/10000/10000/11111',
    'F':'11111/10000/10000/11110/10000/10000/10000',
    'G':'01111/10000/10000/10111/10001/10001/01111',
    'H':'10001/10001/10001/11111/10001/10001/10001',
    'I':'11111/00100/00100/00100/00100/00100/11111',
    'J':'00111/00010/00010/00010/10010/10010/01100',
    'K':'10001/10010/10100/11000/10100/10010/10001',
    'L':'10000/10000/10000/10000/10000/10000/11111',
    'M':'10001/11011/10101/10101/10001/10001/10001',
    'N':'10001/11001/10101/10011/10001/10001/10001',
    'O':'01110/10001/10001/10001/10001/10001/01110',
    'P':'11110/10001/10001/11110/10000/10000/10000',
    'Q':'01110/10001/10001/10001/10101/10010/01101',
    'R':'11110/10001/10001/11110/10100/10010/10001',
    'S':'01111/10000/10000/01110/00001/00001/11110',
    'T':'11111/00100/00100/00100/00100/00100/00100',
    'U':'10001/10001/10001/10001/10001/10001/01110',
    'V':'10001/10001/10001/10001/10001/01010/00100',
    'W':'10001/10001/10001/10101/10101/10101/01010',
    'X':'10001/10001/01010/00100/01010/10001/10001',
    'Y':'10001/10001/01010/00100/00100/00100/00100',
    'Z':'11111/00001/00010/00100/01000/10000/11111',
    '0':'01110/10001/10011/10101/11001/10001/01110',
    '1':'00100/01100/00100/00100/00100/00100/01110',
    '2':'01110/10001/00001/00010/00100/01000/11111',
    '3':'11110/00001/00001/01110/00001/00001/11110',
    '4':'00010/00110/01010/10010/11111/00010/00010',
    '5':'11111/10000/10000/11110/00001/00001/11110',
    '6':'01110/10000/10000/11110/10001/10001/01110',
    '7':'11111/00001/00010/00100/01000/01000/01000',
    '8':'01110/10001/10001/01110/10001/10001/01110',
    '9':'01110/10001/10001/01111/00001/00001/01110',
    ' ':'00000/00000/00000/00000/00000/00000/00000',
    '-':'00000/00000/00000/11111/00000/00000/00000',
    '.':'00000/00000/00000/00000/00000/00110/00110',
    ':':'00000/00110/00110/00000/00110/00110/00000',
    '/':'00001/00001/00010/00100/01000/10000/10000',
    '&':'01100/10010/10100/01000/10101/10010/01101',
    '!':'00100/00100/00100/00100/00100/00000/00100',
    '?':'01110/10001/00001/00010/00100/00000/00100',
    '#':'01010/11111/01010/01010/11111/01010/00000',
    '+':'00000/00100/00100/11111/00100/00100/00000',
    '$':'00100/01111/10100/01110/00101/11110/00100'
  });
  const keys=Object.keys(PALETTE);
  function number(label,value,min,max){
    if(value===null||value===undefined||String(value).trim()==='')
      throw new Error(label+' is required.');
    const n=Number(value);
    if(!Number.isFinite(n)||n<min||n>max)
      throw new Error(label+' must be '+min+' to '+max+'.');
    return n;
  }
  function dimensions(preset,customW,customH){
    if(!Object.prototype.hasOwnProperty.call(PRESETS,preset))
      throw new Error('Unknown board size.');
    const shape=PRESETS[preset];
    const width=shape?shape[0]:number('Width',customW,20,200);
    const height=shape?shape[1]:number('Height',customH,12,140);
    return {width,height,count:width*height};
  }
  const blank=(w,h,k)=>Array.from({length:h},()=>Array(w).fill(k));
  function normalizedText(s){
    return String(s||'').normalize('NFKD').toUpperCase().replace(/[\u0300-\u036f]/g,'')
      .replace(/[^A-Z0-9 .:/&!?#$+\-]/g,' ').replace(/\s+/g,' ').trim();
  }
  function wrap(text,maxChars,maxLines){
    const clean=normalizedText(text);
    if(!clean)return [];
    if(maxChars<1)throw new Error('This board is too narrow for text.');
    const words=clean.split(' '),lines=[];let line='';
    for(let word of words){
      while(word.length>maxChars){
        if(line){lines.push(line);line='';}
        lines.push(word.slice(0,maxChars));word=word.slice(maxChars);
      }
      if(word){
        if(!line)line=word;
        else if(line.length+1+word.length<=maxChars)line+=' '+word;
        else {lines.push(line);line=word;}
      }
    }
    if(line)lines.push(line);
    if(lines.length>maxLines)throw new Error('Text is too long for this size. Shorten it or choose a larger board.');
    return lines;
  }
  function putText(grid,text,x,y,key){
    for(let i=0;i<text.length;i++){
      const rows=(FONT[text[i]]||FONT['?']).split('/');
      for(let ry=0;ry<7;ry++)for(let rx=0;rx<5;rx++){
        if(rows[ry][rx]==='1'&&grid[y+ry]&&grid[y+ry][x+i*6+rx]!==undefined)
          grid[y+ry][x+i*6+rx]=key;
      }
    }
  }
  function arrowOn(grid,side,key){
    const h=grid.length,w=grid[0].length,cy=Math.floor(h/2);
    const peakX=side==='left'?2:w-3;
    for(let offset=-4;offset<=4;offset++){
      const y=cy+offset;
      const x=peakX+(side==='left'?Math.abs(offset):-Math.abs(offset));
      if(grid[y]&&grid[y][x]!==undefined)grid[y][x]=key;
    }
    for(let dx=1;dx<=7;dx++){
      const x=peakX+(side==='left'?dx:-dx);
      if(grid[cy]&&grid[cy][x]!==undefined)grid[cy][x]=key;
    }
  }
  function borderOn(grid,key){
    const h=grid.length,w=grid[0].length;
    for(let x=0;x<w;x++){grid[0][x]=key;grid[h-1][x]=key;}
    for(let y=0;y<h;y++){grid[y][0]=key;grid[y][w-1]=key;}
  }
  function textMatrix(o){
    const dim=dimensions(o.preset,o.width,o.height),w=dim.width,h=dim.height;
    const bg=PALETTE[o.background]?o.background:'K';
    const fg=PALETTE[o.titleColour]?o.titleColour:'W';
    const sub=PALETTE[o.subtitleColour]?o.subtitleColour:'O';
    const accent=PALETTE[o.borderColour]?o.borderColour:'R';
    const arrow=['none','left','right','both'].includes(o.arrow)?o.arrow:'none';
    const grid=blank(w,h,bg);
    const left=2+(arrow==='left'||arrow==='both'?10:0);
    const right=w-2-(arrow==='right'||arrow==='both'?10:0);
    const maxChars=Math.floor((right-left+1)/6);
    const titleLines=wrap(o.title,maxChars,2);
    const subLines=wrap(o.subtitle,maxChars,2);
    if(!titleLines.length&&!subLines.length)throw new Error('Enter a title or subtitle.');
    const total=titleLines.length*7+Math.max(0,titleLines.length-1)*2+
      subLines.length*7+Math.max(0,subLines.length-1)*2+
      (titleLines.length&&subLines.length?3:0);
    if(total>h-4)throw new Error('The text cannot fit. Choose a taller sign or shorten the text.');
    let y=Math.floor((h-total)/2);
    const draw=(lines,key)=>{
      for(const line of lines){
        const textWidth=line.length*6-1;
        const x=Math.floor((left+right-textWidth)/2);
        putText(grid,line,x,y,key);y+=9;
      }
    };
    draw(titleLines,fg);
    if(titleLines.length&&subLines.length)y+=1;
    draw(subLines,sub);
    if(arrow==='left'||arrow==='both')arrowOn(grid,'left',accent);
    if(arrow==='right'||arrow==='both')arrowOn(grid,'right',accent);
    if(o.border)borderOn(grid,accent);
    return grid;
  }
  const colourRgb=Object.freeze(Object.fromEntries(
    keys.map(key=>[key,[1,3,5].map(index=>parseInt(PALETTE[key].hex.slice(index,index+2),16))])));
  function closestColour(r,g,b){
    let best='K',dist=Infinity;
    for(const key of keys){
      const v=colourRgb[key],dr=r-v[0],dg=g-v[1],db=b-v[2];
      const d=dr*dr*.3+dg*dg*.59+db*db*.11;
      if(d<dist){best=key;dist=d;}
    }
    return best;
  }
  function quantize(rgba,w,h,background='K'){
    if(!Number.isInteger(w)||!Number.isInteger(h)||w<1||h<1||
       !rgba||rgba.length!==w*h*4)throw new Error('Invalid image pixels.');
    const grid=blank(w,h,background);
    for(let y=0;y<h;y++)for(let x=0;x<w;x++){
      const i=(y*w+x)*4;
      if(rgba[i+3]<128)continue;
      grid[y][x]=closestColour(rgba[i],rgba[i+1],rgba[i+2]);
    }
    return grid;
  }
  const round=n=>Number(n.toFixed(6));
  function toSpawner(grid,position){
    const h=grid?.length,w=grid?.[0]?.length;
    if(!Number.isInteger(h)||!Number.isInteger(w)||h<1||w<1||!grid.every(row=>row.length===w))
      throw new Error('Invalid sign pixel grid.');
    if(w*h>MAX_OBJECTS)
      throw new Error('This sign uses '+(w*h).toLocaleString()+
        ' armbands, above the '+MAX_OBJECTS.toLocaleString()+'-object export limit. Choose a smaller size.');
    const x=number('X coordinate',position.x,-100000,100000);
    const y=number('Y height',position.y,-100000,100000);
    const z=number('Z coordinate',position.z,-100000,100000);
    const yaw=number('Yaw',position.yaw,-360,360);
    const pitch=number('Pitch',position.pitch,-180,180);
    const roll=number('Roll',position.roll,-180,180);
    const scale=number('Scale',position.scale,.1,2);
    const spacing=number('Spacing',position.spacing,.5,1.75);
    const step=.097*scale*spacing; // Editor-tested baseline, not precise model measurement.
    const rad=yaw*Math.PI/180;
    const cos=Math.cos(rad),sin=Math.sin(rad);
    // Optional mounting offset, expressed in the sign's LOCAL axes.
    // The backing billboard is a separately placed DayZ Editor object.
    const overlay=position.billboardOverlay===true||position.billboardOverlay==='on';
    const lateral=overlay?number('Billboard horizontal offset',position.lateralOffset,-5,5):0;
    const vertical=overlay?number('Billboard vertical offset',position.verticalOffset,-5,5):0;
    const forward=overlay?number('Billboard face offset',position.faceOffset,-3,3):0;
    const centreX=x+lateral*cos+forward*sin;
    const centreY=y+vertical;
    const centreZ=z-lateral*sin+forward*cos;
    const objects=[];
    for(let row=0;row<h;row++)for(let col=0;col<w;col++){
      const key=grid[row][col];
      if(!Object.prototype.hasOwnProperty.call(PALETTE,key))
        throw new Error('Unsupported armband colour at '+col+','+row+'.');
      const xOffset=((position.mirror?w-1-col:col)-(w-1)/2)*step;
      const yOffset=((h-1)/2-row)*step;
      objects.push({
        name:PALETTE[key].cls,
        pos:[round(centreX+xOffset*cos),round(centreY+yOffset),round(centreZ-xOffset*sin)],
        ypr:[round(yaw),round(pitch),round(roll)],
        scale:round(scale)
      });
    }
    return {Objects:objects};
  }
  const api=Object.freeze({PALETTE,PRESETS,MAX_OBJECTS,dimensions,normalizedText,
    wrap,textMatrix,closestColour,quantize,toSpawner});
  if(typeof module==='object'&&module.exports)module.exports=api;
  if(root)root.WWZSignboardStudio=api;
  if(typeof document==='undefined')return;
  function init(){
    const form=document.getElementById('studio-form');
    const preview=document.getElementById('studio-preview');
    const count=document.getElementById('studio-count');
    const issue=document.getElementById('studio-issue');
    const info=document.getElementById('studio-info');
    const billboardNote=document.getElementById('studio-billboard-note');
    const exportJson=document.getElementById('studio-export');
    const exportPng=document.getElementById('studio-png');
    const fileInput=document.getElementById('studio-image');
    if(!form||!preview||!count||!issue||!info||!exportJson||!exportPng||!fileInput)return;
    let artwork=null,grid=null;
    const ctx=preview.getContext('2d',{alpha:false});
    const values=()=>Object.fromEntries(new FormData(form));
    const getForm=()=>{const v=values();v.border=form.elements.namedItem('border').checked;
      v.mirror=form.elements.namedItem('mirror').checked;
      v.billboardOverlay=form.elements.namedItem('billboardOverlay')?.checked===true;
      return v;};
    const displayGrid=(pixels)=>{
      const h=pixels.length,w=pixels[0].length;
      preview.width=w;preview.height=h;
      ctx.imageSmoothingEnabled=false;
      for(let y=0;y<h;y++)for(let x=0;x<w;x++){
        ctx.fillStyle=PALETTE[pixels[y][x]].hex;
        ctx.fillRect(x,y,1,1);
      }
    };
    const imageGrid=(v)=>{
      if(!artwork)throw new Error('Choose a PNG, JPEG or WebP image first.');
      const d=dimensions(v.preset,v.width,v.height);
      const buffer=document.createElement('canvas');
      buffer.width=d.width;buffer.height=d.height;
      const p=buffer.getContext('2d',{willReadFrequently:true});
      p.fillStyle=PALETTE[v.background]?.hex||PALETTE.K.hex;
      p.fillRect(0,0,d.width,d.height);
      const srcRatio=artwork.width/artwork.height,destRatio=d.width/d.height;
      let dw,dh;
      if(srcRatio>destRatio){dw=d.width;dh=d.width/srcRatio;}
      else {dh=d.height;dw=d.height*srcRatio;}
      p.imageSmoothingEnabled=true;
      p.imageSmoothingQuality='high';
      p.drawImage(artwork,(d.width-dw)/2,(d.height-dh)/2,dw,dh);
      const output=quantize(p.getImageData(0,0,d.width,d.height).data,d.width,d.height,v.background);
      if(v.border)borderOn(output,PALETTE[v.borderColour]?v.borderColour:'R');
      return output;
    };
    function update(){
      const v=getForm();
      form.querySelectorAll('[data-mode-text]').forEach(el=>el.hidden=v.mode!=='text');
      form.querySelectorAll('[data-mode-image]').forEach(el=>el.hidden=v.mode!=='image');
      form.querySelectorAll('[data-custom-size]').forEach(el=>el.hidden=v.preset!=='custom');
      form.querySelectorAll('[data-billboard-fields]').forEach(el=>el.hidden=!v.billboardOverlay);
      if(billboardNote)billboardNote.textContent=v.billboardOverlay
        ? 'Billboard overlay enabled. The X/Y/Z above must be the display-face centre, not the billboard object pivot. Export contains armbands only; fine-tune offsets in Editor.'
        : 'Standard sign mode: exports artwork only.';
      issue.textContent='';
      grid=null;exportJson.disabled=true;exportPng.disabled=true;
      try{
        grid=v.mode==='image'?imageGrid(v):textMatrix(v);
        displayGrid(grid);
        const total=grid.length*grid[0].length;
        const step=.097*number('Scale',v.scale,.1,2)*number('Spacing',v.spacing,.5,1.75);
        const dims=(grid[0].length*step).toFixed(2)+' × '+(grid.length*step).toFixed(2)+' m';
        count.textContent=total.toLocaleString()+' armbands · approx. '+dims+
          ' · '+grid[0].length+'×'+grid.length+' pixels';
        if(v.billboardOverlay) {
          // Validate offsets before download becomes enabled, even though
          // they do not change object count or the pixel preview.
          number('Billboard horizontal offset',v.lateralOffset,-5,5);
          number('Billboard vertical offset',v.verticalOffset,-5,5);
          number('Billboard face offset',v.faceOffset,-3,3);
        }
        if(total>MAX_OBJECTS){
          issue.textContent='Preview only: over '+MAX_OBJECTS.toLocaleString()+
            ' objects. Reduce the board size to export.';
        }else if(total>1200){
          issue.textContent='Performance warning: '+total.toLocaleString()+
            ' placed objects may be expensive on console. Test locally first.';
        }else{
          issue.textContent='Experimental DayZ Editor placement. No server changes.';
        }
        exportPng.disabled=false;
        exportJson.disabled=total>MAX_OBJECTS;
      }catch(error){
        count.textContent='Design preview unavailable';
        issue.textContent=error.message;
      }
    }
    const download=(filename,data,type)=>{
      const blob=new Blob([data],{type}),url=URL.createObjectURL(blob);
      const link=document.createElement('a');link.href=url;link.download=filename;
      document.body.append(link);link.click();link.remove();
      setTimeout(()=>URL.revokeObjectURL(url),1000);
    };
    const filename=()=>String(getForm().title||'Custom_Sign').trim().replace(/[^a-zA-Z0-9]+/g,'_').slice(0,45).replace(/^_+|_+$/g,'')||'Custom_Sign';
    form.addEventListener('input',update);
    form.addEventListener('change',update);
    fileInput.addEventListener('change',()=>{
      const file=fileInput.files?.[0];
      if(!file){artwork=null;update();return;}
      if(!/^image\/(png|jpeg|webp)$/.test(file.type)||file.size>8*1024*1024){
        artwork=null;issue.textContent='Use a PNG, JPEG or WebP image under 8 MB.';return;
      }
      const url=URL.createObjectURL(file),image=new Image();
      image.onload=()=>{
        if(image.width>6000||image.height>6000){
          artwork=null;issue.textContent='Image dimensions are too large (maximum 6000 px).';
        }else{
          artwork=image;info.textContent='Loaded '+file.name+' locally. Nothing uploaded.';
        }
        URL.revokeObjectURL(url);update();
      };
      image.onerror=()=>{artwork=null;URL.revokeObjectURL(url);issue.textContent='Could not read image.';};
      image.src=url;
    });
    exportJson.addEventListener('click',()=>{
      if(!grid)return;
      try{
        const options=getForm(),spawner=toSpawner(grid,options);
        download('WWZ_'+filename()+'_Armbands.json',JSON.stringify(spawner,null,2)+'\n','application/json');
        info.textContent='Downloaded '+spawner.Objects.length+' armbands for DayZ Editor. No server was changed.';
      }catch(error){issue.textContent=error.message;}
    });
    exportPng.addEventListener('click',()=>{
      if(!grid)return;
      const output=document.createElement('canvas');
      output.width=preview.width*6;output.height=preview.height*6;
      const c=output.getContext('2d');c.imageSmoothingEnabled=false;
      c.drawImage(preview,0,0,output.width,output.height);
      output.toBlob(blob=>{if(blob)download('WWZ_'+filename()+'_Preview.png',blob,'image/png');},'image/png');
    });
    document.querySelectorAll('[data-studio-template]').forEach(button=>
      button.addEventListener('click',()=>{
        const name=button.dataset.studioTemplate;
        const examples={
          blackmarket:{title:'BLACK MARKET',subtitle:'BUY SELL TRADE',arrow:'none',background:'K',titleColour:'W',subtitleColour:'O',borderColour:'R'},
          direction:{title:'BLACK MARKET',subtitle:'THIS WAY',arrow:'right',background:'K',titleColour:'W',subtitleColour:'Y',borderColour:'R'},
          trader:{title:'TRADER',subtitle:'BUY SELL TRADE',arrow:'none',background:'B',titleColour:'W',subtitleColour:'Y',borderColour:'W'},
          rules:{title:'SERVER RULES',subtitle:'CHECK DISCORD',arrow:'none',background:'K',titleColour:'R',subtitleColour:'W',borderColour:'R'}
        };
        const preset=examples[name];if(!preset)return;
        Object.entries(preset).forEach(([key,value])=>{const field=form.elements.namedItem(key);if(field)field.value=value;});
        form.elements.namedItem('mode').value='text';
        form.elements.namedItem('preset').value='medium';
        update();
      })
    );
    update();
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});
  else init();
})(typeof window!=='undefined'?window:null);
