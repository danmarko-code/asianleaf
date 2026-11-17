"""Extract the Mermaid fences from Week10_ProgressReport8.md into diagrams/*.mmd.

Keeps the .mmd files byte-identical to the diagrams embedded in the report.
"""
from pathlib import Path

HERE = Path(__file__).resolve().parent
SRC = HERE / "Week10_ProgressReport8.md"
OUT = HERE / "diagrams"

NAMES = [
    "use-case-diagram",
    "context-diagram-level0",
    "dfd-level1",
    "erd",
    "architecture",
]

text = SRC.read_text(encoding="utf-8")
lines = text.splitlines()

blocks, current, inside = [], None, False
for line in lines:
    stripped = line.strip()
    if not inside and stripped == "```mermaid":
        inside, current = True, []
        continue
    if inside and stripped == "```":
        inside = False
        blocks.append("\n".join(current).strip() + "\n")
        current = None
        continue
    if inside:
        current.append(line)

if len(blocks) != len(NAMES):
    raise SystemExit(f"expected {len(NAMES)} mermaid blocks, found {len(blocks)}")

OUT.mkdir(parents=True, exist_ok=True)
for name, body in zip(NAMES, blocks):
    path = OUT / f"{name}.mmd"
    path.write_text(body, encoding="utf-8")
    print(f"{path.name}: {len(body.splitlines())} lines")
