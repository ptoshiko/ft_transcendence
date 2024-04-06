import json
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from .models import ChatMessage, CustomUser, BlockUser
from django.core.exceptions import ObjectDoesNotExist

class ChatConsumer(AsyncWebsocketConsumer):
    async def connect(self):

        self.sender = self.scope["user"]
        # self.receiver_id= self.scope["url_route"]["kwargs"]["receiver_id"]
        self.room_name = f"{self.sender.id}"
        # Join room group
        await self.channel_layer.group_add(self.room_name, self.channel_name)
        await self.accept()

    async def disconnect(self, close_code):
        # Leave room group
        await self.channel_layer.group_discard(self.room_name, self.channel_name)


    async def receive(self, text_data):
        text_data_json = json.loads(text_data)
        message = text_data_json.get("message", "").strip()
        receiver_id = self.scope["url_route"]["kwargs"]["receiver_id"]
        sender_id = self.sender.id

        if not message:
            return

        is_blocked = await self.is_blocked(receiver_id, sender_id)
        if is_blocked:
            await self.send_blocked_notification(sender_id, receiver_id)
            return

        await self.save_message(message, self.sender.id, receiver_id) 

        # Send message to receiver's room
        await self.channel_layer.group_send(
            f"{receiver_id}",
            {
                "type": "chat.message",
                "message": message,
                "sender": self.sender.id,
                "receiver": receiver_id
            }
        )

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

    @database_sync_to_async
    def save_message(self, message, sender_id, receiver_id):
        sender = CustomUser.objects.get(id=sender_id)
        try:
            receiver = CustomUser.objects.get(id=receiver_id)
        except ObjectDoesNotExist:
            print ("User with username '{receiver_username}' does not exist.")
            return

        ChatMessage.objects.create(content=message, sender=sender, receiver=receiver)

    @database_sync_to_async
    def is_blocked(self, receiver_id, sender_id):
        return BlockUser.objects.filter(blocked_by_id=receiver_id, blocked_user_id=sender_id).exists()

    async def send_blocked_notification(self, sender_id, receiver_id):
        
        notification_message = f"You have been blocked by user {receiver_id}."
        # Send the notification to the sender
        await self.send(text_data=json.dumps({
            "notification": notification_message
        }))