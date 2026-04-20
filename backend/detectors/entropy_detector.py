import math
import re

def calculate_shannon_entropy(text: str) -> float:
    if not text:
        return 0.0
    entropy = 0.0
    length = len(text)
    for char in set(text):
        prob = text.count(char) / length
        entropy -= prob * math.log2(prob)
    return entropy

def check_entropy(text: str) -> list[dict]:
    results = []
    tokens = text.split()
    for token in tokens:
        if len(token) > 8:
            entropy = calculate_shannon_entropy(token)
            if entropy > 3.5:
                results.append({
                    "type": "high_entropy_token",
                    "token_preview": token[:10],
                    "entropy": entropy
                })
    return results

def detect_base64(text: str) -> list[dict]:
    pattern3 = r'[A-Za-z0-9+/]+={0,2}'
    results = []
    # Split by common delimiters including '=' mapping appropriately or just normal whitespace
    # Using generic word splitting to find base64 candidates
    for token in text.split():
        if len(token) >= 20 and re.fullmatch(pattern3, token):
            results.append({
                "type": "base64_pattern",
                "sample": token[:20]
            })
    return results

def detect_hex_secrets(text: str) -> list[dict]:
    # Look for purely hex character combinations longer than 32 characters
    pattern = r"\b([0-9a-fA-F]{33,})\b"
    matches = re.findall(pattern, text)
    results = []
    for match in matches:
        results.append({
            "type": "hex_secret",
            "length": len(match)
        })
    return results
