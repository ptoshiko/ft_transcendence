# func to validate display_name for CustomUser model
from django.core.validators import RegexValidator

def validate_display_name(value):
    pattern = '^[a-zA-Z0-9_-]{3,50}$'
    validator = RegexValidator(regex=pattern, message='Display name must contain between 3 and 50 alphanumeric characters, underscores, and hyphens.')
    validator(value)