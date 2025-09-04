#!/usr/bin/env python3
"""
Flask web application for RAG Q&A system with authentication and replies
"""

from flask import Flask, render_template, jsonify, request, session, redirect, url_for, make_response
from flask_cors import CORS
import json
import os
from functools import wraps
from dotenv import load_dotenv

# Load environment variables
load_dotenv()
from mcp_qa_server import QADatabase
from auth_models import AuthDatabase, User
from reply_models import ReplyDatabase
from student_content import get_student_categories
from korean_localization import KoreanLocalization
from ai_service import RAGService, CategorySpecialization

app = Flask(__name__)
app.secret_key = 'your-secret-key-change-this-in-production'  # Change this in production
CORS(app, supports_credentials=True)

# Initialize databases
qa_db = QADatabase("demo_qa.json")
auth_db = AuthDatabase()
reply_db = ReplyDatabase()
korean_loc = KoreanLocalization()
rag_service = RAGService(qa_db)
category_spec = CategorySpecialization()


def login_required(f):
    """Decorator to require authentication"""
    @wraps(f)
    def decorated_function(*args, **kwargs):
        session_id = request.cookies.get('session_id')
        if not session_id:
            return jsonify({'error': 'Authentication required'}), 401
        
        user = auth_db.get_user_by_session(session_id)
        if not user:
            return jsonify({'error': 'Invalid or expired session'}), 401
        
        request.current_user = user
        return f(*args, **kwargs)
    return decorated_function


@app.route('/')
def index():
    """Main page"""
    return render_template('index_with_replies.html')

@app.route('/modern')
def modern_dashboard():
    """Modern dashboard page"""
    return render_template('dashboard_modern.html')


@app.route('/login')
def login_page():
    """Login page"""
    return render_template('login.html')


@app.route('/register')
def register_page():
    """Register page"""
    return render_template('register.html')


# Authentication API Routes (same as before)
@app.route('/api/register', methods=['POST'])
def register():
    """User registration"""
    data = request.json
    
    if not data:
        return jsonify({'error': 'No data provided'}), 400
    
    username = data.get('username', '').strip()
    email = data.get('email', '').strip()
    password = data.get('password', '')
    
    if not all([username, email, password]):
        return jsonify({'error': 'Username, email, and password are required'}), 400
    
    try:
        user_id = auth_db.create_user(username, email, password)
        user = auth_db.get_user_by_id(user_id)
        
        session_id = auth_db.create_session(user_id)
        
        response = make_response(jsonify({
            'success': True,
            'message': 'Registration successful',
            'user': {
                'id': user.id,
                'username': user.username,
                'email': user.email
            }
        }))
        
        response.set_cookie('session_id', session_id, max_age=30*24*60*60, httponly=True)
        return response
        
    except ValueError as e:
        return jsonify({'error': str(e)}), 400
    except Exception as e:
        print(f"Registration error: {e}")
        return jsonify({'error': 'Registration failed'}), 500


@app.route('/api/login', methods=['POST'])
def login():
    """User login"""
    data = request.json
    
    if not data:
        return jsonify({'error': 'No data provided'}), 400
    
    username = data.get('username', '').strip()
    password = data.get('password', '')
    
    if not username or not password:
        return jsonify({'error': 'Username and password are required'}), 400
    
    try:
        user = auth_db.authenticate_user(username, password)
        
        if not user:
            return jsonify({'error': 'Invalid credentials'}), 401
        
        session_id = auth_db.create_session(user.id)
        
        response = make_response(jsonify({
            'success': True,
            'message': 'Login successful',
            'user': {
                'id': user.id,
                'username': user.username,
                'email': user.email
            }
        }))
        
        response.set_cookie('session_id', session_id, max_age=30*24*60*60, httponly=True)
        return response
        
    except Exception as e:
        print(f"Login error: {e}")
        return jsonify({'error': 'Login failed'}), 500


@app.route('/api/logout', methods=['POST'])
def logout():
    """User logout"""
    session_id = request.cookies.get('session_id')
    if session_id:
        auth_db.delete_session(session_id)
    
    response = make_response(jsonify({'success': True, 'message': 'Logged out successfully'}))
    response.set_cookie('session_id', '', expires=0)
    return response


@app.route('/api/me')
def get_current_user():
    """Get current user info"""
    session_id = request.cookies.get('session_id')
    if not session_id:
        return jsonify({'authenticated': False}), 200
    
    user = auth_db.get_user_by_session(session_id)
    if not user:
        return jsonify({'authenticated': False}), 200
    
    return jsonify({
        'authenticated': True,
        'user': {
            'id': user.id,
            'username': user.username,
            'email': user.email,
            'created_at': user.created_at,
            'last_login': user.last_login
        }
    })


# Q&A API Routes with replies
@app.route('/api/stats')
@login_required
def get_stats():
    """Get database statistics"""
    total_qa = len(qa_db.data)
    categories = qa_db.get_all_categories()
    
    category_counts = {}
    tag_counts = {}
    
    for entry in qa_db.data.values():
        category_counts[entry.category] = category_counts.get(entry.category, 0) + 1
        for tag in entry.tags:
            tag_counts[tag] = tag_counts.get(tag, 0) + 1
    
    top_tags = sorted(tag_counts.items(), key=lambda x: x[1], reverse=True)[:10]
    user_stats = auth_db.get_user_stats()
    reply_stats = reply_db.get_reply_stats()
    
    return jsonify({
        'total_qa': total_qa,
        'categories': list(categories),
        'category_counts': category_counts,
        'top_tags': top_tags,
        'user_stats': user_stats,
        'reply_stats': reply_stats,
        'student_categories': get_student_categories()
    })


@app.route('/api/search')
@login_required
def search_qa():
    """Search Q&A pairs with replies"""
    query = request.args.get('q', '')
    category = request.args.get('category', None)
    
    if not query:
        return jsonify({'error': 'Query parameter required'}), 400
    
    results = qa_db.search_qa(query, category)
    
    search_results = []
    for entry in results:
        # Get replies for each Q&A
        replies = reply_db.get_replies_for_qa(entry.id)
        
        search_results.append({
            'id': entry.id,
            'question': entry.question,
            'answer': entry.answer,
            'category': entry.category,
            'tags': entry.tags,
            'created_at': entry.created_at,
            'replies': [r.model_dump() for r in replies],
            'reply_count': len(replies)
        })
    
    return jsonify({
        'query': query,
        'category': category,
        'results': search_results,
        'count': len(search_results)
    })


@app.route('/api/all')
@login_required
def get_all_qa():
    """Get all Q&A pairs with replies"""
    all_qa = []
    for entry in qa_db.data.values():
        replies = reply_db.get_replies_for_qa(entry.id)
        
        all_qa.append({
            'id': entry.id,
            'question': entry.question,
            'answer': entry.answer,
            'category': entry.category,
            'tags': entry.tags,
            'created_at': entry.created_at,
            'replies': [r.model_dump() for r in replies],
            'reply_count': len(replies)
        })
    
    all_qa.sort(key=lambda x: x['created_at'], reverse=True)
    
    return jsonify({
        'qa_pairs': all_qa,
        'count': len(all_qa)
    })


@app.route('/api/categories')
@login_required
def get_categories():
    """Get all categories with student categories"""
    db_categories = qa_db.get_all_categories()
    student_categories = get_student_categories()
    
    return jsonify({
        'categories': sorted(db_categories),
        'student_categories': student_categories
    })


@app.route('/api/add', methods=['POST'])
@login_required
def add_qa():
    """Add new Q&A pair"""
    data = request.json
    
    if not data or not data.get('question') or not data.get('answer'):
        return jsonify({'error': 'Question and answer required'}), 400
    
    qa_id = qa_db.add_qa(
        question=data['question'],
        answer=data['answer'],
        category=data.get('category', 'general'),
        tags=data.get('tags', [])
    )
    
    return jsonify({
        'success': True,
        'id': qa_id,
        'message': 'Q&A pair added successfully',
        'added_by': request.current_user.username
    })


# AI Q&A Routes
@app.route('/api/ask-ai', methods=['POST'])
@login_required
def ask_ai():
    """Ask AI to generate an answer for a question"""
    data = request.json
    
    if not data or not data.get('question'):
        return jsonify({'error': 'Question is required'}), 400
    
    question = data['question'].strip()
    if not question:
        return jsonify({'error': 'Question cannot be empty'}), 400
    
    try:
        import asyncio
        
        # Classify question category
        category = rag_service.classify_question_category(question)
        
        # Search for relevant context
        context = rag_service.search_relevant_qa(question, category)
        
        # Generate AI answer
        ai_response = asyncio.run(rag_service.generate_ai_answer(question, category, context))
        
        # Format answer based on category
        if category == '수학':
            formatted_answer = category_spec.format_math_answer(ai_response.answer)
        elif category == '프로그래밍':
            formatted_answer = category_spec.format_code_answer(ai_response.answer)
        else:
            formatted_answer = ai_response.answer
        
        # Get category tools
        tools = category_spec.get_category_tools(category)
        
        return jsonify({
            'success': True,
            'question': question,
            'answer': formatted_answer,
            'category': category,
            'confidence': ai_response.confidence,
            'sources': ai_response.sources,
            'reasoning': ai_response.reasoning,
            'tools': tools,
            'auto_classified': True
        })
        
    except Exception as e:
        print(f"AI answer error: {e}")
        return jsonify({'error': 'Failed to generate AI answer'}), 500


@app.route('/api/save-ai-qa', methods=['POST'])
@login_required
def save_ai_qa():
    """Save AI-generated Q&A to database"""
    data = request.json
    
    if not data or not data.get('question') or not data.get('answer'):
        return jsonify({'error': 'Question and answer are required'}), 400
    
    # Allow manual category override
    category = data.get('category')
    if not category:
        category = rag_service.classify_question_category(data['question'])
    
    qa_id = qa_db.add_qa(
        question=data['question'],
        answer=data['answer'],
        category=category,
        tags=data.get('tags', ['AI생성'])
    )
    
    return jsonify({
        'success': True,
        'id': qa_id,
        'message': 'AI Q&A saved successfully',
        'category': category,
        'added_by': 'AI + ' + request.current_user.username
    })


@app.route('/api/category-tools/<category>')
@login_required
def get_category_tools(category):
    """Get specialized tools for a category"""
    tools = category_spec.get_category_tools(category)
    return jsonify({
        'category': category,
        'tools': tools
    })


# Reply API Routes
@app.route('/api/replies/<qa_id>')
@login_required
def get_replies(qa_id):
    """Get replies for a specific Q&A pair"""
    replies = reply_db.get_replies_for_qa(qa_id)
    return jsonify({
        'qa_id': qa_id,
        'replies': [r.model_dump() for r in replies],
        'count': len(replies)
    })


@app.route('/api/replies', methods=['POST'])
@login_required
def add_reply():
    """Add new reply to Q&A pair"""
    data = request.json
    
    if not data or not data.get('qa_id') or not data.get('content'):
        return jsonify({'error': 'QA ID and content are required'}), 400
    
    qa_id = data['qa_id']
    content = data['content'].strip()
    parent_reply_id = data.get('parent_reply_id')
    
    if not content:
        return jsonify({'error': 'Reply content cannot be empty'}), 400
    
    # Verify Q&A exists
    if qa_id not in qa_db.data:
        return jsonify({'error': 'Q&A pair not found'}), 404
    
    reply_id = reply_db.add_reply(
        qa_id=qa_id,
        user_id=request.current_user.id,
        username=request.current_user.username,
        content=content,
        parent_reply_id=parent_reply_id
    )
    
    reply = reply_db.get_reply_by_id(reply_id)
    
    return jsonify({
        'success': True,
        'reply': reply.model_dump(),
        'message': 'Reply added successfully'
    })


@app.route('/api/replies/<reply_id>/helpful', methods=['POST'])
@login_required
def toggle_helpful(reply_id):
    """Toggle helpful status of a reply"""
    helpful_status = reply_db.toggle_helpful(reply_id)
    
    if helpful_status is None:
        return jsonify({'error': 'Reply not found'}), 404
    
    return jsonify({
        'success': True,
        'reply_id': reply_id,
        'is_helpful': helpful_status,
        'message': 'Helpful status updated'
    })


@app.route('/api/replies/<reply_id>', methods=['PUT'])
@login_required
def update_reply(reply_id):
    """Update reply content (only by original author)"""
    data = request.json
    
    if not data or not data.get('content'):
        return jsonify({'error': 'Content is required'}), 400
    
    reply = reply_db.get_reply_by_id(reply_id)
    if not reply:
        return jsonify({'error': 'Reply not found'}), 404
    
    # Check if current user is the author
    if reply.user_id != request.current_user.id:
        return jsonify({'error': 'You can only edit your own replies'}), 403
    
    success = reply_db.update_reply(reply_id, data['content'].strip())
    
    if success:
        updated_reply = reply_db.get_reply_by_id(reply_id)
        return jsonify({
            'success': True,
            'reply': updated_reply.model_dump(),
            'message': 'Reply updated successfully'
        })
    else:
        return jsonify({'error': 'Failed to update reply'}), 500


@app.route('/api/replies/<reply_id>', methods=['DELETE'])
@login_required
def delete_reply(reply_id):
    """Delete reply (only by original author)"""
    reply = reply_db.get_reply_by_id(reply_id)
    if not reply:
        return jsonify({'error': 'Reply not found'}), 404
    
    # Check if current user is the author
    if reply.user_id != request.current_user.id:
        return jsonify({'error': 'You can only delete your own replies'}), 403
    
    success = reply_db.delete_reply(reply_id)
    
    if success:
        return jsonify({
            'success': True,
            'message': 'Reply deleted successfully'
        })
    else:
        return jsonify({'error': 'Failed to delete reply'}), 500


# Korean Localization API Routes
@app.route('/api/translations/<language>')
@login_required
def get_translations(language):
    """Get translations for a specific language"""
    if language not in ['en', 'ko']:
        return jsonify({'error': 'Unsupported language'}), 400
    
    if language == 'ko':
        translations = korean_loc.get_all_translations()
        return jsonify({'translations': translations})
    else:
        # Return empty translations for English (default)
        return jsonify({'translations': {}})


@app.route('/api/korean-qa')
@login_required
def get_korean_qa():
    """Get Korean Q&A content"""
    korean_qa = korean_loc.get_korean_qa_pairs()
    return jsonify({
        'korean_qa': korean_qa,
        'count': len(korean_qa)
    })


@app.route('/api/magic-design/<design_type>')
@login_required
def get_magic_design(design_type):
    """Get magical design CSS for UI enhancement"""
    designs = {
        'sparkle': {
            'css': '''
            @keyframes sparkle {
                0%, 100% { opacity: 0; transform: scale(0); }
                50% { opacity: 1; transform: scale(1); }
            }
            .sparkle-effect::before {
                content: "✨";
                position: absolute;
                animation: sparkle 1.5s infinite;
                font-size: 0.8rem;
                color: #ffd700;
            }
            ''',
            'description': 'Sparkling animation effect'
        },
        'rainbow': {
            'css': '''
            @keyframes rainbow {
                0% { background-position: 0% 50%; }
                50% { background-position: 100% 50%; }
                100% { background-position: 0% 50%; }
            }
            .rainbow-text {
                background: linear-gradient(-45deg, #ff0000, #ff7f00, #ffff00, #00ff00, #0000ff, #4b0082, #9400d3);
                background-size: 400% 400%;
                animation: rainbow 3s ease infinite;
                -webkit-background-clip: text;
                -webkit-text-fill-color: transparent;
                background-clip: text;
            }
            ''',
            'description': 'Rainbow text animation'
        },
        'crystal': {
            'css': '''
            .crystal-card {
                background: linear-gradient(135deg, rgba(255,255,255,0.1), rgba(255,255,255,0));
                backdrop-filter: blur(10px);
                border: 1px solid rgba(255,255,255,0.18);
                box-shadow: 0 8px 32px 0 rgba(31, 38, 135, 0.37);
                border-radius: 15px;
            }
            ''',
            'description': 'Crystal glass morphism effect'
        },
        'korean': {
            'css': '''
            .korean-theme {
                background: linear-gradient(135deg, #ff6b6b, #4ecdc4, #45b7d1, #96ceb4);
                color: #2c3e50;
                font-family: "Noto Sans KR", sans-serif;
            }
            .korean-pattern {
                background-image: url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23ffffff' fill-opacity='0.05'%3E%3Cpath d='M20 20c0 0-8-8-8-8s8-8 8-8 8 8 8 8-8 8-8 8z'/%3E%3C/g%3E%3C/svg%3E");
            }
            ''',
            'description': 'Korean aesthetic theme'
        },
        'aurora': {
            'css': '''
            @keyframes aurora {
                0% { transform: translateX(-100%) rotate(0deg); }
                50% { transform: translateX(100%) rotate(180deg); }
                100% { transform: translateX(-100%) rotate(360deg); }
            }
            .aurora-bg {
                background: linear-gradient(45deg, #00c6ff, #0072ff, #9b59b6, #e74c3c, #f39c12);
                background-size: 400% 400%;
                animation: aurora 10s ease infinite;
            }
            ''',
            'description': 'Aurora borealis effect'
        }
    }
    
    if design_type not in designs:
        return jsonify({'error': 'Design type not found'}), 404
    
    return jsonify(designs[design_type])


# Vercel entry point
app = app

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=8000)