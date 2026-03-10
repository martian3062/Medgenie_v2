from django.urls import path
from .views import (
    health,
    signup_view,
    login_view,
    logout_view,
    me_view,
    report_list,
    report_detail,
    upload_report,
    chat_with_report,
    home_chat,
    healthcare_news,
    cancer_news,
    download_summary_pdf,
    create_consult_room,
    join_consult_room,
    consult_room_token,
)

urlpatterns = [
    path("health/", health),

    path("auth/signup/", signup_view),
    path("auth/login/", login_view),
    path("auth/logout/", logout_view),
    path("auth/me/", me_view),

    path("reports/", report_list),
    path("reports/upload/", upload_report),
    path("reports/<int:pk>/", report_detail),
    path("reports/<int:pk>/chat/", chat_with_report),
    path("reports/<int:pk>/summary-pdf/", download_summary_pdf),

    path("home-chat/", home_chat),

    path("news/healthcare/", healthcare_news),
    path("news/cancer/", cancer_news),

    path("doctor/rooms/create/", create_consult_room),
    path("doctor/rooms/join/", join_consult_room),
    path("doctor/rooms/<str:room_id>/token/", consult_room_token),
]