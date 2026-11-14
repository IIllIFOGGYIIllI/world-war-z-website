/* Static, read-only PvE raid and both-server maintenance dates. Never performs Nitrado actions. */
(() => {
'use strict';
const firstDay=Date.UTC(2026,10,6),day=86400000;
const timeZone='Australia/Sydney';
const dtf=new Intl.DateTimeFormat('en-GB',{timeZone,year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',hourCycle:'h23'});
const sydneyAtHour=(utcCalendarDay,hour)=>{
  // Use the calendar-day timezone offset: DST may change between months.
  const probe=new Date(utcCalendarDay+12*3600000);
  const p=Object.fromEntries(dtf.formatToParts(probe).map(x=>[x.type,x.value]));
  const offset=Date.UTC(+p.year,+p.month-1,+p.day,+p.hour,+p.minute)-probe.getTime();
  return new Date(utcCalendarDay+hour*3600000-offset);
};
const sydneyEvening=(utcCalendarDay)=>sydneyAtHour(utcCalendarDay,19);
const sydneyMorning=(utcCalendarDay)=>sydneyAtHour(utcCalendarDay,5);
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
// Display-only proposed Monday maintenance for both Nasdara PvE and PvP.
// It follows the PvE raid cadence and NEVER uploads a file or calls Nitrado.
const vehicleWipesForServer=(server,now=Date.now(),count=12)=>{
  if(server?.map_key!=='badlands'||!['pve','pvp'].includes(server?.gameplay_mode))return [];
  const firstMonday=firstDay+3*day;
  const currentParts=Object.fromEntries(dtf.formatToParts(new Date(now)).map(x=>[x.type,x.value]));
  const today=Date.UTC(+currentParts.year,+currentParts.month-1,+currentParts.day);
  const index=Math.max(0,Math.floor((today-firstMonday)/(14*day)));
  const rows=[];
  for(let i=index;rows.length<count;i++){
    const monday=firstMonday+i*14*day,start=sydneyMorning(monday);
    const end=new Date(start.getTime()+30*60000);
    if(end.getTime()<=now)continue;
    const mode=String(server.gameplay_mode).toUpperCase();
    rows.push({id:-200000-i,title:'🚗 PLANNED VEHICLE WIPE — POST-RAID',category:'Server Maintenance',
      event_type:'vehicle_wipe',starts_at:start.toISOString(),ends_at:end.toISOString(),
      map_key:'badlands',status:'scheduled',lifecycle_state:'Planned maintenance · Automation not enabled',
      virtual_vehicle_wipe:true,visibility:'public',location_label:`Nasdara ${mode} — server-wide`,
      signup_enabled:false,capacity:0,registered_count:0,waitlist_count:0,
      attendance_money:0,attendance_xp:0,winner_money:0,winner_xp:0,
      description:'Proposed every second Monday after the Nasdara PvE raid weekend, starting at 5:00 AM Australia/Sydney. All vehicles, including rentals, are included. Automatic two-restart maintenance is not yet enabled.',
      rules_text:'Vehicle contents and parked positions may be lost. Active rental orders remain; their normal restart counters still apply. No player or base wipe is planned.',
      setup_text:'Maintenance proposal only: activate the existing 28-vehicle cfgignorelist block, restart, restore the original file, then restart again. Pending live-file verification and recovery tests.'});
  }
  return rows;
};
const mergeEvents=(events,server,now=Date.now())=>{
  const existing=Array.isArray(events)?events:[];
  const planned=[...forServer(server,now),...vehicleWipesForServer(server,now)];
  if(!planned.length)return existing;
  const uniqueDay=e=>String(e.event_type||'')+':'+String(e.starts_at||'').slice(0,10);
  const existingDays=new Set(existing
    .filter(e=>['raid_weekend','vehicle_wipe'].includes(e.event_type)).map(uniqueDay));
  return [...existing,...planned.filter(e=>!existingDays.has(uniqueDay(e)))]
    .sort((a,b)=>new Date(a.starts_at)-new Date(b.starts_at));
};
window.WWZRaidWeekends=Object.freeze({forServer,vehicleWipesForServer,mergeEvents});
})();