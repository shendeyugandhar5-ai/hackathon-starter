"""Answer language for the tutoring agents.

The UI can be switched to any of ten Indian languages; an interface in Marathi
that still answers in English is half a feature, so the selected language
travels with the request and becomes an instruction in the agent's system
prompt.

One deliberate rule, encoded in the directive below: technical terms stay in
English. Indian engineering syllabi teach "recursion", "normalization" and
"gradient descent" in English, exams are written in English, and a student
searching for help will search in English. Translating them into Sanskritised
coinages makes an answer *harder* to use, not more accessible. The explanation
is translated; the vocabulary of the field is not.
"""
from typing import Dict, Optional

# Kept in sync with frontend/src/i18n/languages.js
SUPPORTED_LANGUAGES: Dict[str, str] = {
    "en": "English",
    "hi": "Hindi",
    "bn": "Bengali",
    "mr": "Marathi",
    "te": "Telugu",
    "ta": "Tamil",
    "gu": "Gujarati",
    "kn": "Kannada",
    "ml": "Malayalam",
    "pa": "Punjabi",
    "or": "Odia",
}

DEFAULT_LANGUAGE = "en"

# Native names, so the instruction names the language in its own script too -
# models follow "reply in मराठी (Marathi)" more reliably than the English name
# alone, especially for languages with several romanised spellings.
NATIVE_NAMES: Dict[str, str] = {
    "hi": "हिन्दी",
    "bn": "বাংলা",
    "mr": "मराठी",
    "te": "తెలుగు",
    "ta": "தமிழ்",
    "gu": "ગુજરાતી",
    "kn": "ಕನ್ನಡ",
    "ml": "മലയാളം",
    "pa": "ਪੰਜਾਬੀ",
    "or": "ଓଡ଼ିଆ",
}


def normalize(code: Optional[str]) -> str:
    """Map anything the client sends to a supported code, defaulting to English.

    Accepts full locale tags ('mr-IN') as well as bare codes, so a browser
    value passed straight through still works.
    """
    if not code or not isinstance(code, str):
        return DEFAULT_LANGUAGE
    base = code.strip().lower().replace("_", "-").split("-")[0]
    return base if base in SUPPORTED_LANGUAGES else DEFAULT_LANGUAGE


def language_name(code: Optional[str]) -> str:
    return SUPPORTED_LANGUAGES.get(normalize(code), "English")


def language_directive(code: Optional[str]) -> str:
    """A system-prompt fragment, or '' for English.

    Empty for English on purpose: the agents' prompts are already written for
    English, and a redundant instruction only spends tokens.

    Placement matters more than wording here. Measured on the same question
    with the DSA persona, the share of the reply actually written in Devanagari
    was 47% with this text appended after the persona and 69% with it placed
    before - so `build_prompt` puts it first. Appending it lets a long English
    persona prompt, plus the English student-context and RAG blocks, outweigh
    a single trailing line.
    """
    normalized = normalize(code)
    if normalized == DEFAULT_LANGUAGE:
        return ""

    english = SUPPORTED_LANGUAGES[normalized]
    native = NATIVE_NAMES.get(normalized, english)

    return (
        f"CRITICAL INSTRUCTION - OUTPUT LANGUAGE: Write your entire reply in "
        f"{native} ({english}). Every sentence of explanation must be in "
        f"{native}, not English.\n"
        f"Keep technical terms, code, formulas, variable names and standard "
        f"academic vocabulary in English - the student studies and is examined "
        f"in English, so translating those would make your answer harder to "
        f"use, not easier. Explain around them in {native}, the way a good "
        f"{english}-speaking teacher would explain it aloud.\n"
        f"Any context or reference material below may be in English; that does "
        f"not change the language you reply in.\n\n"
    )
