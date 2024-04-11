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
 
    # - avatar = models.ImageField(upload_to=files/avatars)

    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = []

    objects = CustomUserManager()

    def __str__(self):
        return self.email
        
AUTH_USER_MODEL = "main.CustomUser"


class MatchHistory(models.Model):
    player1 = models.ForeignKey(AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='matches_played')
    player2 = models.ForeignKey(AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='matches_opponent')
    player1_result = models.IntegerField(default=0)
    player2_result = models.IntegerField(default=0)

    match_date = models.DateTimeField(_("match date"), auto_now_add=True)

    def __str__(self):
        return f"{self.user.email} vs {self.opponent.email} - {self.result}"

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



# for 2FA
from typing import Optional

from django.db import models
from django.conf import settings

import pyotp
import qrcode
import qrcode.image.svg

class UserTwoFactorAuthData(models.Model):
    user = models.OneToOneField(
        AUTH_USER_MODEL,
        related_name='two_factor_auth_data',
        on_delete=models.CASCADE
    )

    otp_secret = models.CharField(max_length=255)

    def generate_qr_code(self, name: Optional[str] = None) -> str:
        totp = pyotp.TOTP(self.otp_secret)
        qr_uri = totp.provisioning_uri(
            name=name,
            issuer_name='Styleguide Example Admin 2FA Demo'
        )

        image_factory = qrcode.image.svg.SvgPathImage
        qr_code_image = qrcode.make(
            qr_uri,
            image_factory=image_factory
        )

        # The result is going to be an HTML <svg> tag
        return qr_code_image.to_string().decode('utf_8')
    
    def validate_otp(self, otp: str) -> bool:
        totp = pyotp.TOTP(self.otp_secret)

        return totp.verify(otp)