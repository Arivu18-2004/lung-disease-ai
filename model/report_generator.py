"""
model/report_generator.py — Medical PDF Report Generation
Lung Disease Detection AI System
"""
import os
from datetime import datetime
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Image, Table, TableStyle, PageBreak
from reportlab.lib.units import inch

def generate_medical_report(report_data, output_path):
    """
    Generates a professional clinical PDF report.
    Args:
        report_data (dict): Contains patient, report, result, medical_info, etc.
        output_path (str): Destination path for the PDF file.
    """
    doc = SimpleDocTemplate(output_path, pagesize=letter, rightMargin=50, leftMargin=50, topMargin=50, bottomMargin=50)
    styles = getSampleStyleSheet()
    
    # Custom Styles
    title_style = ParagraphStyle(
        'TitleStyle', parent=styles['Heading1'], fontSize=24, textColor=colors.HexColor("#2563eb"), 
        spaceAfter=20, alignment=1, fontName='Helvetica-Bold'
    )
    header_style = ParagraphStyle(
        'HeaderStyle', parent=styles['Heading2'], fontSize=14, textColor=colors.HexColor("#1e293b"), 
        spaceBefore=12, spaceAfter=6, fontName='Helvetica-Bold'
    )
    body_style = ParagraphStyle(
        'BodyStyle', parent=styles['Normal'], fontSize=10, leading=14, spaceAfter=10
    )
    risk_style = ParagraphStyle(
        'RiskStyle', parent=body_style, fontSize=12, textColor=colors.white, 
        backColor=colors.HexColor("#ef4444") if report_data['risk']['level'] in ['Critical', 'Severe'] else colors.HexColor("#10b981"),
        alignment=1, borderPadding=5, borderRadius=5
    )
    caption_style = ParagraphStyle(
        'CaptionStyle', parent=styles['Normal'], fontSize=8,
        textColor=colors.grey, alignment=1, spaceAfter=6
    )

    story = []

    # 1. Branding Header
    story.append(Paragraph("LungAI Diagnostics", title_style))
    story.append(Paragraph(f"Clinical Analysis Report — Generated on {datetime.now().strftime('%d %b %Y, %H:%M')}", styles['Normal']))
    story.append(Spacer(1, 0.2 * inch))
    story.append(Paragraph("<hr/>", styles['Normal']))
    story.append(Spacer(1, 0.3 * inch))

    # 2. Patient & Report Info Table
    info_data = [
        ["Patient Name:", report_data['patient'].name, "Report ID:", f"#{report_data['report'].id}"],
        ["Age / Gender:", f"{report_data['patient'].age} / {report_data['patient'].gender}", "Date:", report_data['report'].created_at.strftime('%Y-%m-%d')],
    ]
    info_table = Table(info_data, colWidths=[1.2*inch, 2*inch, 1.2*inch, 2*inch])
    info_table.setStyle(TableStyle([
        ('FONTNAME', (0,0), (-1,-1), 'Helvetica-Bold'),
        ('FONTSIZE', (0,0), (-1,-1), 10),
        ('TEXTCOLOR', (0,0), (0,-1), colors.grey),
        ('TEXTCOLOR', (2,0), (2,-1), colors.grey),
        ('ALIGN', (0,0), (-1,-1), 'LEFT'),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
    ]))
    story.append(info_table)
    story.append(Spacer(1, 0.4 * inch))

    # 3. AI Prediction Summary
    story.append(Paragraph("AI Diagnostic Summary", header_style))
    story.append(Spacer(1, 0.1 * inch))
    
    pred_color = "#ef4444" if report_data['report'].prediction != 'NORMAL' else "#10b981"
    story.append(Paragraph(f"Primary Finding: <font color='{pred_color}' size=16><b>{report_data['report'].prediction}</b></font>", body_style))
    story.append(Paragraph(f"Confidence Level: <b>{report_data['report'].confidence:.2f}%</b>", body_style))
    
    if report_data['report'].severity != 'N/A':
        story.append(Paragraph(f"Severity Classification: <b>{report_data['report'].severity}</b>", body_style))
    
    story.append(Spacer(1, 0.1 * inch))
    story.append(Paragraph(f"Clinical Risk Status: {report_data['risk']['level'].upper()}", risk_style))
    story.append(Spacer(1, 0.4 * inch))

    # 4. Images (Original & Heatmap)
    story.append(Paragraph("Radiographic Findings", header_style))
    img_row = []
    
    # Original
    orig_path = os.path.join(os.path.abspath(os.path.dirname(__file__)), '..', 'static', report_data['report'].image_path)
    if os.path.exists(orig_path):
        img_row.append(Image(orig_path, width=2.8*inch, height=2.8*inch))
    
    # Heatmap
    if report_data['report'].heatmap_path:
        heat_path = os.path.join(os.path.abspath(os.path.dirname(__file__)), '..', 'static', report_data['report'].heatmap_path)
        if os.path.exists(heat_path):
            img_row.append(Image(heat_path, width=2.8*inch, height=2.8*inch))
    
    if img_row:
        img_table = Table([img_row], colWidths=[3*inch, 3*inch])
        story.append(img_table)
        story.append(Paragraph("Fig 1: Original X-Ray (Left) | Fig 2: Grad-CAM Heatmap Analysis (Right)", caption_style))
    
    story.append(Spacer(1, 0.4 * inch))

    # 5. Clinical Insights & Diet
    story.append(Paragraph("Medical Analysis & Recommendations", header_style))
    story.append(Paragraph(f"<b>AI Insight:</b> {report_data['medical_info']['ai_insight']}", body_style))
    story.append(Paragraph(f"<b>Clinical Description:</b> {report_data['medical_info']['description']}", body_style))
    
    story.append(Spacer(1, 0.2 * inch))
    story.append(Paragraph("<b>Recommended Diet Plan:</b>", body_style))
    diet_lines = report_data['medical_info']['diet'].split('\n')
    for line in diet_lines:
        if line.strip():
            story.append(Paragraph(line.strip(), body_style))

    # 6. Footer Disclaimer
    story.append(Spacer(1, 1 * inch))
    story.append(Paragraph("<hr/>", styles['Normal']))
    disclaimer = """
    <b>Disclaimer:</b> This report is generated by an Artificial Intelligence system (LungAI). 
    It is intended for clinical decision support and engineering demonstration purposes only. 
    Final diagnosis must be performed by a qualified medical professional. 
    AI systems may produce false positives or false negatives.
    """
    story.append(Paragraph(disclaimer, ParagraphStyle('Disclaimer', parent=body_style, fontSize=8, textColor=colors.grey, alignment=1)))

    doc.build(story)
    return output_path
