import secrets
import traceback

from django.contrib.auth import authenticate, login, logout, get_user_model
from django.core.cache import cache
from django.http import FileResponse
from django.shortcuts import get_object_or_404
from django.views.decorators.csrf import ensure_csrf_cookie

from rest_framework.decorators import api_view, parser_classes
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from rest_framework.response import Response
from rest_framework import status

from .models import MedicalReport
from .serializers import MedicalReportSerializer
from .services.extractor import extract_text_from_file, get_file_type
from .services.analysis import analyze_report_text
from .services.groq_service import GroqChatService
from .services.gemini_service import GeminiChatService
from .services.news_service import NewsService
from .services.pdf_summary import build_summary_pdf
from django.middleware.csrf import get_token
User = get_user_model()


def _require_auth(request):
    if not request.user.is_authenticated:
        return Response(
            {"error": "Authentication required."},
            status=status.HTTP_401_UNAUTHORIZED,
        )
    return None


def _serialize_user(user):
    return {
        "id": user.id,
        "username": user.username,
        "email": user.email,
        "is_authenticated": True,
    }


@ensure_csrf_cookie
@api_view(["GET"])
def health(request):
    csrf_token = get_token(request)
    return Response({
        "status": "ok",
        "csrfToken": csrf_token,
    })


@api_view(["POST"])
@parser_classes([JSONParser])
def signup_view(request):
    username = (request.data.get("username") or "").strip()
    email = (request.data.get("email") or "").strip()
    password = (request.data.get("password") or "").strip()
    confirm_password = (request.data.get("confirm_password") or "").strip()

    if not username or not email or not password or not confirm_password:
        return Response(
            {"error": "Username, email, password, and confirm_password are required."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    if len(username) < 3:
        return Response(
            {"error": "Username must be at least 3 characters long."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    if len(password) < 8:
        return Response(
            {"error": "Password must be at least 8 characters long."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    if password != confirm_password:
        return Response(
            {"error": "Passwords do not match."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    if User.objects.filter(username=username).exists():
        return Response(
            {"error": "Username already exists."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    if User.objects.filter(email=email).exists():
        return Response(
            {"error": "Email already exists."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    user = User.objects.create_user(
        username=username,
        email=email,
        password=password,
    )
    login(request, user)

    return Response(
        {
            "message": "Account created successfully.",
            "user": _serialize_user(user),
        },
        status=status.HTTP_201_CREATED,
    )


@api_view(["POST"])
@parser_classes([JSONParser])
def login_view(request):
    username = (request.data.get("username") or "").strip()
    password = (request.data.get("password") or "").strip()

    if not username or not password:
        return Response(
            {"error": "Username and password are required."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    user = authenticate(request, username=username, password=password)
    if not user:
        return Response(
            {"error": "Invalid credentials."},
            status=status.HTTP_401_UNAUTHORIZED,
        )

    login(request, user)

    return Response({
        "message": "Logged in successfully.",
        "user": _serialize_user(user),
    })


@api_view(["POST"])
def logout_view(request):
    if request.user.is_authenticated:
        logout(request)
    return Response({"message": "Logged out successfully."})


@api_view(["GET"])
def me_view(request):
    if not request.user.is_authenticated:
        return Response({
            "user": None,
            "is_authenticated": False,
        })

    return Response({
        "user": _serialize_user(request.user),
        "is_authenticated": True,
    })


@api_view(["GET"])
def report_list(request):
    auth_error = _require_auth(request)
    if auth_error:
        return auth_error

    reports = MedicalReport.objects.filter(user=request.user).order_by("-created_at")[:50]
    serializer = MedicalReportSerializer(
        reports,
        many=True,
        context={"request": request},
    )
    return Response(serializer.data)


@api_view(["GET"])
def report_detail(request, pk):
    auth_error = _require_auth(request)
    if auth_error:
        return auth_error

    report = get_object_or_404(MedicalReport, pk=pk, user=request.user)
    serializer = MedicalReportSerializer(report, context={"request": request})
    return Response(serializer.data)


@api_view(["POST"])
@parser_classes([MultiPartParser, FormParser])
def upload_report(request):
    auth_error = _require_auth(request)
    if auth_error:
        return auth_error

    uploaded = request.FILES.get("file")
    if not uploaded:
        return Response(
            {"error": "No file uploaded."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    report = MedicalReport.objects.create(
        user=request.user,
        file=uploaded,
        original_name=uploaded.name,
        file_type="unknown",
        extracted_text="",
        analysis_json={},
    )

    try:
        path = report.file.path
        print("[UPLOAD] Saved file path:", path)

        file_type = get_file_type(path)
        print("[UPLOAD] Detected file type:", file_type)

        extracted_text = extract_text_from_file(path) or ""
        print("[UPLOAD] Extracted text length:", len(extracted_text))

        analysis = analyze_report_text(extracted_text)
        print("[UPLOAD] Analysis generated successfully")

        report.file_type = file_type
        report.extracted_text = extracted_text
        report.analysis_json = analysis
        report.save()

    except Exception as exc:
        traceback.print_exc()
        report.delete()
        return Response(
            {
                "error": f"Failed to process uploaded report: {str(exc)}",
                "type": exc.__class__.__name__,
            },
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )

    serializer = MedicalReportSerializer(report, context={"request": request})
    return Response(serializer.data, status=status.HTTP_201_CREATED)


@api_view(["POST"])
@parser_classes([JSONParser])
def chat_with_report(request, pk):
    auth_error = _require_auth(request)
    if auth_error:
        return auth_error

    report = get_object_or_404(MedicalReport, pk=pk, user=request.user)

    question = (request.data.get("message") or "").strip()
    if not question:
        return Response(
            {"error": "Message is required."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    try:
        groq = GroqChatService()
        answer = groq.answer(
            report.extracted_text,
            report.analysis_json or {},
            question,
        )
    except Exception as exc:
        traceback.print_exc()
        return Response(
            {
                "error": f"Failed to generate report answer: {str(exc)}",
                "type": exc.__class__.__name__,
            },
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )

    return Response({"answer": answer})


@api_view(["POST"])
@parser_classes([JSONParser])
def home_chat(request):
    message = (request.data.get("message") or "").strip()
    if not message:
        return Response(
            {"error": "Message is required."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    try:
        gemini = GeminiChatService()
        answer = gemini.answer_home(message)
    except Exception as exc:
        traceback.print_exc()
        return Response(
            {
                "error": f"Homepage assistant failed: {str(exc)}",
                "type": exc.__class__.__name__,
            },
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )

    return Response({"answer": answer})


@api_view(["GET"])
def healthcare_news(request):
    try:
        service = NewsService()
        return Response(service.get_healthcare_news())
    except Exception as exc:
        traceback.print_exc()
        return Response(
            {
                "error": f"Failed to fetch healthcare news: {str(exc)}",
                "type": exc.__class__.__name__,
            },
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )


@api_view(["GET"])
def cancer_news(request):
    try:
        service = NewsService()
        return Response(service.get_cancer_news())
    except Exception as exc:
        traceback.print_exc()
        return Response(
            {
                "error": f"Failed to fetch cancer news: {str(exc)}",
                "type": exc.__class__.__name__,
            },
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )


@api_view(["GET"])
def download_summary_pdf(request, pk):
    auth_error = _require_auth(request)
    if auth_error:
        return auth_error

    report = get_object_or_404(MedicalReport, pk=pk, user=request.user)

    buffer = build_summary_pdf(report)
    filename = f"report_summary_{report.pk}.pdf"
    return FileResponse(buffer, as_attachment=True, filename=filename)


@api_view(["POST"])
@parser_classes([JSONParser])
def create_consult_room(request):
    auth_error = _require_auth(request)
    if auth_error:
        return auth_error

    room_id = secrets.token_urlsafe(16)
    room_data = {
        "room_id": room_id,
        "host_user_id": request.user.id,
        "host_username": request.user.username,
        "created_by": request.user.username,
        "participants": [request.user.id],
        "status": "waiting",
    }

    cache.set(f"doctor_room:{room_id}", room_data, timeout=60 * 60 * 6)

    return Response({
        "message": "Room created successfully.",
        "room": room_data,
    }, status=status.HTTP_201_CREATED)


@api_view(["POST"])
@parser_classes([JSONParser])
def join_consult_room(request):
    auth_error = _require_auth(request)
    if auth_error:
        return auth_error

    room_id = (request.data.get("room_id") or "").strip()
    if not room_id:
        return Response(
            {"error": "room_id is required."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    room_key = f"doctor_room:{room_id}"
    room_data = cache.get(room_key)

    if not room_data:
        return Response(
            {"error": "Room not found or expired."},
            status=status.HTTP_404_NOT_FOUND,
        )

    if request.user.id not in room_data["participants"]:
        room_data["participants"].append(request.user.id)

    room_data["status"] = "active"
    cache.set(room_key, room_data, timeout=60 * 60 * 6)

    return Response({
        "message": "Joined room successfully.",
        "room": room_data,
    })


@api_view(["POST"])
def consult_room_token(request, room_id):
    auth_error = _require_auth(request)
    if auth_error:
        return auth_error

    room_key = f"doctor_room:{room_id}"
    room_data = cache.get(room_key)

    if not room_data:
        return Response(
            {"error": "Room not found or expired."},
            status=status.HTTP_404_NOT_FOUND,
        )

    if request.user.id not in room_data.get("participants", []):
        return Response(
            {"error": "You are not a participant in this room."},
            status=status.HTTP_403_FORBIDDEN,
        )

    token = secrets.token_urlsafe(24)

    return Response({
        "room_id": room_id,
        "token": token,
        "ws_url": f"/ws/doctor-p2p/{room_id}/",
        "user": _serialize_user(request.user),
    })
