/* WWZ public first-visit acknowledgement, 2026-11-13.
 * Visitor acknowledgement remains local; authenticated Discord members also
 * receive a separate server-verified acceptance prompt in the Command Centre.
 * Neither acceptance represents blanket consent for unrelated data uses.
 */
(function (root) {
  'use strict';
  const POLICY_REVISION='2026-11-13.1';
  const STORAGE_KEY='wwz:website:policy-ack:v1';
  const EXEMPT=new Set(['legal.html','terms.html','privacy.html',
    'rules.html','community-guidelines.html','moderation-policy.html','404.html','offline.html']);
  const read=(storage)=>{
    try {
      const value=JSON.parse(storage?.getItem(STORAGE_KEY)||'null');
      return value && value.version===POLICY_REVISION&&
        value.agreedToTerms===true&&value.acknowledgedPrivacy===true;
    }catch(_){return false;}
  };
  const pages=()=>String(root?.location?.pathname||'').split('/').pop().toLowerCase()||'index.html';
  const helpers=Object.freeze({POLICY_REVISION,STORAGE_KEY,EXEMPT,read});
  if(typeof module==='object'&&module.exports)module.exports=helpers;
  if(typeof document==='undefined'||!root||EXEMPT.has(pages()))return;
  const init=()=>{
    const alreadyAccepted=(()=>{
      try{return read(root.localStorage)||read(root.sessionStorage);}
      catch(_){return false;}
    })();
    if(document.getElementById('wwz-policy-gate')||alreadyAccepted)return;
    const dialog=document.createElement('dialog');
    dialog.id='wwz-policy-gate';dialog.className='wwz-policy-gate';
    dialog.setAttribute('aria-labelledby','wwz-policy-gate-heading');
    dialog.setAttribute('aria-describedby','wwz-policy-gate-description');
    const wrapper=document.createElement('div');
    wrapper.className='wwz-policy-content';

    const eyebrow=document.createElement('p');
    eyebrow.className='wwz-policy-eyebrow';eyebrow.textContent='WORLD WAR Z / COMMUNITY ACCESS';
    const title=document.createElement('h2');title.id='wwz-policy-gate-heading';
    title.textContent='Review the community policies';
    const description=document.createElement('p');description.id='wwz-policy-gate-description';
    description.textContent='Before using the World War Z website, please read our current rules and terms. The privacy notice explains Discord account data, shop activity and DayZ GPS/route history.';
    const notice=document.createElement('p');
    notice.className='wwz-policy-notice';
    notice.textContent='This first-visit acknowledgement is saved in your browser. After Discord sign-in and server selection, a separate account-linked acceptance is stored by Railway for that server.';

    const links=document.createElement('nav');
    links.setAttribute('aria-label','Read community policies');
    links.className='wwz-policy-links';
    for(const [title,url] of [
      ['Terms of Service','terms.html'],
      ['Privacy Policy','privacy.html'],
      ['Server Rules','rules.html'],
      ['Community Guidelines','community-guidelines.html'],
      ['Moderation & Appeals','moderation-policy.html']
    ]){
      const a=document.createElement('a');
      a.href=url;a.target='_blank';a.rel='noopener noreferrer';
      a.textContent=title;links.append(a);
    }
    const agreement=document.createElement('label');
    agreement.className='wwz-policy-check';
    const agreeInput=document.createElement('input');
    agreeInput.type='checkbox';agreeInput.id='wwz-policy-agree';
    const agreeText=document.createElement('span');
    agreeText.textContent='I agree to the Terms of Service, current server rules and Community Guidelines.';
    agreement.append(agreeInput,agreeText);
    const privacy=document.createElement('label');
    privacy.className='wwz-policy-check';
    const privacyInput=document.createElement('input');
    privacyInput.type='checkbox';privacyInput.id='wwz-policy-privacy';
    const privacyText=document.createElement('span');
    privacyText.textContent='I acknowledge that I have been given access to the Privacy Policy, including the explanation of GPS history and authorised staff access.';
    privacy.append(privacyInput,privacyText);

    const actions=document.createElement('div');actions.className='wwz-policy-actions';
    const decline=document.createElement('a');decline.href='legal.html';
    decline.className='wwz-policy-decline';decline.textContent='Not now · view policies';
    const accept=document.createElement('button');accept.type='button';
    accept.className='wwz-policy-accept';accept.disabled=true;accept.textContent='Accept and continue';
    actions.append(decline,accept);
    const status=document.createElement('p');status.className='wwz-policy-status';
    status.setAttribute('role','status');status.setAttribute('aria-live','polite');
    const update=()=>{accept.disabled=!(agreeInput.checked&&privacyInput.checked);};
    agreeInput.addEventListener('change',update);
    privacyInput.addEventListener('change',update);
    dialog.addEventListener('cancel',event=>event.preventDefault());
    accept.addEventListener('click',()=>{
      if(accept.disabled)return;
      const value={version:POLICY_REVISION,agreedToTerms:true,
        acknowledgedPrivacy:true,acceptedAt:new Date().toISOString()};
      let saved=false;
      try {root.localStorage.setItem(STORAGE_KEY,JSON.stringify(value));saved=true;}
      catch (_) {
        // When persistent storage is disabled, use the current-tab acknowledgement.
        try{root.sessionStorage.setItem(STORAGE_KEY,JSON.stringify(value));saved=true;}
        catch(_){}
      }
      if(!saved){
        status.textContent='Browser storage is disabled. You can continue this visit, but the notice may appear again next time.';
      }
      document.body.classList.remove('wwz-policy-pending');
      if(typeof dialog.close==='function')dialog.close();
      else dialog.hidden=true;
      dialog.remove();
    });
    wrapper.append(eyebrow,title,description,links,notice,agreement,privacy,actions,status);
    dialog.append(wrapper);document.body.append(dialog);
    document.body.classList.add('wwz-policy-pending');
    if(typeof dialog.showModal==='function')dialog.showModal();
    else {dialog.setAttribute('open','');}
    agreeInput.focus();
  };
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});
  else init();
})(typeof window!=='undefined'?window:null);
