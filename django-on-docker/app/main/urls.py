from . import views
from django.urls import path, include

from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
	TokenVerifyView
)

urlpatterns = [

	path("login/", views.login, name ="login"),
	path("chat/", views.room, name="room"),

	path('api/register/', views.RegisterView.as_view()),   # registration: required display_name, email and username 
	path('api/userslist/', views.CustomUserAPIList.as_view()), # returns info for every user in db

	path('api/user/updateinfo/', views.CustomUserAPIUpdate.as_view()),

	path('api/getuser/<str:display_name>/', views.GetUserByDisplayName.as_view()),
	path('api/getfriends/<str:display_name>/', views.GetFriendsByDisplayName.as_view()),
	
	path('api/me/', views.GetUserMe.as_view()),

	path('api/userdetail/<int:pk>/', views.CuestomUserAPIDetailView.as_view()), # to delete a user

	path('api/user/getstats/<int:user_id>/', views.UserGetStatsView.as_view()),
	path('api/user/upload_avatar/', views.AvatarUploadView.as_view()),

	path('api/match/gethistory/', views.UserMatchHistoryView.as_view()),

	path('api/game/create/', views.CreateGameView.as_view()),
	path('api/game/getinfo/<str:game_id>/', views.GetGameInfoView.as_view()),
	path('api/game/list/<str:tournament_id>/', views.GetGamesByTTId.as_view()),

	# path('api/token/', TokenObtainPairView.as_view(), name='token_obtain_pair'), # get token pair: required pair email and password 
    
	path('api/token/', views.CustomTokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/token/verify-otp/', views.OTPVerificationView.as_view(), name='verify_otp'),
	path('api/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'), # get token pair: required refresh token; body example {"refresh": "..."}
	path('api/token/verify/', TokenVerifyView.as_view(), name='token_verify'),

	path('api/friends/showfriends/', views.FriendsListView.as_view(), name='friends_list'),
	path('api/friends/sendrequest/', views.SendFriendRequestView.as_view(), name='send_friend_request'), # makes a friend request to particular user 
	path('api/friends/approverequest/', views.ApproveFriendRequestView.as_view(), name='approve_friend_request'),
	path('api/friends/showrequests/', views.FriendshipRequestsView.as_view(), name='friendship_requests'), 
	path('api/friends/remove/', views.FriendRemoveView.as_view(), name='remove_friend'),

	path('api/blockuser/', views.BlockUserView.as_view(), name='block_user'),
	path('api/unblockuser/', views.UnblockUserView.as_view(), name='unblock_user'),

	path('api/chat/getmessages/<str:display_name>/', views.GetMessagesByDisplayNameView.as_view()),
	path('api/chat/getlast/', views.GetLastChatsView.as_view(), name='get_lastchats'),

	path('api/setup-2fa/', views.SetupTwoFactorAuthView.as_view(), name='setup_2fa'),
	path('api/confirm-2fa/', views.ConfirmTwoFactorAuthView.as_view(), name='confirm_2fa'),

	path('api/search/<str:string>/', views.UserSearchView.as_view(), name='user_search'),

	path('api/tournament/propose/', views.ProposeTournament.as_view()),
	path('api/tournament/accept/', views.AcceptTournamentInvitation.as_view()),
	path('api/tournament/decline/', views.DeclineTournamentInvitation.as_view()),
	path('api/tournament/my/', views.GetMyTournaments.as_view()),
	path('api/tournament/<str:tournament_id>/', views.GetTournamentById.as_view()),
	path('api/tournament/getwinner/<str:tournament_id>/', views.GetTournamentWinnerByTTId.as_view())

]


