(() => {
  'use strict';
  if (window.__wwzCommunityReady) return;
  const root = document.querySelector('[data-community-root]');
  if (!root) return;

  const API = {
    overview: `${DASHBOARD_API_BASE}/api/community/overview`,
    accountEvents: `${DASHBOARD_API_BASE}/api/account/events`,
    accountEventAction: `${DASHBOARD_API_BASE}/api/account/events/action`,
    preferences: `${DASHBOARD_API_BASE}/api/account/notifications`,
    preferencesAction: `${DASHBOARD_API_BASE}/api/account/notifications/action`,
    admin: `${DASHBOARD_API_BASE}/api/admin/community`,
    adminDetail: `${DASHBOARD_API_BASE}/api/admin/community/event`,
    adminAction: `${DASHBOARD_API_BASE}/api/admin/community/action`,
  };
  const token = () => { try { return storageGet(AUTH_SESSION_KEY) || ''; } catch { return ''; } };
  const esc = (value) => String(value ?? '').replace(/[&<>'"]/g, (c) => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
  const fmtDate = (value) => { const d = new Date(value); return Number.isNaN(d.getTime()) ? '—' : d.toLocaleString([], {dateStyle:'medium',timeStyle:'short'}); };
  const money = (value) => Number(value || 0).toLocaleString();
  const topicLabels = {
    events:['Event reminders','Scheduled events, reminders, starts, finishes and published results.'],
    server_status:['Server status','Meaningful online, restarting and offline changes.'],
    tickets:['Ticket replies','Updates to your private support tickets.'],
    operations:['PvE/PvP rotations','Chernarus expeditions and Livonia hotspot rotations.'],
    shop:['Shop and orders','Order, delivery and fulfilment status changes.'],
    admin_health:['Admin health alerts','Admin-only operational warnings, critical conditions and recoveries.'],
  };
  let active = false, refreshTimer = null, overview = null, preferencePayload = null, adminPayload = null, accountPayload = null, selectedRunId = null;

  const qs = (sel) => root.querySelector(sel);
  const status = qs('[data-community-status]');
  const setStatus = (message='', tone='') => { if (!status) return; status.hidden = !message; status.textContent = message; status.dataset.tone = tone; };
  const request = async (url, options={}, requireAuth=false) => {
    const headers = {Accept:'application/json', ...(options.body ? {'Content-Type':'application/json'} : {}), ...(options.headers || {})};
    const session = token();
    if (requireAuth && !session) throw new Error('Sign in with Discord to continue.');
    if (session) headers.Authorization = `Bearer ${session}`;
    const response = await authFetch(url, {cache:'no-store', ...options, headers});
    const payload = await response.json().catch(() => ({}));
    if (!response.ok || payload.status !== 'ok') throw new Error(payload.message || `Request failed (${response.status}).`);
    return payload;
  };

  const rewardsText = (e) => {
    const parts=[];
    if (Number(e.attendance_xp||0) || Number(e.attendance_money||0)) parts.push(`Attendance: ${Number(e.attendance_xp||0)?`${money(e.attendance_xp)} XP`:''}${Number(e.attendance_xp||0)&&Number(e.attendance_money||0)?' + ':''}${Number(e.attendance_money||0)?`$${money(e.attendance_money)}`:''}`);
    if (Number(e.winner_xp||0) || Number(e.winner_money||0)) parts.push(`Winner: ${Number(e.winner_xp||0)?`${money(e.winner_xp)} XP`:''}${Number(e.winner_xp||0)&&Number(e.winner_money||0)?' + ':''}${Number(e.winner_money||0)?`$${money(e.winner_money)}`:''}`);
    return parts.join(' · ');
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
    if(perfEl){const avg=perf.average_fps??perf.avg_fps??perf.average??null;const samples=Number(perf.samples||0);perfEl.innerHTML=`<strong>${avg!==null?`${Number(avg).toFixed(1)} FPS`:'Awaiting samples'}</strong><small>${samples} server performance samples in the last 24 hours</small>`;}
    const timeline=a.timeline||[]; const max=Math.max(1,...timeline.map(r=>Number(r.activity||0))); const chart=qs('[data-community-chart]');
    if(chart) chart.innerHTML=timeline.map(r=>`<div class="community-chart-column" title="${esc(r.day)}: ${Number(r.activity||0)} activity"><i class="community-chart-bar" style="height:${Math.max(3,Math.round(Number(r.activity||0)/max*100))}%"></i><small>${esc(String(r.day||'').slice(5))}</small></div>`).join('')||'<p class="community-empty">No activity has been recorded in this period yet.</p>';
    const locations=qs('[data-community-locations]');
    if(locations) locations.innerHTML=(a.top_locations||[]).map((r,i)=>`<div class="community-row"><span>${i+1}</span><strong>${esc(r.name||r.location_key||'Location')}</strong><b>${Number(r.activity||0).toLocaleString()}</b><small>${Number(r.participants||0)} participants</small></div>`).join('')||'<p class="community-empty">Location analytics will appear as activity is recorded.</p>';
  };

  const accountSignupMap = () => new Map((accountPayload?.signups||[]).map(s => [Number(s.run_id), s]));
  const renderEvents = (events=[]) => {
    const el=qs('[data-community-events]'); if(!el)return;
    const signupMap=accountSignupMap();
    el.innerHTML=events.map(e=>{
      const own=signupMap.get(Number(e.id)); const signupEnabled=Boolean(e.signup_enabled); const capacity=Number(e.capacity||0); const registered=Number(e.registered_count||0); const wait=Number(e.waitlist_count||0);
      const signupText=signupEnabled?`${registered}${capacity?` / ${capacity}`:''} going${wait?` · ${wait} waitlisted`:''}`:'Signups disabled';
      const reward=rewardsText(e); const img=e.banner_url?`<img class="community-event-banner" src="${esc(e.banner_url)}" alt="" loading="lazy">`:'';
      let action='';
      if(token() && signupEnabled){
        if(own && ['registered','waitlisted','attended'].includes(String(own.status))) action=`<button class="secondary-action compact-action" data-event-withdraw="${Number(e.id)}" type="button">Withdraw (${esc(String(own.status).replace('_',' '))})</button>`;
        else action=`<button class="primary-action compact-action" data-event-signup="${Number(e.id)}" type="button">${capacity&&registered>=capacity?'Join Waitlist':'Sign Up'}</button>`;
      }
      return `<article class="community-event-card community-event-rich" data-status="${esc(e.status)}">${img}<div class="community-event-top"><div><span class="community-tag ${esc(e.status)}">${esc(e.status)}</span>${e.category?`<span class="community-tag community-category">${esc(e.category)}</span>`:''}<h4>${esc(e.title)}</h4></div><b>${esc(fmtDate(e.starts_at))}</b></div><p>${esc(e.description||'Community event')}</p><div class="community-event-meta"><span>📍 ${esc(e.location_label||'Server-wide')}</span>${e.loadout_label?`<span>🎒 ${esc(e.loadout_label)}</span>`:''}<span>👥 ${esc(signupText)}</span><span>Ends ${esc(fmtDate(e.ends_at))}</span></div>${reward?`<div class="community-event-rewards"><strong>Rewards</strong><span>${esc(reward)}</span></div>`:''}${e.rules_text?`<details class="community-event-rules"><summary>Event rules</summary><p>${esc(e.rules_text)}</p></details>`:''}${action?`<div class="community-actions">${action}</div>`:''}</article>`;
    }).join('')||'<p class="community-empty">No scheduled community events right now.</p>';
    qs('[data-community-event-count]').textContent=String(events.length);
    el.querySelectorAll('[data-event-signup]').forEach(btn=>btn.addEventListener('click',()=>memberEventAction('signup',Number(btn.dataset.eventSignup))));
    el.querySelectorAll('[data-event-withdraw]').forEach(btn=>btn.addEventListener('click',()=>memberEventAction('withdraw',Number(btn.dataset.eventWithdraw))));
  };

  const renderMySignups = () => {
    const el=qs('[data-community-my-signups]'); if(!el)return;
    if(!token()){el.innerHTML='<p class="community-empty">Sign in with Discord to register for community events.</p>';qs('[data-community-my-count]').textContent='0';return;}
    const activeRows=(accountPayload?.signups||[]).filter(s=>s.status!=='withdrawn'&&['scheduled','active'].includes(s.run_status));
    qs('[data-community-my-count]').textContent=String(activeRows.length);
    el.innerHTML=activeRows.map(s=>`<article class="community-template-card"><div class="community-event-top"><strong>${esc(s.title||'Event')}</strong><span class="community-tag ${esc(s.status)}">${esc(String(s.status||'registered').replace('_',' '))}</span></div><small>${esc(fmtDate(s.starts_at))} · ${esc(s.location_label||'Server-wide')}</small><div class="community-actions"><button class="secondary-action compact-action" data-my-withdraw="${Number(s.run_id)}" type="button">Withdraw</button></div></article>`).join('')||'<p class="community-empty">You have no active event registrations.</p>';
    el.querySelectorAll('[data-my-withdraw]').forEach(btn=>btn.addEventListener('click',()=>memberEventAction('withdraw',Number(btn.dataset.myWithdraw))));
  };

  const renderResults = (results=[]) => {
    const el=qs('[data-community-results]'); if(!el)return;
    qs('[data-community-result-count]').textContent=String(results.length);
    el.innerHTML=results.map(r=>`<article class="community-result-card"><div class="community-event-top"><strong>${esc(r.title||'Event')}</strong><span class="community-tag completed">result</span></div>${r.winner_name?`<p><b>Winner:</b> ${esc(r.winner_name)}</p>`:''}<p>${esc(r.result_summary||'Results published.')}</p><small>${esc(fmtDate(r.result_published_at||r.ends_at))}</small></article>`).join('')||'<p class="community-empty">No published event results yet.</p>';
  };

  const renderTopics = (push={}) => {
    const list=qs('[data-community-topics]'); if(!list)return;
    const enabled=new Set(push.topics||[]); const available=push.available_topics||Object.keys(topicLabels);
    list.innerHTML=available.map(topic=>{const [label,detail]=topicLabels[topic]||[topic,topic];return `<label class="community-topic"><input type="checkbox" data-community-topic="${esc(topic)}" ${enabled.has(topic)?'checked':''}><span><strong>${esc(label)}</strong><small>${esc(detail)}</small></span></label>`;}).join('');
    const state=qs('[data-community-push-state]'); if(state) state.textContent=!push.server_enabled?'Railway VAPID keys are not configured yet.':push.subscribed?`Enabled on ${Number(push.devices||0)} browser device(s).`:'Available on this browser after you opt in.';
  };

  const loadOverview = async () => { overview=await request(`${API.overview}?days=14`); renderAnalytics(overview); renderResults(overview.results||[]); renderEvents(overview.events||[]); };
  const loadAccountEvents = async () => { if(!token()){accountPayload=null;renderMySignups();renderEvents(overview?.events||[]);return;} accountPayload=await request(API.accountEvents,{},true);renderMySignups();renderEvents(overview?.events||[]); };
  const memberEventAction = async (action, runId) => { try{const r=await request(API.accountEventAction,{method:'POST',body:JSON.stringify({action,run_id:runId})},true);setStatus(r.message||'Event registration updated.','success');await Promise.all([loadAccountEvents(),loadOverview()]);}catch(e){setStatus(e.message,'error');} };

  const loadPreferences = async () => { if(!token()){renderTopics({server_enabled:false,available_topics:Object.keys(topicLabels)});return;} preferencePayload=await request(API.preferences,{},true);renderTopics(preferencePayload.push||{}); };
  const loadAdmin = async () => { if(!['staff','owner'].includes(dashboardAccessLevel)||!token()) return; adminPayload=await request(API.admin,{},true);renderPlanner(adminPayload); };

  const urlBase64ToUint8Array = (base64String) => {const padding='='.repeat((4-base64String.length%4)%4);const base64=(base64String+padding).replace(/-/g,'+').replace(/_/g,'/');const rawData=atob(base64);return Uint8Array.from([...rawData].map(c=>c.charCodeAt(0)));};
  const selectedTopics = () => [...root.querySelectorAll('[data-community-topic]:checked')].map(el=>el.dataset.communityTopic);
  const ensurePushSubscription = async () => {if(!('serviceWorker'in navigator)||!('PushManager'in window)||!('Notification'in window))throw new Error('This browser does not support Web Push.');if(!preferencePayload?.push?.server_enabled)throw new Error('Web Push is waiting for Railway VAPID configuration.');const permission=await Notification.requestPermission();if(permission!=='granted')throw new Error('Browser notification permission was not granted.');const registration=await navigator.serviceWorker.ready;let subscription=await registration.pushManager.getSubscription();if(!subscription)subscription=await registration.pushManager.subscribe({userVisibleOnly:true,applicationServerKey:urlBase64ToUint8Array(preferencePayload.push.public_key)});await request(API.preferencesAction,{method:'POST',body:JSON.stringify({action:'subscribe',subscription:subscription.toJSON(),topics:selectedTopics()})},true);};
  const savePreferences = async () => request(API.preferencesAction,{method:'POST',body:JSON.stringify({action:'preferences',topics:selectedTopics()})},true);
  const disablePush = async () => {let endpoint='';if('serviceWorker'in navigator){const registration=await navigator.serviceWorker.ready;const sub=await registration.pushManager?.getSubscription();if(sub){endpoint=sub.endpoint;await sub.unsubscribe();}}await request(API.preferencesAction,{method:'POST',body:JSON.stringify({action:'unsubscribe',endpoint})},true);};

  const plannerForm=qs('[data-community-template-form]'); const locationForm=qs('[data-community-location-form]'); const loadoutForm=qs('[data-community-loadout-form]');
  const optionList=(rows,label='name')=>rows.filter(r=>r.enabled).map(r=>`<option value="${Number(r.id)}">${esc(r[label]||r.name)}</option>`).join('');
  const renderPlanner = (payload={}) => {
    const owner=dashboardAccessLevel==='owner';
    const ownerEditor=qs('[data-community-owner-editor]');if(ownerEditor)ownerEditor.hidden=!owner;
    const ownerPresets=qs('[data-community-owner-presets]');if(ownerPresets)ownerPresets.hidden=!owner;
    const templateSelect=qs('[data-community-template-select]');if(templateSelect)templateSelect.innerHTML='<option value="">Choose an event plan…</option>'+optionList(payload.templates||[]);
    const channelOptions=(payload.channels||[]).map(c=>`<option value="${esc(c.id||'')}">${esc(c.category?`${c.category} / ${c.name}`:c.name||'Discord channel')}</option>`).join('');
    const channel=qs('[data-community-channel]');if(channel)channel.innerHTML='<option value="">Use template channel</option>'+channelOptions;
    const templateChannel=qs('[data-community-template-channel]');if(templateChannel)templateChannel.innerHTML='<option value="">No Discord announcement</option>'+channelOptions;
    const locationSelect=qs('[data-community-template-location]');if(locationSelect)locationSelect.innerHTML='<option value="">Custom / server-wide</option>'+optionList(payload.locations||[],'label');
    const loadoutSelect=qs('[data-community-template-loadout]');if(loadoutSelect)loadoutSelect.innerHTML='<option value="">No preset</option>'+optionList(payload.loadouts||[]);

    const list=qs('[data-community-templates]');
    if(list)list.innerHTML=(payload.templates||[]).map(t=>`<article class="community-template-card"><div class="community-event-top"><div><span class="community-tag ${t.enabled?'':'completed'}">${t.enabled?'enabled':'disabled'}</span><strong>${esc(t.name)}</strong></div><span>${Number(t.duration_minutes||60)}m</span></div><small>${esc(t.title)} · ${esc(t.location_label||'Server-wide')} · ${Number(t.capacity||0)?`${Number(t.capacity)} cap`:'unlimited'}</small>${owner?`<div class="community-actions"><button class="secondary-action compact-action" data-edit-template="${Number(t.id)}" type="button">Edit</button><button class="danger-action compact-action" data-delete-template="${Number(t.id)}" type="button">Delete</button></div>`:''}</article>`).join('')||'<p class="community-empty">No reusable event plans yet.</p>';

    const runs=qs('[data-community-admin-runs]');
    if(runs)runs.innerHTML=(payload.runs||[]).filter(r=>['scheduled','active'].includes(r.status)).map(r=>`<article class="community-event-card community-admin-run ${Number(r.id)===Number(selectedRunId)?'is-selected':''}" data-status="${esc(r.status)}"><div class="community-event-top"><strong>#${Number(r.id)} · ${esc(r.title)}</strong><span class="community-tag ${esc(r.status)}">${esc(r.status)}</span></div><small>${esc(fmtDate(r.starts_at))} · ${esc(r.location_label||'Server-wide')} · ${Number(r.registered_count||0)} going${Number(r.waitlist_count||0)?` · ${Number(r.waitlist_count)} waitlisted`:''}</small><div class="community-actions"><button class="secondary-action compact-action" data-manage-run="${Number(r.id)}" type="button">Attendance / Results</button><button class="secondary-action compact-action" data-announce-run="${Number(r.id)}" type="button">Announce</button><button class="danger-action compact-action" data-cancel-run="${Number(r.id)}" type="button">Cancel</button></div></article>`).join('')||'<p class="community-empty">No active or scheduled event runs.</p>';

    const locList=qs('[data-community-locations-library]');if(locList)locList.innerHTML=(payload.locations||[]).map(l=>`<article class="community-template-card"><strong>${esc(l.name)}</strong><small>${esc(l.label)}${l.x!=null&&l.z!=null?` · ${esc(l.x)}, ${esc(l.z)}`:''}</small><div class="community-actions"><button class="secondary-action compact-action" data-edit-location="${Number(l.id)}" type="button">Edit</button><button class="danger-action compact-action" data-delete-location="${Number(l.id)}" type="button">Delete</button></div></article>`).join('')||'<p class="community-empty">No reusable locations yet.</p>';
    const loadList=qs('[data-community-loadouts-library]');if(loadList)loadList.innerHTML=(payload.loadouts||[]).map(l=>`<article class="community-template-card"><strong>${esc(l.name)}</strong><small>${esc(l.description||l.config_reference||'Reusable event loadout')}</small><div class="community-actions"><button class="secondary-action compact-action" data-edit-loadout="${Number(l.id)}" type="button">Edit</button><button class="danger-action compact-action" data-delete-loadout="${Number(l.id)}" type="button">Delete</button></div></article>`).join('')||'<p class="community-empty">No reusable loadouts yet.</p>';
    const history=qs('[data-community-history]');if(history)history.innerHTML=(payload.history||[]).map(h=>`<div class="community-history-row"><strong>${esc(String(h.action||'update').replaceAll('_',' '))}</strong><span>${esc(h.actor_name||'Automation')}</span><small>${esc(fmtDate(h.created_at))}${h.detail?` · ${esc(h.detail)}`:''}</small></div>`).join('')||'<p class="community-empty">Event history will appear here.</p>';

    root.querySelectorAll('[data-edit-template]').forEach(btn=>btn.addEventListener('click',()=>fillTemplate(Number(btn.dataset.editTemplate))));
    root.querySelectorAll('[data-delete-template]').forEach(btn=>btn.addEventListener('click',()=>confirm('Delete this reusable event plan?')&&adminAction({action:'template_delete',template_id:Number(btn.dataset.deleteTemplate)})));
    root.querySelectorAll('[data-edit-location]').forEach(btn=>btn.addEventListener('click',()=>fillLocation(Number(btn.dataset.editLocation))));
    root.querySelectorAll('[data-delete-location]').forEach(btn=>btn.addEventListener('click',()=>confirm('Delete this reusable event location?')&&adminAction({action:'location_delete',location_id:Number(btn.dataset.deleteLocation)})));
    root.querySelectorAll('[data-edit-loadout]').forEach(btn=>btn.addEventListener('click',()=>fillLoadout(Number(btn.dataset.editLoadout))));
    root.querySelectorAll('[data-delete-loadout]').forEach(btn=>btn.addEventListener('click',()=>confirm('Delete this reusable event loadout?')&&adminAction({action:'loadout_delete',loadout_id:Number(btn.dataset.deleteLoadout)})));
    root.querySelectorAll('[data-cancel-run]').forEach(btn=>btn.addEventListener('click',()=>confirm('Cancel this event and announce the cancellation?')&&adminAction({action:'cancel_run',run_id:Number(btn.dataset.cancelRun)})));
    root.querySelectorAll('[data-announce-run]').forEach(btn=>btn.addEventListener('click',()=>adminAction({action:'announce_run',run_id:Number(btn.dataset.announceRun)})));
    root.querySelectorAll('[data-manage-run]').forEach(btn=>btn.addEventListener('click',()=>loadEventDetail(Number(btn.dataset.manageRun))));
  };

  const fillTemplate=(id)=>{const t=(adminPayload?.templates||[]).find(r=>Number(r.id)===Number(id));if(!t||!plannerForm)return;const E=plannerForm.elements;E.template_id.value=t.id;['name','title','category','description','location_label','loadout_label','x','z','duration_minutes','reminder_minutes','second_reminder_minutes','capacity','discord_channel_id','location_id','loadout_id','rules_text','announcement_text'].forEach(k=>{if(E[k])E[k].value=t[k]??'';});if(E.reward_xp)E.reward_xp.value=t.attendance_xp||0;if(E.reward_money)E.reward_money.value=t.attendance_money||0;if(E.winner_reward_xp)E.winner_reward_xp.value=t.winner_xp||0;if(E.winner_reward_money)E.winner_reward_money.value=t.winner_money||0;if(E.image_url)E.image_url.value=t.banner_url||'';E.signup_enabled.checked=Boolean(t.signup_enabled);E.announce_on_schedule.checked=Boolean(t.announce_on_schedule);E.enabled.checked=Boolean(t.enabled);plannerForm.scrollIntoView({behavior:'smooth',block:'center'});};
  const fillLocation=(id)=>{const l=(adminPayload?.locations||[]).find(r=>Number(r.id)===Number(id));if(!l||!locationForm)return;['location_id','name','label','x','z','notes'].forEach(k=>{if(locationForm.elements[k])locationForm.elements[k].value=l[k]??'';});locationForm.elements.enabled.checked=Boolean(l.enabled);};
  const fillLoadout=(id)=>{const l=(adminPayload?.loadouts||[]).find(r=>Number(r.id)===Number(id));if(!l||!loadoutForm)return;['loadout_id','name','description','config_reference'].forEach(k=>{if(loadoutForm.elements[k])loadoutForm.elements[k].value=l[k]??'';});loadoutForm.elements.enabled.checked=Boolean(l.enabled);};
  const clearTemplate=()=>{plannerForm?.reset();if(plannerForm){plannerForm.elements.template_id.value='';plannerForm.elements.signup_enabled.checked=true;plannerForm.elements.announce_on_schedule.checked=true;plannerForm.elements.enabled.checked=true;}};
  const clearLocation=()=>{locationForm?.reset();if(locationForm){locationForm.elements.location_id.value='';locationForm.elements.enabled.checked=true;}};
  const clearLoadout=()=>{loadoutForm?.reset();if(loadoutForm){loadoutForm.elements.loadout_id.value='';loadoutForm.elements.enabled.checked=true;}};

  const adminAction=async(body)=>{const result=await request(API.adminAction,{method:'POST',body:JSON.stringify(body)},true);setStatus(result.message||'Saved.','success');await Promise.all([loadAdmin(),loadOverview(),loadAccountEvents()]);if(selectedRunId)await loadEventDetail(selectedRunId,true);return result;};
  const loadEventDetail=async(runId,quiet=false)=>{try{selectedRunId=runId;const detail=await request(`${API.adminDetail}?run_id=${encodeURIComponent(runId)}`,{},true);renderAttendance(detail);if(!quiet)qs('[data-community-attendance]')?.scrollIntoView({behavior:'smooth',block:'center'});renderPlanner(adminPayload||{});}catch(e){setStatus(e.message,'error');}};
  const renderAttendance=(detail)=>{const el=qs('[data-community-attendance]');if(!el)return;const run=detail.run||{},signups=detail.signups||[];const eligible=signups.filter(s=>s.status!=='withdrawn');el.innerHTML=`<article class="community-attendance-head"><div class="community-event-top"><strong>#${Number(run.id)} · ${esc(run.title||'Event')}</strong><span class="community-tag ${esc(run.status)}">${esc(run.status)}</span></div><small>${esc(fmtDate(run.starts_at))} · ${esc(run.location_label||'Server-wide')}</small></article>${eligible.map(s=>`<div class="community-attendance-row"><div><strong>${esc(s.display_name||s.discord_id)}</strong><small>${esc(String(s.status||'registered').replace('_',' '))}${s.reward_paid_at?' · reward credited':''}</small></div><div class="community-actions"><button class="secondary-action compact-action" data-attendance="attended" data-attendee="${esc(s.discord_id)}" type="button">Attended</button><button class="secondary-action compact-action" data-attendance="registered" data-attendee="${esc(s.discord_id)}" type="button">Going</button><button class="danger-action compact-action" data-attendance="no_show" data-attendee="${esc(s.discord_id)}" type="button">No-show</button></div></div>`).join('')||'<p class="community-empty">No registrations yet.</p>'}<form class="community-result-editor" data-result-form><label class="community-field full"><span>Result summary</span><textarea name="summary" maxlength="1800">${esc(run.result_summary||'')}</textarea></label><label class="community-field"><span>Winner</span><select name="winner_discord_id"><option value="">No winner / not applicable</option>${eligible.map(s=>`<option value="${esc(s.discord_id)}" ${String(run.winner_name||'')===String(s.display_name||'')?'selected':''}>${esc(s.display_name||s.discord_id)}</option>`).join('')}</select></label><div class="community-actions"><button class="primary-action" type="submit">Publish Results</button>${run.result_published_at?'<button class="secondary-action" data-reannounce-result type="button">Re-announce Results</button>':''}</div></form>`;
    el.querySelectorAll('[data-attendance]').forEach(btn=>btn.addEventListener('click',()=>adminAction({action:'attendance',run_id:Number(run.id),discord_id:btn.dataset.attendee,attendance_status:btn.dataset.attendance})));
    el.querySelector('[data-result-form]')?.addEventListener('submit',e=>{e.preventDefault();const f=new FormData(e.currentTarget);adminAction({action:'publish_result',run_id:Number(run.id),summary:f.get('summary')||'',winner_discord_id:f.get('winner_discord_id')||''});});
    el.querySelector('[data-reannounce-result]')?.addEventListener('click',()=>adminAction({action:'reannounce_result',run_id:Number(run.id)}));
  };

  plannerForm?.addEventListener('submit',async(event)=>{event.preventDefault();if(dashboardAccessLevel!=='owner')return;const f=new FormData(plannerForm);const template={name:f.get('name'),title:f.get('title'),category:f.get('category'),description:f.get('description'),location_id:f.get('location_id')||null,loadout_id:f.get('loadout_id')||null,location_label:f.get('location_label'),loadout_label:f.get('loadout_label'),x:f.get('x'),z:f.get('z'),duration_minutes:f.get('duration_minutes'),reminder_minutes:f.get('reminder_minutes'),second_reminder_minutes:f.get('second_reminder_minutes'),capacity:f.get('capacity'),attendance_xp:f.get('reward_xp'),attendance_money:f.get('reward_money'),winner_xp:f.get('winner_reward_xp'),winner_money:f.get('winner_reward_money'),discord_channel_id:f.get('discord_channel_id'),rules_text:f.get('rules_text'),announcement_text:f.get('announcement_text'),banner_url:f.get('image_url'),signup_enabled:plannerForm.elements.signup_enabled.checked,announce_on_schedule:plannerForm.elements.announce_on_schedule.checked,enabled:plannerForm.elements.enabled.checked};try{await adminAction({action:'template_save',template_id:f.get('template_id')||null,template});clearTemplate();}catch(e){setStatus(e.message,'error');}});
  locationForm?.addEventListener('submit',async e=>{e.preventDefault();const f=new FormData(locationForm);try{await adminAction({action:'location_save',location_id:f.get('location_id')||null,location:{name:f.get('name'),label:f.get('label'),x:f.get('x'),z:f.get('z'),notes:f.get('notes'),enabled:locationForm.elements.enabled.checked}});clearLocation();}catch(err){setStatus(err.message,'error');}});
  loadoutForm?.addEventListener('submit',async e=>{e.preventDefault();const f=new FormData(loadoutForm);try{await adminAction({action:'loadout_save',loadout_id:f.get('loadout_id')||null,loadout:{name:f.get('name'),description:f.get('description'),config_reference:f.get('config_reference'),enabled:loadoutForm.elements.enabled.checked}});clearLoadout();}catch(err){setStatus(err.message,'error');}});
  qs('[data-community-schedule]')?.addEventListener('click',async()=>{const id=Number(qs('[data-community-template-select]')?.value||0);const local=qs('[data-community-starts]')?.value;if(!id||!local){setStatus('Choose an event plan and start time.','error');return;}const occurrences=Math.max(1,Number(qs('[data-community-occurrences]')?.value||1));const repeatDays=Math.max(1,Number(qs('[data-community-repeat-days]')?.value||7));try{await adminAction({action:occurrences>1?'schedule_series':'schedule',template_id:id,starts_at:new Date(local).toISOString(),occurrences,repeat_days:repeatDays,overrides:{discord_channel_id:qs('[data-community-channel]')?.value||''}});}catch(e){setStatus(e.message,'error');}});
  qs('[data-community-start-now]')?.addEventListener('click',async()=>{const id=Number(qs('[data-community-template-select]')?.value||0);if(!id){setStatus('Choose an event plan first.','error');return;}try{await adminAction({action:'start_now',template_id:id,overrides:{discord_channel_id:qs('[data-community-channel]')?.value||''}});}catch(e){setStatus(e.message,'error');}});
  qs('[data-community-clear-template]')?.addEventListener('click',clearTemplate);qs('[data-community-clear-location]')?.addEventListener('click',clearLocation);qs('[data-community-clear-loadout]')?.addEventListener('click',clearLoadout);
  qs('[data-community-test-push]')?.addEventListener('click',async()=>{try{await adminAction({action:'test_push'});}catch(e){setStatus(e.message,'error');}});
  qs('[data-community-enable-push]')?.addEventListener('click',async()=>{try{await ensurePushSubscription();setStatus('Browser notifications are enabled.','success');await loadPreferences();}catch(e){setStatus(e.message,'error');}});
  qs('[data-community-save-push]')?.addEventListener('click',async()=>{try{const r=await savePreferences();setStatus(r.message||'Preferences updated.','success');await loadPreferences();}catch(e){setStatus(e.message,'error');}});
  qs('[data-community-disable-push]')?.addEventListener('click',async()=>{try{await disablePush();setStatus('Browser notifications disabled.','success');await loadPreferences();}catch(e){setStatus(e.message,'error');}});
  qs('[data-community-refresh]')?.addEventListener('click',()=>refresh(true));

  const refresh=async(loud=false)=>{try{await loadOverview();await Promise.all([loadAccountEvents(),loadPreferences(),loadAdmin()]);if(loud)setStatus('Community data refreshed.','success');}catch(e){setStatus(e.message,'error');}};
  const activate=({section=''}={})=>{active=true;refresh();clearInterval(refreshTimer);refreshTimer=setInterval(()=>{if(active)loadOverview().catch(()=>{});},60000);if(section==='planner'&&!['staff','owner'].includes(dashboardAccessLevel))setStatus('Staff access is required for Event Planner.','error');};
  window.addEventListener('wwz:viewchange',(event)=>{if(event.detail?.view==='community')activate(event.detail);else active=false;});
  window.addEventListener('wwz:serverchange',()=>{selectedRunId=null;adminPayload=null;accountPayload=null;if(active)refresh();});
  window.addEventListener('wwz:authchange',()=>{accountPayload=null;if(active)refresh();});
  window.__wwzCommunityReady=true;
  window.WWZCommunity=Object.freeze({activate,refresh});
})();
