// Saved coordinates, event-delivery operations and Owner mission-file workspace.
const deliveryLocationForm = document.querySelector('[data-location-form]');
const deliveryLocationId = document.querySelector('[data-location-id]');
const deliveryLocationName = document.querySelector('[data-location-name]');
const deliveryLocationX = document.querySelector('[data-location-x]');
const deliveryLocationY = document.querySelector('[data-location-y]');
const deliveryLocationZ = document.querySelector('[data-location-z]');
const deliveryLocationRotation = document.querySelector('[data-location-rotation]');
const deliveryLocationDefault = document.querySelector('[data-location-default]');
const deliveryLocationMessage = document.querySelector('[data-location-message]');
const savedDeliveryLocationList = document.querySelector('[data-saved-location-list]');
const savedDeliveryLocationEmpty = document.querySelector('[data-saved-location-empty]');
const savedDeliveryLocationError = document.querySelector('[data-saved-location-error]');
const refreshDeliveryLocationsButton = document.querySelector('[data-refresh-delivery-locations]');
const cancelDeliveryLocationEditButton = document.querySelector('[data-cancel-location-edit]');
const saveDeliveryLocationButton = document.querySelector('[data-save-location]');
const deliveryLocationMap = document.querySelector('[data-location-map]');
const deliveryLocationMapReadout = document.querySelector('[data-location-map-readout]');
let deliveryLocationRequestInProgress = false;
let deliveryLocationMapInstance = null;

const deliveryMapWorldSize = () => Number(window.WWZServerContext?.getWorldSize?.()) || null;

const deliveryLocationCoordinates = () => {
  const rawX = String(deliveryLocationX?.value ?? '').trim();
  const rawZ = String(deliveryLocationZ?.value ?? '').trim();
  const x = Number(rawX);
  const z = Number(rawZ);
  const worldSize = deliveryMapWorldSize();
  const valid = rawX !== '' && rawZ !== '' && Number.isFinite(x) && Number.isFinite(z) && x >= 0 && x <= worldSize && z >= 0 && z <= worldSize;
  return { valid, x, z };
};

const syncDeliveryLocationMap = ({ center = false } = {}) => {
  const { valid, x, z } = deliveryLocationCoordinates();
  if (deliveryLocationMapReadout && !deliveryLocationMapInstance) {
    deliveryLocationMapReadout.textContent = valid ? `X ${x.toFixed(1)} · Z ${z.toFixed(1)}` : 'No coordinates selected';
  }
  if (!deliveryLocationMapInstance) return;
  if (valid) deliveryLocationMapInstance.setSelection(x, z, { notify: false, center, zoom: 6 });
  else deliveryLocationMapInstance.clearSelection({ notify: false });
};

const ensureDeliveryLocationMap = () => {
  if (deliveryLocationMapInstance || !deliveryLocationMap || !window.WWZMap) return deliveryLocationMapInstance;
  const mapKey = window.WWZServerContext?.getMapKey?.();
  const worldSize = deliveryMapWorldSize();
  if (!mapKey || !worldSize) return null;
  [deliveryLocationX, deliveryLocationZ].forEach((input) => { if (input) input.max = String(worldSize); });
  deliveryLocationMapInstance = window.WWZMap.create(deliveryLocationMap, {
    mapKey,
    mode: 'saved-location',
    selectable: true,
    copyOnSelect: false,
    roadsVisible: true,
    trailsVisible: false,
    selectedElement: deliveryLocationMapReadout,
    zoomInButton: document.querySelector('[data-location-map-zoom-in]'),
    zoomOutButton: document.querySelector('[data-location-map-zoom-out]'),
    resetButton: document.querySelector('[data-location-map-reset]'),
    fullscreenButton: document.querySelector('[data-location-map-fullscreen]'),
    fullscreenTarget: deliveryLocationMap,
    emptySelectionText: 'No coordinates selected',
    onSelect: ({ x, z }) => {
      if (deliveryLocationX) deliveryLocationX.value = x.toFixed(1);
      if (deliveryLocationZ) deliveryLocationZ.value = z.toFixed(1);
      if (deliveryLocationY && deliveryLocationY.value === '') deliveryLocationY.value = '0';
      syncDeliveryLocationMap();
    }
  });
  syncDeliveryLocationMap();
  return deliveryLocationMapInstance;
};

const resetDeliveryLocationForm = () => {
  deliveryLocationForm?.reset();
  if (deliveryLocationId) deliveryLocationId.value = '';
  if (deliveryLocationRotation) deliveryLocationRotation.value = '0';
  setText('[data-location-form-title]', 'Save a location');
  cancelDeliveryLocationEditButton?.setAttribute('hidden', '');
  showInlineMessage(deliveryLocationMessage, '');
  deliveryLocationMapInstance?.clearSelection({ notify: false });
  deliveryLocationMapInstance?.reset();
  if (deliveryLocationMapReadout) deliveryLocationMapReadout.textContent = 'No coordinates selected';
};

const editDeliveryLocation = (location) => {
  if (!location) return;
  if (deliveryLocationId) deliveryLocationId.value = String(location.location_id);
  if (deliveryLocationName) deliveryLocationName.value = String(location.name || '');
  if (deliveryLocationX) deliveryLocationX.value = Number(location.x).toFixed(1);
  if (deliveryLocationY) deliveryLocationY.value = String(location.y);
  if (deliveryLocationZ) deliveryLocationZ.value = Number(location.z).toFixed(1);
  if (deliveryLocationRotation) deliveryLocationRotation.value = String(location.rotation);
  if (deliveryLocationDefault) deliveryLocationDefault.checked = Boolean(location.is_default);
  setText('[data-location-form-title]', `Edit ${location.name}`);
  cancelDeliveryLocationEditButton?.removeAttribute('hidden');
  ensureDeliveryLocationMap();
  syncDeliveryLocationMap({ center: true });
  deliveryLocationName?.focus();
};

const deliveryLocationButton = (label, className, handler) => {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = className;
  button.textContent = label;
  button.addEventListener('click', handler);
  return button;
};

const renderDeliveryLocations = () => {
  if (!savedDeliveryLocationList) return;
  savedDeliveryLocationList.replaceChildren();
  setText('[data-location-count]', `${savedDeliveryLocations.length} / 50`);
  savedDeliveryLocations.forEach((location) => {
    const card = document.createElement('article');
    card.className = 'saved-location-card';
    const heading = document.createElement('div');
    heading.className = 'saved-location-heading';
    const copy = document.createElement('div');
    const name = document.createElement('strong');
    name.textContent = location.name;
    const detail = document.createElement('small');
    detail.textContent = `X ${location.x} · Y ${location.y} · Z ${location.z} · A ${location.rotation}°`;
    copy.append(name, detail);
    const badge = document.createElement('span');
    badge.className = `table-status ${location.is_default ? 'online' : 'neutral'}`;
    badge.textContent = location.is_default ? 'Default' : 'Saved';
    heading.append(copy, badge);
    const meta = document.createElement('p');
    meta.textContent = location.last_used_at
      ? `Last used ${formatAccountDate(location.last_used_at)} · Updated ${formatAccountDate(location.updated_at)}`
      : `Updated ${formatAccountDate(location.updated_at)}`;
    const actions = document.createElement('div');
    actions.className = 'heading-actions';
    actions.append(deliveryLocationButton('Edit', 'secondary-action compact-action', () => editDeliveryLocation(location)));
    actions.append(deliveryLocationButton('Delete', 'secondary-action compact-action danger-outline', async () => {
      if (!window.confirm(`Delete the saved location “${location.name}”? Existing orders keep their recorded coordinates.`)) return;
      await saveDeliveryLocationAction({ action: 'delete', location_id: location.location_id });
    }));
    card.append(heading, meta, actions);
    savedDeliveryLocationList.append(card);
  });
  if (savedDeliveryLocationEmpty) savedDeliveryLocationEmpty.hidden = savedDeliveryLocations.length !== 0;
  populatePurchaseLocationSelect();
};

const loadDeliveryLocations = async (sessionToken = storageGet(AUTH_SESSION_KEY), { quiet = false } = {}) => {
  if (!sessionToken || deliveryLocationRequestInProgress) return false;
  deliveryLocationRequestInProgress = true;
  refreshDeliveryLocationsButton?.setAttribute('disabled', '');
  try {
    const response = await authFetch(ACCOUNT_DELIVERY_LOCATIONS_URL, {
      headers: { Accept: 'application/json', Authorization: `Bearer ${sessionToken}` }
    });
    const payload = await response.json().catch(() => ({}));
    if (response.status === 401) {
      storageRemove(AUTH_SESSION_KEY);
      applySignedOutState();
      return false;
    }
    if (!response.ok || payload.status !== 'ok') throw new Error(payload.message || 'Saved locations are unavailable.');
    savedDeliveryLocations = Array.isArray(payload.locations) ? payload.locations : [];
    renderDeliveryLocations();
    if (savedDeliveryLocationError) savedDeliveryLocationError.hidden = true;
    return true;
  } catch (error) {
    if (savedDeliveryLocationError && !quiet) savedDeliveryLocationError.hidden = false;
    return false;
  } finally {
    deliveryLocationRequestInProgress = false;
    refreshDeliveryLocationsButton?.removeAttribute('disabled');
  }
};

const saveDeliveryLocationAction = async (body) => {
  const sessionToken = storageGet(AUTH_SESSION_KEY);
  if (!sessionToken || deliveryLocationRequestInProgress) return false;
  deliveryLocationRequestInProgress = true;
  saveDeliveryLocationButton?.setAttribute('disabled', '');
  showInlineMessage(deliveryLocationMessage, body.action === 'delete' ? 'Deleting saved location…' : 'Saving coordinates…', 'info');
  try {
    const response = await protectedActionFetch(ACCOUNT_DELIVERY_LOCATION_ACTION_URL, {
      method: 'POST',
      headers: { Accept: 'application/json', 'Content-Type': 'application/json', Authorization: `Bearer ${sessionToken}` },
      body: JSON.stringify(body)
    });
    const payload = await response.json().catch(() => ({}));
    if (response.status === 401) {
      storageRemove(AUTH_SESSION_KEY);
      applySignedOutState();
      return false;
    }
    if (!response.ok) throw new Error(payload.message || 'The saved location could not be updated.');
    showInlineMessage(deliveryLocationMessage, payload.message || 'Saved location updated.', 'success');
    deliveryLocationRequestInProgress = false;
    resetDeliveryLocationForm();
    await loadDeliveryLocations(sessionToken);
    return true;
  } catch (error) {
    showInlineMessage(deliveryLocationMessage, error.message || 'The saved location could not be updated.');
    return false;
  } finally {
    deliveryLocationRequestInProgress = false;
    saveDeliveryLocationButton?.removeAttribute('disabled');
  }
};

deliveryLocationForm?.addEventListener('submit', async (event) => {
  event.preventDefault();
  await saveDeliveryLocationAction({
    action: 'save',
    location_id: deliveryLocationId?.value || null,
    name: deliveryLocationName?.value.trim() || '',
    x: deliveryLocationX?.value,
    y: deliveryLocationY?.value,
    z: deliveryLocationZ?.value,
    rotation: deliveryLocationRotation?.value || 0,
    is_default: Boolean(deliveryLocationDefault?.checked)
  });
});
refreshDeliveryLocationsButton?.addEventListener('click', () => loadDeliveryLocations());
cancelDeliveryLocationEditButton?.addEventListener('click', resetDeliveryLocationForm);
[deliveryLocationX, deliveryLocationZ].forEach((input) => input?.addEventListener('input', () => syncDeliveryLocationMap()));

const deliveryScope = document.querySelector('[data-delivery-scope]');
const deliveryOrderList = document.querySelector('[data-delivery-order-list]');
const deliveryEmpty = document.querySelector('[data-delivery-empty]');
const deliveryError = document.querySelector('[data-delivery-error]');
const refreshDeliveryQueueButton = document.querySelector('[data-refresh-delivery-queue]');
const deliveryNavBadge = document.querySelector('[data-delivery-nav-badge]');
let deliveryQueueRequestInProgress = false;
let deliveryActionInProgress = false;
let lastDeliveryQueuePayload = null;

const deliveryStatusHelp = {
  awaiting_approval: 'Railway is releasing this legacy approval state automatically.',
  ready: 'Queued for automatic validation, backup and upload.',
  previewed: 'Prepared and waiting for automatic deployment.',
  restart_pending: 'Mission files are verified and this order will spawn at the next restart.',
  verification: 'The order has spawned and Railway is reconciling its restart state.',
  active: 'The rental is active and its remaining restarts are tracked automatically.',
  cleanup_due: 'The purchased restart count is complete; file cleanup is queued automatically.',
  failed: 'The last deployment failed. Railway retries this order automatically every 30 seconds.',
  fulfilled: 'The automatic delivery and cleanup workflow is complete.',
  cancelled: 'The order was cancelled and its temporary file definitions are being removed.',
  cancelled_cleaned: 'The cancelled order has been refunded and its temporary file definitions were removed.'
};

const previewText = (preview) => {
  if (!preview || typeof preview !== 'object') return '';
  return Object.entries(preview).map(([key, value]) => {
    const section = value || {};
    return `### ${section.label || key}\n${section.diff || 'No change.'}`;
  }).join('\n\n');
};

const performDeliveryAction = async (order, action) => {
  const token = storageGet(AUTH_SESSION_KEY);
  if (!token || deliveryActionInProgress) return;
  let note = '';
  if (['verify', 'record_restart', 'cleanup', 'rollback', 'cancel'].includes(action)) {
    note = window.prompt(action === 'verify'
      ? 'Enter the in-game verification note:'
      : action === 'record_restart'
        ? 'Enter why this restart is being counted manually:'
        : action === 'cleanup'
          ? 'Enter the final cleanup and fulfilment note:'
      : action === 'rollback'
        ? 'Enter the rollback reason:'
        : 'Enter the cancellation note:', '') || '';
    if (!note.trim()) return;
  }
  const warnings = {
    stage: 'The DayZ server must already be stopped. This will back up and upload events.xml, cfgeventspawns.xml and cfgspawnabletypes.xml.',
    restart: 'This will start the stopped Nitrado server so the staged delivery can spawn. Continue?',
    verify: 'This verifies the initial spawn. Multi-restart rentals remain active until their restart count reaches zero.',
    cleanup: 'The DayZ server must be fully stopped. This will retire the temporary event entries and mark the completed rental fulfilled.',
    rollback: 'This will restore the recorded pre-deployment backups.',
    retry_spawn: 'Only use this if the vehicle/event is definitely missing. This will NOT charge the member again. It requeues the same paid order at the recorded X/Z/angle for the next restart; using it when the vehicle already exists could create a duplicate.'
  };
  if (warnings[action] && !window.confirm(warnings[action])) return;
  deliveryActionInProgress = true;
  try {
    const response = await protectedActionFetch(ADMIN_SHOP_DELIVERY_ACTION_URL, {
      method: 'POST',
      headers: { Accept: 'application/json', 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ delivery_id: order.delivery_id, action, note })
    });
    const payload = await response.json().catch(() => ({}));
    if (handleAdminPlayerAuthorizationResponse(response, payload, { actionRequest: true })) return;
    if (!response.ok) throw new Error(payload.message || 'The delivery operation failed.');
    if (action === 'preview' && payload.preview) {
      const text = previewText(payload.preview);
      if (text) window.alert(text.slice(0, 12000));
    } else {
      window.alert(payload.message || 'Delivery operation completed.');
    }
    await Promise.all([loadDeliveryQueue(token), loadAdminShopOrders(token), loadMemberShop(token)]);
  } catch (error) {
    window.alert(error.message || 'The delivery operation failed.');
  } finally {
    deliveryActionInProgress = false;
  }
};

const deliveryActionButton = (order, label, action) => {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = `${['stage', 'restart', 'verify', 'cleanup'].includes(action) ? 'primary-action' : 'secondary-action'} compact-action`;
  button.textContent = label;
  button.addEventListener('click', () => performDeliveryAction(order, action));
  return button;
};

const deliveryFriendlyStatus = (deliveryState, order) => {
  const labels = { awaiting_approval:'Preparing', ready:'Ready', previewed:'Prepared', restart_pending:'Waiting for Restart', verification:'Spawn Verification', active:'Rental Active', cleanup_due: order?.delivery_type==='event'?'Rental Ending':'Delivered · Finalising', failed:'Retrying Delivery', fulfilled:'Fulfilled', cancelled:'Cancelled', cancelled_cleaned:'Cancelled & Cleaned', rolled_back:'Rolled Back', queued:'Preparing' };
  return labels[deliveryState] || shopStatusLabel(deliveryState || order?.status || 'unknown');
};
const deliveryQueueDuration = (seconds) => { const mins=Math.max(0,Math.trunc((Number(seconds)||0)/60)); const h=Math.trunc(mins/60); return h?`${h}h ${mins%60}m`:`${mins}m`; };
const deliveryQueueProgress = (delivery, order) => {
  const stateValue=String(delivery?.status||'queued'); const event=delivery?.delivery_kind==='event';
  if(event){ const stages=['Paid','Prepared','Spawned','Rental active','Complete']; const map={awaiting_approval:1,ready:1,previewed:1,restart_pending:2,verification:2,active:3,cleanup_due:4,fulfilled:5}; return {stages,current:map[stateValue]??1}; }
  const stages=['Paid','Prepared','Restart','Complete']; const map={queued:1,restart_pending:2,cleanup_due:3,fulfilled:4}; return {stages,current:map[stateValue]??1};
};
const appendDeliveryQueueTrack = (card, delivery, order) => { const progress=deliveryQueueProgress(delivery,order); const track=document.createElement('div'); track.className='delivery-progress-track'; progress.stages.forEach((label,index)=>{ const step=document.createElement('div'); step.className=index<progress.current?'complete':index===progress.current?'active':''; const i=document.createElement('i'); const span=document.createElement('span'); span.textContent=label; step.append(i,span); track.append(step); }); card.append(track); };
const appendDeliveryRestartBanner = (card, delivery) => { if(String(delivery?.status)!=='restart_pending') return; const operations=window.WWZShopRestartOperations||{}; const banner=document.createElement('div'); banner.className='delivery-restart-banner'; const icon=document.createElement('span'); icon.textContent='↻'; const copy=document.createElement('div'); const small=document.createElement('small'); small.textContent='Prepared and waiting for restart'; const strong=document.createElement('strong'); const em=document.createElement('em'); if(operations.next_scheduled_restart){ strong.textContent=`${deliveryQueueDuration(operations.restart_countdown_seconds)} remaining`; em.textContent=`Next restart ${formatAccountDate(operations.next_scheduled_restart)} · ${operations.restart_source||'messages.xml + ADM'}`; } else if(operations.restart_schedule_configured){ strong.textContent='Restart sync pending'; em.textContent='Countdown anchors on the next observed restart.'; } else { strong.textContent='Waiting for DayZ restart'; em.textContent='Railway continues monitoring automatically.'; } copy.append(small,strong,em); banner.append(icon,copy); card.append(banner); };
const appendDeliveryRentalProgress = (card, delivery, order) => { if(delivery?.delivery_kind!=='event') return; const purchased=Math.max(1,Number(delivery.purchased_restarts??order.event_restarts??1)); const remaining=Math.max(0,Number(delivery.remaining_restarts??purchased)); const used=Math.min(purchased,Math.max(0,purchased-remaining)); const block=document.createElement('div'); block.className='delivery-rental-progress'; const head=document.createElement('div'); const strong=document.createElement('strong'); strong.textContent=`${remaining.toLocaleString()} restart${remaining===1?'':'s'} remaining`; const span=document.createElement('span'); span.textContent=`${used.toLocaleString()} used · ${purchased.toLocaleString()} purchased`; head.append(strong,span); const meter=document.createElement('div'); const fill=document.createElement('i'); fill.style.width=`${Math.min(100,(used/purchased)*100)}%`; meter.append(fill); block.append(head,meter); card.append(block); };
const renderDeliveryQueue = (payload) => {
  if (!deliveryOrderList) return;
  lastDeliveryQueuePayload = payload;
  deliveryOrderList.replaceChildren();
  const summary = payload?.summary || {};
  setText('[data-delivery-open]', String(Number(summary.open || 0)));
  setText('[data-delivery-awaiting]', String(Number(summary.pending || 0)));
  setText('[data-delivery-restart]', String(Number(summary.processing || 0)));
  setText('[data-delivery-verification]', String(Number(summary.fulfilled || 0)));
  setText('[data-delivery-failed]', String(Number(summary.refunded || 0) + Number(summary.cancelled || 0)));
  const openCount = Number(summary.open || 0);
  if (deliveryNavBadge) { deliveryNavBadge.textContent = String(openCount); deliveryNavBadge.hidden = openCount === 0; }
  const orders = Array.isArray(payload?.orders) ? payload.orders : [];
  orders.forEach((order) => {
    const delivery = order.delivery || {}; const location = delivery.location || {}; const deliveryKind = delivery.delivery_kind === 'event' ? 'Vehicle / Event Rental' : 'Automatic Item Delivery'; const deliveryState = delivery.status || 'queued';
    const card = document.createElement('article'); card.className = `delivery-order-card delivery-${deliveryState}`;
    const heading=document.createElement('div'); heading.className='delivery-order-heading'; const copy=document.createElement('div'); const kicker=document.createElement('p'); kicker.className='panel-kicker'; kicker.textContent=`${deliveryKind} · Order #${order.order_id}`; const title=document.createElement('h2'); title.textContent=`${order.item.name} → ${order.buyer.psn_id}`; const sub=document.createElement('small'); sub.textContent=`${order.buyer.discord_name} · ${formatMoney(order.total_price)} · ${formatAccountDate(order.created_at)}`; copy.append(kicker,title,sub); const status=document.createElement('span'); status.className=`shop-order-status ${deliveryState}`; status.textContent=deliveryFriendlyStatus(deliveryState,order); heading.append(copy,status); card.append(heading);
    const details=document.createElement('div'); details.className='delivery-detail-grid'; const itemDetail=delivery.delivery_kind==='event'?`${Number(delivery.purchased_restarts??order.event_restarts??1).toLocaleString()} purchased restart(s)`:`${Number(order.quantity||1).toLocaleString()} × ${(order.item.types||[]).join(', ')||order.item.sku}`;
    const locationSummary=location.x==null?'Coordinates unavailable':delivery.delivery_kind==='event'?`${location.name||'Selected point'} · X ${Number(location.x).toFixed(1)}, Z ${Number(location.z).toFixed(1)} · terrain height`:`${location.name||'Selected point'} · X ${Number(location.x).toFixed(1)}, Y ${Number(location.y).toFixed(1)}, Z ${Number(location.z).toFixed(1)}`;
    [['Automation',deliveryFriendlyStatus(deliveryState,order)],['Delivery',itemDetail],['Location',locationSummary],['Rotation',`${Number(location.rotation||0).toFixed(1)}°`],...(delivery.delivery_kind==='event'&&delivery.event_name?[['CE event',delivery.event_name]]:[]),['Value',formatMoney(order.total_price)],['Updated',formatAccountDate(delivery.updated_at||order.updated_at||order.created_at)]].forEach(([label,value])=>{ const block=document.createElement('div'); const small=document.createElement('span'); small.textContent=label; const strong=document.createElement('strong'); strong.textContent=value; block.append(small,strong); details.append(block); }); card.append(details);
    appendDeliveryQueueTrack(card,delivery,order); appendDeliveryRestartBanner(card,delivery); appendDeliveryRentalProgress(card,delivery,order);
    if(location.x!=null){ const locationBar=document.createElement('div'); locationBar.className='delivery-location-bar'; const div=document.createElement('div'); const label=document.createElement('span'); label.textContent=delivery.delivery_kind==='event'?'Exact DayZ CE spawn target':(location.name||'Delivery coordinates'); const coords=document.createElement('strong'); const coordinateText=delivery.delivery_kind==='event'?`X ${Number(location.x).toFixed(3)}, Z ${Number(location.z).toFixed(3)}, A ${Number(location.rotation||0).toFixed(1)}° · terrain height`:`X ${Number(location.x).toFixed(1)}, Y ${Number(location.y).toFixed(1)}, Z ${Number(location.z).toFixed(1)}, A ${Number(location.rotation||0).toFixed(1)}°`; coords.textContent=coordinateText; div.append(label,coords); const buttons=document.createElement('div'); buttons.className='heading-actions'; const button=document.createElement('button'); button.type='button'; button.className='secondary-action compact-action'; button.textContent='Copy coordinates'; button.addEventListener('click',async()=>{try{await navigator.clipboard.writeText(coordinateText);button.textContent='Copied';}catch{button.textContent='Copy failed';}window.setTimeout(()=>button.textContent='Copy coordinates',1200);}); buttons.append(button); if(delivery.delivery_kind==='event'&&delivery.event_name){ const xml=`<event name=\"${String(delivery.event_name).replace(/[\"<>]/g,'')}\"><pos x=\"${Number(location.x).toFixed(3)}\" z=\"${Number(location.z).toFixed(3)}\" a=\"${Number(location.rotation||0).toFixed(1)}\" /></event>`; const xmlButton=document.createElement('button'); xmlButton.type='button'; xmlButton.className='secondary-action compact-action'; xmlButton.textContent='Copy CE XML'; xmlButton.addEventListener('click',async()=>{try{await navigator.clipboard.writeText(xml);xmlButton.textContent='Copied XML';}catch{xmlButton.textContent='Copy failed';}window.setTimeout(()=>xmlButton.textContent='Copy CE XML',1200);}); buttons.append(xmlButton); } locationBar.append(div,buttons); card.append(locationBar); }
    if (delivery.last_error) { const error=document.createElement('p'); error.className='delivery-error-copy'; error.textContent=`Last deployment error: ${delivery.last_error}`; card.append(error); }
    const automationNote=document.createElement('p'); automationNote.className='delivery-automation-note'; automationNote.textContent=deliveryStatusHelp[deliveryState]||'Railway is managing this delivery automatically.'; card.append(automationNote);
    const latestEvent=Array.isArray(delivery.events)?delivery.events[0]:null; if(latestEvent?.note){ const eventLine=document.createElement('div'); eventLine.className='delivery-latest-event'; const label=document.createElement('span'); label.textContent='Latest automation event'; const copyText=document.createElement('strong'); copyText.textContent=latestEvent.note; eventLine.append(label,copyText); card.append(eventLine); }
    const actions=document.createElement('div'); actions.className='heading-actions delivery-actions'; if(delivery.delivery_kind==='event'&&!['cancelled','cancelled_cleaned','rolled_back'].includes(deliveryState)&&!['cancelled','refunded'].includes(order.status)){ actions.append(deliveryActionButton(delivery,'Retry missing spawn','retry_spawn')); } if(['pending','processing'].includes(order.status)) actions.append(adminShopActionButton('Cancel & refund','cancel',order,true)); else if(order.status==='fulfilled') actions.append(adminShopActionButton('Refund order','refund',order,true)); if(actions.childElementCount) card.append(actions);
    deliveryOrderList.append(card);
  });
  if (deliveryEmpty) deliveryEmpty.hidden = orders.length !== 0;
  if (deliveryError) deliveryError.hidden = true;
};

const loadDeliveryQueue = async (token = storageGet(AUTH_SESSION_KEY)) => {
  if (!token || !hasServerActionAccess() || deliveryQueueRequestInProgress) return false;
  deliveryQueueRequestInProgress = true;
  refreshDeliveryQueueButton?.setAttribute('disabled', '');
  try {
    const scope = encodeURIComponent(deliveryScope?.value || 'open');
    const response = await authFetch(`${ADMIN_SHOP_ORDERS_URL}?mode=automatic&status=${scope}&limit=100`, {
      headers: { Accept: 'application/json', Authorization: `Bearer ${token}` }
    });
    const payload = await response.json().catch(() => ({}));
    if (handleAdminPlayerAuthorizationResponse(response, payload, { actionRequest: false })) return false;
    if (!response.ok) throw new Error(payload.message || 'The automatic order monitor is unavailable.');
    renderDeliveryQueue(payload);
    return true;
  } catch (error) {
    if (deliveryError) deliveryError.hidden = false;
    return false;
  } finally {
    deliveryQueueRequestInProgress = false;
    refreshDeliveryQueueButton?.removeAttribute('disabled');
  }
};
deliveryScope?.addEventListener('change', () => loadDeliveryQueue());
refreshDeliveryQueueButton?.addEventListener('click', () => loadDeliveryQueue());
window.addEventListener('wwz:restartstatus', () => { if (lastDeliveryQueuePayload && !deliveryOrderList?.closest('[data-view-panel]')?.hidden) renderDeliveryQueue(lastDeliveryQueuePayload); });

const refreshServerConfigButton = document.querySelector('[data-refresh-server-config]');
const configFileSelect = document.querySelector('[data-config-file-select]');
const loadConfigFileButton = document.querySelector('[data-load-config-file]');
const validateConfigFileButton = document.querySelector('[data-validate-config-file]');
const applyConfigFileButton = document.querySelector('[data-apply-config-file]');
const configFileContent = document.querySelector('[data-config-file-content]');
const configFileReason = document.querySelector('[data-config-file-reason]');
const configFileMessage = document.querySelector('[data-config-file-message]');
const configFileDiff = document.querySelector('[data-config-file-diff]');
const configBackupFilter = document.querySelector('[data-config-backup-filter]');
const configBackupCreateFile = document.querySelector('[data-config-backup-create-file]');
const configBackupReason = document.querySelector('[data-config-backup-reason]');
const refreshConfigBackupsButton = document.querySelector('[data-refresh-config-backups]');
const createConfigBackupButton = document.querySelector('[data-create-config-backup]');
const configBackupMessage = document.querySelector('[data-config-backup-message]');
const configBackupList = document.querySelector('[data-config-backup-list]');
const configBackupEmpty = document.querySelector('[data-config-backup-empty]');
const configBackupError = document.querySelector('[data-config-backup-error]');
const configBackupDiff = document.querySelector('[data-config-backup-diff]');
const refreshServerEventsButton = document.querySelector('[data-refresh-server-events]');
const serverEventSearch = document.querySelector('[data-server-event-search]');
const serverEventList = document.querySelector('[data-server-event-list]');
const serverEventEmpty = document.querySelector('[data-server-event-empty]');
const serverEventError = document.querySelector('[data-server-event-error]');
let ownerServerConfigRequestInProgress = false;
let ownerConfigBackupRequestInProgress = false;
let ownerConfigBackups = [];
let ownerServerEvents = [];

const readableBytes = (bytes) => {
  const amount = Number(bytes || 0);
  if (amount < 1024) return `${amount} B`;
  if (amount < 1024 * 1024) return `${(amount / 1024).toFixed(1)} KB`;
  return `${(amount / (1024 * 1024)).toFixed(2)} MB`;
};

const applyServerConfigOverview = (payload) => {
  const service = payload?.service || {};
  const safety = payload?.safety || {};
  setText('[data-config-mission-root]', service.mission_root || 'Mission root unavailable');
  setText('[data-config-file-count]', String(Number(service.managed_file_count || 0)));
  setText('[data-config-backup-count]', String(Number(service.backup_count || 0)));
  setText('[data-config-editor-limit]', readableBytes(safety.max_editor_bytes));
  const latest = service.latest_action;
  setText('[data-config-latest-action]', latest
    ? `${latest.action || latest.operation || 'Configuration action'} · ${formatAccountDate(latest.created_at || latest.timestamp)}`
    : 'No recent configuration action.');
  if (configFileSelect) {
    const selected = configFileSelect.value;
    configFileSelect.replaceChildren();
    const placeholder = document.createElement('option');
    placeholder.value = '';
    placeholder.textContent = 'Select managed file…';
    configFileSelect.append(placeholder);
    (Array.isArray(payload.files) ? payload.files : []).forEach((file) => {
      const option = document.createElement('option');
      option.value = file.key;
      option.textContent = `${file.label} · ${file.format.toUpperCase()}`;
      configFileSelect.append(option);
    });
    if ([...configFileSelect.options].some((option) => option.value === selected)) configFileSelect.value = selected;
  }
  const managedFiles = Array.isArray(payload.files) ? payload.files : [];
  [[configBackupFilter, 'All managed files'], [configBackupCreateFile, 'Select managed file…']].forEach(([select, placeholderText]) => {
    if (!select) return;
    const selected = select.value;
    select.replaceChildren();
    const placeholder = document.createElement('option');
    placeholder.value = '';
    placeholder.textContent = placeholderText;
    select.append(placeholder);
    managedFiles.forEach((file) => {
      const option = document.createElement('option');
      option.value = file.key;
      option.textContent = file.label;
      select.append(option);
    });
    if ([...select.options].some((option) => option.value === selected)) select.value = selected;
  });
};

const loadServerConfigOverview = async (token = storageGet(AUTH_SESSION_KEY)) => {
  if (!token || dashboardAccessLevel !== 'owner' || ownerServerConfigRequestInProgress) return false;
  ownerServerConfigRequestInProgress = true;
  refreshServerConfigButton?.setAttribute('disabled', '');
  try {
    const response = await authFetch(OWNER_SERVER_CONFIG_OVERVIEW_URL, { headers: { Accept: 'application/json', Authorization: `Bearer ${token}` } });
    const payload = await response.json().catch(() => ({}));
    if (handleAdminPlayerAuthorizationResponse(response, payload, { actionRequest: false })) return false;
    if (!response.ok || payload.status !== 'ok') throw new Error(payload.message || 'Configuration overview unavailable.');
    applyServerConfigOverview(payload);
    return true;
  } catch (error) {
    showInlineMessage(configFileMessage, error.message || 'Configuration overview unavailable.');
    return false;
  } finally {
    ownerServerConfigRequestInProgress = false;
    refreshServerConfigButton?.removeAttribute('disabled');
  }
};

const loadSelectedConfigFile = async () => {
  const token = storageGet(AUTH_SESSION_KEY);
  const fileKey = configFileSelect?.value || '';
  if (!token || dashboardAccessLevel !== 'owner' || !fileKey || ownerServerConfigRequestInProgress) return;
  ownerServerConfigRequestInProgress = true;
  loadConfigFileButton?.setAttribute('disabled', '');
  showInlineMessage(configFileMessage, 'Loading the live Nitrado file…', 'info');
  try {
    const response = await authFetch(`${OWNER_SERVER_CONFIG_FILE_URL}?file=${encodeURIComponent(fileKey)}`, { headers: { Accept: 'application/json', Authorization: `Bearer ${token}` } });
    const payload = await response.json().catch(() => ({}));
    if (handleAdminPlayerAuthorizationResponse(response, payload, { actionRequest: false })) return;
    if (!response.ok || payload.status !== 'ok') throw new Error(payload.message || 'The file could not be loaded.');
    const file = payload.file || {};
    if (configFileContent) configFileContent.value = String(file.content || '');
    setText('[data-config-file-path]', file.remote_path || file.label || fileKey);
    setText('[data-config-file-sha]', String(file.sha256 || '').slice(0, 16) || '—');
    setText('[data-config-file-size]', readableBytes(file.size_bytes));
    if (configFileDiff) configFileDiff.textContent = 'No diff generated.';
    showInlineMessage(configFileMessage, `${file.label || fileKey} loaded from Nitrado.`, 'success');
  } catch (error) {
    showInlineMessage(configFileMessage, error.message || 'The file could not be loaded.');
  } finally {
    ownerServerConfigRequestInProgress = false;
    loadConfigFileButton?.removeAttribute('disabled');
  }
};

const submitConfigFileAction = async (action) => {
  const token = storageGet(AUTH_SESSION_KEY);
  const fileKey = configFileSelect?.value || '';
  if (!token || dashboardAccessLevel !== 'owner' || !fileKey || ownerServerConfigRequestInProgress) return;
  if (action === 'apply') {
    if ((configFileReason?.value.trim() || '').length < 5) {
      showInlineMessage(configFileMessage, 'Enter a deployment reason of at least five characters.');
      return;
    }
    if (!window.confirm('Create a live backup and upload this exact file to Nitrado?')) return;
  }
  let refreshAfterApply = false;
  ownerServerConfigRequestInProgress = true;
  validateConfigFileButton?.setAttribute('disabled', '');
  applyConfigFileButton?.setAttribute('disabled', '');
  showInlineMessage(configFileMessage, action === 'apply' ? 'Backing up and applying the file…' : 'Validating and comparing the file…', 'info');
  try {
    const response = await protectedActionFetch(OWNER_SERVER_CONFIG_FILE_ACTION_URL, {
      method: 'POST',
      headers: { Accept: 'application/json', 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ action, file_key: fileKey, content: configFileContent?.value || '', reason: configFileReason?.value.trim() || '' })
    });
    const payload = await response.json().catch(() => ({}));
    if (handleAdminPlayerAuthorizationResponse(response, payload, { actionRequest: action === 'apply' })) return;
    if (!response.ok) throw new Error(payload.message || 'The configuration operation failed.');
    if (configFileDiff && 'diff' in payload) configFileDiff.textContent = payload.diff || 'No changes detected.';
    showInlineMessage(configFileMessage, payload.message || 'Configuration operation completed.', 'success');
    refreshAfterApply = action === 'apply';
  } catch (error) {
    showInlineMessage(configFileMessage, error.message || 'The configuration operation failed.');
  } finally {
    ownerServerConfigRequestInProgress = false;
    validateConfigFileButton?.removeAttribute('disabled');
    applyConfigFileButton?.removeAttribute('disabled');
  }
  if (refreshAfterApply) {
    await loadServerConfigOverview(token);
    await loadSelectedConfigFile();
    await Promise.all([loadServerEvents(token), loadConfigBackups(token)]);
  }
};
refreshServerConfigButton?.addEventListener('click', () => Promise.all([loadServerConfigOverview(), loadServerEvents()]));
loadConfigFileButton?.addEventListener('click', loadSelectedConfigFile);
validateConfigFileButton?.addEventListener('click', () => submitConfigFileAction('validate'));
applyConfigFileButton?.addEventListener('click', () => submitConfigFileAction('apply'));

const renderConfigBackups = () => {
  if (!configBackupList) return;
  configBackupList.replaceChildren();
  ownerConfigBackups.forEach((backup) => {
    const row = document.createElement('tr');
    const id = document.createElement('td');
    const strong = document.createElement('strong');
    strong.textContent = `#${backup.id}`;
    const sha = document.createElement('small');
    sha.textContent = String(backup.sha256 || '').slice(0, 12) || '—';
    id.append(strong, document.createElement('br'), sha);

    const file = document.createElement('td');
    const fileStrong = document.createElement('strong');
    fileStrong.textContent = backup.file_label || backup.file_key || 'Managed file';
    const path = document.createElement('small');
    path.textContent = backup.remote_path || '';
    file.append(fileStrong, document.createElement('br'), path);

    const created = document.createElement('td');
    created.textContent = formatAccountDate(backup.created_at);
    const actor = document.createElement('td');
    actor.textContent = backup.created_by_name || 'Unknown';

    const validation = document.createElement('td');
    const pill = document.createElement('span');
    const valid = !String(backup.validation_status || '').toLowerCase().includes('invalid');
    pill.className = valid ? 'validation-pass' : 'table-status offline';
    pill.textContent = String(backup.validation_status || 'unknown').replaceAll('_', ' ');
    validation.append(pill);

    const actions = document.createElement('td');
    const actionWrap = document.createElement('div');
    actionWrap.className = 'heading-actions';
    const compare = document.createElement('button');
    compare.type = 'button';
    compare.className = 'table-button';
    compare.textContent = 'Compare';
    compare.addEventListener('click', () => submitConfigBackupAction('diff', backup));
    const restore = document.createElement('button');
    restore.type = 'button';
    restore.className = 'table-button danger-action';
    restore.textContent = 'Restore';
    restore.addEventListener('click', () => submitConfigBackupAction('restore', backup));
    actionWrap.append(compare, restore);
    actions.append(actionWrap);
    row.append(id, file, created, actor, validation, actions);
    configBackupList.append(row);
  });
  if (configBackupEmpty) configBackupEmpty.hidden = ownerConfigBackups.length !== 0;
};

const loadConfigBackups = async (token = storageGet(AUTH_SESSION_KEY)) => {
  if (!token || dashboardAccessLevel !== 'owner' || ownerConfigBackupRequestInProgress) return false;
  ownerConfigBackupRequestInProgress = true;
  refreshConfigBackupsButton?.setAttribute('disabled', '');
  try {
    const fileKey = String(configBackupFilter?.value || '').trim();
    const url = `${OWNER_SERVER_CONFIG_BACKUPS_URL}?limit=25${fileKey ? `&file=${encodeURIComponent(fileKey)}` : ''}`;
    const response = await authFetch(url, { headers: { Accept: 'application/json', Authorization: `Bearer ${token}` } });
    const payload = await response.json().catch(() => ({}));
    if (handleAdminPlayerAuthorizationResponse(response, payload, { actionRequest: false })) return false;
    if (!response.ok || payload.status !== 'ok') throw new Error(payload.message || 'Configuration backups are unavailable.');
    ownerConfigBackups = Array.isArray(payload.backups) ? payload.backups : [];
    renderConfigBackups();
    if (configBackupError) configBackupError.hidden = true;
    return true;
  } catch (error) {
    if (configBackupError) configBackupError.hidden = false;
    showInlineMessage(configBackupMessage, error.message || 'Configuration backups are unavailable.');
    return false;
  } finally {
    ownerConfigBackupRequestInProgress = false;
    refreshConfigBackupsButton?.removeAttribute('disabled');
  }
};

const submitConfigBackupAction = async (action, backup = null) => {
  const token = storageGet(AUTH_SESSION_KEY);
  if (!token || dashboardAccessLevel !== 'owner' || ownerConfigBackupRequestInProgress) return;
  const reason = String(configBackupReason?.value || '').trim();
  if (action === 'create' && !configBackupCreateFile?.value) {
    showInlineMessage(configBackupMessage, 'Select a managed file to back up.');
    return;
  }
  if (['create', 'restore'].includes(action) && reason.length < 5) {
    showInlineMessage(configBackupMessage, 'Enter a backup or restore reason of at least five characters.');
    return;
  }
  if (action === 'restore' && !window.confirm(`Restore backup #${backup?.id} to the live Nitrado file? A recovery backup will be created first when the live file differs.`)) return;
  let refreshAfterWrite = false;
  ownerConfigBackupRequestInProgress = true;
  createConfigBackupButton?.setAttribute('disabled', '');
  refreshConfigBackupsButton?.setAttribute('disabled', '');
  showInlineMessage(configBackupMessage, action === 'diff' ? 'Comparing the backup with the live file…' : action === 'restore' ? 'Restoring and verifying the selected backup…' : 'Creating and validating the live backup…', 'info');
  try {
    const body = { action, reason };
    if (action === 'create') body.file_key = configBackupCreateFile?.value || '';
    else body.backup_id = Number(backup?.id || 0);
    const response = await protectedActionFetch(OWNER_SERVER_CONFIG_BACKUP_ACTION_URL, {
      method: 'POST',
      headers: { Accept: 'application/json', 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(body)
    });
    const payload = await response.json().catch(() => ({}));
    if (handleAdminPlayerAuthorizationResponse(response, payload, { actionRequest: action !== 'diff' })) return;
    if (!response.ok || payload.status !== 'ok') throw new Error(payload.message || 'The configuration backup operation failed.');
    if (action === 'diff' && configBackupDiff) {
      const header = payload.different ? `Backup #${backup.id} differs from the live file.` : `Backup #${backup.id} matches the live file.`;
      configBackupDiff.textContent = `${header}\n\n${payload.diff || 'No changes detected.'}`;
    }
    showInlineMessage(configBackupMessage, payload.message || 'Configuration backup operation completed.', 'success');
    refreshAfterWrite = action !== 'diff';
  } catch (error) {
    showInlineMessage(configBackupMessage, error.message || 'The configuration backup operation failed.');
  } finally {
    ownerConfigBackupRequestInProgress = false;
    createConfigBackupButton?.removeAttribute('disabled');
    refreshConfigBackupsButton?.removeAttribute('disabled');
  }
  if (refreshAfterWrite) await Promise.all([loadServerConfigOverview(token), loadConfigBackups(token)]);
};

refreshConfigBackupsButton?.addEventListener('click', () => loadConfigBackups());
configBackupFilter?.addEventListener('change', () => loadConfigBackups());
createConfigBackupButton?.addEventListener('click', () => submitConfigBackupAction('create'));

const renderServerEvents = () => {
  if (!serverEventList) return;
  const query = String(serverEventSearch?.value || '').trim().toLowerCase();
  const visible = ownerServerEvents.filter((event) => {
    const children = (event.children || []).map((child) => child.type).join(' ');
    return !query || `${event.name} ${children} ${event.position_type} ${event.limit}`.toLowerCase().includes(query);
  });
  serverEventList.replaceChildren();
  visible.forEach((event) => {
    const row = document.createElement('tr');
    const name = document.createElement('td'); const strong = document.createElement('strong'); strong.textContent = event.name; const small = document.createElement('small'); small.textContent = `${event.position_type} · ${event.limit}`; name.append(strong, document.createElement('br'), small);
    const children = document.createElement('td'); children.textContent = (event.children || []).map((child) => child.type).join(', ') || 'No child types';
    const population = document.createElement('td'); population.textContent = `${event.nominal} nominal · ${event.minimum}–${event.maximum}`;
    const positions = document.createElement('td'); positions.textContent = `${event.position_count} positions${event.has_zone ? ' · zone' : ''}`;
    const state = document.createElement('td'); const pill = document.createElement('span'); pill.className = `table-status ${event.active ? 'online' : 'offline'}`; pill.textContent = event.active ? 'Active' : 'Inactive'; state.append(pill);
    row.append(name, children, population, positions, state);
    serverEventList.append(row);
  });
  if (serverEventEmpty) serverEventEmpty.hidden = visible.length !== 0;
};

const loadServerEvents = async (token = storageGet(AUTH_SESSION_KEY)) => {
  if (!token || dashboardAccessLevel !== 'owner') return false;
  refreshServerEventsButton?.setAttribute('disabled', '');
  try {
    const response = await authFetch(OWNER_SERVER_EVENTS_URL, { headers: { Accept: 'application/json', Authorization: `Bearer ${token}` } });
    const payload = await response.json().catch(() => ({}));
    if (handleAdminPlayerAuthorizationResponse(response, payload, { actionRequest: false })) return false;
    if (!response.ok || payload.status !== 'ok') throw new Error(payload.message || 'Events are unavailable.');
    ownerServerEvents = Array.isArray(payload.events) ? payload.events : [];
    const summary = payload.summary || {};
    setText('[data-server-event-count]', String(Number(summary.event_count || 0)));
    setText('[data-server-active-count]', String(Number(summary.active_count || 0)));
    setText('[data-server-position-count]', String(Number(summary.position_count || 0)));
    setText('[data-server-zone-count]', String(Number(summary.zone_count || 0)));
    renderServerEvents();
    if (serverEventError) serverEventError.hidden = true;
    return true;
  } catch (error) {
    if (serverEventError) serverEventError.hidden = false;
    return false;
  } finally {
    refreshServerEventsButton?.removeAttribute('disabled');
  }
};
refreshServerEventsButton?.addEventListener('click', () => loadServerEvents());
serverEventSearch?.addEventListener('input', renderServerEvents);

const activateDeliveryView = ({ view = '', section = '' } = {}) => {
  const token = storageGet(AUTH_SESSION_KEY);
  if (view === 'locations') {
    loadDeliveryLocations(token);
    window.setTimeout(() => {
      const instance = ensureDeliveryLocationMap();
      syncDeliveryLocationMap();
      instance?.invalidateSize();
    }, 0);
  }
  if (view === 'delivery') loadDeliveryQueue(token);
  if (view === 'serverconfig') {
    if (section === 'files') loadServerConfigOverview(token);
    else if (section === 'events') loadServerEvents(token);
    else Promise.all([loadServerConfigOverview(token), loadServerEvents(token)]);
  }
  if (view === 'configuration' && ['workflow', 'backups'].includes(section)) {
    Promise.all([loadServerConfigOverview(token), loadConfigBackups(token)]);
  }
};

window.WWZDeliveryController = Object.freeze({
  activate: activateDeliveryView,
});
window.__wwzDeliveryControllerReady = true;

window.addEventListener('wwz:serverchange', () => {
  if (!deliveryLocationMapInstance) return;
  deliveryLocationMapInstance.destroy();
  deliveryLocationMapInstance = null;
  ensureDeliveryLocationMap()?.invalidateSize();
  syncDeliveryLocationMap();
});

