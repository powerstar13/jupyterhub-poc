import hashlib
import base64

code_challenge = "S7A1MBFvWGXhY6PLWPh0yMiqo-TBkp5Tdl9_4jegI2w"
code_verifier = base64.urlsafe_b64encode(hashlib.sha256(code_challenge.encode()).digest()).decode().rstrip("=")

print("code_challenge:", code_challenge)
print("code_verifier:", code_verifier)