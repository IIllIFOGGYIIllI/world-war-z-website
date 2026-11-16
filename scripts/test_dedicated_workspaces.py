#!/usr/bin/env python3
"""Release gate: every dashboard tab is a separate document, not a hidden panel."""
from __future__ import annotations

import argparse
import json
from pathlib import Path

from bs4 import BeautifulSoup


def validate(site: Path) -> None:
    rows = json.loads((site / "workspaces/routes.json").read_text(encoding="utf-8"))
    assert len(rows) >= 70, f"Missing routes: {len(rows)}"
    keys = [row["key"] for row in rows]
    assert len(set(keys)) == len(keys)
    assert keys[0] == "overview/summary"
    assert len(set(row["url"] for row in rows)) == len(rows)

    for route in rows:
        page = site / route["url"]
        assert page.is_file(), f"No physical HTML page for {route['key']}"
        document = BeautifulSoup(page.read_text(encoding="utf-8"), "html.parser")
        view, section = route["view"], route["section"]
        assert document.html.get("data-wwz-dedicated-workspace") == route["key"]
        all_panels = document.select("[data-view-panel]")
        assert len(all_panels) == 1, (
            f"{route['key']} still contains other workspace panels: "
            f"{[x.get('data-view-panel') for x in all_panels]}")
        panel = all_panels[0]
        assert panel.get("data-view-panel") == view
        assert not panel.has_attr("hidden")
        assert "active" in panel.get("class", [])
        matching = panel.select(f'[data-dashboard-section="{section}"]')
        assert matching, f"{route['key']} has no own section"
        unexpected = [
            element.get("data-dashboard-section")
            for element in panel.select("[data-dashboard-section]")
            if element.get("data-dashboard-section") != section
        ]
        assert not unexpected, (
            f"{route['key']} still ships OTHER tab content: {unexpected}")
        sidebar = document.select(".sidebar-navigation button.side-link[data-view][data-section]")
        assert len(sidebar) == len(rows), f"Sidebar navigation lost in {route['key']}"
        assert all(button.get("data-workspace-page") for button in sidebar)
        active = [button for button in sidebar if button.get("aria-current") == "page"]
        assert len(active) == 1 and active[0].get("data-workspace-page") == route["url"]
        assert document.select_one("[data-dashboard-gateway]")
        assert document.select_one("[data-workspace-label]")
        assert document.select_one("[data-dashboard-search]")
        assert document.select_one("[data-sidebar]")
        assert document.select_one("[data-topbar-server-mode]")
        assert document.select_one("script") and "WWZDedicatedWorkspace" in str(document)
        if route["key"] == "overview/summary":
            assert document.select_one("base") is None
        else:
            assert document.select_one("base").get("href") == "../"
        if route["key"] == "community/events":
            assert panel.select_one("[data-raid-damage-controls]")
            assert panel.select_one("[data-vehicle-wipe-owner]")
            assert panel.select_one("[data-automation-send-test]")
        elif view == "community":
            assert not panel.select("[data-raid-damage-controls]")
            assert not panel.select("[data-vehicle-wipe-owner]")
    source = (site / "dashboard.html").read_text(encoding="utf-8")
    assert "data-view-panel=\"staff\"" not in source
    assert "data-view-panel=\"community\"" not in source
    assert "data-raid-damage-toggle" not in source
    assert "data-wipe-enable" not in source
    assert (site / "workspaces/community-events.html").is_file()
    assert (site / "workspaces/zones-manage.html").is_file()
    assert (site / "workspaces/community-analytics.html").is_file()
    assert (site / "workspaces/staff-server-controls.html").is_file()
    print(f"PASS: {len(rows)} genuinely independent dashboard HTML pages; "
          "no other workspace panels or tabs shipped inside each document.")


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--site-root", type=Path, default=Path(__file__).resolve().parents[1])
    args = parser.parse_args()
    validate(args.site_root.resolve())
