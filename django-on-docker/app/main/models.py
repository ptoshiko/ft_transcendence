from django.contrib.auth.models import AbstractBaseUser, PermissionsMixin
from django.db import models
from django.utils import timezone
from django.utils.translation import gettext_lazy as _
from .utils import validate_display_name
from .managers import CustomUserManager

class CustomUser(AbstractBaseUser, PermissionsMixin):
    email = models.EmailField(_("email address"), unique=True)
    is_staff = models.BooleanField(default=False)
    is_active = models.BooleanField(default=True)
    date_joined = models.DateTimeField(default=timezone.now)
    display_name = models.CharField(_("display name"), unique=True, validators=[validate_display_name])
    # User profiles display stats, such as wins and losses.
    # - stats  
    # - avatar = models.ImageField(upload_to=files/avatars)


    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = []

    objects = CustomUserManager()

    def __str__(self):
        return self.email
        
AUTH_USER_MODEL = "main.CustomUser"

class Friendship(models.Model):

    PENDING = 1
    APPROVED = 2
    STATUS_CHOICES = (
        (PENDING, 'Pending'),
        (APPROVED, 'Approved'),
    )

    sender = models.ForeignKey(AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='sender')
    receiver = models.ForeignKey(AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='receiver')
    status = models.IntegerField(choices=STATUS_CHOICES, default=PENDING)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(fields=['sender', 'receiver'], name='unique_friendship')
        ]

    def __str__(self):
        return f"{self.sender.display_name} <-> {self.sender.display_name} (Status: {self.status})"


class ChatMessage(models.Model):
    content = models.TextField()
    sender = models.ForeignKey(AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='message_sender')
    receiver = models.ForeignKey(AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='message_receiver')
    date_added = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ('date_added',)


class BlockUser(models.Model):
    blocked_by = models.ForeignKey(AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='blocked_by')
    blocked_user = models.ForeignKey(AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='blocked_user')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(fields=['blocked_by', 'blocked_user'], name='unique_bloking')
        ]
