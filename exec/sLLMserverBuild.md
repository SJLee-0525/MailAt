# Mailat 포팅메뉴얼
---

## sLLM inference Server(Gemma 4B & OpenAI API Hybrid)

1.  **사전 준비 사항**:
    *   **Python**: Python 3.10.11 버전을 설치합니다.
    *   **Microsoft C++ Build Tools**: `llama-cpp-python` 라이브러리 빌드에 필요합니다. README.md 파일에 설치 명령어가 안내되어 있습니다.
        ```bash
        winget install --id=Microsoft.VisualStudio.2022.BuildTools -e --override "--wait --quiet --norestart --add Microsoft.VisualStudio.Workload.VCTools --includeRecommended"
        ```
    *   **가상 환경 생성 (권장)**: 프로젝트별 의존성을 관리하기 위해 가상 환경을 사용하는 것이 좋습니다. gemma-server 디렉터리에서 다음 명령어를 실행합니다.
        ```bash
        python -m venv email-env
        email-env\Scripts\activate
        ```
    *   **필요 라이브러리 설치**: 가상 환경이 활성화된 상태에서 gemma-server 디렉터리에 있는 `_requirements.txt` 파일을 사용하여 필요한 Python 패키지를 설치합니다.
        ```bash
        pip install -r _requirements.txt
        ```

2.  **모델 다운로드**:
    *   sLLM 서버는 Gemma GGUF 모델을 사용합니다. gemma-server 디렉터리에서 다음 스크립트를 실행하여 모델을 다운로드합니다. 모델은 models 디렉터리에 저장됩니다.
        ```bash
        python model_download.py
        ```
        (model_download.py 참고)

3.  **환경 변수 설정 (.env 파일)**:
    *   OpenAI API를 사용하거나 특정 설정을 관리하기 위해 gemma-server 디렉터리 루트에 `.env` 파일을 생성해야 할 수 있습니다. `server_hybrid.py` 파일은 `OPENAI_API_KEY` 및 `OPENAI_BASE_URL` 같은 환경 변수를 로드하려고 시도합니다.
    *   `.env` 파일 예시:
        ```env
        # filepath: c:\S12P31A204\apps\gemma-server\.env
        OPENAI_API_KEY="your_openai_api_key"
        OPENAI_BASE_URL="your_openai_base_url_if_not_default"
        ```
    *   OpenAI API 키가 없으면 로컬 Gemma 모델로만 작동하거나, OpenAI 기능을 사용하는 `server_openai.py` 또는 `server_hybrid.py`의 해당 부분이 제한될 수 있습니다.

4.  **서버 실행**:
    *   모든 준비가 완료되면 gemma-server 디렉터리에서 다음 명령어를 사용하여 Flask 기반의 sLLM 서버를 실행합니다. `server_hybrid.py`는 OpenAI API와 로컬 Gemma 모델을 함께 사용하려는 시도를 하며, 이것이 주 실행 파일로 보입니다.
        ```bash
        python server_hybrid.py
        ```
    *   서버는 기본적으로 `0.0.0.0:5000`에서 실행됩니다. (server_hybrid.py의 `if __name__ == "__main__":` 블록 참고)
    *   만약 로컬 Gemma 모델만 사용하고 싶다면 `server.py`를 실행할 수도 있습니다.
        ```bash
        python server.py
        ```
