import requests
import json

BASE_URL = "http://localhost:8000"

print("="*60)
print("1. Querying graph BEFORE chat...")
r_before = requests.get(f"{BASE_URL}/api/students/rahul/learning-graph")
before_data = r_before.json()
print("Total Questions Before:", before_data["summary"]["total_questions"])
print("Total Nodes Before:", len(before_data["nodes"]))
print("Total Edges Before:", len(before_data["edges"]))

print("\n2. Sending real chat question to /api/chat...")
payload = {
    "student_id": "rahul",
    "message": "Can you explain Dijkstra algorithm and priority queues in graph traversals?",
    "conversation_id": "verify-conv-dijkstra-1"
}
r_chat = requests.post(f"{BASE_URL}/api/chat", json=payload)
chat_res = r_chat.json()
print("Chat Response Agent:", chat_res.get("agent"))
print("Chat Response Confidence:", chat_res.get("confidence"))
print("Chat Routed Reason:", chat_res.get("routed_reason"))

print("\n3. Querying graph AFTER chat...")
r_after = requests.get(f"{BASE_URL}/api/students/rahul/learning-graph")
after_data = r_after.json()
print("Total Questions After:", after_data["summary"]["total_questions"])
print("Total Nodes After:", len(after_data["nodes"]))
print("Total Edges After:", len(after_data["edges"]))

question_nodes = [n for n in after_data["nodes"] if n["node_type"] == "question"]
latest_q = question_nodes[-1] if question_nodes else None
print("\nLatest Question in Graph:")
print("  ID:", latest_q.get("id") if latest_q else "None")
print("  Label:", latest_q.get("label") if latest_q else "None")
print("  Agent:", latest_q.get("metadata", {}).get("agent") if latest_q else "None")
print("  Matched Concept:", latest_q.get("metadata", {}).get("matched_concept") if latest_q else "None")

# Check connected edges for this question
q_id = latest_q["id"]
connected_edges = [e for e in after_data["edges"] if e["source"] == q_id or e["target"] == q_id]
print(f"Connected Edges for '{q_id}':", len(connected_edges))
for e in connected_edges:
    print(f"  {e['source']} --({e['edge_type']})--> {e['target']}")

print("\n4. Testing Multi-Student Isolation (Student 'priya')...")
r_priya = requests.get(f"{BASE_URL}/api/students/priya/learning-graph")
priya_data = r_priya.json()
print("Priya Total Questions:", priya_data["summary"]["total_questions"])
print("Priya Top Bottleneck:", priya_data["summary"]["top_bottleneck"])

print("="*60)
