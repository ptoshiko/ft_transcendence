# Generated by Django 4.2.9 on 2024-05-10 11:24

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('main', '0015_tournament_delete_matchhistory'),
    ]

    operations = [
        migrations.AddField(
            model_name='tournament',
            name='participant_points',
            field=models.JSONField(default=dict),
        ),
        migrations.DeleteModel(
            name='GameInvitation',
        ),
    ]
