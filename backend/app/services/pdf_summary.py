from io import BytesIO

from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer


def build_summary_pdf(report):
    buffer = BytesIO()

    doc = SimpleDocTemplate(
        buffer,
        pagesize=A4,
        title=f"Med Holo AI Summary - {report.original_name}",
    )

    styles = getSampleStyleSheet()
    story = []
    analysis = report.analysis_json or {}

    story.append(Paragraph("Med Holo AI Report Summary", styles["Title"]))
    story.append(Spacer(1, 12))

    story.append(Paragraph(f"File: {report.original_name or 'Unknown'}", styles["Normal"]))
    story.append(Paragraph(f"File type: {report.file_type or 'unknown'}", styles["Normal"]))
    story.append(Spacer(1, 10))

    summary_text = analysis.get("summary") or "No summary available."
    story.append(Paragraph(f"Summary: {summary_text}", styles["BodyText"]))
    story.append(Spacer(1, 10))

    primary_region = analysis.get("primary_region") or "Not detected"
    story.append(Paragraph(f"Primary region: {primary_region}", styles["Heading3"]))
    story.append(Spacer(1, 10))

    story.append(Paragraph("Abnormal Labs", styles["Heading3"]))
    abnormal_labs = analysis.get("abnormal_labs") or []

    if abnormal_labs:
        for item in abnormal_labs[:20]:
            if isinstance(item, dict):
                line = (
                    f"{item.get('name', 'Unknown')}: "
                    f"{item.get('display_value', item.get('value', 'N/A'))} "
                    f"{item.get('unit', '')} "
                    f"({item.get('status', 'unknown')})"
                )
            else:
                line = str(item)
            story.append(Paragraph(line.strip(), styles["Normal"]))
    else:
        story.append(Paragraph("No abnormal labs parsed.", styles["Normal"]))

    story.append(Spacer(1, 10))
    story.append(Paragraph("Findings", styles["Heading3"]))

    findings = analysis.get("findings") or []
    if findings:
        for item in findings[:12]:
            text = item.get("text", str(item)) if isinstance(item, dict) else str(item)
            story.append(Paragraph(text, styles["Normal"]))
    else:
        story.append(Paragraph("No key abnormal phrases detected.", styles["Normal"]))

    story.append(Spacer(1, 12))
    story.append(
        Paragraph(
            "Educational use only. Confirm with a qualified doctor.",
            styles["Italic"],
        )
    )

    doc.build(story)
    buffer.seek(0)
    return buffer