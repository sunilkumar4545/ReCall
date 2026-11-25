import os
import sys
from telethon.sync import TelegramClient
from telethon.sessions import StringSession
from dotenv import load_dotenv

# Path to backend/.env
env_path = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'backend', '.env'))
load_dotenv(env_path)

api_id = os.getenv('TELEGRAM_API_ID')
api_hash = os.getenv('TELEGRAM_API_HASH')

if not api_id or not api_hash:
    print("[ERROR] TELEGRAM_API_ID or TELEGRAM_API_HASH missing in backend/.env")
    sys.exit(1)

print("=" * 65)
print("  🛰️  ReCall AI — 1-Time Telegram Session Authenticator")
print("=" * 65)
print(f"Loaded App API ID: {api_id}")
print("Connecting securely to Telegram MTProto...")

try:
    with TelegramClient(StringSession(), int(api_id), api_hash) as client:
        session_str = client.session.save()
        print("\n" + "=" * 65)
        print(" [SUCCESS] Authenticated with Telegram successfully!")
        
        # Save session string to backend/.env
        with open(env_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        if 'TELEGRAM_SESSION_STRING=' in content:
            lines = content.splitlines()
            new_lines = [f'TELEGRAM_SESSION_STRING={session_str}' if l.startswith('TELEGRAM_SESSION_STRING=') else l for l in lines]
            content = '\n'.join(new_lines) + '\n'
        else:
            content += f'TELEGRAM_SESSION_STRING={session_str}\n'
            
        with open(env_path, 'w', encoding='utf-8') as f:
            f.write(content)
            
        print(" [SAVED] TELEGRAM_SESSION_STRING saved to backend/.env")
        print("=" * 65)
        print(" Session saved permanently! You are all set for 24/7 autonomous ingestion.")
        print("=" * 65)
except Exception as e:
    print(f"\n[ERROR] Authentication failed: {e}")
    sys.exit(1)
