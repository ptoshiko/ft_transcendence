import json
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from .models import ChatMessage, CustomUser, BlockUser, UserStatus
from django.core.exceptions import ObjectDoesNotExist

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
        message_type = text_data_json.get("type")
        if message_type == "invitation":
            await self.handle_invitation(text_data_json)
        else:
            await self.handle_private_message(text_data_json)


    # Handle private messages
    async def handle_private_message(self, data):    
        message = data.get("message", "").strip()
        receiver_id = self.scope["url_route"]["kwargs"]["receiver_id"]
        sender_id = self.sender.id

        if not message:
            return

        is_blocked = await self.is_blocked(receiver_id, sender_id)
        if is_blocked:
            await self.send_blocked_notification(sender_id, receiver_id)
            return

        await self.save_message(message, self.sender.id, receiver_id) 

        # send message to receiver's room
        await self.channel_layer.group_send(
            f"{receiver_id}",
            {
                "type": "chat.message",
                "message": message,
                "sender": self.sender.id,
                "receiver": receiver_id
            }
        )
        # send message to sender's room - echo 
        await self.send(text_data=json.dumps({
        "message": message,
        "sender": self.sender.id,
        "receiver": receiver_id
    }))

    # Receive message from room group
    async def chat_message(self, event):
        message = event["message"]
        sender = event["sender"]
        receiver = event["receiver"]

        # Send message to WebSocket
        await self.send(text_data=json.dumps({
            "message": message,
            "sender": sender,
            "receiver": receiver
        }))



    # Handle inviatations
    async def handle_invitation(self, data):
        receiver_id = data.get("receiver_id")
        sender_id = data.get("sender_id")
        game_type = data.get("game_type")

        is_blocked = await self.is_blocked(receiver_id, sender_id)
        if is_blocked:
            await self.send_blocked_notification(sender_id, receiver_id)
            return
        await self.send_invitation_notification(sender_id, receiver_id, game_type)


    async def send_invitation_notification(self, sender_id, receiver_id, game_type):

        invitation_message = f"User {sender_id} has invited you to play {game_type} game. Do you accept?"

        # Send the invitation to the receiver
        await self.channel_layer.group_send(
            f"{receiver_id}",
            {
                "type": "chat.invitation",
                "message": invitation_message,
                "sender": sender_id,
                "game_type": game_type
            }
        )
    async def chat_invitation(self, event):
        # This method sends the invitation message to WebSocket
        await self.send(text_data=json.dumps({
            "message": event["message"],
            "sender": event["sender"],
            "game_type": event["game_type"],
            "invitation": True  # Flag to indicate this is an invitation message
        }))
    
    async def handle_invitation_response(self, response_data):
        # Handle receiver's response to the invitation
        # Your implementation goes here
        pass


    async def send_blocked_notification(self, sender_id, receiver_id):
    
        notification_message = f"You have been blocked by user {receiver_id}."
        # Send the notification to the sender
        await self.send(text_data=json.dumps({
            "notification": notification_message
        }))


    # Save massages to database
    @database_sync_to_async
    def save_message(self, message, sender_id, receiver_id):
        sender = CustomUser.objects.get(id=sender_id)
        try:
            receiver = CustomUser.objects.get(id=receiver_id)
        except ObjectDoesNotExist:
            print ("User with username '{receiver_username}' does not exist.")
            return
        ChatMessage.objects.create(content=message, sender=sender, receiver=receiver)

    # Checking in database if the user is blocked 
    @database_sync_to_async
    def is_blocked(self, receiver_id, sender_id):
        return BlockUser.objects.filter(blocked_by_id=receiver_id, blocked_user_id=sender_id).exists()

    @database_sync_to_async
    def update_user_status(self, user, is_online):
        user_status, created = UserStatus.objects.get_or_create(user=user)
        user_status.is_online = is_online
        user_status.save()