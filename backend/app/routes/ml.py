from fastapi import APIRouter, HTTPException, status
from app.schemas.ml import (
    RouteRequest, RouteResponse,
    ConfusionRequest, ConfusionResponse,
    DKTSequenceRequest, DKTSequenceResponse,
    ProgressUpdateRequest, ProgressUpdateResponse
)
from app.services.ml_service import ml_service

router = APIRouter(prefix="/ml", tags=["Machine Learning & Models"])

@router.post("/route", response_model=RouteResponse, summary="Route Query to Specialist Agent")
def route_query(payload: RouteRequest):
    """
    Tier-1 Router: Uses TF-IDF + Logistic Regression to classify student queries
    into: dsa, dbms, maths, aiml, or general.
    Falls back to 'general' if confidence is below 0.60.
    """
    agent, confidence, reason, is_fallback = ml_service.route_query(payload.message)
    return RouteResponse(
        agent=agent,
        confidence=confidence,
        routed_reason=reason,
        is_fallback=is_fallback
    )

@router.post("/confusion", response_model=ConfusionResponse, summary="Detect Student Confusion")
def assess_confusion(payload: ConfusionRequest):
    """
    Computes continuous confusion score [0.0 - 1.0] and triggers adaptive
    pedagogical teaching actions (Worked Example, Socratic hint, etc.).
    """
    result = ml_service.assess_confusion(payload.message, payload.previous_messages)
    return ConfusionResponse(**result)

@router.post("/dkt-mastery", response_model=DKTSequenceResponse, summary="Predict Multi-Skill Mastery via DKT-LSTM")
def predict_dkt_mastery(payload: DKTSequenceRequest):
    """
    Tier-2 DKT-LSTM: Evaluates student interaction sequence [(skill_id, is_correct), ...]
    and predicts multi-skill mastery probabilities capturing cross-topic transfer.
    """
    predictions = ml_service.predict_dkt_mastery(payload.interactions)
    return DKTSequenceResponse(
        predicted_mastery=predictions,
        sequence_length=len(payload.interactions)
    )

@router.post("/progress-update", response_model=ProgressUpdateResponse, summary="Update Student Mastery via Progress Engine")
def update_progress(payload: ProgressUpdateRequest):
    """
    Progress Engine: Applies Bayesian Knowledge Tracing (BKT) update formula
    with dynamic DKT sequence blending when history >= 5.
    Returns new mastery score and qualitative state (New, Weak, Learning, Mastered).
    """
    result = ml_service.update_mastery(
        current_mastery=payload.current_mastery,
        is_correct=payload.is_correct,
        history_length=payload.history_length,
        dkt_prediction=payload.dkt_prediction
    )
    return ProgressUpdateResponse(**result)

@router.get("/skills", summary="Get Tracked Skills Catalog")
def get_skills_catalog():
    """Returns the ID-to-skill mapping recognized by the DKT-LSTM model."""
    return {"skills": ml_service.skills_catalog}

@router.post("/reload", summary="Hot-Reload ML Models from Disk")
def reload_models():
    """Reloads model artifacts from backend/app/ml_models/ without restarting the server."""
    ml_service.reload_artifacts()
    return {
        "status": "success",
        "router_loaded": ml_service.router_clf is not None,
        "dkt_loaded": ml_service.dkt_model is not None,
        "total_skills": len(ml_service.skills_catalog)
    }
