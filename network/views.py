from django.contrib.auth import authenticate, login, logout
from django.db import IntegrityError
from django.http import HttpResponse, HttpResponseRedirect,JsonResponse
from django.shortcuts import render
from django.urls import reverse
from django.contrib.auth.decorators import login_required
import json
from django.core.paginator import Paginator,EmptyPage

from .models import Profile, User,Post


def index(request):
    return render(request, "network/index.html")


def login_view(request):
    if request.method == "POST":

        # Attempt to sign user in
        username = request.POST["username"]
        password = request.POST["password"]
        user = authenticate(request, username=username, password=password)

        # Check if authentication successful
        if user is not None:
            login(request, user)
            return HttpResponseRedirect(reverse("index"))
        else:
            return render(request, "network/login.html", {
                "message": "Invalid username and/or password."
            })
    else:
        return render(request, "network/login.html")


def logout_view(request):
    logout(request)
    return HttpResponseRedirect(reverse("index"))


def register(request):
    if request.method == "POST":
        username = request.POST["username"]
        email = request.POST["email"]

        # Ensure password matches confirmation
        password = request.POST["password"]
        confirmation = request.POST["confirmation"]
        if password != confirmation:
            return render(request, "network/register.html", {
                "message": "Passwords must match."
            })

        # Attempt to create new user
        try:
            user = User.objects.create_user(username, email, password)
            user.save()
        except IntegrityError:
            return render(request, "network/register.html", {
                "message": "Username already taken."
            })
        login(request, user)
        return HttpResponseRedirect(reverse("index"))
    else:
        return render(request, "network/register.html")

@login_required
def new_post(request):
    # accept only POST requests
    if request.method != "POST":
        return JsonResponse({"error": "POST request required."}, status=400)
    #get data from the POST request
    data = json.loads(request.body)
    comment_body = data.get('body')

    new_post = Post(body = comment_body, author = request.user)
    new_post.save()

    return JsonResponse({'success': 'post posted'}, status = 200)

def all_posts(request,page):
    #get all posts in reverse order
    posts = Post.objects.all()
    posts = posts.order_by('-created_on').all()

    # Show 10 posts per page.
    paginator = Paginator(posts, 10) 
    # page_number = request.GET.get('page')
    # page_obj = paginator.get_page(page_number)
    
    this_page = paginator.page(page)
    previous_page = this_page.has_previous()
    next_page = this_page.has_next()

    try:
        next_page_num = this_page.next_page_number()
    except EmptyPage:
        next_page_num = None

    try:
        prev_page_num = this_page.previous_page_number()
    except EmptyPage:
        prev_page_num = None
    
    #using the serializer function created in the post model class
    return JsonResponse({'posts': [post.serialize() for post in this_page.object_list],
                         'pages': paginator.num_pages,
                         'has_previous': previous_page,
                         'has_next': next_page,
                         'next_page_num': next_page_num,
                         'prev_page_num': prev_page_num,
                         'current_page': this_page.number
                         }, safe=False)

def profile_id(request, user_id):
    #get info based on the user id
    user = User.objects.get(pk = user_id)
    profile_info = Profile.objects.filter(user = user)

    users_posts = Post.objects.filter(author = user)

    posts = [post.serialize() for post in users_posts]
    info = [info.serialize() for info in profile_info]
    
    # if request.user in profile_info.followers.all():
    #     print(profile_info.followers)
    return JsonResponse({'posts': posts, 'info': info}, safe= False)

@login_required
def toggle_follow(request):
    # make sure its a put method
    if request.method != 'PUT':
        return JsonResponse('not allowed', safe= False)
    data = json.loads(request.body)
    if data.get('username') is not None:
        print(data['username'])
        # get the person
        person = User.objects.get(username = data['username'])
        # get the person's profile
        profile= Profile.objects.get(user = person)


        if Profile.objects.filter(user= person, followers=request.user).exists():
            profile.followers.remove(request.user)
        else:
            profile.followers.add(request.user)
        profile.save()
        print(profile.followers.all())
        return HttpResponse(status = 204)

@login_required
def following(request,page):
    # get the ppl the current users follows
    following_profiles = Profile.objects.filter(followers = request.user)
    #make a list of the user's
    following_list = []
    for profile in following_profiles:
        name = profile.user.username
        following_list.append(name)
    #query the posts model for the posts of users in the list
    posts = Post.objects.filter(author__username__in = following_list).order_by('-created_on').all()

    paginator = Paginator(posts, 10)
    
    this_page = paginator.page(page)
    previous_page = this_page.has_previous()
    next_page = this_page.has_next()

    try:
        next_page_num = this_page.next_page_number()
    except EmptyPage:
        next_page_num = None

    try:
        prev_page_num = this_page.previous_page_number()
    except EmptyPage:
        prev_page_num = None  
    #using the serializer function created in the post model class
    return JsonResponse({'posts': [post.serialize() for post in this_page.object_list],
                         'pages': paginator.num_pages,
                         'has_previous': previous_page,
                         'has_next': next_page,
                         'next_page_num': next_page_num,
                         'prev_page_num': prev_page_num,
                         'current_page': this_page.number
                         }, safe=False)

@login_required
def edit_post(request, post_id):
    #make sure it's a PUT request
    if request.method != 'PUT':
        return JsonResponse('not allowed', safe= False)
    data = json.loads(request.body)
    if data.get('body') is not None:
        #get the post and update the body to new body
        print(data['body'])
        Post.objects.filter(pk = post_id).update(body = data['body'])
        return HttpResponse(status = 204)
    if data.get('like') is not None:
        #check if current user liked the post
        if Post.objects.filter(pk = post_id, likes = request.user).exists():
            #if the user liked it, remove from likers
            Post.objects.get(pk = post_id).likes.remove(request.user)
            current_likers = Post.objects.get(pk = post_id).likes.all()
            return JsonResponse({'likers': [liker.username for liker in current_likers]}, safe=False)
        else:
            #add them to the likers
            Post.objects.get(pk = post_id).likes.add(request.user)
            current_likers = Post.objects.get(pk = post_id).likes.all()
            return JsonResponse({'likers': [liker.username for liker in current_likers]}, safe=False)