# Email Summary Server

Gemma 모델을 사용하여 이메일 텍스트를 한 줄로 요약하는 Flask 기반 서버입니다.

## 요구 사항

- Python 3.10
- Microsoft C++ Build Tools (llama-cpp-python 빌드에 필요):
  ```bash
  winget install --id=Microsoft.VisualStudio.2022.BuildTools -e --override "--wait --quiet --norestart --add Microsoft.VisualStudio.Workload.VCTools --includeRecommended"
  ```
- 가상 환경 생성 (권장):
  ```bash
  python -m venv venv_name  # 또는 python3 -m venv venv_name
  venv_name\Scripts\activate  # Windows
  # source venv_name/bin/activate  # Linux/macOS
  ```
- 필요 라이브러리:
  ```bash
  pip install -r _requirements.txt
  ```

## 모델 다운로드

```bash
python model_download.py  # tensorblock/gemma-3-4b-it-GGUF에서 모델 다운로드
```

## 서버 실행

```bash
python server.py  # 기본 포트: 0.0.0.0:5000
```

## API 엔드포인트

### POST /summarize

이메일 텍스트를 요약합니다.

**Request:**
```json
{
    "email_text": "요약할 이메일 내용"
}
```

**Response:**
```json
{
    "summary": "요약된 이메일 내용"
}
```

## 서버 주요 기능

- **모델 캐싱:** 로딩 시간 단축을 위한 모델 캐싱
- **자동 메모리 관리:** 미사용 모델 자동 해제 (기본 60초)
- **리소스 경로 관리:** 개발 및 배포 환경 모두 지원
- **리소스 모니터링:** CPU 및 메모리 사용량 모니터링

## EXE 파일 빌드

```
python exe_builder.py
```
실행 시 `dist/EmailSummaryServer`에 exe 파일 생성됨. 이 폴더 통쨰로 사용하면 됨.

## 테스트

`_email_sample.txt` 파일로 요약 기능을 테스트할 수 있습니다.

## exe 링크
[https://drive.google.com/file/d/1SKsIyKDba6wP_X-1gIfHRaJVsWxGW01o/view?usp=sharing](https://drive.google.com/file/d/1SKsIyKDba6wP_X-1gIfHRaJVsWxGW01o/view?usp=sharing)