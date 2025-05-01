from django.db.models import Count, Q, F, Value, CharField
from django.db.models.functions import Concat, TruncMonth
from .models import Event, User, UserEvent, InterestedEvent
from django.utils import timezone
from datetime import datetime, timedelta
from django.db import connection

class OptimizedQueries:
    @staticmethod
    def event_statistics():
        """
        Optimized query to get comprehensive event statistics in a single database hit
        """
        with connection.cursor() as cursor:
            try:
                cursor.execute("""
                    WITH event_stats AS (
                        SELECT
                            category,
                            COUNT(*) as category_count,
                            SUM(CASE WHEN is_online THEN 1 ELSE 0 END) as online_count,
                            SUM(CASE WHEN is_online THEN 0 ELSE 1 END) as offline_count,
                            MAX(LENGTH(description)) as max_desc_length,
                            MIN(date) as earliest_date,
                            MAX(date) as latest_date,
                            COUNT(DISTINCT created_by) as unique_creators
                        FROM api_event
                        GROUP BY category
                    ),
                    monthly_counts AS (
                        SELECT 
                            DATE_TRUNC('month', date) as month,
                            COUNT(*) as monthly_count
                        FROM api_event
                        GROUP BY month
                        ORDER BY month
                    ),
                    user_engagement AS (
                        SELECT
                            u.id as user_id,
                            COUNT(DISTINCT ie.event_id) as interested_count,
                            COUNT(DISTINCT e.id) as created_count,
                            (COUNT(DISTINCT ie.event_id) + COUNT(DISTINCT e.id)) as total_engagement
                        FROM api_user u
                        LEFT JOIN api_interestedevent ie ON u.id = ie.user_id
                        LEFT JOIN api_event e ON u.id = e.created_by
                        GROUP BY u.id
                    )
                    SELECT 
                        json_build_object(
                            'categories', (
                                SELECT json_agg(
                                    json_build_object(
                                        'name', category,
                                        'count', category_count,
                                        'online_percent', CASE WHEN category_count > 0 
                                                        THEN (online_count * 100.0 / category_count)
                                                        ELSE 0 END
                                    )
                                )
                                FROM event_stats
                            ),
                            'monthly_trend', (
                                SELECT json_agg(
                                    json_build_object(
                                        'month', month,
                                        'count', monthly_count
                                    )
                                    ORDER BY month
                                )
                                FROM monthly_counts
                            ),
                            'most_engaged_users', (
                                SELECT json_agg(
                                    json_build_object(
                                        'user_id', user_id,
                                        'interested_count', interested_count,
                                        'created_count', created_count,
                                        'total_engagement', total_engagement
                                    )
                                )
                                FROM (
                                    SELECT * FROM user_engagement
                                    ORDER BY total_engagement DESC
                                    LIMIT 10
                                ) top_users
                            ),
                            'summary', json_build_object(
                                'total_events', (SELECT SUM(category_count) FROM event_stats),
                                'online_percent', (
                                    SELECT 
                                        CASE 
                                            WHEN SUM(category_count) > 0 
                                            THEN (SUM(online_count) * 100.0 / SUM(category_count))
                                            ELSE 0 
                                        END 
                                    FROM event_stats
                                ),
                                'date_range', json_build_object(
                                    'earliest', (SELECT MIN(earliest_date) FROM event_stats),
                                    'latest', (SELECT MAX(latest_date) FROM event_stats)
                                ),
                                'unique_creators', (SELECT SUM(unique_creators) FROM event_stats)
                            )
                        )
                """)
                
                result = cursor.fetchone()[0]
                return result
            except Exception as e:
                print(f"SQL Error in event_statistics: {str(e)}")
                # Provide a fallback simple response when the query fails
                return {
                    "error": str(e),
                    "status": "Query failed, using fallback data",
                    "categories": [],
                    "monthly_trend": [],
                    "most_engaged_users": [],
                    "summary": {"total_events": 0}
                }
            
    @staticmethod
    def event_category_distribution(start_date=None, end_date=None):
        """Optimized query for category distribution"""
        with connection.cursor() as cursor:
            try:
                sql_params = []
                date_filter = ""
                
                if start_date:
                    date_filter += " AND date >= %s"
                    sql_params.append(start_date)
                
                if end_date:
                    date_filter += " AND date <= %s"
                    sql_params.append(end_date)
                
                query = f"""
                    SELECT json_object_agg(category, count) FROM (
                        SELECT 
                            category,
                            COUNT(*) as count
                        FROM api_event
                        WHERE 1=1 {date_filter}
                        GROUP BY category
                        ORDER BY count DESC
                    ) as category_counts
                """
                
                cursor.execute(query, sql_params)
                result = cursor.fetchone()[0] or {}
                return result
            except Exception as e:
                print(f"Error in category_distribution: {str(e)}")
                return {"error": str(e)}

    @staticmethod
    def user_engagement_metrics(limit=100):
        """Get user engagement metrics with optimized query"""
        with connection.cursor() as cursor:
            try:
                cursor.execute(f"""
                    WITH user_metrics AS (
                        SELECT 
                            u.id,
                            u.name,
                            COUNT(DISTINCT e.id) as created_events,
                            COUNT(DISTINCT ie.event_id) as interested_events,
                            (COUNT(DISTINCT e.id) + COUNT(DISTINCT ie.event_id)) as total_engagement
                        FROM 
                            api_user u
                            LEFT JOIN api_event e ON u.id = e.created_by
                            LEFT JOIN api_interestedevent ie ON u.id = ie.user_id
                        GROUP BY u.id, u.name
                    )
                    SELECT json_agg(
                        json_build_object(
                            'user_id', id,
                            'name', name,
                            'created_events', created_events,
                            'interested_events', interested_events,
                            'total_engagement', total_engagement
                        )
                    )
                    FROM (
                        SELECT * FROM user_metrics
                        ORDER BY total_engagement DESC
                        LIMIT {limit}
                    ) ranked_users
                """)
                
                result = cursor.fetchone()[0] or []
                return result
            except Exception as e:
                print(f"Error in user_engagement_metrics: {str(e)}")
                return {"error": str(e)}