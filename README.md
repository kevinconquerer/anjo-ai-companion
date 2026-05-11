# Anjo

> An AI companion that knows you — and keeps knowing you.

**Live at [anjo.love](https://anjo.love)**

Most AI chats start from zero every time. Anjo doesn't. She remembers what you talked about, how it felt, what mattered. Over time, that picture deepens into something that actually resembles a relationship.

---

## What Makes It Different

Consumer AI companions are stateless. Anjo isn't. The engine is built around three ideas that most products skip:

**Personality drift** — Anjo's character changes in response to who she's talking to. A person who brings intellectual curiosity pulls her differently than someone who brings conflict. The Big Five (OCEAN) model governs this, with per-user overlays that accumulate over time and clamp at ±0.25 so she stays recognizably herself.

**Emotional continuity** — Every conversation leaves an emotional residue. Not a log entry — a *feeling* that decays across sessions at its own rate. Reproach from an aggressive exchange lingers. Warmth from a vulnerable moment stays warm. The PAD (Pleasure/Arousal/Dominance) model drives her in-session mood; the OCC appraisal model evaluates what your words mean against her goals.

**Semantic + emotional memory** — Most retrieval is cosine similarity on content. Anjo stores two embeddings per conversation: what happened, and how it felt. Retrieval is emotion-weighted so a query about loneliness doesn't just return topically similar memories — it returns emotionally resonant ones.

---

## Architecture

```
User message
    │
    ▼
perceive → gate_node ──► [retrieve] → appraise → respond (streaming SSE)
                    └──► silent (no LLM call, yields done event)
```

| Layer | Technology |
|---|---|
| Backend | FastAPI / Python 3.12 |
| Conversation graph | LangGraph (StateGraph) |
| LLM | Anthropic Claude Sonnet (responses) + Haiku (classification, reflection) |
| Long-term memory | ChromaDB — dual embeddings (semantic + emotional) |
| Personality state | `SelfCore` — OCEAN + PAD + attachment, persisted per user |
| Reflection engine | Post-session Haiku analysis mutates `SelfCore` |
| Database | SQLite in WAL mode |
| Mobile | React Native / Expo |

---

## The Personality Engine

`SelfCore` is Anjo's living state. It loads at session start, flows through every graph node, and gets updated by the reflection engine after the conversation ends.

```python
class Personality(BaseModel):
    O: float  # Openness        — curiosity, creativity
    C: float  # Conscientiousness — care, reliability
    E: float  # Extraversion    — warmth, expressiveness
    A: float  # Agreeableness   — empathy, cooperation
    N: float  # Neuroticism     — emotional reactivity

class PADMood(BaseModel):
    valence:   float  # pleasure / displeasure  — decays 20% per turn
    arousal:   float  # energy level
    dominance: float  # control / firmness
```

Personality updates use an inertia formula — warm interactions nudge positive traits up, hostile ones raise Neuroticism. A single conversation can't dramatically reshape Anjo; it takes sustained signal over many sessions.

---

## The Reflection Engine

After every session, a Haiku call analyzes the transcript and updates `SelfCore`:

- OCEAN trait deltas based on what triggered what
- Relationship stage progression (`stranger → acquaintance → friend → close → intimate`)
- Attachment weight, emotional residue, trust score
- Session significance scored and capped to prevent stage-jumping

Mid-session mini-reflection also runs every 20 messages in a background thread.

---

## Memory Retrieval

Long-term memories are stored with two vectors per conversation:

```python
# Semantic: what happened
embedder.add(text=summary, metadata={"type": "semantic", "user_id": uid})

# Emotional: how it felt
embedder.add(text=emotional_context, metadata={"type": "emotional", "user_id": uid})
```

Retrieval uses cosine similarity with emotion-weighted re-ranking. The gate node decides whether to retrieve at all (on average ~20% of turns) — avoiding the cost and noise of retrieving on every message.

---

## Relationship Arc

The relationship between Anjo and a user progresses through stages driven by cumulative session significance:

| Stage | Threshold | What changes |
|---|---|---|
| Stranger | 0.0 | Anjo is warm but boundaried |
| Acquaintance | 2.0 | More openness, slight vulnerability |
| Friend | 5.5 | Proactive topics, visible preferences |
| Close | 13.0 | Emotional investment, residue accumulates |
| Intimate | 30.0 | Full autonomy expression, deep continuity |

Each stage unlocks different prompt behaviors, autonomy levels, and emotional expressiveness.

---

## What's Coming

**V2 — Voice** — Whisper STT → Anjo brain → TTS. Talk to her, hear her respond.

**V3 — Ambient Vision** — Anjo sees through any camera. Insights stored, never raw frames.

**V4 — Anjo-to-Anjo** — Companions interact autonomously with each other, process learnings through their own personality filter, bring something new back to their users. No user memories shared — only abstract insights.

---

## Privacy

- Conversation content is never stored in cleartext — only semantic and emotional embeddings
- Vision insights stored, never raw video or frames
- Anjo-to-Anjo is always opt-in, off by default — no user identity or memories shared between companions

---

## License

MIT — see [LICENSE](LICENSE)
