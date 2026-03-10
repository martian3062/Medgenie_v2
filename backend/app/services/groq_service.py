import os

try:
    from groq import Groq
except Exception:
    Groq = None

REPORT_SYSTEM_PROMPT = """
You are a medical report explanation assistant for Med Holo AI.
Do not present yourself as a doctor.
Do not give a final diagnosis.
Explain findings simply and carefully.
Use the uploaded report text and structured analysis context.
Always tell the user to confirm important medical decisions with a qualified doctor.
""".strip()


class GroqChatService:
    def __init__(self):
        self.api_key = os.getenv("GROQ_API_KEY", "").strip()
        self.model = os.getenv("GROQ_MODEL", "openai/gpt-oss-120b").strip()
        self.reasoning_effort = os.getenv("GROQ_REASONING_EFFORT", "medium").strip()
        self.client = Groq(api_key=self.api_key) if (Groq and self.api_key) else None

    def _create_completion(self, messages):
        if not self.client:
            return None

        payload = {
            "model": self.model,
            "messages": messages,
            "temperature": 0.2,
            "max_completion_tokens": 1024,
            "top_p": 1,
            "stream": False,
        }

        try:
            payload["reasoning_effort"] = self.reasoning_effort
            return self.client.chat.completions.create(**payload)
        except TypeError:
            payload.pop("reasoning_effort", None)
            return self.client.chat.completions.create(**payload)

    def answer(self, report_text: str, analysis: dict, question: str) -> str:
        if not self.client:
            return "Groq is not configured. Add GROQ_API_KEY in backend/.env."

        analysis = analysis or {}

        context = f"""
Report text:
{(report_text or '')[:12000]}

Analysis summary:
Summary: {analysis.get('summary')}
Primary region: {analysis.get('primary_region')}
Regions: {analysis.get('regions')}
Findings: {analysis.get('findings')}
Lab panels: {analysis.get('lab_panels')}
Abnormal labs: {analysis.get('abnormal_labs')}
Risk notes: {analysis.get('risk_notes')}
Recommendations: {analysis.get('recommendations')}
""".strip()

        messages = [
            {"role": "system", "content": REPORT_SYSTEM_PROMPT},
            {
                "role": "user",
                "content": (
                    f"{context}\n\n"
                    f"User question: {question}\n\n"
                    "Answer in a medically careful, simple, structured way. "
                    "Do not claim diagnosis certainty. "
                    "Mention when the user should confirm with a doctor."
                ),
            },
        ]

        try:
            completion = self._create_completion(messages)
            if not completion:
                return "Groq is not configured. Add GROQ_API_KEY in backend/.env."

            choice = completion.choices[0]
            content = getattr(choice.message, "content", None)
            return content or "No response generated."
        except Exception as e:
            return f"Groq request failed: {str(e)}"