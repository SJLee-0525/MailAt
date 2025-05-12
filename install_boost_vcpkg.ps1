# ===============================
# Boost & vcpkg 자동 설치 스크립트
# ===============================

trap {
    Write-Error "`n❌ 오류 발생: $_"
    exit 1
}

# 관리자 권한 확인 및 자동 재시작
$isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole] "Administrator")
if (-not $isAdmin) {
    Write-Host "🔒 관리자 권한이 필요합니다. 스크립트를 다시 실행합니다..."
    Start-Process powershell.exe "-ExecutionPolicy Bypass -File `"$PSCommandPath`"" -Verb RunAs
    exit
}

# UTF-8 인코딩 설정 + 코드페이지 변경
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
chcp 65001 > $null

# 경로 설정
$startDir = Get-Location
$boostZip = Join-Path $startDir "boost_1_88_0.zip"
$vcpkgZip = Join-Path $startDir "vcpkg.zip"
$boostDir = "C:\boost_1_88_0"
$vcpkgDir = "C:\vcpkg"

# Visual Studio 설치 여부 확인
Write-Host "`n[0/9] Visual Studio 설치 여부 확인 중..."
$vswherePath = "${env:ProgramFiles(x86)}\Microsoft Visual Studio\Installer\vswhere.exe"
if (-Not (Test-Path $vswherePath)) {
    Write-Warning "⚠️ Visual Studio Installer가 설치되어 있지 않습니다. 수동 설치 필요."
} else {
    $vsInstallPath = & $vswherePath -latest -products * -requires Microsoft.Component.MSBuild -property installationPath
    if ($vsInstallPath) {
        Write-Host "✅ Visual Studio 설치 경로: $vsInstallPath"
    } else {
        Write-Warning "⚠️ Visual Studio가 감지되지 않았습니다."
    }
}

# Boost 압축 해제
if (Test-Path $boostDir) {
    Write-Host "[1/9] ⏭️ Boost 디렉토리 이미 존재: $boostDir (압축 해제 생략)"
} else {
    Write-Host "[1/9] Boost 압축 해제 중..."
    Expand-Archive -Path $boostZip -DestinationPath "C:\" -Force
}

# Boost 디렉토리 이동
Set-Location -Path $boostDir
Write-Host "[2/9] Boost 디렉토리 진입 완료"

# Boost bootstrap 실행
Write-Host "[3/9] Boost bootstrap 실행 중..."
if (-Not (Test-Path ".\bootstrap.bat")) {
    Write-Error "❌ bootstrap.bat 파일이 존재하지 않습니다"
    exit 1
}
Start-Process ".\bootstrap.bat" -Wait

# Boost b2 빌드 실행
Write-Host "[4/9] Boost b2 static 빌드 실행 중..."
if (-Not (Test-Path ".\b2.exe")) {
    Write-Error "❌ b2.exe 파일이 존재하지 않습니다"
    exit 1
}
Start-Process ".\b2.exe" -ArgumentList "--with-regex", "--with-system", "toolset=msvc-14.3", "architecture=x86", "address-model=64", "link=static", "runtime-link=static", "stage" -Wait

# 디렉토리 복귀
Set-Location -Path $startDir
Write-Host "[5/9] 시작 디렉토리 복귀: $startDir"

# vcpkg 압축 해제
if (Test-Path $vcpkgDir) {
    Write-Host "[6/9] ⏭️ vcpkg 디렉토리 이미 존재: $vcpkgDir (압축 해제 생략)"
} else {
    Write-Host "[6/9] vcpkg 압축 해제 중..."
    Expand-Archive -Path $vcpkgZip -DestinationPath "C:\" -Force
}

# vcpkg 디렉토리 진입
Set-Location -Path $vcpkgDir
Write-Host "[7/9] vcpkg 디렉토리 진입 완료"

# vcpkg bootstrap 실행
Write-Host "[8/9] vcpkg bootstrap 실행 중..."
if (-Not (Test-Path ".\bootstrap-vcpkg.bat")) {
    Write-Error "❌ bootstrap-vcpkg.bat 파일이 존재하지 않습니다"
    exit 1
}
Start-Process ".\bootstrap-vcpkg.bat" -Wait

# openssl 설치
Write-Host "[9/9] vcpkg로 openssl:x64-windows-static 설치 중..."
if (-Not (Test-Path ".\vcpkg.exe")) {
    Write-Error "❌ vcpkg.exe가 존재하지 않습니다. bootstrap 단계가 실패했을 수 있습니다."
    exit 1
}
Start-Process ".\vcpkg.exe" -ArgumentList "install", "openssl:x64-windows-static" -Wait

# 종료 메시지
Set-Location -Path $startDir
Write-Host "`n🎯 전체 설치 작업이 성공적으로 완료되었습니다!" -ForegroundColor Cyan
exit 0
