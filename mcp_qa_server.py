#!/usr/bin/env python3
"""
MCP Q&A Server - Provides question and answer functionality through MCP protocol
"""

import json
import os
from typing import List, Dict, Any, Optional
from datetime import datetime
from pydantic import BaseModel, Field
import asyncio
import sys

# MCP server imports
try:
    from mcp.server import Server
    from mcp.server.session import ServerSession
    from mcp.types import (
        CallToolRequest,
        ListToolsRequest,
        Tool,
        TextContent,
        CallToolResult,
        GetPromptRequest,
        ListPromptsRequest,
        Prompt,
        PromptArgument,
        GetPromptResult,
        PromptMessage
    )
except ImportError:
    print("MCP SDK not installed. Install with: pip install mcp")
    sys.exit(1)


class QAEntry(BaseModel):
    """Model for a Q&A entry"""
    id: str
    question: str
    answer: str
    category: str = "general"
    created_at: str
    updated_at: str
    tags: List[str] = []


class QADatabase:
    """Simple file-based Q&A database"""
    
    def __init__(self, db_file: str = "qa_database.json"):
        self.db_file = db_file
        self.data: Dict[str, QAEntry] = {}
        self.load_data()
    
    def load_data(self):
        """Load Q&A data from file"""
        if os.path.exists(self.db_file):
            try:
                with open(self.db_file, 'r') as f:
                    data = json.load(f)
                    self.data = {k: QAEntry(**v) for k, v in data.items()}
            except Exception as e:
                print(f"Error loading data: {e}")
                self.data = {}
    
    def save_data(self):
        """Save Q&A data to file"""
        try:
            data = {k: v.model_dump() for k, v in self.data.items()}
            with open(self.db_file, 'w') as f:
                json.dump(data, f, indent=2)
        except Exception as e:
            print(f"Error saving data: {e}")
    
    def add_qa(self, question: str, answer: str, category: str = "general", tags: List[str] = None) -> str:
        """Add a new Q&A entry"""
        import uuid
        qa_id = str(uuid.uuid4())
        timestamp = datetime.now().isoformat()
        
        entry = QAEntry(
            id=qa_id,
            question=question,
            answer=answer,
            category=category,
            created_at=timestamp,
            updated_at=timestamp,
            tags=tags or []
        )
        
        self.data[qa_id] = entry
        self.save_data()
        return qa_id
    
    def search_qa(self, query: str, category: str = None) -> List[QAEntry]:
        """Search for Q&A entries"""
        results = []
        query_lower = query.lower()
        
        for entry in self.data.values():
            # Check if query matches question or answer
            if (query_lower in entry.question.lower() or 
                query_lower in entry.answer.lower() or
                any(query_lower in tag.lower() for tag in entry.tags)):
                
                # Filter by category if specified
                if category is None or entry.category.lower() == category.lower():
                    results.append(entry)
        
        return results
    
    def get_all_categories(self) -> List[str]:
        """Get all unique categories"""
        return list(set(entry.category for entry in self.data.values()))
    
    def get_qa_by_id(self, qa_id: str) -> Optional[QAEntry]:
        """Get Q&A entry by ID"""
        return self.data.get(qa_id)


# Initialize the database
qa_db = QADatabase()

# Create MCP server
server = Server("qa-server")


@server.list_tools()
async def handle_list_tools() -> List[Tool]:
    """List available Q&A tools"""
    return [
        Tool(
            name="add_qa",
            description="Add a new question and answer pair to the knowledge base",
            inputSchema={
                "type": "object",
                "properties": {
                    "question": {
                        "type": "string",
                        "description": "The question to add"
                    },
                    "answer": {
                        "type": "string", 
                        "description": "The answer to the question"
                    },
                    "category": {
                        "type": "string",
                        "description": "Category for the Q&A pair (optional)",
                        "default": "general"
                    },
                    "tags": {
                        "type": "array",
                        "items": {"type": "string"},
                        "description": "Tags for the Q&A pair (optional)"
                    }
                },
                "required": ["question", "answer"]
            }
        ),
        Tool(
            name="search_qa",
            description="Search for questions and answers in the knowledge base",
            inputSchema={
                "type": "object",
                "properties": {
                    "query": {
                        "type": "string",
                        "description": "Search query to find relevant Q&A pairs"
                    },
                    "category": {
                        "type": "string",
                        "description": "Filter by category (optional)"
                    }
                },
                "required": ["query"]
            }
        ),
        Tool(
            name="get_categories",
            description="Get all available categories in the knowledge base",
            inputSchema={
                "type": "object",
                "properties": {}
            }
        ),
        Tool(
            name="get_qa_stats",
            description="Get statistics about the Q&A knowledge base",
            inputSchema={
                "type": "object",
                "properties": {}
            }
        )
    ]


@server.call_tool()
async def handle_call_tool(name: str, arguments: Dict[str, Any]) -> List[TextContent]:
    """Handle tool calls"""
    
    if name == "add_qa":
        question = arguments.get("question", "")
        answer = arguments.get("answer", "")
        category = arguments.get("category", "general")
        tags = arguments.get("tags", [])
        
        if not question or not answer:
            return [TextContent(type="text", text="Error: Question and answer are required")]
        
        qa_id = qa_db.add_qa(question, answer, category, tags)
        return [TextContent(
            type="text", 
            text=f"Successfully added Q&A pair with ID: {qa_id}\nQuestion: {question}\nAnswer: {answer}"
        )]
    
    elif name == "search_qa":
        query = arguments.get("query", "")
        category = arguments.get("category")
        
        if not query:
            return [TextContent(type="text", text="Error: Query is required")]
        
        results = qa_db.search_qa(query, category)
        
        if not results:
            return [TextContent(type="text", text=f"No results found for query: '{query}'")]
        
        response = f"Found {len(results)} result(s) for query: '{query}'\n\n"
        for i, entry in enumerate(results, 1):
            response += f"{i}. **Question**: {entry.question}\n"
            response += f"   **Answer**: {entry.answer}\n"
            response += f"   **Category**: {entry.category}\n"
            if entry.tags:
                response += f"   **Tags**: {', '.join(entry.tags)}\n"
            response += f"   **ID**: {entry.id}\n\n"
        
        return [TextContent(type="text", text=response)]
    
    elif name == "get_categories":
        categories = qa_db.get_all_categories()
        if not categories:
            return [TextContent(type="text", text="No categories found in the knowledge base")]
        
        return [TextContent(
            type="text", 
            text=f"Available categories: {', '.join(sorted(categories))}"
        )]
    
    elif name == "get_qa_stats":
        total_qa = len(qa_db.data)
        categories = qa_db.get_all_categories()
        
        category_counts = {}
        for entry in qa_db.data.values():
            category_counts[entry.category] = category_counts.get(entry.category, 0) + 1
        
        response = f"Q&A Knowledge Base Statistics:\n"
        response += f"Total Q&A pairs: {total_qa}\n"
        response += f"Total categories: {len(categories)}\n\n"
        response += "Category breakdown:\n"
        for category, count in sorted(category_counts.items()):
            response += f"  - {category}: {count}\n"
        
        return [TextContent(type="text", text=response)]
    
    else:
        return [TextContent(type="text", text=f"Unknown tool: {name}")]


@server.list_prompts()
async def handle_list_prompts() -> List[Prompt]:
    """List available prompts"""
    return [
        Prompt(
            name="qa_assistant",
            description="Get help with using the Q&A knowledge base system",
            arguments=[
                PromptArgument(
                    name="task",
                    description="What task do you need help with?",
                    required=False
                )
            ]
        )
    ]


@server.get_prompt()
async def handle_get_prompt(name: str, arguments: Dict[str, str]) -> GetPromptResult:
    """Handle prompt requests"""
    
    if name == "qa_assistant":
        task = arguments.get("task", "general help")
        
        prompt_text = f"""You are a Q&A Knowledge Base Assistant. You can help users with the following tasks:

1. **Adding Q&A pairs**: Use the `add_qa` tool to store new questions and answers
2. **Searching**: Use the `search_qa` tool to find relevant Q&A pairs
3. **Categories**: Use the `get_categories` tool to see available categories
4. **Statistics**: Use the `get_qa_stats` tool to see knowledge base statistics

Current task: {task}

Available tools:
- add_qa: Add new question-answer pairs
- search_qa: Search the knowledge base
- get_categories: List all categories
- get_qa_stats: Show database statistics

How can I help you manage your Q&A knowledge base?"""

        return GetPromptResult(
            messages=[PromptMessage(
                role="user",
                content=TextContent(type="text", text=prompt_text)
            )]
        )
    
    else:
        raise ValueError(f"Unknown prompt: {name}")


async def main():
    """Run the MCP server"""
    # Run server with stdio transport
    from mcp.server.stdio import stdio_server
    
    async with stdio_server() as (read_stream, write_stream):
        await server.run(
            read_stream,
            write_stream,
            server.create_initialization_options()
        )


if __name__ == "__main__":
    asyncio.run(main())