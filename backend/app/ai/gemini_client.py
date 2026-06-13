"""
RootLens AI — LLM Client (Google Gemini — Multi-Key Pool)
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
Round-robin key pool with automatic 429 fallback.

Exposes a single reusable ``gemini`` instance so every module can simply:

    from app.ai.gemini_client import gemini

    answer = await gemini.generate("Summarise this log …")
"""

import asyncio
import logging
from typing import AsyncGenerator

import google.generativeai as genai

from app.core.config import settings

logger = logging.getLogger("gemini_client")


class GeminiClientPool:
    """Round-robin Gemini API key pool with automatic 429 fallback.

    Collects all non-empty keys from GEMINI_API_KEY_1/2/3 and the
    legacy GEMINI_API_KEY field. Consecutive calls rotate through
    keys globally so parallel agent calls naturally spread load.
    """

    def __init__(self) -> None:
        # Build key pool from numbered keys first, then legacy fallback
        self.api_keys: list[str] = []
        for key in [
            settings.GEMINI_API_KEY_1,
            settings.GEMINI_API_KEY_2,
            settings.GEMINI_API_KEY_3,
        ]:
            if key and key.strip():
                self.api_keys.append(key.strip())

        # Include the legacy GEMINI_API_KEY if non-empty and not already present
        legacy = (settings.GEMINI_API_KEY or "").strip()
        if legacy and legacy not in self.api_keys:
            self.api_keys.append(legacy)

        if not self.api_keys:
            raise RuntimeError(
                "No Gemini API keys configured. Set at least GEMINI_API_KEY_1 in .env"
            )

        self.current_index = 0
        self.model = settings.GEMINI_MODEL

        logger.info(f"GeminiClientPool initialized with {len(self.api_keys)} key(s)")

    def _get_next_key(self) -> str:
        """Return the next key in round-robin order."""
        key = self.api_keys[self.current_index]
        self.current_index = (self.current_index + 1) % len(self.api_keys)
        return key

    async def generate(self, prompt: str) -> str:
        """Send *prompt* to Gemini with round-robin key rotation.

        Tries each key exactly once. On 429/quota errors, rotates to the
        next key. On any other error, raises immediately.
        """
        for attempt in range(len(self.api_keys)):
            key = self._get_next_key()
            try:
                genai.configure(api_key=key)
                model = genai.GenerativeModel(self.model)
                loop = asyncio.get_event_loop()
                response = await loop.run_in_executor(
                    None,
                    lambda: model.generate_content(prompt),
                )
                return response.text.strip()
            except Exception as e:
                err_str = str(e)
                if "429" in err_str or "quota" in err_str.lower():
                    logger.warning(
                        f"Key {attempt + 1}/{len(self.api_keys)} rate limited, "
                        f"trying next key..."
                    )
                    continue
                else:
                    logger.error(f"Gemini call failed on key {attempt + 1}: {e}")
                    raise

        logger.error("All Gemini API keys are rate limited (429)")
        raise RuntimeError(
            "All Gemini API keys exhausted. "
            "All keys are rate limited. Try again in 1 minute."
        )

    async def generate_stream(self, messages: list[dict]) -> AsyncGenerator[str, None]:
        """Stream chat completions token by token with key rotation.

        Parameters
        ----------
        messages : list[dict]
            OpenAI-compatible messages array (system, user, assistant).

        Yields
        ------
        str
            Individual content tokens from the LLM response.
        """
        # Convert OpenAI-style messages to a single Gemini prompt
        prompt_parts = []
        for msg in messages:
            role = msg.get("role", "user")
            content = msg.get("content", "")
            if role == "system":
                prompt_parts.append(f"SYSTEM INSTRUCTIONS:\n{content}")
            elif role == "assistant":
                prompt_parts.append(f"ASSISTANT:\n{content}")
            else:
                prompt_parts.append(f"USER:\n{content}")
        combined_prompt = "\n\n".join(prompt_parts)

        # Try each key for streaming
        for attempt in range(len(self.api_keys)):
            key = self._get_next_key()
            try:
                genai.configure(api_key=key)
                model = genai.GenerativeModel(self.model)
                loop = asyncio.get_event_loop()
                response = await loop.run_in_executor(
                    None,
                    lambda: model.generate_content(
                        combined_prompt,
                        stream=True,
                    ),
                )
                for chunk in response:
                    if chunk.text:
                        yield chunk.text
                return  # Success — exit after full stream
            except Exception as e:
                err_str = str(e)
                if "429" in err_str or "quota" in err_str.lower():
                    logger.warning(
                        f"Stream key {attempt + 1}/{len(self.api_keys)} rate limited, "
                        f"trying next key..."
                    )
                    continue
                else:
                    logger.error(f"Gemini stream failed on key {attempt + 1}: {e}")
                    yield f"\n\n[Error: Gemini streaming failed: {e}]"
                    return

        yield "\n\n[Error: All Gemini API keys are rate limited. Try again in 1 minute.]"

    async def generate_json(self, prompt: str) -> str:
        """Convenience wrapper that appends a JSON-output instruction.

        Uses the same round-robin key rotation as ``generate()``.
        """
        json_prompt = (
            f"{prompt}\n\n"
            "Respond only with valid JSON. No markdown, no explanation, no code fences."
        )

        for attempt in range(len(self.api_keys)):
            key = self._get_next_key()
            try:
                genai.configure(api_key=key)
                model = genai.GenerativeModel(self.model)
                loop = asyncio.get_event_loop()
                response = await loop.run_in_executor(
                    None,
                    lambda: model.generate_content(
                        json_prompt,
                        generation_config=genai.types.GenerationConfig(
                            temperature=0.3,
                            max_output_tokens=8192,
                            response_mime_type="application/json",
                        ),
                    ),
                )
                return response.text.strip()
            except Exception as e:
                err_str = str(e)
                if "429" in err_str or "quota" in err_str.lower():
                    logger.warning(
                        f"JSON key {attempt + 1}/{len(self.api_keys)} rate limited, "
                        f"trying next key..."
                    )
                    continue
                else:
                    logger.error(f"Gemini JSON call failed on key {attempt + 1}: {e}")
                    raise

        logger.error("All Gemini API keys are rate limited (429) for JSON call")
        raise RuntimeError(
            "All Gemini API keys exhausted. "
            "All keys are rate limited. Try again in 1 minute."
        )


# ── Singleton instance ──────────────────────────────────────────────────
gemini = GeminiClientPool()
