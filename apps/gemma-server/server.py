from flask import Flask, request, jsonify
from llama_cpp import Llama
import sys
import os
import time
import logging
import threading
import psutil # psutil 모듈 추가

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

app = Flask(__name__)

# GGUF_PATH 설정
GGUF_MODEL_FILENAME = "gemma-3-4b-it-Q2_K.gguf"
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
    "lock": threading.Lock() # 모델 접근 및 수정을 위한 락
}
MODEL_KEEP_ALIVE_SECONDS = 60 # 모델을 메모리에 유지할 시간 (초)

def get_model():
    with MODEL_CACHE["lock"]:
        if MODEL_CACHE["llm"] is None:
            logger.info("모델을 새로 로드합니다.")
            MODEL_CACHE["llm"] = Llama(
                model_path=GGUF_PATH,
                chat_format="gemma",
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
    email_text = data.get("email_text", "")
    t_start = time.perf_counter()
    logger.info(f"요약 요청 수신 - 이메일 앞부분: {email_text[:50]}...")

    llm = get_model() # 캐시 또는 새로 로드된 모델 가져오기

    try:
        messages = [
            {"role": "system", "content": "이메일 요약 전문가."},
            {"role": "user", "content": f"아래 이메일을 한줄로 요약: {email_text}"}
        ]

        response = llm.create_chat_completion(
            messages,
            max_tokens=256,
            temperature=0.3,
            top_p=0.9,
            repeat_penalty=1.5,
        )
        summary = response["choices"][0]["message"]["content"].strip()
        logger.debug("요약 생성 완료.")

        # 모델 사용 시간 갱신 (get_model에서 이미 처리됨)
        with MODEL_CACHE["lock"]:
            MODEL_CACHE["last_used_time"] = time.time()


    except Exception as e:
        logger.error(f"요약 처리 중 오류 발생: {e}", exc_info=True)
        # 오류 발생 시에도 모델 사용 시간을 갱신하여 바로 해제되지 않도록 할 수 있으나,
        # 여기서는 오류 시에는 갱신하지 않아 다음 체크 때 해제될 수 있도록 함.
        return jsonify({"error": "요약 처리 중 오류가 발생했습니다."}), 500
    # finally 블록에서 del llm 제거 (자동 해제 로직이 담당)

    t_end = time.perf_counter()
    logger.info(f"요약 요청 처리 완료. 소요 시간: {t_end - t_start:.2f}초")

    return jsonify({"summary": summary})

if __name__ == "__main__":
    # 프로덕션 환경에서는 Flask 자체의 debug 모드를 False로 설정하는 것이 일반적입니다.
    # Gunicorn, uWSGI 등의 WSGI 서버를 사용하는 것이 권장됩니다.
    # 여기서는 간단하게 debug=False로 설정합니다.
    # Flask의 기본 로거 외에 위에서 설정한 로거가 사용됩니다.
    app.run(host="0.0.0.0", port=5000, debug=False)