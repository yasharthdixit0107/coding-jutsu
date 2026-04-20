import re

PATTERNS = {
    "credit_card": r"\b(?:[0-9]{4}[ -]?){3}[0-9]{4}\b|\b\d{16}\b",
    "aadhaar": r"\b[2-9]{1}[0-9]{3}\s[0-9]{4}\s[0-9]{4}\b",
    "pan_card": r"\b[A-Z]{5}[0-9]{4}[A-Z]{1}\b",
    "ssn": r"\b[0-9]{3}-[0-9]{2}-[0-9]{4}\b",
    "email": r"\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b",
    "phone": r"(?:(?:\+91)[\-\s]?)?[6-9]\d{4}[\-\s]?\d{5}\b|(?:\+91[\-\s]?)?[6-9]\d{9}\b",
    "password_hint": r"(?i)(?:password|passwd|pwd)\s*[:=]\s*\S+",
    "api_key": r"(?i)(?:api_key|secret|token)\s*[:=]\s*[A-Za-z0-9_\-]{16,}",
    "jwt_token": r"\beyJ[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+(?:\.[a-zA-Z0-9_-]+)?",
}

def scan_text(text: str) -> list[dict]:
    results = []
    for type_name, pattern in PATTERNS.items():
        matches = re.findall(pattern, text)
        if matches:
            results.append({
                "type": type_name,
                "count": len(matches),
                "sample": matches[0] if matches else ""
            })
    return results

def mask_text(text: str) -> str:
    cleaned_text = text
    for type_name, pattern in PATTERNS.items():
        cleaned_text = re.sub(pattern, f"[REDACTED-{type_name}]", cleaned_text)
    return cleaned_text
