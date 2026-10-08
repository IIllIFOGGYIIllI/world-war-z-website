/* WWZ Storefront 2.0 — checkout-only delivery allocations. No data is sent until checkout. */
(() => {
  'use strict';
  const MAX_LINES = 50;
  const create = ({ host, entries, locations = [], worldSize = 15360 }) => {
    if (!host) throw new Error('Delivery allocation panel is unavailable.');
    const routes = entries.map(({ line, item }) => ({
      itemId: Number(item.item_id), name: String(item.name || 'Shop item'),
      segments: [{ quantity: Number(line.quantity), mode: 'shared', locationId: '', x: '', y: '0', z: '', rotation: '0' }]
    }));
    let availableLocations = locations;
    const totalLines = () => routes.reduce((n, route) => n + route.segments.length, 0);
    const element = (tag, className = '', value = '') => {
      const node = document.createElement(tag);
      if (className) node.className = className;
      if (value !== '') node.textContent = value;
      return node;
    };
    const field = (name, value, onChange, min, max) => {
      const label = element('label', 'wwz-route-field');
      label.append(element('span', '', name));
      const input = element('input'); input.type = 'number'; input.step = 'any';
      if (min != null) input.min = String(min);
      if (max != null) input.max = String(max);
      input.value = value;
      input.setAttribute('aria-label', name);
      input.addEventListener('input', () => onChange(input.value));
      label.append(input); return label;
    };
    const render = () => {
      host.replaceChildren();
      const heading = element('div', 'wwz-route-heading');
      heading.append(element('strong', '', 'Delivery destinations'), element('small', '', 'Each product can use the main location, a saved location or its own coordinates.'));
      host.append(heading);
      const apply = element('button', 'secondary-action compact-action', 'Use main location for all');
      apply.type = 'button'; apply.addEventListener('click', () => {
        routes.forEach(route => route.segments.forEach(segment => { segment.mode = 'shared'; })); render();
      }); host.append(apply);
      routes.forEach((route) => {
        const section = element('section', 'wwz-route-product');
        const name = element('strong', 'wwz-route-product-name', route.name);
        const sum = route.segments.reduce((n, seg) => n + seg.quantity, 0);
        section.append(name, element('small', '', `${sum} unit${sum === 1 ? '' : 's'} across ${route.segments.length} destination${route.segments.length === 1 ? '' : 's'}`));
        route.segments.forEach((segment, index) => {
          const card = element('div', 'wwz-route-line');
          const lineTitle = element('strong', '', `Delivery ${index + 1} · ${segment.quantity} unit${segment.quantity === 1 ? '' : 's'}`);
          card.append(lineTitle);
          const label = element('label', 'wwz-route-field'); label.append(element('span', '', 'Destination'));
          const choice = element('select'); choice.setAttribute('aria-label', `${route.name} delivery ${index + 1} destination`);
          [['shared', 'Main location above'], ['saved', 'Saved delivery location'], ['custom', 'Different coordinates']].forEach(([value, display]) => {
            const option = element('option', '', display); option.value = value; choice.append(option);
          });
          choice.value = segment.mode;
          choice.addEventListener('change', () => { segment.mode = choice.value; render(); });
          label.append(choice); card.append(label);
          if (segment.mode === 'saved') {
            const savedLabel = element('label', 'wwz-route-field'); savedLabel.append(element('span', '', 'Saved location'));
            const saved = element('select'); saved.setAttribute('aria-label', `${route.name} saved delivery location`);
            const placeholder = element('option', '', 'Select a saved location'); placeholder.value = ''; saved.append(placeholder);
            availableLocations.forEach(location => {
              const option = element('option', '', `${String(location.name || `Location ${location.location_id}`)} · X ${location.x}, Z ${location.z}`);
              option.value = String(location.location_id); saved.append(option);
            });
            saved.value = segment.locationId;
            saved.addEventListener('change', () => { segment.locationId = saved.value; });
            savedLabel.append(saved); card.append(savedLabel);
          }
          if (segment.mode === 'custom') {
            const fields = element('div', 'wwz-route-coordinate-grid');
            fields.append(
              field('X', segment.x, value => { segment.x = value; }, 0, worldSize),
              field('Y', segment.y, value => { segment.y = value; }, -100, 2000),
              field('Z', segment.z, value => { segment.z = value; }, 0, worldSize),
              field('Rotation', segment.rotation, value => { segment.rotation = value; }, 0, 360)
            ); card.append(fields);
          }
          const actions = element('div', 'wwz-route-actions');
          if (segment.quantity > 1 && totalLines() < MAX_LINES) {
            const move = field('Units to split', String(Math.max(1, Math.floor(segment.quantity / 2))), () => {}, 1, segment.quantity - 1);
            const moveInput = move.querySelector('input');
            const split = element('button', 'secondary-action compact-action', 'Split to another location'); split.type = 'button';
            split.addEventListener('click', () => {
              const count = Number(moveInput.value);
              if (!Number.isInteger(count) || count < 1 || count >= segment.quantity) { moveInput.reportValidity(); return; }
              segment.quantity -= count;
              route.segments.splice(index + 1, 0, { quantity: count, mode: 'shared', locationId: '', x: '', y: '0', z: '', rotation: '0' });
              render();
            }); actions.append(move, split);
          }
          if (route.segments.length > 1) {
            const remove = element('button', 'secondary-action compact-action', 'Merge with first delivery'); remove.type = 'button';
            remove.addEventListener('click', () => {
              const keeper = route.segments[index === 0 ? 1 : 0];
              keeper.quantity += segment.quantity; route.segments.splice(index, 1); render();
            }); actions.append(remove);
          }
          card.append(actions); section.append(card);
        }); host.append(section);
      });
    };
    const lines = (sharedDelivery) => {
      const payload = [];
      for (const route of routes) {
        for (const segment of route.segments) {
          let destination;
          if (segment.mode === 'shared') {
            destination = sharedDelivery;
          } else if (segment.mode === 'saved') {
            const id = Number(segment.locationId);
            if (!Number.isSafeInteger(id) || id <= 0 || !availableLocations.some(x => Number(x.location_id) === id)) {
              throw new Error(`Choose a saved location for ${route.name}.`);
            }
            destination = { location_id: id };
          } else {
            const x = Number(segment.x), y = Number(segment.y), z = Number(segment.z), rotation = Number(segment.rotation);
            if ([segment.x, segment.y, segment.z, segment.rotation].some(v => String(v).trim() === '') ||
                ![x, y, z, rotation].every(Number.isFinite) || x < 0 || x > worldSize || z < 0 || z > worldSize || y < -100 || y > 2000 || rotation < 0 || rotation > 360) {
              throw new Error(`Enter valid X, Y, Z and rotation for ${route.name}.`);
            }
            destination = { x, y, z, rotation };
          }
          if (!destination) throw new Error(`Choose delivery coordinates for ${route.name}.`);
          payload.push({ item_id: route.itemId, quantity: segment.quantity, delivery: destination });
        }
      }
      return payload;
    };
    render();
    return { lines, refreshLocations(value) { availableLocations = value || []; render(); } };
  };
  window.WWZCartDeliveries = Object.freeze({ create });
})();
