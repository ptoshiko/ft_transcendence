from .models import CustomUser, Friendship, ChatMessage, BlockUser
from django.db import models
from rest_framework.response import Response
from . import serializers
from rest_framework import generics, views, status
from rest_framework.permissions import IsAuthenticated, AllowAny
from .permissions import IsOwnerOrReadOnly,  IsAdminOrReadnly
from django.shortcuts import render
from django.http import Http404
from .views_utils import *
from .error_messages import *
from .services import *
from .game import *
from .announcement import *

from collections import OrderedDict

# from channels.layers import get_channel_layer
# from asgiref.sync import async_to_sync

class RegisterView(generics.CreateAPIView): 
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
            return Response({'error': EMPTY}, status=status.HTTP_400_BAD_REQUEST)

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


### FRIENDS ###
### returns not blocked friends
class FriendsListView(views.APIView):
    def get(self, request):
        user = request.user
        friendships = get_friendships_db(user)
        friend_ids = set()
        for friendship in friendships:
            friend_ids.add(friendship.sender_id)
            friend_ids.add(friendship.receiver_id)

        friend_ids.discard(user.id)
        blocked_user_ids = get_blocked_user_ids(user)

        friends = CustomUser.objects.filter(id__in=friend_ids).exclude(id__in=blocked_user_ids)
        serializer = serializers.CustomUserSerializer(friends, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)


class FriendshipRequestsView(views.APIView):
    def get(self, request):
        user = request.user
        friendship_requests = get_friendship_requests(user)
        serializer = serializers.FriendshipRequestSerializer(friendship_requests, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)


class SendFriendRequestView(CheckIdMixin, views.APIView):
    def post(self, request):
        if not request.data:
            return Response({'error': EMPTY}, status=status.HTTP_400_BAD_REQUEST)
        
        receiver_id = request.data.get('receiver_id')
        error_response = self.check_id(receiver_id, 'receiver_id')
        if error_response:
            return error_response
        
        sender = request.user 
        if str(sender.id) == str(receiver_id):
            return Response({"error": SAME_SENDER_RECEIVER}, status=status.HTTP_400_BAD_REQUEST)
        
        receiver = check_if_exists_by_id(CustomUser, receiver_id)
        if receiver is None:
            return Response({"error": NO_RECEIVER}, status=status.HTTP_404_NOT_FOUND)

        if are_friends(sender, receiver):
            return Response({"error": ARE_FRIENDS}, status=status.HTTP_400_BAD_REQUEST)

        if get_friendship_pending(sender, receiver):
            return Response({"error": REQUEST_ALREADY_SENT}, status=status.HTTP_400_BAD_REQUEST)

        friendship = get_friendship_pending(receiver, sender)
        if friendship:
            approve_pending_friend_request(friendship)
            return Response({'message': 'Pending request from user approved'}, status=status.HTTP_200_OK)

        friendship_data = {'sender': sender.id, 'receiver': receiver.id}
        serializer = serializers.FriendshipSerializer(data=friendship_data)
        
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class ApproveFriendRequestView(CheckIdMixin, views.APIView):
    def put(self, request):
        if not request.data:
            return Response({'error': EMPTY}, status=status.HTTP_400_BAD_REQUEST)
        
        sender_id = request.data.get('sender_id')
        error_response = self.check_id(sender_id, 'sender_id')
        if error_response:
            return error_response
        
        receiver = request.user
        if str(receiver.id) == str(sender_id):
            return Response({"error": SAME_SENDER_RECEIVER}, status=status.HTTP_400_BAD_REQUEST)
        
        sender = check_if_exists_by_id(CustomUser, sender_id)
        if sender is None:
            return Response({"error": NO_SENDER}, status=status.HTTP_404_NOT_FOUND)
        
        friendship = get_friendship_pending(sender, receiver)
        if friendship is None:
            return Response({"error": NO_PENDING}, status=status.HTTP_404_NOT_FOUND)

        approve_pending_friend_request(friendship)

        serializer = serializers.FriendshipSerializer(friendship)
        return Response(serializer.data)


class FriendRemoveView(CheckIdMixin, views.APIView):
    def post(self, request):
        if not request.data:
            return Response({'error': EMPTY}, status=status.HTTP_400_BAD_REQUEST)
        
        remove_user_id = request.data.get('remove_user_id')
        error_response = self.check_id(remove_user_id, 'remove_user_id')
        if error_response:
            return error_response
        
        if str(request.user.id) == str(remove_user_id):
            return Response({"error": SAME_ID_REMOVE}, status=status.HTTP_400_BAD_REQUEST)
        
        remove_user = check_if_exists_by_id(CustomUser, remove_user_id)
        if remove_user is None:
            return Response({"error": NO_REMOVE_USER}, status=status.HTTP_404_NOT_FOUND)
        
        sender_friendship = get_friendship_approved(request.user, remove_user)
        receiver_friendship = get_friendship_approved(remove_user, request.user)
    
        if not sender_friendship and not receiver_friendship:
            return Response({"error": NO_FRIENDSHIP}, status=status.HTTP_404_NOT_FOUND)

        if sender_friendship:
            sender_friendship.delete()
            Friendship.objects.create(sender_id=remove_user_id, receiver=request.user, status=Friendship.PENDING)
        
        if receiver_friendship:
            receiver_friendship.status = Friendship.PENDING
            receiver_friendship.save()

        return Response({'message': 'User removed from friends successfully'}, status=status.HTTP_200_OK)


### BLOCK USER ###

class BlockUserView(CheckIdMixin, views.APIView):
    def post(self, request):
        if not request.data:
            return Response({'error': EMPTY}, status=status.HTTP_400_BAD_REQUEST)
        
        blocked_by_id = request.user.id
        blocked_user_id = request.data.get('blocked_user_id')

        error_response = self.check_id(blocked_user_id, 'blocked_user_id')
        if error_response:
            return error_response
        
        if str(blocked_by_id) == str(blocked_user_id):
            return Response({"error": SAME_ID_BLOCKING}, status=status.HTTP_400_BAD_REQUEST)

        blocked_user = check_if_exists_by_id(CustomUser, blocked_user_id)
        if blocked_user is None:
            return Response({"error": NO_BLOCK_USER}, status=status.HTTP_404_NOT_FOUND)

        if check_is_blocked(blocked_by_id, blocked_user_id):
            return Response({'error': 'User is already blocked'}, status=status.HTTP_400_BAD_REQUEST)

        create_blocking_record(blocked_by_id, blocked_user_id)
        return Response({'message': 'User blocked'}, status=status.HTTP_200_OK)
    
class UnblockUserView(CheckIdMixin, views.APIView):
    def post(self, request):
        if not request.data:
            return Response({'error': EMPTY}, status=status.HTTP_400_BAD_REQUEST)
        
        blocked_by_id = request.user.id
        blocked_user_id = request.data.get('blocked_user_id')

        error_response = self.check_id(blocked_user_id, 'blocked_user_id')
        if error_response:
            return error_response
        
        if str(blocked_by_id) == str(blocked_user_id):
            return Response({"error": SAME_ID_BLOCKING}, status=status.HTTP_400_BAD_REQUEST)
        
        blocking_record= check_is_blocked(blocked_by_id, blocked_user_id)
        if blocking_record is None:
            return Response({'error': 'User is not blocked'}, status=status.HTTP_400_BAD_REQUEST)

        blocking_record.delete()
        return Response({'message': 'User unblocked'}, status=status.HTTP_200_OK)

### CHAT ###

    
class GetMessagesByDisplayNameView(views.APIView):
    def get(self, request, display_name):
        chat_user = check_if_exists_by_str(CustomUser, display_name)
        if chat_user is None:
            return Response({"error": NO_USER}, status=status.HTTP_404_NOT_FOUND)

        user = request.user
        messages = get_messages(user, chat_user)

        serializer = serializers.ChatMessageSerializer(messages, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)



class GetLastChatsView(views.APIView):
    def get(self, request):
        user = request.user
        last_chat_users = get_last_chat_users(user)
        user_ids_in_order = []

        unique_user_ids = OrderedDict()

        for sender_id, receiver_id in last_chat_users:
            if sender_id != user.id:
                unique_user_ids[sender_id] = None
            if receiver_id != user.id:
                unique_user_ids[receiver_id] = None

        user_ids_in_order = list(unique_user_ids.keys())

        result_users = CustomUser.objects.filter(id__in=user_ids_in_order)

        users_map = {user.id: user for user in result_users}

        ordered_users = [users_map[user_id] for user_id in user_ids_in_order]

        serializer = serializers.CustomUserSerializer(ordered_users, many=True)

        return Response(serializer.data, status=status.HTTP_200_OK)


class GetUserByDisplayName(views.APIView):
    def get(self, request, display_name, format=None):
        try:
            user = CustomUser.objects.get(display_name=display_name)
            serializer = serializers.ByDisplayNameSerializer(user, context={'request': request})
        
            friend_status = "UNDEFINED"
            friend_request_sent_by_me = False

            try:
                friendship_request_sent = Friendship.objects.get(sender=request.user, receiver=user)
                if friendship_request_sent.status == Friendship.PENDING:
                    friend_status = "PENDING"
                    friend_request_sent_by_me = True
                elif friendship_request_sent.status == Friendship.APPROVED:
                    friend_status = "APPROVED"
            except Friendship.DoesNotExist:
                try:
                    friendship_request_received = Friendship.objects.get(sender=user, receiver=request.user)
                    if friendship_request_received.status == Friendship.PENDING:
                        friend_status = "PENDING"
                    elif friendship_request_received.status == Friendship.APPROVED:
                        friend_status = "APPROVED"
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

        user = check_if_exists_by_str(CustomUser, display_name)
        if user is None:
            return Response({"error": NO_USER}, status=status.HTTP_404_NOT_FOUND)
        
        friendships = get_friendships_db(user)
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


### 2FA ###
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
        user = request.user
        match_history = get_match_history(user)
        serializer = serializers.PairGameSerializer(match_history, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)


class UserGetStatsView(views.APIView):
    def get(self, request, user_id):
        user = check_if_exists_by_id(CustomUser, user_id)
        if user is None:
            return Response({"error": NO_USER}, status=status.HTTP_404_NOT_FOUND)
        wins = get_wins(user)
        losses = get_loses(user)
        stats = {
            'wins': wins,
            'losses': losses
        }
        return Response(stats, status=status.HTTP_200_OK)

class AvatarUploadView(views.APIView):
    def post(self, request):
        if not request.data:
            return Response({'error': EMPTY}, status=status.HTTP_400_BAD_REQUEST)
        serializer = serializers.AvatarUploadSerializer(request.user, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class UserSearchView(views.APIView):
    def get(self, request, string):
        users = CustomUser.objects.filter(display_name__startswith=string).exclude(id=request.user.id)
        serializer = serializers.CustomUserSerializer(users, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)




class CreateGameView(CheckIdMixin, views.APIView):
    def post(self, request):
        if not request.data:
            return Response({'error': EMPTY}, status=status.HTTP_400_BAD_REQUEST)

        player1 = request.user
        player1_id = player1.id
        player2_id = request.data.get('player2_id')

        error_response = self.check_id(player2_id, 'player2_id')
        if error_response:
            return error_response

        player2 = check_if_exists_by_id(CustomUser, player2_id)
        if player2 is None:
            return Response({"error": "Player2 does not exist"}, status=status.HTTP_404_NOT_FOUND)

        # create a new game ID if there is no old game ID with status not FINISHED and not belong to 
        game = check_game_by_users_not_finished(player1_id, player2_id)
        if game is None:
            game = create_game_record(player1_id, player2_id)

        game_id = game.game_id
        create_message_gameid_type(game_id, player1, player2)

        announce_game(player1_id, player2_id, game_id)

        # content_type = ChatMessage.GAMEID
        
        # channel_layer = get_channel_layer()
        # async_to_sync(channel_layer.group_send)(
        #     f"{player1_id}",
        #     {
        #         'type': 'game.link', 
        #         'player1_id': player1_id,
        #         'player2_id': player2_id,
        #         'game_id': game_id,
        #         'content_type': content_type
        #     }
        # )

        # async_to_sync(channel_layer.group_send)(
        #     f"{player2_id}",
        #     {
        #         'type': 'game.link', 
        #         'player1_id': player1_id,
        #         'player2_id': player2_id,
        #         'game_id': game_id,
        #         'content_type': content_type
        #     }
        # )

        return Response({'success': True}, status=status.HTTP_200_OK)


class GetGameInfoView(views.APIView):
    def get(self, request, game_id):
        game = check_if_exists_game(game_id)
        if game is None:
            return Response({"error": NO_GAME}, status=status.HTTP_404_NOT_FOUND)
        serializer = serializers.PairGameSerializer(game)
        return Response(serializer.data)


class ProposeTournament(views.APIView):
    def post(self, request):
        if not request.data:
            return Response({'error': EMPTY}, status=status.HTTP_400_BAD_REQUEST)
        user_ids = request.data.get('user_ids', [])
        if not user_ids:
            return Response({'error': 'No user IDs provided'}, status=status.HTTP_400_BAD_REQUEST)

        users = CustomUser.objects.filter(pk__in=user_ids)
        if len(users) != len(user_ids):
            return Response({'error': 'Invalid user IDs provided'}, status=status.HTTP_400_BAD_REQUEST)

        creator = request.user
        participants = list(users) + [creator]
        tournament = create_tournament(participants)

        creator_id = creator.id
        accept_tt_invitation(tournament, creator_id)

        tournament_id = tournament.tournament_id
        for user in users:
            create_message_ttid_type(tournament_id, creator, user)

        announce_tournament(user_ids, creator_id, tournament_id)

        # content_type = ChatMessage.TTID
        # channel_layer = get_channel_layer()

        # for user_id in user_ids:
        #     async_to_sync(channel_layer.group_send)(
        #         f"{user_id}",
        #         {
        #             'type': 'tournament.link', 
        #             'creator_id': creator_id,
        #             'participant_id': user_id,
        #             'tournament_id': tournament_id,
        #             'content_type': content_type
        #         }
        #     )
        
        # for user_id in user_ids:
        #     async_to_sync(channel_layer.group_send)(
        #         f"{creator_id}",
        #         {
        #             'type': 'tournament.link', 
        #             'creator_id': creator_id,
        #             'participant_id': user_id,
        #             'tournament_id': tournament_id,
        #             'content_type': content_type
        #         }
        #     )
        return Response({'message': 'Tournament proposed successfully', 'tournament_id': tournament_id}, status=status.HTTP_201_CREATED)

class AcceptTournamentInvitation(CheckTournamentIdMixin, views.APIView):
    def put(self, request):
        if not request.data:
            return Response({'error': EMPTY}, status=status.HTTP_400_BAD_REQUEST)
        
        tournament_id = request.data.get('tournament_id')
        error_response = self.check_tt_id(tournament_id, 'tournament_id')
        if error_response:
            return error_response

        tournament = check_if_exists_tt(tournament_id)
        if tournament is None:
            return Response({"error": NO_TT}, status=status.HTTP_404_NOT_FOUND)

        user_id = request.user.id
        if user_id not in tournament.participants.values_list('id', flat=True):
            return Response({"error": NOT_ALLOWED_TT}, status=status.HTTP_404_NOT_FOUND)  
        
        accept_tt_invitation(tournament, user_id)
        my_tt_message_accepted(tournament_id, user_id)

        return Response({'tt_status': tournament.status, 'message': 'User accepted tournament invitation successfully'}, status=status.HTTP_200_OK)


class DeclineTournamentInvitation(CheckTournamentIdMixin, views.APIView):
    def put(self, request):
        if not request.data:
            return Response({'error': EMPTY}, status=status.HTTP_400_BAD_REQUEST)
        
        tournament_id = request.data.get('tournament_id')
        error_response = self.check_tt_id(tournament_id, 'tournament_id')
        if error_response:
            return error_response
        
        tournament = check_if_exists_tt(tournament_id)
        if tournament is None:
            return Response({"error": NO_TT}, status=status.HTTP_404_NOT_FOUND)
        
        user_id = request.user.id
        if user_id not in tournament.participants.values_list('id', flat=True):
            return Response({"error": NOT_ALLOWED_TT}, status=status.HTTP_404_NOT_FOUND)
    
        decline_tt_invitation(tournament, user_id)
        tt_messages_canceled(tournament_id)

        return Response({'tt_status': tournament.status, 'message': 'User declined tournament invitation and canceled tournamnet successfully'}, status=status.HTTP_200_OK)


class GetMyTournaments(views.APIView):
    def get(self, request):
        user = request.user
        tournaments = get_tournamnets(user)
        print(tournaments)
        serializer = serializers.TournamentSerializer(tournaments, many=True)
        return Response(serializer.data)


class GetTournamentById(views.APIView):
    def get(self, request, tournament_id):
        tournament = check_if_exists_tt(tournament_id)
        if tournament is None:
            return Response({"error": NO_TT}, status=status.HTTP_404_NOT_FOUND)
        serializer = serializers.TournamentDetailedSerializer(tournament)
        return Response(serializer.data)
    
class GetGamesByTTId(views.APIView):
    def get(self, request, tournament_id):
        tournament = check_if_exists_tt(tournament_id)
        if tournament is None:
            return Response({"error": NO_TT}, status=status.HTTP_404_NOT_FOUND)
        
        games = get_games_by_ttid(tournament)
        serializer = serializers.PairGameSerializer(games, many=True)
        return Response(serializer.data)        



def login(request):
    return render(request, "chat/login.html")


def room(request):
    return render(request, "chat/room.html")

    