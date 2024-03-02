from django.urls import path

from . import consumers

websocket_urlpatterns = [
    path('wss/', consumers.ChatConsumer.as_asgi()),
]
