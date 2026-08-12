// Pure Survivor Shop formatting and XML parsing helpers.
// Loaded before shop.js so Dashboard and Delivery can share the same behaviour.

const shopStatusLabel = (status) => titleCaseState(status || 'unknown');
const shopStockText = (item) => item.stock_quantity == null ? 'Unlimited stock' : `${Number(item.stock_quantity)} in stock`;
const shopMemberLimitText = (item) => {
  if (item.max_per_player == null) return 'No lifetime limit';
  if (item.remaining_member_limit == null) return `Limit ${Number(item.max_per_player)} per player`;
  return `${Math.max(0, Number(item.remaining_member_limit))} remaining for you`;
};

const dashboardShopDuration = (seconds) => {
  const totalMinutes = Math.max(0, Math.trunc((Number(seconds) || 0) / 60));
  const hours = Math.trunc(totalMinutes / 60); const minutes = totalMinutes % 60;
  return hours ? `${hours}h ${minutes}m` : `${minutes}m`;
};
const dashboardOrderDeliveryState = (order) => String(order?.delivery?.status || '').toLowerCase();
const dashboardOrderDisplayStatus = (order) => {
  const orderState = String(order?.status || '').toLowerCase();
  if (['cancelled', 'refunded'].includes(orderState)) return shopStatusLabel(orderState);
  const deliveryState = dashboardOrderDeliveryState(order);
  const labels = { queued:'Preparing Delivery', awaiting_approval:'Preparing Delivery', ready:'Preparing Delivery', previewed:'Prepared', restart_pending:'Waiting for Restart', verification:'Spawn Verification', active:'Rental Active', cleanup_due: order?.delivery_type === 'event' ? 'Rental Ending' : 'Delivered · Finalising', failed:'Delivery Retry', fulfilled:'Fulfilled' };
  return labels[deliveryState] || shopStatusLabel(orderState);
};
const dashboardOrderClass = (order) => {
  const orderState = String(order?.status || '').toLowerCase();
  return ['cancelled','refunded','fulfilled'].includes(orderState) ? orderState : (dashboardOrderDeliveryState(order) || orderState || 'pending');
};
const dashboardOrderCoordinates = (order) => {
  const point = order?.delivery?.location || {};
  if (point.x == null || point.y == null || point.z == null) return '';
  return `X ${Number(point.x).toFixed(1)}, Y ${Number(point.y).toFixed(1)}, Z ${Number(point.z).toFixed(1)}, A ${Number(point.rotation || 0).toFixed(1)}°`;
};
const dashboardOrderProgress = (order) => {
  const deliveryState = dashboardOrderDeliveryState(order); const isEvent = order?.delivery_type === 'event';
  if (['cancelled','refunded'].includes(String(order?.status || '').toLowerCase())) return null;
  if (isEvent) {
    const stages=['Paid','Prepared','Restart spawn','Rental active','Complete']; const map={awaiting_approval:1,ready:1,previewed:1,restart_pending:2,verification:2,active:3,cleanup_due:4,fulfilled:5};
    return { stages, current:String(order?.status || '').toLowerCase()==='fulfilled'?5:(map[deliveryState]??1) };
  }
  const stages=['Paid','Prepared','Restart','Complete']; const map={queued:1,restart_pending:2,cleanup_due:3,fulfilled:4};
  return { stages, current:String(order?.status || '').toLowerCase()==='fulfilled'?4:(map[deliveryState]??1) };
};

const profileListText = (items) => (Array.isArray(items) ? items : []).map((entry) => {
  if (typeof entry === 'string') return entry;
  const chance = entry?.chance == null ? 1 : Number(entry.chance);
  return chance === 1 ? String(entry.name || entry.type || '') : `${entry.name || entry.type || ''},${chance}`;
}).filter(Boolean).join('\n');

const parseProfileList = (value) => String(value || '').split(/\r?\n/).map((line) => line.trim()).filter(Boolean).map((line) => {
  const [type, rawChance] = line.split(',', 2).map((part) => part.trim());
  return { name: type, chance: rawChance === undefined || rawChance === '' ? 1 : Number(rawChance) };
});

const xmlDirectChild = (root, tag) => [...root.children].filter((child) => child.tagName.toLowerCase() === tag.toLowerCase());

const parseXmlEditorSnippet = (value, label, rootTag) => {
  const text = String(value || '').trim();
  if (!text) throw new Error(`${label} is required.`);
  if (/<\?xml|<!doctype|<!entity/i.test(text)) throw new Error(`${label} cannot contain an XML declaration, DTD or entity.`);
  const documentValue = new DOMParser().parseFromString(text, 'application/xml');
  if (documentValue.querySelector('parsererror')) throw new Error(`${label} is not valid XML.`);
  const root = documentValue.documentElement;
  if (!root || root.tagName.toLowerCase() !== rootTag) throw new Error(`${label} must contain one <${rootTag}> element.`);
  return root;
};

const requiredXmlChild = (root, tag) => {
  const matches = xmlDirectChild(root, tag);
  if (matches.length !== 1) throw new Error(`Event XML must contain exactly one <${tag}> element.`);
  return matches[0];
};

const eventXmlInteger = (root, tag, { minimum = 0 } = {}) => {
  const raw = String(requiredXmlChild(root, tag).textContent || '').trim();
  if (!/^\d+$/.test(raw) || Number(raw) < minimum || Number(raw) > 2147483647) {
    throw new Error(`Event XML <${tag}> must be a whole number${minimum ? ` of at least ${minimum}` : ''}.`);
  }
  return Number(raw);
};

const parseEventXmlEditor = (value) => {
  const root = parseXmlEditorSnippet(value, 'Event XML', 'event');
  if (!/^[A-Za-z0-9_.-]+$/.test(String(root.getAttribute('name') || ''))) throw new Error('Event XML requires a valid name attribute.');
  const minimum = eventXmlInteger(root, 'min');
  const maximum = eventXmlInteger(root, 'max');
  if (minimum > maximum) throw new Error('Event XML <min> cannot exceed <max>.');
  eventXmlInteger(root, 'nominal');
  const lifetime = eventXmlInteger(root, 'lifetime', { minimum: 1 });
  const restock = eventXmlInteger(root, 'restock');
  const saferadius = eventXmlInteger(root, 'saferadius');
  const distanceradius = eventXmlInteger(root, 'distanceradius');
  const cleanupradius = eventXmlInteger(root, 'cleanupradius');
  const position = String(requiredXmlChild(root, 'position').textContent || '').trim().toLowerCase();
  if (position !== 'fixed') throw new Error('Restart-bound Event XML must use <position>fixed</position>.');
  const limit = String(requiredXmlChild(root, 'limit').textContent || '').trim().toLowerCase();
  if (!['custom', 'child', 'parent', 'mixed'].includes(limit)) throw new Error('Event XML <limit> must be custom, child, parent or mixed.');
  const active = String(requiredXmlChild(root, 'active').textContent || '').trim();
  if (!['0', '1'].includes(active)) throw new Error('Event XML <active> must be 0 or 1.');
  const flags = requiredXmlChild(root, 'flags');
  const flag = (name) => {
    const raw = String(flags.getAttribute(name) || '');
    if (!['0', '1'].includes(raw)) throw new Error(`Event XML ${name} flag must be 0 or 1.`);
    return raw === '1';
  };
  const children = requiredXmlChild(root, 'children');
  const childNodes = [...children.children].filter((child) => child.tagName.toLowerCase() === 'child');
  if (childNodes.length !== 1) throw new Error('Event XML must contain exactly one <child> element.');
  const child = childNodes[0];
  const childType = String(child.getAttribute('type') || '').trim();
  if (!/^[A-Za-z0-9_.-]+$/.test(childType)) throw new Error('Event XML child requires a valid DayZ classname.');
  ['min', 'max', 'lootmin', 'lootmax'].forEach((attribute) => {
    if (!/^\d+$/.test(String(child.getAttribute(attribute) || ''))) throw new Error(`Event XML child ${attribute} must be a whole number.`);
  });
  if (Number(child.getAttribute('min')) > Number(child.getAttribute('max'))) throw new Error('Event XML child min cannot exceed child max.');
  const secondaryNodes = xmlDirectChild(root, 'secondary');
  if (secondaryNodes.length > 1) throw new Error('Event XML may contain only one <secondary> element.');
  const secondary = secondaryNodes.length ? String(secondaryNodes[0].textContent || '').trim() : '';
  if (secondary && !/^[A-Za-z0-9_.-]+$/.test(secondary)) throw new Error('Event XML secondary event is not a valid classname.');
  return {
    root, childType, secondary, lifetime, restock, saferadius, distanceradius, cleanupradius, limit,
    deletable: flag('deletable'), initRandom: flag('init_random'), removeDamaged: flag('remove_damaged')
  };
};

const parseEventZoneEditor = (value) => {
  const text = String(value || '').trim();
  if (!text) return null;
  const root = parseXmlEditorSnippet(text, 'Event Zone', 'zone');
  if (root.children.length || String(root.textContent || '').trim()) throw new Error('Event Zone cannot contain text or child elements.');
  const required = ['smin', 'smax', 'dmin', 'dmax', 'r'];
  const unknown = [...root.attributes].map((attribute) => attribute.name).filter((name) => !required.includes(name));
  if (unknown.length) throw new Error(`Event Zone has unsupported attributes: ${unknown.join(', ')}.`);
  const values = {};
  required.forEach((name) => {
    const raw = String(root.getAttribute(name) || '').trim();
    if (!/^\d+$/.test(raw) || Number(raw) > 2147483647) throw new Error(`Event Zone ${name} must be a non-negative whole number.`);
    values[name] = Number(raw);
  });
  if (values.smin > values.smax) throw new Error('Event Zone smin cannot exceed smax.');
  if (values.dmin > values.dmax) throw new Error('Event Zone dmin cannot exceed dmax.');
  return { root, values };
};

const minifyXmlEditor = (value, label, rootTag) => new XMLSerializer().serializeToString(parseXmlEditorSnippet(value, label, rootTag));

const formatXmlEditor = (value, label, rootTag) => {
  const compact = minifyXmlEditor(value, label, rootTag).replace(/>\s+</g, '><').replace(/></g, '>\n<');
  let depth = 0;
  return compact.split('\n').map((line) => {
    const trimmed = line.trim();
    if (/^<\//.test(trimmed)) depth = Math.max(0, depth - 1);
    const result = `${'    '.repeat(depth)}${trimmed}`;
    if (/^<[^!?/][^>]*>$/.test(trimmed) && !/\/>$/.test(trimmed) && !/<\/[^>]+>$/.test(trimmed)) depth += 1;
    return result;
  }).join('\n');
};

const legacyEventXmlFromProfile = (profile = {}) => {
  const flags = profile.flags || {};
  const child = String(profile.child_type || 'VehiclePLACEHOLDER');
  const secondary = String(profile.secondary_event || '').trim();
  return `<event name="Vehicle">
    <nominal>1</nominal>
    <min>1</min>
    <max>1</max>
    <lifetime>${Number(profile.lifetime ?? 3888000)}</lifetime>
    <restock>${Number(profile.restock ?? 0)}</restock>
    <saferadius>${Number(profile.saferadius ?? 0)}</saferadius>
    <distanceradius>${Number(profile.distanceradius ?? 0)}</distanceradius>
    <cleanupradius>${Number(profile.cleanupradius ?? 0)}</cleanupradius>${secondary ? `
    <secondary>${secondary}</secondary>` : ''}
    <flags deletable="${flags.deletable ? 1 : 0}" init_random="${flags.init_random ? 1 : 0}" remove_damaged="${flags.remove_damaged ? 1 : 0}" />
    <position>fixed</position>
    <limit>${String(profile.event_limit || 'custom')}</limit>
    <active>1</active>
    <children>
        <child lootmax="0" lootmin="0" max="1" min="1" type="${child}" />
    </children>
</event>`;
};

const parseShopItemTypes = (text) => String(text || '').split(/\r?\n/).map((value) => value.trim()).filter(Boolean);

const generatedShopSku = (name, isEvent) => {
  const base = String(name || '').trim().toUpperCase().replace(/[^A-Z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 32) || 'ITEM';
  return `${isEvent ? 'EVENT' : 'ITEM'}-${base}`.slice(0, 40);
};
