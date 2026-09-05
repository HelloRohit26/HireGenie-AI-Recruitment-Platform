import os
from sarvamai import SarvamAI

client = SarvamAI(
    api_subscription_key=os.getenv("SARVAM_API_KEY", ""),
)

response = client.text_to_speech.convert(
    model="bulbul:v3",
    text="नमस्ते, आज मैं आपकी क्या मदद कर सकता हूँ?",
    language_code="hi-IN",
    speaker="shubh",
)

print(response)