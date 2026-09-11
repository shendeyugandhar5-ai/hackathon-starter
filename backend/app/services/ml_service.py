import os
import sys
import json
import joblib

current_dir = os.path.dirname(os.path.abspath(__file__)) # backend/app/services
app_dir = os.path.dirname(current_dir)                     # backend/app
backend_dir = os.path.dirname(app_dir)                     # backend
root_dir = os.path.dirname(backend_dir)                    # hackathon-starter

for p in [root_dir, backend_dir]:
    if p not in sys.path:
        sys.path.insert(0, p)


try:
    import torch
    import torch.nn as nn
    TORCH_AVAILABLE = True
except ImportError:
    torch = None
    nn = None
    TORCH_AVAILABLE = False
from typing import Dict, Any, List, Optional, Tuple

from ml.confusion.detector import ConfusionDetector
from ml.progress_engine.engine import ProgressEngine


if TORCH_AVAILABLE:
    class DKTModel(nn.Module):
        def __init__(self, num_skills: int = 10, hidden_dim: int = 32, num_layers: int = 1):
            super(DKTModel, self).__init__()
            self.num_skills = num_skills
            self.input_dim = num_skills * 2
            self.lstm = nn.LSTM(
                input_size=self.input_dim,
                hidden_size=hidden_dim,
                num_layers=num_layers,
                batch_first=True
            )
            self.fc = nn.Linear(hidden_dim, num_skills)
            self.sigmoid = nn.Sigmoid()

        def forward(self, x: torch.Tensor) -> torch.Tensor:
            out, _ = self.lstm(x)
            logits = self.fc(out)
            return self.sigmoid(logits)
else:
    class DKTModel:
        def __init__(self, *args, **kwargs):
            pass


class MLService:
    def __init__(self):
        self.base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
        self.root_dir = os.path.dirname(self.base_dir)
        self.ml_models_dir = os.path.join(self.base_dir, "ml_models")
        self.ml_dkt_dir = os.path.join(self.root_dir, "ml", "dkt")
        
        self.confusion_detector = ConfusionDetector()
        self.progress_engine = ProgressEngine()
        
        self.router_clf = None
        self.router_vec = None
        self.dkt_model = None
        self.skills_catalog = {}
        self.skills_list = []
        
        self.reload_artifacts()

    def reload_artifacts(self):
        # Load Router
        clf_path = os.path.join(self.ml_models_dir, "router_classifier.joblib")
        vec_path = os.path.join(self.ml_models_dir, "router_vectorizer.joblib")
        
        if not os.path.exists(clf_path):
            clf_path = os.path.join(self.root_dir, "ml", "router", "router_classifier.joblib")
            vec_path = os.path.join(self.root_dir, "ml", "router", "router_vectorizer.joblib")
            
        if os.path.exists(clf_path) and os.path.exists(vec_path):
            try:
                self.router_clf = joblib.load(clf_path)
                self.router_vec = joblib.load(vec_path)
            except Exception as e:
                print(f"[MLService] Warning: Failed to load router artifacts: {e}")

        # Load DKT Config & Model
        cfg_path = os.path.join(self.ml_dkt_dir, "dkt_config.json")
        if os.path.exists(cfg_path):
            try:
                with open(cfg_path, "r") as f:
                    cfg = json.load(f)
                    self.skills_catalog = {int(k): v for k, v in cfg.get("skills", {}).items()}
                    self.skills_list = cfg.get("skill_names", list(self.skills_catalog.values()))
            except Exception as e:
                print(f"[MLService] Warning: Failed to load DKT config: {e}")
                
        if not self.skills_catalog:
            self.skills_list = [
                "arrays_hashing", "linked_lists", "binary_trees", "graphs_bfs_dfs",
                "dynamic_programming", "relational_algebra", "sql_queries",
                "normalization", "probability_bayes", "neural_networks"
            ]
            self.skills_catalog = {i: name for i, name in enumerate(self.skills_list)}

        dkt_path = os.path.join(self.ml_dkt_dir, "dkt_model.pt")
        num_skills = len(self.skills_catalog) if self.skills_catalog else 10
        self.dkt_model = DKTModel(num_skills=num_skills)
        
        if TORCH_AVAILABLE and os.path.exists(dkt_path):
            try:
                state_dict = torch.load(dkt_path, map_location=torch.device("cpu"))
                self.dkt_model.load_state_dict(state_dict)
                self.dkt_model.eval()
            except Exception as e:
                print(f"[MLService] Note: Initialized DKT with default weights: {e}")
        elif TORCH_AVAILABLE:
            self.dkt_model.eval()

    def route_query(self, query: str, threshold: float = 0.60) -> Tuple[str, float, str, bool]:
        if not self.router_clf or not self.router_vec:
            return "general", 0.50, "Router model not loaded, falling back to coordinator", True
            
        vec = self.router_vec.transform([query])
        probs = self.router_clf.predict_proba(vec)[0]
        max_idx = probs.argmax()
        pred_label = self.router_clf.classes_[max_idx]
        confidence = float(probs[max_idx])
        
        if confidence < threshold:
            return "general", round(confidence, 4), f"Confidence ({confidence:.2f}) below threshold ({threshold}), routed to coordinator", True
        
        return pred_label, round(confidence, 4), f"Matched '{pred_label}' agent with confidence {confidence:.2f}", False

    def assess_confusion(self, message: str, previous_messages: Optional[List[str]] = None) -> Dict[str, Any]:
        return self.confusion_detector.analyze(message, previous_messages)

    def predict_dkt_mastery(self, interaction_trace: List[List[int]]) -> Dict[str, float]:
        num_skills = len(self.skills_catalog)
        if not interaction_trace or not TORCH_AVAILABLE:
            # Fallback heuristic if torch is not installed or trace is empty
            base_scores = {skill: 0.50 for skill in self.skills_list}
            for item in interaction_trace:
                skill_id = item[0]
                corr = item[1]
                skill_name = self.skills_catalog.get(skill_id)
                if skill_name:
                    delta = 0.10 if corr == 1 else -0.08
                    base_scores[skill_name] = round(min(max(base_scores[skill_name] + delta, 0.05), 0.95), 4)
            return base_scores
            
        x_seq = []
        for item in interaction_trace:
            skill_id = item[0]
            is_corr = item[1]
            vec = [0.0] * (num_skills * 2)
            input_idx = skill_id + (num_skills if is_corr == 1 else 0)
            if 0 <= input_idx < len(vec):
                vec[input_idx] = 1.0
            x_seq.append(vec)
            
        x_tensor = torch.tensor([x_seq], dtype=torch.float32)
        with torch.no_grad():
            preds = self.dkt_model(x_tensor)
            last_pred = preds[0, -1, :].numpy().tolist()

            
        return {
            self.skills_catalog.get(i, f"skill_{i}"): round(float(prob), 4)
            for i, prob in enumerate(last_pred)
        }

    def update_mastery(
        self,
        current_mastery: float,
        is_correct: bool,
        history_length: int = 1,
        dkt_prediction: Optional[float] = None
    ) -> Dict[str, Any]:
        return self.progress_engine.update(
            current_mastery=current_mastery,
            is_correct=is_correct,
            history_length=history_length,
            dkt_prediction=dkt_prediction
        )

ml_service = MLService()
