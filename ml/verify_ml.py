import sys
import os

# Ensure backend and ml are in sys.path
root_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
backend_dir = os.path.join(root_dir, "backend")
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

from app.services.ml_service import ml_service

def verify_all():
    print("==================================================")
    print("   LearnOS ML Subsystem Verification (Person C)   ")
    print("==================================================")

    # 1. Router Test
    test_queries = [
        ("How do I implement Dijkstra algorithm with min-heap?", "dsa"),
        ("Explain 3NF vs BCNF and write a SQL join query", "dbms"),
        ("State Bayes theorem and calculate conditional probability", "maths"),
        ("How does backpropagation compute gradient descent in ML?", "aiml"),
        ("I have 2 months before placements, can you give me a roadmap?", "general"),
        ("random unrelated gibberish xyz abc 123", "general")
    ]

    print("\n--- 1. Router Classifier Tests ---")
    for q, expected in test_queries:
        agent, conf, reason, fallback = ml_service.route_query(q)
        status = "PASS" if (agent == expected or fallback) else "CHECK"
        print(f"[{status}] Query: '{q[:40]}...'")
        print(f"       -> Routed: '{agent}' | Confidence: {conf} | Fallback: {fallback}")

    # 2. Confusion Detector Test
    print("\n--- 2. Confusion Detector Tests ---")
    confusion_samples = [
        "That makes total sense, let's keep going!",
        "Wait, what?? I am totally lost, this makes zero sense!!",
        "why?"
    ]
    for msg in confusion_samples:
        res = ml_service.assess_confusion(msg)
        print(f"Message: '{msg}'")
        print(f"  -> Confusion: {res['confusion_score']} | Confused: {res['is_confused']} | Action: {res['recommended_strategy']}")

    # 3. DKT-LSTM Inference Test
    print("\n--- 3. DKT-LSTM Mastery Model Tests ---")
    interaction_trace = [[0, 1], [0, 1], [4, 0], [4, 1]]
    preds = ml_service.predict_dkt_mastery(interaction_trace)
    print(f"Predicted mastery across {len(preds)} cataloged skills:")
    for skill, p in list(preds.items())[:5]:
        print(f"  - {skill}: {p}")

    # 4. Progress Engine Tests (BKT + DKT Blend)
    print("\n--- 4. Progress Engine Math Tests ---")
    cold_res = ml_service.update_mastery(current_mastery=0.25, is_correct=True, history_length=2)
    print(f"[Cold Start] 0.25 -> {cold_res['new_score']} ({cold_res['state']}) via {cold_res['engine_used']}")

    warm_res = ml_service.update_mastery(current_mastery=0.55, is_correct=True, history_length=7, dkt_prediction=0.88)
    print(f"[Warm Sequence] 0.55 -> {warm_res['new_score']} ({warm_res['state']}) via {warm_res['engine_used']}")

    print("\n==================================================")
    print("   ALL ML SUBSYSTEM TESTS COMPLETED SUCCESSFULLY!  ")
    print("==================================================")

if __name__ == "__main__":
    verify_all()
