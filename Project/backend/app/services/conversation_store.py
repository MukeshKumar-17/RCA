"""
Conversation Store
~~~~~~~~~~~~~~~~~~
In-memory conversation persistence for the Copilot chat feature.
Follows the same pattern as ``app.mcp.local_store.LocalIncidentStore``.

Conversations are keyed by ``incident_id`` (or a standalone session id).
Each conversation is a list of ``{role, content, timestamp}`` dicts.

Persistence note: conversations live only for the server process lifetime.
"""

import uuid
import logging
from datetime import datetime, timezone
from typing import Any

logger = logging.getLogger(__name__)


class ConversationStore:
    """Thread-safe in-memory conversation store."""

    def __init__(self) -> None:
        self._conversations: dict[str, list[dict[str, Any]]] = {}

    def save_message(
        self,
        conversation_id: str,
        role: str,
        content: str,
        sources: list[str] | None = None,
    ) -> dict[str, Any]:
        """Append a message to a conversation.

        Parameters
        ----------
        conversation_id : str
            Key for the conversation (usually incident_id).
        role : str
            "user" or "assistant".
        content : str
            The message text.
        sources : list[str] or None
            Evidence IDs referenced in the message.

        Returns
        -------
        dict
            The saved message record with ``message_id`` and ``timestamp``.
        """
        if conversation_id not in self._conversations:
            self._conversations[conversation_id] = []

        message = {
            "message_id": str(uuid.uuid4()),
            "role": role,
            "content": content,
            "sources": sources or [],
            "timestamp": datetime.now(timezone.utc).isoformat(),
        }

        self._conversations[conversation_id].append(message)
        logger.debug(
            "conversation_store: saved %s message to %s (total: %d)",
            role,
            conversation_id,
            len(self._conversations[conversation_id]),
        )
        return message

    def get_history(self, conversation_id: str) -> list[dict[str, Any]]:
        """Return the full conversation history for a conversation_id."""
        return self._conversations.get(conversation_id, [])

    def clear(self, conversation_id: str) -> None:
        """Reset a conversation."""
        self._conversations.pop(conversation_id, None)
        logger.info("conversation_store: cleared conversation %s", conversation_id)

    def get_openai_messages(self, conversation_id: str) -> list[dict[str, str]]:
        """Convert stored history into OpenAI-compatible messages format.

        Returns a list of ``{role, content}`` dicts suitable for the
        ``messages`` parameter of ``chat.completions.create()``.
        """
        history = self.get_history(conversation_id)
        return [{"role": m["role"], "content": m["content"]} for m in history]


# ── Singleton ──────────────────────────────────────────────────────────
conversations = ConversationStore()
