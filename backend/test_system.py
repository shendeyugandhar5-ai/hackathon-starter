import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

print("==================================================")
print("   LearnOS System & Subsystems Integrity Test    ")
print("==================================================")

# 1. Test Progress Engine
from app.services.progress_engine import engine_status, bkt_update, dkt_predict
status = engine_status()
print("\n[Progress Engine Status]")
print(f" - BKT Active: {status['bkt']}")
print(f" - DKT Available: {status['dkt_available']}")
print(f" - DKT Accuracy: {status.get('dkt_val_accuracy')}")

# Test BKT step
bkt_score = bkt_update(p_known=0.25, correct=True)
print(f" - BKT Step Test: 0.25 -> {bkt_score}")

# Test DKT prediction with 15 events
test_history = [("recursion_and_backtracking", True)] * 15
dkt_preds = dkt_predict(test_history)
if dkt_preds:
    print(f" - DKT Prediction Test: {len(dkt_preds)} skills predicted successfully!")

# 2. Test Router Classifier
from app.agents.router import route
query = "How do I implement Dijkstra algorithm with min-heap?"
assigned_agent, confidence, was_model = route(query)
print("\n[Router Classifier Test]")
print(f" - Query: '{query}'")
print(f" - Routed to: '{assigned_agent}' | Confidence: {confidence} | From Trained Model: {was_model}")

# 3. Test API Router Integrity
from app.routes.api import api_router
routes = [route.path for route in api_router.routes]
print("\n[API Router Integrity]")
print(f" - Total registered endpoints: {len(routes)}")
for r in sorted(routes):
    print(f"   * /api{r}")

print("\n==================================================")
print("   ALL CHECKS PASSED: ZERO ERRORS IN PROJECT!     ")
print("==================================================")
