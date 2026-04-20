import sys
import os

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from detectors.regex_detector import scan_text
from detectors.nlp_detector import scan_with_nlp
from detectors.entropy_detector import check_entropy, detect_base64

test_text = """
Employee record for Rahul Sharma
Credit card: 4111 1111 1111 1111
Aadhaar: 2345 6789 0123
PAN: ABCDE1234F
Email: rahul.sharma@company.com
Phone: +91 98765 43210
api_key=sk-xK92mNvLpQ34rTyU8wZmNpQ
JWT: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.payload
Encoded: eyJuYW1lIjoiUmFodWwiLCJhYWRoYWFyIjoiMjM0NTY3ODkwMTIzIn0=
"""

print("=== REGEX RESULTS ===")
print(scan_text(test_text))

print("=== NLP RESULTS ===")  
print(scan_with_nlp(test_text))

print("=== ENTROPY RESULTS ===")
print(check_entropy(test_text))
print(detect_base64(test_text))
