import os

from google import genai

SYSTEM_PROMPT = """
You are the homepage health assistant for Med Holo AI.
You are not a doctor.
Do not give a final diagnosis.
Answer general health questions in a simple, calm, friendly way.
If the user needs report-specific interpretation, suggest uploading a report.
Always remind the user to confirm important medical decisions with a qualified doctor.
Keep answers concise but helpful.
""".strip()


class GeminiChatService:
    def __init__(self):
        self.api_key = os.getenv("GEMINI_API_KEY", "").strip()
        self.model = os.getenv("GEMINI_MODEL", "gemini-2.5-flash").strip()
        self.client = genai.Client(api_key=self.api_key) if self.api_key else None

    def answer_home(self, question: str) -> str:
        if not self.client:
            return "Gemini is not configured. Add GEMINI_API_KEY in backend/.env."

        prompt = (
            f"{SYSTEM_PROMPT}\n\n"
            f"User question: {question}\n\n"
            "Respond helpfully. If needed, suggest uploading a medical report for deeper analysis."
        )

        try:
            response = self.client.models.generate_content(
                model=self.model,
                contents=prompt,
            )
            return (response.text or "").strip() or "No response generated."
        except Exception as e:
            return f"Gemini request failed: {str(e)}"