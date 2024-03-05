from . import views
from django.urls import path, include

from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
	TokenVerifyView
)

urlpatterns = [
	
	path("", views.index, name="index"),
	path("<str:room_name>/", views.room, name="room"),

	path('api/register/', views.RegisterView.as_view()),   # registration: required display_name, email and username 

	path('api/userslist/', views.CustomUserAPIList.as_view()), # returns info for every user in db
	path('api/updateinfo/<int:pk>/', views.CustomUserAPIUpdate.as_view()), # updates info of owner
	path('api/getinfo/<int:pk>/', views.CustomUserAPIRetrieve.as_view()), # returns info for particular user in db
	path('api/userdetail/<int:pk>/', views.CuestomUserAPIDetailView.as_view()),

	path('api/token/', TokenObtainPairView.as_view(), name='token_obtain_pair'), # get token pair: required pair email and password 
    path('api/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'), # get token pair: required refresh token; body example {"refresh": "..."}
	path('api/token/verify/', TokenVerifyView.as_view(), name='token_verify'),

	path('api/showfriends/', views.FriendsListView.as_view(), name='friends_list'),
	path('api/sendfriendrequest/', views.SendFriendRequestView.as_view(), name='send_friend_request'), # makes a friend request to particular user 
	path('api/approvefriendrequest/', views.ApproveFriendRequestView.as_view(), name='approve_friend_request'),
	path('api/friendrequests/', views.FriendshipRequestsView.as_view(), name='friendship_requests'), 
]


