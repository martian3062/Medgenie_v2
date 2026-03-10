from django.conf import settings
from django.db import models


class MedicalReport(models.Model):
    FILE_TYPE_CHOICES = [
        ("pdf", "PDF"),
        ("image", "Image"),
        ("unknown", "Unknown"),
    ]

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="medical_reports",
    )
    file = models.FileField(upload_to="reports/")
    original_name = models.CharField(max_length=255)
    file_type = models.CharField(
        max_length=20,
        choices=FILE_TYPE_CHOICES,
        default="unknown",
        blank=True,
    )
    extracted_text = models.TextField(blank=True, default="")
    analysis_json = models.JSONField(default=dict, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.id} - {self.user.username} - {self.original_name}"