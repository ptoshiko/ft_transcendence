from rest_framework import serializers
from .models import CustomUser, Friendship, ChatMessage, MatchHistory

from django.utils import timezone
from django.utils.translation import gettext_lazy as _
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError

class CustomUserSerializer(serializers.ModelSerializer):
    is_me = serializers.SerializerMethodField()
    class Meta(object):
        model = CustomUser
        fields = ['id', 'display_name', 'password', 'email', 'is_me']
        
        extra_kwargs = {
            'password': {'write_only': True}
        }
    def get_is_me(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return 1 if obj.display_name == request.user.display_name else 0
        return 0 

class FriendshipSerializer(serializers.ModelSerializer):
    class Meta:
        model = Friendship
        fields = ['sender', 'receiver', 'status', 'created_at']


class FriendshipRequestSerializer(serializers.ModelSerializer):
    class Meta:
        model = Friendship
        fields = ['sender', 'status', 'created_at'] 


class RegisterSerializer(serializers.ModelSerializer):

    class Meta:
        model = CustomUser
        fields = ('display_name', 'email', 'password')
        extra_kwargs = {
            'password': {'write_only': True}
		}

    def create(self, validated_data):
        user = CustomUser.objects.create(
            display_name=validated_data['display_name'],
            email=validated_data['email'],
            password = validated_data['password']
        )
        try:
            validate_password(password=validated_data['password'], user=user)
        except ValidationError as err:
            user.delete()
            raise serializers.ValidationError({'password': err.messages})
        user.set_password(validated_data['password'])
        user.save()
        return user
    

class UpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = CustomUser
        fields = ('display_name', 'email', 'password')
        
        extra_kwargs = {
             'password':{'write_only':True} 
        }
    def update(self, instance, validated_data):
        instance.email = validated_data.get('email', instance.email)
        instance.display_name = validated_data.get('display_name', instance.display_name)
        instance.password = validated_data.get('password', instance.password)

        try:
            validate_password(password=validated_data['password'], user=instance)
        except ValidationError as err:
            raise serializers.ValidationError({'password': err.messages})
        instance.set_password(validated_data['password'])
        instance.save()
        return instance
    
class ChatMessageSerializer(serializers.ModelSerializer):
    class Meta:
        model = ChatMessage
        fields = ['sender', 'receiver', 'content', 'date_added']


class MatchHistorySerializer(serializers.ModelSerializer):
    class Meta:
        model = MatchHistory
        fields = ['player1', 'player2', 'player1_result', 'player2_result']


class MatchCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = MatchHistory
        fields = ['player1', 'player2', 'player1_result', 'player2_result']

    def validate(self, data):
        player1_result = data.get('player1_result')
        player2_result = data.get('player2_result')

        if player1_result not in [0, 1] or player2_result not in [0, 1]:
            raise serializers.ValidationError("Result must be either 0 or 1")

        if player1_result == 1 and player2_result == 1:
            raise serializers.ValidationError("Both results cannot equal 1")

        return data
