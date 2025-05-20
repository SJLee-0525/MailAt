from flask import Flask, request, jsonify
from llama_cpp import Llama
import sys
import os
import time
import logging
import threading
import psutil
import json
from bs4 import BeautifulSoup # BeautifulSoup 임포트

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

# GGUF_PATH 설정
GGUF_MODEL_FILENAME = "gemma-3-4b-it-q4_0.gguf"
GGUF_PATH = resource_path(os.path.join("models", GGUF_MODEL_FILENAME))

# --- 리소스 모니터링 함수 ---
def log_resource_usage():
    proc = psutil.Process(os.getpid()) # 현재 프로세스 PID로 psutil.Process 객체 생성
    while True:
        try:
            mem_info = proc.memory_info()
            mem_rss_mb = mem_info.rss / (1024 ** 2)  # Resident Set Size in MB
            cpu_percent = proc.cpu_percent(interval=1.0) # 1초 간격으로 CPU 사용률 측정
            logger.info(f"[MONITOR] 메모리: {mem_rss_mb:.1f}MB | CPU: {cpu_percent:.1f}%")
        except psutil.NoSuchProcess:
            logger.warning("[MONITOR] 프로세스를 찾을 수 없어 리소스 모니터링을 중단합니다.")
            break
        except Exception as e:
            logger.error(f"[MONITOR] 리소스 모니터링 중 오류 발생: {e}", exc_info=True)
        time.sleep(4) # 1초 측정 후 4초 대기 (총 5초 간격)

# 리소스 모니터링 스레드 시작
resource_monitor_thread = threading.Thread(target=log_resource_usage, daemon=True)
resource_monitor_thread.start()
# --- 리소스 모니터링 함수 끝 ---

# --- 모델 캐싱 및 자동 해제 로직 ---
MODEL_CACHE = {
    "llm": None,
    "last_used_time": 0,
    "lock": threading.RLock()
}
MODEL_KEEP_ALIVE_SECONDS = 60 # 모델을 메모리에 유지할 시간 (초)

def get_model():
    with MODEL_CACHE["lock"]:
        if MODEL_CACHE["llm"] is None:
            logger.info("모델을 새로 로드합니다.")
            MODEL_CACHE["llm"] = Llama(
                model_path=GGUF_PATH,
                chat_format="gemma",
                n_ctx=2048,
                n_gpu_layers=0,
                verbose=False
            )
            logger.debug("새 모델 로드 완료.")
        else:
            logger.info("캐시된 모델을 사용합니다.")
        MODEL_CACHE["last_used_time"] = time.time()
        return MODEL_CACHE["llm"]

def release_model_if_unused():
    while True:
        time.sleep(MODEL_KEEP_ALIVE_SECONDS / 2) # 주기적으로 확인
        with MODEL_CACHE["lock"]:
            if MODEL_CACHE["llm"] is not None:
                idle_time = time.time() - MODEL_CACHE["last_used_time"]
                if idle_time >= MODEL_KEEP_ALIVE_SECONDS:
                    logger.info(f"{MODEL_KEEP_ALIVE_SECONDS}초 동안 사용되지 않아 모델을 해제합니다.")
                    del MODEL_CACHE["llm"]
                    MODEL_CACHE["llm"] = None
                    logger.debug("모델 객체 해제 완료 (자동).")

# 자동 모델 해제 스레드 시작
model_release_thread = threading.Thread(target=release_model_if_unused, daemon=True)
model_release_thread.start()
# --- 모델 캐싱 및 자동 해제 로직 끝 ---

@app.route("/summarize", methods=["POST"])
def summarize_email():
    data = request.json
    email_html_content = data.get("email_text", "") # 변수명을 email_html_content로 변경하여 HTML임을 명시
    t_start = time.perf_counter()
    logger.info(f"요약 요청 수신 - 이메일 앞부분 (HTML): {email_html_content[:100]}...")

    # --- HTML 파싱하여 텍스트 추출 ---
    try:
        soup = BeautifulSoup(email_html_content, "html.parser")
        email_text = soup.get_text(separator=" ", strip=True) # 텍스트 추출, 공백으로 단어 구분, 양쪽 공백 제거
        logger.info(f"HTML 파싱 후 텍스트 앞부분: {email_text[:100]}...")
    except Exception as e:
        logger.error(f"HTML 파싱 중 오류 발생: {e}", exc_info=True)
        email_text = email_html_content 


    # --- 이메일 텍스트 길이 제한 ---
    MAX_EMAIL_CHARS = 2500
    if len(email_text) > MAX_EMAIL_CHARS:
        logger.warning(f"추출된 텍스트가 너무 길어 {MAX_EMAIL_CHARS}자로 자릅니다. 원본 길이: {len(email_text)}")
        email_text = email_text[:MAX_EMAIL_CHARS]
    # --- 이메일 텍스트 길이 제한 끝 ---


    try:
        with MODEL_CACHE["lock"]: # 모델 가져오기 및 사용 전체를 락으로 보호
            llm = get_model()
            if llm is None: 
                logger.error("모델을 현재 사용할 수 없습니다. 잠시 후 다시 시도해주세요.")
                return jsonify({"error": "모델을 현재 사용할 수 없습니다. 잠시 후 다시 시도해주세요."}), 503

            weekday_map = ["월", "화", "수", "목", "금", "토", "일"]
            current_weekday = time.localtime().tm_wday
            weekday_kr = weekday_map[current_weekday]

            today_str = f"{time.localtime().tm_year}-{time.localtime().tm_mon:02d}-{time.localtime().tm_mday:02d}({weekday_kr})"
            messages = [
                {
                    "role": "system",
                    "content": (
                        "이메일 요약 전문가이자 일정/할일 추출자. "
                        "절대 배열이나 불필요한 문장 없이, 정확히 JSON을 반환하세요: "
                        "scheduled_at에는 괄호나 추가 설명 없이 YYYY-MM-DD(요일) 형태로만 작성하며 내일 회의일 경우 D+1 그리고 다음 주 라고 작성되어 있을 경우 요일을 계산하여 작성함, "
                        "task도 단일 문자열(최대 10글자)만 작성하세요. "
                        "Key값은 영어로 작성하고, 엔터나 백틱 등은 절대 포함하지 마세요."
                    )
                },
                {
                    "role": "system",
                    "content": (
                        "Few-shot 예시:\n"
                        "오늘 날짜 : 2025-05-15(목)\n"
                        "이메일: '안녕하세요. 내일 회의가 있습니다.'\n"
                        '응답: {"summary":"내일 회의 안내","scheduled_at":"2025-05-16(금)","task":"회의"}'
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
                    "scheduled_at": {"type": "string"},
                    "task":     {"type": "string"}
                },
                "required": ["summary", "scheduled_at", "task"],
                "additionalProperties": False
            }


            response = llm.create_chat_completion(
                messages=messages,
                max_tokens=512,
                temperature=0.0,
                top_p=0.8,
                repeat_penalty=1.2,
                response_format={
                    "type": "json_object",
                    "schema": JSON_SCHEMA,
                }
            )
            
            content = response["choices"][0]["message"]["content"].strip()
            print("응답 형식 : ",content)
            print("===========================")
            parsed = json.loads(content)

            # 모델 응답을 JSON으로 파싱
            summary = parsed.get("summary", "")
            scheduled_at = parsed.get("scheduled_at", None)
            task = parsed.get("task", None)

            if task is not None and task.strip() in UNWANTED_TASKS:
                logger.info(f"요청된 작업이 원하지 않는 작업 목록에 포함되어 있습니다: {task}")
                scheduled_at = None
                task = None
            
            if (scheduled_at is not None):
                scheduled_at = parse_scheduled_at(scheduled_at)


    except Exception as e:
        logger.error(f"요약 처리 중 오류 발생: {e}", exc_info=True)
        return jsonify({"error": "요약 처리 중 오류가 발생했습니다."}), 500

    t_end = time.perf_counter()
    logger.info(f"요약 요청 처리 완료. 소요 시간: {t_end - t_start:.2f}초")

    return jsonify({"summary": summary, "scheduled_at": scheduled_at, "task": task})

def parse_scheduled_at(scheduled_at_str):
    if scheduled_at_str is None:
        return None
    idx = scheduled_at_str.find('(')
    if idx != -1:
        date_str = scheduled_at_str[:idx]
    else:
        date_str = scheduled_at_str
    date_str = date_str.strip()
    # 밀리초 포함, Z(UTC) 붙이기
    return f"{date_str}T00:00:00.000Z"

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=False)