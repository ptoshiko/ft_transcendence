# Generated by Django 4.2.9 on 2024-05-20 16:13

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('main', '0025_customuser_is_otp_required'),
    ]

    operations = [
        migrations.AddField(
            model_name='usertwofactorauthdata',
            name='setup_complete',
            field=models.BooleanField(default=False),
        ),
        migrations.AddField(
            model_name='usertwofactorauthdata',
            name='setup_initiated_at',
            field=models.DateTimeField(blank=True, null=True),
        ),
    ]