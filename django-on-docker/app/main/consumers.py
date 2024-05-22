import json
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from .models import ChatMessage, CustomUser, BlockUser
from django.core.exceptions import ObjectDoesNotExist
from .services import *
import asyncio
from .game import *

class ChatConsumer(AsyncWebsocketConsumer):
    async def connect(self):

        self.sender = self.scope["user"]
        self.room_name = f"{self.sender.id}"
        await self.channel_layer.group_add(self.room_name, self.channel_name)
        await self.update_user_status(self.sender, True)
        await self.accept()

    async def disconnect(self, close_code):
        await self.update_user_status(self.sender, False)
        await self.channel_layer.group_discard(self.room_name, self.channel_name)


    async def receive(self, text_data):
        text_data_json = json.loads(text_data)

        match text_data_json.get('event_type'):
            case 'chat_message':
                await self.handle_private_message(text_data_json.get('data', {}))
            case 'join_game':
                await self.handle_join_game(text_data_json.get('data', {}))
            case 'up_key':
                await self.handle_up_key()
            case 'down_key':
                await self.handle_down_key()
            case _:
                await self.send_error_message("Unknown event type")


    # Handle private messages
    async def handle_private_message(self, data):    
        content = data.get('content')
        receiver_display_name = data.get('to')
        sender_id = self.sender.id

        try:
            receiver = await self.check_if_exists(receiver_display_name)
        except ValueError as e:
            error_message = {"error": str(e)}
            await self.send_json(error_message)

            return
        
        receiver_id = receiver.id

        if not content:
            return

        is_blocked = await self.is_blocked(receiver_id, sender_id)
        if is_blocked:
            await self.send_blocked_notification(receiver_display_name)
            return
        try:
            await self.save_message(content, self.sender.id, receiver_id) 
        except ValueError as e:
            error_message = {"error": str(e)}
            await self.send_json(error_message)
            return

        content_type = ChatMessage.TEXT

        # send message to receiver's room
        await self.channel_layer.group_send(
            f"{receiver_id}",
            {
                "type": "chat.message",
                "content": content,
                "sender": self.sender.id,
                "receiver": receiver_id,
                "content_type" : content_type
            }
        )
        # send message to sender's room - echo 
        await self.send(text_data=json.dumps({
            "event_type": "chat_message",
            "data": {
                "content": content,
                "sender": self.sender.id,
                "receiver": receiver_id,
                "content_type" : content_type
            }
    }))

    # Receive message from room group
    async def chat_message(self, event):
        content = event["content"]
        sender = event["sender"]
        receiver = event["receiver"]
        content_type = event["content_type"]

        # Send message to WebSocket
        await self.send(text_data=json.dumps({
            "event_type": "chat_message",
            "data": {
                "content": content,
                "sender": sender,
                "receiver": receiver,
                "content_type": content_type
            }
        }))



    async def handle_join_game(self, event):
        game_id = event["game_id"]
        user_id = self.sender.id

        try:
            game = await self.check_exists_game(game_id)
        except ValueError as e:
            error_message = {"error": str(e)}
            await self.send_game_error(error_message)
            return        

        success = await self.set_player_presence(game, user_id)
        if not success:
            await self.send_not_allowed()
            return

        if game.status == PairGame.FINISHED:
            return

        if success & game.is_present_1 == True & game.is_present_2 == True:
           is_created = game_manager.get_game_by_id(game_id)
        #    is_created = game_manager.get_game_by_users(game.player1_id, game.player2_id)
           if is_created:
               return 
           create_game_async = sync_to_async(game_manager.create_game)
           game = await create_game_async(game_id, game.player1_id, game.player2_id)
        #    game = game_manager.create_game(game_id, game.player1_id, game.player2_id)
           asyncio.create_task(game.start_game())


    async def send_game_error(self, error):
        await self.send(text_data=json.dumps({
            "event_type": "join_game",
            "data": {
                "error": error,
            }
        }))        



    async def game_link(self, event):
        player1_id = event["player1_id"]
        player2_id = event["player2_id"]
        game_id = event["game_id"]
        content_type = event["content_type"]

        # Send message to WebSocket
        await self.send(text_data=json.dumps({
            "event_type": "game_link",
            "data": {
                "content_type": content_type,
                "sender": player1_id,
                "receiver": player2_id,
                "game_id": game_id
            }
        }))

    async def tournament_link(self, event):
        creator_id = event["creator_id"]
        participant_id = event["participant_id"]
        tournament_id = event["tournament_id"]
        content_type = event["content_type"]

        await self.send(text_data=json.dumps({
            "event_type": "tournament_link",
            "data":{
                "content_type": content_type,
                "sender": creator_id,
                "receiver": participant_id,
                "tournament_id": tournament_id
            }
        }))
                    


    async def game_tick(self, event):
        tick = event["tick"]

    # Send message to WebSocket
        await self.send(text_data=json.dumps({
            "event_type": "game_tick",
            "data": {
                "tick": tick
            }
        }))


    async def game_state(self, event):
        ball_x = event["ball_x"]
        ball_y = event["ball_y"]
        left_paddle_y = event["left_paddle_y"]
        right_paddle_y = event["right_paddle_y"]
        left_score = event["left_score"]
        right_score = event["right_score"]
        is_left_won = event["is_left_won"]
        is_right_won = event["is_right_won"]

        await self.send(text_data=json.dumps({
            "event_type":"game_state",
            "data": {
                "ball_x": ball_x,
                "ball_y": ball_y,
                'left_paddle_y': left_paddle_y,
                'right_paddle_y': right_paddle_y,
                'left_score': left_score,
                'right_score': right_score,
                'is_left_won': is_left_won,
                'is_right_won': is_right_won,
            }
        }))

    async def block_notification(self, event):
        block_msg = event["block_msg"]
        
        await self.send(text_data=json.dumps({
            "event_type": "block_notification",
            "data": {
                "block_msg": block_msg
            }
        }))

    async def send_blocked_notification(self, receiver_display_name):
    
        error = f"You have been blocked by user {receiver_display_name}."
        await self.send(text_data=json.dumps({
            "event_type": "chat_message",
            "data": {
                "error": error,
            }
        }))

    async def send_not_allowed(self):
    
        error = f"You are not allowed to join game."
        await self.send(text_data=json.dumps({
            "event_type": "join_game",
            "data": {
                "error": error,
            }
        }))

    async def handle_up_key(self):
        user_id = self.sender.id
        game = game_manager.get_game_by_user_id(user_id)
        if game is None:
            return
        # print("up key and game is found start")
        await game.up_paddle_by_user_id(user_id)
        # print("up key and game is found end")

    async def handle_down_key(self):
        user_id = self.sender.id
        game = game_manager.get_game_by_user_id(user_id)
        if game is None:
            return 
        await game.down_paddle_by_user_id(user_id)

          
    async def send_json(self, content):
        await self.send(text_data=json.dumps(content))


    ### DB functions
    # Save massages to database
    @database_sync_to_async
    def save_message(self, content, sender_id, receiver_id):
        sender = CustomUser.objects.get(id=sender_id)
        try:
            receiver = CustomUser.objects.get(id=receiver_id)
        except ObjectDoesNotExist:
            raise ValueError("Receiver does not exist")
        create_message_text_type(content, sender, receiver)
        
    # Checking in database if the user is blocked 
    @database_sync_to_async
    def is_blocked(self, receiver_id, sender_id):
        return BlockUser.objects.filter(blocked_by_id=receiver_id, blocked_user_id=sender_id).exists()

    @database_sync_to_async
    def update_user_status(self, user, is_online):
        custom_user = CustomUser.objects.get(id=user.id)
        custom_user.is_online = is_online
        custom_user.save()

    
    @database_sync_to_async
    def check_if_exists(self, receiver_display_name):
        try:
            receiver = CustomUser.objects.get(display_name=receiver_display_name)
        except ObjectDoesNotExist:
            raise ValueError("Receiver does not exist")
        return receiver

    @database_sync_to_async
    def check_exists_game(self, game_id):
        try:
            obj = PairGame.objects.get(game_id=game_id)
        except PairGame.DoesNotExist:
            raise ValueError("Game does not exist")
        return obj
    
    @database_sync_to_async
    def set_player_presence(self, game, user_id):
        if str(user_id) == str(game.player1_id):
            game.is_present_1 = True
            game.save()
            return True
        elif str(user_id) == str(game.player2_id):
            game.is_present_2 = True
            game.save()
            return True
        else:
            return False
        