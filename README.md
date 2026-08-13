# World War Z Bot Website — v1.22.84

Static GitHub Pages dashboard for the World War Z PlayStation DayZ community.

## Current release

Website v1.22.84 continues the measurement-driven startup work. The member/Owner Appeals controller is now view-lazy instead of occupying the eager Account authentication bundle. Normal dashboard startup retains Discord authentication and account-summary behaviour while deferring roughly 22.7 KB of Appeals-specific JavaScript until Appeals or Owner Appeal Settings is actually opened.

Chernarus/Livonia routing, Shop, Delivery, map geometry and protected Railway API behaviour are unchanged.
