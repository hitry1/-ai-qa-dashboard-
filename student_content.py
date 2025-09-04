#!/usr/bin/env python3
"""
Student-friendly categories and sample Q&A content
"""

import asyncio
from mcp_qa_server import QADatabase

# Student-friendly categories with sample Q&A pairs
STUDENT_CATEGORIES = {
    "mathematics": {
        "display_name": "Mathematics",
        "icon": "fas fa-calculator",
        "description": "Math concepts, formulas, and problem solving",
        "sample_qa": [
            {
                "question": "What is the Pythagorean theorem?",
                "answer": "The Pythagorean theorem states that in a right triangle, the square of the hypotenuse equals the sum of squares of the other two sides: a² + b² = c²",
                "tags": ["geometry", "theorem", "triangle", "math"]
            },
            {
                "question": "How do you calculate the area of a circle?",
                "answer": "The area of a circle is calculated using the formula A = πr², where r is the radius of the circle.",
                "tags": ["geometry", "circle", "area", "formula"]
            },
            {
                "question": "What is the quadratic formula?",
                "answer": "The quadratic formula is x = (-b ± √(b²-4ac)) / 2a, used to find the roots of quadratic equations in the form ax² + bx + c = 0",
                "tags": ["algebra", "quadratic", "formula", "equations"]
            }
        ]
    },
    "science": {
        "display_name": "Science",
        "icon": "fas fa-microscope",
        "description": "Physics, Chemistry, Biology concepts",
        "sample_qa": [
            {
                "question": "What is Newton's first law of motion?",
                "answer": "Newton's first law states that an object at rest stays at rest, and an object in motion stays in motion at constant velocity, unless acted upon by an external force.",
                "tags": ["physics", "newton", "motion", "force"]
            },
            {
                "question": "What is photosynthesis?",
                "answer": "Photosynthesis is the process by which plants use sunlight, carbon dioxide, and water to produce glucose and oxygen. The equation is: 6CO₂ + 6H₂O + light energy → C₆H₁₂O₆ + 6O₂",
                "tags": ["biology", "plants", "photosynthesis", "energy"]
            },
            {
                "question": "What is the periodic table?",
                "answer": "The periodic table is a systematic arrangement of chemical elements organized by atomic number, showing recurring patterns in their properties.",
                "tags": ["chemistry", "elements", "periodic-table", "atomic"]
            }
        ]
    },
    "history": {
        "display_name": "History",
        "icon": "fas fa-book",
        "description": "Historical events, dates, and civilizations",
        "sample_qa": [
            {
                "question": "When did World War II end?",
                "answer": "World War II ended on September 2, 1945, when Japan formally surrendered aboard the USS Missouri in Tokyo Bay.",
                "tags": ["wwii", "1945", "japan", "surrender"]
            },
            {
                "question": "Who was the first president of the United States?",
                "answer": "George Washington was the first president of the United States, serving from 1789 to 1797.",
                "tags": ["usa", "president", "washington", "founding-fathers"]
            },
            {
                "question": "What was the Renaissance?",
                "answer": "The Renaissance was a cultural movement in Europe from the 14th to 17th century, marked by renewed interest in classical learning, art, and humanism.",
                "tags": ["renaissance", "europe", "art", "culture"]
            }
        ]
    },
    "language": {
        "display_name": "Language & Literature",
        "icon": "fas fa-pen-fancy",
        "description": "Grammar, writing, literature, and communication",
        "sample_qa": [
            {
                "question": "What is a metaphor?",
                "answer": "A metaphor is a figure of speech that compares two different things by stating that one thing is another, without using 'like' or 'as'. Example: 'Life is a journey.'",
                "tags": ["literature", "figurative-language", "metaphor", "writing"]
            },
            {
                "question": "What are the parts of speech?",
                "answer": "The eight parts of speech are: nouns, pronouns, verbs, adjectives, adverbs, prepositions, conjunctions, and interjections.",
                "tags": ["grammar", "parts-of-speech", "english", "language"]
            },
            {
                "question": "What is the difference between their, there, and they're?",
                "answer": "'Their' shows possession, 'there' indicates location or existence, and 'they're' is a contraction of 'they are'.",
                "tags": ["grammar", "homophones", "spelling", "usage"]
            }
        ]
    },
    "geography": {
        "display_name": "Geography",
        "icon": "fas fa-globe",
        "description": "Countries, capitals, landforms, and world knowledge",
        "sample_qa": [
            {
                "question": "What is the capital of Australia?",
                "answer": "The capital of Australia is Canberra, not Sydney or Melbourne as many people think.",
                "tags": ["australia", "capital", "canberra", "world-capitals"]
            },
            {
                "question": "What are the seven continents?",
                "answer": "The seven continents are: Asia, Africa, North America, South America, Antarctica, Europe, and Australia (Oceania).",
                "tags": ["continents", "geography", "world", "earth"]
            },
            {
                "question": "What is the longest river in the world?",
                "answer": "The Nile River is generally considered the longest river in the world at approximately 4,135 miles (6,650 km) long.",
                "tags": ["rivers", "nile", "longest", "geography"]
            }
        ]
    },
    "computer-science": {
        "display_name": "Computer Science",
        "icon": "fas fa-laptop-code",
        "description": "Programming, algorithms, and computer concepts",
        "sample_qa": [
            {
                "question": "What is an algorithm?",
                "answer": "An algorithm is a step-by-step set of instructions designed to solve a specific problem or complete a task.",
                "tags": ["algorithm", "programming", "problem-solving", "cs"]
            },
            {
                "question": "What is the difference between HTML and CSS?",
                "answer": "HTML (HyperText Markup Language) structures web content, while CSS (Cascading Style Sheets) controls the visual styling and layout of that content.",
                "tags": ["html", "css", "web-development", "programming"]
            },
            {
                "question": "What is a variable in programming?",
                "answer": "A variable is a named storage location in computer memory that holds a value that can be referenced and manipulated in a program.",
                "tags": ["variables", "programming", "memory", "coding"]
            }
        ]
    },
    "study-tips": {
        "display_name": "Study Tips & Skills",
        "icon": "fas fa-graduation-cap",
        "description": "Learning strategies, exam prep, and academic success",
        "sample_qa": [
            {
                "question": "What is the Pomodoro Technique?",
                "answer": "The Pomodoro Technique is a time management method where you work for 25 minutes, then take a 5-minute break. After 4 cycles, take a longer 15-30 minute break.",
                "tags": ["study-tips", "time-management", "pomodoro", "productivity"]
            },
            {
                "question": "How can I improve my note-taking?",
                "answer": "Use methods like Cornell notes, mind maps, or the outline method. Write key points, use abbreviations, review regularly, and organize by topics or dates.",
                "tags": ["note-taking", "study-skills", "organization", "learning"]
            },
            {
                "question": "What are good test-taking strategies?",
                "answer": "Read questions carefully, answer easy questions first, manage your time, eliminate wrong answers in multiple choice, and review your answers before submitting.",
                "tags": ["test-taking", "exams", "strategy", "academic-success"]
            }
        ]
    },
    "general": {
        "display_name": "General Knowledge",
        "icon": "fas fa-lightbulb",
        "description": "Miscellaneous facts and general information",
        "sample_qa": [
            {
                "question": "How many bones are in the human body?",
                "answer": "An adult human body has 206 bones. Babies are born with about 270 bones, but many fuse together as they grow.",
                "tags": ["human-body", "anatomy", "bones", "biology"]
            },
            {
                "question": "What is the speed of light?",
                "answer": "The speed of light in a vacuum is approximately 299,792,458 meters per second (about 186,282 miles per second).",
                "tags": ["physics", "light", "speed", "constants"]
            },
            {
                "question": "How many days are in a leap year?",
                "answer": "A leap year has 366 days instead of the usual 365. Leap years occur every 4 years, with some exceptions for century years.",
                "tags": ["calendar", "leap-year", "time", "mathematics"]
            }
        ]
    }
}


async def populate_student_content():
    """Populate the Q&A database with student-friendly content"""
    qa_db = QADatabase("demo_qa.json")
    
    print("📚 Adding student-friendly Q&A content...")
    print("=" * 50)
    
    total_added = 0
    
    for category_key, category_data in STUDENT_CATEGORIES.items():
        print(f"\n📁 {category_data['display_name']} Category:")
        
        for qa in category_data['sample_qa']:
            qa_id = qa_db.add_qa(
                question=qa['question'],
                answer=qa['answer'],
                category=category_key,
                tags=qa['tags']
            )
            print(f"  ✅ {qa['question'][:60]}... (ID: {qa_id[:8]})")
            total_added += 1
    
    print(f"\n🎉 Added {total_added} student-friendly Q&A pairs!")
    print(f"📊 Total database now contains {len(qa_db.data)} Q&A pairs")
    
    return qa_db


def get_student_categories():
    """Get formatted student categories for the UI"""
    categories = []
    for key, data in STUDENT_CATEGORIES.items():
        categories.append({
            'key': key,
            'name': data['display_name'],
            'icon': data['icon'],
            'description': data['description']
        })
    return categories


if __name__ == "__main__":
    asyncio.run(populate_student_content())