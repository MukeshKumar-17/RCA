"""
ai package — public API
~~~~~~~~~~~~~~~~~~~~~~~
    from app.ai import gemini
    result = await gemini.generate("…")
"""

from app.ai.gemini_client import GeminiClient, gemini  # noqa: F401
