from enum import Enum

class Action(Enum):
    BLOCK = "BLOCK"
    MASK = "MASK"
    ALERT = "ALERT"
    ALLOW = "ALLOW"

POLICY_RULES = {
    "credit_card": Action.BLOCK,
    "aadhaar": Action.BLOCK,
    "pan_card": Action.BLOCK,
    "ssn": Action.BLOCK,
    "api_key": Action.BLOCK,
    "jwt_token": Action.BLOCK,
    "password_hint": Action.BLOCK,
    "email": Action.MASK,
    "phone": Action.MASK,
    "PERSON": Action.MASK,
    "EMAIL_ADDRESS": Action.MASK,
    "PHONE_NUMBER": Action.MASK,
    "LOCATION": Action.MASK,
    "high_entropy_token": Action.ALERT,
    "base64_pattern": Action.ALERT,
    "hex_secret": Action.ALERT,
    "NRP": Action.ALERT,
}

def calculate_risk_score(findings: list) -> int:
    score = 0
    for finding in findings:
        f_type = finding.get("type")
        if f_type in POLICY_RULES:
            action = POLICY_RULES[f_type]
            if action == Action.BLOCK:
                score += 25
            elif action == Action.MASK:
                score += 10
            elif action == Action.ALERT:
                score += 5
    return min(score, 100)

def decide(findings: list) -> dict:
    if not findings:
        return {"action": Action.ALLOW.value, "findings": [], "risk_score": 0}
    
    risk_score = calculate_risk_score(findings)
    
    actions = {POLICY_RULES.get(f.get("type")) for f in findings if f.get("type") in POLICY_RULES}
    
    if Action.BLOCK in actions:
        final_action = Action.BLOCK
    elif Action.MASK in actions:
        final_action = Action.MASK
    elif Action.ALERT in actions:
        final_action = Action.ALERT
    else:
        final_action = Action.ALLOW
        
    return {"action": final_action.value, "findings": findings, "risk_score": risk_score}

def update_policy(data_type: str, new_action: str) -> bool:
    try:
        new_action_enum = Action[new_action.upper()]
    except KeyError:
        return False
        
    if data_type in POLICY_RULES:
        POLICY_RULES[data_type] = new_action_enum
        return True
    return False
