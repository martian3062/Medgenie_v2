# Medicobot v3 Starter

Django + React starter with:
- OCR/text extraction for PDF and images
- Rule-based report analysis
- CBC/LFT/KFT table-style parsing
- Groq chatbot route
- GLB-ready 3D human model viewer with fallback primitive body
- Clickable body parts to filter findings
- Pulsing disease hotspot overlays
- Downloadable PDF summary
- SQLite by default, `DATABASE_URL` for Postgres/Supabase

## Backend
```bash
cd backend
python3.10 -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
copy .env.example .env
python manage.py makemigrations
python manage.py migrate
python manage.py runserver
```

## Frontend
```bash
cd frontend
npm install
npm run dev
```

If it is missing, the app falls back to a procedural hologram body.
