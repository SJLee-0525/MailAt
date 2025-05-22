# Mailat 포팅메뉴얼
---

## Mailat Client

1.  **사전 준비 사항**:
    *   **Node.js**: Electron `29.4.6` 버전과 호환되는 Node.js 버전을 설치해야 합니다. 일반적으로 Node.js 18.x 또는 20.x 버전이 권장됩니다.
    *   **Python**: Python 3.10 버전을 설치하고 시스템 PATH에 추가하십시오. 이는 네이티브 C++ 애드온을 빌드하는 데 필요한 [`node-gyp`](apps/electron-client/preload.cjs )에서 사용됩니다.
    *   **C++ 빌드 도구**:
        *   Windows 환경에서는 Visual Studio 2022 (Community, Professional, 또는 Enterprise 에디션) 또는 Visual Studio Build Tools 2022가 필요합니다.
        *   설치 시 "C++ 데스크톱 개발" 워크로드를 반드시 포함해야 합니다.
        *   또한, Windows 10 SDK (또는 프로젝트에서 요구하는 특정 버전의 SDK)가 설치되어 있는지 확인하십시오. Visual Studio Installer를 통해 개별 구성 요소로 선택하여 설치할 수 있습니다.
        *   이는 프로젝트의 [`.npmrc`](.npmrc ) 파일에 `msvs_version=2022`로 명시되어 있기 때문입니다.
    *   **vcpkg 및 Boost 라이브러리**:
        *   프로젝트 루트 디렉터리에 있는 [`install_boost_vcpkg.ps1`](install_boost_vcpkg.ps1 ) 스크립트는 vcpkg를 설치하고 이를 통해 Boost 라이브러리를 설치하는 과정을 자동화합니다.
        *   PowerShell을 관리자 권한으로 실행한 후, 프로젝트 루트 디렉터리로 이동하여 다음 명령어를 실행하여 스크립트를 실행하십시오.
            ```powershell
            # filepath: c:\S12P31A204\install_boost_vcpkg.ps1
            .\install_boost_vcpkg.ps1
            ```
        *   이 스크립트는 일반적으로 다음 단계를 수행합니다:
            1.  vcpkg 리포지토리를 클론하거나 지정된 위치에 다운로드합니다.
            2.  vcpkg를 부트스트랩(bootstrap)합니다.
            3.  vcpkg를 사용하여 Boost 라이브러리 (예: `boost-asio`, `boost-beast` 등 스크립트에 명시된 패키지)를 설치합니다.
        *   스크립트 실행 중 오류가 발생하면 출력 메시지를 확인하여 문제를 해결하십시오. vcpkg 설치 위치나 Boost 설치 경로 등이 환경 변수나 `node-gyp` 설정에 올바르게 반영되어야 할 수 있습니다.

2.  **Electron 버전 정보**:
    *   이 프로젝트는 Electron `29.4.6` 버전을 대상으로 합니다. 이 정보는 [`.npmrc`](.npmrc ) 파일의 `target` 필드에서 확인할 수 있습니다.

3.  **의존성 설치**:
    *   먼저, 터미널을 열고 [`apps/electron-client`](apps/electron-client ) 디렉토리로 이동합니다.
        ```sh
        cd apps/electron-client
        ```
    *   그런 다음, 다음 명령어를 사용하여 프로젝트 의존성을 설치합니다. 사용자가 언급한 `--legacy-peer-deps` 플래그는 이전 버전과의 호환성 문제를 해결하는 데 도움이 될 수 있습니다. 이 과정에서 [`.npmrc`](.npmrc ) 파일의 설정값(`runtime`, `target`, `target_arch`, `disturl`)을 참조하여 [`node-gyp`](apps/electron-client/preload.cjs )이 네이티브 C++ 애드온(apps/electron-client/src/main/utils/mailio_addon.node)을 Electron 버전에 맞게 빌드합니다.
        ```sh
        npm i --legacy-peer-deps
        ```

4.  **애플리케이션 실행**:
    *   의존성 설치 및 네이티브 애드온 빌드가 성공적으로 완료되면, [`apps/electron-client/package.json`](apps/electron-client/package.json ) 파일의 `scripts` 섹션에 정의된 명령어를 통해 Electron 애플리케이션을 실행할 수 있습니다. 일반적으로 다음과 같은 명령어를 사용합니다 (정확한 명령어는 해당 [`package.json`](package.json ) 파일을 확인하십시오):
        ```sh
        npm start
        ```
        또는 개발 모드로 실행하는 경우:
        ```sh
        npm run dev
        ```
    *   이 명령어를 실행하면 [`apps/electron-client/main.js`](apps/electron-client/main.js ) 파일이 Electron 애플리케이션의 메인 프로세스로 실행되어 클라이언트 프로그램 창이 나타납니다.
