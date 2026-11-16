#!/usr/bin/env python3
"""Publish real, standalone HTML files for every World War Z dashboard route.

The large dashboard.html in git is an authoring template. The deployed
dashboard.html is ONLY Overview, and each sidebar tab is a separate
workspaces/<view>-<section>.html document with only that workspace panel and
section. This is static HTML generation, not hiding a giant page with CSS.
Existing protected API access and shared site shell remain unchanged.
"""
from __future__ import annotations

import argparse
import json
import re
from pathlib import Path

from bs4 import BeautifulSoup

ROOT = Path(__file__).resolve().parents[1]
TEMPLATE = ROOT / "dashboard.html"
OVERVIEW = "overview/summary"
FILENAME_PATTERN = re.compile(r"^[a-z][a-z0-9-]*$")


def routes_from(template: BeautifulSoup) -> tuple[list[dict[str, str]], dict[str, str]]:
    routes: list[dict[str, str]] = []
    for link in template.select(".sidebar-navigation button.side-link[data-view][data-section]"):
        view, section = str(link["data-view"]), str(link["data-section"])
        if not FILENAME_PATTERN.fullmatch(view) or not FILENAME_PATTERN.fullmatch(section):
            raise ValueError(f"Unsafe dashboard route: {view}/{section}")
        key = f"{view}/{section}"
        if any(row["key"] == key for row in routes):
            raise ValueError(f"Duplicate sidebar route: {key}")
        panel = template.select_one(f'[data-view-panel="{view}"]')
        if panel is None or panel.select_one(f'[data-dashboard-section="{section}"]') is None:
            raise ValueError(f"Sidebar tab lacks its own section: {key}")
        url = ("dashboard.html" if key == OVERVIEW
               else f"workspaces/{view}-{section}.html")
        label = str(link.get("data-nav-label") or
                    link.get_text(" ", strip=True) or section.title())
        routes.append(dict(key=key, view=view, section=section,
                           url=url, label=label))
    if not routes or routes[0]["key"] != OVERVIEW:
        raise ValueError("Overview must remain the first standalone route")
    if len(routes) < 70:
        raise ValueError(f"Expected full dashboard route inventory; found {len(routes)}")
    return routes, {row["key"]: row["url"] for row in routes}


def make_page(template_html: str, route: dict[str, str],
              route_map: dict[str, str]) -> str:
    soup = BeautifulSoup(template_html, "html.parser")
    if soup.head is None or soup.body is None or soup.html is None:
        raise ValueError("Missing shared HTML shell")
    view, section = route["view"], route["section"]
    is_nested = route["key"] != OVERVIEW

    if is_nested:
        base = soup.new_tag("base", href="../")
        soup.head.insert(0, base)

    # Bootstrap metadata runs BEFORE dashboard shell.js and account.js.
    metadata = soup.new_tag("script")
    metadata.string = (
        "window.WWZDedicatedWorkspace = Object.freeze("
        + json.dumps({"current": route["key"], "routes": route_map},
                     ensure_ascii=True, separators=(",", ":")).replace("<", "\\u003c")
        + ");"
    )
    soup.head.insert(1 if is_nested else 0, metadata)
    soup.html["data-wwz-dedicated-workspace"] = route["key"]
    soup.body["class"] = list(soup.body.get("class", [])) + ["wwz-dedicated-page"]
    if soup.title:
        soup.title.string = f'{route["label"]} | World War Z Command Centre'

    # Sidebar keeps every link, but each link addresses a real HTML document.
    for button in soup.select(".sidebar-navigation button.side-link[data-view][data-section]"):
        key = f'{button["data-view"]}/{button["data-section"]}'
        button["data-workspace-page"] = route_map[key]
        classes = list(button.get("class", []))
        if key == route["key"]:
            if "active" not in classes:
                classes.append("active")
            button["aria-current"] = "page"
        else:
            classes = [item for item in classes if item != "active"]
            button.attrs.pop("aria-current", None)
        button["class"] = classes

    panels = list(soup.select("[data-view-panel]"))
    active = next((panel for panel in panels
                   if panel.get("data-view-panel") == view), None)
    if active is None:
        raise ValueError(f"Missing panel for {route['key']}")
    for panel in panels:
        if panel is not active:
            panel.decompose()
    active.attrs.pop("hidden", None)
    active["class"] = list(dict.fromkeys(
        list(active.get("class", [])) + ["active"]
    ))

    # Remove other tabs' actual HTML content. Nothing is merely display:none.
    # Keep an ancestor only when the selected tab itself is nested inside it.
    for element in list(active.select("[data-dashboard-section]")):
        if element.parent is None:
            continue
        if element.get("data-dashboard-section") == section:
            continue
        if element.select_one(f'[data-dashboard-section="{section}"]'):
            continue
        element.decompose()

    if active.select_one(f'[data-dashboard-section="{section}"]') is None:
        raise ValueError(f"Extraction lost requested workspace: {route['key']}")

    # Raid/vehicle automation live ABOVE the Community tabs in the authoring
    # template. Only Events gets these controls, not Analytics/App/Notifications.
    if view == "community" and section != "events":
        for selector in ("[data-raid-damage-controls]", "[data-vehicle-wipe-owner]"):
            for element in list(active.select(selector)):
                element.decompose()

    # Some views have a shared title for several distinct tabs. Use a
    # route-specific heading without changing tab controllers or handlers.
    heading = active.select_one(":scope > .view-heading")
    if heading is None:
        heading = active.select_one(".community-hero") if view == "community" else None
    if heading is not None and route["key"] != OVERVIEW:
        title = heading.select_one("h1, h2")
        if title is not None:
            title.string = route["label"]
    else:
        # The original specific section may already contain its own heading.
        # Add one when its old shared heading was extracted with another tab.
        local_heading = active.select_one(
            f'[data-dashboard-section="{section}"] .view-heading'
        )
        if local_heading is None and route["key"] != OVERVIEW:
            header = soup.new_tag("header", attrs={"class": "view-heading wwz-dedicated-heading"})
            inner = soup.new_tag("div")
            crumb = soup.new_tag("p", attrs={"class": "breadcrumb"})
            crumb.string = "World War Z / " + route["label"]
            title = soup.new_tag("h1", id="wwz-dedicated-page-title")
            title.string = route["label"]
            inner.append(crumb)
            inner.append(title)
            header.append(inner)
            active.insert(0, header)
            active["aria-labelledby"] = "wwz-dedicated-page-title"

    # Keep common authentication dialogs, overlay controls and shared scripts.
    # Other workspaces' cards and data sections are physically ABSENT.
    # BeautifulSoup retains the source doctype; do not emit it twice.
    content = str(soup)
    return content if content.lstrip().lower().startswith("<!doctype html") else "<!DOCTYPE html>\n" + content


def generate(root: Path) -> list[dict[str, str]]:
    source = TEMPLATE.read_text(encoding="utf-8")
    routes, route_map = routes_from(BeautifulSoup(source, "html.parser"))
    workspaces = root / "workspaces"
    workspaces.mkdir(parents=True, exist_ok=True)
    for route in routes:
        destination = root / route["url"]
        destination.parent.mkdir(parents=True, exist_ok=True)
        destination.write_text(make_page(source, route, route_map), encoding="utf-8")
    (workspaces / "routes.json").write_text(
        json.dumps(routes, indent=2, ensure_ascii=False) + "\n", encoding="utf-8"
    )
    print(f"Generated {len(routes)} separate dashboard HTML pages (Overview + "
          f"{len(routes)-1} workspace pages) in {root}")
    return routes


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--output-root", type=Path, default=ROOT)
    args = parser.parse_args()
    generate(args.output_root.resolve())


if __name__ == "__main__":
    main()
