# Generated by Django 4.2.9 on 2024-05-11 15:03

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('main', '0021_chatmessage_extra_details'),
    ]

    operations = [
        migrations.AlterField(
            model_name='chatmessage',
            name='extra_details',
            field=models.TextField(default=''),
        ),
    ]
