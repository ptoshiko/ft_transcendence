# Generated by Django 4.2.9 on 2024-05-10 21:35

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('main', '0018_alter_pairgame_status_alter_tournament_status'),
    ]

    operations = [
        migrations.AddField(
            model_name='tournament',
            name='tournament_id',
            field=models.CharField(default=0, max_length=32, unique=True),
        ),
        migrations.AlterField(
            model_name='chatmessage',
            name='content_type',
            field=models.IntegerField(choices=[(1, 'Text'), (2, 'GameID'), (3, 'TournamentID')], default=1),
        ),
    ]