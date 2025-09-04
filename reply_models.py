#!/usr/bin/env python3
"""
Reply system models for Q&A pairs
"""

import json
import os
import uuid
from datetime import datetime
from typing import Dict, List, Optional
from pydantic import BaseModel


class Reply(BaseModel):
    """Reply model for Q&A pairs"""
    id: str
    qa_id: str  # ID of the Q&A pair this reply belongs to
    user_id: str
    username: str
    content: str
    created_at: str
    updated_at: str
    is_helpful: bool = False
    helpful_votes: int = 0
    parent_reply_id: Optional[str] = None  # For nested replies
    is_deleted: bool = False


class QAWithReplies(BaseModel):
    """Q&A entry with replies"""
    id: str
    question: str
    answer: str
    category: str
    created_at: str
    updated_at: str
    tags: List[str] = []
    replies: List[Reply] = []
    reply_count: int = 0


class ReplyDatabase:
    """Database manager for replies"""
    
    def __init__(self, replies_file: str = "replies.json"):
        self.replies_file = replies_file
        self.replies: Dict[str, Reply] = {}
        self.load_data()
    
    def load_data(self):
        """Load replies from file"""
        if os.path.exists(self.replies_file):
            try:
                with open(self.replies_file, 'r') as f:
                    data = json.load(f)
                    self.replies = {k: Reply(**v) for k, v in data.items()}
            except Exception as e:
                print(f"Error loading replies: {e}")
                self.replies = {}
    
    def save_data(self):
        """Save replies to file"""
        try:
            data = {k: v.model_dump() for k, v in self.replies.items()}
            with open(self.replies_file, 'w') as f:
                json.dump(data, f, indent=2)
        except Exception as e:
            print(f"Error saving replies: {e}")
    
    def add_reply(self, qa_id: str, user_id: str, username: str, content: str, 
                  parent_reply_id: str = None) -> str:
        """Add a new reply to a Q&A pair"""
        reply_id = str(uuid.uuid4())
        timestamp = datetime.now().isoformat()
        
        reply = Reply(
            id=reply_id,
            qa_id=qa_id,
            user_id=user_id,
            username=username,
            content=content,
            created_at=timestamp,
            updated_at=timestamp,
            parent_reply_id=parent_reply_id
        )
        
        self.replies[reply_id] = reply
        self.save_data()
        return reply_id
    
    def get_replies_for_qa(self, qa_id: str) -> List[Reply]:
        """Get all replies for a specific Q&A pair"""
        qa_replies = []
        for reply in self.replies.values():
            if reply.qa_id == qa_id and not reply.is_deleted:
                qa_replies.append(reply)
        
        # Sort by creation date, newest first
        qa_replies.sort(key=lambda x: x.created_at, reverse=True)
        return qa_replies
    
    def get_reply_by_id(self, reply_id: str) -> Optional[Reply]:
        """Get a specific reply by ID"""
        return self.replies.get(reply_id)
    
    def update_reply(self, reply_id: str, content: str) -> bool:
        """Update a reply's content"""
        if reply_id in self.replies:
            self.replies[reply_id].content = content
            self.replies[reply_id].updated_at = datetime.now().isoformat()
            self.save_data()
            return True
        return False
    
    def delete_reply(self, reply_id: str) -> bool:
        """Soft delete a reply"""
        if reply_id in self.replies:
            self.replies[reply_id].is_deleted = True
            self.replies[reply_id].updated_at = datetime.now().isoformat()
            self.save_data()
            return True
        return False
    
    def toggle_helpful(self, reply_id: str) -> Optional[bool]:
        """Toggle helpful status of a reply"""
        if reply_id in self.replies:
            reply = self.replies[reply_id]
            reply.is_helpful = not reply.is_helpful
            if reply.is_helpful:
                reply.helpful_votes += 1
            else:
                reply.helpful_votes = max(0, reply.helpful_votes - 1)
            reply.updated_at = datetime.now().isoformat()
            self.save_data()
            return reply.is_helpful
        return None
    
    def get_reply_stats(self) -> Dict:
        """Get reply statistics"""
        total_replies = len([r for r in self.replies.values() if not r.is_deleted])
        helpful_replies = len([r for r in self.replies.values() if r.is_helpful and not r.is_deleted])
        
        # Get top contributors
        user_reply_counts = {}
        for reply in self.replies.values():
            if not reply.is_deleted:
                user_reply_counts[reply.username] = user_reply_counts.get(reply.username, 0) + 1
        
        top_contributors = sorted(user_reply_counts.items(), key=lambda x: x[1], reverse=True)[:5]
        
        return {
            'total_replies': total_replies,
            'helpful_replies': helpful_replies,
            'top_contributors': top_contributors
        }