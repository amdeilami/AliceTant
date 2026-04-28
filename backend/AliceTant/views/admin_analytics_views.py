from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from AliceTant.permissions import IsAdmin
from AliceTant.services.admin_analytics_service import AdminAnalyticsService
from AliceTant.views.auth_views import JWTAuthentication


class AdminUserAnalyticsView(APIView):
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated, IsAdmin]

    def get(self, request):
        days = int(request.query_params.get('days', 30))
        granularity = request.query_params.get('granularity')
        return Response(AdminAnalyticsService.user_growth(request.user, days=days, granularity=granularity), status=status.HTTP_200_OK)


class AdminBookingAnalyticsView(APIView):
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated, IsAdmin]

    def get(self, request):
        days = int(request.query_params.get('days', 30))
        granularity = request.query_params.get('granularity')
        return Response(AdminAnalyticsService.booking_trends(request.user, days=days, granularity=granularity), status=status.HTTP_200_OK)


class AdminCancellationAnalyticsView(APIView):
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated, IsAdmin]

    def get(self, request):
        days = int(request.query_params.get('days', 30))
        return Response(AdminAnalyticsService.cancellation_metrics(request.user, days=days), status=status.HTTP_200_OK)


class AdminBusinessPopularityAnalyticsView(APIView):
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated, IsAdmin]

    def get(self, request):
        limit = int(request.query_params.get('limit', 10))
        days = int(request.query_params.get('days', 30))
        return Response(AdminAnalyticsService.business_popularity(request.user, limit=limit, days=days), status=status.HTTP_200_OK)