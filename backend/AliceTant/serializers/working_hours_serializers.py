from rest_framework import serializers
from AliceTant.models import WorkingHours, BusinessClosure


class WorkingHoursSerializer(serializers.ModelSerializer):
    day_name = serializers.SerializerMethodField()

    class Meta:
        model = WorkingHours
        fields = [
            'id', 'business', 'day_of_week', 'day_name',
            'open_time', 'close_time', 'is_closed',
        ]
        read_only_fields = ['id']

    def get_day_name(self, obj):
        return dict(WorkingHours.DAY_CHOICES).get(obj.day_of_week, '')


class BusinessClosureSerializer(serializers.ModelSerializer):
    class Meta:
        model = BusinessClosure
        fields = [
            'id', 'business', 'title', 'start_date', 'end_date', 'reason', 'created_at',
        ]
        read_only_fields = ['id', 'created_at']

    def validate(self, data):
        if data.get('end_date') and data.get('start_date'):
            if data['end_date'] < data['start_date']:
                raise serializers.ValidationError(
                    {'end_date': 'End date must be on or after start date.'}
                )
        return data
