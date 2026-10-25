/* Static, read-only schedule. Not a Nitrado or PvP automation. */
(() => {
'use strict';
const firstDay=Date.UTC(2026,10,6),day=86400000;
const timeZone='Australia/Sydney';
const dtf=new Intl.DateTimeFormat('en-GB',{timeZone,year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',hourCycle:'h23'});
const sydneyEvening=(utcCalendarDay)=>{
  const probe=new Date(utcCalendarDay+12*3600000);
  const p=Object.fromEntries(dtf.formatToParts(probe).map(x=>[x.type,x.value]));
  const offset=Date.UTC(+p.year,+p.month-1,+p.day,+p.hour,+p.minute)-probe.getTime();
  return new Date(utcCalendarDay+19*3600000-offset);
};
const forServer=(server,now=Date.now(),count=12)=>{
  if(server?.map_key!=='badlands'||server?.gameplay_mode!=='pve')return [];
  const first=sydneyEvening(firstDay).getTime();
  const index=Math.max(0,Math.floor((now-first)/(14*day)));
  const rows=[];
  for(let i=index;rows.length<count;i++){
    const fri=firstDay+i*14*day,start=sydneyEvening(fri),end=sydneyEvening(fri+2*day);
    if(end.getTime()<now)continue;
    rows.push({id:-100000-i,title:'💥 FORTNIGHTLY RAID WEEKEND',category:'Raid Weekend',event_type:'raid_weekend',
      starts_at:start.toISOString(),ends_at:end.toISOString(),map_key:'badlands',status:'scheduled',
      lifecycle_state:'Published schedule',virtual_raid_weekend:true,visibility:'public',
      location_label:'Nasdara PvE — full map',signup_enabled:false,capacity:0,registered_count:0,waitlist_count:0,
      attendance_money:0,attendance_xp:0,winner_money:0,winner_xp:0,
      description:'Every second Friday 7 PM to Sunday 7 PM (Australia/Sydney). Full-map PvP and base raiding on Nasdara PvE only.',
      rules_text:'Normal PvE rules resume at the end. An Admin must separately enable and disable PvP, base damage and container damage. The calendar itself does not change game settings. Check Discord for live activation and event rules.',
      setup_text:'The event schedule is automatic; activation of DayZ server settings remains an Admin operation.'});
  }
  return rows;
};
const mergeEvents=(events,server,now=Date.now())=>{
  const existing=Array.isArray(events)?events:[];
  const planned=forServer(server,now);
  if(!planned.length)return existing;
  const existingDays=new Set(existing.filter(e=>e.event_type==='raid_weekend').map(e=>String(e.starts_at||'').slice(0,10)));
  return [...existing,...planned.filter(e=>!existingDays.has(e.starts_at.slice(0,10)))]
    .sort((a,b)=>new Date(a.starts_at)-new Date(b.starts_at));
};
window.WWZRaidWeekends=Object.freeze({forServer,mergeEvents});
})();