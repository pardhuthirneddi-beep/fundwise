"""Generate the two requested, self-contained hackathon deliverables."""
from __future__ import annotations

import shutil
from pathlib import Path
from typing import Any

from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_LEFT
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import mm
from reportlab.platypus import (
    BaseDocTemplate, Frame, PageTemplate, Paragraph, Preformatted, Spacer,
    Table, TableStyle, PageBreak, KeepTogether,
)
from reportlab.graphics.shapes import Drawing, Line, Rect, String


def generate_submission(project_root: Path) -> dict[str, Path]:
    artifacts = project_root / "artifacts"
    artifacts.mkdir(parents=True, exist_ok=True)
    code_path = artifacts / "CODE.py"
    pdf_path = artifacts / "CODE-DOC.pdf"
    shutil.copyfile(project_root / "backend" / "solver.py", code_path)

    navy = colors.HexColor("#111820")
    lime = colors.HexColor("#B9F36B")
    muted = colors.HexColor("#66717D")
    ink = colors.HexColor("#202830")
    styles = getSampleStyleSheet()
    styles.add(ParagraphStyle(name="CoverTitle", parent=styles["Title"], fontName="Helvetica-Bold", fontSize=29, leading=35, textColor=navy, alignment=TA_LEFT, spaceAfter=9))
    styles.add(ParagraphStyle(name="CoverSub", parent=styles["Normal"], fontName="Helvetica", fontSize=12, leading=18, textColor=muted, spaceAfter=16))
    styles.add(ParagraphStyle(name="Section", parent=styles["Heading1"], fontName="Helvetica-Bold", fontSize=17, leading=21, textColor=navy, spaceBefore=10, spaceAfter=9, keepWithNext=True))
    styles.add(ParagraphStyle(name="Subsection", parent=styles["Heading2"], fontName="Helvetica-Bold", fontSize=11, leading=15, textColor=ink, spaceBefore=6, spaceAfter=4, keepWithNext=True))
    styles.add(ParagraphStyle(name="BodyFund", parent=styles["BodyText"], fontName="Helvetica", fontSize=9.2, leading=14, textColor=ink, spaceAfter=7))
    styles.add(ParagraphStyle(name="CodeFund", fontName="Courier", fontSize=6.25, leading=7.8, textColor=colors.HexColor("#E8F0E4"), backColor=navy, borderPadding=8, leftIndent=3, rightIndent=3, spaceBefore=4, spaceAfter=8))
    styles.add(ParagraphStyle(name="CodeListing", fontName="Courier", fontSize=5.35, leading=6.8, textColor=colors.HexColor("#E8F0E4"), backColor=navy, borderPadding=7, leftIndent=2, rightIndent=2, spaceBefore=3, spaceAfter=5))
    styles.add(ParagraphStyle(name="SmallFund", parent=styles["BodyText"], fontSize=8, leading=11, textColor=muted))
    page_w, page_h = A4

    def page_chrome(canvas, doc):
        canvas.saveState()
        canvas.setFillColor(navy)
        canvas.rect(0, page_h - 8 * mm, page_w, 8 * mm, stroke=0, fill=1)
        canvas.setFillColor(lime)
        canvas.rect(17 * mm, page_h - 5.1 * mm, 11 * mm, 1.3 * mm, stroke=0, fill=1)
        if doc.page > 1:
            canvas.setStrokeColor(colors.HexColor("#DCE2E5"))
            canvas.line(18 * mm, 16 * mm, page_w - 18 * mm, 16 * mm)
            canvas.setFont("Helvetica", 8)
            canvas.setFillColor(muted)
            canvas.drawString(18 * mm, 10.5 * mm, "FUNDWISE  /  Exact Budget Optimizer")
            canvas.drawRightString(page_w - 18 * mm, 10.5 * mm, f"{doc.page}")
        canvas.restoreState()

    def decision_diagram(width: float) -> Drawing:
        drawing = Drawing(width, 112)
        box_w, box_h = 142, 31
        center_x = width / 2
        top_y = 72
        left_x, right_x = center_x - 165, center_x + 23
        line = colors.HexColor("#8EB8FF")
        green = colors.HexColor("#B9F36B")
        panel = colors.HexColor("#101419")
        for x, y, label, stroke in [
            (center_x - box_w / 2, top_y, "STATE (i, current sum)", green),
            (left_x, 17, "INCLUDE request i", line),
            (right_x, 17, "EXCLUDE request i", colors.HexColor("#7B858D")),
        ]:
            rect: Any = Rect(x, y, box_w, box_h)
            rect.rx = 2
            rect.ry = 2
            rect.fillColor = panel
            rect.strokeColor = stroke
            rect.strokeWidth = 1
            drawing.add(rect)
            drawing.add(String(x + box_w / 2, y + 11, label, textAnchor="middle", fontName="Helvetica", fontSize=7.5, fillColor=colors.white))
        drawing.add(Line(center_x - 35, top_y, left_x + box_w * .73, 48, strokeColor=line, strokeWidth=1))
        drawing.add(Line(center_x + 35, top_y, right_x + box_w * .27, 48, strokeColor=colors.HexColor("#7B858D"), strokeWidth=1))
        drawing.add(String(center_x - 82, 52, "sum + cost[i]", fontName="Helvetica", fontSize=6.7, fillColor=line))
        drawing.add(String(center_x + 43, 52, "same sum", fontName="Helvetica", fontSize=6.7, fillColor=colors.HexColor("#A7B0B8")))
        return drawing

    doc = BaseDocTemplate(str(pdf_path), pagesize=A4, leftMargin=18 * mm, rightMargin=18 * mm, topMargin=20 * mm, bottomMargin=21 * mm, title="FUNDWISE — Algorithm and Submission Documentation", author="FUNDWISE")
    frame = Frame(doc.leftMargin, doc.bottomMargin, doc.width, doc.height, id="normal")
    doc.addPageTemplates([PageTemplate(id="fundwise", frames=frame, onPage=page_chrome)])
    story = []
    P = lambda text: Paragraph(text, styles["BodyFund"])
    H = lambda text: Paragraph(text, styles["Section"])

    story += [Spacer(1, 24 * mm), Paragraph("FUNDWISE", styles["CoverTitle"]),
              Paragraph("Exact Budget. Every Plan. Smallest Team.", styles["CoverSub"]),
              Table([[Paragraph("ALGORITHM SUBMISSION  ·  TECHNICAL DOCUMENT", styles["SmallFund"]) ]], colWidths=[doc.width], style=TableStyle([
                  ("BACKGROUND", (0,0),(-1,-1), colors.HexColor("#EEF6E4")),
                  ("BOX", (0,0),(-1,-1), 0.5, lime), ("LEFTPADDING",(0,0),(-1,-1),10),
                  ("TOPPADDING",(0,0),(-1,-1),9),("BOTTOMPADDING",(0,0),(-1,-1),9)])),
              Spacer(1, 13 * mm), P("A practical funding-plan optimizer powered by a recursive Sum of Subsets search. This document describes the exact algorithm, its correctness, complexity, safe pruning rules, and verification cases."),
              P("The generated standalone source file is <b>CODE.py</b>. The official first-page submission checklist was not provided; no checklist requirements have been assumed."),
              Spacer(1, 11 * mm), H("1. Problem statement"),
              P("Given n positive request costs in their original order and an integer target budget T, count every subset whose costs sum exactly to T. Also return the smallest number of selected requests, the number of subsets with that minimum size, and the lexicographically smallest increasing 1-based index list among minimum-size subsets."),
              H("2. Input and output specification"),
              P("Input is whitespace-separated: n and T, followed by exactly n positive integer costs. Constraints: 0 ≤ n ≤ 22, 0 ≤ T ≤ 1,000,000, and 1 ≤ cost ≤ 1,000,000. Output uses four lines: COUNT, MIN_SIZE, OPTIMAL_COUNT, and CHOSEN. CHOSEN is EMPTY for the empty subset and NONE when no plan exists."),
              Preformatted("COUNT 4\nMIN_SIZE 1\nOPTIMAL_COUNT 2\nCHOSEN 3", styles["CodeFund"]),
              H("3. Algorithm explanation"),
              P("At index i, the recursive search makes two decisions in order: INCLUDE request i, then EXCLUDE request i. The path maintains its exact integer sum and selected 1-based indices. When the sum equals T, the subset is recorded and the branch ends; with strictly positive costs, no extension can also equal T."),
              P("The primary pass stores only the exact valid count, current minimum size, optimal count, and best index list. It never retains every valid subset."),
              H("4. Include/exclude pseudocode"),
              Preformatted("SEARCH(i, sum, chosen):\n    if sum > T: return                         # safe over-target prune\n    if sum == T: record(chosen); return\n    if sum + suffix_sum[i] < T: return         # safe unreachable prune\n    if i == n: return\n    SEARCH(i + 1, sum + cost[i], chosen + [i+1])  # INCLUDE\n    SEARCH(i + 1, sum, chosen)                    # EXCLUDE", styles["CodeFund"]),
              decision_diagram(doc.width),
              PageBreak(), H("5. Safe pruning"),
              P("The over-target prune is safe because all future costs are positive, so a sum greater than T cannot decrease back to T. The suffix-sum prune is safe because even selecting every remaining request cannot reach T when current_sum + remaining_suffix_sum < T. Reaching T is terminal because all costs are strictly positive."),
              P("The implementation does not prune based on the current number of selected requests: such a branch may still contain valid subsets that contribute to COUNT."),
              H("6. Correctness proof"),
              Paragraph("<b>Completeness.</b> For every request, a subset either contains it or does not. The recursion explores both branches, so every subset is represented by exactly one root-to-state decision path unless a safe prune proves it cannot be a target subset. Therefore every valid subset is visited and counted once.", styles["BodyFund"]),
              Paragraph("<b>Soundness.</b> A subset is recorded only when the maintained sum of its selected input costs equals T, so every recorded subset is valid.", styles["BodyFund"]),
              Paragraph("<b>Minimum and optimal count.</b> The search visits every valid subset. It replaces the best size and resets the optimal count when it finds a smaller valid subset; it increments the optimal count for every subset of equal best size. At completion these are exactly the global minimum and its count.", styles["BodyFund"]),
              Paragraph("<b>Lexicographic selection.</b> Every minimum-size candidate is an increasing list of 1-based input indices. Explicit list comparison uses the first differing index, which is the defined lexicographic order; retaining the least candidate therefore returns the required tie-break result.", styles["BodyFund"]),
              H("7. Complexity"),
              P("Worst-case time is O(2^n), since each request may produce an include and exclude branch. Auxiliary recursion space is O(n), excluding the bounded optional trace. Safe pruning reduces work on many instances but does not change the worst-case time bound."),
              H("8. Sample and edge-case verification"),
              Table([
                  ["Case", "Input costs / target", "COUNT · MIN · OPT · CHOSEN"],
                  ["Provided sample", "[5,5,10,3,7,10] / 10", "4 · 1 · 2 · 3"],
                  ["Impossible", "[2,4,6] / 1", "0 · -1 · 0 · NONE"],
                  ["Target zero", "[1,2,3,4] / 0", "1 · 0 · 1 · EMPTY"],
                  ["Duplicates", "[2,2,3] / 4", "1 · 2 · 1 · 1 2"],
                  ["Tie break", "[2,1,1,2] / 3", "4 · 2 · 4 · 1 2"],
              ], colWidths=[27*mm, 75*mm, doc.width-102*mm], repeatRows=1, style=TableStyle([
                  ("BACKGROUND",(0,0),(-1,0),navy),("TEXTCOLOR",(0,0),(-1,0),colors.white),
                  ("FONTNAME",(0,0),(-1,0),"Helvetica-Bold"),("FONTSIZE",(0,0),(-1,-1),7.4),
                  ("GRID",(0,0),(-1,-1),0.35,colors.HexColor("#CBD2D8")),
                  ("ROWBACKGROUNDS",(0,1),(-1,-1),[colors.white,colors.HexColor("#F4F7F3")]),
                  ("VALIGN",(0,0),(-1,-1),"TOP"),("LEFTPADDING",(0,0),(-1,-1),6),
                  ("RIGHTPADDING",(0,0),(-1,-1),6),("TOPPADDING",(0,0),(-1,-1),6),
                  ("BOTTOMPADDING",(0,0),(-1,-1),6)])),
              Spacer(1, 5 * mm),
              P("Testing also covers unsorted requests, multiple minimum-size solutions, n=22, output formatting, and deterministic randomized small inputs checked against an independent brute-force oracle."),
              H("9. Python implementation"),
              P("The following is the complete standalone source, identical to the generated CODE.py deliverable. It uses only the Python standard library, reads standard input, and writes only the required four output lines to standard output."),
              PageBreak()]
    source_lines = code_path.read_text(encoding="utf-8").splitlines()
    chunk_size = 42
    for chunk_start in range(0, len(source_lines), chunk_size):
        chunk = source_lines[chunk_start:chunk_start + chunk_size]
        numbered = "\n".join(f"{line_number:03d}  {line}" for line_number, line in enumerate(chunk, chunk_start + 1))
        story.append(Paragraph(f"CODE.py · lines {chunk_start + 1}–{chunk_start + len(chunk)}", styles["SmallFund"]))
        story.append(Preformatted(numbered, styles["CodeListing"]))
        if chunk_start + chunk_size < len(source_lines):
            story.append(PageBreak())
    story += [PageBreak(), H("10. Conclusion"),
              P("Recursive include/exclude search provides a transparent and complete solution for the specified n≤22 domain. Safe suffix and over-target pruning preserve correctness while reducing unnecessary exploration; explicit size counting and lexicographic comparison supply the requested smallest-team result."),
              Spacer(1, 4 * mm), P("FUNDWISE  /  Every combination matters. Find the smallest team.")]
    doc.build(story)
    return {"code": code_path, "pdf": pdf_path}
