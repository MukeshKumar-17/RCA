import io
import datetime
from reportlab.lib.pagesizes import letter
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, ListFlowable, ListItem
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch

async def generate_pdf(report: dict) -> bytes:
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=letter, rightMargin=72, leftMargin=72, topMargin=72, bottomMargin=72)
    styles = getSampleStyleSheet()
    
    # Custom Styles
    title_style = styles['Heading1']
    title_style.alignment = 1 # Center
    
    heading_style = styles['Heading2']
    heading_style.spaceBefore = 12
    heading_style.spaceAfter = 6
    
    normal_style = styles['Normal']
    
    story = []
    
    # Header / Branding
    story.append(Paragraph("RootLens AI - RCA Report", title_style))
    story.append(Spacer(1, 0.2 * inch))
    
    # Incident Summary
    story.append(Paragraph("Incident Summary", heading_style))
    user_context = report.get("user_context", "Untitled Investigation")
    story.append(Paragraph(user_context, normal_style))
    story.append(Spacer(1, 0.1 * inch))
    
    rca = report.get("rca", {})
    
    # Executive Summary
    story.append(Paragraph("Executive Summary", heading_style))
    exec_summary = rca.get("executive_summary", "No executive summary available.")
    story.append(Paragraph(exec_summary, normal_style))
    story.append(Spacer(1, 0.1 * inch))
    
    # Confidence Score
    story.append(Paragraph("Confidence Score", heading_style))
    confidence = rca.get("rca_metadata", {}).get("overall_confidence", rca.get("root_cause", {}).get("confidence", 0))
    story.append(Paragraph(f"{confidence}%", normal_style))
    story.append(Spacer(1, 0.1 * inch))
    
    # Root Cause
    story.append(Paragraph("Root Cause", heading_style))
    root_cause = rca.get("root_cause", {})
    story.append(Paragraph(root_cause.get("title", "Unknown"), styles['Heading3']))
    story.append(Paragraph(root_cause.get("description", "Not enough data provided."), normal_style))
    story.append(Spacer(1, 0.1 * inch))
    
    # Evidence Chain
    if root_cause.get("evidence"):
        story.append(Paragraph("Evidence Chain", heading_style))
        evidence_items = []
        for ev in root_cause.get("evidence", []):
            evidence_items.append(ListItem(Paragraph(ev, normal_style)))
        story.append(ListFlowable(evidence_items, bulletType='bullet'))
        story.append(Spacer(1, 0.1 * inch))
        
    # Timeline
    timeline = rca.get("timeline", [])
    if timeline:
        story.append(Paragraph("Timeline", heading_style))
        timeline_items = []
        for t in timeline:
            phase = t.get("phase", "")
            timestamp = t.get("timestamp", "")
            event = t.get("event", "")
            timeline_items.append(ListItem(Paragraph(f"<b>{timestamp} [{phase}]:</b> {event}", normal_style)))
        story.append(ListFlowable(timeline_items, bulletType='bullet'))
        story.append(Spacer(1, 0.1 * inch))
        
    # Prevention Plan
    prevention = rca.get("prevention", {})
    if prevention:
        story.append(Paragraph("Prevention Plan", heading_style))
        prev_items = []
        for det in prevention.get("detection_improvements", []):
            prev_items.append(ListItem(Paragraph(f"[Detection] {det}", normal_style)))
        for pre in prevention.get("prevention_improvements", []):
            prev_items.append(ListItem(Paragraph(f"[Prevention] {pre}", normal_style)))
        for pro in prevention.get("process_improvements", []):
            prev_items.append(ListItem(Paragraph(f"[Process] {pro}", normal_style)))
        story.append(ListFlowable(prev_items, bulletType='bullet'))
        
    # Footer
    def add_footer(canvas, doc):
        canvas.saveState()
        canvas.setFont('Times-Roman', 9)
        timestamp = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        canvas.drawString(inch, 0.5 * inch, f"Generated at: {timestamp}")
        canvas.restoreState()

    doc.build(story, onFirstPage=add_footer, onLaterPages=add_footer)
    
    buffer.seek(0)
    return buffer.read()
