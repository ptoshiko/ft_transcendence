from .models import CustomUser, Friendship, ChatMessage, BlockUser, MatchHistory
from django.db import models
from rest_framework.response import Response
from . import serializers
from rest_framework import generics, views, status
from rest_framework.permissions import IsAuthenticated, AllowAny
from .permissions import IsOwnerOrReadOnly,  IsAdminOrReadnly
from django.shortcuts import render
from django.http import Http404
from . import error_messages


class RegisterView(generics.CreateAPIView):  # [POST]:registration  required display_name, email and username 
    queryset = CustomUser.objects.all()
    permission_classes = [AllowAny]
    serializer_class = serializers.RegisterSerializer


class CustomUserAPIList(generics.ListAPIView): 
    queryset = CustomUser.objects.all()
    serializer_class = serializers.CustomUserSerializer
    permission_classes = [AllowAny]

class CustomUserAPIUpdate(generics.UpdateAPIView): # [PUT] update owner's info
    serializer_class = serializers.UpdateSerializer 
    permission_classes = (IsOwnerOrReadOnly, IsAuthenticated)

    def get_object(self):
        return self.request.user

    def update(self, request, *args, **kwargs):
        if not request.data:
            return Response({'error': 'Empty request body'}, status=status.HTTP_400_BAD_REQUEST)

        partial = kwargs.pop('partial', True)
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        self.perform_update(serializer)
        return Response(serializer.data)

class CuestomUserAPIDetailView(generics.RetrieveUpdateDestroyAPIView): #to delete a user
    queryset = CustomUser.objects.all()
    serializer_class = serializers.CustomUserSerializer
    permission_classes = (IsAdminOrReadnly,)


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


class FriendshipRequestsView(views.APIView):
    def get(self, request, *args, **kwargs):
        user = request.user
        friendship_requests = Friendship.objects.filter(models.Q(receiver=user, status=Friendship.PENDING))
        serializer = serializers.FriendshipRequestSerializer(friendship_requests, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)


class SendFriendRequestView(views.APIView):
    def post(self, request, *args, **kwargs):
        if not request.data:
            return Response({'error': 'Empty request body'}, status=status.HTTP_400_BAD_REQUEST)
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


class ApproveFriendRequestView(views.APIView):
    def put(self, request, *args, **kwargs):
        if not request.data:
            return Response({'error': 'Empty request body'}, status=status.HTTP_400_BAD_REQUEST)
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
    
# class FriendRemoveView(views.APIView):


class BlockUserView(views.APIView):
    def post(self, request):
        if not request.data:
            return Response({'error': 'Empty request body'}, status=status.HTTP_400_BAD_REQUEST)
        blocked_user_id = request.data.get('blocked_user_id')
        blocked_by_id = request.user.id

        if not CustomUser.objects.filter(id=blocked_user_id).exists():
            return Response({'error': 'User to block does not exist'}, status=status.HTTP_404_NOT_FOUND)

        if BlockUser.objects.filter(blocked_by_id=blocked_by_id, blocked_user_id=blocked_user_id).exists():
            return Response({'error': 'User is already blocked'}, status=status.HTTP_400_BAD_REQUEST)

        block_user_obj = BlockUser.objects.create(blocked_by_id=blocked_by_id, blocked_user_id=blocked_user_id)
        
        serializer = serializers.BlockUserSerializer(block_user_obj)

        return Response({'message': 'User blocked', 'block_record': serializer.data}, status=status.HTTP_200_OK)
    
class UnblockUserView(views.APIView):
    def post(self, request):
        if not request.data:
            return Response({'error': 'Empty request body'}, status=status.HTTP_400_BAD_REQUEST)
        blocked_user_id = request.data.get('blocked_user_id')
        blocked_by_id = request.user.id

        try:
            blocking_relationship = BlockUser.objects.get(blocked_by_id=blocked_by_id, blocked_user_id=blocked_user_id)
        except BlockUser.DoesNotExist:
            return Response({'error': 'User is not blocked'}, status=status.HTTP_400_BAD_REQUEST)

        blocking_relationship.delete()
        return Response({'message': 'User unblocked'}, status=status.HTTP_200_OK)


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
            serializer = serializers.ByDisplayNameSerializer(user, context={'request': request})
        
            friend_status = 0
            friend_request_sent_by_me = False

            try:
                friendship_request_sent = Friendship.objects.get(sender=request.user, receiver=user)
                if friendship_request_sent.status == Friendship.PENDING:
                    friend_status = "pending"
                    friend_request_sent_by_me = True
                elif friendship_request_sent.status == Friendship.APPROVED:
                    friend_status = "approved"
            except Friendship.DoesNotExist:
                try:
                    friendship_request_received = Friendship.objects.get(sender=user, receiver=request.user)
                    if friendship_request_received.status == Friendship.PENDING:
                        friend_status = "pending"
                    elif friendship_request_received.status == Friendship.APPROVED:
                        friend_status = "approved"
                except Friendship.DoesNotExist:
                    pass 

            blocked_me= BlockUser.objects.filter(blocked_user=request.user, blocked_by=user).exists()
            is_blocked_by_me= BlockUser.objects.filter(blocked_user=user, blocked_by=request.user).exists()

            data = serializer.data
            data['friend_status'] = friend_status
            data['friend_request_sent_by_me'] = friend_request_sent_by_me
            data['blocked_me'] = blocked_me
            data['is_blocked_by_me'] = is_blocked_by_me

            return Response(data)
        except CustomUser.DoesNotExist:
            raise Http404

class GetFriendsByDisplayName(views.APIView):
    def get(self, request, display_name, format=None):

        try:
            user = CustomUser.objects.get(display_name=display_name)
        except CustomUser.DoesNotExist:
            return Response({"error": "User does not exist"}, status=status.HTTP_404_NOT_FOUND)
            
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
        match_history = MatchHistory.objects.filter(models.Q(player1=user_id) | models.Q(player2=user_id)).order_by('-match_date')
        serializer = serializers.MatchHistorySerializer(match_history, many=True)
        
        return Response(serializer.data, status=status.HTTP_200_OK)



class MatchCreateView(views.APIView):
    def post(self, request, *args, **kwargs):
        if not request.data:
            return Response({'error': 'Empty request body'}, status=status.HTTP_400_BAD_REQUEST)

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

class AvatarUploadView(views.APIView):
    def post(self, request, *args, **kwargs):
        if not request.data:
            return Response({'error': 'Empty request body'}, status=status.HTTP_400_BAD_REQUEST)
        serializer = serializers.AvatarUploadSerializer(request.user, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class UserSearchView(views.APIView):
    def get(self, request, string):
        users = CustomUser.objects.filter(display_name__startswith=string)
        serializer = serializers.CustomUserSerializer(users, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

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

    