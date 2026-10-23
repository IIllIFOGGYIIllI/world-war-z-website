/* WWZ rental basket: independent vehicle terms and per-order coordinates. */
(() => {
  'use strict';
  const MAX_RENTALS = 25;
  const create = ({ root, onCheckout }) => {
    if (!root) throw new Error('Rental cart mount is missing.');
    const list = root.querySelector('[data-rental-cart-list]');
    const empty = root.querySelector('[data-rental-cart-empty]');
    const summary = root.querySelector('[data-rental-cart-summary]');
    const countLabel = root.querySelector('[data-rental-cart-count]');
    const totalLabel = root.querySelector('[data-rental-cart-subtotal]');
    const checkoutButton = root.querySelector('[data-rental-cart-checkout]');
    const clearButton = root.querySelector('[data-rental-cart-clear]');
    let server = null, items = [], locations = [], rows = [];

    const storageKey = () => server ? `wwz_shop_rentals_v1:${server.key}:${server.map_key}` : '';
    const worldSize = () => ({ badlands: 16384, chernarus: 15360, livonia: 12800 })[server?.map_key] || 0;
    const money = n => '$' + new Intl.NumberFormat('en-AU').format(Math.max(0, Number(n) || 0));
    const catalog = id => items.find(item => Number(item.item_id) === Number(id) && item.delivery_type === 'event');
    const bounds = item => {
      const minimum = Math.max(1, Number(item.delivery?.minimum_restarts || 1));
      const maximum = Math.min(30000, Number(item.delivery?.maximum_restarts || 30000));
      return [minimum, maximum];
    };
    const element = (tag, cls = '', value = '') => {
      const node = document.createElement(tag);
      if (cls) node.className = cls;
      if (value !== '') node.textContent = value;
      return node;
    };
    const field = (name, value, changed, min = null, max = null) => {
      const label = element('label', 'wwz-route-field');
      label.append(element('span', '', name));
      const input = element('input');
      input.type = 'number'; input.step = name === 'Restarts' ? '1' : 'any';
      if (min !== null) input.min = String(min);
      if (max !== null) input.max = String(max);
      input.value = String(value ?? '');
      input.setAttribute('aria-label', name);
      input.addEventListener('input', () => changed(input.value));
      label.append(input);
      return label;
    };
    const save = () => {
      if (!storageKey()) return;
      try { localStorage.setItem(storageKey(), JSON.stringify(rows)); } catch (_) {}
    };
    const subtotal = () => rows.reduce((sum, row) => {
      const item = catalog(row.item_id);
      return sum + (item ? Number(item.price || 0) * Math.max(0, Number(row.event_restarts) || 0) : 0);
    }, 0);
    const refreshTotals = () => {
      if (countLabel) countLabel.textContent = String(rows.length);
      if (totalLabel) totalLabel.textContent = money(subtotal());
      const active = rows.length > 0;
      if (empty) empty.hidden = active;
      if (list) list.hidden = !active;
      if (summary) summary.hidden = !active;
      if (clearButton) clearButton.disabled = !active;
      if (checkoutButton) checkoutButton.disabled = !active || server?.paused === true;
    };
    const load = () => {
      try {
        const value = JSON.parse(localStorage.getItem(storageKey()) || '[]');
        rows = Array.isArray(value) ? value.slice(0, MAX_RENTALS).filter(row =>
          Number.isSafeInteger(Number(row?.item_id)) && Number(row.item_id) > 0
        ).map(row => ({
          uid: String(row.uid || ''), item_id: Number(row.item_id),
          event_restarts: row.event_restarts,
          mode: row.mode === 'saved' ? 'saved' : 'custom',
          location_id: String(row.location_id || ''),
          x: String(row.x ?? ''), y: String(row.y ?? '0'),
          z: String(row.z ?? ''), rotation: String(row.rotation ?? '0')
        })) : [];
      } catch (_) { rows = []; }
      render();
    };
    const render = () => {
      if (!list) return;
      list.replaceChildren();
      rows.forEach((row, index) => {
        const item = catalog(row.item_id);
        const card = element('article', 'wwz-rental-cart-line');
        const top = element('div', 'wwz-rental-cart-head');
        const name = element('strong', '', item?.name || 'Rental no longer in catalogue');
        const subtitle = element('small', '', `Vehicle #${index + 1} · ${item ? money(item.price) + '/restart' : 'Unavailable'}`);
        const remove = element('button', 'secondary-action compact-action', 'Remove');
        remove.type = 'button';
        remove.addEventListener('click', () => { rows.splice(index, 1); save(); render(); });
        const heading = element('div'); heading.append(name, subtitle);
        top.append(heading, remove); card.append(top);
        if (!item) {
          card.append(element('p', 'wwz-rental-unavailable', 'This rental is unavailable. Remove it to continue.'));
          list.append(card); return;
        }
        const [min, max] = bounds(item);
        const controls = element('div', 'wwz-rental-cart-controls');
        controls.append(field('Restarts', row.event_restarts, value => {
          row.event_restarts = value; save(); refreshTotals();
        }, min, max));
        const destination = element('label', 'wwz-route-field');
        destination.append(element('span', '', 'Delivery destination'));
        const choice = element('select');
        [['custom', 'Own coordinates'], ['saved', 'Saved location']].forEach(([value, label]) => {
          const option = element('option', '', label); option.value = value; choice.append(option);
        });
        choice.value = row.mode;
        choice.setAttribute('aria-label', `${item.name} rental #${index + 1} destination`);
        choice.addEventListener('change', () => { row.mode = choice.value; save(); render(); });
        destination.append(choice); controls.append(destination);
        card.append(controls);

        if (row.mode === 'saved') {
          const label = element('label', 'wwz-route-field');
          label.append(element('span', '', 'Saved delivery location'));
          const select = element('select');
          const placeholder = element('option', '', 'Choose saved location'); placeholder.value = ''; select.append(placeholder);
          locations.forEach(location => {
            const option = element('option', '',
              `${location.name || 'Saved location'} · X ${location.x}, Z ${location.z}`);
            option.value = String(location.location_id); select.append(option);
          });
          select.value = row.location_id;
          select.addEventListener('change', () => { row.location_id = select.value; save(); });
          label.append(select); card.append(label);
          if (!locations.length) card.append(element('small', '', 'Save a location in the dashboard, or choose own coordinates.'));
        } else {
          const coords = element('div', 'wwz-route-coordinate-grid wwz-rental-coordinates');
          for (const [name, prop, minimum, maximum] of [
            ['X', 'x', 0, worldSize()], ['Y', 'y', -100, 2000],
            ['Z', 'z', 0, worldSize()], ['Rotation', 'rotation', 0, 360]
          ]) {
            const label = field(name, row[prop], value => { row[prop] = value; save(); }, minimum, maximum);
            label.querySelector('input').setAttribute('aria-label', `${item.name} vehicle #${index + 1} ${name}`);
            coords.append(label);
          }
          card.append(coords);
        }
        const price = element('strong', 'wwz-rental-line-total', money(Number(item.price || 0) * Math.max(0, Number(row.event_restarts) || 0)));
        card.append(price); list.append(card);
      });
      refreshTotals();
    };
    const add = item => {
      if (!item || item.delivery_type !== 'event' || rows.length >= MAX_RENTALS) return false;
      const [min] = bounds(item);
      const defaultLocation = locations.find(location => location.is_default);
      rows.push({
        uid: String(Date.now()) + '-' + String(Math.random()).slice(2),
        item_id: Number(item.item_id), event_restarts: min,
        mode: defaultLocation ? 'saved' : 'custom',
        location_id: defaultLocation ? String(defaultLocation.location_id) : '',
        x: '', y: '0', z: '', rotation: '0'
      });
      save(); render(); root.scrollIntoView({ behavior: 'smooth', block: 'start' });
      return true;
    };
    const lines = () => {
      if (!rows.length) throw new Error('Add at least one vehicle rental.');
      const size = worldSize();
      return rows.map((row, index) => {
        const item = catalog(row.item_id);
        if (!item || !item.available) throw new Error(`Rental #${index + 1} is no longer available.`);
        const restarts = Number(row.event_restarts);
        const [min, max] = bounds(item);
        if (!Number.isSafeInteger(restarts) || restarts < min || restarts > max)
          throw new Error(`Choose ${min.toLocaleString()}–${max.toLocaleString()} restarts for ${item.name} (#${index + 1}).`);
        let delivery;
        if (row.mode === 'saved') {
          const locationId = Number(row.location_id);
          if (!Number.isSafeInteger(locationId) || !locations.some(loc => Number(loc.location_id) === locationId))
            throw new Error(`Choose a saved location for rental #${index + 1}.`);
          delivery = { location_id: locationId };
        } else {
          const raw = ['x', 'y', 'z', 'rotation'].map(prop => String(row[prop] ?? '').trim());
          const [x, y, z, rotation] = raw.map(Number);
          if (raw.some(v => v === '') || ![x, y, z, rotation].every(Number.isFinite)
            || x < 0 || x > size || z < 0 || z > size || y < -100 || y > 2000 || rotation < 0 || rotation > 360)
            throw new Error(`Enter valid X, Y, Z and rotation for rental #${index + 1}.`);
          delivery = { x, y, z, rotation };
        }
        return { item_id: Number(item.item_id), quantity: 1, event_restarts: restarts, delivery };
      });
    };
    checkoutButton?.addEventListener('click', () => onCheckout?.());
    clearButton?.addEventListener('click', () => { rows = []; save(); render(); });
    render();
    return {
      add, lines, count: () => rows.length, subtotal,
      clear: () => { rows = []; save(); render(); },
      setServer: value => { server = value; items = []; locations = []; load(); },
      setCatalogue: value => { items = Array.isArray(value) ? value : []; render(); },
      setLocations: value => { locations = Array.isArray(value) ? value : []; render(); },
      refresh: render
    };
  };
  window.WWZRentalCart = Object.freeze({ create });
})();
