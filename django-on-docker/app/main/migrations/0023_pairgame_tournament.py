# Generated by Django 4.2.9 on 2024-05-12 14:35

from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('main', '0022_alter_chatmessage_extra_details'),
    ]

    operations = [
        migrations.AddField(
            model_name='pairgame',
            name='tournament',
            field=models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, to='main.tournament'),
        ),
    ]
