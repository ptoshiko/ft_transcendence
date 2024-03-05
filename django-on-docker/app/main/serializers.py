from rest_framework import serializers
from .models import CustomUser, Friendship

from django.utils import timezone
from django.utils.translation import gettext_lazy as _
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError

class CustomUserSerializer(serializers.ModelSerializer):
	class Meta(object):
		model = CustomUser
		fields = ['id', 'display_name', 'password', 'email']
        
		extra_kwargs = {
            'password': {'write_only': True}
		}


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








