import os

from channels.auth import AuthMiddlewareStack
from channels.routing import ProtocolTypeRouter, URLRouter
# from channels.security.websocket import AllowedHostsOriginValidator

import main.routing
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'trans_django.settings')

application = ProtocolTypeRouter({
	"websocket":AuthMiddlewareStack(
			URLRouter(
			    main.routing.websocket_urlpatterns
            )
        )
})



