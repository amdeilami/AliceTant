"""
Migration: Add date and recurring_group fields to Availability.

- Adds `date` field (DateField)
- Adds `recurring_group` field (UUIDField, nullable)
- Populates `date` for existing rows using a forward reference date based on day_of_week
- Changes unique_together from (business, day_of_week, start_time) to (business, date, start_time)
- Changes ordering to ['date', 'start_time']
"""

from django.db import migrations, models
import django.core.validators
from datetime import date, timedelta


def populate_date_from_day_of_week(apps, schema_editor):
    """
    For existing availability rows that have day_of_week but no date,
    assign the next occurrence of that day_of_week starting from today.
    
    day_of_week mapping: 0=Sunday, 1=Monday, ..., 6=Saturday
    Python weekday():     0=Monday, ..., 6=Sunday
    """
    Availability = apps.get_model('AliceTant', 'Availability')
    today = date.today()
    # Python weekday: Mon=0..Sun=6; our scheme: Sun=0..Sat=6
    # Map our day_of_week to Python weekday
    our_to_python = {0: 6, 1: 0, 2: 1, 3: 2, 4: 3, 5: 4, 6: 5}

    for avail in Availability.objects.all():
        target_py_weekday = our_to_python[avail.day_of_week]
        days_ahead = target_py_weekday - today.weekday()
        if days_ahead < 0:
            days_ahead += 7
        avail.date = today + timedelta(days=days_ahead)
        avail.save(update_fields=['date'])


class Migration(migrations.Migration):

    dependencies = [
        ('AliceTant', '0010_availability_capacity_appointment_timerange'),
    ]

    operations = [
        # 1. Add date field as nullable first
        migrations.AddField(
            model_name='availability',
            name='date',
            field=models.DateField(
                help_text='The specific date this availability is for',
                null=True,
            ),
        ),
        # 2. Add recurring_group field
        migrations.AddField(
            model_name='availability',
            name='recurring_group',
            field=models.UUIDField(
                blank=True,
                null=True,
                help_text='Groups recurring slots created together. NULL for one-off slots.',
            ),
        ),
        # 3. Populate date for existing rows
        migrations.RunPython(populate_date_from_day_of_week, migrations.RunPython.noop),
        # 4. Make date non-nullable
        migrations.AlterField(
            model_name='availability',
            name='date',
            field=models.DateField(
                help_text='The specific date this availability is for',
            ),
        ),
        # 5. Remove old unique_together
        migrations.AlterUniqueTogether(
            name='availability',
            unique_together=set(),
        ),
        # 6. Set new unique_together and ordering
        migrations.AlterUniqueTogether(
            name='availability',
            unique_together={('business', 'date', 'start_time')},
        ),
        migrations.AlterModelOptions(
            name='availability',
            options={
                'ordering': ['date', 'start_time'],
                'verbose_name': 'Availability',
                'verbose_name_plural': 'Availabilities',
            },
        ),
    ]
