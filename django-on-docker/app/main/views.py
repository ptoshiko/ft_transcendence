from .models import CustomUser, Friendship, ChatMessage, BlockUser
from django.db import models
from rest_framework.response import Response
from . import serializers
from rest_framework import generics, views, status
from rest_framework.permissions import IsAuthenticated, AllowAny
from .permissions import IsOwnerOrReadOnly,  IsAdminOrReadnly
from django.shortcuts import render
from django.http import Http404

# [POST]:registration  required display_name, email and username 
class RegisterView(generics.CreateAPIView):
    queryset = CustomUser.objects.all()
    permission_classes = (AllowAny,)
    serializer_class = serializers.RegisterSerializer

# [GET] returns info of every user 
class CustomUserAPIList(generics.ListAPIView):
    queryset = CustomUser.objects.all()
    serializer_class = serializers.CustomUserSerializer
    permission_classes = (AllowAny,)

# [PUT] update owner's info
class CustomUserAPIUpdate(generics.UpdateAPIView):
    queryset = CustomUser.objects.all()
    serializer_class = serializers.UpdateSerializer 
    permission_classes = (IsOwnerOrReadOnly, IsAuthenticated)

# [GET] read info of certain user 
class CustomUserAPIRetrieve(generics.RetrieveAPIView):
    queryset = CustomUser.objects.all()
    serializer_class = serializers.CustomUserSerializer
    permission_classes = (IsAuthenticated,)

from .permissions import IsAdminOrReadnly
class CuestomUserAPIDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = CustomUser.objects.all()
    serializer_class = serializers.CustomUserSerializer
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
        serializer = serializers.CustomUserSerializer(friends, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)


# [GET] Retrieves friendships where the user is either sender or receiver and the status is PENDING
class FriendshipRequestsView(views.APIView):
    def get(self, request, *args, **kwargs):
        user = request.user

        friendship_requests = Friendship.objects.filter(models.Q(receiver=user, status=Friendship.PENDING))
        serializer = serializers.FriendshipRequestSerializer(friendship_requests, many=True)
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
        serializer = serializers.FriendshipSerializer(data=friendship_data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


# [PUT] approves a friend request from the particular user: friendship status=APPROVED
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

        serializer = serializers.FriendshipSerializer(friendship)
        return Response(serializer.data)
    

class BlockUserView(views.APIView):
    def post(self, request):
        blocked_user_id = request.data.get('blocked_user_id')
        blocked_by_id = request.user.id

        if not CustomUser.objects.filter(id=blocked_user_id).exists():
            return Response({'error': 'User to block does not exist'}, status=status.HTTP_404_NOT_FOUND)

        # Check if the blocking relationship already exists
        if BlockUser.objects.filter(blocked_by_id=blocked_by_id, blocked_user_id=blocked_user_id).exists():
            return Response({'error': 'User is already blocked'}, status=status.HTTP_400_BAD_REQUEST)

        # Create the blocking relationship
        BlockUser.objects.create(blocked_by_id=blocked_by_id, blocked_user_id=blocked_user_id)
        return Response({'message': 'User blocked successfully'}, status=status.HTTP_200_OK)
    
class UnblockUserView(views.APIView):
    def post(self, request):
        blocked_user_id = request.data.get('blocked_user_id')
        blocked_by_id = request.user.id

        # Check if the blocking relationship exists
        try:
            blocking_relationship = BlockUser.objects.get(blocked_by_id=blocked_by_id, blocked_user_id=blocked_user_id)
        except BlockUser.DoesNotExist:
            return Response({'error': 'User is not blocked'}, status=status.HTTP_400_BAD_REQUEST)

        # Delete the blocking relationship
        blocking_relationship.delete()
        return Response({'message': 'User unblocked successfully'}, status=status.HTTP_200_OK)


class GetMessagesView(views.APIView):
    def get(self, request, *args, **kwargs):
        user_id = request.user.id
        messages = ChatMessage.objects.filter(models.Q(sender_id=user_id) | models.Q(receiver_id=user_id)).order_by('-date_added')[:25]
        serializer = serializers.ChatMessageSerializer(messages, many=True)
        
        return Response(serializer.data, status=status.HTTP_200_OK)


class GetUserByDisplayName(views.APIView):
    def get(self, request, display_name, format=None):
        try:
            user = CustomUser.objects.get(display_name=display_name)
            serializer = serializers.CustomUserSerializer(user)
            return Response(serializer.data)
        except CustomUser.DoesNotExist:
            raise Http404

# for 2FA
from django.core.exceptions import ValidationError 
from django.views.generic import TemplateView 
from .services import user_two_factor_auth_data_create       

class SetupTwoFactorAuthView(TemplateView):
    template_name = "admin_2fa/setup_2fa.html"

    def post(self, request):
        context = {}
        user = request.user

        try:
            two_factor_auth_data = user_two_factor_auth_data_create(user=user)
            otp_secret = two_factor_auth_data.otp_secret

            context["otp_secret"] = otp_secret
            context["qr_code"] = two_factor_auth_data.generate_qr_code(
                name=user.email
            )
        except ValidationError as exc:
            context["form_errors"] = exc.messages

        return self.render_to_response(context)





def login(request):
    return render(request, "chat/login.html")

def index(request):
    return render(request, "chat/index.html")

def room(request, receiver_id):
    messages = ChatMessage.objects.filter(
        (models.Q(sender=request.user.id) | models.Q(sender__id=receiver_id)) &
        (models.Q(receiver=request.user.id) | models.Q(receiver__id=receiver_id))
    ).order_by('-date_added')[:25]

    return render(request, "chat/room.html", {"receiver_id": receiver_id, "messages": messages})