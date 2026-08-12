(() => {
  'use strict';

  const STRUCTURED_URL = `${DASHBOARD_API_BASE}/api/owner/server/config/structured`;
  const STRUCTURED_ACTION_URL = `${DASHBOARD_API_BASE}/api/owner/server/config/structured/action`;
  const workspace = document.querySelector('[data-config-studio-workspace]');
  if (!workspace) return;

  const tabs = [...document.querySelectorAll('[data-config-studio-tab]')];
  const refreshButton = document.querySelector('[data-config-studio-refresh]');
  const previewButton = document.querySelector('[data-config-studio-preview]');
  const applyButton = document.querySelector('[data-config-studio-apply]');
  const reasonInput = document.querySelector('[data-config-studio-reason]');
  const messageBox = document.querySelector('[data-config-studio-message]');
  const diffOutput = document.querySelector('[data-config-studio-diff]');
  const fileLabel = document.querySelector('[data-config-studio-file]');
  const shaLabel = document.querySelector('[data-config-studio-sha]');

  const state = {
    area: 'gameplay',
    data: null,
    busy: false,
    lootQuery: '',
    selectedLoot: null,
    messageAction: 'add',
    selectedMessage: null,
    selectedEvent: null,
  };

  const el = (tag, className = '', text = '') => {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== '') node.textContent = text;
    return node;
  };

  const field = (label, input, help = '') => {
    const wrap = el('label', 'dialog-field');
    const heading = el('span', '', label);
    if (help) {
      const small = el('small', '', help);
      heading.append(' ', small);
    }
    wrap.append(heading, input);
    return wrap;
  };

  const input = (type, value = '', attrs = {}) => {
    const node = document.createElement('input');
    node.type = type;
    if (type === 'checkbox') node.checked = Boolean(value);
    else node.value = value ?? '';
    Object.entries(attrs).forEach(([key, val]) => {
      if (val !== null && val !== undefined) node.setAttribute(key, String(val));
    });
    return node;
  };

  const selectBoolean = (value) => {
    const node = document.createElement('select');
    [['true', 'Enabled / True'], ['false', 'Disabled / False']].forEach(([v, label]) => {
      const option = document.createElement('option');
      option.value = v;
      option.textContent = label;
      node.append(option);
    });
    node.value = value ? 'true' : 'false';
    return node;
  };

  const numberValue = (value) => {
    const n = Number(value);
    return Number.isFinite(n) ? n : 0;
  };

  const show = (text, kind = '') => showInlineMessage(messageBox, text, kind);

  const setBusy = (busy) => {
    state.busy = busy;
    [refreshButton, previewButton, applyButton, ...tabs].forEach((node) => {
      if (!node) return;
      if (busy) node.setAttribute('disabled', ''); else node.removeAttribute('disabled');
    });
  };

  const setFileMeta = (payload) => {
    const file = payload?.file || payload?.files?.events || null;
    if (fileLabel) fileLabel.textContent = file?.remote_path || file?.label || (state.area === 'events' ? 'events.xml + cfgeventspawns.xml' : 'Live Nitrado file');
    if (shaLabel) shaLabel.textContent = String(file?.sha256 || '').slice(0, 16) || '—';
  };

  const apiGet = async (area, q = '') => {
    const token = storageGet(AUTH_SESSION_KEY);
    if (!token || dashboardAccessLevel !== 'owner') throw new Error('Owner sign-in is required.');
    const url = `${STRUCTURED_URL}?area=${encodeURIComponent(area)}${q ? `&q=${encodeURIComponent(q)}` : ''}`;
    const response = await authFetch(url, { headers: { Accept: 'application/json', Authorization: `Bearer ${token}` } });
    const payload = await response.json().catch(() => ({}));
    if (handleAdminPlayerAuthorizationResponse(response, payload, { actionRequest: false })) throw new Error(payload.message || 'Owner access is required.');
    if (!response.ok || payload.status !== 'ok') throw new Error(payload.message || 'Structured configuration is unavailable.');
    return payload;
  };

  const loadArea = async (area = state.area, q = '') => {
    if (state.busy) return;
    state.area = area;
    tabs.forEach((tab) => tab.classList.toggle('active', tab.dataset.configStudioTab === area));
    setBusy(true);
    workspace.replaceChildren(el('p', 'empty-state', 'Loading live Nitrado configuration…'));
    try {
      const payload = await apiGet(area, q);
      state.data = payload;
      setFileMeta(payload);
      renderArea();
      if (diffOutput) diffOutput.textContent = 'No structured change preview generated.';
      show(`${area.charAt(0).toUpperCase()}${area.slice(1)} configuration loaded from Nitrado.`, 'success');
    } catch (error) {
      workspace.replaceChildren(el('p', 'empty-state', error.message || 'Configuration could not be loaded.'));
      show(error.message || 'Configuration could not be loaded.');
    } finally {
      setBusy(false);
    }
  };

  const getByPath = (obj, path) => path.split('.').reduce((value, key) => (value && typeof value === 'object' ? value[key] : undefined), obj);

  const renderGameplay = () => {
    const data = state.data || {};
    const known = data.known || {};
    const fields = [
      ['GeneralData.disableBaseDamage', 'Disable base damage', 'bool'],
      ['GeneralData.disableContainerDamage', 'Disable container damage', 'bool'],
      ['GeneralData.disableRespawnDialog', 'Disable respawn dialog', 'bool'],
      ['GeneralData.disableRespawnInUnconsciousness', 'Block unconscious respawn', 'bool'],
      ['PlayerData.disablePersonalLight', 'Disable personal light', 'bool'],
      ['WorldsData.lightingConfig', 'Night lighting (0 bright / 1 dark)', 'number'],
      ['PlayerData.StaminaData.staminaMax', 'Maximum stamina', 'number'],
      ['PlayerData.StaminaData.staminaMinCap', 'Minimum stamina cap', 'number'],
      ['PlayerData.StaminaData.staminaWeightLimitThreshold', 'Weight threshold', 'number'],
      ['PlayerData.StaminaData.staminaKgToStaminaPercentPenalty', 'Weight penalty', 'number'],
      ['UIData.use3DMap', 'Use 3D map', 'bool'],
      ['MapData.ignoreMapOwnership', 'Ignore map ownership', 'bool'],
      ['MapData.ignoreNavItemsOwnership', 'Ignore navigation item ownership', 'bool'],
      ['MapData.displayPlayerPosition', 'Display player position', 'bool'],
      ['MapData.displayNavInfo', 'Display navigation info', 'bool'],
      ['BaseBuildingData.HologramData.disableIsCollidingBBoxCheck', 'Bypass bounding-box placement check', 'bool'],
      ['BaseBuildingData.HologramData.disableIsClippingRoofCheck', 'Bypass roof clipping check', 'bool'],
      ['BaseBuildingData.ConstructionData.disableIsCollidingCheck', 'Bypass construction collision check', 'bool'],
    ];
    const intro = el('div', 'config-studio-intro');
    intro.append(el('h3', '', 'Gameplay & Building'), el('p', '', 'Purpose-built controls for common cfggameplay.json values. Advanced values remain available in Mission Files.'));
    const grid = el('div', 'config-studio-grid');
    fields.forEach(([path, label, kind]) => {
      const current = known[path];
      const control = kind === 'bool' ? selectBoolean(Boolean(current)) : input('number', current ?? 0, { step: 'any' });
      control.dataset.gameplayPath = path;
      control.dataset.original = kind === 'bool' ? String(Boolean(current)) : String(current ?? '');
      control.dataset.valueType = kind;
      grid.append(field(label, control));
    });
    const tempTitle = el('div', 'panel-heading compact-heading');
    tempTitle.append(el('div', '', ''));
    tempTitle.firstChild.append(el('p', 'panel-kicker', 'Environment'), el('h3', '', 'Monthly Temperatures'));
    const tableWrap = el('div', 'responsive-table');
    const table = document.createElement('table');
    const head = document.createElement('thead');
    const hr = document.createElement('tr');
    ['Month', 'Minimum °C', 'Maximum °C'].forEach((name) => hr.append(el('th', '', name)));
    head.append(hr);
    const body = document.createElement('tbody');
    const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    months.forEach((month, index) => {
      const row = document.createElement('tr');
      row.append(el('td', '', month));
      const minCell = document.createElement('td');
      const minInput = input('number', data.minimums?.[index] ?? 0, { step: '0.1' });
      minInput.dataset.tempKind = 'min'; minInput.dataset.tempIndex = String(index); minInput.dataset.original = String(data.minimums?.[index] ?? 0);
      minCell.append(minInput);
      const maxCell = document.createElement('td');
      const maxInput = input('number', data.maximums?.[index] ?? 0, { step: '0.1' });
      maxInput.dataset.tempKind = 'max'; maxInput.dataset.tempIndex = String(index); maxInput.dataset.original = String(data.maximums?.[index] ?? 0);
      maxCell.append(maxInput);
      row.append(minCell, maxCell); body.append(row);
    });
    table.append(head, body); tableWrap.append(table);
    workspace.append(intro, grid, tempTitle, tableWrap);
  };

  const renderWeather = () => {
    const weather = state.data?.weather || {};
    const top = el('div', 'config-studio-grid');
    const enabled = selectBoolean(Boolean(weather.enable)); enabled.dataset.weatherRoot = 'enabled'; enabled.dataset.original = String(Boolean(weather.enable));
    const reset = selectBoolean(Boolean(weather.reset)); reset.dataset.weatherRoot = 'reset'; reset.dataset.original = String(Boolean(weather.reset));
    const preset = document.createElement('select'); preset.dataset.weatherPreset = '';
    const custom = document.createElement('option'); custom.value = ''; custom.textContent = state.data?.matched_preset ? `Current: ${state.data.matched_preset.replaceAll('_',' ')}` : 'Custom / keep current'; preset.append(custom);
    [['rare_rain','Rare Rain'],['clear_event','Clear Event Weather'],['no_rain','No Rain'],['heavy_fog','Heavy Fog'],['stormy','Stormy'],['bohemia_example','Bohemia Example']].forEach(([key,label]) => { const option=document.createElement('option'); option.value=key; option.textContent=label; preset.append(option); });
    top.append(field('Weather enabled', enabled), field('Reset stored weather', reset), field('Apply preset', preset, 'Preset overrides the custom fields below when selected.'));
    workspace.append(top);

    const sections = weather.sections || {};
    const sectionGrid = el('div', 'config-weather-sections');
    [['overcast','Overcast'],['fog','Fog'],['rain','Rain']].forEach(([key,label]) => {
      const item = sections[key] || {};
      const card = el('section', 'inset-panel config-weather-card');
      card.append(el('h3', '', label));
      const grid = el('div', 'config-studio-grid compact-grid');
      const defs = [
        ['actual','Current',item.current?.actual],['minimum','Minimum',item.limits?.min],['maximum','Maximum',item.limits?.max],
        ['transition_min','Transition min (s)',item.timelimits?.min],['transition_max','Transition max (s)',item.timelimits?.max],
        ['change_min','Change min',item.changelimits?.min],['change_max','Change max',item.changelimits?.max],
      ];
      if (key === 'rain') defs.push(['threshold_min','Threshold min',item.thresholds?.min],['threshold_max','Threshold max',item.thresholds?.max],['threshold_end','Threshold end (s)',item.thresholds?.end]);
      defs.forEach(([name,labelText,value]) => {
        const control=input('number', value ?? 0, { step: Number.isInteger(value) ? '1' : 'any' });
        control.dataset.weatherSection=key; control.dataset.weatherField=name; control.dataset.original=String(value ?? '');
        grid.append(field(labelText,control));
      });
      card.append(grid); sectionGrid.append(card);
    });
    workspace.append(sectionGrid);

    const windCard = el('section', 'inset-panel config-weather-card');
    windCard.append(el('h3', '', 'Wind & Storm'));
    const windGrid = el('div', 'config-studio-grid compact-grid');
    const windDefs = [
      ['windMagnitude','actual','Wind magnitude current',sections.windMagnitude?.current?.actual],
      ['windMagnitude','minimum','Wind magnitude min',sections.windMagnitude?.limits?.min],
      ['windMagnitude','maximum','Wind magnitude max',sections.windMagnitude?.limits?.max],
      ['windDirection','actual','Wind direction current',sections.windDirection?.current?.actual],
      ['windDirection','minimum','Wind direction min',sections.windDirection?.limits?.min],
      ['windDirection','maximum','Wind direction max',sections.windDirection?.limits?.max],
    ];
    windDefs.forEach(([section,name,labelText,value]) => { const control=input('number',value ?? 0,{step:'any'}); control.dataset.weatherSection=section; control.dataset.weatherField=name; control.dataset.original=String(value ?? ''); windGrid.append(field(labelText,control)); });
    [['density','Storm density',weather.storm?.density],['threshold','Storm threshold',weather.storm?.threshold],['timeout','Storm timeout (s)',weather.storm?.timeout]].forEach(([name,labelText,value]) => { const control=input('number',value ?? 0,{step:name==='timeout'?'1':'any'}); control.dataset.weatherStorm=name; control.dataset.original=String(value ?? ''); windGrid.append(field(labelText,control)); });
    const snow = el('div', 'security-notice compact-notice');
    snow.append(el('span','', weather.chernarus_snowfall_safe ? '✓' : '⚠'), el('div',''));
    snow.lastChild.append(el('strong','', weather.chernarus_snowfall_safe ? 'Chernarus snowfall is disabled' : 'Non-zero snowfall detected'), el('p','', 'This editor intentionally leaves snowfall unchanged.'));
    windCard.append(windGrid, snow); workspace.append(windCard);
  };

  const messageForm = (record = null, mode = 'add') => {
    const form = el('section', 'inset-panel config-message-editor');
    form.dataset.messageEditor = '';
    state.messageAction = mode;
    state.selectedMessage = record;
    form.append(el('h3', '', mode === 'edit' ? `Edit Message #${record.index}` : 'Add Message'));
    const textArea = document.createElement('textarea'); textArea.rows=4; textArea.maxLength=2000; textArea.value=record?.text || ''; textArea.dataset.messageText='';
    const grid=el('div','config-studio-grid compact-grid');
    const delay=input('number',record?.delay ?? 0,{min:'0',step:'1'}); delay.dataset.messageDelay='';
    const repeat=input('number',record?.repeat ?? 0,{min:'0',step:'1'}); repeat.dataset.messageRepeat='';
    const deadline=input('number',record?.deadline ?? 0,{min:'0',step:'1'}); deadline.dataset.messageDeadline='';
    const onconnect=selectBoolean(Boolean(record?.onconnect)); onconnect.dataset.messageOnconnect='';
    const shutdown=selectBoolean(Boolean(record?.shutdown)); shutdown.dataset.messageShutdown='';
    grid.append(field('Delay (minutes)',delay),field('Repeat (minutes)',repeat),field('Deadline / countdown (minutes)',deadline),field('On player connect',onconnect),field('Automatic shutdown',shutdown,'Used by restart intelligence when configured.'));
    form.append(field('Message text',textArea),grid);
    if (mode === 'edit') {
      const actions=el('div','heading-actions');
      const disable=el('button','secondary-action','Prepare Disable'); disable.type='button'; disable.addEventListener('click',()=>{state.messageAction='disable'; show(`Message #${record.index} is ready to preview as disabled.`,'info');});
      const remove=el('button','secondary-action danger-action','Prepare Delete'); remove.type='button'; remove.addEventListener('click',()=>{state.messageAction='remove'; show(`Message #${record.index} is ready to preview for permanent removal.`,'info');});
      actions.append(disable,remove); form.append(actions);
    }
    return form;
  };

  const renderMessages = () => {
    const data=state.data || {};
    const summary=el('div','operations-summary-grid');
    [["Active",data.messages?.length ?? 0],["Disabled",data.disabled_messages?.length ?? 0],["Shutdown entries",data.shutdown_indexes?.length ?? 0]].forEach(([label,value])=>{const box=el('div');box.append(el('span','',label),el('strong','',String(value)));summary.append(box);});
    const note=el('div','security-notice compact-notice'); note.append(el('span','','↻'),el('div')); note.lastChild.append(el('strong','','Restart schedule source'),el('p','','The bot derives restart intelligence from live messages.xml. Editing shutdown/deadline messages here feeds the existing countdown/status system; quest timers remain independent.'));
    workspace.append(summary,note);
    const list=el('div','config-message-list');
    (data.messages || []).forEach((record)=>{
      const card=el('article','inset-panel config-message-row');
      const copy=el('div'); copy.append(el('strong','',`#${record.index} · ${record.summary}`),el('p','',record.text));
      const edit=el('button','table-button','Edit'); edit.type='button'; edit.addEventListener('click',()=>{ const old=workspace.querySelector('[data-message-editor]'); old?.replaceWith(messageForm(record,'edit')); });
      card.append(copy,edit); list.append(card);
    });
    workspace.append(list);
    if ((data.disabled_messages || []).length) {
      const disabledTitle=el('div','panel-heading compact-heading');disabledTitle.append(el('div'));disabledTitle.firstChild.append(el('p','panel-kicker','Disabled'),el('h3','','Disabled Messages'));workspace.append(disabledTitle);
      const disabledList=el('div','config-message-list');
      (data.disabled_messages||[]).forEach((record)=>{const card=el('article','inset-panel config-message-row');const copy=el('div');copy.append(el('strong','',`Disabled #${record.index} · ${record.summary}`),el('p','',record.text));const enable=el('button','table-button','Prepare Enable');enable.type='button';enable.addEventListener('click',()=>{state.selectedMessage=record;state.messageAction='enable';show(`Disabled message #${record.index} is ready to preview for enable.`,'info');});card.append(copy,enable);disabledList.append(card);});
      workspace.append(disabledList);
    }
    workspace.append(messageForm(null,'add'));
  };

  const renderLootEditor = (record) => {
    const editor=el('section','inset-panel config-loot-editor'); editor.dataset.lootEditor='';
    if (!record) { editor.append(el('p','empty-state','Search for a classname, then select an item to edit.')); return editor; }
    state.selectedLoot=record;
    editor.append(el('h3','',record.name));
    const grid=el('div','config-studio-grid compact-grid');
    const defs=[['nominal','Nominal'],['minimum','Minimum'],['lifetime','Lifetime (s)'],['restock','Restock (s)'],['quantmin','Quantity min'],['quantmax','Quantity max'],['cost','Cost']];
    defs.forEach(([name,label])=>{const control=input('number',record[name],{step:'1'});control.dataset.lootField=name;control.dataset.original=String(record[name]);grid.append(field(label,control));});
    [['category','Category',record.categories],['usages','Usage',record.usages],['tiers','Tier / value',record.values],['tags','Tags',record.tags]].forEach(([name,label,values])=>{const control=input('text',(values||[]).join(', '));control.dataset.lootField=name;control.dataset.original=control.value;grid.append(field(label,control,'Comma-separated'));});
    editor.append(grid);
    const status=el('p','table-note',record.managed_disabled ? 'This item is managed-disabled.' : 'This item is active according to types.xml.');
    const action=el('button',record.managed_disabled?'secondary-action':'secondary-action danger-action',record.managed_disabled?'Prepare Enable':'Prepare Disable'); action.type='button'; action.dataset.lootToggle=''; action.addEventListener('click',()=>{action.dataset.pendingAction=record.managed_disabled?'enable':'disable';show(`${record.name} is ready to preview for ${record.managed_disabled?'enable':'disable'}.`,'info');});
    editor.append(status,action); return editor;
  };

  const renderLoot = () => {
    const data=state.data || {};
    const summary=el('div','operations-summary-grid');
    [['Total',data.summary?.total ?? '—'],['Active',data.summary?.active ?? '—'],['Zero nominal',data.summary?.zero_nominal ?? '—'],['Managed disabled',data.summary?.managed_disabled ?? '—']].forEach(([label,value])=>{const box=el('div');box.append(el('span','',label),el('strong','',String(value)));summary.append(box);});
    const searchWrap=el('div','config-loot-search command-bar');
    const search=input('search',state.lootQuery,{placeholder:'Search exact or partial DayZ classname…'}); search.dataset.lootSearch='';
    const button=el('button','secondary-action','Search Live types.xml');button.type='button';button.addEventListener('click',()=>{state.lootQuery=search.value.trim();loadArea('loot',state.lootQuery);});
    search.addEventListener('keydown',(event)=>{if(event.key==='Enter'){event.preventDefault();button.click();}});
    searchWrap.append(search,button); workspace.append(summary,searchWrap);
    const results=el('div','config-loot-results');
    if (!state.lootQuery) results.append(el('p','empty-state','Search only loads matching entries so the dashboard does not render thousands of loot rows at once.'));
    else if (!(data.items||[]).length) results.append(el('p','empty-state','No matching types.xml items found.'));
    else (data.items||[]).forEach((record)=>{const row=el('button','config-loot-result');row.type='button';row.append(el('strong','',record.name),el('small','',`Nominal ${record.nominal} · Min ${record.minimum} · ${(record.categories||[]).join(', ')||'Uncategorised'}`));row.addEventListener('click',()=>{const old=workspace.querySelector('[data-loot-editor]');old?.replaceWith(renderLootEditor(record));});results.append(row);});
    workspace.append(results,renderLootEditor(null));
  };

  const renderEventCreateEditor = () => {
    state.selectedEvent = null;
    const editor = el('section', 'inset-panel config-event-editor');
    editor.dataset.eventEditor = '';
    editor.dataset.eventCreateEditor = '';
    editor.append(el('h3', '', 'Create Server Event'));
    const eventXml = document.createElement('textarea');
    eventXml.rows = 15;
    eventXml.maxLength = 30000;
    eventXml.spellcheck = false;
    eventXml.dataset.eventCreateXml = '';
    eventXml.placeholder = '<event name="VehicleExample">\n  ...\n</event>';
    const zoneXml = document.createElement('textarea');
    zoneXml.rows = 5;
    zoneXml.maxLength = 2000;
    zoneXml.spellcheck = false;
    zoneXml.dataset.eventCreateZone = '';
    zoneXml.placeholder = '<zone smin="1" smax="3" dmin="3" dmax="5" r="45" />';
    editor.append(
      field('Event XML', eventXml, 'Required · exactly one complete <event> element'),
      field('Event Zone', zoneXml, 'Optional · leave blank when this event does not require a zone'),
      el('p', 'table-note', 'Event positions can be added after creation using the same Events & Positions editor.')
    );
    return editor;
  };

  const renderEventEditor = (record) => {
    const editor=el('section','inset-panel config-event-editor');editor.dataset.eventEditor='';
    if(!record){editor.append(el('p','empty-state','Select an event to edit its CE settings, positions or optional zone.'));return editor;}
    state.selectedEvent=record;
    editor.append(el('h3','',record.name));
    const operation=document.createElement('select');operation.dataset.eventOperation='';
    [['edit','Event settings'],['child_add','Add child'],['child_edit','Edit child'],['child_remove','Remove child'],['position_add','Add position'],['position_edit','Edit position'],['position_remove','Remove position'],['zone_set','Set / edit zone'],['zone_remove','Remove zone'],['remove','Remove event']].forEach(([v,label])=>{const o=document.createElement('option');o.value=v;o.textContent=label;operation.append(o);});
    editor.append(field('Change type',operation));
    const fields=el('div','config-event-operation-fields');fields.dataset.eventOperationFields='';editor.append(fields);
    const draw=()=>{
      fields.replaceChildren(); const op=operation.value;
      if(op==='edit'){
        const grid=el('div','config-studio-grid compact-grid');
        [['nominal','Nominal'],['min','Minimum'],['max','Maximum'],['lifetime','Lifetime'],['restock','Restock'],['saferadius','Safe radius'],['distanceradius','Distance radius'],['cleanupradius','Cleanup radius']].forEach(([name,label])=>{const c=input('number',record[name],{step:'1',min:'0'});c.dataset.eventField=name;grid.append(field(label,c));});
        const pos=input('text',record.position);pos.dataset.eventField='position';const limit=input('text',record.limit);limit.dataset.eventField='limit';const active=selectBoolean(Boolean(record.active));active.dataset.eventField='active';grid.append(field('Position type',pos),field('Limit',limit),field('Active',active));fields.append(grid);
      } else if(op.startsWith('child_')){
        const grid=el('div','config-studio-grid compact-grid');
        const children=record.children||[];
        const childSelect=document.createElement('select');childSelect.dataset.eventChildType='';
        if(op==='child_add'){const blank=document.createElement('option');blank.value='';blank.textContent='New child';childSelect.append(blank);}
        children.forEach((child)=>{const option=document.createElement('option');option.value=child.type;option.textContent=child.type;childSelect.append(option);});
        if(op!=='child_add' && !children.length){const option=document.createElement('option');option.value='';option.textContent='No children configured';childSelect.append(option);}
        grid.append(field(op==='child_add'?'Child mode':'Child',childSelect));
        const replacement=input('text','',{placeholder:op==='child_add'?'New DayZ classname':'Leave blank to keep classname'});replacement.dataset.eventChildReplacement='';grid.append(field(op==='child_add'?'New child classname':'Replacement classname',replacement));
        const numericControls={};
        if(op!=='child_remove'){
          [['minimum','Minimum',0],['maximum','Maximum',1],['lootminimum','Loot min',0],['lootmaximum','Loot max',0]].forEach(([name,label,value])=>{const c=input('number',value,{min:'0',step:'1'});c.dataset.eventChildField=name;numericControls[name]=c;grid.append(field(label,c));});
          const fillChild=()=>{if(op==='child_add')return;const selected=children.find((child)=>child.type===childSelect.value);if(!selected)return;numericControls.minimum.value=selected.min;numericControls.maximum.value=selected.max;numericControls.lootminimum.value=selected.lootmin;numericControls.lootmaximum.value=selected.lootmax;};
          childSelect.addEventListener('change',fillChild);fillChild();
        }
        fields.append(grid);
      } else if(op.startsWith('position_')){
        const grid=el('div','config-studio-grid compact-grid');
        const positions=record.positions||[];
        let positionSelect=null;
        if(op!=='position_add'){
          positionSelect=document.createElement('select');positionSelect.dataset.eventPositionIndex='';
          positions.forEach((pos,index)=>{const option=document.createElement('option');option.value=String(index+1);option.textContent=`#${index+1} · X ${pos.x} · Z ${pos.z} · A ${pos.a}`;positionSelect.append(option);});
          if(!positions.length){const option=document.createElement('option');option.value='0';option.textContent='No positions configured';positionSelect.append(option);}
          grid.append(field('Position',positionSelect,`${positions.length} currently configured`));
        }
        if(op==='position_add'||op==='position_edit'){
          const controls={};
          [['x','X',''],['y','Y / height',''],['z','Z',''],['angle','Angle',0],['group','Group','']].forEach(([name,label,value])=>{const c=input(name==='group'?'text':'number',value,{step:name==='group'?null:'any'});c.dataset.eventPositionField=name;controls[name]=c;grid.append(field(label,c,name==='y'?'Optional':''));});
          const fillPosition=()=>{if(op==='position_add'||!positionSelect)return;const selected=positions[Number(positionSelect.value)-1];if(!selected)return;controls.x.value=selected.x;controls.y.value=selected.y ?? '';controls.z.value=selected.z;controls.angle.value=selected.a;controls.group.value=selected.group ?? '';};
          positionSelect?.addEventListener('change',fillPosition);fillPosition();
        }
        fields.append(grid);
      } else if(op==='zone_set'){
        const zone=record.zone||{};const grid=el('div','config-studio-grid compact-grid');
        [['smin','Spawn min',zone.smin ?? 1],['smax','Spawn max',zone.smax ?? 1],['dmin','Distance min',zone.dmin ?? 1],['dmax','Distance max',zone.dmax ?? 1],['radius','Radius',zone.r ?? 0]].forEach(([name,label,value])=>{const c=input('number',value,{min:'0',step:name==='radius'?'any':'1'});c.dataset.eventZoneField=name;grid.append(field(label,c));});fields.append(grid);
      } else if(op==='zone_remove') fields.append(el('p','table-note',record.zone?'The current optional Event Zone will be removed.':'This event currently has no Event Zone.'));
      else if(op==='remove'){const removePositions=selectBoolean(true);removePositions.dataset.eventRemovePositions='';fields.append(field('Also remove event positions / zone',removePositions));}
    };
    operation.addEventListener('change',draw);draw();
    const detail=el('div','config-event-detail');detail.append(el('p','table-note',`Children: ${(record.children||[]).length} · Positions: ${(record.positions||[]).length} · Zone: ${record.zone?'Yes':'No'}`));
    if((record.positions||[]).length){const list=el('ol','config-position-list');record.positions.slice(0,25).forEach((pos,index)=>{list.append(el('li','',`#${index+1} X ${pos.x} · Y ${pos.y ?? 'auto'} · Z ${pos.z} · A ${pos.a}${pos.group?` · ${pos.group}`:''}`));});detail.append(list);}
    editor.append(detail);return editor;
  };

  const renderEvents = () => {
    const data=state.data||{};
    const summary=el('div','operations-summary-grid');
    [['Events',data.event_count ?? '—'],['Positions',data.position_count ?? '—'],['Zones',data.zone_count ?? '—']].forEach(([label,value])=>{const box=el('div');box.append(el('span','',label),el('strong','',String(value)));summary.append(box);});
    const searchWrap=el('div','command-bar');const search=input('search','',{placeholder:'Search event or child classname…'});const button=el('button','secondary-action','Search Events');button.type='button';button.addEventListener('click',()=>loadArea('events',search.value.trim()));search.addEventListener('keydown',(e)=>{if(e.key==='Enter'){e.preventDefault();button.click();}});const createButton=el('button','primary-action','Create Event');createButton.type='button';createButton.addEventListener('click',()=>{const old=workspace.querySelector('[data-event-editor]');old?.replaceWith(renderEventCreateEditor());show('Enter one complete Event XML element. Event Zone is optional.','info');});searchWrap.append(search,button,createButton);workspace.append(summary,searchWrap);
    const list=el('div','config-event-list');(data.events||[]).forEach((record)=>{const row=el('button','config-event-result');row.type='button';row.append(el('strong','',record.name),el('small','',`Nominal ${record.nominal} · ${record.active?'Active':'Inactive'} · ${(record.positions||[]).length} position(s)${record.zone?' · Zone':''}`));row.addEventListener('click',()=>{const old=workspace.querySelector('[data-event-editor]');old?.replaceWith(renderEventEditor(record));});list.append(row);});workspace.append(list,renderEventEditor(null));
  };

  const renderArea = () => {
    workspace.replaceChildren();
    if (state.area === 'gameplay') renderGameplay();
    else if (state.area === 'weather') renderWeather();
    else if (state.area === 'messages') renderMessages();
    else if (state.area === 'loot') renderLoot();
    else renderEvents();
  };

  const buildGameplayRequest = () => {
    const updates={};
    workspace.querySelectorAll('[data-gameplay-path]').forEach((control)=>{
      const kind=control.dataset.valueType;const value=kind==='bool'?control.value==='true':Number(control.value);
      const original=kind==='bool'?control.dataset.original==='true':Number(control.dataset.original);
      if(value!==original)updates[control.dataset.gameplayPath]=value;
    });
    const mins=[...(state.data?.minimums||[])];const maxs=[...(state.data?.maximums||[])];let minChanged=false,maxChanged=false;
    workspace.querySelectorAll('[data-temp-kind]').forEach((control)=>{const index=Number(control.dataset.tempIndex);const value=Number(control.value);if(control.dataset.tempKind==='min'){mins[index]=value;if(String(value)!==String(Number(control.dataset.original)))minChanged=true;}else{maxs[index]=value;if(String(value)!==String(Number(control.dataset.original)))maxChanged=true;}});
    if(minChanged)updates['WorldsData.environmentMinTemps']=mins;if(maxChanged)updates['WorldsData.environmentMaxTemps']=maxs;
    if(!Object.keys(updates).length)throw new Error('Change at least one gameplay value first.');
    return {area:'gameplay',action:'update',updates};
  };

  const buildWeatherRequest = () => {
    const preset=workspace.querySelector('[data-weather-preset]')?.value||'';if(preset)return{area:'weather',action:'preset',preset};
    const payload={area:'weather',action:'bulk'};let changed=false;
    const root={};workspace.querySelectorAll('[data-weather-root]').forEach((c)=>{const value=c.value==='true';if(String(value)!==c.dataset.original){root[c.dataset.weatherRoot]=value;changed=true;}});if(Object.keys(root).length){root.enabled=root.enabled ?? Boolean(state.data.weather.enable);root.reset=root.reset ?? Boolean(state.data.weather.reset);payload.root=root;}
    const sections={};workspace.querySelectorAll('[data-weather-section]').forEach((c)=>{const value=Number(c.value);if(String(value)!==String(Number(c.dataset.original))){sections[c.dataset.weatherSection]??={};sections[c.dataset.weatherSection][c.dataset.weatherField]=value;changed=true;}});if(Object.keys(sections).length)payload.sections=sections;
    const storm={};workspace.querySelectorAll('[data-weather-storm]').forEach((c)=>{const value=Number(c.value);if(String(value)!==String(Number(c.dataset.original))){storm[c.dataset.weatherStorm]=value;changed=true;}});if(Object.keys(storm).length)payload.storm=storm;
    if(!changed)throw new Error('Change at least one weather value or choose a preset.');return payload;
  };

  const buildMessageRequest = () => {
    const editor=workspace.querySelector('[data-message-editor]');if(!editor)throw new Error('Choose a message action first.');
    const index=state.selectedMessage?.index;
    if(['disable','remove','enable'].includes(state.messageAction)){if(!index)throw new Error('Select an active message first.');return{area:'messages',action:state.messageAction,index};}
    return{area:'messages',action:state.selectedMessage?'edit':'add',index,text:editor.querySelector('[data-message-text]')?.value||'',delay:Number(editor.querySelector('[data-message-delay]')?.value||0),repeat:Number(editor.querySelector('[data-message-repeat]')?.value||0),deadline:Number(editor.querySelector('[data-message-deadline]')?.value||0),onconnect:editor.querySelector('[data-message-onconnect]')?.value==='true',shutdown:editor.querySelector('[data-message-shutdown]')?.value==='true'};
  };

  const buildLootRequest = () => {
    const record=state.selectedLoot;if(!record)throw new Error('Select a loot item first.');
    const toggle=workspace.querySelector('[data-loot-toggle]');if(toggle?.dataset.pendingAction)return{area:'loot',action:toggle.dataset.pendingAction,item_name:record.name};
    const values={};workspace.querySelectorAll('[data-loot-field]').forEach((c)=>{const name=c.dataset.lootField;const isText=['category','usages','tiers','tags'].includes(name);const value=isText?c.value.trim():Number(c.value);const original=isText?c.dataset.original:Number(c.dataset.original);if(value!==original)values[name]=value;});if(!Object.keys(values).length)throw new Error('Change at least one loot value or choose Enable/Disable.');return{area:'loot',action:'edit',item_name:record.name,values};
  };

  const buildEventRequest = () => {
    const createEditor=workspace.querySelector('[data-event-create-editor]');if(createEditor){const eventXml=createEditor.querySelector('[data-event-create-xml]')?.value.trim()||'';const eventZone=createEditor.querySelector('[data-event-create-zone]')?.value.trim()||'';if(!eventXml)throw new Error('Event XML is required.');return{area:'events',action:'create',event_xml:eventXml,event_zone:eventZone};}
    const record=state.selectedEvent;if(!record)throw new Error('Select an event first.');const op=workspace.querySelector('[data-event-operation]')?.value||'edit';const base={area:'events',action:op,event_name:record.name};
    if(op==='edit'){const updates={};workspace.querySelectorAll('[data-event-field]').forEach((c)=>{const name=c.dataset.eventField;updates[name]=name==='active'?c.value==='true':(['position','limit'].includes(name)?c.value:Number(c.value));});return{...base,updates};}
    if(op.startsWith('child_')){base.child_type=workspace.querySelector('[data-event-child-type]')?.value||workspace.querySelector('[data-event-child-replacement]')?.value.trim()||'';base.replacement_type=workspace.querySelector('[data-event-child-replacement]')?.value.trim()||'';workspace.querySelectorAll('[data-event-child-field]').forEach((c)=>{base[c.dataset.eventChildField]=Number(c.value||0);});if(!base.child_type)throw new Error('Enter or select a child classname.');return base;}
    if(op==='position_add'||op==='position_edit'){if(op==='position_edit')base.index=Number(workspace.querySelector('[data-event-position-index]')?.value||0);workspace.querySelectorAll('[data-event-position-field]').forEach((c)=>{const name=c.dataset.eventPositionField;if(c.value==='')return;base[name]=name==='group'?c.value:Number(c.value);});return base;}
    if(op==='position_remove'){base.index=Number(workspace.querySelector('[data-event-position-index]')?.value||0);return base;}
    if(op==='zone_set'){workspace.querySelectorAll('[data-event-zone-field]').forEach((c)=>{base[c.dataset.eventZoneField]=Number(c.value);});return base;}
    if(op==='remove'){base.remove_positions=workspace.querySelector('[data-event-remove-positions]')?.value!=='false';return base;}return base;
  };

  const buildRequest = () => state.area==='gameplay'?buildGameplayRequest():state.area==='weather'?buildWeatherRequest():state.area==='messages'?buildMessageRequest():state.area==='loot'?buildLootRequest():buildEventRequest();

  const submit = async (mode) => {
    if(state.busy)return;let payload;try{payload=buildRequest();}catch(error){show(error.message||'Complete the change first.');return;}
    if(mode==='apply'){
      const reason=reasonInput?.value.trim()||'';if(reason.length<5){show('Enter a change reason of at least five characters before applying.');return;}
      if(!window.confirm('Create safety backup(s) and apply this structured change to the live Nitrado configuration?'))return;payload.reason=reason;
    }
    payload.mode=mode;const token=storageGet(AUTH_SESSION_KEY);if(!token||dashboardAccessLevel!=='owner'){show('Owner sign-in is required.');return;}
    setBusy(true);show(mode==='apply'?'Creating backup(s), applying and checksum-verifying…':'Validating against the live file and generating an exact diff…','info');
    try{
      const response=await protectedActionFetch(STRUCTURED_ACTION_URL,{method:'POST',headers:{Accept:'application/json','Content-Type':'application/json',Authorization:`Bearer ${token}`},body:JSON.stringify(payload)});
      const result=await response.json().catch(()=>({}));if(handleAdminPlayerAuthorizationResponse(response,result,{actionRequest:mode==='apply'}))return;if(!response.ok)throw new Error(result.message||'Structured configuration action failed.');
      if(diffOutput){if(result.files && mode!=='apply'){diffOutput.textContent=Object.values(result.files).map((file)=>`### ${file.remote_path}\n${file.diff||'No changes detected.'}`).join('\n\n');}else diffOutput.textContent='Applied successfully. Refreshing live structured data…';}
      show(result.message||'Structured configuration operation completed.','success');
      if(mode==='apply'){state.messageAction='add';state.selectedMessage=null;state.selectedLoot=null;state.selectedEvent=null;await loadArea(state.area,state.area==='loot'?state.lootQuery:'');await Promise.all([typeof loadServerConfigOverview==='function'?loadServerConfigOverview(token):Promise.resolve(),typeof loadConfigBackups==='function'?loadConfigBackups(token):Promise.resolve(),typeof loadServerEvents==='function'?loadServerEvents(token):Promise.resolve()]);}
    }catch(error){show(error.message||'Structured configuration action failed.');}finally{setBusy(false);}
  };

  tabs.forEach((tab)=>tab.addEventListener('click',()=>{state.lootQuery='';state.selectedLoot=null;state.selectedMessage=null;state.selectedEvent=null;state.messageAction='add';loadArea(tab.dataset.configStudioTab);}));
  refreshButton?.addEventListener('click',()=>loadArea(state.area,state.area==='loot'?state.lootQuery:''));
  previewButton?.addEventListener('click',()=>submit('preview'));
  applyButton?.addEventListener('click',()=>submit('apply'));

  const isStructuredViewActive = () => Boolean(
    document.querySelector('[data-view-panel="serverconfig"].active [data-dashboard-section="structured"]:not([hidden])')
  );
  const activateIfVisible = () => {
    if (dashboardAccessLevel === 'owner' && storageGet(AUTH_SESSION_KEY) && isStructuredViewActive()) loadArea(state.area);
  };

  document.addEventListener('dashboard:owner-ready', activateIfVisible);
  window.addEventListener('wwz:viewchange', (event) => {
    if (event.detail?.view === 'serverconfig' && event.detail?.section === 'structured') activateIfVisible();
  });
  activateIfVisible();
  window.__wwzConfigurationStudioReady = true;
})();
