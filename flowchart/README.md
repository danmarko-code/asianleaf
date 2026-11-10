# Asian Leaf HOA — Flowcharts

Everything needed to draw (or auto-generate) the portal's process diagrams.

## Files

| File | What it is |
|---|---|
| `system-flowcharts.md` | The full spec: shape legend, actor table, step-by-step node tables for every chart. Read this when drawing by hand. |
| `00-whole-system.mmd` | **The whole system on one page** — every lane and module in a single diagram. Start with this one. |
| `01-registration-approval-login.mmd` | Chart A — register → admin approve/reject → login. |
| `02-dues-payment-verification.mmd` | Chart B — generate dues → submit GCash reference → verify, plus reminders. |
| `03-violations.mmd` | Chart C — issue, notify, resolve/dismiss. |
| `04-budget-feedback.mmd` | Charts D (budget) and E (feedback). |
| `05-password-otp.mmd` | Chart F — password change/reset with OTP. |
| `svg/*.svg` | Pre-rendered vector images — drop straight into Word / docs / slides. |
| `jpg/*.jpg` | Pre-rendered raster images, same diagrams. |

## Already rendered for you

The `svg/` and `jpg/` folders hold the six diagrams, generated from the `.mmd`
sources. Open the SVG if you need to zoom, print, or edit it in Inkscape;
use the JPG for pasting into Word or a slide deck.

If you change a `.mmd` file, re-render it with the command at the bottom of
this page.

## Viewing / exporting a `.mmd` file

1. Open <https://mermaid.live>
2. Paste the file contents into the left code panel (or drag the file in)
3. **Actions → Download PNG** (or SVG)

No install needed. To render locally instead:

```bash
npx -y @mermaid-js/mermaid-cli -i flowchart/01-registration-approval-login.mmd -o flowchart/svg/01-registration-approval-login.svg
```

(That download is large — ~300 MB — because it pulls a headless Chromium.)

## Shape conventions used

| Shape in the `.mmd` files | Mermaid syntax | Meaning |
|---|---|---|
| Stadium/oval | `A(["text"])` | Start / End |
| Rectangle | `A["text"]` | Process / action |
| Parallelogram | `A[/"text"/]` | Input typed by a user, or a message shown back |
| Diamond | `A{"text"}` | Decision — always two exits, labelled Yes/No |
| Cylinder | `A[("text")]` | Database write/read |
| Hexagon | `A{{"text"}}` | Preparation / computed values |
| Circle | `A(("A"))` | On-page connector |

Mermaid has no portable "document" shape, so notification steps are plain rectangles whose label starts with `NOTIFY:`. When drawing by hand in draw.io / Word, swap those to the document symbol (rectangle with a wavy bottom edge).

## Colour suggestion for a printed copy

- Terminators — grey
- Decisions — yellow
- Messages / error feedback — light red
- Database writes — light blue
- Notifications — light green
