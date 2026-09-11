from typing import Dict, Any, List, Optional

class ProgressEngine:
    """
    Progress Engine implementing:
    1. Classical Bayesian Knowledge Tracing (BKT) with exact probability updates.
    2. Dynamic DKT Sequence Blending (when interaction history >= 5).
    3. Qualitative Mastery State Classification.
    """
    def __init__(
        self,
        p_init: float = 0.20,   # P(L_0) - Initial knowledge prior
        p_trans: float = 0.15,  # P(T) - Probability of transition/learning
        p_guess: float = 0.20,  # P(G) - Probability of guessing correctly without mastery
        p_slip: float = 0.10    # P(S) - Probability of slipping/error despite mastery
    ):
        self.p_init = p_init
        self.p_trans = p_trans
        self.p_guess = p_guess
        self.p_slip = p_slip

    def update_bkt(self, p_prior: float, is_correct: bool) -> float:
        """
        Executes Bayesian Knowledge Tracing update step:
        1. Posterior update:
           P(L_t | Correct) = (P(L_{t-1}) * (1 - P(S))) / [ P(L_{t-1}) * (1 - P(S)) + (1 - P(L_{t-1})) * P(G) ]
           P(L_t | Incorrect) = (P(L_{t-1}) * P(S)) / [ P(L_{t-1}) * P(S) + (1 - P(L_{t-1})) * (1 - P(G)) ]
        2. Transition projection:
           P(L_t) = P(L_t | obs) + (1 - P(L_t | obs)) * P(T)
        """
        p_clamped = min(max(p_prior, 0.001), 0.999)
        
        if is_correct:
            numerator = p_clamped * (1.0 - self.p_slip)
            denominator = numerator + ((1.0 - p_clamped) * self.p_guess)
        else:
            numerator = p_clamped * self.p_slip
            denominator = numerator + ((1.0 - p_clamped) * (1.0 - self.p_guess))
            
        p_posterior = numerator / (denominator + 1e-12)
        
        # Advance learning transition
        p_next = p_posterior + (1.0 - p_posterior) * self.p_trans
        return round(float(min(max(p_next, 0.01), 0.99)), 3)

    def resolve_qualitative_state(self, score: float) -> str:
        """
        Maps continuous mastery probability into discrete Student Brain states:
        - 0.00 - 0.29: New
        - 0.30 - 0.59: Weak
        - 0.60 - 0.84: Learning
        - 0.85 - 1.00: Mastered
        """
        if score < 0.30:
            return "New"
        elif score < 0.60:
            return "Weak"
        elif score < 0.85:
            return "Learning"
        else:
            return "Mastered"

    def compute_student_progress(
        self,
        current_mastery: float,
        is_correct: bool,
        history_length: int = 0,
        dkt_prediction: Optional[float] = None
    ) -> Dict[str, Any]:
        """
        Hybrid routing:
        - Cold-start (< 5 interactions): 100% interpretable BKT update.
        - Warm sequence (>= 5 interactions & DKT available): Blended 60% DKT + 40% BKT.
        """
        bkt_score = self.update_bkt(current_mastery, is_correct)
        
        if dkt_prediction is not None and history_length >= 5:
            blended = round(0.60 * dkt_prediction + 0.40 * bkt_score, 3)
            final_score = min(max(blended, 0.01), 0.99)
            engine_used = "DKT-LSTM (Sequence Blend 60/40)"
        else:
            final_score = bkt_score
            engine_used = "BKT (Bayesian Interpretable Default)"
            
        qualitative_state = self.resolve_qualitative_state(final_score)
        
        # Mastery Delta
        delta = round(final_score - current_mastery, 3)
        direction = "increased" if delta > 0 else ("decreased" if delta < 0 else "unchanged")
        
        return {
            "previous_score": current_mastery,
            "new_score": final_score,
            "delta": delta,
            "direction": direction,
            "state": qualitative_state,
            "engine_used": engine_used,
            "bkt_raw": bkt_score,
            "dkt_raw": dkt_prediction
        }

    def update(
        self,
        current_mastery: float,
        is_correct: bool,
        history_length: int = 0,
        dkt_prediction: Optional[float] = None
    ) -> Dict[str, Any]:
        return self.compute_student_progress(
            current_mastery=current_mastery,
            is_correct=is_correct,
            history_length=history_length,
            dkt_prediction=dkt_prediction
        )


if __name__ == "__main__":
    engine = ProgressEngine()
    print("=== Progress Engine Demonstration ===")
    curr = 0.25
    print(f"Cold Start Prior: {curr} -> State: {engine.resolve_qualitative_state(curr)}")
    
    # Simulate correct attempt
    res1 = engine.compute_student_progress(curr, is_correct=True, history_length=1)
    print(f"Step 1 (Correct): {res1['new_score']} ({res1['state']}) via {res1['engine_used']}")
    
    # Simulate another correct attempt
    res2 = engine.compute_student_progress(res1["new_score"], is_correct=True, history_length=2)
    print(f"Step 2 (Correct): {res2['new_score']} ({res2['state']}) via {res2['engine_used']}")
    
    # Simulate incorrect attempt
    res3 = engine.compute_student_progress(res2["new_score"], is_correct=False, history_length=3)
    print(f"Step 3 (Incorrect): {res3['new_score']} ({res3['state']}) via {res3['engine_used']}")
    
    # Simulate warm sequence with DKT sequence prediction
    res4 = engine.compute_student_progress(res3["new_score"], is_correct=True, history_length=6, dkt_prediction=0.78)
    print(f"Step 6 (Warm DKT Blended): {res4['new_score']} ({res4['state']}) via {res4['engine_used']}")
