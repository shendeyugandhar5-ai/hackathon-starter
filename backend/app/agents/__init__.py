"""LearnOS Agent Layer.

Owned by Person A (idea.md section 5): Coordinator + the five agents
(dsa, dbms, maths, aiml, general) + prompts + the verifier agent.

    coordinator.py    -> coordinate(message, student_id, conversation_id)
    <subject>_agent.py -> one BaseAgent subclass per specialist
    general_agent.py  -> the leaf-node fallback / career-mentor agent
    verifier_agent.py -> sanity-checks combined multi-agent answers
    router.py         -> Tier-1 trained classifier + keyword/LLM fallback
    prompts.py        -> system prompts for every agent
    llm_client.py     -> the one place that calls the LLM API
"""
