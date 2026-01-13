from django.urls import path
from .views import SignupView, ProfileView
from rest_framework_simplejwt.views import TokenObtainPairView

urlpatterns = [
    path("signup/", SignupView.as_view()),
    path("login/", TokenObtainPairView.as_view()),
    path("profile/", ProfileView.as_view()),
]
