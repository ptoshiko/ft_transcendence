from django.core.exceptions import ValidationError
import pyotp
from .models import UserTwoFactorAuthData, Friendship, ChatMessage, BlockUser, MatchHistory
from django.db import models


def user_two_factor_auth_data_create(*, user) -> UserTwoFactorAuthData:
    if hasattr(user, 'two_factor_auth_data'):
        raise ValidationError(
            'Can not have more than one 2FA related data.'
        )

    two_factor_auth_data = UserTwoFactorAuthData.objects.create(
        user=user,
        otp_secret=pyotp.random_base32()
    )

    return two_factor_auth_data

def check_if_object_exists(model, object_id):
    try:
        obj = model.objects.get(id=object_id)
        return obj
    except model.DoesNotExist:
        return None
    
def check_if_exists_by_str(model, display_name):
    try:
        obj = model.objects.get(display_name=display_name)
        return obj
    except model.DoesNotExist:
        return None
        

def get_friendships_db(user):
    friendships = Friendship.objects.filter(
            models.Q(sender=user, status=Friendship.APPROVED) | models.Q(receiver=user, status=Friendship.APPROVED))
    return friendships

def get_friendship_requests(user):
    friendship_requests = Friendship.objects.filter(models.Q(receiver=user, status=Friendship.PENDING))
    return friendship_requests


def are_friends(sender, receiver):
        return Friendship.objects.filter(
            (models.Q(sender=sender) & models.Q(receiver=receiver, status=Friendship.APPROVED)) |
            (models.Q(sender=receiver) & models.Q(receiver=sender, status=Friendship.APPROVED))
        ).exists()

def approve_pending_friend_request(friendship):
    friendship.status = Friendship.APPROVED
    friendship.save()

def get_messages_db(user_id):
    messages = ChatMessage.objects.filter(models.Q(sender_id=user_id) | models.Q(receiver_id=user_id)).order_by('-date_added')[:25]
    return messages

def get_friendship_pending(sender, receiver):
    try:
        friendship = Friendship.objects.get(sender=sender, receiver=receiver, status=Friendship.PENDING)
        return friendship
    except Friendship.DoesNotExist:
        return None
    
def get_friendship_approved(sender, receiver):
    try:
        friendship = Friendship.objects.get(sender=sender, receiver=receiver, status=Friendship.APPROVED)
        return friendship
    except Friendship.DoesNotExist:
        return None

def check_is_blocked(blocked_by_id, blocked_user_id):
    try:
        blocking_relationship = BlockUser.objects.get(blocked_by_id=blocked_by_id, blocked_user_id=blocked_user_id)
        return blocking_relationship
    except BlockUser.DoesNotExist:
        return None

def get_blocked_user_ids(user):
    blocked_user_ids = BlockUser.objects.filter(blocked_by=user).values_list('blocked_user_id', flat=True)
    return blocked_user_ids

def create_blocking_record(blocked_by_id, blocked_user_id):
    BlockUser.objects.create(blocked_by_id=blocked_by_id, blocked_user_id=blocked_user_id)

def get_match_history(user_id):
    match_history = MatchHistory.objects.filter(models.Q(player1=user_id) | models.Q(player2=user_id)).order_by('-match_date')
    return match_history

def get_wins(user):
    wins = MatchHistory.objects.filter(player1=user, player1_result=1).count() + \
               MatchHistory.objects.filter(player2=user, player2_result=1).count()
    return wins

def get_loses(user):
    losses = MatchHistory.objects.filter(player1=user, player1_result=0).count() + \
            MatchHistory.objects.filter(player2=user, player2_result=0).count()
    return losses

def get_last_chat_users(user): 

    last_chat_users = ChatMessage.objects.filter(
                models.Q(sender=user) | models.Q(receiver=user)
            ).order_by('-date_added').values_list('sender', 'receiver').distinct()[:10]
    return last_chat_users
    