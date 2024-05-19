from django.contrib.auth.models import AbstractBaseUser, PermissionsMixin
from django.db import models
from django.utils import timezone
from django.utils.translation import gettext_lazy as _
from .utils import *
from .managers import CustomUserManager
import uuid

class CustomUser(AbstractBaseUser, PermissionsMixin):
    email = models.EmailField(_("email address"), unique=True)
    is_staff = models.BooleanField(default=False)
    is_active = models.BooleanField(default=True)
    date_joined = models.DateTimeField(default=timezone.now)
    display_name = models.CharField(_("display name"), unique=True, validators=[validate_display_name])
    avatar = models.ImageField(_("avatar"), upload_to='avatars/', blank=True, null=True, default='default-avatar.jpg')
    is_online = models.BooleanField(default=False)

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

    TEXT = 1
    GAMEID = 2
    TTID = 3
    CONTENT_TYPE = (
        (TEXT, 'Text'),
        (GAMEID, 'GameID'),
        (TTID, 'TournamentID')
    )
    content_type = models.IntegerField(choices=CONTENT_TYPE, default = TEXT)
    content = models.TextField()
    sender = models.ForeignKey(AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='message_sender')
    receiver = models.ForeignKey(AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='message_receiver')
    date_added = models.DateTimeField(auto_now_add=True)
    extra_details = models.TextField(default="")

    
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

class Tournament(models.Model):

    CREATED = 0
    IN_PROGRESS = 1
    FINISHED = 2
    CANCELED = 3
    STATUS_CHOICES = (
        (CREATED, 'Created'),
        (IN_PROGRESS, 'In progress'),
        (FINISHED, 'Finished'),
        (CANCELED, 'Canceled')
    )
    participants = models.ManyToManyField(AUTH_USER_MODEL, related_name='tournaments')
    created_at = models.DateTimeField(auto_now_add=True)
    schedule = models.JSONField(null=True, blank=True)
    current = models.IntegerField(default=0)
    participant_points = models.JSONField(default=dict)
    status = models.IntegerField(choices = STATUS_CHOICES, default = CREATED)
    tournament_id =  models.CharField(max_length=32, unique=True, default=0)
    invitation_status = models.JSONField(default=dict)

    def __str__(self):
        return f"Tournament {self.id}"

    def save(self, *args, **kwargs):
        if not self.tournament_id:
            self.tournament_id = str(uuid.uuid4().hex)[:32]  # Generate a unique ID

        super().save(*args, **kwargs)

    def generate_schedule(self):
        participant_ids = list(self.participants.values_list('id', flat=True))

        schedule = []

        for match in combinations(participant_ids, 2):
            schedule.append(match)

        self.schedule = schedule
        self.save()

    # def update_participant_points(self, participant_id, player_score, opponent_score):
    #     # Calculate points based on game scores
    #     if player_score > opponent_score:
    #         points = 1
    #     elif player_score < opponent_score:
    #         points = 0
    #     else:
    #         points = 0.5

    #     if participant_id in self.participant_points:
    #         self.participant_points[participant_id] += points
    #     else:
    #         self.participant_points[participant_id] = points

class PairGame(models.Model):
    CREATED = 0
    IN_PROGRESS = 1
    FINISHED = 2
    STATUS_CHOICES = (
        (CREATED, 'Created'),
        (IN_PROGRESS, 'In progress'),
        (FINISHED, 'Finished'),
    )

    player1 = models.ForeignKey(AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='player1')
    player2 = models.ForeignKey(AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='player2')
    is_present_1 = models.BooleanField(default=False)
    is_present_2 = models.BooleanField(default=False)
    game_id =  models.CharField(max_length=32, unique=True)
    date_created = models.DateTimeField(_("date_created"), auto_now_add=True)
    status = models.IntegerField(choices = STATUS_CHOICES, default = CREATED)

    player1_score = models.IntegerField(default=0)
    player2_score = models.IntegerField(default=0)

    tournament = models.ForeignKey(Tournament, on_delete=models.SET_NULL, null=True, blank=True)

    def save(self, *args, **kwargs):
        if not self.game_id:
            self.game_id = str(uuid.uuid4().hex)[:32]  # Generate a unique ID

        super().save(*args, **kwargs)



    

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
            issuer_name='Transcendence'
        )

        image_factory = qrcode.image.svg.SvgPathImage
        qr_code_image = qrcode.make(
            qr_uri,
            image_factory=image_factory
        )

        # The result is going to be an HTML <svg> tag
        svg_str = qr_code_image.to_string().decode('utf-8')

        # Remove escape characters (if there are any)
        clean_svg_str = svg_str.replace('\\"', '"').replace("\\'", "'")
        
        return clean_svg_str
    
    def validate_otp(self, otp: str) -> bool:
        totp = pyotp.TOTP(self.otp_secret)

        return totp.verify(otp)