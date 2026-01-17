from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import permissions, status
from django.shortcuts import get_object_or_404
from .models import Post
from .serializers import PostSerializer

class PostListCreateView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        posts = Post.objects.all().order_by("-created_at")
        serializer = PostSerializer(posts, many=True, context={"request": request})
        return Response(serializer.data)

    def post(self, request):
        serializer = PostSerializer(data=request.data)
        if serializer.is_valid():
            post = serializer.save(user=request.user)
            out = PostSerializer(post, context={"request": request})
            return Response(out.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class PostDeleteView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def delete(self, request, pk):
        try:
            post = Post.objects.get(pk=pk, user=request.user)
            post.delete()
            return Response({"message": "Post deleted"})
        except Post.DoesNotExist:
            return Response({"error": "Not allowed"}, status=403)


class LikePostView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, pk):
        post = get_object_or_404(Post, pk=pk)

        user_id = request.user.id
        liked_ids = post.liked_by or []
        disliked_ids = post.disliked_by or []

        if user_id in liked_ids:
            liked_ids.remove(user_id)
            user_liked = False
        else:
            liked_ids.append(user_id)
            user_liked = True
            if user_id in disliked_ids:
                disliked_ids.remove(user_id)

        post.liked_by = liked_ids
        post.disliked_by = disliked_ids
        post.likes = len(liked_ids)
        post.dislikes = len(disliked_ids)
        post.save(update_fields=["liked_by", "disliked_by", "likes", "dislikes"])

        return Response(
            {
                "likes": post.likes,
                "dislikes": post.dislikes,
                "user_liked": user_liked,
                "user_disliked": user_id in disliked_ids,
            }
        )


class DislikePostView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, pk):
        post = get_object_or_404(Post, pk=pk)

        user_id = request.user.id
        liked_ids = post.liked_by or []
        disliked_ids = post.disliked_by or []

        if user_id in disliked_ids:
            disliked_ids.remove(user_id)
            user_disliked = False
        else:
            disliked_ids.append(user_id)
            user_disliked = True
            if user_id in liked_ids:
                liked_ids.remove(user_id)

        post.liked_by = liked_ids
        post.disliked_by = disliked_ids
        post.likes = len(liked_ids)
        post.dislikes = len(disliked_ids)
        post.save(update_fields=["liked_by", "disliked_by", "likes", "dislikes"])

        return Response(
            {
                "likes": post.likes,
                "dislikes": post.dislikes,
                "user_liked": user_id in liked_ids,
                "user_disliked": user_disliked,
            }
        )
