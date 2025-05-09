param (
    [string]$BuildType = "Release",
    [string]$Toolchain = "C:/vcpkg/scripts/buildsystems/vcpkg.cmake"
)

# 인코딩 문제 방지 (콘솔 한글 깨짐 방지)
$OutputEncoding = [System.Text.Encoding]::UTF8

if (Test-Path -Path "./build") {
    Remove-Item -Recurse -Force ./build
    Write-Host "기존 build 폴더 삭제 완료"
}

New-Item -ItemType Directory -Path ./build | Out-Null
Set-Location ./build
Write-Host "build 디렉토리 생성 및 진입"

# 변수 확장된 인자 사용
Write-Host "CMake 설정 중..."
cmake .. "-DCMAKE_TOOLCHAIN_FILE=$Toolchain"
if ($LASTEXITCODE -ne 0) {
    Write-Error "CMake 설정 실패"
    exit 1
}

Write-Host "빌드 시작 ($BuildType 모드)..."
cmake --build . --config $BuildType
if ($LASTEXITCODE -ne 0) {
    Write-Error "빌드 실패"
    exit 1
}

Write-Host "빌드 성공!"
