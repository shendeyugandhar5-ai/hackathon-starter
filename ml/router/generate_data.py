"""Generate labeled training data for the Tier-1 subject router.

Produces ~200 examples per class across dsa / dbms / maths / aiml / general
by combining question templates with topic vocabulary. Template-based so it
runs instantly and offline - no LLM key required.

Usage:
    python generate_data.py                # writes training_data.csv
    python generate_data.py --per-class 300
"""
import argparse
import csv
import itertools
import os
import random

TEMPLATES = [
    "What is {t}?",
    "Explain {t}.",
    "Can you explain {t} with an example?",
    "I don't understand {t}.",
    "How does {t} work?",
    "Why is {t} important?",
    "What's the difference between {t} and {t2}?",
    "Give me a problem on {t}.",
    "How do I solve questions about {t}?",
    "I'm stuck on {t}, can you help?",
    "Walk me through {t} step by step.",
    "Is {t} asked in placement interviews?",
    "What are common mistakes in {t}?",
    "Show me how to implement {t}.",
    "Quiz me on {t}.",
    "How is {t} related to {t2}?",
    "My answer for {t} was wrong, why?",
    "Summarize {t} for revision.",
    # Imperative / task phrasings - students rarely ask in full questions
    "Write {t} code for me.",
    "Give me practice problems on {t}.",
    "Help me with {t}.",
    "{t} explained simply",
    "{t} vs {t2}",
    "Need help understanding {t}",
    "Teach me {t}.",
    "Debug my {t} solution.",
    "{t} interview questions",
    "Revise {t} with me.",
    "Tell me about {t}.",
    "Compare {t} and {t2}.",
    "What are the steps for {t}?",
    "Break down {t} for me.",
]

TOPICS = {
    "dsa": [
        "arrays", "linked lists", "recursion", "binary search", "quicksort",
        "merge sort", "stacks", "queues", "binary trees", "graphs",
        "dynamic programming", "time complexity", "big O notation", "hash maps",
        "heaps", "backtracking", "sliding window", "two pointers", "tries",
        "breadth first search", "depth first search", "greedy algorithms",
        "linked list cycle detection", "tree traversal", "space complexity",
    ],
    "dbms": [
        "SQL joins", "SQL queries", "inner joins", "left joins", "join queries",
        "normalization", "first normal form", "third normal form",
        "ER diagrams", "primary keys", "foreign keys", "indexing",
        "query optimization", "transactions", "ACID properties", "deadlocks",
        "stored procedures", "views", "triggers", "GROUP BY clauses",
        "subqueries", "database schema design", "denormalization",
        "concurrency control", "B-tree indexes", "relational algebra",
    ],
    "maths": [
        "probability", "conditional probability", "Bayes theorem",
        "linear algebra", "matrix multiplication", "eigenvalues", "derivatives",
        "integrals", "partial derivatives", "limits", "permutations",
        "combinations", "standard deviation", "normal distribution",
        "hypothesis testing", "vectors", "determinants", "set theory",
        "graph theory", "logarithms", "expected value", "variance",
        "chain rule", "gradient", "discrete mathematics",
    ],
    "aiml": [
        "linear regression", "logistic regression", "decision trees",
        "random forests", "neural networks", "gradient descent",
        "backpropagation", "overfitting", "regularization", "cross validation",
        "k-means clustering", "support vector machines", "naive bayes",
        "confusion matrices", "precision and recall", "feature engineering",
        "convolutional neural networks", "activation functions", "loss functions",
        "learning rate", "batch normalization", "transformers", "embeddings",
        "bias variance tradeoff", "ensemble methods",
    ],
}

# The general class needs the most careful examples - it is the fallback
# target, so it must learn the boundary rather than absorbing everything.
GENERAL_EXAMPLES = [
    "I have 2 months before placements, what should I focus on?",
    "How should I prepare for technical interviews?",
    "Build me a study plan for the next 4 weeks.",
    "What should I learn first to become a data scientist?",
    "How do I answer 'tell me about yourself' in an interview?",
    "I'm feeling overwhelmed with placement prep.",
    "How many hours a day should I study?",
    "What topics are most important for product company interviews?",
    "Give me a roadmap to crack placements.",
    "How do I stay motivated while preparing?",
    "Should I focus on projects or DSA first?",
    "What's a good resume format for freshers?",
    "How do I handle interview rejection?",
    "Which companies should I apply to?",
    "How do I explain my project in an interview?",
    "What are good behavioral interview answers?",
    "I keep forgetting what I studied last week.",
    "How do I balance college exams and placement prep?",
    "Am I on track for my goals?",
    "What should I revise the night before an interview?",
    "Can you review my overall progress?",
    "What are my weakest areas right now?",
    "How long does it take to get placement ready?",
    "Should I do an internship or prepare for placements?",
    "Help me plan my week.",
    "What's the best way to take notes while studying?",
    "How do I improve my problem solving speed?",
    "Tell me what to study today.",
    "I failed my last mock interview, what now?",
    "How important is CGPA for placements?",
    "What certifications actually matter?",
    "How do I negotiate a job offer?",
    "Give me tips for group discussions.",
    "What's the difference between service and product companies?",
    "How do I build a good GitHub profile?",
    "Can you summarize what I've learned so far?",
    "I don't know where to start.",
    "What should my daily routine look like?",
    "Help me set realistic study goals.",
    "How do I prepare for HR rounds?",
    # Role-specific roadmap phrasings. Without these the classifier latches
    # onto the domain word ("software engineering", "data science") and
    # misroutes a roadmap request to a subject specialist.
    "Give me a software engineering placement roadmap.",
    "Give me a data science placement roadmap.",
    "Give me a roadmap for becoming a backend developer.",
    "What is the roadmap for a machine learning engineer role?",
    "Roadmap for full stack development placements",
    "Study plan for software engineering interviews",
    "How do I prepare for a software engineering role?",
    "What should I study to become a software engineer?",
    "Preparation plan for data analyst roles",
    "Career roadmap for backend engineering",
    "What is the best preparation strategy for product companies?",
    "Plan my placement preparation for the next month.",
    "Which subjects should I prioritize for placements?",
    "How do I structure my revision before interviews?",
    "Give me a week by week preparation schedule.",
]


def build_rows(per_class: int, seed: int = 42):
    rng = random.Random(seed)
    rows = []

    for label, topics in TOPICS.items():
        pairs = list(itertools.product(TEMPLATES, topics))
        rng.shuffle(pairs)
        seen = set()
        for template, topic in pairs:
            if len(seen) >= per_class:
                break
            other = rng.choice([t for t in topics if t != topic])
            text = template.format(t=topic, t2=other)
            if text not in seen:
                seen.add(text)
                rows.append({"text": text, "label": label})

    # General: expand the handwritten seeds with light paraphrase prefixes
    prefixes = ["", "Hey, ", "Quick question - ", "Can you help me: ", "So ", "Honestly, "]
    suffixes = ["", " Any advice?", " Please guide me.", " I'm not sure.", " Thanks!"]
    general = set()
    combos = list(itertools.product(prefixes, GENERAL_EXAMPLES, suffixes))
    rng.shuffle(combos)
    for pre, base, suf in combos:
        if len(general) >= per_class:
            break
        text = f"{pre}{base}{suf}".strip()
        if text not in general:
            general.add(text)
            rows.append({"text": text, "label": "general"})

    rng.shuffle(rows)
    return rows


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--per-class", type=int, default=200)
    parser.add_argument("--out", default=None)
    args = parser.parse_args()

    out_path = args.out or os.path.join(os.path.dirname(os.path.abspath(__file__)), "training_data.csv")
    rows = build_rows(args.per_class)

    with open(out_path, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=["text", "label"])
        writer.writeheader()
        writer.writerows(rows)

    counts = {}
    for row in rows:
        counts[row["label"]] = counts.get(row["label"], 0) + 1
    print(f"Wrote {len(rows)} rows to {out_path}")
    for label in sorted(counts):
        print(f"  {label:8s} {counts[label]}")


if __name__ == "__main__":
    main()
