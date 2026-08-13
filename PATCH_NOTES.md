# World War Z Website v1.22.77

## Owner Shop rendering optimisation

- Stops Owner Shop bulk-action field edits from rebuilding both catalogue tables on every input/change event.
- Updates only the bulk preview, selected count, validation state and Apply button while price/stock/limit/window values are being edited.
- Keeps full table rendering for changes that actually alter the displayed catalogue, pagination or multi-row selection state.
- Builds manual and event catalogue rows in `DocumentFragment` instances before attaching them to the live DOM.
- Updates a single row locally when its selection checkbox changes instead of rebuilding the full current page.
- Extends site validation so the lighter bulk-edit rendering path cannot silently regress.
- Refreshes GitHub Pages cache versions.

## Compatibility

- Pair with Bot v1.18.76.
- No Railway API contract, Shop filtering, catalogue selection semantics, protected bulk action, checkout, selected-server routing or persistent record changes.
