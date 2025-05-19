from flask import Flask, request, jsonify
import sys
import os
import time
import logging
import threading
import psutil
import json
from bs4 import BeautifulSoup
from openai import OpenAI

# --- 로거 설정 ---
logging.basicConfig(level=logging.INFO,
                    format='%(asctime)s - %(levelname)s - %(message)s',
                    handlers=[logging.StreamHandler(sys.stdout)])
logger = logging.getLogger(__name__)

# --- 데이터 파일 경로를 위한 함수 ---


def resource_path(relative_path):
    try:
        base_path = sys._MEIPASS
    except Exception:
        base_path = os.path.abspath(".")
    return os.path.join(base_path, relative_path)


UNWANTED_TASKS = {"알림", "테스트", "Imap 테스트", "알 수 없음",
                  "공지", "Notifications", "Test", "test", "테스트", "TEST"}

app = Flask(__name__)

# OpenAI API 키 환경변수 등에서 로드 (꼭 실제로 넣어야 함)
client = OpenAI(api_key="HI",
                base_url="https://gms.p.ssafy.io/gmsapi/api.openai.com/v1"
                )

# --- 리소스 모니터링 함수 ---


def log_resource_usage():
    proc = psutil.Process(os.getpid())
    while True:
        try:
            mem_info = proc.memory_info()
            mem_rss_mb = mem_info.rss / (1024 ** 2)
            cpu_percent = proc.cpu_percent(interval=1.0)
            logger.info(
                f"[MONITOR] 메모리: {mem_rss_mb:.1f}MB | CPU: {cpu_percent:.1f}%")
        except psutil.NoSuchProcess:
            logger.warning("[MONITOR] 프로세스를 찾을 수 없어 리소스 모니터링을 중단합니다.")
            break
        except Exception as e:
            logger.error(f"[MONITOR] 리소스 모니터링 중 오류 발생: {e}", exc_info=True)
        time.sleep(4)


resource_monitor_thread = threading.Thread(
    target=log_resource_usage, daemon=True)
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
        email_text = email_html_content

    MAX_EMAIL_CHARS = 2500
    if len(email_text) > MAX_EMAIL_CHARS:
        logger.warning(
            f"추출된 텍스트가 너무 길어 {MAX_EMAIL_CHARS}자로 자릅니다. 원본 길이: {len(email_text)}")
        email_text = email_text[:MAX_EMAIL_CHARS]

    try:
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
                    "task도 단일 문자열(최대 8글자)만 작성하세요. "
                    "Key값은 영어로 작성하고, 엔터나 백틱 등은 절대 포함하지 마세요."
                    "만약 'task' 또는 'scheduled_at' 중 하나라도 null이면, 둘 다 반드시 null이어야 합니다."
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
                    f"\n\n아래 이메일을 최대 한 줄로 요약하고, 일정과 할 일을 JSON으로 반환하세요.\n\n{email_text}"
                    f'오늘 날짜 : {today_str}\n\n'
                    '{"summary":"<single-line string>",'
                    '"scheduled_at":"<YYYY-MM-DD(요일) 또는 None>",'
                    '"task":"<8글자 이내 한 줄 문자열 또는 None>"}. '
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

        # OpenAI API 호출로 교체 (gpt-4o 등 원하는 모델로)
        response = client.chat.completions.create(
            model="gpt-4.1",
            messages=messages,
            max_tokens=1024,
            temperature=0.0,
            top_p=0.8,
            tools=[{
                "type": "function",
                "function": {
                    "name": "extract_email_summary",
                    "description": "이메일 요약, 일정, 할일 정보를 반환합니다.",
                    "parameters": JSON_SCHEMA
                }
            }],
            tool_choice={"type": "function", "function": {
                "name": "extract_email_summary"}}
        )

        tool_call = response.choices[0].message.tool_calls[0]
        result_json = tool_call.function.arguments  # dict
        parsed = json.loads(result_json)
        print(parsed)

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
    return f"{date_str}T00:00:00.000Z"


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=False)
