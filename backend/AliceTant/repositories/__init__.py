"""
Database interface layer for the AliceTant application.

This module provides repository classes that abstract database operations
from business logic, ensuring a clean separation of concerns.
"""

from .user_repository import UserRepository

__all__ = ['UserRepository']
