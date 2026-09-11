"""Seed knowledge corpus for subject-aware RAG.

Deliberately small and hand-written: enough to ground the demo questions
in real reference material, without spending hours building a knowledge
base. Every chunk carries metadata so retrieval can be filtered by subject
rather than blindly searching everything.

To extend: append dicts here, or drop .md files into app/knowledge/docs/
(loaded automatically by retriever.py).
"""
from typing import Any, Dict, List

# subject | topic | source | difficulty | text
DOCUMENTS: List[Dict[str, Any]] = [
    # ------------------------------------------------------------ maths --
    {
        "subject": "maths", "topic": "conditional_probability",
        "source": "probability_notes", "difficulty": "beginner",
        "text": (
            "Conditional probability P(A|B) is the probability of A given that B has "
            "already occurred. The definition is P(A|B) = P(A and B) / P(B), valid when "
            "P(B) > 0. A common mistake is writing P(A|B) = P(A) * P(B) - that is the "
            "formula for the joint probability of INDEPENDENT events, not a conditional. "
            "Intuitively, conditioning on B shrinks the sample space to only the outcomes "
            "where B happened, then asks what fraction of those also have A."
        ),
    },
    {
        "subject": "maths", "topic": "bayes_theorem",
        "source": "probability_notes", "difficulty": "intermediate",
        "text": (
            "Bayes' theorem: P(A|B) = P(B|A) * P(A) / P(B). P(A) is the prior, P(B|A) the "
            "likelihood, P(A|B) the posterior, and P(B) the evidence or normalizing constant. "
            "It lets you invert a conditional: if you know how likely the evidence is under a "
            "hypothesis, you can compute how likely the hypothesis is given the evidence. "
            "Worked example: a test is 99% sensitive and 95% specific for a disease affecting "
            "1% of people. A positive test gives P(disease|positive) = (0.99*0.01) / "
            "(0.99*0.01 + 0.05*0.99) = about 0.167 - only 17%, because the prior is so low. "
            "This base-rate effect is the most commonly missed part of the theorem."
        ),
    },
    {
        "subject": "maths", "topic": "probability",
        "source": "probability_notes", "difficulty": "beginner",
        "text": (
            "Probability assigns a number in [0,1] to an event. For equally likely outcomes, "
            "P(event) = favorable outcomes / total outcomes. Two events are independent when "
            "P(A and B) = P(A) * P(B); equivalently P(A|B) = P(A). Mutually exclusive events "
            "cannot both occur, so P(A and B) = 0 and P(A or B) = P(A) + P(B). Independence "
            "and mutual exclusivity are frequently confused: mutually exclusive events with "
            "nonzero probability are in fact strongly dependent."
        ),
    },
    {
        "subject": "maths", "topic": "calculus_derivatives",
        "source": "calculus_notes", "difficulty": "intermediate",
        "text": (
            "A derivative measures instantaneous rate of change: f'(x) = lim(h->0) "
            "[f(x+h) - f(x)] / h. The chain rule, d/dx f(g(x)) = f'(g(x)) * g'(x), is what "
            "makes backpropagation possible - a neural network is a deep composition of "
            "functions, and gradients are computed by repeatedly applying the chain rule "
            "backwards through that composition. A partial derivative treats all other "
            "variables as constants; the gradient is the vector of all partial derivatives "
            "and points in the direction of steepest increase."
        ),
    },
    {
        "subject": "maths", "topic": "linear_algebra",
        "source": "linear_algebra_notes", "difficulty": "intermediate",
        "text": (
            "A matrix represents a linear transformation. Matrix multiplication AB is only "
            "defined when the columns of A equal the rows of B, and it is not commutative. "
            "An eigenvector v of A satisfies Av = lambda*v: the transformation only scales v, "
            "it does not rotate it. Eigenvalues and eigenvectors underpin PCA, where the "
            "principal components are the eigenvectors of the covariance matrix ordered by "
            "eigenvalue magnitude."
        ),
    },
    # ------------------------------------------------------------- aiml --
    {
        "subject": "aiml", "topic": "naive_bayes",
        "source": "ml_notes", "difficulty": "intermediate",
        "text": (
            "Naive Bayes is a classifier built directly on Bayes' theorem. It computes "
            "P(class|features) proportional to P(class) * product of P(feature_i|class). "
            "The 'naive' part is the conditional independence assumption: it assumes every "
            "feature is independent of every other GIVEN the class. That assumption is "
            "usually false in reality - in text, 'New' and 'York' clearly co-occur - yet the "
            "classifier still works well, because for classification only the ARGMAX matters, "
            "not calibrated probabilities. Understanding Naive Bayes requires conditional "
            "probability first: without it, the independence assumption is meaningless. "
            "Laplace (add-one) smoothing avoids zero probabilities for unseen features."
        ),
    },
    {
        "subject": "aiml", "topic": "gradient_descent",
        "source": "ml_notes", "difficulty": "intermediate",
        "text": (
            "Gradient descent minimizes a loss function by stepping opposite the gradient: "
            "theta = theta - learning_rate * gradient(loss). It needs calculus because the "
            "gradient is the vector of partial derivatives of the loss with respect to each "
            "parameter - that is what tells you which direction reduces error. Too large a "
            "learning rate diverges; too small converges slowly. Variants: batch (all data "
            "per step), stochastic (one sample), and mini-batch (typical in deep learning). "
            "A minimal implementation is a loop that computes predictions, computes the "
            "gradient of the loss, and updates parameters in place."
        ),
    },
    {
        "subject": "aiml", "topic": "overfitting",
        "source": "ml_notes", "difficulty": "beginner",
        "text": (
            "Overfitting is when a model memorizes training data, including its noise, and "
            "fails to generalize: training error keeps falling while validation error rises. "
            "Remedies include more data, simpler models, regularization (L1/L2), dropout, "
            "and early stopping. The bias-variance tradeoff frames it: high bias underfits "
            "(too simple), high variance overfits (too sensitive to the particular sample)."
        ),
    },
    {
        "subject": "aiml", "topic": "logistic_regression",
        "source": "ml_notes", "difficulty": "intermediate",
        "text": (
            "Logistic regression is a linear classifier that passes a linear combination "
            "through the sigmoid: p = 1 / (1 + e^-(wx+b)), mapping any real number to (0,1). "
            "It is trained by minimizing binary cross-entropy loss, not squared error, "
            "because cross-entropy is convex for this model and penalizes confident wrong "
            "predictions far more sharply. Despite the name it performs classification."
        ),
    },
    # -------------------------------------------------------------- dsa --
    {
        "subject": "dsa", "topic": "recursion",
        "source": "dsa_notes", "difficulty": "beginner",
        "text": (
            "A recursive function calls itself on a smaller input. Every recursion needs two "
            "parts: a base case that returns without recursing, and a recursive case that "
            "makes progress toward the base case. Infinite recursion - and the resulting "
            "stack overflow - almost always means one of two bugs: a missing base case, or a "
            "recursive call that does not actually shrink the input (for example passing n "
            "instead of n-1). Each call adds a stack frame, so recursion depth is bounded by "
            "stack size; deep recursion may need an iterative rewrite or memoization."
        ),
    },
    {
        "subject": "dsa", "topic": "time_complexity",
        "source": "dsa_notes", "difficulty": "beginner",
        "text": (
            "Big-O describes how running time grows with input size, ignoring constants and "
            "lower-order terms. Common classes, best to worst: O(1), O(log n), O(n), "
            "O(n log n), O(n^2), O(2^n). Binary search is O(log n) because it halves the "
            "search space each step. Comparison sorts cannot beat O(n log n) in the worst "
            "case. Nested loops over the same input are typically O(n^2). Analyze by counting "
            "how many times the innermost operation executes as a function of n."
        ),
    },
    {
        "subject": "dsa", "topic": "dynamic_programming",
        "source": "dsa_notes", "difficulty": "advanced",
        "text": (
            "Dynamic programming solves problems with optimal substructure and overlapping "
            "subproblems. Two styles: top-down memoization (recursion plus a cache) and "
            "bottom-up tabulation (fill a table iteratively). Naive recursive Fibonacci is "
            "O(2^n) because it recomputes the same subproblems; memoizing makes it O(n). "
            "The hard part is usually defining the state - what exactly dp[i] means - and the "
            "transition relating it to smaller states."
        ),
    },
    {
        "subject": "dsa", "topic": "hash_maps",
        "source": "dsa_notes", "difficulty": "beginner",
        "text": (
            "A hash map stores key-value pairs with average O(1) insert, lookup and delete. A "
            "hash function maps a key to a bucket index. Collisions - two keys hashing to the "
            "same bucket - are handled by chaining (a list per bucket) or open addressing "
            "(probing for the next free slot). Worst case degrades to O(n) when all keys "
            "collide. Keys must be immutable and hashable."
        ),
    },
    # ------------------------------------------------------------- dbms --
    {
        "subject": "dbms", "topic": "normalization",
        "source": "dbms_notes", "difficulty": "intermediate",
        "text": (
            "Normalization removes redundancy to prevent update, insert and delete anomalies. "
            "1NF: all values atomic, no repeating groups. 2NF: 1NF plus no partial dependency "
            "- no non-key attribute depends on only part of a composite primary key. 3NF: 2NF "
            "plus no transitive dependency - no non-key attribute depends on another non-key "
            "attribute. BCNF is stricter: every determinant must be a candidate key. The most "
            "common exam mistake is checking 3NF without first confirming 2NF, or forgetting "
            "that 2NF only bites when the primary key is composite."
        ),
    },
    {
        "subject": "dbms", "topic": "sql_joins",
        "source": "dbms_notes", "difficulty": "beginner",
        "text": (
            "INNER JOIN returns only rows matching in both tables. LEFT JOIN returns all rows "
            "from the left table, with NULLs where the right has no match; RIGHT JOIN is the "
            "mirror. FULL OUTER JOIN returns unmatched rows from both sides. CROSS JOIN is the "
            "Cartesian product. A frequent bug is filtering a LEFT JOIN's right table in the "
            "WHERE clause, which silently converts it into an INNER JOIN - put that condition "
            "in the ON clause instead."
        ),
    },
    {
        "subject": "dbms", "topic": "indexing",
        "source": "dbms_notes", "difficulty": "intermediate",
        "text": (
            "An index is a separate structure, usually a B-tree, that speeds up lookups at the "
            "cost of extra storage and slower writes. Indexes help WHERE, JOIN and ORDER BY on "
            "the indexed columns. A composite index (a,b) can serve queries filtering on a, or "
            "on a and b, but generally not on b alone - the leftmost-prefix rule. Applying a "
            "function to an indexed column in WHERE usually prevents the index being used."
        ),
    },
    {
        "subject": "dbms", "topic": "transactions",
        "source": "dbms_notes", "difficulty": "intermediate",
        "text": (
            "A transaction is an all-or-nothing unit of work with ACID guarantees: Atomicity "
            "(all or none), Consistency (constraints hold before and after), Isolation "
            "(concurrent transactions do not corrupt each other), Durability (committed data "
            "survives crashes). Isolation levels trade correctness for concurrency: READ "
            "UNCOMMITTED allows dirty reads, READ COMMITTED prevents them, REPEATABLE READ "
            "prevents non-repeatable reads, SERIALIZABLE prevents phantoms."
        ),
    },
    # ---------------------------------------------------------- general --
    {
        "subject": "general", "topic": "placement_roadmap",
        "source": "placement_guide", "difficulty": "beginner",
        "text": (
            "A typical Indian tech placement preparation split: DSA is the largest component "
            "for product companies, followed by CS fundamentals (DBMS, OS, networks), then "
            "projects and core subject depth. A workable two-month plan: weeks 1-4 build DSA "
            "fundamentals (arrays, strings, hashing, recursion, trees) with daily problems; "
            "weeks 5-6 add DBMS and OS revision alongside continued problem solving; weeks 7-8 "
            "focus on mock interviews, project articulation, and revision of weak topics. "
            "Prioritize weak fundamentals over new topics - interviews probe depth."
        ),
    },
    {
        "subject": "general", "topic": "interview_preparation",
        "source": "placement_guide", "difficulty": "beginner",
        "text": (
            "Technical interviews assess problem-solving process, not just the final answer. "
            "Think aloud, restate the problem, state assumptions, discuss brute force first, "
            "then optimize while explaining the tradeoff. For behavioral rounds use STAR - "
            "Situation, Task, Action, Result - and keep answers to about two minutes. When "
            "explaining a project, lead with the problem and your specific contribution, not "
            "the technology list."
        ),
    },
]
