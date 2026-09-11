import re
from typing import Dict, Any, List, Optional

CONFUSION_LEXICON = {
    "confused", "stuck", "lost", "understand nothing", "don't get",
    "dont get", "why", "what do you mean", "makes no sense", "unclear",
    "explain again", "still wrong", "help me", "overwhelmed", "not following",
    "impossible", "not clear", "giving up", "cant understand", "can't understand"
}

FRUSTRATION_MARKERS = {
    "ugh", "argh", "hate this", "stupid", "makes zero sense", "waste of time"
}

class ConfusionDetector:
    """
    Computes a continuous confusion score C in [0.0, 1.0] from linguistic markers,
    punctuation anomaly density, and message brevity/fragmentation.
    """
    def __init__(self, threshold: float = 0.45):
        self.threshold = threshold

    def analyze(self, message: str, previous_messages: Optional[List[str]] = None) -> Dict[str, Any]:
        text = message.lower().strip()
        tokens = re.findall(r"\b\w+\b", text)
        token_count = len(tokens)
        
        # 1. Confusion Lexicon Hit Density
        hit_count = sum(1 for phrase in CONFUSION_LEXICON if phrase in text)
        frustration_hits = sum(1 for marker in FRUSTRATION_MARKERS if marker in text)
        lexicon_score = min(hit_count * 0.40 + frustration_hits * 0.45, 1.0)
        
        # 2. Punctuation Density (Multiple question marks or exclamation e.g. "??", "?!?")
        q_count = text.count("?")
        ex_count = text.count("!")
        if q_count >= 2 or (q_count >= 1 and ex_count >= 1):
            punct_score = 0.40
        elif q_count == 1:
            punct_score = 0.20
        else:
            punct_score = 0.0
            
        # 3. Message Brevity Anomaly (Sudden frustrated drop e.g. "what?", "still stuck", "why")
        brevity_score = 0.30 if (0 < token_count <= 4 and (q_count > 0 or hit_count > 0)) else 0.0
        
        # 4. Composite continuous score
        raw_score = (lexicon_score * 0.60) + (punct_score * 0.25) + (brevity_score * 0.15)
        # Bonus for explicit combined frustration
        if frustration_hits > 0 and hit_count > 0:
            raw_score += 0.15
            
        confusion_score = round(min(max(raw_score, 0.0), 1.0), 3)
        
        # 5. Pedagogical strategy recommendation (Calibrated thresholds)
        is_confused = confusion_score >= self.threshold
        
        if confusion_score >= 0.60:
            strategy = "switch_to_worked_example_and_analogy"
            action_desc = "High confusion detected. Transitioning from abstract theory to worked concrete example with intuitive real-world analogy."
        elif confusion_score >= 0.40:
            strategy = "socratic_simplification"
            action_desc = "Mild hesitation or ambiguity detected. Breaking problem down into smaller guided sub-questions."
        else:
            strategy = "normal_flow"
            action_desc = "Normal comprehension level. Continuing standard instructional progression."
            
        return {
            "confusion_score": confusion_score,
            "is_confused": is_confused,
            "recommended_strategy": strategy,
            "pedagogical_action": action_desc,
            "signals": {
                "lexicon_score": round(lexicon_score, 2),
                "punct_score": round(punct_score, 2),
                "brevity_score": round(brevity_score, 2)
            }
        }

if __name__ == "__main__":
    detector = ConfusionDetector()
    test_cases = [
        "That makes total sense, thank you!",
        "Wait, what?? I still don't get why we invert the matrix here...",
        "I am completely lost. This explanation makes no sense at all.",
        "why?",
        "Can we do another practice problem on binary trees?"
    ]
    print("=== Confusion Detector Test Cases ===")
    for text in test_cases:
        res = detector.analyze(text)
        print(f"Text: '{text}'")
        print(f" -> Score: {res['confusion_score']} | Confused: {res['is_confused']} | Strategy: {res['recommended_strategy']}\n")
