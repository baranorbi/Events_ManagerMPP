from datetime import datetime, timedelta
import random
import time
import uuid
from django.core.management.base import BaseCommand
from django.db import transaction
from api.models import Event, User, UserEvent, InterestedEvent
from faker import Faker

class Command(BaseCommand):
    help = 'Populates the database with sample data for performance testing'

    def add_arguments(self, parser):
        parser.add_argument('--events', type=int, default=100000, help='Number of events to create')
        parser.add_argument('--users', type=int, default=10000, help='Number of users to create')
        parser.add_argument('--batch-size', type=int, default=1000, help='Batch size for inserts')
        parser.add_argument('--clear', action='store_true', help='Clear existing data before populating')

    def handle(self, *args, **options):
        start_time = time.time()
        self.faker = Faker()
        
        # Get parameters
        num_events = options['events']
        num_users = options['users']
        batch_size = options['batch_size']
        clear_data = options['clear']
        
        if clear_data:
            self.stdout.write('Clearing existing data...')
            InterestedEvent.objects.all().delete()
            UserEvent.objects.all().delete()
            Event.objects.all().delete()
            User.objects.all().delete()
        
        self.stdout.write(f'Creating {num_users} users...')
        users = self.create_users(num_users, batch_size)
        
        self.stdout.write(f'Creating {num_events} events...')
        events = self.create_events(num_events, users, batch_size)
        
        self.stdout.write('Creating user-event relationships...')
        self.create_user_events(users, events, batch_size)
        
        self.stdout.write('Creating interested event relationships...')
        self.create_interested_events(users, events, batch_size)
        
        end_time = time.time()
        self.stdout.write(self.style.SUCCESS(
            f'Successfully populated database in {end_time - start_time:.2f} seconds'
        ))

    def create_users(self, count, batch_size):
        users = []
        user_ids = []
        
        for i in range(0, count, batch_size):
            batch = []
            current_batch_size = min(batch_size, count - i)
            
            for j in range(current_batch_size):
                user_id = f'user-{uuid.uuid4()}'
                user_ids.append(user_id)
                
                batch.append(User(
                    id=user_id,
                    name=self.faker.name(),
                    description=self.faker.text(max_nb_chars=200),
                    email=self.faker.email(),
                    password=self.faker.password(),
                    avatar=self.faker.image_url()
                ))
            
            # Bulk create the batch
            with transaction.atomic():
                User.objects.bulk_create(batch)
            
            self.stdout.write(f'Created {i + current_batch_size} users out of {count}')
            users.extend(batch)
        
        return user_ids

    def create_events(self, count, user_ids, batch_size):
        if not user_ids:
            return []
            
        events = []
        event_ids = []
        categories = ['Technology', 'Music', 'Design', 'Business', 'Food', 'Art', 'Education', 'Sports', 'Health', 'Social', 'Personal', 'Work']
        today = datetime.now().date()
        
        for i in range(0, count, batch_size):
            batch = []
            current_batch_size = min(batch_size, count - i)
            
            for j in range(current_batch_size):
                # Generate a random date between -1 year and +2 years from now
                random_days = random.randint(-365, 730)
                event_date = today + timedelta(days=random_days)
                
                # 30% of events are online
                is_online = random.random() < 0.3
                
                # 80% of events have a creator
                created_by = random.choice(user_ids) if random.random() < 0.8 else None
                
                event_id = f'event-{uuid.uuid4()}'
                event_ids.append(event_id)
                
                batch.append(Event(
                    id=event_id,
                    title=self.faker.sentence(nb_words=6)[:-1],
                    description=self.faker.text(max_nb_chars=500),
                    date=event_date,
                    start_time=f'{random.randint(8, 20)}:{random.choice(["00", "30"])}',
                    end_time=f'{random.randint(8, 20)}:{random.choice(["00", "30"])}',
                    location='Online' if is_online else self.faker.city(),
                    category=random.choice(categories),
                    image=self.faker.image_url(),
                    created_by=created_by,
                    is_online=is_online
                ))
            
            # Bulk create the batch
            with transaction.atomic():
                Event.objects.bulk_create(batch)
            
            self.stdout.write(f'Created {i + current_batch_size} events out of {count}')
            events.extend(batch)
        
        return event_ids

    def create_user_events(self, user_ids, event_ids, batch_size):
        if not user_ids or not event_ids:
            return
            
        relationships = []
        created_pairs = set()  # To track existing relationships
        
        # Create ~3 events per user on average
        target_count = len(user_ids) * 3
        
        for i in range(0, target_count, batch_size):
            batch = []
            current_batch_size = min(batch_size, target_count - i)
            
            while len(batch) < current_batch_size:
                user_id = random.choice(user_ids)
                event_id = random.choice(event_ids)
                
                # Check for duplicate relationships
                pair_key = f"{user_id}:{event_id}"
                if pair_key in created_pairs:
                    continue
                
                created_pairs.add(pair_key)
                batch.append(UserEvent(
                    user_id=user_id,
                    event_id=event_id
                ))
            
            # Bulk create the batch
            with transaction.atomic():
                UserEvent.objects.bulk_create(batch)
            
            self.stdout.write(f'Created {i + current_batch_size} user-event relationships out of {target_count}')
            relationships.extend(batch)

    def create_interested_events(self, user_ids, event_ids, batch_size):
        if not user_ids or not event_ids:
            return
            
        relationships = []
        created_pairs = set()  # To track existing relationships
        
        # Create ~5 interested events per user on average
        target_count = len(user_ids) * 5
        
        for i in range(0, target_count, batch_size):
            batch = []
            current_batch_size = min(batch_size, target_count - i)
            
            while len(batch) < current_batch_size:
                user_id = random.choice(user_ids)
                event_id = random.choice(event_ids)
                
                # Check for duplicate relationships
                pair_key = f"{user_id}:{event_id}"
                if pair_key in created_pairs:
                    continue
                
                created_pairs.add(pair_key)
                batch.append(InterestedEvent(
                    user_id=user_id,
                    event_id=event_id
                ))
            
            # Bulk create the batch
            with transaction.atomic():
                InterestedEvent.objects.bulk_create(batch)
            
            self.stdout.write(f'Created {i + current_batch_size} interested event relationships out of {target_count}')
            relationships.extend(batch)