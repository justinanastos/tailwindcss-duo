# What we measured

All values are CSS px. Source: the iOS 27.2 iPhone Duo simulator (Safari `Version/27.2`) unless the row says otherwise.

## Viewport sizes

| Pose | innerWidth × innerHeight | Safe-area insets |
|---|---|---|
| Closed, portrait | 382 × 580 | all 0 |
| Open, landscape | 951 × 537 to 585 | bottom 34 |
| Open, portrait | 669 × 819 to 825 | bottom 34 |

- The height depends on whether Safari's tab strip shows. WebKit's table for Safari 27.1 gives 585 and 867.
- A physical device reported open portrait as 669 × 819.
- `screen.width` and `screen.height` stay at 466 × 678 in every pose. Do not use them.
- The user agent says `iPhone OS 18_7` with `Version/27.2`. Do not read the OS version from it.

## Fold APIs

Both need the Safari feature flags "Device Posture API" and "Viewport Segments API". With the flags off, `navigator.devicePosture` and `window.viewport` are missing, and `device-posture: folded` and `continuous` both match false.

| Pose | `devicePosture.type` | Segments |
|---|---|---|
| Flat or closed | `continuous` | 1 |
| Landscape, half fold (about 92°) | `folded` | 2 side by side, second starts at x = 475.5 |
| Portrait, half fold (about 92°) | `folded` | 2 stacked, second starts at y = 343.5 |

- A half fold sends no `resize` event. Use the posture `change` event.
- That event fires before media queries and segments update. Read again about 700 ms later.
- Segment height is unreliable. One pose gave 2242, 650, 673.5 and 475.5 on different runs. Width and start position were stable.
- In portrait the top segment is shorter than the bottom one, because Safari's toolbar covers the top of the screen.
