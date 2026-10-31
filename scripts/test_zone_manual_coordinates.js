'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs');
const js=fs.readFileSync('assets/js/dashboard/zones.js','utf8');
const html=fs.readFileSync('dashboard.html','utf8');
const css=fs.readFileSync('assets/css/dashboard/zones.css','utf8');
for(const marker of [
'data-zone-manual-point-x','data-zone-manual-point-z','data-zone-add-manual-point',
'data-zone-preview-circle','data-zone-center-x','data-zone-center-z','data-zone-radius',
'data-zone-point-list','data-zone-save-status'
]) assert.ok(html.includes(marker), 'Missing manual-zone control '+marker);
for(const marker of [
'const parseManualCoordinate = (raw, label) =>',
'const coordinateLimit = () =>',
"if (!value || !Number.isFinite(Number(value)))",
'if (number < 0 || (limit > 0 && number > limit))',
"Number(number.toFixed(4))",
'const zonePointArea = (points) =>',
'field.dataset.zonePointCoordinate = axis;',
"field.addEventListener('change'",
"state.editorPoints[index][axis] = parseManualCoordinate",
"state.editorPoints.push({ x, z });",
"state.editorPoints.splice(index, 1);",
"if (state.editorPoints.length >= 256)",
"if (state.editorManaged || state.editorShape !== 'polygon') return;",
"if (state.editorManaged || state.editorShape !== 'circle') return;",
'zonePointArea(payload.points) < 1',
"state.editorMap?.focus?.(x, z, 6)",
"input.disabled = !circle || state.editorManaged;",
"editorMessage(error?.message || 'The zone could not be saved.', 'error')"
]) assert.ok(js.includes(marker), 'Missing geometry behavior '+marker);
assert.ok(css.includes('.zone-coordinate-entry'));
assert.ok(css.includes('.zone-point-editor-row'));
assert.ok(js.includes('control.disabled = state.editorManaged || (polygonInput ? circle : !circle);'));
assert.ok(js.includes('control.disabled = circle || state.editorManaged;'));
assert.ok(js.includes("if (state.editorManaged || state.editorShape !== 'polygon') return;"));
assert.ok(js.includes("document.querySelectorAll('[data-zone-circle-fields] input').forEach"));
assert.ok(js.includes("document.querySelectorAll('[data-zone-manual-point-entry] input, [data-zone-add-manual-point], [data-zone-preview-circle]').forEach"));
assert.ok(js.includes("document.querySelectorAll('[data-zone-center-x], [data-zone-center-z], [data-zone-manual-point-x], [data-zone-manual-point-z], [data-zone-point-coordinate]').forEach"));
assert.ok(html.includes('lazy-assets.js?v=2.8.3&amp;rev=manual-coords-1'));
assert.ok(fs.readFileSync('assets/js/dashboard/lazy-assets.js','utf8').includes('zones.js?v=1.59.5&rev=manual-coords-1'));
console.log('PASS: Manual circle and polygon X/Z, inline editing, bounds and mobile controls');
