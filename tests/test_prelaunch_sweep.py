"""Regression tests from pre-launch sweep (auth webhooks, reflection dedupe)."""

from __future__ import annotations


def test_reflection_session_claim_idempotent():
    from anjo.dashboard.background_tasks import reflection_session_claim

    sid = "sess-claim-test"
    assert reflection_session_claim(sid) is True
    assert reflection_session_claim(sid) is False


def test_coerce_llm_bool_string_false():
    from anjo.graph.nodes import _coerce_llm_bool

    assert _coerce_llm_bool("false", True) is False
    assert _coerce_llm_bool("true", False) is True
    assert _coerce_llm_bool(False, True) is False
