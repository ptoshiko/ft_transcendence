from django.core.validators import RegexValidator
from itertools import combinations

# func to validate display_name for CustomUser model
def validate_display_name(value):
    pattern = '^[a-zA-Z0-9_-]{3,50}$'
    validator = RegexValidator(regex=pattern, message='Display name must contain between 3 and 50 alphanumeric characters, underscores, and hyphens.')
    validator(value)

def generate_round_schedule(n):
    participants = list(range(1, n + 1))  # Generate a list of participant IDs
    
    schedule = []
    
    # Generate matches for each unique combination of participants
    for match in combinations(participants, 2):
        schedule.append(match)
    
    return schedule