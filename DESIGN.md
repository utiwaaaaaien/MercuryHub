---
name: Mercury 影视资源导航原型
description: 影视资源站点导航与服务器连接检测
colors:
  primary: "#2453dd"
  surface: "#f5f7fb"
  paper: "#ffffff"
  ink: "#1a253b"
  secondary-text: "#5f6b80"
  rule: "#dde3ed"
  success: "#136d4c"
  caution: "#895411"
  error: "#af3038"
typography:
  title:
    fontSize: "clamp(26px, 2.6vw, 36px)"
    fontWeight: 700
    lineHeight: 1.4
    letterSpacing: "-0.035em"
  body:
    fontFamily: '"PingFang SC", "Microsoft YaHei", -apple-system, BlinkMacSystemFont, sans-serif'
    fontSize: "16px"
    lineHeight: 1.6
  label:
    fontSize: "14px"
rounded:
  card: "14px"
  control: "10px"
  action: "7px"
spacing:
  card-inset: "23px"
  grid-gap: "18px"
components:
  primary-button:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.paper}"
    rounded: "{rounded.control}"
    height: "54px"
---

# Mercury Prototype Design

## Overview

Temporary code-led prototype requested by the user. Basic aesthetics support rapid navigation and factual status interpretation. Final brand, custom typography and decorative identity remain deferred.

## Colors

Primary blue identifies actions. Success, caution and error colors always accompany text labels. Cool surfaces distinguish page, cards and controls.

## Typography

Current prototype uses the platform Chinese sans stack. Body text is 16px, labels 14px and supporting metadata 12–13px. The platform display face is provisional, not a final brand commitment.

## Layout

A compact header precedes search, category filters, detection summary and directory cards. Grid: three columns by default, four from 1600px, two up to 1000px, one up to 640px. Main container max-width 1304px (1544px wide desktop), 32px horizontal inset, 20px mobile.

## Elevation & Depth

Cards use one-pixel borders without shadows. Focus outlines remain visible. Changes in border and background communicate interaction.

## Shapes

Soft rectangular cards and controls; functional symbols from Lucide, text marks for individual sites. No decorative image assets.

## Components

Each card supports a single on-demand check, with a visible cooldown between new requests. Search and category filters update results in place. Each card preserves its external opening action through loading and errors; reduced-motion preferences disable the loading spin.

## Do's and Don'ts

- Do pair status colors with explicit text and preserve original detection time.
- Do keep direct navigation available after detection failure.
- Don't present original spreadsheet capacity as live statistics.
- Don't equate HTTP success with usable downloadable resources.
