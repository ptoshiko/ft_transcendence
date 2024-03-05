from .models import CustomUser, Friendship, Message
from django.db import models
from rest_framework.response import Response
from .serializers import CustomUserSerializer, RegisterSerializer, UpdateSerializer, FriendshipSerializer, FriendshipRequestSerializer
from rest_framework import generics, views, status
from rest_framework.permissions import IsAuthenticated, AllowAny
from .permissions import IsOwnerOrReadOnly,  IsAdminOrReadnly
from django.shortcuts import render

# [POST]:registration  required display_name, email and username 
class RegisterView(generics.CreateAPIView):
    queryset = CustomUser.objects.all()
    permission_classes = (AllowAny,)
    serializer_class = RegisterSerializer

# [GET] returns info of every user 
class CustomUserAPIList(generics.ListAPIView):
    queryset = CustomUser.objects.all()
    serializer_class = CustomUserSerializer
    permission_classes = (AllowAny,)

# [PUT] update owner's info
class CustomUserAPIUpdate(generics.UpdateAPIView):
    queryset = CustomUser.objects.all()
    serializer_class = UpdateSerializer 
    permission_classes = (IsOwnerOrReadOnly, IsAuthenticated)

# [GET] read info of certain user 
class CustomUserAPIRetrieve(generics.RetrieveAPIView):
    queryset = CustomUser.objects.all()
    serializer_class = CustomUserSerializer
    permission_classes = (IsAuthenticated,)

from .permissions import IsAdminOrReadnly
class CuestomUserAPIDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = CustomUser.objects.all()
    serializer_class = CustomUserSerializer
    permission_classes = (IsAdminOrReadnly,)


# [GET] Retrieves friendships where the user is either sender or receiver and the status is approved 
class FriendsListView(views.APIView):
    def get(self, request, *args, **kwargs):
        user = request.user 

        friendships = Friendship.objects.filter(
            models.Q(sender=user, status=Friendship.APPROVED) | models.Q(receiver=user, status=Friendship.APPROVED))

        friend_ids = set()
        for friendship in friendships:
            friend_ids.add(friendship.sender_id)
            friend_ids.add(friendship.receiver_id)

        friend_ids.discard(user.id)

        friends = CustomUser.objects.filter(id__in=friend_ids)
        serializer = CustomUserSerializer(friends, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)


# [GET] Retrieves friendships where the user is either sender or receiver and the status is PENDING
class FriendshipRequestsView(views.APIView):
    def get(self, request, *args, **kwargs):
        user = request.user

        friendship_requests = Friendship.objects.filter(models.Q(receiver=user, status=Friendship.PENDING))
        serializer = FriendshipRequestSerializer(friendship_requests, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)



# [POST] sends a friend request to the particular user: makes a new row in friendship table with status PENDING
# required receiver_id
#  body example {"receiver_id": 6}
class SendFriendRequestView(views.APIView):
    def post(self, request, *args, **kwargs):
        sender = request.user  
        receiver_id = request.data.get('receiver_id')  

        try:
            receiver = CustomUser.objects.get(id=receiver_id)
        except CustomUser.DoesNotExist:
            return Response({"error": "Receiver does not exist"}, status=status.HTTP_404_NOT_FOUND)

        if Friendship.objects.filter(sender=sender, receiver=receiver).exists():
            return Response({"error": "Friendship already exists"}, status=status.HTTP_400_BAD_REQUEST)

        friendship_data = {'sender': sender.id, 'receiver': receiver.id}
        serializer = FriendshipSerializer(data=friendship_data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


# [POST] approves a friend request from the particular user: friendship status=APPROVED
# required friendship_id
#  body example {"friendship_id": 1}
class ApproveFriendRequestView(views.APIView):
    def put(self, request, *args, **kwargs):
        friendship_id = request.data.get('friendship_id')  
        try:
            friendship = Friendship.objects.get(id=friendship_id)
        except Friendship.DoesNotExist:
            return Response({"error": "Friendship request does not exist"}, status=status.HTTP_404_NOT_FOUND)

        if request.user != friendship.receiver:
            return Response({"error": "You do not have permission to approve this request"}, status=status.HTTP_403_FORBIDDEN)

        friendship.status = Friendship.APPROVED 
        friendship.save()

        serializer = FriendshipSerializer(friendship)
        return Response(serializer.data)


def index(request):
    return render(request, "chat/index.html")


def room(request, room_name):
    messages = Message.objects.filter(room=room_name)[0:25]
    return render(request, "chat/room.html", {"room_name": room_name, 'messages': messages})

