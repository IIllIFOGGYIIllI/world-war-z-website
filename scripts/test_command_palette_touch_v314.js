'use strict';
// V3.14: mobile command search remains tappable and reuses sidebar icons.
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const read=(path)=>fs.readFileSync(path,'utf8');
const shell=read('assets/js/dashboard/shell.js');
const css=read('assets/css/dashboard/command-palette-v314.css');
const html=read('dashboard.html');
const sw=read('sw.js');

const start=shell.indexOf('const setCommandPaletteSelection = ');
const end=shell.indexOf('\n};',start);
assert.ok(start>=0&&end>start,'Selection helper must exist');
const source=shell.slice(start,end+3);
// Execute the real selection helper with fake result rows to guarantee it never
// discards the original tap target when touch generates a synthetic hover.
let builds=0,scrolls=0;
const rows=[0,1].map(()=>({
  selected:false,
  classList:{toggle(_name,selected){this.owner.selected=selected;}},
  scrollIntoView(){scrolls++;}
}));
rows.forEach(r=>{r.classList.owner=r;});
const results={querySelectorAll(){return rows;},replaceChildren(){builds++;}};
const code='(()=>{let commandPaletteIndex=0;const commandPaletteMatches=[{},{}];const commandPaletteResults=results;'
  +source+';return {select:setCommandPaletteSelection,index:()=>commandPaletteIndex};})()';
const helper=vm.runInNewContext(code,{results});
helper.select(1);
assert.equal(helper.index(),1);
assert.equal(rows[0].selected,false);
assert.equal(rows[1].selected,true);
assert.equal(builds,0,'Hover selection cannot replace clicked result nodes');
helper.select(0,true);
assert.equal(scrolls,1,'Keyboard selection scrolls into view');
assert.equal(builds,0);

const hover=shell.match(/result\.addEventListener\('mouseenter',[^\n]+/);
assert.ok(hover&&hover[0].includes('setCommandPaletteSelection(index)'));
assert.ok(!hover[0].includes('renderCommandPalette'));
assert.ok(shell.includes("result.addEventListener('click', () => {"));
assert.ok(shell.includes('showView(button.dataset.view, true, button.dataset.section || \'\')'));
assert.ok(shell.includes("if (!isDashboardDestinationVisible(button))"));
assert.ok(shell.includes("sourceIcon?.querySelector('svg')"));
assert.ok(shell.includes('svg.cloneNode(true)'),'SVG must be cloned from sidebar, not moved');
assert.ok(shell.includes("result.setAttribute('aria-label'"));
assert.ok(shell.includes('setCommandPaletteSelection(commandPaletteIndex, true)'));

const bank=html.match(/data-nav-label="WWZ Bank"[^\n]*<\/button>/);
const treasury=html.match(/data-nav-label="Community Treasury"[^\n]*<\/button>/);
assert.ok(bank?.[0].includes('<svg'),'Bank uses a proper, reusable sidebar SVG');
assert.ok(treasury?.[0].includes('<svg'),'Treasury uses a proper, reusable sidebar SVG');
for(const tag of ['command-keyboard-help','command-touch-help'])
  assert.ok(html.includes(tag),'Missing touch/keyboard help: '+tag);
assert.ok(html.includes('Tap any result to open that tool'));
assert.ok(html.includes('assets/js/dashboard/shell.js?v=1.25.2&amp;rev=palette-touch-1'));
assert.ok(html.includes('assets/css/dashboard/command-palette-v314.css?v=3.14.0&amp;rev=touch-search-1'));

for(const token of [
 'body.wwz-v3-dashboard dialog.command-palette',
 '.command-result-icon svg','.command-result-copy',
 'touch-action: manipulation','min-height: 68px',
 'hover: none','pointer: coarse','max-height: min(84dvh',
 'prefers-reduced-motion','forced-colors'
])assert.ok(css.includes(token),'Missing V3.14 mobile treatment: '+token);
assert.ok(sw.includes('2026-11-13-mobile-palette-tap-v314-1'));
assert.ok(sw.includes('./assets/css/dashboard/command-palette-v314.css?v=3.14.0&rev=touch-search-1'));
assert.ok(sw.includes('./assets/js/dashboard/shell.js?v=1.25.2&rev=palette-touch-1'));
assert.ok(html.includes('data-server-action="restart"'),'Server controls preserved');
assert.ok(html.includes('data-v312-directory'),'Workspace directory preserved');
new vm.Script(shell);
console.log('PASS: stable touch-target selection, direct dashboard navigation, SVG icons and mobile search layout');
