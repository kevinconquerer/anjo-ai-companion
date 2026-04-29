"""Conditional edge functions for the Anjo conversation graph.

NOTE: route_memory is only used by the legacy classify_node path in the CLI/test
graph (build_graph). The production graph uses gate_node with _route_after_gate
defined in conversation_graph.py.
"""

from __future__ import annotations

from anjo.graph.state import AnjoState


def route_memory(state: AnjoState) -> str:
    """After classify_node: go to retrieve_node or skip straight to appraise_node.

    Only used by the CLI/test graph (build_graph). The production SSE path uses
    gate_node with _route_after_gate in conversation_graph.py instead.
    """
    return "retrieve" if state.should_retrieve else "appraise"
