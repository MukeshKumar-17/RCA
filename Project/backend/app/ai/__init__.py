"""
ai package — public API
~~~~~~~~~~~~~~~~~~~~~~~
    from app.ai import gemini
    result = await gemini.generate("…")
"""

from app.ai.gemini_client import GeminiClientPool, gemini  # noqa: F401
GeminiClient = GeminiClientPool  # backward compat alias

