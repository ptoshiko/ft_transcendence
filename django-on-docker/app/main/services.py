from django.core.exceptions import ValidationError

import pyotp

from .models import UserTwoFactorAuthData, Friendship, ChatMessage
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

def get_friendships_db(user):
    friendships = Friendship.objects.filter(
            models.Q(sender=user, status=Friendship.APPROVED) | models.Q(receiver=user, status=Friendship.APPROVED))
    return friendships

def get_friendship_request_db(user):
    friendship_requests = Friendship.objects.filter(models.Q(receiver=user, status=Friendship.PENDING))
    return friendship_requests


def are_already_friends(sender, receiver):
        return Friendship.objects.filter(
            (models.Q(sender=sender) & models.Q(receiver=receiver, status=Friendship.APPROVED)) |
            (models.Q(sender=receiver) & models.Q(receiver=sender, status=Friendship.APPROVED))
        ).exists()

def is_friend_request_already_sent(sender, receiver):
    return Friendship.objects.filter(sender=sender, receiver=receiver, status=Friendship.PENDING).exists()

def approve_pending_friend_request(sender, receiver):
    try:
        pending_request = Friendship.objects.get(sender=receiver, receiver=sender, status=Friendship.PENDING)
    except Friendship.DoesNotExist:
        return False

    pending_request.status = Friendship.APPROVED
    pending_request.save()
    return True

# def send_friend_request(sender, receiver):
#     friendship_data = {'sender': sender.id, 'receiver': receiver.id}
#     serializer = serializers.FriendshipSerializer(data=friendship_data)
    
#     if serializer.is_valid():
#         serializer.save()
#         return True, serializer.data
#     return False, serializer.errors

    # def _send_friend_request(self, sender, receiver):
    #     friendship_data = {'sender': sender.id, 'receiver': receiver.id}
    #     serializer = serializers.FriendshipSerializer(data=friendship_data)
        
    #     if serializer.is_valid():
    #         serializer.save()
    #         return Response(serializer.data, status=status.HTTP_201_CREATED)
    #     return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


def get_messages_db(user_id):
    messages = ChatMessage.objects.filter(models.Q(sender_id=user_id) | models.Q(receiver_id=user_id)).order_by('-date_added')[:25]
    return messages