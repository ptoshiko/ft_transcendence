from rest_framework.response import Response
from rest_framework import status

class CheckIdMixin:
    def check_id(self, id_value, id_type):
        if id_value is None:
            return Response({'error': f'Key "{id_type}" is missing'}, status=status.HTTP_400_BAD_REQUEST)
        try:
            id_value = int(id_value)
        except ValueError:
            return Response({'error': f'Invalid value for "{id_type}"'}, status=status.HTTP_400_BAD_REQUEST)
        
        return None

class CheckTournamentIdMixin:
    def check_tt_id(self, id_value, id_type):
        if id_value is None:
            return Response({'error': f'Key "{id_type}" is missing'}, status=status.HTTP_400_BAD_REQUEST)
        if not isinstance(id_value, str) or len(id_value) != 32:
             return Response({'error': f'Invalid value for "{id_type}"'}, status=status.HTTP_400_BAD_REQUEST)

        return None

    
