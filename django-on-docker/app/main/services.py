from django.core.exceptions import ValidationError
import pyotp
from .models import UserTwoFactorAuthData, Friendship, ChatMessage, BlockUser, PairGame, Tournament
from django.db import models
from .announcement import *

def user_two_factor_auth_data_create(*, user) -> UserTwoFactorAuthData:
    
    try:
        two_factor_auth_data = UserTwoFactorAuthData.objects.get(user=user)

        if two_factor_auth_data.is_setup_expired():
            two_factor_auth_data.delete()
        else:
            return two_factor_auth_data
            # raise ValidationError(
            #     'Cannot have more than one 2FA related data. Complete or delete the existing setup first.'
            # )
    except UserTwoFactorAuthData.DoesNotExist:
        pass

    two_factor_auth_data = UserTwoFactorAuthData.objects.create(
        user=user,
        otp_secret=pyotp.random_base32()
    )

    return two_factor_auth_data

def check_if_exists_by_id(model, object_id):
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

def check_if_exists_game(game_id):
    try:
        obj = PairGame.objects.get(game_id=game_id)
        return obj
    except PairGame.DoesNotExist:
        return None

def check_if_exists_tt(tournament_id):
    try:
        obj = Tournament.objects.get(tournament_id=tournament_id)
        return obj
    except Tournament.DoesNotExist:
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

def get_messages(user_1, user_2):
    messages = ChatMessage.objects.filter(
        (models.Q(sender=user_1) & models.Q(receiver=user_2)) |
        (models.Q(receiver=user_1) & models.Q(sender=user_2))
    ).order_by('date_added')
    
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
    
def check_is_blockedby(user_ids, blockedby_ids):
    blocked_set = set(blockedby_ids)
    
    # Check if any user ID is in the blocked set
    for user_id in user_ids:
        if user_id in blocked_set:
            return True
    return False

def get_blocked_user_ids(user):
    blocked_user_ids = BlockUser.objects.filter(blocked_by=user).values_list('blocked_user_id', flat=True)
    return blocked_user_ids

def get_blockedby_ids(user):
    blocked_by_ids = BlockUser.objects.filter(blocked_user=user).values_list('blocked_by_id', flat=True)
    return blocked_by_ids

def create_blocking_record(blocked_by_id, blocked_user_id):
    BlockUser.objects.create(blocked_by_id=blocked_by_id, blocked_user_id=blocked_user_id)

def get_match_history(user):

    match_history = PairGame.objects.filter(
            (models.Q(player1=user) | models.Q(player2=user)) &
            (models.Q(status=PairGame.FINISHED))
        ).order_by('-date_created')

    return match_history

def get_wins(user):
    wins = PairGame.objects.filter(
        models.Q(player1=user, player1_score__gt=models.F('player2_score')) |
        models.Q(player2=user, player2_score__gt=models.F('player1_score')),
        status=PairGame.FINISHED
    ).count()
    return wins



def get_loses(user):
    losses = PairGame.objects.filter(
        models.Q(player1=user, player1_score__lt=models.F('player2_score')) |
        models.Q(player2=user, player2_score__lt=models.F('player1_score')),
        status=PairGame.FINISHED
    ).count()
    return losses


def get_last_chat_users(user): 

    last_chat_users = ChatMessage.objects.filter(
                models.Q(sender=user) | models.Q(receiver=user)
            ).order_by('-date_added').values_list('sender', 'receiver').distinct()[:10]
    return last_chat_users
    
def check_game_by_users_not_finished(player1_id, player2_id):
    try:
        # Retrieve a single PairGame object with the specified player IDs and not finished status
        game = PairGame.objects.filter(
            (models.Q(player1_id=player1_id) & models.Q(player2_id=player2_id)) |
            (models.Q(player1_id=player2_id) & models.Q(player2_id=player1_id)),
        ).exclude(
            status=PairGame.FINISHED
        ).exclude(
            tournament__isnull=False
        ).get()
        return game
    except PairGame.DoesNotExist:
        return None


def create_game_record(player1_id, player2_id):
    game = PairGame.objects.create(player1_id = player1_id, player2_id = player2_id)
    return game

def create_tt_game_record(player1_id, player2_id, tournament):
    game = PairGame.objects.create(player1_id = player1_id, player2_id = player2_id, tournament=tournament)
    return game

def create_message_text_type(content, sender, receiver):
    ChatMessage.objects.create(content=content, sender=sender, receiver=receiver, content_type = ChatMessage.TEXT)

def create_message_gameid_type(game_id, player1, player2):
    ChatMessage.objects.create(content=game_id, sender=player1, receiver=player2, content_type = ChatMessage.GAMEID)

def create_message_ttid_type(tournament_id, tt_creator, participant):
    ChatMessage.objects.create(content=tournament_id, sender=tt_creator, receiver=participant, content_type= ChatMessage.TTID)

def change_game_status_in_progress(game_id):
    game = PairGame.objects.get(game_id=game_id)
    game.status = PairGame.IN_PROGRESS
    game.save()


def tt_update_participants_points(player1, player1_score, player2, player2_score, tournament):
    #     # Calculate points based on game scores

    if player1_score > player2_score:
        points_1 = 1
        points_2 = 0
    else:
        points_1 = 0
        points_2 = 1

    tournament = Tournament.objects.get(tournament_id=tournament.tournament_id)

    if str(player1.id) in tournament.participant_points:
        tournament.participant_points[str(player1.id)] += points_1
    else:
        tournament.participant_points[str(player1.id)] = points_1

    if  str(player2.id) in tournament.participant_points:
        tournament.participant_points[str(player2.id)] += points_2
    else:
        tournament.participant_points[str(player2.id)] = points_2
    
    tournament.current += 1
    if tournament.current == len(tournament.schedule):
        tournament.status = Tournament.FINISHED
    tournament.save()

    return tournament

def finish_game_db(game_id, player1_score, player2_score):

    game = PairGame.objects.get(game_id=game_id)
    game.status = PairGame.FINISHED
    game.player1_score = player1_score
    game.player2_score = player2_score
    game.save()

    if game.tournament != 0:

        tournament = tt_update_participants_points(game.player1, game.player1_score, game.player2, game.player2_score, game.tournament)

        # 0 1 2
        # 0 1 2 
        # 
        # if game.tournament.participant_points
        # tournament.current += 1
        # tournament.save()
        # print("len(tournament.schedule" , len(tournament.schedule))
        # if tournament.current == len(tournament.schedule):
        #     tournament.status = Tournament.FINISHED
        #     tournament.save()
        if tournament.status == Tournament.FINISHED:
            return
    
        start_tt_game(tournament, tournament.current)




def create_tournament(users):
    tournament = Tournament.objects.create()
    tournament.participants.add(*users)
    return tournament


def start_tt_game(tournament, num):
    print ("num= ", num)
    game = create_tt_game_record(tournament.schedule[num][0], tournament.schedule[num][1], tournament)
    create_message_gameid_type(game.game_id, game.player1, game.player2)

    announce_game(game.player1.id, game.player2.id, game.game_id)

    tournament.status = Tournament.IN_PROGRESS  
    tournament.save()



def accept_tt_invitation(tournament, user_id):
    tournament.invitation_status[user_id] = 1
    tournament.save()

    num_participants = tournament.participants.count()
    num_accepted = sum(1 for value in tournament.invitation_status.values() if value == 1)

    if num_participants == num_accepted:
        tournament.generate_schedule()
        start_tt_game(tournament, tournament.current)
        

def decline_tt_invitation(tournament, user_id):
    tournament.invitation_status[user_id] = 0
    tournament.status = Tournament.CANCELED
    tournament.save()

def my_tt_message_accepted(tournament_id, user_id):
    print(user_id)
    print(tournament_id)
    # try and catch
    my_message = ChatMessage.objects.get(receiver=user_id, content=tournament_id)
    my_message.extra_details = "TT_ACCEPTED"
    my_message.save()

# def my_tt_message_declined_other_canceled(tournament_id, user_id):
#     my_message = ChatMessage.objects.get(receiver=user_id, content=tournament_id)
#     my_message.extra_details = "TT_DECLINED"
#     my_message.save() 
#     messages = ChatMessage.objects.filter(content=tournament_id).exclude(receiver=user_id)
#     for message in messages:
#         message.extra_details = "TT_CANCELED"
#         message.save()


def tt_messages_canceled(tournament_id):
    messages = ChatMessage.objects.filter(content=tournament_id)
    for message in messages:
        message.extra_details = "TT_CANCELED"
        message.save()

def get_tournamnets(user):
    tournaments = Tournament.objects.filter(participants=user).order_by('-created_at')
    return tournaments

# def get_tt_by_id(tournament_id):
#     tournament = Tournament.objects.get(tournament_id=tournament_id)
#     return tournament


def get_games_by_ttid(tournament):
    games = PairGame.objects.filter(models.Q(tournament=tournament)).order_by('-date_created')
    return games

def get_tt_winner(tournament):

    if tournament.status != Tournament.FINISHED:
        return None
    if not tournament.participant_points:
        return None

    max_points = max(tournament.participant_points.values())
    for participant_id, points in tournament.participant_points.items():
        if points == max_points:
            return participant_id
        
def check_2fa_data_exists(user):

    try:
        two_factor_auth_data = UserTwoFactorAuthData.objects.get(user=user)
        return two_factor_auth_data
    except UserTwoFactorAuthData.DoesNotExist:
        return None