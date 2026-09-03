(() => {
  'use strict';
  if (window.__wwzCommunityReady) return;
  const root = document.querySelector('[data-community-root]');
  if (!root) return;

  const API = {
    overview: `${DASHBOARD_API_BASE}/api/community/overview`,
    preferences: `${DASHBOARD_API_BASE}/api/account/notifications`,
    preferencesAction: `${DASHBOARD_API_BASE}/api/account/notifications/action`,
    admin: `${DASHBOARD_API_BASE}/api/admin/community`,
    adminAction: `${DASHBOARD_API_BASE}/api/admin/community/action`,
  };
  const token = () => { try { return storageGet(AUTH_SESSION_KEY) || ''; } catch { return ''; } };
  const esc = (value) => String(value ?? '').replace(/[&<>'"]/g, (c) => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
  const fmtDate = (value) => { const d=new Date(value); return Number.isNaN(d.getTime())?'—':d.toLocaleString([], {dateStyle:'medium',timeStyle:'short'}); };
  const topicLabels = {
    events:['Event reminders','Scheduled event reminders, starts and finishes.'],
    server_status:['Server status','Meaningful online, restarting and offline changes.'],
    tickets:['Ticket replies','Updates to your private support tickets.'],
    operations:['PvE/PvP rotations','Chernarus expeditions and Livonia hotspot rotations.'],
    shop:['Shop and orders','Order, delivery and fulfilment status changes.'],
    admin_health:['Admin health alerts','Admin-only operational warnings, critical conditions and recoveries.'],
  };
  let active=false, refreshTimer=null, overview=null, preferencePayload=null, adminPayload=null;

  const qs = (sel) => root.querySelector(sel);
  const status = qs('[data-community-status]');
  const setStatus = (message='', tone='') => { if(!status)return; status.hidden=!message; status.textContent=message; status.dataset.tone=tone; };
  const request = async (url, options={}, requireAuth=false) => {
    const headers={Accept:'application/json',...(options.body?{'Content-Type':'application/json'}:{}),...(options.headers||{})};
    const session=token();
    if(requireAuth && !session) throw new Error('Sign in with Discord to continue.');
    if(session) headers.Authorization=`Bearer ${session}`;
    const response=await authFetch(url,{cache:'no-store',...options,headers});
    const payload=await response.json().catch(()=>({}));
    if(!response.ok || payload.status!=='ok') throw new Error(payload.message || `Request failed (${response.status}).`);
    return payload;
  };

  const renderAnalytics = (payload) => {
    const a=payload.analytics||{}, s=a.summary||{}, p=a.players||{}, perf=payload.performance||{};
    qs('[data-community-map-name]').textContent=payload.map_name||'Current server';
    qs('[data-community-online]').textContent=Number(p.online||0).toLocaleString();
    qs('[data-community-profiles]').textContent=Number(p.profiles||0).toLocaleString();
    qs('[data-community-activity]').textContent=Number(s.activity||0).toLocaleString();
    qs('[data-community-participants]').textContent=Number(s.unique_participants||0).toLocaleString();
    const extra=qs('[data-community-extra-metrics]');
    if(extra){
      const rows=payload.map_key==='chernarus'
        ? [['Discoveries',s.discoveries||0,'Passport discoveries'],['Operations',s.operations_completed||0,'Completed journeys']]
        : [['Confirmed PvP',s.confirmed_pvp_kills||0,'ADM-confirmed player kills'],['Tracked playtime',`${Number(p.tracked_playtime_hours||0).toLocaleString()}h`,'Server profiles']];
      extra.innerHTML=rows.map(([label,value,detail])=>`<div class="community-metric"><span>${esc(label)}</span><strong>${esc(value)}</strong><small>${esc(detail)}</small></div>`).join('');
    }
    const perfEl=qs('[data-community-performance]');
    if(perfEl){
      const avg=perf.average_fps ?? perf.avg_fps ?? perf.average ?? null;
      const samples=Number(perf.samples||0);
      perfEl.innerHTML=`<strong>${avg!==null?`${Number(avg).toFixed(1)} FPS`:'Awaiting samples'}</strong><small>${samples} server performance samples in the last 24 hours</small>`;
    }
    const timeline=a.timeline||[]; const max=Math.max(1,...timeline.map(r=>Number(r.activity||0)));
    const chart=qs('[data-community-chart]');
    if(chart) chart.innerHTML=timeline.map(r=>`<div class="community-chart-column" title="${esc(r.day)}: ${Number(r.activity||0)} activity"><i class="community-chart-bar" style="height:${Math.max(3,Math.round(Number(r.activity||0)/max*100))}%"></i><small>${esc(String(r.day||'').slice(5))}</small></div>`).join('')||'<p class="community-empty">No activity has been recorded in this period yet.</p>';
    const locations=qs('[data-community-locations]');
    if(locations) locations.innerHTML=(a.top_locations||[]).map((r,i)=>`<div class="community-row"><span>${i+1}</span><strong>${esc(r.name||r.location_key||'Location')}</strong><b>${Number(r.activity||0).toLocaleString()}</b><small>${Number(r.participants||0)} participants</small></div>`).join('')||'<p class="community-empty">Location analytics will appear as activity is recorded.</p>';
  };

  const renderEvents = (events=[]) => {
    const el=qs('[data-community-events]'); if(!el)return;
    el.innerHTML=events.map(e=>`<article class="community-event-card" data-status="${esc(e.status)}"><div class="community-event-top"><div><span class="community-tag ${esc(e.status)}">${esc(e.status)}</span><h4>${esc(e.title)}</h4></div><b>${esc(fmtDate(e.starts_at))}</b></div><p>${esc(e.description||'Community event')}</p><div class="community-event-meta"><span>${esc(e.location_label||'Server-wide')}</span><span>Ends ${esc(fmtDate(e.ends_at))}</span></div></article>`).join('')||'<p class="community-empty">No scheduled community events right now.</p>';
  };

  const renderTopics = (push={}) => {
    const list=qs('[data-community-topics]'); if(!list)return;
    const enabled=new Set(push.topics||[]); const available=push.available_topics||Object.keys(topicLabels);
    list.innerHTML=available.map(topic=>{const [label,detail]=topicLabels[topic]||[topic,topic];return `<label class="community-topic"><input type="checkbox" data-community-topic="${esc(topic)}" ${enabled.has(topic)?'checked':''}><span><strong>${esc(label)}</strong><small>${esc(detail)}</small></span></label>`;}).join('');
    const state=qs('[data-community-push-state]');
    if(state) state.textContent=!push.server_enabled?'Railway VAPID keys are not configured yet.':push.subscribed?`Enabled on ${Number(push.devices||0)} browser device(s).`:'Available on this browser after you opt in.';
  };

  const loadOverview = async () => { overview=await request(`${API.overview}?days=14`); renderAnalytics(overview); renderEvents(overview.events||[]); };
  const loadPreferences = async () => {
    if(!token()){ renderTopics({server_enabled:false,available_topics:Object.keys(topicLabels)}); return; }
    preferencePayload=await request(API.preferences,{},true); renderTopics(preferencePayload.push||{});
  };
  const loadAdmin = async () => {
    if(!['staff','owner'].includes(dashboardAccessLevel) || !token()) return;
    adminPayload=await request(API.admin,{},true); renderPlanner(adminPayload);
  };

  const urlBase64ToUint8Array = (base64String) => {
    const padding='='.repeat((4-base64String.length%4)%4); const base64=(base64String+padding).replace(/-/g,'+').replace(/_/g,'/');
    const rawData=atob(base64); return Uint8Array.from([...rawData].map(c=>c.charCodeAt(0)));
  };
  const selectedTopics = () => [...root.querySelectorAll('[data-community-topic]:checked')].map(el=>el.dataset.communityTopic);
  const ensurePushSubscription = async () => {
    if(!('serviceWorker' in navigator) || !('PushManager' in window) || !('Notification' in window)) throw new Error('This browser does not support Web Push.');
    if(!preferencePayload?.push?.server_enabled) throw new Error('Web Push is waiting for Railway VAPID configuration.');
    const permission=await Notification.requestPermission(); if(permission!=='granted') throw new Error('Browser notification permission was not granted.');
    const registration=await navigator.serviceWorker.ready; let subscription=await registration.pushManager.getSubscription();
    if(!subscription) subscription=await registration.pushManager.subscribe({userVisibleOnly:true,applicationServerKey:urlBase64ToUint8Array(preferencePayload.push.public_key)});
    await request(API.preferencesAction,{method:'POST',body:JSON.stringify({action:'subscribe',subscription:subscription.toJSON(),topics:selectedTopics()})},true);
  };
  const savePreferences = async () => request(API.preferencesAction,{method:'POST',body:JSON.stringify({action:'preferences',topics:selectedTopics()})},true);
  const disablePush = async () => {
    let endpoint=''; if('serviceWorker' in navigator){const registration=await navigator.serviceWorker.ready;const sub=await registration.pushManager?.getSubscription();if(sub){endpoint=sub.endpoint;await sub.unsubscribe();}}
    await request(API.preferencesAction,{method:'POST',body:JSON.stringify({action:'unsubscribe',endpoint})},true);
  };

  const plannerForm = qs('[data-community-template-form]');
  const renderPlanner = (payload={}) => {
    const ownerEditor=qs('[data-community-owner-editor]'); if(ownerEditor) ownerEditor.hidden=dashboardAccessLevel!=='owner';
    const templateSelect=qs('[data-community-template-select]');
    if(templateSelect) templateSelect.innerHTML='<option value="">Choose an event plan…</option>'+(payload.templates||[]).filter(t=>t.enabled).map(t=>`<option value="${Number(t.id)}">${esc(t.name)}</option>`).join('');
    const channel=qs('[data-community-channel]');
    const channelOptions=(payload.channels||[]).map(c=>`<option value="${esc(c.id||'')}">${esc(c.category?`${c.category} / ${c.name}`:c.name||'Discord channel')}</option>`).join('');
    if(channel) channel.innerHTML='<option value="">Use template channel</option>'+channelOptions;
    const templateChannel=qs('[data-community-template-channel]');
    if(templateChannel) templateChannel.innerHTML='<option value="">No Discord announcement</option>'+channelOptions;
    const list=qs('[data-community-templates]');
    if(list) list.innerHTML=(payload.templates||[]).map(t=>`<article class="community-template-card"><div class="community-event-top"><div><span class="community-tag ${t.enabled?'':'completed'}">${t.enabled?'enabled':'disabled'}</span><strong>${esc(t.name)}</strong></div><span>${Number(t.duration_minutes||60)}m</span></div><small>${esc(t.title)} · ${esc(t.location_label||'Server-wide')}</small>${dashboardAccessLevel==='owner'?`<div class="community-actions"><button class="secondary-action compact-action" data-edit-template="${Number(t.id)}" type="button">Edit</button><button class="danger-action compact-action" data-delete-template="${Number(t.id)}" type="button">Delete</button></div>`:''}</article>`).join('')||'<p class="community-empty">No reusable event plans yet.</p>';
    const runs=qs('[data-community-admin-runs]');
    if(runs) runs.innerHTML=(payload.runs||[]).filter(r=>['scheduled','active'].includes(r.status)).map(r=>`<article class="community-event-card" data-status="${esc(r.status)}"><div class="community-event-top"><strong>${esc(r.title)}</strong><span class="community-tag ${esc(r.status)}">${esc(r.status)}</span></div><small>${esc(fmtDate(r.starts_at))} · ${esc(r.location_label||'Server-wide')}</small><div class="community-actions"><button class="danger-action compact-action" data-cancel-run="${Number(r.id)}" type="button">Cancel</button></div></article>`).join('')||'<p class="community-empty">No active or scheduled event runs.</p>';
    root.querySelectorAll('[data-edit-template]').forEach(btn=>btn.addEventListener('click',()=>fillTemplate(Number(btn.dataset.editTemplate))));
    root.querySelectorAll('[data-delete-template]').forEach(btn=>btn.addEventListener('click',()=>adminAction({action:'template_delete',template_id:Number(btn.dataset.deleteTemplate)})));
    root.querySelectorAll('[data-cancel-run]').forEach(btn=>btn.addEventListener('click',()=>adminAction({action:'cancel_run',run_id:Number(btn.dataset.cancelRun)})));
  };
  const fillTemplate = (id) => {
    const t=(adminPayload?.templates||[]).find(row=>Number(row.id)===Number(id)); if(!t||!plannerForm)return;
    plannerForm.elements.template_id.value=t.id; plannerForm.elements.name.value=t.name||''; plannerForm.elements.title.value=t.title||''; plannerForm.elements.description.value=t.description||''; plannerForm.elements.location_label.value=t.location_label||''; plannerForm.elements.x.value=t.x??''; plannerForm.elements.z.value=t.z??''; plannerForm.elements.duration_minutes.value=t.duration_minutes||60; plannerForm.elements.reminder_minutes.value=t.reminder_minutes||30; plannerForm.elements.discord_channel_id.value=t.discord_channel_id||''; plannerForm.elements.announcement_text.value=t.announcement_text||''; plannerForm.elements.enabled.checked=Boolean(t.enabled); plannerForm.scrollIntoView({behavior:'smooth',block:'center'});
  };
  const adminAction = async (body) => { const result=await request(API.adminAction,{method:'POST',body:JSON.stringify(body)},true); setStatus(result.message||'Saved.','success'); await Promise.all([loadAdmin(),loadOverview()]); };

  plannerForm?.addEventListener('submit', async (event)=>{event.preventDefault();if(dashboardAccessLevel!=='owner')return;const f=new FormData(plannerForm);const template={name:f.get('name'),title:f.get('title'),description:f.get('description'),location_label:f.get('location_label'),x:f.get('x'),z:f.get('z'),duration_minutes:f.get('duration_minutes'),reminder_minutes:f.get('reminder_minutes'),discord_channel_id:f.get('discord_channel_id'),announcement_text:f.get('announcement_text'),enabled:plannerForm.elements.enabled.checked};try{await adminAction({action:'template_save',template_id:f.get('template_id')||null,template});plannerForm.reset();plannerForm.elements.template_id.value='';plannerForm.elements.enabled.checked=true;}catch(e){setStatus(e.message,'error');}});
  qs('[data-community-schedule]')?.addEventListener('click',async()=>{const id=Number(qs('[data-community-template-select]')?.value||0);const local=qs('[data-community-starts]')?.value;if(!id||!local){setStatus('Choose an event plan and start time.','error');return;}const starts=new Date(local).toISOString();try{await adminAction({action:'schedule',template_id:id,starts_at:starts,overrides:{discord_channel_id:qs('[data-community-channel]')?.value||''}});}catch(e){setStatus(e.message,'error');}});
  qs('[data-community-start-now]')?.addEventListener('click',async()=>{const id=Number(qs('[data-community-template-select]')?.value||0);if(!id){setStatus('Choose an event plan first.','error');return;}try{await adminAction({action:'start_now',template_id:id,overrides:{discord_channel_id:qs('[data-community-channel]')?.value||''}});}catch(e){setStatus(e.message,'error');}});
  qs('[data-community-test-push]')?.addEventListener('click',async()=>{try{await adminAction({action:'test_push'});}catch(e){setStatus(e.message,'error');}});
  qs('[data-community-enable-push]')?.addEventListener('click',async()=>{try{await ensurePushSubscription();setStatus('Browser notifications are enabled.','success');await loadPreferences();}catch(e){setStatus(e.message,'error');}});
  qs('[data-community-save-push]')?.addEventListener('click',async()=>{try{const r=await savePreferences();setStatus(r.message||'Preferences updated.','success');await loadPreferences();}catch(e){setStatus(e.message,'error');}});
  qs('[data-community-disable-push]')?.addEventListener('click',async()=>{try{await disablePush();setStatus('Browser notifications disabled.','success');await loadPreferences();}catch(e){setStatus(e.message,'error');}});
  qs('[data-community-refresh]')?.addEventListener('click',()=>refresh(true));
  qs('[data-community-clear-template]')?.addEventListener('click',()=>{plannerForm?.reset();if(plannerForm){plannerForm.elements.template_id.value='';plannerForm.elements.enabled.checked=true;}});

  const refresh = async (loud=false) => { try{await Promise.all([loadOverview(),loadPreferences(),loadAdmin()]);if(loud)setStatus('Community data refreshed.','success');}catch(e){setStatus(e.message,'error');} };
  const activate = ({section=''}={}) => { active=true; refresh(); clearInterval(refreshTimer); refreshTimer=setInterval(()=>{if(active)loadOverview().catch(()=>{});},60000); if(section==='planner' && !['staff','owner'].includes(dashboardAccessLevel)) setStatus('Staff access is required for Event Planner.','error'); };
  window.addEventListener('wwz:viewchange',(event)=>{if(event.detail?.view==='community') activate(event.detail); else active=false;});
  window.addEventListener('wwz:serverchange',()=>{if(active)refresh();});
  window.addEventListener('wwz:authchange',()=>{if(active)refresh();});
  window.__wwzCommunityReady=true;
  window.WWZCommunity=Object.freeze({activate,refresh});
})();
