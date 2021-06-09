from django.contrib.auth.models import AbstractUser
from django.db import models
from django.utils import timezone

class User(AbstractUser):
    pass

class Post(models.Model):
    body = models.CharField(max_length=255, blank=True)
    created_on = models.DateTimeField(default=timezone.now)
    author = models.ForeignKey(User, on_delete=models.CASCADE)
    likes = models.ManyToManyField(User, blank=True, related_name='likes')
        
    def serialize(self):
        return {
            "id": self.id,
            "body": self.body,
            "created_on": self.created_on.strftime("%b %d %Y, %I:%M %p"),
            "author": self.author.username,
            "author_id":self.author.pk,
            "likes": [user.username for user in self.likes.all()],
        }
    def __str__(self) -> str:
        return f'{self.author.username} posted {self.body}'
# TO DO LATER AFTER SUBMISSION
class Comments(models.Model):
    comment = models.CharField(max_length=255, blank=True)
    created_on = models.DateTimeField(default=timezone.now)
    author = models.ForeignKey(User, on_delete=models.CASCADE)
    post = models.ForeignKey(Post, on_delete=models.CASCADE)
    likes = models.ManyToManyField(User, blank=True, related_name='comment_likes', default= 0)
    dislikes = models.ManyToManyField(User, blank=True, related_name='comment_dislikes', default= 0)
    
    class Meta:
        verbose_name_plural = 'Comments'

    def __str__(self):
        return f'{self.author.username} commented {self.comment}'

'''CHECK OUT SIGNALS.PY AND APP.PY FILES FOR HOW THE PROFILE IS CREATED WHEN 
    EACH USER INSTANCE IS MADE DURING REGISTRATION'''
class Profile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE)
    followers = models.ManyToManyField(User, blank=True, related_name='followers')

    def __str__(self):
        return f'{self.user.username} Profile'
    
    def count_followers(self):
        return self.followers.count()
    
    def count_following(self):
        return Profile.objects.filter(followers = self.user).count()
    
    def serialize(self):
        return {
            "id": self.id,
            "username":self.user.username,
            "followers":[user.username for user in self.followers.all()],
            "followers_count": self.followers.count(),
            "following_count": Profile.objects.filter(followers = self.user).count()
        }
