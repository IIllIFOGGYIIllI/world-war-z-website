# World War Z map marker icons

The dashboard marker editor offers the **standard pin** and the 13 pictograms
from the previously produced WWZ Map Icon Pack. All art is original vector SVG
and committed at `assets/map-icons/<id>.svg`.

## Editor and renderer

- In Map Explorer, choose **Save Private Pin** or **Create Public Marker**.
- Set the name, category, X/Z position, and **Marker icon**. The live preview
  shows the chosen pictogram. No icon is assigned automatically or positioned
  on the map: admins decide where repair centres and other services belong.
- The icon belongs to the saved marker and is independent of colour/category.
- Website map markers, result lists, and public map links display it.
- Private marker values are validated against the 13 IDs and saved with the
  other browser-local marker fields under the existing storage key.
- Public markers are sent to `/api/admin/map/markers/action` with an `icon`
  string. The bot API validates the allowlist, stores the field in SQLite, and
  returns it in public list responses.
- Older markers are migrated to `icon=default` and keep their old appearance.
- No user-provided file paths, arbitrary URLs, or HTML are accepted for icons.
- PvE and PvP share art but retain the server-scoped marker API permissions and
  data model. Chernarus and Livonia map imagery is unchanged.

IDs: `vehicle-repair`, `mechanic-garage`, `vehicle-rental`,
`tow-service`, `fuel-station`, `vehicle-parts`, `trader`,
`builder-shed`, `medical`, `police`, `fire-station`,
`water-tower`, `radio-building`.

Site automated checks: `node scripts/test_marker_icon_pack.js`.
Bot checks: `python -m pytest tests/test_dashboard_map_markers.py`.

No default repair centre locations are provided.
