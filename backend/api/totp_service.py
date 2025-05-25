import pyotp
import qrcode
import io
import base64
from datetime import datetime, timezone
from .models import TOTPDevice, User

class TOTPService:
    @staticmethod
    def get_or_create_device(user_id):
        """Get or create a TOTP device for a user"""
        try:
            user = User.objects.get(id=user_id)
            
            try:
                device = TOTPDevice.objects.get(user_id=user_id)
            except TOTPDevice.DoesNotExist:
                # Create a new device with a random key
                key = pyotp.random_base32()
                device = TOTPDevice.objects.create(
                    user_id=user_id,
                    key=key,
                    enabled=False,
                    last_used_at=datetime.now(timezone.utc)
                )
            
            return device
        except User.DoesNotExist:
            return None
    
    @staticmethod
    def generate_qr_code(user_id, issuer_name="Events Manager"):
        """Generate a QR code for TOTP setup"""
        device = TOTPService.get_or_create_device(user_id)
        if not device:
            return None
            
        user = User.objects.get(id=user_id)
        
        # Create a TOTP provisioning URI
        totp = pyotp.TOTP(device.key)
        uri = totp.provisioning_uri(user.email, issuer_name=issuer_name)
        
        # Generate QR code
        qr = qrcode.QRCode(
            version=1,
            error_correction=qrcode.constants.ERROR_CORRECT_L,
            box_size=10,
            border=4,
        )
        qr.add_data(uri)
        qr.make(fit=True)
        
        img = qr.make_image(fill_color="black", back_color="white")
        
        # Convert to base64
        buffer = io.BytesIO()
        img.save(buffer, format="PNG")
        return base64.b64encode(buffer.getvalue()).decode()
    
    @staticmethod
    def verify_token(user_id, token):
        """Verify a TOTP token"""
        try:
            device = TOTPDevice.objects.get(user_id=user_id)
            totp = pyotp.TOTP(device.key)
            is_valid = totp.verify(token)
            
            if is_valid:
                # Update the device's last_used_at timestamp and enable it if not already
                device.last_used_at = datetime.now(timezone.utc)
                device.enabled = True
                device.save()
                
            return is_valid
        except TOTPDevice.DoesNotExist:
            return False
    
    @staticmethod
    def disable_totp(user_id):
        """Disable TOTP for a user"""
        try:
            device = TOTPDevice.objects.get(user_id=user_id)
            device.enabled = False
            device.save()
            return True
        except TOTPDevice.DoesNotExist:
            return False
            
    @staticmethod
    def is_enabled(user_id):
        """Check if TOTP is enabled for a user"""
        try:
            device = TOTPDevice.objects.get(user_id=user_id)
            return device.enabled
        except TOTPDevice.DoesNotExist:
            return False

# Create a singleton instance
totp_service = TOTPService()