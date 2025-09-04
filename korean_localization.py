#!/usr/bin/env python3
"""
Korean Localization System for Student Q&A Platform
"""

import json
import os
from typing import Dict, Any, Optional

class KoreanLocalization:
    """Korean language support and localization manager"""
    
    def __init__(self):
        self.translations = self.load_translations()
        self.korean_qa_content = self.load_korean_qa_content()
    
    def load_translations(self) -> Dict[str, Dict[str, str]]:
        """Load Korean translations"""
        return {
            # Navigation and UI
            "nav": {
                "welcome": "환영합니다",
                "student_qa_knowledge_base": "학생 질문답변 지식 베이스",
                "learn_share_grow": "함께 배우고, 나누고, 성장하는 공간",
                "search": "검색",
                "browse_all": "모두 보기",
                "ask_question": "질문하기", 
                "statistics": "통계",
                "all_subjects": "모든 과목",
                "login": "로그인",
                "register": "회원가입",
                "logout": "로그아웃"
            },
            
            # Subjects/Categories
            "subjects": {
                "mathematics": "수학",
                "science": "과학", 
                "history": "역사",
                "language": "국어 및 문학",
                "geography": "지리",
                "computer_science": "컴퓨터 과학",
                "study_tips": "학습 팁 및 기술",
                "general": "일반 상식"
            },
            
            # Forms and Input
            "forms": {
                "search_placeholder": "숙제 도움, 학습 팁, 또는 어떤 주제든 검색해보세요...",
                "your_question": "질문",
                "your_answer": "답변/설명",
                "question_placeholder": "무엇을 알고 싶으신가요? (예: 이차방정식은 어떻게 풀죠?)",
                "answer_placeholder": "다른 학생들을 도울 수 있는 자세한 답변이나 설명을 작성해주세요...",
                "subject": "과목",
                "tags": "태그",
                "tags_placeholder": "대수, 숙제, 시험준비 등",
                "add_question_answer": "질문과 답변 추가하기",
                "required": "필수",
                "cancel": "취소"
            },
            
            # Interactions
            "interactions": {
                "reply": "댓글",
                "add_reply": "댓글 추가",
                "helpful": "도움됨",
                "replies": "댓글",
                "no_replies": "아직 댓글이 없습니다. 첫 번째로 도움을 주세요!",
                "your_reply": "댓글 내용",
                "reply_placeholder": "생각, 추가 정보, 또는 후속 질문을 공유해주세요...",
                "share_thoughts": "생각을 나누고, 추가 정보를 제공하거나 후속 질문을 해보세요...",
                "be_first_to_help": "첫 번째로 도움을 주는 사람이 되어주세요!"
            },
            
            # Messages and Status
            "messages": {
                "no_results_found": "검색 결과가 없습니다",
                "try_different_terms": "다른 검색어를 시도하거나 모든 질문을 둘러보세요.",
                "loading": "로딩 중...",
                "search_failed": "검색에 실패했습니다. 다시 시도해주세요.",
                "question_added": "질문이 성공적으로 추가되었습니다!",
                "thank_you_contributing": "기여해주셔서 감사합니다",
                "reply_added": "댓글이 성공적으로 추가되었습니다!",
                "authentication_required": "로그인이 필요합니다",
                "please_login": "로그인해 주세요"
            },
            
            # Statistics
            "stats": {
                "learning_community_statistics": "학습 커뮤니티 통계",
                "total_questions": "전체 질문 수",
                "subject_areas": "학습 영역",
                "total_replies": "전체 댓글 수", 
                "students": "학생 수",
                "helpful_replies": "도움되는 댓글",
                "community": "커뮤니티",
                "active_students": "활동중인 학생",
                "active_sessions": "활성 세션",
                "top_contributors": "주요 기여자",
                "popular_topics": "인기 주제"
            },
            
            # Help and Instructions
            "help": {
                "need_help_title": "숙제, 공부, 또는 학업과 관련된 도움이 필요하신가요?",
                "need_help_desc": "질문을 올리고 동료 학생들을 도와주세요!",
                "how_to_use": "사용 방법",
                "search_tip": "검색어를 입력하여 기존 질문과 답변을 찾아보세요",
                "ask_tip": "새로운 질문을 올려 커뮤니티의 도움을 받아보세요", 
                "reply_tip": "다른 학생들의 질문에 답변하여 도움을 주세요",
                "helpful_tip": "유용한 답변에는 '도움됨'을 눌러주세요"
            },
            
            # Time and Dates
            "time": {
                "today": "오늘",
                "yesterday": "어제",
                "days_ago": "일 전",
                "hours_ago": "시간 전",
                "minutes_ago": "분 전",
                "just_now": "방금 전"
            },
            
            # Common Actions
            "actions": {
                "submit": "제출",
                "save": "저장",
                "edit": "수정",
                "delete": "삭제",
                "share": "공유",
                "copy": "복사",
                "print": "인쇄",
                "export": "내보내기",
                "import": "가져오기"
            }
        }
    
    def load_korean_qa_content(self) -> Dict[str, Any]:
        """Load Korean Q&A educational content"""
        return {
            "mathematics": [
                {
                    "question": "피타고라스 정리란 무엇인가요?",
                    "answer": "피타고라스 정리는 직각삼각형에서 빗변의 제곱이 다른 두 변의 제곱의 합과 같다는 정리입니다. 즉, a² + b² = c² (c는 빗변)입니다.",
                    "tags": ["기하", "정리", "삼각형", "수학", "피타고라스"]
                },
                {
                    "question": "원의 넓이는 어떻게 구하나요?",
                    "answer": "원의 넓이는 A = πr² 공식으로 구할 수 있습니다. 여기서 r은 원의 반지름이고, π(파이)는 약 3.14159입니다.",
                    "tags": ["기하", "원", "넓이", "공식", "파이"]
                },
                {
                    "question": "이차방정식의 해는 어떻게 구하나요?",
                    "answer": "이차방정식 ax² + bx + c = 0의 해는 근의 공식 x = (-b ± √(b²-4ac)) / 2a 를 사용하여 구할 수 있습니다.",
                    "tags": ["대수", "이차방정식", "근의공식", "방정식"]
                },
                {
                    "question": "분수의 덧셈은 어떻게 하나요?",
                    "answer": "분수의 덧셈을 할 때는 먼저 분모를 같게 만든 후 분자끼리 더합니다. 예: 1/2 + 1/3 = 3/6 + 2/6 = 5/6",
                    "tags": ["분수", "덧셈", "통분", "기본연산"]
                },
                {
                    "question": "삼각형의 내각의 합은 얼마인가요?",
                    "answer": "모든 삼각형의 내각의 합은 항상 180도입니다. 이는 삼각형의 중요한 성질 중 하나입니다.",
                    "tags": ["기하", "삼각형", "내각", "각도"]
                }
            ],
            
            "science": [
                {
                    "question": "광합성이란 무엇인가요?",
                    "answer": "광합성은 식물이 햇빛, 이산화탄소, 물을 이용해 포도당과 산소를 만드는 과정입니다. 화학식: 6CO₂ + 6H₂O + 빛에너지 → C₆H₁₂O₆ + 6O₂",
                    "tags": ["생물", "식물", "광합성", "에너지", "화학반응"]
                },
                {
                    "question": "뉴턴의 운동 법칙은 무엇인가요?",
                    "answer": "뉴턴의 3법칙: 1법칙(관성의 법칙) - 외력이 없으면 물체는 정지하거나 등속운동, 2법칙 - F=ma, 3법칙 - 작용반작용의 법칙",
                    "tags": ["물리", "뉴턴", "운동", "힘", "관성"]
                },
                {
                    "question": "원소주기율표는 어떻게 배열되어 있나요?",
                    "answer": "주기율표는 원소들을 원자번호(양성자 수) 순으로 배열한 표입니다. 같은 족(세로줄)의 원소들은 비슷한 성질을 가집니다.",
                    "tags": ["화학", "원소", "주기율표", "원자번호", "족"]
                },
                {
                    "question": "지구의 층구조는 어떻게 되어 있나요?",
                    "answer": "지구는 안쪽부터 내핵(고체 철, 니켈), 외핵(액체), 맨틀(마그마), 지각(암석층)으로 구성되어 있습니다.",
                    "tags": ["지구과학", "지구구조", "내핵", "외핵", "맨틀", "지각"]
                }
            ],
            
            "history": [
                {
                    "question": "한국전쟁은 언제 일어났나요?",
                    "answer": "한국전쟁은 1950년 6월 25일에 시작되어 1953년 7월 27일 휴전협정 체결로 분단이 고착화되었습니다.",
                    "tags": ["한국사", "한국전쟁", "1950년", "분단", "휴전협정"]
                },
                {
                    "question": "세종대왕의 주요 업적은 무엇인가요?",
                    "answer": "세종대왕의 대표적인 업적으로는 한글 창제, 측우기·해시계 발명, 집현전 설치, 과학기술 발달 등이 있습니다.",
                    "tags": ["조선시대", "세종대왕", "한글", "집현전", "과학기술"]
                },
                {
                    "question": "고려시대의 특징은 무엇인가요?",
                    "answer": "고려시대(918-1392)는 불교문화가 발달하고, 귀족정치, 과거제도, 팔만대장경 제작 등이 특징입니다.",
                    "tags": ["한국사", "고려시대", "불교", "귀족정치", "팔만대장경"]
                }
            ],
            
            "language": [
                {
                    "question": "은유법이란 무엇인가요?",
                    "answer": "은유법은 어떤 사물을 다른 사물에 빗대어 직접적으로 표현하는 수사법입니다. 예: '인생은 여행이다'",
                    "tags": ["국어", "수사법", "은유법", "문학", "표현기법"]
                },
                {
                    "question": "한글의 창제 원리는 무엇인가요?",
                    "answer": "한글은 발음기관의 모양을 본떠 만든 표음문자입니다. 자음은 발음기관의 모양, 모음은 천지인 사상을 바탕으로 만들어졌습니다.",
                    "tags": ["한글", "창제원리", "표음문자", "천지인", "세종대왕"]
                },
                {
                    "question": "품사의 종류에는 무엇이 있나요?",
                    "answer": "한국어 품사는 명사, 대명사, 수사, 조사, 동사, 형용사, 관형사, 부사, 감탄사로 9개가 있습니다.",
                    "tags": ["국어", "문법", "품사", "명사", "동사", "형용사"]
                }
            ],
            
            "geography": [
                {
                    "question": "우리나라의 기후 특징은 무엇인가요?",
                    "answer": "우리나라는 온대 계절풍 기후로, 사계절이 뚜렷하고 여름에 덥고 습하며 겨울에 춥고 건조한 특징이 있습니다.",
                    "tags": ["지리", "기후", "계절풍", "온대기후", "사계절"]
                },
                {
                    "question": "세계 7대륙은 무엇인가요?",
                    "answer": "세계 7대륙은 아시아, 아프리카, 북아메리카, 남아메리카, 남극, 유럽, 오세아니아입니다.",
                    "tags": ["세계지리", "대륙", "아시아", "아프리카", "아메리카"]
                }
            ],
            
            "computer_science": [
                {
                    "question": "알고리즘이란 무엇인가요?",
                    "answer": "알고리즘은 문제를 해결하기 위한 단계별 절차나 방법입니다. 컴퓨터가 이해할 수 있는 명령어의 순서라고 할 수 있습니다.",
                    "tags": ["컴퓨터과학", "알고리즘", "프로그래밍", "문제해결"]
                },
                {
                    "question": "HTML과 CSS의 차이점은 무엇인가요?",
                    "answer": "HTML은 웹 페이지의 구조와 내용을 만드는 언어이고, CSS는 웹 페이지의 디자인과 레이아웃을 꾸미는 언어입니다.",
                    "tags": ["웹개발", "HTML", "CSS", "프로그래밍", "웹디자인"]
                }
            ],
            
            "study_tips": [
                {
                    "question": "효과적인 암기 방법은 무엇인가요?",
                    "answer": "효과적인 암기 방법으로는 반복 학습, 연상법, 스토리텔링, 그림이나 도표 활용, 소리내어 읽기 등이 있습니다.",
                    "tags": ["학습법", "암기", "기억술", "공부방법", "학습전략"]
                },
                {
                    "question": "포모도로 기법이란 무엇인가요?",
                    "answer": "포모도로 기법은 25분 집중 공부 후 5분 휴식하는 패턴을 반복하는 시간 관리법입니다. 4번째 휴식은 15-30분으로 길게 합니다.",
                    "tags": ["학습법", "시간관리", "포모도로", "집중력", "생산성"]
                },
                {
                    "question": "시험 전 효과적인 복습 방법은?",
                    "answer": "시험 전에는 요약 노트 만들기, 문제 풀이 연습, 모르는 부분 집중 학습, 충분한 수면, 건강한 식사가 중요합니다.",
                    "tags": ["시험준비", "복습", "학습전략", "시험공부", "노트정리"]
                }
            ]
        }
    
    def get_translation(self, category: str, key: str, default: str = None) -> str:
        """Get Korean translation for a specific key"""
        return self.translations.get(category, {}).get(key, default or key)
    
    def get_all_translations(self, category: str = None) -> Dict[str, Any]:
        """Get all translations for a category or all categories"""
        if category:
            return self.translations.get(category, {})
        return self.translations
    
    def get_korean_qa_by_subject(self, subject: str, count: int = None) -> list:
        """Get Korean Q&A content for a specific subject"""
        qa_list = self.korean_qa_content.get(subject, [])
        if count:
            return qa_list[:count]
        return qa_list
    
    def get_all_korean_qa(self) -> Dict[str, list]:
        """Get all Korean Q&A content"""
        return self.korean_qa_content
    
    def format_korean_date(self, date_str: str) -> str:
        """Format date string for Korean display"""
        # Simple date formatting - in real implementation, use proper date library
        from datetime import datetime
        try:
            date_obj = datetime.fromisoformat(date_str.replace('Z', '+00:00'))
            return date_obj.strftime("%Y년 %m월 %d일")
        except:
            return date_str
    
    def get_subject_icon(self, subject: str) -> str:
        """Get icon for Korean subjects"""
        icons = {
            "mathematics": "🔢",
            "science": "🔬", 
            "history": "📚",
            "language": "✏️",
            "geography": "🌍",
            "computer_science": "💻",
            "study_tips": "🎯",
            "general": "💡"
        }
        return icons.get(subject, "📖")


# Initialize Korean localization
korean_support = KoreanLocalization()


def add_korean_qa_to_database():
    """Add Korean Q&A content to the main database"""
    from mcp_qa_server import QADatabase
    
    qa_db = QADatabase("demo_qa.json")
    
    print("🇰🇷 Adding Korean Q&A content...")
    total_added = 0
    
    for subject, qa_list in korean_support.get_all_korean_qa().items():
        print(f"\n📚 {subject} ({korean_support.get_translation('subjects', subject, subject)}):")
        
        for qa in qa_list:
            qa_id = qa_db.add_qa(
                question=qa["question"],
                answer=qa["answer"], 
                category=subject,
                tags=qa["tags"]
            )
            print(f"  ✅ {qa['question'][:50]}... (ID: {qa_id[:8]})")
            total_added += 1
    
    print(f"\n🎉 Added {total_added} Korean Q&A pairs!")
    print(f"📊 Total database now contains {len(qa_db.data)} Q&A pairs")
    
    return qa_db


if __name__ == "__main__":
    # Test Korean localization
    print("🇰🇷 Korean Localization Test")
    print("=" * 40)
    
    # Test translations
    print("Navigation translations:")
    nav_translations = korean_support.get_all_translations("nav")
    for key, value in nav_translations.items():
        print(f"  {key}: {value}")
    
    print("\nSubject translations:")
    subject_translations = korean_support.get_all_translations("subjects")
    for key, value in subject_translations.items():
        icon = korean_support.get_subject_icon(key)
        print(f"  {icon} {key}: {value}")
    
    # Test Korean Q&A content
    print("\nSample Korean Q&A (Mathematics):")
    math_qa = korean_support.get_korean_qa_by_subject("mathematics", 2)
    for qa in math_qa:
        print(f"  Q: {qa['question']}")
        print(f"  A: {qa['answer'][:60]}...")
        print(f"  Tags: {', '.join(qa['tags'])}\n")
    
    # Add Korean content to database
    add_korean_qa_to_database()