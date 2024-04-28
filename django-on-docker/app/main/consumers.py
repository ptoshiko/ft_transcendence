import json
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from .models import ChatMessage, CustomUser, BlockUser, GameInvitation
from django.core.exceptions import ObjectDoesNotExist
from .services import *

# {
#     "type":"invitation"
#     "sender": 2
#     "receiver": 4
#     "data"{
#         "is.active": True
#         "id":  "3482392a-sdkf"
#     }
# }

class ChatConsumer(AsyncWebsocketConsumer):
    async def connect(self):

        self.sender = self.scope["user"]
        self.room_name = f"{self.sender.id}"
        await self.channel_layer.group_add(self.room_name, self.channel_name)
        await self.update_user_status(self.sender, True)
        await self.accept()
        # await self.group_add(self.room_name)

    async def disconnect(self, close_code):
        await self.update_user_status(self.sender, False)
        await self.channel_layer.group_discard(self.room_name, self.channel_name)


    async def receive(self, text_data):
        text_data_json = json.loads(text_data)
        event_type = text_data_json.get("event_type")
        match text_data_json.get('event_type'):
            case 'chat_message':
                await self.handle_private_message(text_data_json.get('data', {}))
            case 'game_invitation':
                await self.handle_invitation(text_data_json.get('data', {}))
            # case 'paddle_movement':
            #     await self.handle_move_paddle(text_data_json.get('data, {}'))
            # case 'game_link':
            #     await self.handle_game_link(text_data_json.get('data', {}))
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




    # Handle inviatations -- in progress
    async def handle_invitation(self, data):
        receiver_id = data.get("to")
        sender_id = self.sender.id

        is_blocked = await self.is_blocked(receiver_id, sender_id)
        if is_blocked:
            await self.send_blocked_notification(receiver_display_name)
            return
        try:
            invitation = await self.save_invitation(self.sender.id, receiver_id)
        except ValueError as e:
            error_message = {"error": str(e)}
            await self.send_json(error_message)
            return
        await self.send_invitation_notification(sender_id, receiver_id, invitation)

    async def send_invitation_notification(self, sender_id, receiver_id, invitation):

        # Send the invitation to the receiver
        await self.channel_layer.group_send(
            f"{receiver_id}",
            {
                "type": "chat.invitation",
                "sender": self.sender.id,
                "receiver": receiver_id,
                "meta_data":{
                    "is_active": invitation.is_active,
                    "id": invitation.id
                }
            }
        )
    async def chat_invitation(self, event):

        sender_id = event["sender"]
        receiver_id = event["receiver"]
        meta_data = event["meta_data"]
    # Send the invitation data to the client
        await self.send_json({
            "sender": sender_id,
            "receiver": receiver_id,
            "meta_data": meta_data
        })
    

    # async def handle_game_link(self, data):
    #     message = data.get('message')

    #     await self.send(text_data=json.dumps({
    #         "event_type": "game_link",
    #         "data": {
    #             "message": message,
    #         }
    #     }))

    async def game_link(self, event):
        player1_id = event["player1_id"]
        player2_id = event["player2_id"]
        game_id = event["game_id"]
        content_type = event["content_type"]

        # Send message to WebSocket
        await self.send(text_data=json.dumps({
            "event_type": "game_link",
            "data": {
                "type": content_type,
                "sender": player1_id,
                "receiver": player2_id,
                "game_id": game_id
            }
        }))



    async def send_blocked_notification(self, receiver_display_name):
    
        error = f"You have been blocked by user {receiver_display_name}."

        await self.send(text_data=json.dumps({
            "event_type": "chat_message",
            "data": {
                "error": error,
            }
            # "notification": error
        }))

# # paddle movement
#     async def handle_move_paddle(self, data):
#         direction = data.get('direction')
#         if direction == 'up':
            
#         elif direction == 'down':
#             # 
#         game_state = {
#             "paddle1_position": 3,
#             "paddle2_position": 7,
#             "ball_position": {"x": 4, "y": 5},
#             "ball_velocity": {"x": 1, "y": -1},
#             "score_player1": 5,
#             "score_player2": 3,
#             "game_status": "ongoing",
#         }
#         self.send_game_state(game_state)

        
    
    async def send_game_state(self, game_state):
        # Send the current game state to the client
        self.send(text_data=json.dumps(game_state))

          
    async def send_json(self, content):
        await self.send(text_data=json.dumps(content))

    # DB functions
    
    # Save massages to database
    @database_sync_to_async
    def save_message(self, content, sender_id, receiver_id):
        sender = CustomUser.objects.get(id=sender_id)
        try:
            receiver = CustomUser.objects.get(id=receiver_id)
        except ObjectDoesNotExist:
            raise ValueError("Receiver does not exist")
        create_message_text_type(content, sender, receiver)
        # ChatMessage.objects.create(content=content, sender=sender, receiver=receiver)

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
    def save_invitation(self, sender_id, receiver_id):
        sender = CustomUser.objects.get(id=sender_id)
        try:
            receiver = CustomUser.objects.get(id=receiver_id)
        except ObjectDoesNotExist:
            raise ValueError("Receiver does not exist")
        invitation = GameInvitation.objects.create(sender=sender, receiver=receiver)
        return invitation
    
    @database_sync_to_async
    def check_if_exists(self, receiver_display_name):
        try:
            receiver = CustomUser.objects.get(display_name=receiver_display_name)
        except ObjectDoesNotExist:
            raise ValueError("Receiver does not exist")
        return receiver
