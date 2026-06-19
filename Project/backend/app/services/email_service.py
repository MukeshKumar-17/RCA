"""
Email Service — SendGrid
~~~~~~~~~~~~~~~~~~~~~~~~~
Sends RCA report emails with PDF attachment via SendGrid API.

Usage:
    from app.services.email_service import send_report_email

    success = await send_report_email(
        to_email="dev@company.com",
        message="Please review.",
        report=report_dict,
        incident_title="DB connection pool exhaustion"
    )
"""

import logging
import base64
import asyncio

from sendgrid import SendGridAPIClient
from sendgrid.helpers.mail import (
    Mail, Attachment, FileContent,
    FileName, FileType, Disposition,
)

from app.core.config import settings
from app.services.pdf_service import generate_pdf

logger = logging.getLogger("email_service")


async def send_report_email(
    to_email: str,
    message: str,
    report: dict,
    incident_title: str,
) -> bool:
    """Send an RCA report email with an attached PDF via SendGrid.

    Parameters
    ----------
    to_email : str
        Recipient email address.
    message : str
        Optional message from the sender.
    report : dict
        The incident/report dict used to generate the PDF.
    incident_title : str
        Title of the incident (used in subject line and filename).

    Returns
    -------
    bool
        True if the email was sent successfully, False otherwise.
    """
    try:
        # Step 1 — Generate PDF bytes
        pdf_bytes = await generate_pdf(report)

        # Step 2 — Build SendGrid Mail object
        mail = Mail(
            from_email=settings.EMAIL_FROM,
            to_emails=to_email,
            subject=f"RCA Report — {incident_title}",
            html_content=f"""
                <h2>RootLens AI — RCA Report</h2>
                <p><b>Incident:</b> {incident_title}</p>
                <p><b>Message from sender:</b></p>
                <p>{message or 'No additional message.'}</p>
                <p>Please find the full RCA report attached as a PDF.</p>
                <hr>
                <small>Sent via RootLens AI</small>
            """,
        )

        # Step 3 — Attach PDF
        encoded = base64.b64encode(pdf_bytes).decode()
        safe_title = "".join(c if c.isalnum() or c in " _-" else "_" for c in incident_title)
        attachment = Attachment(
            FileContent(encoded),
            FileName(f"RCA_{safe_title}.pdf"),
            FileType("application/pdf"),
            Disposition("attachment"),
        )
        mail.attachment = attachment

        # Step 4 — Send via SendGrid in executor (sync SDK)
        loop = asyncio.get_event_loop()

        def _send():
            sg = SendGridAPIClient(settings.SENDGRID_API_KEY)
            response = sg.send(mail)
            return response.status_code

        status_code = await loop.run_in_executor(None, _send)

        # Step 5 — Check result
        if status_code in (200, 201, 202):
            logger.info("Email sent to %s, status: %d", to_email, status_code)
            return True
        else:
            logger.error("SendGrid returned status: %d", status_code)
            return False

    except Exception as e:
        logger.error("Email send failed: %s", e)
        return False
