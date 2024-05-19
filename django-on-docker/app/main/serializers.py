from rest_framework import serializers
from .models import CustomUser, Friendship, ChatMessage, BlockUser, PairGame, Tournament, UserTwoFactorAuthData

from django.utils import timezone
from django.utils.translation import gettext_lazy as _
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError

class CustomUserSerializer(serializers.ModelSerializer):
    class Meta(object):
        model = CustomUser
        fields = ['id', 'display_name', 'password', 'email', 'avatar', 'is_online']
        
        extra_kwargs = {
            'password': {'write_only': True}
        }

class ByDisplayNameSerializer(serializers.ModelSerializer):
    is_me = serializers.SerializerMethodField()
    class Meta(object):
        model = CustomUser
        fields = ['id', 'display_name', 'password', 'email', 'avatar', 'is_me', 'is_online']
        
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
        fields = ['id', 'sender', 'status', 'created_at'] 


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
        if 'password' in validated_data:
            password = validated_data.pop('password')
            try:
                validate_password(password)
            except ValidationError as err:
                raise serializers.ValidationError({'password': err.messages})
            instance.set_password(password)

        instance.email = validated_data.get('email', instance.email)
        instance.display_name = validated_data.get('display_name', instance.display_name)
        instance.save()
        return instance
    
class ChatMessageSerializer(serializers.ModelSerializer):
    class Meta:
        model = ChatMessage
        fields = ['sender', 'receiver', 'content', 'date_added', 'content_type', 'extra_details']


class AvatarUploadSerializer(serializers.ModelSerializer):
    class Meta:
        model = CustomUser
        fields = ['avatar']

class BlockUserSerializer(serializers.ModelSerializer):
    class Meta:
        model = BlockUser
        fields = '__all__' 

class PairGameSerializer(serializers.ModelSerializer):

    won_id = serializers.SerializerMethodField()

    display_name_p1 = serializers.SerializerMethodField()
    display_name_p2 = serializers.SerializerMethodField()

    class Meta:
        model = PairGame
        fields = ['player1', 'player2', 'game_id', 'player1_score', 'player2_score', 'won_id', 'date_created', 'display_name_p1', 'display_name_p2']

    def get_won_id(self, obj):
       if obj.status != PairGame.FINISHED:
            return None
       if obj.player1_score > obj.player2_score:
            return obj.player1_id
       elif obj.player2_score > obj.player1_score:
            return obj.player2_id
       else:
            return None
    
    def get_display_name_p1(self, obj):
        return obj.player1.display_name
    
    def  get_display_name_p2(self, obj):
        return obj.player2.display_name
    
       
class TournamentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Tournament
        fields = ['created_at', 'status', 'tournament_id']

class TournamentDetailedSerializer(serializers.ModelSerializer):
    class Meta:
        model = Tournament
        fields = ['participants', 'created_at', 'status', 'participant_points', 'tournament_id']


from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    def validate(self, attrs):
        data = super().validate(attrs)

        # Add custom claim
        user = self.user
        if user.is_otp_required:
            data['is_otp_required'] = True
        else:
            refresh = self.get_token(self.user)
            data['refresh'] = str(refresh)
            data['access'] = str(refresh.access_token)

        return data

import pyotp
class OTPVerificationSerializer(serializers.Serializer):
    email = serializers.EmailField()
    otp_code = serializers.CharField()

    def validate(self, data):
        email = data.get('email')
        otp_code = data.get('otp_code')
        
        try:
            user = CustomUser.objects.get(email=email)
        except CustomUser.DoesNotExist:
            raise serializers.ValidationError('Invalid email address')

        if not user.is_otp_required:
            raise serializers.ValidationError('OTP verification is not required for this user')

        try:
            two_factor_auth_data = UserTwoFactorAuthData.objects.get(user=user)
        except UserTwoFactorAuthData.DoesNotExist:
            raise serializers.ValidationError('OTP secret not found for this user')

        if not two_factor_auth_data.validate_otp(otp_code):
            raise serializers.ValidationError('Invalid OTP code')


        return data
    