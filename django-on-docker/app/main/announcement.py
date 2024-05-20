from .models import ChatMessage

from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync


def announce_game(player1_id, player2_id, game_id):
        
        channel_layer = get_channel_layer()
        async_to_sync(channel_layer.group_send)(
            f"{player1_id}",
            {
                'type': 'game.link', 
                'player1_id': player1_id,
                'player2_id': player2_id,
                'game_id': game_id,
                'content_type': ChatMessage.GAMEID
            }
        )

        async_to_sync(channel_layer.group_send)(
            f"{player2_id}",
            {
                'type': 'game.link', 
                'player1_id': player1_id,
                'player2_id': player2_id,
                'game_id': game_id,
                'content_type': ChatMessage.GAMEID
            }
        )


def announce_tournament(user_ids, creator_id, tournament_id):
        
	channel_layer = get_channel_layer()
	for user_id in user_ids:
		async_to_sync(channel_layer.group_send)(
			f"{user_id}",
			{
				'type': 'tournament.link', 
				'creator_id': creator_id,
				'participant_id': user_id,
				'tournament_id': tournament_id,
				'content_type': ChatMessage.TTID
			}
		)
	
	for user_id in user_ids:
		async_to_sync(channel_layer.group_send)(
			f"{creator_id}",
			{
				'type': 'tournament.link', 
				'creator_id': creator_id,
				'participant_id': user_id,
				'tournament_id': tournament_id,
				'content_type': ChatMessage.TTID
			}
		)

def notify_blocked(blocked_by_display_name, user_id):

	channel_layer = get_channel_layer()
	async_to_sync(channel_layer.group_send)(
		f"{user_id}",
            {
                'type': 'block_notification', 
                'block_msg': f"You have been blocked by user {blocked_by_display_name}."
            }
        )