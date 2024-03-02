from rest_framework import permissions

class IsAdminOrReadnly(permissions.BasePermission):
	def has_permission(self, request, view):
		if request.method in permissions.SAFE_METHODS: 
			return True 
		
		return bool(request.user and request.user.is_staff)
	
class IsOwnerOrReadOnly(permissions.BasePermission):
    def has_object_permission(self, request, view, obj):	     
       	if request.method in permissions.SAFE_METHODS: 
            return True
		   
        return bool(obj == request.user)