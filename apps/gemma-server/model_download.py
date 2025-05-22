from llama_cpp import Llama

llm = Llama.from_pretrained(
    repo_id="google/gemma-3-4b-it-qat-q4_0-gguf",
    filename="gemma-3-4b-it-q4_0.gguf",
    # repo_id="tensorblock/gemma-3-4b-it-GGUF",
    # filename="gemma-3-4b-it-Q2_K.gguf",
    chat_format="gemma",
    local_dir="./models",
    local_dir_use_symlinks=False,
    n_gpu_layers=0        # -1: 가능한 모든 레이어를 GPU, 0: CPU
)
print("✔ 모델 캐시 완료:", llm.model_path)
