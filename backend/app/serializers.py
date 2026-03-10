from rest_framework import serializers
from .models import MedicalReport


class MedicalReportSerializer(serializers.ModelSerializer):
    owner = serializers.SerializerMethodField()
    file_url = serializers.SerializerMethodField()

    class Meta:
        model = MedicalReport
        fields = [
            "id",
            "owner",
            "file_url",
            "original_name",
            "file_type",
            "extracted_text",
            "analysis_json",
            "created_at",
        ]
        read_only_fields = [
            "id",
            "owner",
            "file_url",
            "created_at",
        ]

    def get_owner(self, obj):
        return obj.user.username if obj.user else None

    def get_file_url(self, obj):
        request = self.context.get("request")
        if obj.file and hasattr(obj.file, "url"):
            if request:
                return request.build_absolute_uri(obj.file.url)
            return obj.file.url
        return None