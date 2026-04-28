from django.apps import AppConfig


class AlicetantConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'AliceTant'

    def ready(self):
        import AliceTant.signals  # noqa: F401
