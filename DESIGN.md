# Prototype design contract

User scope: working public prototype with basic aesthetics; later visual refinement is explicitly deferred. This is a temporary code-led implementation, not an approved permanent brand.

Mode: Operate. Compact reference-library navigation. Visitors find a named site, open its exact URL, and optionally check the entry from the server network.

First viewport: white header, short title, search plus a blue batch-check action, category filters, status summary, and real resource entries. No decorative imagery. Cards are appropriate to the explicitly discussed site directory.

Tokens: surface #f5f7fb, paper #ffffff, ink #1a253b, secondary #5f6b80, accent #2453dd, rule #dde3ed; success #136d4c, caution #895411, error #af3038. Font: platform Chinese sans. Body 16px, labels 14px, secondary metadata 12–13px. Cards radius 14px, controls 7–10px; 18px grid gap, 23px card inset. Desktop 3 columns, wide desktop 4, tablet 2, phone 1.

Interaction: loading changes the existing status row and card outline; results update in place without reordering. New-tab navigation always remains available. Respect reduced motion. Errors in the check service preserve prior results and do not label the target unavailable.

Deferred: final name/logo, brand typography, custom domain, shared durable check history and broader anti-abuse infrastructure.
