#!/usr/bin/env python3
"""
User authentication models and database management
"""

import json
import os
import hashlib
import secrets
from datetime import datetime, timedelta
from typing import Dict, Optional, List
from pydantic import BaseModel, EmailStr, validator
import uuid


class User(BaseModel):
    """User model"""
    id: str
    username: str
    email: str
    password_hash: str
    salt: str
    created_at: str
    last_login: Optional[str] = None
    is_active: bool = True
    profile: Dict = {}


class UserSession(BaseModel):
    """User session model"""
    session_id: str
    user_id: str
    created_at: str
    expires_at: str
    is_active: bool = True


class AuthDatabase:
    """Simple file-based user database"""
    
    def __init__(self, users_file: str = "users.json", sessions_file: str = "sessions.json"):
        self.users_file = users_file
        self.sessions_file = sessions_file
        self.users: Dict[str, User] = {}
        self.sessions: Dict[str, UserSession] = {}
        self.load_data()
    
    def load_data(self):
        """Load user and session data from files"""
        # Load users
        if os.path.exists(self.users_file):
            try:
                with open(self.users_file, 'r') as f:
                    data = json.load(f)
                    self.users = {k: User(**v) for k, v in data.items()}
            except Exception as e:
                print(f"Error loading users: {e}")
                self.users = {}
        
        # Load sessions
        if os.path.exists(self.sessions_file):
            try:
                with open(self.sessions_file, 'r') as f:
                    data = json.load(f)
                    self.sessions = {k: UserSession(**v) for k, v in data.items()}
            except Exception as e:
                print(f"Error loading sessions: {e}")
                self.sessions = {}
        
        # Clean expired sessions
        self.clean_expired_sessions()
    
    def save_data(self):
        """Save user and session data to files"""
        try:
            # Save users
            users_data = {k: v.model_dump() for k, v in self.users.items()}
            with open(self.users_file, 'w') as f:
                json.dump(users_data, f, indent=2)
            
            # Save sessions
            sessions_data = {k: v.model_dump() for k, v in self.sessions.items()}
            with open(self.sessions_file, 'w') as f:
                json.dump(sessions_data, f, indent=2)
        except Exception as e:
            print(f"Error saving auth data: {e}")
    
    def hash_password(self, password: str, salt: str = None) -> tuple:
        """Hash password with salt"""
        if salt is None:
            salt = secrets.token_hex(32)
        
        password_hash = hashlib.pbkdf2_hmac('sha256', 
                                          password.encode('utf-8'),
                                          salt.encode('utf-8'),
                                          100000)
        return password_hash.hex(), salt
    
    def verify_password(self, password: str, password_hash: str, salt: str) -> bool:
        """Verify password against hash"""
        hash_to_check, _ = self.hash_password(password, salt)
        return secrets.compare_digest(hash_to_check, password_hash)
    
    def create_user(self, username: str, email: str, password: str) -> Optional[str]:
        """Create new user"""
        # Check if username or email already exists
        for user in self.users.values():
            if user.username.lower() == username.lower():
                raise ValueError("Username already exists")
            if user.email.lower() == email.lower():
                raise ValueError("Email already exists")
        
        # Validate inputs
        if len(username) < 3:
            raise ValueError("Username must be at least 3 characters")
        if len(password) < 6:
            raise ValueError("Password must be at least 6 characters")
        if '@' not in email:
            raise ValueError("Invalid email format")
        
        # Create user
        user_id = str(uuid.uuid4())
        password_hash, salt = self.hash_password(password)
        
        user = User(
            id=user_id,
            username=username,
            email=email,
            password_hash=password_hash,
            salt=salt,
            created_at=datetime.now().isoformat(),
            profile={"display_name": username}
        )
        
        self.users[user_id] = user
        self.save_data()
        return user_id
    
    def authenticate_user(self, username: str, password: str) -> Optional[User]:
        """Authenticate user credentials"""
        for user in self.users.values():
            if (user.username.lower() == username.lower() or 
                user.email.lower() == username.lower()) and user.is_active:
                
                if self.verify_password(password, user.password_hash, user.salt):
                    # Update last login
                    user.last_login = datetime.now().isoformat()
                    self.save_data()
                    return user
        return None
    
    def create_session(self, user_id: str) -> str:
        """Create new user session"""
        session_id = secrets.token_urlsafe(32)
        expires_at = (datetime.now() + timedelta(days=30)).isoformat()
        
        session = UserSession(
            session_id=session_id,
            user_id=user_id,
            created_at=datetime.now().isoformat(),
            expires_at=expires_at
        )
        
        self.sessions[session_id] = session
        self.save_data()
        return session_id
    
    def get_user_by_session(self, session_id: str) -> Optional[User]:
        """Get user by session ID"""
        if session_id not in self.sessions:
            return None
        
        session = self.sessions[session_id]
        
        # Check if session is expired
        if datetime.now() > datetime.fromisoformat(session.expires_at):
            self.delete_session(session_id)
            return None
        
        if not session.is_active:
            return None
        
        return self.users.get(session.user_id)
    
    def delete_session(self, session_id: str):
        """Delete session"""
        if session_id in self.sessions:
            del self.sessions[session_id]
            self.save_data()
    
    def clean_expired_sessions(self):
        """Remove expired sessions"""
        now = datetime.now()
        expired_sessions = []
        
        for session_id, session in self.sessions.items():
            if now > datetime.fromisoformat(session.expires_at):
                expired_sessions.append(session_id)
        
        for session_id in expired_sessions:
            del self.sessions[session_id]
        
        if expired_sessions:
            self.save_data()
    
    def get_user_by_id(self, user_id: str) -> Optional[User]:
        """Get user by ID"""
        return self.users.get(user_id)
    
    def get_user_stats(self) -> Dict:
        """Get user statistics"""
        total_users = len(self.users)
        active_sessions = len([s for s in self.sessions.values() if s.is_active])
        active_users = len([u for u in self.users.values() if u.is_active])
        
        return {
            'total_users': total_users,
            'active_users': active_users,
            'active_sessions': active_sessions
        }