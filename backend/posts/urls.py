from django.urls import path
from .views import (
    PostListCreateView,
    PostDeleteView,
    LikePostView,
    DislikePostView,
)

urlpatterns = [
    path("", PostListCreateView.as_view()),
    path("<int:pk>/", PostDeleteView.as_view()),
    path("<int:pk>/like/", LikePostView.as_view()),
    path("<int:pk>/dislike/", DislikePostView.as_view()),
]
