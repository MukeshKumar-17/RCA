"""
RootLens AI — LLM Client (Using OpenRouter)
~~~~~~~~~~~~~~~~~~~~~~~~~~~~
Async wrapper around the standard OpenAI SDK configured for OpenRouter.

Exposes a single reusable ``gemini`` instance (kept name for compatibility) 
so every module can simply:

    from app.ai.gemini_client import gemini

    answer = await gemini.generate("Summarise this log …")
"""

from openai import AsyncOpenAI

from app.core.config import settings


class GeminiClient:
    """Thin async façade over the OpenAI SDK for OpenRouter.

    Parameters are loaded once from :pydata:`app.core.config.settings`.
    """

    def __init__(self) -> None:
        self.client = AsyncOpenAI(
            base_url="https://openrouter.ai/api/v1",
            api_key=settings.OPENROUTER_API_KEY,
            max_retries=0,
            default_headers={"HTTP-Referer": "https://yzb8iiq6.insforge.site", "X-Title": "RootLens AI"}
        )
        self.model_name = settings.LLM_MODEL

    async def generate(self, prompt: str) -> str:
        """Send *prompt* to OpenRouter and return the text response."""
        models_to_try = [
            self.model_name,
            "google/gemini-2.0-pro-exp-02-05:free",
            "qwen/qwen-2.5-coder-32b-instruct:free",
            "meta-llama/llama-3.1-8b-instruct:free",
            "mistralai/mistral-7b-instruct:free",
            "huggingfaceh4/zephyr-7b-beta:free"
        ]
        
        last_error = None
        for model in models_to_try:
            try:
                response = await self.client.chat.completions.create(
                    model=model,
                    messages=[{"role": "user", "content": prompt}],
                    temperature=0.3,
                    max_tokens=8192,
                )
                if response.choices and response.choices[0].message.content:
                    return response.choices[0].message.content
            except Exception as exc:
                import logging
                logging.getLogger(__name__).warning("OpenRouter model %s failed: %s. Trying fallback.", model, exc)
                last_error = exc
                continue

        raise RuntimeError(f"All OpenRouter models failed. Last error: {last_error}")

    async def generate_stream(self, messages: list[dict]) -> "AsyncGenerator[str, None]":
        """Stream chat completions token by token.

        Parameters
        ----------
        messages : list[dict]
            OpenAI-compatible messages array (system, user, assistant).

        Yields
        ------
        str
            Individual content tokens from the LLM response.
        """
        models_to_try = [
            self.model_name,
            "google/gemini-2.0-pro-exp-02-05:free",
            "qwen/qwen-2.5-coder-32b-instruct:free",
            "meta-llama/llama-3.1-8b-instruct:free",
        ]

        last_error = None
        for model in models_to_try:
            try:
                stream = await self.client.chat.completions.create(
                    model=model,
                    messages=messages,
                    temperature=0.3,
                    max_tokens=4096,
                    stream=True,
                )
                async for chunk in stream:
                    if chunk.choices and chunk.choices[0].delta.content:
                        yield chunk.choices[0].delta.content
                return  # Success — exit after full stream
            except Exception as exc:
                import logging
                logging.getLogger(__name__).warning(
                    "OpenRouter stream model %s failed: %s. Trying fallback.", model, exc
                )
                last_error = exc
                continue

        # All models failed — yield an error message
        yield f"\n\n[Error: All LLM models failed. Last error: {last_error}]"

    async def generate_json(self, prompt: str) -> str:
        """Convenience wrapper that appends a JSON-output instruction."""
        json_prompt = (
            f"{prompt}\n\n"
            "IMPORTANT: Respond ONLY with valid JSON. "
            "Do not include markdown fences or any surrounding text."
        )
        models_to_try = [
            self.model_name,
            "google/gemini-2.0-pro-exp-02-05:free",
            "qwen/qwen-2.5-coder-32b-instruct:free",
            "meta-llama/llama-3.1-8b-instruct:free",
            "mistralai/mistral-7b-instruct:free",
            "huggingfaceh4/zephyr-7b-beta:free"
        ]
        
        last_error = None
        for model in models_to_try:
            try:
                response = await self.client.chat.completions.create(
                    model=model,
                    messages=[{"role": "user", "content": json_prompt}],
                    temperature=0.3,
                    max_tokens=8192,
                    response_format={"type": "json_object"}
                )
                if response.choices and response.choices[0].message.content:
                    return response.choices[0].message.content
            except Exception as exc:
                import logging
                logging.getLogger(__name__).warning("OpenRouter JSON model %s failed: %s. Trying fallback.", model, exc)
                last_error = exc
                continue

        raise RuntimeError(f"All OpenRouter JSON models failed. Last error: {last_error}")


# ── Singleton instance ──────────────────────────────────────────────────
gemini = GeminiClient()
