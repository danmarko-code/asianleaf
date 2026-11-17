"""Build Francisco_Week11_OBA_ProgressReport9.docx from Week11_ProgressReport9.md.

No template .docx exists in the repository, so this produces a clean standalone
report. Formatting: Times New Roman 12 pt, 1.5 line spacing, 1-inch margins on
Letter. Tables repeat their header row and autofit by content weight.
"""
from __future__ import annotations

import re
from pathlib import Path

from docx import Document
from docx.enum.table import WD_TABLE_ALIGNMENT
from docx.enum.text import WD_ALIGN_PARAGRAPH, WD_BREAK
from docx.oxml import OxmlElement
from docx.oxml.ns import qn
from docx.shared import Inches, Pt, RGBColor

HERE = Path(__file__).resolve().parent
SRC = HERE / "Week11_ProgressReport9.md"
OUT = HERE / "Francisco_Week11_OBA_ProgressReport9.docx"

FONT = "Times New Roman"
MONO = "Courier New"
BODY_PT = 12
LINE = 1.5
USABLE_IN = 6.5  # Letter 8.5" - 1" left - 1" right


def force_font(target, name: str = FONT, size: int | None = None) -> None:
    font = target.font
    font.name = name
    if size is not None:
        font.size = Pt(size)
    element = getattr(target, "element", None)
    if element is None:
        return
    rpr = element.get_or_add_rPr()
    rfonts = rpr.find(qn("w:rFonts"))
    if rfonts is None:
        rfonts = OxmlElement("w:rFonts")
        rpr.append(rfonts)
    for attr in ("w:ascii", "w:hAnsi", "w:eastAsia", "w:cs"):
        rfonts.set(qn(attr), name)


def restyle_styles(doc: Document) -> None:
    for name in ("Normal", "Body Text", "List Bullet", "List Number", "Caption"):
        try:
            style = doc.styles[name]
        except KeyError:
            continue
        force_font(style, FONT, BODY_PT)
        pf = style.paragraph_format
        pf.line_spacing = LINE
        pf.space_after = Pt(6)
        pf.space_before = Pt(0)

    for level in range(1, 5):
        try:
            style = doc.styles[f"Heading {level}"]
        except KeyError:
            continue
        force_font(style, FONT, BODY_PT)
        style.font.bold = True
        style.font.italic = False
        style.font.color.rgb = RGBColor(0, 0, 0)
        pf = style.paragraph_format
        pf.line_spacing = LINE
        pf.space_before = Pt(12 if level <= 2 else 8)
        pf.space_after = Pt(6)
        pf.keep_with_next = True


def add_run(par, text: str, *, bold=False, italic=False, mono=False):
    run = par.add_run(text)
    run.bold = bold or None
    run.italic = italic or None
    force_font(run, MONO if mono else FONT, 9 if mono else BODY_PT)
    return run


INLINE = re.compile(r"(\*\*[^*]+\*\*|`[^`]+`|\*[^*\s][^*]*\*)")


def add_inline(par, text: str) -> None:
    for token in INLINE.split(text):
        if not token:
            continue
        if token.startswith("**") and token.endswith("**") and len(token) > 4:
            add_run(par, token[2:-2], bold=True)
        elif token.startswith("`") and token.endswith("`") and len(token) > 2:
            add_run(par, token[1:-1], mono=True)
        elif token.startswith("*") and token.endswith("*") and len(token) > 2:
            add_run(par, token[1:-1], italic=True)
        else:
            add_run(par, token)


def new_par(doc, *, align=None, style=None, indent=None, space_after=6):
    par = doc.add_paragraph(style=style) if style else doc.add_paragraph()
    pf = par.paragraph_format
    pf.line_spacing = LINE
    pf.space_after = Pt(space_after)
    pf.space_before = Pt(0)
    if align is not None:
        par.alignment = align
    if indent is not None:
        pf.left_indent = Inches(indent)
    return par


def repeat_header(row) -> None:
    tr_pr = row._tr.get_or_add_trPr()
    header = OxmlElement("w:tblHeader")
    header.set(qn("w:val"), "true")
    tr_pr.append(header)


def autofit_columns(table, rows) -> None:
    cols = len(rows[0])
    weights = []
    for c in range(cols):
        longest = max((len(r[c]) for r in rows), default=1)
        avg = sum(len(r[c]) for r in rows) / max(len(rows), 1)
        weights.append(max(1.0, (longest * 0.55) + (avg * 0.45)))
    total = sum(weights)
    widths = [max(0.62, USABLE_IN * w / total) for w in weights]
    scale = USABLE_IN / sum(widths)
    widths = [w * scale for w in widths]
    for c, width in enumerate(widths):
        table.columns[c].width = Inches(width)
    for row in table.rows:
        for c, width in enumerate(widths):
            row.cells[c].width = Inches(width)


def add_table(doc, rows: list[list[str]]) -> None:
    header, body = rows[0], rows[1:]
    table = doc.add_table(rows=1, cols=len(header))
    table.style = "Table Grid"
    table.alignment = WD_TABLE_ALIGNMENT.CENTER
    table.autofit = False

    for i, label in enumerate(header):
        par = table.rows[0].cells[i].paragraphs[0]
        par.paragraph_format.line_spacing = LINE
        par.paragraph_format.space_after = Pt(2)
        add_inline(par, label)
        for run in par.runs:
            run.bold = True
    repeat_header(table.rows[0])

    for line in body:
        cells = table.add_row().cells
        for i, value in enumerate(line):
            par = cells[i].paragraphs[0]
            par.paragraph_format.line_spacing = LINE
            par.paragraph_format.space_after = Pt(2)
            add_inline(par, value)

    autofit_columns(table, rows)
    doc.add_paragraph().paragraph_format.space_after = Pt(0)


def build() -> None:
    doc = Document()

    section = doc.sections[0]
    section.page_width = Inches(8.5)
    section.page_height = Inches(11)
    for margin in ("left_margin", "right_margin", "top_margin", "bottom_margin"):
        setattr(section, margin, Inches(1.0))
    restyle_styles(doc)

    header_par = section.header.paragraphs[0]
    header_par.alignment = WD_ALIGN_PARAGRAPH.RIGHT
    add_run(header_par, "Asian Leaf HOA - Week 11 OBA - Progress Report 9", italic=True)

    lines = SRC.read_text(encoding="utf-8").splitlines()
    i = 0
    while i < len(lines):
        line = lines[i].rstrip()

        if line.strip().startswith("```"):
            fence = line.strip()[3:].strip().lower()
            i += 1
            block: list[str] = []
            while i < len(lines) and not lines[i].strip().startswith("```"):
                block.append(lines[i])
                i += 1
            i += 1
            if fence == "mermaid":
                par = new_par(doc, align=WD_ALIGN_PARAGRAPH.CENTER, space_after=12)
                add_run(par, "[Diagram supplied as a .mmd file in the project documentation]", italic=True)
            else:
                for raw in block:
                    par = new_par(doc, space_after=0)
                    par.paragraph_format.line_spacing = 1.0
                    add_run(par, raw if raw.strip() else " ", mono=True)
                doc.add_paragraph().paragraph_format.space_after = Pt(0)
            continue

        if line.lstrip().startswith("|"):
            rows: list[list[str]] = []
            while i < len(lines) and lines[i].lstrip().startswith("|"):
                raw = lines[i].strip().strip("|")
                if not re.fullmatch(r"[\s:\-|]+", raw):
                    rows.append([cell.strip() for cell in raw.split("|")])
                i += 1
            if rows:
                add_table(doc, rows)
            continue

        heading = re.match(r"^(#{1,4})\s+(.*)$", line)
        if heading:
            level = min(len(heading.group(1)), 4)
            text = heading.group(2).strip()
            if text.upper().startswith("CHAPTER 3"):
                doc.add_paragraph().add_run().add_break(WD_BREAK.PAGE)
                par = new_par(doc, align=WD_ALIGN_PARAGRAPH.CENTER, space_after=12)
                add_run(par, re.sub(r"[*_]", "", text), bold=True)
            else:
                par = doc.add_paragraph(style=f"Heading {level}")
                par.paragraph_format.line_spacing = LINE
                add_inline(par, text)
                for run in par.runs:
                    run.bold = True
                    run.font.color.rgb = RGBColor(0, 0, 0)
                    force_font(run, FONT, BODY_PT)
            i += 1
            continue

        stripped = line.strip()

        if stripped in {"---", "***", "___"}:
            i += 1
            continue

        if stripped.startswith("> "):
            par = new_par(doc, indent=0.4)
            add_inline(par, stripped[2:])
            for run in par.runs:
                run.italic = True
            i += 1
            continue

        if re.match(r"^[-*]\s+", stripped):
            par = new_par(doc, style="List Bullet")
            add_inline(par, re.sub(r"^[-*]\s+", "", stripped))
            i += 1
            continue

        if re.match(r"^\d+\.\s+", stripped):
            par = new_par(doc, style="List Number")
            add_inline(par, re.sub(r"^\d+\.\s+", "", stripped))
            i += 1
            continue

        if stripped:
            par = new_par(doc, align=WD_ALIGN_PARAGRAPH.JUSTIFY)
            add_inline(par, stripped)

        i += 1

    core = doc.core_properties
    core.title = "Week 11 OBA - System Prototype and Progress Report 9"
    core.subject = (
        "Design and Development of a Web-Based Homeowners Association Management "
        "and Financial Transparency System for the Asian Leaf Homeowners Association"
    )
    core.author = "Francisco"
    core.comments = "Chapter 3 continuation. Generated from Week11_ProgressReport9.md."

    doc.save(OUT)
    print(f"Wrote {OUT}")
    print(f"Size: {OUT.stat().st_size:,} bytes")


if __name__ == "__main__":
    build()
