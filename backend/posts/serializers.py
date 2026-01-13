from rest_framework import serializers
from .models import Post

class PostSerializer(serializers.ModelSerializer):
    user_name = serializers.CharField(source="user.full_name", read_only=True)
    user_pic = serializers.ImageField(source="user.profile_pic", read_only=True)
    user_liked = serializers.SerializerMethodField()
    user_disliked = serializers.SerializerMethodField()

    def get_user_liked(self, obj):
        request = self.context.get("request")
        if not request or not request.user or not request.user.is_authenticated:
            return False
        return obj.liked_by.filter(pk=request.user.pk).exists()

    def get_user_disliked(self, obj):
        request = self.context.get("request")
        if not request or not request.user or not request.user.is_authenticated:
            return False
        return obj.disliked_by.filter(pk=request.user.pk).exists()

    def validate(self, attrs):
        description = (attrs.get("description") or "").strip()
        image = attrs.get("image")

        if not description and not image:
            raise serializers.ValidationError("Post must have text or an image")

        attrs["description"] = description

        if image:
            if getattr(image, "size", 0) > 8 * 1024 * 1024:
                raise serializers.ValidationError({"image": "Post image must be <= 8MB"})
            content_type = getattr(image, "content_type", "")
            if content_type and not content_type.startswith("image/"):
                raise serializers.ValidationError({"image": "Post file must be an image"})

        return attrs

    class Meta:
        model = Post
        fields = "__all__"
        read_only_fields = ["user", "likes", "dislikes"]
