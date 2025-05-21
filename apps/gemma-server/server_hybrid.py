from flask import Flask, request, jsonify
from llama_cpp import Llama
import sys
import os
import time
import logging
import threading
import psutil
import json
from bs4 import BeautifulSoup
from openai import OpenAI, APIConnectionError
from dotenv import load_dotenv

# .env 파일에서 환경 변수 로드
load_dotenv()

# --- 로거 설정 ---
logging.basicConfig(level=logging.INFO,
                    format='%(asctime)s - %(levelname)s - %(message)s',
                    handlers=[logging.StreamHandler(sys.stdout)])
logger = logging.getLogger(__name__)

# --- 데이터 파일 경로를 위한 함수 ---
def resource_path(relative_path):
    """ 개발 환경 및 PyInstaller 환경 모두에서 리소스 경로를 가져옵니다. """
    try:
        # PyInstaller는 임시 폴더를 만들고 _MEIPASS에 경로를 저장합니다.
        base_path = sys._MEIPASS
    except Exception:
        base_path = os.path.abspath(".")
    return os.path.join(base_path, relative_path)

UNWANTED_TASKS = {"알림", "테스트", "Imap 테스트", "알 수 없음", "공지", "Notifications", "Test", "test", "테스트", "TEST"}

app = Flask(__name__)

# --- OpenAI 클라이언트 설정 ---
try:
    api_key = os.environ.get("OPENAI_API_KEY")
    base_url = os.environ.get("OPENAI_BASE_URL")

    client = OpenAI(api_key=api_key, base_url=base_url)
    
    if not client.api_key:
        logger.warning("OpenAI API 키가 .env 파일이나 환경 변수에 설정되지 않았습니다. OpenAI API 사용이 불가능할 수 있습니다.")
        client = None
    elif not client.base_url:
        logger.warning("OpenAI BASE URL이 .env 파일이나 환경 변수에 설정되지 않았습니다. OpenAI API 사용이 불가능할 수 있습니다.")
        client = None
    else:
        logger.info("OpenAI 클라이언트가 환경 변수를 통해 초기화되었습니다.")
except Exception as e:
    logger.error(f"OpenAI 클라이언트 초기화 중 오류 발생: {e}")
    client = None

# --- 로컬 Gemma 모델 설정 ---
GGUF_MODEL_FILENAME = "gemma-3-4b-it-q4_0.gguf" # 로컬 모델 파일명
GGUF_PATH = resource_path(os.path.join("models", GGUF_MODEL_FILENAME))

MODEL_CACHE = {
    "llm": None,
    "last_used_time": 0,
    "lock": threading.RLock()
}
MODEL_KEEP_ALIVE_SECONDS = 120 # 모델을 메모리에 유지할 시간 (초)

def get_model():
    with MODEL_CACHE["lock"]:
        if MODEL_CACHE["llm"] is None:
            logger.info(f"로컬 Gemma 모델을 로드합니다: {GGUF_PATH}")
            try:
                MODEL_CACHE["llm"] = Llama(
                    model_path=GGUF_PATH,
                    chat_format="gemma",
                    n_ctx=2048,
                    n_gpu_layers=0, # CPU 사용 시 0, GPU 사용 시 적절한 값 설정
                    verbose=False
                )
                logger.info("로컬 Gemma 모델 로드 완료.")
            except Exception as e:
                logger.error(f"로컬 Gemma 모델 로드 실패: {e}", exc_info=True)
                MODEL_CACHE["llm"] = None # 실패 시 None으로 설정
                return None
        else:
            logger.info("캐시된 로컬 Gemma 모델을 사용합니다.")
        MODEL_CACHE["last_used_time"] = time.time()
        return MODEL_CACHE["llm"]

def release_model_if_unused():
    while True:
        time.sleep(MODEL_KEEP_ALIVE_SECONDS / 2) # 주기적으로 확인
        with MODEL_CACHE["lock"]:
            if MODEL_CACHE["llm"] is not None:
                idle_time = time.time() - MODEL_CACHE["last_used_time"]
                if idle_time >= MODEL_KEEP_ALIVE_SECONDS:
                    logger.info(f"{MODEL_KEEP_ALIVE_SECONDS}초 동안 사용되지 않아 로컬 Gemma 모델을 해제합니다.")
                    del MODEL_CACHE["llm"] 
                    MODEL_CACHE["llm"] = None
                    logger.info("로컬 Gemma 모델 객체 해제 완료 (자동).")

# 로컬 Gemma 모델 자동 해제 스레드 시작
model_release_thread = threading.Thread(target=release_model_if_unused, daemon=True)
model_release_thread.start()

# --- 리소스 모니터링 함수 ---
def log_resource_usage():
    proc = psutil.Process(os.getpid())
    while True:
        try:
            mem_info = proc.memory_info()
            mem_rss_mb = mem_info.rss / (1024 ** 2)
            cpu_percent = proc.cpu_percent(interval=1.0)
            logger.info(f"[MONITOR] 메모리: {mem_rss_mb:.1f}MB | CPU: {cpu_percent:.1f}%")
        except psutil.NoSuchProcess:
            logger.warning("[MONITOR] 프로세스를 찾을 수 없어 리소스 모니터링을 중단합니다.")
            break
        except Exception as e:
            logger.error(f"[MONITOR] 리소스 모니터링 중 오류 발생: {e}", exc_info=True)
        time.sleep(60)

resource_monitor_thread = threading.Thread(target=log_resource_usage, daemon=True)
resource_monitor_thread.start()

@app.route("/summarize", methods=["POST"])
def summarize_email():
    data = request.json
    email_html_content = data.get("email_text", "")
    t_start = time.perf_counter()
    logger.info(f"요약 요청 수신 - 이메일 앞부분 (HTML): {email_html_content[:100]}...")

    try:
        soup = BeautifulSoup(email_html_content, "html.parser")
        email_text = soup.get_text(separator=" ", strip=True)
        logger.info(f"HTML 파싱 후 텍스트 앞부분: {email_text[:100]}...")
    except Exception as e:
        logger.error(f"HTML 파싱 중 오류 발생: {e}", exc_info=True)
        email_text = email_html_content # 파싱 실패 시 원본 HTML 사용 (혹은 오류 반환)

    MAX_EMAIL_CHARS = 2500
    if len(email_text) > MAX_EMAIL_CHARS:
        logger.warning(f"추출된 텍스트가 너무 길어 {MAX_EMAIL_CHARS}자로 자릅니다. 원본 길이: {len(email_text)}")
        email_text = email_text[:MAX_EMAIL_CHARS]

    parsed_content = None
    summary = ""
    scheduled_at = None
    task = None

    weekday_map = ["월", "화", "수", "목", "금", "토", "일"]
    current_weekday = time.localtime().tm_wday
    weekday_kr = weekday_map[current_weekday]
    today_str = f"{time.localtime().tm_year}-{time.localtime().tm_mon:02d}-{time.localtime().tm_mday:02d}({weekday_kr})"

    # 공통 메시지 및 JSON 스키마 정의
    # task 글자 수 제한을 10글자로 통일 (Gemma 기준)
    # scheduled_at, task가 null일 경우의 조건은 프롬프트에서 명확히 함
    messages = [
        {
            "role": "system",
            "content": (
                "이메일 요약 전문가이자 일정/할일 추출자. "
                "절대 배열이나 불필요한 문장 없이, 정확히 JSON을 반환하세요: "
                "scheduled_at에는 괄호나 추가 설명 없이 YYYY-MM-DD(요일) 형태로만 작성하며 내일 회의일 경우 D+1 그리고 다음 주 라고 작성되어 있을 경우 요일을 계산하여 작성함, "
                "task도 단일 문자열(최대 10글자)만 작성하세요. "
                "Key값은 영어로 작성하고, 엔터나 백틱 등은 절대 포함하지 마세요."
                "task는 한글로 답변하세요."
                "만약 'task' 또는 'scheduled_at' 중 하나라도 유효한 값을 추출할 수 없으면, 둘 다 반드시 null이어야 합니다."
            )
        },
        {
            "role": "system",
            "content": (
                "Few-shot 예시:\n"
                f"오늘 날짜 : {today_str}\n" # 동적으로 오늘 날짜 반영
                "이메일: '안녕하세요. 내일 회의가 있습니다.'\n"
                '응답: {"summary":"내일 회의 안내","scheduled_at":"YYYY-MM-DD(금)","task":"회의"} (YYYY-MM-DD는 내일 날짜)\n'
                "이메일: '다음 주 수요일 오후 3시에 미팅합시다.'\n"
                '응답: {"summary":"다음 주 수요일 오후 3시 미팅 제안","scheduled_at":"YYYY-MM-DD(수)","task":"미팅"} (YYYY-MM-DD는 다음 주 수요일 날짜)\n'
                "이메일: '별 내용 없습니다.'\n"
                '응답: {"summary":"별 내용 없음","scheduled_at":null,"task":null}'
            )
        },
        {
            "role": "user",
            "content": (
                f"\n\n아래 이메일을 최대 두 줄로 요약하고, 일정과 할 일을 JSON으로 반환하세요.\n\n{email_text}"
                f'오늘 날짜 : {today_str}\n\n'
                '{"summary":"<single-line string>",'
                '"scheduled_at":"<YYYY-MM-DD(요일) 또는 null>",'
                '"task":"<10글자 이내 한 줄 문자열 또는 null>"}. '
            )
        }
    ]

    JSON_SCHEMA = {
        "type": "object",
        "properties": {
            "summary":  {"type": "string"},
            "scheduled_at": {"type": ["string", "null"]}, # null 허용
            "task":     {"type": ["string", "null"]}  # null 허용
        },
        "required": ["summary", "scheduled_at", "task"],
        "additionalProperties": False
    }

    use_openai = True # 기본적으로 OpenAI 사용 시도

    if client is None: # OpenAI 클라이언트 초기화 자체가 실패한 경우
        logger.warning("OpenAI 클라이언트가 초기화되지 않았습니다. 로컬 Gemma 모델로 직접 전환합니다.")
        use_openai = False

    if use_openai:
        try:
            logger.info("OpenAI API를 사용하여 요약을 시도합니다.")
            # OpenAI API 호출 (gpt-4o 또는 gpt-4.1 등)
            # server_openai.py의 tool 사용 방식 적용
            response = client.chat.completions.create(
                model="gpt-4.1", # 또는 "gpt-4.1", "gpt-3.5-turbo" 등 사용 가능한 모델
                messages=messages,
                max_tokens=1024, # OpenAI 모델에 적합한 max_tokens
                temperature=0.0,
                top_p=0.8, # 필요시 조정
                tools=[{
                    "type": "function",
                    "function": {
                        "name": "extract_email_summary",
                        "description": "이메일 요약, 일정, 할일 정보를 반환합니다.",
                        "parameters": JSON_SCHEMA
                    }
                }],
                tool_choice={"type": "function", "function": {"name": "extract_email_summary"}}
            )
            
            tool_call = response.choices[0].message.tool_calls[0]
            content_str = tool_call.function.arguments
            parsed_content = json.loads(content_str)
            logger.info(f"OpenAI API를 통해 요약 성공. 응답: {parsed_content}")

        except APIConnectionError as e:
            logger.warning(f"OpenAI API 연결 실패 ({e}). 로컬 Gemma 모델로 전환합니다.")
            use_openai = False # 로컬 모델 사용 플래그 설정
        except Exception as e:
            logger.error(f"OpenAI API 요약 처리 중 예상치 못한 오류 발생: {e}", exc_info=True)
            # OpenAI에서 다른 오류 발생 시, 로컬로 넘어가지 않고 바로 오류 반환 또는 로컬 시도 결정
            # 여기서는 로컬로 넘어가지 않고 오류 반환
            return jsonify({"error": "OpenAI API 처리 중 오류가 발생했습니다."}), 500

    if not use_openai: # OpenAI 사용 실패 또는 처음부터 로컬 사용 결정 시
        logger.info("로컬 Gemma 모델을 사용하여 요약을 시도합니다.")
        try:
            with MODEL_CACHE["lock"]:
                llm = get_model()
                if llm is None:
                    logger.error("로컬 Gemma 모델을 현재 사용할 수 없습니다. (로드 실패 또는 사용 불가 상태)")
                    return jsonify({"error": "로컬 모델을 현재 사용할 수 없습니다. 잠시 후 다시 시도해주세요."}), 503

                gemma_response = llm.create_chat_completion(
                    messages=messages,
                    max_tokens=512, # Gemma 모델에 적합한 max_tokens
                    temperature=0.0,
                    top_p=0.8,
                    repeat_penalty=1.2,
                    response_format={ # Gemma의 JSON 모드 사용
                        "type": "json_object",
                        "schema": JSON_SCHEMA,
                    }
                )
                content_str = gemma_response["choices"][0]["message"]["content"].strip()
                parsed_content = json.loads(content_str)
                logger.info(f"로컬 Gemma 모델을 통해 요약 성공. 응답: {parsed_content}")

        except Exception as e:
            logger.error(f"로컬 Gemma 모델 처리 중 오류 발생: {e}", exc_info=True)
            return jsonify({"error": "로컬 모델 처리 중 오류가 발생했습니다."}), 500

    if parsed_content:
        summary = parsed_content.get("summary", "")
        scheduled_at_raw = parsed_content.get("scheduled_at", None) # null일 수 있음
        task_raw = parsed_content.get("task", None) # null일 수 있음

        # task가 UNWANTED_TASKS에 포함되거나, task 또는 scheduled_at이 명시적으로 빈 문자열일 경우 null로 처리
        if task_raw is not None and (task_raw.strip() in UNWANTED_TASKS or task_raw.strip() == ""):
            logger.info(f"작업 '{task_raw}'가 원치 않는 작업이거나 빈 문자열이므로 null 처리합니다.")
            task = None
            scheduled_at = None # 작업이 유효하지 않으면 날짜도 무효화
        elif task_raw is None or scheduled_at_raw is None : # 둘 중 하나라도 null이면 둘 다 null
            logger.info(f"task ({task_raw}) 또는 scheduled_at ({scheduled_at_raw})이 null이므로 둘 다 null 처리합니다.")
            task = None
            scheduled_at = None
        else:
            task = task_raw.strip() if isinstance(task_raw, str) else None
            # scheduled_at 파싱은 유효한 문자열일 때만 수행
            if isinstance(scheduled_at_raw, str) and scheduled_at_raw.strip() != "":
                scheduled_at = parse_scheduled_at(scheduled_at_raw)
                if scheduled_at is None: # 파싱 실패 시 (예: "내일" 같은 상대적 표현만 있고 변환 불가)
                    logger.warning(f"scheduled_at '{scheduled_at_raw}' 파싱 실패. null로 처리합니다.")
                    task = None # 날짜 파싱 실패 시 작업도 무효화
            else: # scheduled_at_raw가 null이거나 빈 문자열
                scheduled_at = None
                task = None # 날짜가 없으면 작업도 무효화

    else: # OpenAI와 로컬 모두 실패한 경우 (이론상 여기까지 오면 안됨, 위에서 return됨)
        logger.error("요약 내용을 생성하지 못했습니다 (OpenAI 및 로컬 모두 실패).")
        return jsonify({"error": "요약 내용을 생성하지 못했습니다."}), 500


    t_end = time.perf_counter()
    logger.info(f"요약 요청 처리 완료. 사용된 모델: {'OpenAI' if use_openai and parsed_content else 'Local Gemma' if parsed_content else '실패'}. 소요 시간: {t_end - t_start:.2f}초")
    return jsonify({"summary": summary, "scheduled_at": scheduled_at, "task": task})

def parse_scheduled_at(scheduled_at_str):
    if scheduled_at_str is None or not isinstance(scheduled_at_str, str) or scheduled_at_str.strip() == "null" or scheduled_at_str.strip() == "":
        return None
    
    # "YYYY-MM-DD(요일)" 형식인지 확인 (간단한 정규식 또는 패턴 매칭)
    # 예: 2025-05-20(화)
    import re
    match = re.match(r"(\d{4}-\d{2}-\d{2})\s*\(?[월화수목금토일]\)?", scheduled_at_str.strip())
    if match:
        date_str = match.group(1)
        return f"{date_str}T00:00:00.000Z"
    else:
        # LLM이 다른 형식 (예: "내일", "다음 주 수요일")으로 반환했을 경우,
        # 이를 파싱하여 절대적인 날짜로 변환하는 로직이 필요합니다.
        # 현재 프롬프트는 YYYY-MM-DD(요일) 형식을 강제하므로, 이외의 경우는 오류 또는 None으로 처리.
        logger.warning(f"parse_scheduled_at: '{scheduled_at_str}'은(는) 예상된 'YYYY-MM-DD(요일)' 형식이 아닙니다. None을 반환합니다.")
        return None


if __name__ == "__main__":
    # 로컬 Gemma 모델 파일 존재 여부 확인 (선택 사항)
    if not os.path.exists(GGUF_PATH):
        logger.warning(f"로컬 Gemma 모델 파일({GGUF_PATH})을 찾을 수 없습니다. 로컬 폴백이 작동하지 않을 수 있습니다.")
    
    # OpenAI API 키 및 URL 설정 확인
    if client is None:
         logger.warning("OpenAI 클라이언트가 초기화되지 않았습니다. .env 파일 또는 환경 변수에 OPENAI_API_KEY와 OPENAI_BASE_URL을 확인해주세요.")

    app.run(host="0.0.0.0", port=5000, debug=False)