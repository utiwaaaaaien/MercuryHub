---
name: MercuryHub
description: 按推荐星级快速进入影视资源网站
colors:
  primary: "#0066cc"
  primary-deep: "#0055ad"
  primary-text: "#0058b2"
  primary-soft: "#e8f2ff"
  surface: "#f5f5f7"
  paper: "#ffffff"
  ink: "#1d1d1f"
  ink-secondary: "#414146"
  text-muted: "#55555a"
  text-quiet: "#66666b"
  rule: "#dddddf"
  rule-soft: "#ededf0"
  input-rule: "#d4d4da"
  star: "#9b6300"
  star-empty: "#aaaab1"
  success: "#136d4c"
  caution: "#895411"
  error: "#b42332"
typography:
  display:
    fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", "PingFang SC", "Microsoft YaHei", sans-serif'
    fontSize: "clamp(32px, 3.7vw, 48px)"
    fontWeight: 720
    lineHeight: 1.15
    letterSpacing: "-0.035em"
  body:
    fontSize: "16px"
    lineHeight: 1.5
  title:
    fontSize: "23px"
    fontWeight: 700
  label:
    fontSize: "13px"
rounded:
  tag: "5px"
  small: "9px"
  control: "12px"
  card: "16px"
spacing:
  grid-gap: "16px"
  card-inset: "22px"
components:
  open-button:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.paper}"
    rounded: "{rounded.small}"
    height: "44px"
  site-card:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    rounded: "{rounded.card}"
    padding: "{spacing.card-inset}"
---

# MercuryHub Design System

## Overview

The directory takes its visual reference from the [Apple Developer homepage](https://developer.apple.com/cn/): restrained navigation, generous space, dark type, pale neutral surfaces, and a single blue action color. The page is a working directory, so search, star ranking, and direct links take priority over promotional imagery.

## Colors

A white navigation bar and white site cards sit on a pale gray page. Near-black text establishes hierarchy. Blue identifies the direct link and focus state. Gold is reserved for the site stars. Green, amber, and red retain their meanings for server check results and always accompany text labels.

## Typography

Use the system font stack so Chinese and Latin names render naturally across devices. The page title ranges from 32 to 48 pixels. Site names, domains, star labels, and supporting metadata step down clearly. Numeric capacity and status counts use tabular numerals.

## Layout

The content width is 1180 pixels inside a 1236 pixel container. Site cards use three columns on desktop, two below 1000 pixels, and one below 680 pixels. Search sits above category and status filters. All filtered results retain descending star order. On a phone, the direct link for the first card stays visible in the initial viewport.

## Elevation & Depth

Surfaces are flat at rest. A site card lifts slightly with a soft shadow on hover. Search uses a blue focus ring. Borders separate the compact monitoring row and secondary controls.

## Shapes

Cards use a 16 pixel radius, search uses 12 pixels, and action controls use 9 pixels. Small tags use 5 pixels. The black brand mark is a compact rounded square.

## Components

Each card presents the target site's visible name and domain, its five point star scale, resource categories, and recorded capacity before actions. Cards have no thumbnail or monogram. The blue “打开网站” link is the primary action. The outlined “检测” button and result details remain secondary. Server check failures never disable the external link.

## Do's and Don'ts

- Describe ratings and capacity as recorded values when context is needed.
- Preserve an immediate path to every external website.
- Show server check times and status wording without implying local browser access or download availability.
