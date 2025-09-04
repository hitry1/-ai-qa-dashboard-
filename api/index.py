#!/usr/bin/env python3
"""
Vercel serverless function entry point
"""
import sys
import os

# Add the parent directory to the Python path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from web_app_with_replies import app

# Export the Flask app for Vercel
def handler(request, response):
    return app(request, response)