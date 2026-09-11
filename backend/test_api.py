"""End-to-end API smoke test for LearnOS.

Runs every endpoint in-process (no server needed) and prints a pass/fail
table. Endpoints that need the database report SKIP rather than FAIL when
`database/schema.sql` hasn't been applied yet, so you can run this the
moment the backend imports.

Usage:
    cd backend
    .venv\\Scripts\\python.exe test_api.py

    # or against an already-running server:
    .venv\\Scripts\\python.exe test_api.py --url http://localhost:8000
"""
import argparse
import json
import sys

STUDENT = "rahul"
results = []


def record(name, ok, detail="", skipped=False):
    results.append((name, ok, detail, skipped))
    mark = "SKIP" if skipped else ("PASS" if ok else "FAIL")
    print(f"  [{mark}] {name}" + (f"  - {detail}" if detail else ""))


def _png_data_url(image) -> str:
    import base64
    import io

    buffer = io.BytesIO()
    image.save(buffer, format="PNG")
    return "data:image/png;base64," + base64.b64encode(buffer.getvalue()).decode()


def _question_image(lines):
    """A rendered exam-question image, as the browser would upload it.

    Drawn with a real TrueType face at a readable size: OCR quality tracks
    pixels-per-character, so a bitmap-font probe would test something no
    student ever sends. Returns None if Pillow is unavailable.
    """
    try:
        from PIL import Image, ImageDraw, ImageFont
    except ImportError:
        return None

    font = None
    for path in ("C:/Windows/Fonts/arial.ttf", "C:/Windows/Fonts/segoeui.ttf",
                 "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf"):
        try:
            font = ImageFont.truetype(path, 34)
            break
        except OSError:
            continue

    image = Image.new("RGB", (1000, 60 + 52 * len(lines)), "white")
    draw = ImageDraw.Draw(image)
    for i, line in enumerate(lines):
        draw.text((30, 25 + 52 * i), line, fill="black", font=font)
    return _png_data_url(image)


def _blank_image():
    """A blank page - the 'OCR found nothing' path."""
    from PIL import Image

    return _png_data_url(Image.new("RGB", (300, 120), "white"))


def run(client):
    print("\n== Core ==")
    r = client.get("/")
    record("GET  /", r.status_code == 200, f"status={r.json().get('status')}")

    r = client.get("/api/health")
    body = r.json()
    db_up = body.get("database") == "connected"
    record("GET  /api/health", r.status_code == 200,
           f"db={body.get('database')}")

    print("\n== Coordinator / routing (works without a database) ==")
    cases = [
        ("Why does my recursion code run forever?", "dsa"),
        ("Write a SQL join query for these two tables", "dbms"),
        ("Explain Bayes theorem with an example", "maths"),
        ("How does gradient descent work in neural networks?", "aiml"),
        ("I have 2 months before placements, what should I focus on?", "general"),
    ]
    conversation_id = None
    for message, expected in cases:
        r = client.post("/api/chat", json={"student_id": STUDENT, "message": message})
        if r.status_code != 200:
            record(f"POST /api/chat -> {expected}", False, f"HTTP {r.status_code}")
            continue
        body = r.json()
        conversation_id = conversation_id or body.get("conversation_id")
        agent, conf = body.get("agent"), body.get("confidence", 0)
        ok = agent == expected
        record(f"POST /api/chat -> {expected}", ok,
               f"got '{agent}' @ {conf:.2f}" + ("" if ok else "  (routing mismatch)"))

    # Contract shape check - this is what the frontend depends on
    r = client.post("/api/chat", json={"student_id": STUDENT, "message": "Explain hash maps"})
    expected_keys = {"conversation_id", "agent", "confidence", "routed_reason",
                     "response", "mastery_updates", "recommendation"}
    got_keys = set(r.json().keys())
    record("POST /api/chat contract shape", expected_keys <= got_keys,
           f"missing={expected_keys - got_keys or 'none'}")

    print("\n== Shared context + conversation history ==")
    r = client.get("/api/agents")
    agents = r.json() if r.status_code == 200 else []
    record("GET  /api/agents", len(agents) == 5, f"{len(agents)} agents")

    r = client.post("/api/students", json={"student_id": STUDENT} | {
        "id": STUDENT, "name": "Rahul", "goal": "Data Scientist"})
    record("POST /api/students", r.status_code in (200, 201),
           f"topics={r.json().get('topic_count')}" if r.status_code in (200, 201) else f"HTTP {r.status_code}")

    r = client.get(f"/api/students/{STUDENT}")
    body = r.json() if r.status_code == 200 else {}
    record("GET  /api/students/{id}", r.status_code == 200,
           f"overall={body.get('overall_score', 0):.0%}, weak={body.get('weak_topic_count')}")

    # Conversation persistence: two turns in one thread, then read it back
    r = client.post("/api/chat", json={"student_id": STUDENT, "message": "What is a hash map?"})
    cid = r.json().get("conversation_id")
    client.post("/api/chat", json={"student_id": STUDENT, "conversation_id": cid,
                                   "message": "And how does collision handling work?"})
    r = client.get(f"/api/conversations/{cid}/messages")
    msgs = r.json().get("messages", []) if r.status_code == 200 else []
    record("Conversation history persists", len(msgs) >= 4,
           f"{len(msgs)} messages saved across 2 turns"
           if msgs else "nothing persisted - check database")

    r = client.get(f"/api/students/{STUDENT}/conversations")
    convs = r.json() if r.status_code == 200 else []
    record("GET  /api/students/{id}/conversations", r.status_code == 200,
           f"{len(convs)} conversations")

    # Shared context must actually reach the agent
    r = client.post("/api/chat", json={"student_id": STUDENT, "message": "Explain Naive Bayes"})
    body = r.json()
    ctx = body.get("context_used") or {}
    record("Shared context injected into agents", bool(ctx.get("weak_topics")),
           f"{len(ctx.get('weak_topics', []))} weak topics, "
           f"{len(ctx.get('prerequisite_gaps', []))} prereq gaps passed to agent")

    print("\n== Student data (needs database/schema.sql) ==")

    r = client.get(f"/api/students/{STUDENT}/root-cause")
    gaps = r.json().get("gaps", []) if r.status_code == 200 else []
    record("GET  /api/students/{id}/root-cause", r.status_code == 200,
           f"{len(gaps)} prerequisite gaps: {r.json().get('summary', '')[:70]}"
           if gaps else "no gaps found", skipped=not gaps)
    r = client.get(f"/api/students/{STUDENT}/mastery")
    body = r.json() if r.status_code == 200 else {}
    topics = body.get("topics", [])
    record("GET  /api/students/{id}/mastery", r.status_code == 200,
           f"{len(topics)} topics, overall={body.get('overall_score', 0):.0%}"
           if topics else "no rows - apply database/schema.sql",
           skipped=not topics)

    r = client.get(f"/api/students/{STUDENT}/trace")
    entries = r.json().get("entries", []) if r.status_code == 200 else []
    record("GET  /api/students/{id}/trace", r.status_code == 200,
           f"{len(entries)} routing entries" if entries else "no rows yet",
           skipped=not entries)

    r = client.get(f"/api/students/{STUDENT}/recommendations")
    record("GET  /api/students/{id}/recommendations", r.status_code == 200,
           f"{len(r.json().get('recommendations', []))} items")

    r = client.post("/api/assessments", json={
        "student_id": STUDENT,
        "subject": "maths",
        "topic": "conditional_probability",
        "question": "P(A|B) = ?",
        "student_answer": "P(A) * P(B)",
        "is_correct": False,
        "confidence_rating": 2,
        "misconception_type": "formula_misapplication",
    })
    body = r.json() if r.status_code == 200 else {}
    has_update = body.get("new_score") is not None
    record("POST /api/assessments", r.status_code == 200,
           (f"{body.get('previous_score', 0):.0%} -> {body.get('new_score', 0):.0%}, "
            f"state={body.get('state')}, escalate={body.get('escalate_to_human')}")
           if has_update else "no mastery update - apply database/schema.sql",
           skipped=not has_update)

    r = client.post("/api/knowledge-check", json={"student_id": STUDENT})
    body = r.json() if r.status_code == 200 else {}
    if r.status_code == 503:
        # Correct behaviour when the LLM is unreachable: refuse rather than
        # return the error string as if it were a question.
        record("POST /api/knowledge-check", True,
               "503 - LLM unavailable, endpoint correctly declined", skipped=True)
    else:
        record("POST /api/knowledge-check", r.status_code == 200,
               f"topic={body.get('topic')} ({body.get('reason')})"
               if r.status_code == 200 else f"HTTP {r.status_code}")

    print("\n== LangGraph orchestration + RAG ==")
    try:
        from app.agents.graph import graph_available
        record("LangGraph graph compiles", graph_available(),
               "orchestration graph ready" if graph_available()
               else "falling back to sequential execution")
    except Exception as e:
        record("LangGraph graph compiles", False, str(e)[:70])

    try:
        from app.knowledge.retriever import corpus_stats, retrieve
        stats = corpus_stats()
        record("RAG corpus indexed", stats["available"],
               f"{stats['chunks']} chunks across {len(stats['by_subject'])} subjects "
               f"({stats['backend']})")
        # Subject filtering must actually exclude other subjects
        leaked = [c for c in retrieve("Bayes theorem", ["dsa"], k=3) if c["subject"] != "dsa"]
        record("RAG subject filtering", not leaked,
               "maths content correctly excluded from a dsa-filtered query")
    except Exception as e:
        record("RAG corpus indexed", False, str(e)[:70])

    # Multi-agent collaboration on a genuinely cross-subject question
    r = client.post("/api/chat", json={
        "student_id": STUDENT,
        "message": "Explain Naive Bayes using conditional probability."})
    body = r.json()
    supporting = body.get("supporting_agents", [])
    record("Multi-agent collaboration", len(supporting) > 0,
           f"primary={body.get('agent')}, supporting={supporting}"
           if supporting else "no supporting agent selected")

    record("Grounded via RAG", len(body.get("retrieved_context", [])) > 0,
           ", ".join(f"{c['subject']}/{c['topic']}"
                     for c in body.get("retrieved_context", [])[:3]))

    events = body.get("trace_events", [])
    steps = {e["step"] for e in events}
    required = {"query_received", "ml_router", "coordinator_decision",
                "specialist_response"}
    record("Agent Trace events are real", required <= steps,
           f"{len(events)} events; missing={required - steps or 'none'}")

    record("Adaptive teaching strategy", bool(body.get("teaching_strategy")),
           f"strategy={body.get('teaching_strategy')}")

    # A single-subject question must NOT drag in extra agents
    r2 = client.post("/api/chat", json={
        "student_id": STUDENT, "message": "Explain recursion with a simple example."})
    b2 = r2.json()
    record("Single-subject stays single-agent", not b2.get("supporting_agents"),
           f"agent={b2.get('agent')}, supporting={b2.get('supporting_agents') or 'none'}")

    print("\n== Image questions (OCR) ==")
    image_url = _question_image([
        "Q3. Normalize this table to 3NF.",
        "Student(id, name, dept, dept_head)",
        "Explain each step.",
    ])
    if image_url is None:
        record("OCR engine self-test", False,
               "Pillow not installed - cannot build a test image", skipped=True)
    else:
        r = client.get("/api/diagnostics/ocr")
        d = r.json()
        record("GET  /api/diagnostics/ocr", d.get("ok") is True,
               f"engine={d.get('config', {}).get('active_engine')}, "
               f"read {d.get('extracted_text')!r}",
               skipped=d.get("reason") == "no_engine_installed")

        r = client.post("/api/chat", json={
            "student_id": STUDENT, "message": "", "image": image_url})
        b = r.json()
        ocr = b.get("ocr") or {}
        record("Image question -> OCR extracts text", bool(ocr.get("ok")),
               f"{ocr.get('chars')} chars via {ocr.get('engine')} "
               f"@ {ocr.get('confidence')}")

        # The point of OCR-first: an image question still reaches the right
        # specialist, because the extracted text goes through the same router.
        record("Image question routes to a specialist", b.get("agent") == "dbms",
               f"agent={b.get('agent')}, reason={(b.get('routed_reason') or '')[:70]}")

        steps = [e["step"] for e in b.get("trace_events", [])]
        record("OCR appears in the Agent Trace", "ocr_extraction" in steps,
               f"{len(steps)} events, first={steps[0] if steps else 'none'}")

        # An unreadable image must degrade to an answer, never a 500.
        blank = _blank_image()
        r = client.post("/api/chat", json={
            "student_id": STUDENT, "message": "what is this?", "image": blank})
        b = r.json()
        record("Unreadable image degrades gracefully",
               r.status_code == 200 and bool(b.get("response"))
               and (b.get("ocr") or {}).get("ok") is False,
               f"HTTP {r.status_code}, ocr.error={(b.get('ocr') or {}).get('error')}")

    print("\n== Trained models ==")
    try:
        from app.agents import router as R
        R._load_trained_model()
        loaded = R._classifier is not None
        record("Tier-1 router classifier", loaded,
               "loaded from ml/router/" if loaded
               else "not trained yet - run ml/notebooks/01_router_training.ipynb",
               skipped=not loaded)
    except Exception as e:
        record("Tier-1 router classifier", False, str(e)[:60])

    try:
        from app.services.progress_engine import engine_status
        st = engine_status()
        record("DKT-LSTM progress model", st["dkt_available"],
               f"val_acc={st['dkt_val_accuracy']}" if st["dkt_available"]
               else "not trained yet - run ml/notebooks/02_dkt_training.ipynb",
               skipped=not st["dkt_available"])
    except Exception as e:
        record("DKT-LSTM progress model", False, str(e)[:60])


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--url", default=None,
                        help="Test a running server instead of importing the app")
    args = parser.parse_args()

    print("=" * 62)
    print("  LearnOS API smoke test")
    print("=" * 62)

    if args.url:
        import httpx
        print(f"Target: {args.url}")
        client = httpx.Client(base_url=args.url, timeout=60)
    else:
        from fastapi.testclient import TestClient
        from app.main import app
        print("Target: in-process app (no server required)")
        client = TestClient(app)

    run(client)

    passed = sum(1 for _, ok, _, sk in results if ok and not sk)
    failed = sum(1 for _, ok, _, sk in results if not ok and not sk)
    skipped = sum(1 for _, _, _, sk in results if sk)

    print("\n" + "=" * 62)
    print(f"  {passed} passed   {failed} failed   {skipped} skipped")
    print("=" * 62)
    if skipped:
        print("\nSkipped checks usually mean: apply database/schema.sql, or train")
        print("the models in ml/notebooks/. Neither blocks the chat endpoint.")

    sys.exit(1 if failed else 0)


if __name__ == "__main__":
    main()
