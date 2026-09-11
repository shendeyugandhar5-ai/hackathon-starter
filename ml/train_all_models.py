# LearnOS — Machine Learning & Deep Learning Training Script
# Models: Tier-1 Subject Router (TF-IDF + Logistic Regression) & Tier-2 DKT-LSTM

import sys
import subprocess
import os
import json
import random
import numpy as np
import pandas as pd
import joblib
import matplotlib.pyplot as plt

# Auto-install/verify required packages
required_packages = ["scikit-learn", "pandas", "joblib", "torch", "matplotlib"]
for pkg in required_packages:
    try:
        __import__(pkg.replace("-", "_"))
    except ImportError:
        print(f"Installing {pkg}...")
        subprocess.check_call([sys.executable, "-m", "pip", "install", "-q", pkg])

import torch
import torch.nn as nn
import torch.optim as optim
from torch.utils.data import Dataset, DataLoader
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.model_selection import train_test_split
from sklearn.metrics import classification_report, accuracy_score

device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
print(f"Executing on device: {device}")

# ==========================================
# 1. Tier-1 Router: Dataset & Training
# ==========================================
SEED_DATA = {
    "dsa": [
        "How do I balance an AVL tree after right rotation?",
        "Why does my recursion run into a stack overflow error?",
        "Implement Dijkstra algorithm using a priority queue in Python",
        "Explain the time complexity of quicksort in the worst case",
        "How do I find a cycle in a directed graph using Kahn's algorithm?",
        "Difference between dynamic programming and divide and conquer",
        "Implement LRU cache using doubly linked list and hashmap",
        "Breadth first search versus depth first search tree traversal",
        "Explain binary search boundary conditions with duplicate elements",
        "How does heapify work in linear time O(n)?"
    ],
    "dbms": [
        "Explain the difference between 3NF and BCNF with an example",
        "How does an indexing B+ tree improve SQL read queries?",
        "What are ACID properties and how is isolation level serializable implemented?",
        "Write a SQL query using window functions like ROW_NUMBER() and RANK()",
        "Difference between clustered and non-clustered indexes",
        "Explain dirty read, non-repeatable read, and phantom read anomalies",
        "Design a normalized schema for an e-commerce order management system",
        "How does write-ahead logging (WAL) ensure durability in crash recovery?",
        "What is the difference between inner join, left join, and full outer join?",
        "Explain two-phase locking protocol (2PL) in transaction management"
    ],
    "maths": [
        "State and derive Bayes theorem with conditional probability",
        "Find the eigenvalues and eigenvectors of a 3x3 symmetric matrix",
        "Calculate the partial derivative for gradient descent update step",
        "What is the intuitive difference between variance and covariance?",
        "Compute the null space and column rank of this transformation matrix",
        "Explain the central limit theorem and when sample mean is normal",
        "Calculate the Taylor series expansion of e^x around zero",
        "What is Lagrange multiplier method for constrained optimization?",
        "Difference between discrete probability distributions: Poisson vs Binomial",
        "How to compute the Jacobian matrix of a multivariate vector function"
    ],
    "aiml": [
        "How does backpropagation compute gradients through hidden activation layers?",
        "Difference between L1 lasso and L2 ridge weight regularization",
        "Explain how multi-head self-attention works in Transformer models",
        "Why does vanishing gradient happen with sigmoid activation functions?",
        "Explain ROC AUC curve and how to pick an optimal decision threshold",
        "What is the mathematical formulation of categorical cross-entropy loss?",
        "Difference between bagging in Random Forest and boosting in XGBoost",
        "How does batch normalization stabilize deep neural network training?",
        "Explain k-means clustering objective function and inertia convergence",
        "What is transfer learning and when should you fine-tune the final layer?"
    ],
    "general": [
        "I have 2 months left before campus placements, what roadmap should I follow?",
        "Can you review my resume points for a Data Scientist role?",
        "I am feeling very anxious about technical coding interviews",
        "How should I answer 'tell me about a time you had a technical disagreement'?",
        "Recommend a weekly study schedule balancing DSA and academic exams",
        "What are common behavioral questions asked by tier-1 tech companies?",
        "I feel stuck and lost in my career preparation journey",
        "How do I structure my explanation during a live system design interview?",
        "Give me a 30-day crash course study plan for product company exams",
        "Which projects should I build to stand out for ML engineering internships?"
    ]
}

rows = []
prefixes = ["Can you explain ", "Please help me understand ", "I am confused about ", "Quick question on ", "Step by step guide for "]
for label, texts in SEED_DATA.items():
    for t in texts:
        rows.append({"text": t, "label": label})
        for i in range(19):
            rows.append({"text": f"{prefixes[i % 5]}{t.lower()}", "label": label})

df = pd.DataFrame(rows).sample(frac=1.0, random_state=42).reset_index(drop=True)
print(f"\nGenerated {len(df)} training samples across {len(SEED_DATA)} classes.")

X_train, X_test, y_train, y_test = train_test_split(df["text"], df["label"], test_size=0.2, random_state=42, stratify=df["label"])
vectorizer = TfidfVectorizer(max_features=3000, ngram_range=(1, 2), sublinear_tf=True)
X_train_vec = vectorizer.fit_transform(X_train)
X_test_vec = vectorizer.transform(X_test)

clf = LogisticRegression(max_iter=1000, C=2.0, class_weight="balanced", random_state=42)
clf.fit(X_train_vec, y_train)

preds = clf.predict(X_test_vec)
print("\n--- Router Classifier Evaluation ---")
print(f"Validation Accuracy: {accuracy_score(y_test, preds) * 100:.2f}%")

# Save Router Artifacts
os.makedirs("ml/router", exist_ok=True)
os.makedirs("backend/app/ml_models", exist_ok=True)

joblib.dump(vectorizer, "ml/router/router_vectorizer.joblib")
joblib.dump(clf, "ml/router/router_classifier.joblib")
joblib.dump(vectorizer, "backend/app/ml_models/router_vectorizer.joblib")
joblib.dump(clf, "backend/app/ml_models/router_classifier.joblib")
print("Saved router artifacts to ml/router/ and backend/app/ml_models/")

# ==========================================
# 2. Tier-2 Deep Knowledge Tracing (DKT-LSTM)
# ==========================================
SKILL_CATALOG = {
    0: "recursion_and_backtracking",
    1: "trees_and_graphs",
    2: "relational_algebra_and_sql",
    3: "dbms_normalization_and_indexing",
    4: "probability_and_bayes",
    5: "linear_algebra_and_matrices",
    6: "gradient_descent_and_optimization",
    7: "neural_networks_and_backprop",
    8: "sorting_and_searching",
    9: "time_complexity_analysis"
}

PREREQUISITES = {
    4: [6],    # Probability helps Optimization
    5: [6, 7], # Linear Algebra helps Optimization & Neural Nets
    0: [1],    # Recursion helps Trees/Graphs
    8: [9]     # Sorting helps Complexity
}

os.makedirs("ml/dkt", exist_ok=True)
with open("ml/dkt/dkt_config.json", "w") as f:
    json.dump({"skills": SKILL_CATALOG, "skill_names": list(SKILL_CATALOG.values())}, f, indent=2)

def simulate_student_sequence(num_skills=10, num_steps=30, seed=None):
    rng = random.Random(seed)
    mastery = [rng.uniform(0.15, 0.45) for _ in range(num_skills)]
    sequence = []
    for _ in range(num_steps):
        skill = rng.randrange(num_skills)
        correct = 1 if rng.random() < mastery[skill] else 0
        sequence.append((skill, correct))
        learning_rate = 0.12 if correct else 0.04
        mastery[skill] += (1.0 - mastery[skill]) * learning_rate
        if correct and skill in PREREQUISITES:
            for target_skill in PREREQUISITES[skill]:
                mastery[target_skill] += (1.0 - mastery[target_skill]) * 0.08
    return sequence

class DKTDataset(Dataset):
    def __init__(self, sequences):
        self.samples = []
        for seq in sequences:
            input_seq = [s * 2 + c for s, c in seq[:-1]]
            target_skills = [s for s, c in seq[1:]]
            target_correct = [float(c) for s, c in seq[1:]]
            self.samples.append({
                "input": torch.tensor(input_seq, dtype=torch.long),
                "target_skill": torch.tensor(target_skills, dtype=torch.long),
                "target_correct": torch.tensor(target_correct, dtype=torch.float32)
            })
    def __len__(self):
        return len(self.samples)
    def __getitem__(self, idx):
        return self.samples[idx]

all_sequences = [simulate_student_sequence(10, 30, seed=i) for i in range(1000)]
train_loader = DataLoader(DKTDataset(all_sequences[:800]), batch_size=32, shuffle=True)
val_loader = DataLoader(DKTDataset(all_sequences[800:]), batch_size=32, shuffle=False)

class DKT(nn.Module):
    def __init__(self, num_skills=10, embed_dim=32, hidden_dim=64):
        super().__init__()
        self.embed = nn.Embedding(num_skills * 2, embed_dim)
        self.lstm = nn.LSTM(embed_dim, hidden_dim, batch_first=True)
        self.fc = nn.Linear(hidden_dim, num_skills)
        self.sigmoid = nn.Sigmoid()

    def forward(self, x):
        e = self.embed(x)
        h, _ = self.lstm(e)
        return self.sigmoid(self.fc(h))

model = DKT(num_skills=10, embed_dim=32, hidden_dim=64).to(device)
optimizer = optim.Adam(model.parameters(), lr=0.005)
criterion = nn.BCELoss()

print("\n=== Training DKT-LSTM Mastery Model ===")
epochs = 15
for epoch in range(epochs):
    model.train()
    total_loss = 0.0
    for batch in train_loader:
        inputs = batch["input"].to(device)
        target_skills = batch["target_skill"].to(device)
        target_correct = batch["target_correct"].to(device)
        
        optimizer.zero_grad()
        preds = model(inputs)
        chosen_preds = preds.gather(2, target_skills.unsqueeze(-1)).squeeze(-1)
        loss = criterion(chosen_preds, target_correct)
        loss.backward()
        optimizer.step()
        total_loss += loss.item()
        
    train_loss = total_loss / len(train_loader)
    if (epoch + 1) % 5 == 0 or epoch == epochs - 1:
        print(f"Epoch [{epoch+1:02d}/{epochs:02d}] | Train Loss: {train_loss:.4f}")

torch.save(model.state_dict(), "ml/dkt/dkt_model.pt")
print("Saved DKT weights to ml/dkt/dkt_model.pt")

print("\n==========================================")
print("  ALL MODELS TRAINED AND SAVED SUCCESSFULLY! ")
print("==========================================")
