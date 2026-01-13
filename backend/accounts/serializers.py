from rest_framework import serializers
from .models import User
from django.utils import timezone
from django.core.validators import validate_email
from django.core.exceptions import ValidationError as DjangoValidationError

class SignupSerializer(serializers.ModelSerializer):
    confirm_password = serializers.CharField(write_only=True)
    dob = serializers.DateField(required=False, allow_null=True)

    class Meta:
        model = User
        fields = [
            "full_name",
            "email",
            "password",
            "confirm_password",
            "dob",
            "profile_pic",
        ]
        extra_kwargs = {
            "password": {"write_only": True}
        }

    def validate(self, data):
        full_name = (data.get("full_name") or "").strip()
        if not full_name:
            raise serializers.ValidationError({"full_name": "Full name is required"})
        data["full_name"] = full_name

        email = (data.get("email") or "").strip().lower()
        if not email:
            raise serializers.ValidationError({"email": "Email is required"})
        try:
            validate_email(email)
        except DjangoValidationError:
            raise serializers.ValidationError({"email": "Enter a valid email address"})
        data["email"] = email

        if data["password"] != data["confirm_password"]:
            raise serializers.ValidationError("Passwords do not match")

        password = data.get("password") or ""
        if len(password) < 8:
            raise serializers.ValidationError({"password": "Password must be at least 8 characters"})
        if not any(c.islower() for c in password):
            raise serializers.ValidationError({"password": "Password must include a lowercase letter"})
        if not any(c.isupper() for c in password):
            raise serializers.ValidationError({"password": "Password must include an uppercase letter"})
        if not any(c.isdigit() for c in password):
            raise serializers.ValidationError({"password": "Password must include a number"})
        if not any(not c.isalnum() for c in password):
            raise serializers.ValidationError({"password": "Password must include a special character"})

        dob = data.get("dob")
        if dob and dob > timezone.now().date():
            raise serializers.ValidationError("Date of birth cannot be in future")

        profile_pic = data.get("profile_pic")
        if profile_pic:
            if getattr(profile_pic, "size", 0) > 5 * 1024 * 1024:
                raise serializers.ValidationError({"profile_pic": "Profile picture must be <= 5MB"})
            content_type = getattr(profile_pic, "content_type", "")
            if content_type and not content_type.startswith("image/"):
                raise serializers.ValidationError({"profile_pic": "Profile picture must be an image"})

        return data

    def create(self, validated_data):
        validated_data.pop("confirm_password")
        password = validated_data.pop("password")

        user = User(**validated_data)
        user.set_password(password)
        user.save()
        return user

class ProfileSerializer(serializers.ModelSerializer):
    email = serializers.ReadOnlyField()

    def validate_full_name(self, value):
        value = (value or "").strip()
        if not value:
            raise serializers.ValidationError("Full name is required")
        return value

    def validate_dob(self, value):
        if value and value > timezone.now().date():
            raise serializers.ValidationError("Date of birth cannot be in future")
        return value

    def validate_profile_pic(self, value):
        if value:
            if getattr(value, "size", 0) > 5 * 1024 * 1024:
                raise serializers.ValidationError("Profile picture must be <= 5MB")
            content_type = getattr(value, "content_type", "")
            if content_type and not content_type.startswith("image/"):
                raise serializers.ValidationError("Profile picture must be an image")
        return value

    class Meta:
        model = User
        fields = ["id", "full_name", "email", "dob", "profile_pic"]