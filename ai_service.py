#!/usr/bin/env python3
"""
AI Service for generating intelligent answers to questions
"""

import json
import os
from typing import List, Dict, Optional, Any
from datetime import datetime
import asyncio
import httpx
from pydantic import BaseModel

class AIResponse(BaseModel):
    """Model for AI response"""
    answer: str
    confidence: float
    category: str
    sources: List[str] = []
    reasoning: str = ""

class RAGService:
    """RAG (Retrieval-Augmented Generation) Service"""
    
    def __init__(self, qa_database=None):
        self.qa_database = qa_database
        self.openai_api_key = os.getenv("OPENAI_API_KEY")
        self.claude_api_key = os.getenv("ANTHROPIC_API_KEY")
        
    def classify_question_category(self, question: str) -> str:
        """Classify question into appropriate category"""
        # Simple keyword-based classification
        question_lower = question.lower()
        
        math_keywords = ['수학', '계산', '공식', '방정식', '함수', '미분', '적분', '기하', '대수']
        science_keywords = ['과학', '물리', '화학', '생물', '실험', '원리', '법칙']
        programming_keywords = ['프로그래밍', '코딩', '파이썬', '자바스크립트', '알고리즘', '데이터베이스']
        korean_keywords = ['국어', '문법', '맞춤법', '문학', '작문']
        english_keywords = ['영어', '문법', '단어', '독해', '회화']
        
        if any(keyword in question_lower for keyword in math_keywords):
            return '수학'
        elif any(keyword in question_lower for keyword in science_keywords):
            return '과학'
        elif any(keyword in question_lower for keyword in programming_keywords):
            return '프로그래밍'
        elif any(keyword in question_lower for keyword in korean_keywords):
            return '국어'
        elif any(keyword in question_lower for keyword in english_keywords):
            return '영어'
        else:
            return '일반'
    
    def search_relevant_qa(self, question: str, category: str = None) -> List[Dict]:
        """Search for relevant Q&A pairs in the database"""
        if not self.qa_database:
            return []
        
        # Search for similar questions
        results = self.qa_database.search_qa(question, category)
        return [
            {
                'question': entry.question,
                'answer': entry.answer,
                'category': entry.category,
                'tags': entry.tags
            }
            for entry in results[:3]  # Top 3 results
        ]
    
    async def generate_ai_answer(self, question: str, category: str, context: List[Dict] = None) -> AIResponse:
        """Generate AI answer using available API"""
        
        # Build context from existing Q&A pairs
        context_text = ""
        sources = []
        
        if context:
            context_text = "\n\n관련 정보:\n"
            for i, item in enumerate(context, 1):
                context_text += f"{i}. Q: {item['question']}\n   A: {item['answer']}\n"
                sources.append(item['question'])
        
        # Create prompt based on category
        prompt = self._create_category_prompt(question, category, context_text)
        
        # Try different AI services
        try:
            if self.openai_api_key:
                return await self._call_openai(prompt, category, sources)
            elif self.claude_api_key:
                return await self._call_claude(prompt, category, sources)
            else:
                # Fallback to rule-based response
                return self._generate_fallback_answer(question, category, sources)
        except Exception as e:
            print(f"AI service error: {e}")
            return self._generate_fallback_answer(question, category, sources)
    
    def _create_category_prompt(self, question: str, category: str, context: str) -> str:
        """Create category-specific prompt"""
        
        base_prompt = f"""질문: {question}
카테고리: {category}

{context}

위 정보를 참고하여 질문에 대한 전문적이고 정확한 답변을 한국어로 작성해주세요."""

        if category == '수학':
            return f"""{base_prompt}

수학 답변 가이드라인:
- 공식이나 수식이 포함된 경우 LaTeX 형식으로 작성 (예: $x^2 + y^2 = r^2$)
- 단계별로 풀이 과정을 명확히 설명
- 필요시 그래프나 도형 설명 포함
- 결과 검증 방법 제시"""
        
        elif category == '과학':
            return f"""{base_prompt}

과학 답변 가이드라인:
- 과학적 원리와 법칙을 명확히 설명
- 실험이나 관찰 사례 포함
- 관련 공식이나 화학식 제시
- 실생활 응용 사례 언급"""
        
        elif category == '프로그래밍':
            return f"""{base_prompt}

프로그래밍 답변 가이드라인:
- 코드 예시를 포함하여 설명
- 각 단계별 주석과 설명
- 실행 결과나 출력 예시
- 최적화나 대안 방법 제시"""
        
        return base_prompt
    
    async def _call_openai(self, prompt: str, category: str, sources: List[str]) -> AIResponse:
        """Call OpenAI API"""
        async with httpx.AsyncClient() as client:
            response = await client.post(
                "https://api.openai.com/v1/chat/completions",
                headers={
                    "Authorization": f"Bearer {self.openai_api_key}",
                    "Content-Type": "application/json"
                },
                json={
                    "model": "gpt-4",
                    "messages": [
                        {"role": "system", "content": "당신은 전문적인 교육 도우미입니다. 정확하고 이해하기 쉬운 답변을 제공합니다."},
                        {"role": "user", "content": prompt}
                    ],
                    "max_tokens": 1000,
                    "temperature": 0.7
                },
                timeout=30.0
            )
            
            if response.status_code == 200:
                result = response.json()
                answer = result['choices'][0]['message']['content']
                return AIResponse(
                    answer=answer,
                    confidence=0.9,
                    category=category,
                    sources=sources,
                    reasoning="OpenAI GPT-4를 사용한 답변"
                )
            else:
                raise Exception(f"OpenAI API error: {response.status_code}")
    
    async def _call_claude(self, prompt: str, category: str, sources: List[str]) -> AIResponse:
        """Call Claude API"""
        try:
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    "https://api.anthropic.com/v1/messages",
                    headers={
                        "x-api-key": self.claude_api_key,
                        "Content-Type": "application/json",
                        "anthropic-version": "2023-06-01"
                    },
                    json={
                        "model": "claude-3-5-sonnet-20241022",
                        "max_tokens": 1000,
                        "messages": [
                            {"role": "user", "content": prompt}
                        ]
                    },
                    timeout=30.0
                )
                
                if response.status_code == 200:
                    result = response.json()
                    answer = result['content'][0]['text']
                    return AIResponse(
                        answer=answer,
                        confidence=0.9,
                        category=category,
                        sources=sources,
                        reasoning="Claude AI를 사용한 답변"
                    )
                else:
                    print(f"Claude API error: {response.status_code}, Response: {response.text}")
                    raise Exception(f"Claude API error: {response.status_code}")
        except Exception as e:
            print(f"Claude API connection error: {str(e)}")
            # Fall back to generating a helpful response
            raise e
    
    def _generate_fallback_answer(self, question: str, category: str, sources: List[str]) -> AIResponse:
        """Generate fallback answer when AI services are not available"""
        
        fallback_responses = {
            '수학': "이 수학 문제를 해결하기 위해서는 단계별로 접근해보겠습니다. 주어진 조건을 정리하고, 관련 공식을 적용해보세요. 구체적인 계산 과정이 필요하시면 더 자세한 정보를 제공해주세요.",
            '과학': "이 과학 질문에 답하기 위해서는 관련 원리와 법칙을 이해하는 것이 중요합니다. 실험적 관찰이나 이론적 배경을 함께 고려해보시기 바랍니다.",
            '프로그래밍': "이 프로그래밍 문제를 해결하기 위해서는 알고리즘을 단계별로 설계하고 구현해야 합니다. 코드 예시와 함께 설명드리겠습니다.",
            '일반': "질문에 대한 답변을 위해 관련 정보를 수집하고 분석해보겠습니다. 더 구체적인 내용이나 맥락을 제공해주시면 더 정확한 답변을 드릴 수 있습니다."
        }
        
        base_answer = fallback_responses.get(category, fallback_responses['일반'])
        
        if sources:
            base_answer += f"\n\n참고한 관련 질문들:\n" + "\n".join(f"- {source}" for source in sources[:3])
        
        return AIResponse(
            answer=base_answer,
            confidence=0.6,
            category=category,
            sources=sources,
            reasoning="기본 템플릿 기반 답변 (AI 서비스 미사용)"
        )

class CategorySpecialization:
    """Category-specific answer formatting and tools"""
    
    @staticmethod
    def format_math_answer(answer: str) -> str:
        """Format mathematical answer with LaTeX support"""
        # Add MathJax delimiters for mathematical expressions
        formatted = answer
        
        # Convert common mathematical expressions
        import re
        
        # Convert ** to ^ for exponents (x**2 -> x^2)
        formatted = re.sub(r'(\w+)\*\*(\w+)', r'$\1^{\2}$', formatted)
        
        # Wrap standalone mathematical expressions
        math_patterns = [
            r'([a-zA-Z]\s*[+\-*/=]\s*[a-zA-Z0-9]+)',
            r'([0-9]+\s*[+\-*/=]\s*[0-9]+)',
            r'(∫|∑|∏|√|∞|π|α|β|γ|δ|θ|λ|μ|σ|φ|ψ|ω)'
        ]
        
        for pattern in math_patterns:
            formatted = re.sub(pattern, r'$\1$', formatted)
        
        return formatted
    
    @staticmethod
    def format_code_answer(answer: str, language: str = 'python') -> str:
        """Format programming answer with syntax highlighting"""
        # Add code blocks for better formatting
        import re
        
        # Find code snippets and wrap them
        code_pattern = r'```(\w+)?\n(.*?)\n```'
        
        def replace_code(match):
            lang = match.group(1) or language
            code = match.group(2)
            return f'```{lang}\n{code}\n```'
        
        formatted = re.sub(code_pattern, replace_code, answer, flags=re.DOTALL)
        
        # Add basic code highlighting for inline code
        formatted = re.sub(r'`([^`]+)`', r'<code>\1</code>', formatted)
        
        return formatted
    
    @staticmethod
    def get_category_tools(category: str) -> Dict[str, Any]:
        """Get specialized tools for each category"""
        tools = {
            '수학': {
                'mathjax': True,
                'calculator': True,
                'graph_plotting': True,
                'formula_templates': [
                    '이차방정식: $ax^2 + bx + c = 0$',
                    '피타고라스 정리: $a^2 + b^2 = c^2$',
                    '미분: $\\frac{d}{dx}f(x)$',
                    '적분: $\\int f(x)dx$'
                ]
            },
            '과학': {
                'unit_converter': True,
                'periodic_table': True,
                'formula_templates': [
                    '속도: $v = \\frac{d}{t}$',
                    '운동에너지: $E_k = \\frac{1}{2}mv^2$',
                    '이상기체: $PV = nRT$'
                ]
            },
            '프로그래밍': {
                'code_editor': True,
                'syntax_highlighting': True,
                'code_templates': [
                    'Python 함수',
                    'JavaScript 함수',
                    'HTML 템플릿',
                    'SQL 쿼리'
                ]
            },
            '영어': {
                'dictionary': True,
                'grammar_checker': True,
                'translation': True
            }
        }
        
        return tools.get(category, {})