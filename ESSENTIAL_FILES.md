# 🎯 Vercel 배포에 필수인 파일들만

GitHub에서 "너무 많다"고 하시니, 꼭 필요한 파일들만 업로드하세요!

## 📁 필수 폴더/파일 (반드시 업로드)

### 1. 설정 파일들
- `vercel.json` - Vercel 배포 설정
- `requirements.txt` - Python 라이브러리
- `.vercelignore` - 배포 제외 파일

### 2. API 폴더 (전체)
- `api/index.py` - 메인 앱
- `api/mcp.py` - MCP 서버

### 3. 애플리케이션 핵심 파일들
- `web_app_with_replies.py` - Flask 메인 앱
- `ai_service.py` - AI 서비스
- `mcp_qa_server.py` - Q&A 서버
- `auth_models.py` - 인증 모델
- `reply_models.py` - 답글 모델
- `korean_localization.py` - 한국어 지원
- `student_content.py` - 학생 콘텐츠

### 4. 데이터 파일들
- `demo_qa.json` - 샘플 Q&A 데이터
- `users.json` - 사용자 데이터
- `sessions.json` - 세션 데이터
- `replies.json` - 답글 데이터

### 5. 웹 파일들
- `templates/` 폴더 전체
- `static/` 폴더 전체

## ❌ 업로드하지 말 것

- `node_modules/` - 너무 큼
- `qa_venv/` - 가상환경
- `__pycache__/` - 캐시 파일들
- `*.pyc` - 컴파일된 파이썬 파일들
- `.git/` - Git 폴더
- `ai-qa-dashboard.zip` - 압축 파일
- 문서 파일들 (`*.md`) - 나중에 추가 가능

## 🚀 업로드 방법

1. **위의 필수 파일들만 선택**
2. **GitHub 저장소에서 드래그 앤 드롭**
3. **커밋 메시지**: "Essential files for Vercel deployment"

이렇게 하면 파일 수가 훨씬 적어집니다!