from .models import CustomUser, Friendship, ChatMessage, BlockUser, MatchHistory
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

class GetUserMe(views.APIView):
    def get(self, request):
        user_id = request.user.id
        user = CustomUser.objects.get(id=user_id)
        serializer = serializers.CustomUserSerializer(user)
        return Response(serializer.data)

# for 2FA
from django.core.exceptions import ValidationError 
from django.views.generic import TemplateView 
from .services import user_two_factor_auth_data_create       

class SetupTwoFactorAuthView(views.APIView):
    def post(self, request):
        user = request.user
        context = {}

        try:
            two_factor_auth_data = user_two_factor_auth_data_create(user=user)
            otp_secret = two_factor_auth_data.otp_secret

            context["otp_secret"] = otp_secret
            context["qr_code"] = two_factor_auth_data.generate_qr_code(
                name=user.email
            )

            return Response(context, status=status.HTTP_200_OK)
        except ValidationError as exc:
            return Response({"error": exc.messages}, status=status.HTTP_400_BAD_REQUEST)


from django import forms
from django.urls import reverse_lazy
from .models import UserTwoFactorAuthData

class ConfirmTwoFactorAuthView(views.APIView):
    success_url = reverse_lazy("admin:index")

    class Form(forms.Form):
        otp = forms.CharField(required=True)

        def clean_otp(self):
            self.two_factor_auth_data = UserTwoFactorAuthData.objects.filter(
                user=self.user
            ).first()

            if self.two_factor_auth_data is None:
                raise ValidationError('2FA not set up.')

            otp = self.cleaned_data.get('otp')

            if not self.two_factor_auth_data.validate_otp(otp):
                raise ValidationError('Invalid 2FA code.')

            return otp

    def post(self, request, *args, **kwargs):
        form = self.Form(request.data)
        form.user = request.user

        if form.is_valid():
            return Response({'success': True}, status=status.HTTP_200_OK)
        else:
            return Response({'errors': form.errors}, status=status.HTTP_400_BAD_REQUEST)


class UserMatchHistoryView(views.APIView):
    def get(self, request):
        user_id = request.user.id
        match_history = MatchHistory.objects.filter(models.Q(player1=user_id) | models.Q(player2=user_id))
        serializer = serializers.MatchHistorySerializer(match_history, many=True)
        
        return Response(serializer.data, status=status.HTTP_200_OK)



class MatchCreateView(views.APIView):
    def post(self, request, *args, **kwargs):
        player1_id = request.data.get('player1_id')
        player2_id = request.data.get('player2_id')
        player1_result = request.data.get('player1_result')
        player2_result = request.data.get('player2_result')

        try:
            player1 = CustomUser.objects.get(id=player1_id)
        except CustomUser.DoesNotExist:
            return Response({"error": "Player1 does not exist"}, status=status.HTTP_404_NOT_FOUND)
        
        try:
            player2 = CustomUser.objects.get(id=player2_id)
        except CustomUser.DoesNotExist:
            return Response({"error": "Player2 does not exist"}, status=status.HTTP_404_NOT_FOUND)

        match_data = {
            'player1': player1.id,
            'player2': player2.id,
            'player1_result': player1_result,
            'player2_result': player2_result
        }
        serializer = serializers.MatchCreateSerializer(data=match_data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class UserGetStatsView(views.APIView):
    def get(self, request):
        user = request.user
        wins = MatchHistory.objects.filter(player1=user, player1_result=1).count() + \
               MatchHistory.objects.filter(player2=user, player2_result=1).count()
        
        losses = MatchHistory.objects.filter(player1=user, player1_result=0).count() + \
                 MatchHistory.objects.filter(player2=user, player2_result=0).count()
        
        stats = {
            'wins': wins,
            'losses': losses
        }
        return Response(stats, status=status.HTTP_200_OK)
        

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