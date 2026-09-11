import sys
sys.path.insert(0, ".")
from app.services.learning_graph_service import get_student_learning_graph
import json

graph = get_student_learning_graph("rahul")
print("STUDENT: rahul")
print("Total Questions in Summary:", graph["summary"]["total_questions"])
print("Total Nodes:", len(graph["nodes"]))
print("Total Edges:", len(graph["edges"]))
print("Active Subjects:", graph["summary"]["subjects_covered"])
print("Agents Used:", graph["summary"]["agents_used"])

question_nodes = [n for n in graph["nodes"] if n["node_type"] == "question"]
print(f"Total Question Nodes in Graph: {len(question_nodes)}")
for q in question_nodes[-3:]:
    print(f" - [Q Node] ID: {q['id']}, Label: {q['label']}, Matched Concept: {q['metadata'].get('matched_concept')}, Agent: {q['metadata'].get('agent')}")

agent_nodes = [n for n in graph["nodes"] if n["node_type"] == "agent"]
print(f"Total Agent Nodes: {len(agent_nodes)}")
for a in agent_nodes:
    print(f" - [Agent Node] ID: {a['id']}, Label: {a['label']}, Interactions: {a['metadata'].get('interaction_count')}")

# Test priya
priya_graph = get_student_learning_graph("priya")
print("\nSTUDENT: priya")
print("Total Questions in Summary:", priya_graph["summary"]["total_questions"])
print("Total Nodes:", len(priya_graph["nodes"]))
print("Total Edges:", len(priya_graph["edges"]))
print("Weak Concepts:", priya_graph["summary"]["weak_concepts"])
