
from django.urls import path

from . import views

urlpatterns = [
    path("", views.index, name="index"),
    path("login", views.login_view, name="login"),
    path("logout", views.logout_view, name="logout"),
    path("register", views.register, name="register"),

    # API routes
    path("new_post", views.new_post, name="new_post"),
    path("all_posts/<int:page>",views.all_posts, name = "new_post"),
    path("profile/<int:user_id>", views.profile_id, name = "profile_id"),
    path("follow",views.toggle_follow, name = "toggle_follow"),
    path("following/<int:page>",views.following, name = "following"),
    path("edit/<int:post_id>",views.edit_post, name = "edit_post"),
]
