#!/usr/bin/env python3
"""
MCP Server endpoint for Vercel deployment
"""
import sys
import os
import json

# Add the parent directory to the Python path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from simple_mcp_server import QAMCPServer, QADatabase
from mcp_qa_server import QADatabase as MCPQADatabase

def handler(request):
    """
    Vercel serverless function handler for MCP server
    """
    try:
        # Initialize databases
        qa_db = MCPQADatabase("demo_qa.json")
        
        # Handle different HTTP methods and paths
        method = request.get('method', 'GET')
        path = request.get('path', '/')
        
        if method == 'POST' and path.endswith('/mcp'):
            # Handle MCP requests
            body = request.get('body', '{}')
            if isinstance(body, str):
                try:
                    mcp_request = json.loads(body)
                except json.JSONDecodeError:
                    return {
                        'statusCode': 400,
                        'body': json.dumps({'error': 'Invalid JSON'}),
                        'headers': {
                            'Content-Type': 'application/json',
                            'Access-Control-Allow-Origin': '*'
                        }
                    }
            else:
                mcp_request = body
            
            # Process MCP request
            if mcp_request.get('method') == 'search_qa':
                params = mcp_request.get('params', {})
                query = params.get('query', '')
                category = params.get('category', 'all')
                
                results = qa_db.search_qa(query, category)
                
                return {
                    'statusCode': 200,
                    'body': json.dumps({
                        'jsonrpc': '2.0',
                        'id': mcp_request.get('id'),
                        'result': {
                            'results': results,
                            'total': len(results)
                        }
                    }),
                    'headers': {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*'
                    }
                }
            
            elif mcp_request.get('method') == 'get_categories':
                categories = qa_db.get_categories()
                
                return {
                    'statusCode': 200,
                    'body': json.dumps({
                        'jsonrpc': '2.0',
                        'id': mcp_request.get('id'),
                        'result': {
                            'categories': categories
                        }
                    }),
                    'headers': {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*'
                    }
                }
            
            elif mcp_request.get('method') == 'add_qa':
                params = mcp_request.get('params', {})
                success = qa_db.add_qa(
                    params.get('question', ''),
                    params.get('answer', ''),
                    params.get('category', 'general'),
                    params.get('metadata', {})
                )
                
                return {
                    'statusCode': 200,
                    'body': json.dumps({
                        'jsonrpc': '2.0',
                        'id': mcp_request.get('id'),
                        'result': {
                            'success': success
                        }
                    }),
                    'headers': {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*'
                    }
                }
        
        # Handle OPTIONS request for CORS
        elif method == 'OPTIONS':
            return {
                'statusCode': 200,
                'headers': {
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
                    'Access-Control-Allow-Headers': 'Content-Type',
                }
            }
        
        # Default info endpoint
        else:
            return {
                'statusCode': 200,
                'body': json.dumps({
                    'name': 'AI Q&A MCP Server',
                    'version': '1.0.0',
                    'description': 'MCP Server for AI-powered Q&A system',
                    'endpoints': {
                        'search_qa': 'Search Q&A database',
                        'get_categories': 'Get available categories',
                        'add_qa': 'Add new Q&A pair'
                    }
                }),
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                }
            }
    
    except Exception as e:
        return {
            'statusCode': 500,
            'body': json.dumps({'error': str(e)}),
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            }
        }