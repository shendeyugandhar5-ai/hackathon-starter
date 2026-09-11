"""Learning Graph Service — Personal, persistent, Obsidian-inspired student learning journey.

Two core responsibilities:
1. build_learning_graph(student_id): Generates the full graph (concepts, questions, agents,
   misconceptions, prerequisites, and chronological journey edges) for the interactive UI.
2. get_learner_graph_context(student_id): Extracts a concise, high-signal summary object
   consumed by the Coordinator and specialist AI agents for personalized pedagogical routing.
"""

import logging
from typing import Any, Dict, List, Optional
from sqlalchemy import text as sql_text
from sqlalchemy.exc import SQLAlchemyError

from app.database.session import engine

logger = logging.getLogger("learnos.learning_graph")

# Canonical Curriculum Knowledge Ontology (Global Structure)
CANONICAL_CONCEPTS: List[Dict[str, Any]] = [
    {
        "id": "conditional_probability",
        "name": "Conditional Probability",
        "subject": "maths",
        "category": "Foundational Maths",
        "default_score": 0.42,
        "default_state": "weak",
        "prerequisites": ["probability"],
        "unlocks": ["bayes_theorem", "naive_bayes"],
        "description": "Calculates the probability of event A occurring given that event B has already taken place.",
        "difficulty": "Intermediate",
    },
    {
        "id": "probability",
        "name": "Probability Foundations",
        "subject": "maths",
        "category": "Foundational Maths",
        "default_score": 0.42,
        "default_state": "weak",
        "prerequisites": ["set_theory"],
        "unlocks": ["conditional_probability"],
        "description": "Sample spaces, events, axiom of total probability, and independence.",
        "difficulty": "Foundational",
    },
    {
        "id": "linear_algebra",
        "name": "Linear Algebra & Vectors",
        "subject": "maths",
        "category": "Linear Algebra",
        "default_score": 0.61,
        "default_state": "learning",
        "prerequisites": [],
        "unlocks": ["gradient_descent", "pca"],
        "description": "Vector spaces, dot products, matrix transformations, and eigenvalues.",
        "difficulty": "Intermediate",
    },
    {
        "id": "bayes_theorem",
        "name": "Bayes' Theorem",
        "subject": "maths",
        "category": "Foundational Maths",
        "default_score": 0.68,
        "default_state": "learning",
        "prerequisites": ["conditional_probability"],
        "unlocks": ["naive_bayes", "mle_map"],
        "description": "Formal framework for updating prior beliefs given new observational evidence.",
        "difficulty": "Intermediate",
    },
    {
        "id": "naive_bayes",
        "name": "Naive Bayes Classifier",
        "subject": "aiml",
        "category": "Applied ML Models",
        "default_score": 0.35,
        "default_state": "weak",
        "prerequisites": ["conditional_probability", "bayes_theorem"],
        "unlocks": ["text_classification", "spam_filter"],
        "description": "Probabilistic classifier under feature conditional independence assumption.",
        "difficulty": "Applied",
    },
    {
        "id": "gradient_descent",
        "name": "Gradient Descent & Loss Surfaces",
        "subject": "aiml",
        "category": "Optimization Theory",
        "default_score": 0.58,
        "default_state": "learning",
        "prerequisites": ["linear_algebra"],
        "unlocks": ["neural_networks", "backpropagation"],
        "description": "Iterative first-order optimization navigating parameter loss landscapes.",
        "difficulty": "Applied",
    },
    {
        "id": "recursion",
        "name": "Recursion & Call Stacks",
        "subject": "dsa",
        "category": "Algorithmic Rigor",
        "default_score": 0.55,
        "default_state": "learning",
        "prerequisites": [],
        "unlocks": ["trees", "dynamic_programming"],
        "description": "Recursive subproblems, induction hypothesis, and call stack framing.",
        "difficulty": "Foundational",
    },
    {
        "id": "trees",
        "name": "Binary Trees & Traversals",
        "subject": "dsa",
        "category": "Hierarchical Structures",
        "default_score": 0.70,
        "default_state": "learning",
        "prerequisites": ["recursion"],
        "unlocks": ["bst", "trie", "graph_traversals"],
        "description": "Hierarchical node branching, BFS, DFS, in-order, and level-order traversals.",
        "difficulty": "Intermediate",
    },
    {
        "id": "dynamic_programming",
        "name": "Dynamic Programming (Memoization)",
        "subject": "dsa",
        "category": "Algorithmic Rigor",
        "default_score": 0.29,
        "default_state": "weak",
        "prerequisites": ["recursion"],
        "unlocks": ["knapsack", "edit_distance"],
        "description": "Optimal substructure and overlapping subproblems with memoization tables.",
        "difficulty": "Advanced",
    },
    {
        "id": "arrays",
        "name": "Arrays & Two Pointers",
        "subject": "dsa",
        "category": "Foundational DSA",
        "default_score": 0.81,
        "default_state": "mastered",
        "prerequisites": [],
        "unlocks": ["sliding_window", "binary_search"],
        "description": "Contiguous memory layout, two pointers, and prefix sum indexing.",
        "difficulty": "Foundational",
    },
    {
        "id": "sql_joins",
        "name": "SQL Joins & Relational Algebra",
        "subject": "dbms",
        "category": "Relational Engines",
        "default_score": 0.64,
        "default_state": "learning",
        "prerequisites": [],
        "unlocks": ["normalization", "query_optimization"],
        "description": "Inner, outer, cross joins, Cartesian products, and set operations.",
        "difficulty": "Foundational",
    },
    {
        "id": "normalization",
        "name": "Database Normalization (1NF to BCNF)",
        "subject": "dbms",
        "category": "Schema Design",
        "default_score": 0.47,
        "default_state": "weak",
        "prerequisites": ["sql_joins"],
        "unlocks": ["indexing", "transactions"],
        "description": "Functional dependencies, lossless decomposition, and redundancy elimination.",
        "difficulty": "Intermediate",
    },
]


def _query(sql: str, params: Dict[str, Any]) -> List[Dict[str, Any]]:
    try:
        with engine.connect() as conn:
            return [dict(r) for r in conn.execute(sql_text(sql), params).mappings().all()]
    except SQLAlchemyError as err:
        logger.debug(f"Learning graph DB query fallback: {err}")
        return []


def build_learning_graph(student_id: str) -> Dict[str, Any]:
    """Assembles the student's personal, interactive learning journey graph."""
    # 1. Fetch student data from database
    mastery_rows = _query(
        """
        SELECT subject, topic, score, state, attempts, updated_at
        FROM student_mastery WHERE student_id = :sid
        """,
        {"sid": student_id},
    )

    total_q_count = _query(
        "SELECT count(*) AS c FROM agent_routing_log WHERE student_id = :sid",
        {"sid": student_id},
    )
    total_questions_count = int(total_q_count[0]["c"]) if total_q_count and "c" in total_q_count[0] else 0

    routing_logs_desc = _query(
        """
        SELECT id, conversation_id, message, agent, confidence, routed_reason, created_at
        FROM agent_routing_log WHERE student_id = :sid
        ORDER BY created_at DESC LIMIT 50
        """,
        {"sid": student_id},
    )
    routing_logs = list(reversed(routing_logs_desc))

    mistake_rows = _query(
        """
        SELECT id, subject, topic, misconception_type, description, created_at
        FROM mistakes WHERE student_id = :sid
        ORDER BY created_at DESC LIMIT 10
        """,
        {"sid": student_id},
    )

    prereq_edges = _query(
        """
        SELECT topic_id, related_topic_id, relationship_type, weight
        FROM student_topic_edges WHERE student_id = :sid
        """,
        {"sid": student_id},
    )

    rec_rows = _query(
        """
        SELECT topic, reason, priority, done
        FROM recommendations WHERE student_id = :sid AND done = FALSE
        """,
        {"sid": student_id},
    )

    has_activity = bool(mastery_rows or routing_logs or mistake_rows)

    # 2. Build Concept Nodes (Merging Canonical Ontology with Student Mastery)
    mastery_map = {row["topic"]: row for row in mastery_rows}
    rec_map = {r["topic"]: r for r in rec_rows}

    nodes: List[Dict[str, Any]] = []
    edges: List[Dict[str, Any]] = []
    timeline: List[Dict[str, Any]] = []

    # Map for agent interaction aggregation
    agent_interactions: Dict[str, Dict[str, Any]] = {
        "dsa": {"count": 0, "concepts": set(), "last_used": None},
        "maths": {"count": 0, "concepts": set(), "last_used": None},
        "aiml": {"count": 0, "concepts": set(), "last_used": None},
        "dbms": {"count": 0, "concepts": set(), "last_used": None},
        "general": {"count": 0, "concepts": set(), "last_used": None},
    }

    # Count concept interaction frequencies from questions
    concept_interaction_counts: Dict[str, int] = {}
    for log in routing_logs:
        msg_lower = (log.get("message") or "").lower()
        ag = log.get("agent") or "general"
        if ag in agent_interactions:
            agent_interactions[ag]["count"] += 1
            agent_interactions[ag]["last_used"] = log.get("created_at")

        for c in CANONICAL_CONCEPTS:
            name_kw = c["name"].lower().split()[0]
            id_kw = c["id"].replace("_", " ")
            if id_kw in msg_lower or name_kw in msg_lower:
                concept_interaction_counts[c["id"]] = concept_interaction_counts.get(c["id"], 0) + 1
                if ag in agent_interactions:
                    agent_interactions[ag]["concepts"].add(c["name"])

    # A. Add Concept Nodes
    for c in CANONICAL_CONCEPTS:
        cid = c["id"]
        m = mastery_map.get(cid)
        score = round(m["score"] * 100) if m else round(c["default_score"] * 100)
        state = m["state"] if m else (c["default_state"] if has_activity else "new")
        attempts = m["attempts"] if m else 0
        rec = rec_map.get(cid)

        # Determine agent helpers for this concept
        concept_agents = [
            ag.upper()
            for ag, data in agent_interactions.items()
            if c["name"] in data["concepts"] or (ag == c["subject"])
        ]

        nodes.append({
            "id": cid,
            "label": c["name"],
            "node_type": "concept",
            "subject": c["subject"],
            "mastery": score,
            "state": state,
            "metadata": {
                "category": c["category"],
                "difficulty": c["difficulty"],
                "description": c["description"],
                "attempts": attempts,
                "interactions": concept_interaction_counts.get(cid, 1 if m else 0),
                "prerequisites": c["prerequisites"],
                "unlocks": c["unlocks"],
                "supporting_agents": concept_agents[:2] or [c["subject"].upper() + " Agent"],
                "recommendation": rec["reason"] if rec else None,
                "is_bottleneck": state == "weak" and len(c.get("unlocks", [])) > 0,
            },
        })

    # B. Add Prerequisite & Semantic Concept Edges
    seen_edges = set()
    for c in CANONICAL_CONCEPTS:
        src = c["id"]
        for target in c["unlocks"]:
            edge_key = f"{src}->{target}->prerequisite_of"
            if edge_key not in seen_edges:
                edges.append({
                    "id": f"e_prereq_{src}_{target}",
                    "source": src,
                    "target": target,
                    "edge_type": "prerequisite_of",
                    "label": "Gates",
                    "weight": 0.9,
                    "metadata": {"source_label": c["name"]},
                })
                seen_edges.add(edge_key)

    # Add custom database prerequisite edges if any
    for pe in prereq_edges:
        src = pe["topic_id"]
        tgt = pe["related_topic_id"]
        rel = pe["relationship_type"]
        edge_key = f"{src}->{tgt}->{rel}"
        if edge_key not in seen_edges:
            edges.append({
                "id": f"e_db_{src}_{tgt}",
                "source": src,
                "target": tgt,
                "edge_type": "prerequisite_of" if rel == "prerequisite_for" else "related_to",
                "label": "Gates" if rel == "prerequisite_for" else "Related",
                "weight": pe.get("weight", 1.0),
                "metadata": {},
            })
            seen_edges.add(edge_key)

    # C. Add Active Question Nodes (Aggregated from actual routing log)
    recent_questions = routing_logs[-8:] if routing_logs else []
    prev_q_id = None

    for idx, q in enumerate(recent_questions):
        raw_msg = q.get("message") or "How does this concept work?"
        short_label = raw_msg[:38] + ("..." if len(raw_msg) > 38 else "")
        q_id = f"q_{q.get('id') or idx}"
        agent_used = q.get("agent") or "coordinator"

        # Match relevant concept
        matched_concept = None
        for c in CANONICAL_CONCEPTS:
            if c["id"].replace("_", " ") in raw_msg.lower() or c["name"].lower().split()[0] in raw_msg.lower():
                matched_concept = c["id"]
                break
        if not matched_concept:
            # Fallback to subject default
            matched_concept = (
                "recursion" if agent_used == "dsa"
                else "conditional_probability" if agent_used == "maths"
                else "naive_bayes" if agent_used == "aiml"
                else "sql_joins" if agent_used == "dbms"
                else "conditional_probability"
            )

        nodes.append({
            "id": q_id,
            "label": f'"{short_label}"',
            "node_type": "question",
            "subject": agent_used,
            "metadata": {
                "full_text": raw_msg,
                "agent": agent_used,
                "confidence": q.get("confidence"),
                "routed_reason": q.get("routed_reason"),
                "timestamp": str(q.get("created_at") or "Recent"),
                "conversation_id": q.get("conversation_id"),
                "matched_concept": matched_concept,
            },
        })

        # Question -> Concept edge
        edges.append({
            "id": f"e_ask_{q_id}_{matched_concept}",
            "source": q_id,
            "target": matched_concept,
            "edge_type": "asked_about",
            "label": "Asked About",
            "weight": 0.8,
            "metadata": {},
        })

        # Question -> Agent edge
        agent_node_id = f"agent_{agent_used}"
        edges.append({
            "id": f"e_ans_{q_id}_{agent_node_id}",
            "source": q_id,
            "target": agent_node_id,
            "edge_type": "answered_by",
            "label": "Answered By",
            "weight": 0.7,
            "metadata": {},
        })

        # Temporal Journey Step Edge
        if prev_q_id:
            edges.append({
                "id": f"e_journey_{prev_q_id}_{q_id}",
                "source": prev_q_id,
                "target": q_id,
                "edge_type": "journey_step",
                "label": "Led to",
                "weight": 0.5,
                "metadata": {"temporal": True},
            })
        prev_q_id = q_id

        # Add to Timeline
        timeline.append({
            "id": f"tl_{q_id}",
            "timestamp": str(q.get("created_at") or "Recent"),
            "event_type": "question",
            "title": short_label,
            "description": q.get("routed_reason") or f"Routed to {agent_used.upper()} Agent.",
            "agent": agent_used,
            "subject": agent_used,
            "concept": matched_concept.replace("_", " "),
        })

    # D. Add Agent Nodes (Only agents that have been actively used)
    for ag_name, ag_data in agent_interactions.items():
        if ag_data["count"] > 0 or ag_name in ["dsa", "maths", "aiml", "dbms"]:
            agent_id = f"agent_{ag_name}"
            nodes.append({
                "id": agent_id,
                "label": f"{ag_name.upper()} Agent",
                "node_type": "agent",
                "subject": ag_name,
                "metadata": {
                    "agent": ag_name,
                    "interaction_count": ag_data["count"] or 1,
                    "last_used": str(ag_data["last_used"] or "Active"),
                    "top_concepts": list(ag_data["concepts"]) or [ag_name.upper() + " Foundations"],
                },
            })

            # Connect Agent to its primary subject concepts
            for c in CANONICAL_CONCEPTS:
                if c["subject"] == ag_name and (c["name"] in ag_data["concepts"] or ag_data["count"] > 0):
                    edge_key = f"{agent_id}->{c['id']}->supported"
                    if edge_key not in seen_edges:
                        edges.append({
                            "id": f"e_supp_{agent_id}_{c['id']}",
                            "source": agent_id,
                            "target": c["id"],
                            "edge_type": "supported",
                            "label": "Tutored",
                            "weight": 0.6,
                            "metadata": {},
                        })
                        seen_edges.add(edge_key)

    # E. Add Misconception Nodes (from mistakes table)
    for m in mistake_rows[:4]:
        misc_id = f"misc_{m.get('id') or m.get('topic')}"
        topic_target = m.get("topic") or "conditional_probability"
        m_type = (m.get("misconception_type") or "concept_confusion").replace("_", " ")

        nodes.append({
            "id": misc_id,
            "label": f"⚠ {m_type.title()}",
            "node_type": "misconception",
            "subject": m.get("subject") or "maths",
            "metadata": {
                "misconception_type": m.get("misconception_type"),
                "description": m.get("description") or f"Identified learning slip on {topic_target.replace('_', ' ')}.",
                "related_concept": topic_target,
                "severity": "high" if "error" in m_type or "fallacy" in m_type else "medium",
                "detected_at": str(m.get("created_at") or "Recent"),
            },
        })

        # Misconception -> Concept Edge
        edges.append({
            "id": f"e_aff_{misc_id}_{topic_target}",
            "source": misc_id,
            "target": topic_target,
            "edge_type": "affects",
            "label": "Blocks",
            "weight": 0.95,
            "metadata": {},
        })

    # 3. Calculate Summary Statistics
    concept_nodes = [n for n in nodes if n["node_type"] == "concept"]
    mastered = [n for n in concept_nodes if n.get("state") == "mastered" or (n.get("mastery") or 0) >= 80]
    weak = [n for n in concept_nodes if n.get("state") == "weak" or (n.get("mastery") or 0) < 50]
    learning = [n for n in concept_nodes if n.get("state") == "learning"]
    active_subjects = list({n.get("subject") for n in concept_nodes if n.get("subject")})
    agents_used = [n["label"] for n in nodes if n["node_type"] == "agent"]

    # Subject diversification score (0.0 to 1.0 based on cross-subject balance)
    diversification_score = round(min(1.0, len(active_subjects) / 4.0), 2)

    top_bottleneck = None
    if weak:
        top_bottleneck = next((n["label"] for n in weak if n["metadata"].get("is_bottleneck")), weak[0]["label"])

    summary = {
        "total_concepts": len(concept_nodes),
        "mastered_concepts": len(mastered),
        "learning_concepts": len(learning),
        "weak_concepts": len(weak),
        "subjects_covered": active_subjects,
        "agents_used": agents_used,
        "total_questions": total_questions_count if total_questions_count > 0 else len(recent_questions),
        "diversification_score": diversification_score,
        "top_bottleneck": top_bottleneck or "Conditional Probability",
    }

    return {
        "student_id": student_id,
        "nodes": nodes,
        "edges": edges,
        "summary": summary,
        "timeline": timeline,
        "is_empty": not has_activity and len(routing_logs) == 0,
    }


def get_learner_graph_context(student_id: str) -> Dict[str, Any]:
    """Extracts a high-signal graph summary for the Coordinator and AI agents."""
    graph_data = build_learning_graph(student_id)
    summary = graph_data.get("summary", {})
    nodes = graph_data.get("nodes", [])

    weak_nodes = [
        {"topic": n["label"], "subject": n.get("subject"), "score": n.get("mastery")}
        for n in nodes
        if n["node_type"] == "concept" and (n.get("state") == "weak" or (n.get("mastery") or 0) < 50)
    ]

    mastered_nodes = [
        n["label"]
        for n in nodes
        if n["node_type"] == "concept" and (n.get("state") == "mastered" or (n.get("mastery") or 0) >= 80)
    ]

    learning_path = [
        n["label"]
        for n in nodes
        if n["node_type"] == "concept"
    ][:6]

    recent_questions = [
        n["metadata"].get("full_text") or n["label"]
        for n in nodes
        if n["node_type"] == "question"
    ][-4:]

    return {
        "student_id": student_id,
        "weak_concepts": weak_nodes,
        "mastered_concepts": mastered_nodes,
        "recent_agents": summary.get("agents_used", []),
        "subjects_covered": summary.get("subjects_covered", []),
        "learning_path": learning_path,
        "recent_questions": recent_questions,
        "top_bottleneck": summary.get("top_bottleneck"),
        "diversification_score": summary.get("diversification_score", 0.75),
    }
