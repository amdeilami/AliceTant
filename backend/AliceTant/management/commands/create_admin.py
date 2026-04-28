from django.contrib.auth.password_validation import validate_password
from django.core.management.base import BaseCommand, CommandError

from AliceTant.models import User, UserRole
from AliceTant.services.auth_service import AuthService


class Command(BaseCommand):
    help = 'Create an admin user for the AliceTant application.'

    def add_arguments(self, parser):
        parser.add_argument('--email', type=str, help='Admin email address')
        parser.add_argument('--password', type=str, help='Admin password')

    def handle(self, *args, **options):
        email = (options.get('email') or self._prompt_required('Email')).strip().lower()
        password = options.get('password') or self._prompt_required('Password', secret=True)

        if User.objects.filter(email=email).exists():
            raise CommandError(f"User with email '{email}' already exists")

        validate_password(password)

        username = AuthService.generate_username(email)
        user = User.objects.create_user(
            username=username,
            email=email,
            password=password,
            role=UserRole.ADMIN,
            is_staff=True,
        )

        self.stdout.write(self.style.SUCCESS(
            f"Admin user created successfully: {user.email} ({user.username})"
        ))

    def _prompt_required(self, label, secret=False):
        value = self.get_input_data(label, secret=secret).strip()
        if not value:
            raise CommandError(f'{label} is required')
        return value

    def get_input_data(self, label, secret=False):
        if secret:
            import getpass
            return getpass.getpass(f'{label}: ')
        return input(f'{label}: ')