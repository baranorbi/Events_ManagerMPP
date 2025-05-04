from django.utils import timezone
from datetime import timedelta
import time
import threading
from .models import UserActivityLog, MonitoredUser, User
from django.db.models import Count

class UserActivityMonitor:
    """
    A service to monitor user activity and detect suspicious behavior
    
    This class analyzes user activity logs and flags users who perform
    a suspiciously high number of operations within a specified time window.
    """
    
    def __init__(self):
        self.thresholds = {
            'CREATE': {'count': 30, 'window_minutes': 5},
            'UPDATE': {'count': 50, 'window_minutes': 5},
            'DELETE': {'count': 20, 'window_minutes': 5},
            'ANY': {'count': 70, 'window_minutes': 5},  # Threshold for combined actions
        }
    
    def analyze_logs(self):
        """
        Analyze activity logs to detect suspicious behavior
        """
        try:
            print(f"[{timezone.now()}] Running user activity analysis...")
            
            # Check each action type
            for action_type, threshold in self.thresholds.items():
                self._check_action_frequency(action_type, threshold)
                
            print(f"[{timezone.now()}] User activity analysis completed")
        except Exception as e:
            print(f"Error in activity analysis: {e}")
    
    def _check_action_frequency(self, action_type, threshold):
        """
        Check if any users exceed the frequency threshold for a specific action type
        """
        # Define the time window
        window_start = timezone.now() - timedelta(minutes=threshold['window_minutes'])
        
        # Query to get users with activity counts in the time window
        if action_type == 'ANY':
            # For 'ANY', count all action types combined
            user_counts = UserActivityLog.objects.filter(
                timestamp__gte=window_start
            ).values(
                'user'
            ).annotate(
                action_count=Count('id')
            ).filter(
                action_count__gte=threshold['count']
            )
        else:
            # For specific action types
            user_counts = UserActivityLog.objects.filter(
                timestamp__gte=window_start,
                action_type=action_type
            ).values(
                'user'
            ).annotate(
                action_count=Count('id')
            ).filter(
                action_count__gte=threshold['count']
            )
        
        # Process any users who exceeded thresholds
        for user_data in user_counts:
            user_id = user_data['user']
            action_count = user_data['action_count']
            
            # Check if this user is already being monitored for this reason
            already_monitored = MonitoredUser.objects.filter(
                user_id=user_id,
                is_active=True,
                reason__contains=f"Excessive {action_type}"
            ).exists()
            
            if not already_monitored:
                # Get some additional details about the activity
                recent_logs = UserActivityLog.objects.filter(
                    user_id=user_id,
                    timestamp__gte=window_start
                ).order_by('-timestamp')[:10]
                
                # Create a new monitored user entry
                user = User.objects.get(id=user_id)
                MonitoredUser.objects.create(
                    user=user,
                    reason=f"Excessive {action_type} operations ({action_count} in {threshold['window_minutes']} minutes)",
                    is_active=True,
                    details={
                        'action_type': action_type,
                        'count': action_count,
                        'window_minutes': threshold['window_minutes'],
                        'detection_time': timezone.now().isoformat(),
                        'recent_activity': [
                            {
                                'entity_type': log.entity_type,
                                'entity_id': log.entity_id,
                                'timestamp': log.timestamp.isoformat()
                            } 
                            for log in recent_logs
                        ]
                    }
                )
                
                print(f"[{timezone.now()}] User {user_id} added to monitored list: "
                      f"{action_count} {action_type} operations in {threshold['window_minutes']} minutes")


def start_monitoring_thread():
    """
    Start a background thread to periodically analyze user activity
    """
    def monitor_loop():
        monitor = UserActivityMonitor()
        while True:
            try:
                monitor.analyze_logs()
                # Sleep for 2 minutes before the next analysis
                time.sleep(120)
            except Exception as e:
                print(f"Error in monitoring thread: {e}")
                time.sleep(300)  # On error, wait 5 minutes before retrying
    
    # Create and start the thread
    monitoring_thread = threading.Thread(target=monitor_loop, daemon=True)
    monitoring_thread.start()
    print("User activity monitoring thread started")