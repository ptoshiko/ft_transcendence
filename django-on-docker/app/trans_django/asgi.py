import os

# Initialize Django ASGI application -- should be on top
from django.core.asgi import get_asgi_application
django_asgi_app = get_asgi_application()

# from channels.auth import AuthMiddlewareStack
from channels.routing import ProtocolTypeRouter, URLRouter
from channels.security.websocket import AllowedHostsOriginValidator
from main.routing import websocket_urlpatterns

from main.middleware import JwtAuthMiddlewareStack

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'trans_django.settings')

application = ProtocolTypeRouter(
    {
        "http": django_asgi_app,
        "websocket": AllowedHostsOriginValidator(
            JwtAuthMiddlewareStack(URLRouter(websocket_urlpatterns))
        ),
    }
)



