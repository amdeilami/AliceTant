from rest_framework import serializers

from AliceTant.models import AuditLog, LoginEvent, PendingModification, SystemSetting, User, Business, Appointment


class AdminUserSerializer(serializers.ModelSerializer):
    display_name = serializers.SerializerMethodField()
    phone_number = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = [
            'id',
            'reference_id',
            'username',
            'email',
            'role',
            'display_name',
            'phone_number',
            'is_suspended',
            'suspended_at',
            'suspension_reason',
            'must_change_password',
            'last_login',
            'created_at',
        ]
        read_only_fields = fields

    def get_display_name(self, obj):
        if obj.role == 'CUSTOMER' and hasattr(obj, 'customer_profile'):
            return obj.customer_profile.full_name
        if obj.role == 'PROVIDER' and hasattr(obj, 'provider_profile'):
            return obj.provider_profile.business_name
        return obj.username

    def get_phone_number(self, obj):
        if obj.role == 'CUSTOMER' and hasattr(obj, 'customer_profile'):
            return obj.customer_profile.phone_number
        if obj.role == 'PROVIDER' and hasattr(obj, 'provider_profile'):
            return obj.provider_profile.phone_number
        return ''


class LoginEventSerializer(serializers.ModelSerializer):
    class Meta:
        model = LoginEvent
        fields = ['id', 'user', 'success', 'ip_address', 'user_agent', 'created_at']
        read_only_fields = fields


class AuditLogSerializer(serializers.ModelSerializer):
    actor_email = serializers.EmailField(source='actor.email', read_only=True)

    class Meta:
        model = AuditLog
        fields = ['id', 'actor', 'actor_email', 'action', 'target_type', 'target_id', 'details', 'ip_address', 'user_agent', 'created_at']
        read_only_fields = fields


class AdminBusinessSerializer(serializers.ModelSerializer):
    provider_name = serializers.CharField(source='provider.business_name', read_only=True)
    provider_email = serializers.EmailField(source='provider.user.email', read_only=True)

    class Meta:
        model = Business
        fields = [
            'id',
            'reference_id',
            'name',
            'summary',
            'phone',
            'email',
            'address',
            'provider_name',
            'provider_email',
            'is_hidden',
            'hidden_reason',
            'created_at',
            'updated_at',
        ]
        read_only_fields = fields


class PendingModificationReadSerializer(serializers.ModelSerializer):
    class Meta:
        model = PendingModification
        fields = [
            'id', 'proposed_by', 'proposed_by_user_id', 'new_date', 'new_time',
            'new_end_time', 'new_notes', 'status', 'created_at', 'resolved_at'
        ]
        read_only_fields = fields


class AdminAppointmentSerializer(serializers.ModelSerializer):
    business_name = serializers.CharField(source='business.name', read_only=True)
    customer_names = serializers.SerializerMethodField()
    customer_emails = serializers.SerializerMethodField()
    pending_modification = serializers.SerializerMethodField()

    class Meta:
        model = Appointment
        fields = [
            'id', 'reference_id', 'business', 'business_name', 'customer_names', 'customer_emails',
            'appointment_date', 'appointment_time', 'end_time', 'status', 'notes', 'pending_modification',
            'created_at', 'updated_at'
        ]
        read_only_fields = fields

    def get_customer_names(self, obj):
        return [customer.full_name for customer in obj.customers.all()]

    def get_customer_emails(self, obj):
        return [customer.user.email for customer in obj.customers.all()]

    def get_pending_modification(self, obj):
        mod = obj.pending_modifications.filter(status=PendingModification.ModificationStatus.PENDING).order_by('-created_at').first()
        if not mod:
            return None
        return PendingModificationReadSerializer(mod).data


class SystemSettingSerializer(serializers.ModelSerializer):
    updated_by_email = serializers.EmailField(source='updated_by.email', read_only=True)
    parsed_value = serializers.SerializerMethodField()

    class Meta:
        model = SystemSetting
        fields = ['key', 'value', 'parsed_value', 'value_type', 'description', 'updated_at', 'updated_by', 'updated_by_email']
        read_only_fields = ['updated_at', 'updated_by', 'updated_by_email', 'parsed_value']

    def get_parsed_value(self, obj):
        if obj.value_type == SystemSetting.ValueType.INT:
            return int(obj.value)
        if obj.value_type == SystemSetting.ValueType.BOOL:
            return obj.value.lower() == 'true'
        if obj.value_type == SystemSetting.ValueType.JSON:
            import json
            return json.loads(obj.value or '{}')
        return obj.value