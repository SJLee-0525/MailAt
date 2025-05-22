import os
import sys
import subprocess
import site

# --- 전역 변수 ---
# 스크립트가 위치한 디렉토리를 기준으로 경로 설정
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
SERVER_PY_PATH = os.path.join(BASE_DIR, 'server_hybrid.py')
MODELS_DIR_PATH = os.path.join(BASE_DIR, 'models')
APP_NAME = 'EmailSummaryServer' # 빌드될 애플리케이션 이름 (spec 파일과 동일하게)

def check_prerequisites():
    """필수 파일 및 폴더 존재 여부, GGUF 파일 존재 여부를 확인합니다."""
    if not os.path.isfile(SERVER_PY_PATH):
        print(f"오류: '{SERVER_PY_PATH}' 파일이 존재하지 않습니다.")
        return False

    if not os.path.isdir(MODELS_DIR_PATH):
        print(f"오류: '{MODELS_DIR_PATH}' 폴더가 존재하지 않습니다.")
        return False

    gguf_files = [f for f in os.listdir(MODELS_DIR_PATH) if f.lower().endswith('.gguf')]
    if not gguf_files:
        print(f"오류: '{MODELS_DIR_PATH}' 폴더 내에 GGUF 파일이 존재하지 않습니다.")
        return False
    
    print("필수 파일 및 폴더 확인 완료.")
    return True

def get_llama_cpp_lib_path_tuple():
    """
    llama_cpp 라이브러리의 lib 폴더 경로를 찾아 PyInstaller의 datas 형식 튜플로 반환합니다.
    반환 형식: ('<source_path>', '<destination_in_bundle>') 또는 None
    """
    try:
        import llama_cpp
        # llama_cpp 패키지가 설치된 기본 위치를 찾습니다.
        package_location = os.path.dirname(llama_cpp.__file__)
        # 번들 내에서 라이브러리가 위치할 상대 경로입니다.
        destination_in_bundle = os.path.join('llama_cpp', 'lib')

        # 가능성 1: <site-packages>/llama_cpp/lib
        lib_path_candidate = os.path.join(package_location, 'lib')
        if os.path.isdir(lib_path_candidate) and any(f.endswith(('.dll', '. so', '.dylib')) for f in os.listdir(lib_path_candidate)):
            print(f"llama_cpp lib 발견 위치: {lib_path_candidate}")
            return (lib_path_candidate, destination_in_bundle)

        # 가능성 2: site.getsitepackages()를 통해 다른 site-packages 경로 탐색
        for sp_path in site.getsitepackages():
            potential_lib_path = os.path.join(sp_path, 'llama_cpp', 'lib')
            if os.path.isdir(potential_lib_path) and any(f.endswith(('.dll', '.so', '.dylib')) for f in os.listdir(potential_lib_path)):
                print(f"site.getsitepackages()를 통해 llama_cpp lib 발견 위치: {potential_lib_path}")
                return (potential_lib_path, destination_in_bundle)
        
        print("경고: llama_cpp/lib 디렉터리를 자동으로 찾지 못했습니다.")
        print("        llama.cpp 관련 기능이 필요하다면 빌드 후 문제가 발생할 수 있습니다.")
        return None

    except ImportError:
        print("오류: llama_cpp 모듈을 찾을 수 없습니다. 'pip install llama-cpp-python' 등으로 설치해주세요.")
        return None
    except Exception as e:
        print(f"llama_cpp lib 경로를 찾는 중 오류 발생: {e}")
        return None

def create_and_run_spec_file():
    """
    동적으로 .spec 파일 내용을 생성하고 PyInstaller를 실행합니다.
    """
    print("PyInstaller 빌드를 시작합니다 (동적 spec 파일 생성 기반)...")

    # datas 리스트 동적 구성
    # 1. models 폴더 (절대 경로 사용)
    #    PyInstaller datas 형식: (source, destination_in_bundle)
    datas_list_for_spec = []
    # 경로 문자열 내 백슬래시 이스케이프 처리
    escaped_models_dir_path = MODELS_DIR_PATH.replace('\\', '\\\\')
    datas_list_for_spec.append(f"(r'{escaped_models_dir_path}', 'models')")
    
    # 2. .env 파일 추가
    env_file_path = os.path.join(BASE_DIR, '.env')
    if os.path.isfile(env_file_path):
        escaped_env_file_path = env_file_path.replace('\\', '\\\\')
        # .env 파일을 실행 파일과 동일한 디렉토리('.')에 위치시킴
        datas_list_for_spec.append(f"(r'{escaped_env_file_path}', '.')") 
        print(f".env 파일 추가: {env_file_path} -> (실행파일과 동일한 위치)")
    else:
        print("경고: .env 파일이 존재하지 않아 빌드에 포함되지 않습니다.")

    # 3. llama_cpp/lib 경로 (동적으로 찾은 경로 사용)
    llama_lib_data_tuple = get_llama_cpp_lib_path_tuple()
    
    if llama_lib_data_tuple:
        # 경로 문자열 내 백슬래시 이스케이프 처리
        src_path_escaped = llama_lib_data_tuple[0].replace('\\', '\\\\')
        dest_path_escaped = llama_lib_data_tuple[1].replace('\\', '\\\\')
        datas_list_for_spec.append(f"(r'{src_path_escaped}', r'{dest_path_escaped}')")
    else:
        # llama_cpp/lib를 찾지 못한 경우, spec 파일의 원래 경로를 시도해볼 수 있으나,
        # 여기서는 경고만 출력하고 포함하지 않음. 필요시 하드코딩된 경로 추가 가능.
        # 예: # datas_list_for_spec.append("('C:\\\\Users\\\\SSAFY\\\\anaconda3\\\\envs\\\\email\\\\Lib\\\\site-packages\\\\llama_cpp\\\\lib', 'llama_cpp\\\\lib')")
        print("경고: llama_cpp/lib 경로가 datas에 추가되지 않았습니다.")

    # spec 파일 내용 구성 (기존 spec 파일 기반)
    # 경로 문자열 내 백슬래시 이스케이프 처리
    base_dir_escaped = BASE_DIR.replace('\\', '\\\\')
    server_py_abs_path_escaped = SERVER_PY_PATH.replace('\\', '\\\\')

    # datas 리스트를 문자열로 변환
    datas_spec_str = ",\n        ".join(datas_list_for_spec)
    
    # 임시 spec 파일 내용
    # 원본 spec 파일의 설정을 최대한 유지합니다.
    # hookspath=[]는 원본 spec을 따르며, 필요시 PyInstaller.utils.hooks.get_hook_dirs()로 대체 가능
    spec_content = f"""# -*- mode: python ; coding: utf-8 -*-
# 자동 생성된 임시 spec 파일입니다.

import os

# Analysis 설정
a = Analysis(
    [r'{server_py_abs_path_escaped}'],
    pathex=[r'{base_dir_escaped}'],
    binaries=[], # 원본 spec 파일 설정
    datas=[
        {datas_spec_str}
    ],
    hiddenimports=[], # 원본 spec 파일 설정
    hookspath=[], # 원본 spec 파일 설정 (필요시 get_hook_dirs() 사용)
    hooksconfig={{}}, # 원본 spec 파일 설정
    runtime_hooks=[], # 원본 spec 파일 설정
    excludes=[], # 원본 spec 파일 설정
    noarchive=False, # 원본 spec 파일 설정
    optimize=0, # 원본 spec 파일 설정
)

# PYZ 설정
pyz = PYZ(a.pure)

# EXE 설정
exe = EXE(
    pyz,
    a.scripts,
    [], # binaries는 EXE에서 제외하고 COLLECT에서 처리 (exclude_binaries=True)
    exclude_binaries=True, # 원본 spec 파일 설정
    name='{APP_NAME}',
    debug=False, # 원본 spec 파일 설정
    bootloader_ignore_signals=False, # 원본 spec 파일 설정
    strip=False, # 원본 spec 파일 설정
    upx=True, # 원본 spec 파일 설정
    console=True, # 원본 spec 파일 설정
    disable_windowed_traceback=False, # 원본 spec 파일 설정
    argv_emulation=False, # 원본 spec 파일 설정
    target_arch=None, # 원본 spec 파일 설정
    codesign_identity=None, # 원본 spec 파일 설정
    entitlements_file=None, # 원본 spec 파일 설정
)

# COLLECT 설정
coll = COLLECT(
    exe,
    a.binaries, # Analysis에서 수집된 바이너리
    a.datas,    # Analysis에서 처리된 데이터 파일
    strip=False, # 원본 spec 파일 설정
    upx=True,    # 원본 spec 파일 설정
    upx_exclude=[], # 원본 spec 파일 설정
    name='{APP_NAME}',
)
"""
    temp_spec_filename = f"temp_{APP_NAME}.spec"
    temp_spec_filepath = os.path.join(BASE_DIR, temp_spec_filename)

    try:
        with open(temp_spec_filepath, 'w', encoding='utf-8') as f:
            f.write(spec_content)
        print(f"임시 spec 파일 생성: {temp_spec_filepath}")

        # 생성된 spec 파일로 PyInstaller 실행
        cmd = ['pyinstaller', '--noconfirm', temp_spec_filepath]
        print(f"PyInstaller 실행: {' '.join(cmd)}")
        
        # PyInstaller를 현재 디렉토리(BASE_DIR)에서 실행
        process = subprocess.Popen(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, cwd=BASE_DIR, universal_newlines=True)
        stdout, stderr = process.communicate()

        if process.returncode == 0:
            print("PyInstaller 빌드가 성공적으로 완료되었습니다.")
            print(f"결과물은 '{os.path.join(BASE_DIR, 'dist', APP_NAME)}' 폴더에 있습니다.")
            # print("STDOUT:")
            # print(stdout)
        else:
            print("PyInstaller 빌드 중 오류가 발생했습니다.")
            print("STDOUT:")
            print(stdout)
            print("STDERR:")
            print(stderr)
            return False
        return True

    except FileNotFoundError:
        print("오류: PyInstaller가 설치되어 있지 않거나 PATH에 없습니다.")
        print("      'pip install pyinstaller' 명령으로 설치해주세요.")
        return False
    except Exception as e:
        print(f"빌드 스크립트 실행 중 오류 발생: {e}")
        return False
    finally:
        # 임시 spec 파일 삭제
        if os.path.exists(temp_spec_filepath):
            try:
                os.remove(temp_spec_filepath)
                print(f"임시 spec 파일 삭제: {temp_spec_filepath}")
            except OSError as e:
                print(f"임시 spec 파일 삭제 실패: {e}")

if __name__ == "__main__":
    if not check_prerequisites():
        print("사전 요구 사항을 만족하지 못해 빌드를 중단합니다.")
        sys.exit(1)
    
    # .env 파일 존재 여부 추가 확인 (선택 사항, 빌드 스크립트 사용자에게 명시적 알림)
    env_file_path_check = os.path.join(BASE_DIR, '.env')
    if not os.path.isfile(env_file_path_check):
        print("--------------------------------------------------------------------")
        print("경고: '.env' 파일이 프로젝트 루트에 존재하지 않습니다.")
        print("      OpenAI API 키 등의 환경 변수를 사용한다면, 빌드된 실행 파일이")
        print("      정상적으로 동작하지 않거나 로컬 Gemma 모델로만 작동할 수 있습니다.")
        print("      빌드 후 실행 파일과 동일한 위치에 .env 파일을 수동으로")
        print("      배치하거나, 애플리케이션이 환경 변수를 다른 방식으로")
        print("      읽도록 설정해야 합니다.")
        print("--------------------------------------------------------------------")
        # 필요하다면 여기서 빌드를 중단할 수도 있습니다.
        # user_choice = input(".env 파일 없이 빌드를 계속하시겠습니까? (y/n): ")
        # if user_choice.lower() != 'y':
        #     print("빌드를 중단합니다.")
        #     sys.exit(1)

    if not create_and_run_spec_file():
        print("빌드에 실패했습니다.")
        sys.exit(1)
    
    print("빌드 스크립트가 성공적으로 완료되었습니다.")