"""
Property-based tests for the UserRepository.

This module contains property-based tests using Hypothesis to verify
correctness properties of the UserRepository CRUD and query operations.
"""

from django.db import transaction
from hypothesis import given, settings, strategies as st, assume
from hypothesis.extra.django import TestCase

from AliceTant.models import User, UserRole
from AliceTant.repositories.user_repository import UserRepository
from AliceTant.exceptions import (
    UserNotFoundError,
    DuplicateUserError,
    InvalidUserDataError
)


# Hypothesis strategies for generating test data
def valid_username():
    """Generate valid usernames (alphanumeric, 3-30 chars)."""
    return st.text(
        alphabet='abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789',
        min_size=3,
        max_size=30
    )


def valid_email():
    """Generate valid email addresses."""
    return st.builds(
        lambda local, domain, tld: f"{local}@{domain}.{tld}",
        local=st.text(alphabet='abcdefghijklmnopqrstuvwxyz0123456789', min_size=1, max_size=20),
        domain=st.text(alphabet='abcdefghijklmnopqrstuvwxyz', min_size=1, max_size=20),
        tld=st.sampled_from(['com', 'org', 'net', 'edu', 'gov'])
    )


def valid_password():
    """Generate valid passwords that pass Django validation (min 8 chars, mixed content)."""
    # Generate passwords with mixed characters to avoid common password validation errors
    return st.builds(
        lambda letters, digits, special: f"{letters}{digits}{special}",
        letters=st.text(
            alphabet='abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ',
            min_size=4,
            max_size=10
        ),
        digits=st.text(alphabet='0123456789', min_size=2, max_size=5),
        special=st.text(alphabet='!@#$%^&*', min_size=2, max_size=3)
    )


def valid_role():
    """Generate valid user roles."""
    return st.sampled_from([UserRole.PROVIDER, UserRole.CUSTOMER])


class RepositoryCRUDPropertyTests(TestCase):
    """
    Property-based tests for UserRepository CRUD operations.
    """
    
    @settings(max_examples=100, deadline=None)
    @given(
        username1=valid_username(),
        email1=valid_email(),
        username2=valid_username(),
        email2=valid_email(),
        password=valid_password(),
        role=valid_role()
    )
    def test_property_3_uniqueness_enforcement(
        self, username1, email1, username2, email2, password, role
    ):
        """
        Feature: user-data-model, Property 3: Uniqueness enforcement
        
        For any existing user, attempting to create a new user with the same
        username or email should raise a DuplicateUserError.
        
        Validates: Requirements 1.3, 5.1, 5.2
        """
        # Create first user
        user1 = UserRepository.create_user(
            username=username1,
            email=email1,
            password=password,
            role=role
        )
        
        # Attempt to create user with same username (different email)
        assume(email2 != email1)  # Ensure emails are different
        with self.assertRaises(DuplicateUserError) as context:
            UserRepository.create_user(
                username=username1,  # Same username
                email=email2,
                password=password,
                role=role
            )
        self.assertIn('username', str(context.exception).lower())
        
        # Attempt to create user with same email (different username)
        assume(username2 != username1)  # Ensure usernames are different
        with self.assertRaises(DuplicateUserError) as context:
            UserRepository.create_user(
                username=username2,
                email=email1,  # Same email
                password=password,
                role=role
            )
        self.assertIn('email', str(context.exception).lower())
    
    @settings(max_examples=100, deadline=None)
    @given(
        username=valid_username(),
        email=valid_email(),
        password=valid_password(),
        role=valid_role(),
        new_email=valid_email(),
        new_first_name=st.text(min_size=1, max_size=30)
    )
    def test_property_9_crud_operations_consistency(
        self, username, email, password, role, new_email, new_first_name
    ):
        """
        Feature: user-data-model, Property 9: CRUD operations consistency
        
        For any user, performing create, read, update, and delete operations
        through the repository should maintain data consistency and return
        expected data types.
        
        Validates: Requirements 4.3, 4.5
        """
        # CREATE: Create a user
        user = UserRepository.create_user(
            username=username,
            email=email,
            password=password,
            role=role
        )
        self.assertIsInstance(user, User)
        self.assertEqual(user.username, username)
        self.assertEqual(user.email, email)
        
        # READ: Retrieve the user by ID
        retrieved_user = UserRepository.get_user_by_id(user.id)
        self.assertIsInstance(retrieved_user, User)
        self.assertEqual(retrieved_user.id, user.id)
        self.assertEqual(retrieved_user.username, username)
        
        # READ: Retrieve by username
        retrieved_by_username = UserRepository.get_user_by_username(username)
        self.assertEqual(retrieved_by_username.id, user.id)
        
        # READ: Retrieve by email
        retrieved_by_email = UserRepository.get_user_by_email(email)
        self.assertEqual(retrieved_by_email.id, user.id)
        
        # UPDATE: Update user fields
        assume(new_email != email)  # Ensure new email is different
        updated_user = UserRepository.update_user(
            user,
            email=new_email,
            first_name=new_first_name
        )
        self.assertIsInstance(updated_user, User)
        self.assertEqual(updated_user.email, new_email)
        self.assertEqual(updated_user.first_name, new_first_name)
        self.assertEqual(updated_user.username, username)  # Username unchanged
        
        # Verify update persisted
        retrieved_after_update = UserRepository.get_user_by_id(user.id)
        self.assertEqual(retrieved_after_update.email, new_email)
        self.assertEqual(retrieved_after_update.first_name, new_first_name)
        
        # DELETE: Delete the user
        result = UserRepository.delete_user(user.id)
        self.assertTrue(result)
        
        # Verify user no longer exists
        with self.assertRaises(UserNotFoundError):
            UserRepository.get_user_by_id(user.id)


class RepositoryQueryPropertyTests(TestCase):
    """
    Property-based tests for UserRepository query operations.
    """
    
    @settings(max_examples=100, deadline=None)
    @given(
        usernames=st.lists(valid_username(), min_size=3, max_size=10, unique=True),
        emails=st.lists(valid_email(), min_size=3, max_size=10, unique=True),
        password=valid_password(),
        target_role=valid_role(),
        roles=st.lists(valid_role(), min_size=3, max_size=10)
    )
    def test_property_10_query_correctness(
        self, usernames, emails, password, target_role, roles
    ):
        """
        Feature: user-data-model, Property 10: Query correctness
        
        For any set of users, querying by username, email, or role should
        return only users matching the query criteria.
        
        Validates: Requirements 7.1, 7.2, 7.3
        """
        # Ensure we have enough unique emails and roles
        assume(len(emails) >= len(usernames))
        assume(len(roles) >= len(usernames))
        
        # Create users with mixed roles
        created_users = []
        for i, username in enumerate(usernames):
            # Use the first user with target_role, others with generated roles
            role = target_role if i == 0 else roles[i]
            
            user = UserRepository.create_user(
                username=username,
                email=emails[i],
                password=password,
                role=role
            )
            created_users.append(user)
        
        # Test query by username
        test_username = usernames[0]
        user_by_username = UserRepository.get_user_by_username(test_username)
        self.assertEqual(user_by_username.username, test_username)
        
        # Test query by email
        test_email = emails[0]
        user_by_email = UserRepository.get_user_by_email(test_email)
        self.assertEqual(user_by_email.email, test_email)
        
        # Test query by role
        users_by_role = UserRepository.get_users_by_role(target_role)
        # All returned users should have the target role
        for user in users_by_role:
            self.assertEqual(user.role, target_role)
        
        # At least one user should be returned (we created one with target_role)
        self.assertGreaterEqual(len(users_by_role), 1)
    
    @settings(max_examples=50, deadline=None)
    @given(
        usernames=st.lists(valid_username(), min_size=5, max_size=10, unique=True),
        emails=st.lists(valid_email(), min_size=5, max_size=10, unique=True),
        limit=st.integers(min_value=2, max_value=5),
        offset=st.integers(min_value=0, max_value=3),
        password=valid_password(),
        role=valid_role()
    )
    def test_property_11_pagination_correctness(
        self, usernames, emails, limit, offset, password, role
    ):
        """
        Feature: user-data-model, Property 11: Pagination correctness
        
        For any set of users and pagination parameters (limit, offset),
        the paginated results should return the correct subset of users
        without duplicates or omissions.
        
        Validates: Requirements 7.4
        """
        # Ensure we have enough unique emails
        assume(len(emails) >= len(usernames))
        
        # Create users
        created_users = []
        for i in range(len(usernames)):
            try:
                user = UserRepository.create_user(
                    username=usernames[i],
                    email=emails[i],
                    password=password,
                    role=role
                )
                created_users.append(user)
            except (DuplicateUserError, InvalidUserDataError):
                # Skip if duplicate or validation error
                continue
        
        # Skip test if we couldn't create enough users
        assume(len(created_users) >= 5)
        
        # Get all users first to know the total count
        all_users = UserRepository.get_all_users(limit=1000, offset=0)
        total_count = len(all_users)
        
        # Get paginated results
        paginated_users = UserRepository.get_all_users(limit=limit, offset=offset)
        
        # Verify result is a list
        self.assertIsInstance(paginated_users, list)
        
        # Verify no more than limit users returned
        self.assertLessEqual(len(paginated_users), limit)
        
        # Verify all returned users are User instances
        for user in paginated_users:
            self.assertIsInstance(user, User)
        
        # Verify no duplicates in results
        user_ids = [user.id for user in paginated_users]
        self.assertEqual(len(user_ids), len(set(user_ids)))
        
        # Verify correct count based on offset and limit
        if offset >= total_count:
            self.assertEqual(len(paginated_users), 0)
        else:
            expected_count = min(limit, total_count - offset)
            self.assertEqual(len(paginated_users), expected_count)
