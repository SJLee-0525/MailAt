# 커밋, 브랜치 컨벤션

> 추후 파일명 변경 예정

## 브랜치 컨벤션


### 1. 브랜치 유형 지정

- 브랜치 유형은 영어 **소문자**로 작성
    
    
    | 커밋 유형 | 의미 |
    | --- | --- |
    | `feat` | 새로운 기능 개발 |
    | `style` | UI / UX 등 디자인 변경 |
    | `fix` | 에러 해결 |
    | `refactor` | 코드 수정 or 개선 |

### 2. 브랜치 네이밍

- 브랜치 유형 이후 개발할 기능이 잘 전달되는 이름으로 지정
- **언더바 말고 하이픈, 무조건 소문자**
- ex ) `feat/oauth-login`

### 3. 각 브랜치로 이동 후 작업

- `git checkout -b feat/브랜치명`
- ex) `git checkout -b feat/login`


---

##  커밋 메시지 컨벤션

### 1. 커밋 유형 지정

- 커밋 유형은 ***영어 대문자***로 작성하기
    
    
    | 커밋 유형 | 의미 |
    | --- | --- |
    | `Feat` | 새로운 기능 추가 |
    | `Fix` | 버그 수정 |
    | `Test` | 테스트 코드, 리팩토링 테스트 코드 추가 |
    | `Refactor` | 코드 리팩토링 |
    | `Chore` | 기타 수정 ex) .gitignore |
    | `Rename` | 파일 또는 폴더 명을 수정하거나 옮기는 작업만인 경우 |
    | `Remove` | 파일을 삭제하는 작업만 수행한 경우 |
    | `Docs` | 문서 수정 |
    | `Design` | CSS 등 사용자 UI 디자인 변경 |
    | `!HOTFIX` | 급하게 치명적인 버그를 고쳐야 하는 경우 |

### 2. 제목과 본문을 빈행으로 분리

- 커밋 유형 이후 제목과 본문은 ***한글로 작성***하여 내용이 잘 전달될 수 있도록 할 것
- 본문에는 변경한 내용과 이유 설명 (어떻게보다는 무엇 & 왜를 설명)

### 3. 제목 첫 글자는 대문자로, 끝에는 `.` 금지

### 4. 제목은 영문 기준 50자 이내로 할 것

### 5. 커밋 메세지 마지막에 Jira 이슈 번호 남기기 !!

```jsx
ex)
Feat: 회원가입 유효성 검사 구현
- (본문 내용)
- (본문 내용)
S12P31A204-105
```

```
S12P31A204
├─ .npmrc
├─ apps
│  ├─ electron-client
│  │  ├─ .env
│  │  ├─ addon
│  │  │  ├─ addon.cpp
│  │  │  ├─ base64_wrapper.cpp
│  │  │  ├─ base64_wrapper.hpp
│  │  │  ├─ binding.gyp
│  │  │  ├─ build
│  │  │  │  ├─ ALL_BUILD.vcxproj
│  │  │  │  ├─ ALL_BUILD.vcxproj.filters
│  │  │  │  ├─ CMakeCache.txt
│  │  │  │  ├─ CMakeFiles
│  │  │  │  │  ├─ 4.0.1
│  │  │  │  │  │  ├─ CMakeCCompiler.cmake
│  │  │  │  │  │  ├─ CMakeCXXCompiler.cmake
│  │  │  │  │  │  ├─ CMakeDetermineCompilerABI_C.bin
│  │  │  │  │  │  ├─ CMakeDetermineCompilerABI_CXX.bin
│  │  │  │  │  │  ├─ CMakeRCCompiler.cmake
│  │  │  │  │  │  ├─ CMakeSystem.cmake
│  │  │  │  │  │  ├─ CompilerIdC
│  │  │  │  │  │  │  ├─ CMakeCCompilerId.c
│  │  │  │  │  │  │  ├─ CompilerIdC.exe
│  │  │  │  │  │  │  ├─ CompilerIdC.vcxproj
│  │  │  │  │  │  │  └─ Debug
│  │  │  │  │  │  │     ├─ CMakeCCompilerId.obj
│  │  │  │  │  │  │     ├─ CompilerIdC.exe.recipe
│  │  │  │  │  │  │     └─ CompilerIdC.tlog
│  │  │  │  │  │  │        ├─ CL.command.1.tlog
│  │  │  │  │  │  │        ├─ Cl.items.tlog
│  │  │  │  │  │  │        ├─ CL.read.1.tlog
│  │  │  │  │  │  │        ├─ CL.write.1.tlog
│  │  │  │  │  │  │        ├─ CompilerIdC.lastbuildstate
│  │  │  │  │  │  │        ├─ link.command.1.tlog
│  │  │  │  │  │  │        ├─ link.read.1.tlog
│  │  │  │  │  │  │        ├─ link.secondary.1.tlog
│  │  │  │  │  │  │        └─ link.write.1.tlog
│  │  │  │  │  │  ├─ CompilerIdCXX
│  │  │  │  │  │  │  ├─ CMakeCXXCompilerId.cpp
│  │  │  │  │  │  │  ├─ CompilerIdCXX.exe
│  │  │  │  │  │  │  ├─ CompilerIdCXX.vcxproj
│  │  │  │  │  │  │  └─ Debug
│  │  │  │  │  │  │     ├─ CMakeCXXCompilerId.obj
│  │  │  │  │  │  │     ├─ CompilerIdCXX.exe.recipe
│  │  │  │  │  │  │     └─ CompilerIdCXX.tlog
│  │  │  │  │  │  │        ├─ CL.command.1.tlog
│  │  │  │  │  │  │        ├─ Cl.items.tlog
│  │  │  │  │  │  │        ├─ CL.read.1.tlog
│  │  │  │  │  │  │        ├─ CL.write.1.tlog
│  │  │  │  │  │  │        ├─ CompilerIdCXX.lastbuildstate
│  │  │  │  │  │  │        ├─ link.command.1.tlog
│  │  │  │  │  │  │        ├─ link.read.1.tlog
│  │  │  │  │  │  │        ├─ link.secondary.1.tlog
│  │  │  │  │  │  │        └─ link.write.1.tlog
│  │  │  │  │  │  ├─ VCTargetsPath
│  │  │  │  │  │  │  └─ x64
│  │  │  │  │  │  │     └─ Debug
│  │  │  │  │  │  │        ├─ VCTargetsPath.recipe
│  │  │  │  │  │  │        └─ VCTargetsPath.tlog
│  │  │  │  │  │  │           └─ VCTargetsPath.lastbuildstate
│  │  │  │  │  │  ├─ VCTargetsPath.txt
│  │  │  │  │  │  └─ VCTargetsPath.vcxproj
│  │  │  │  │  ├─ 5d9b8cee7edb13b0f5093b51b9acf295
│  │  │  │  │  │  └─ generate.stamp.rule
│  │  │  │  │  ├─ cmake.check_cache
│  │  │  │  │  ├─ CMakeConfigureLog.yaml
│  │  │  │  │  ├─ generate.stamp
│  │  │  │  │  ├─ generate.stamp.depend
│  │  │  │  │  ├─ generate.stamp.list
│  │  │  │  │  ├─ InstallScripts.json
│  │  │  │  │  └─ TargetDirectories.txt
│  │  │  │  ├─ cmake_install.cmake
│  │  │  │  ├─ mailio_addon.dir
│  │  │  │  │  └─ Release
│  │  │  │  │     ├─ addon.obj
│  │  │  │  │     ├─ base64.obj
│  │  │  │  │     ├─ base64_wrapper.obj
│  │  │  │  │     ├─ codec.obj
│  │  │  │  │     ├─ mailio_addon.node.recipe
│  │  │  │  │     └─ mailio_addon.tlog
│  │  │  │  │        ├─ CL.command.1.tlog
│  │  │  │  │        ├─ Cl.items.tlog
│  │  │  │  │        ├─ CL.read.1.tlog
│  │  │  │  │        ├─ CL.write.1.tlog
│  │  │  │  │        ├─ CustomBuild.command.1.tlog
│  │  │  │  │        ├─ CustomBuild.read.1.tlog
│  │  │  │  │        ├─ CustomBuild.write.1.tlog
│  │  │  │  │        ├─ link.command.1.tlog
│  │  │  │  │        ├─ link.read.1.tlog
│  │  │  │  │        ├─ link.secondary.1.tlog
│  │  │  │  │        ├─ link.write.1.tlog
│  │  │  │  │        └─ mailio_addon.lastbuildstate
│  │  │  │  ├─ mailio_addon.sln
│  │  │  │  ├─ mailio_addon.vcxproj
│  │  │  │  ├─ mailio_addon.vcxproj.filters
│  │  │  │  ├─ Release
│  │  │  │  │  ├─ mailio_addon.exp
│  │  │  │  │  ├─ mailio_addon.lib
│  │  │  │  │  └─ mailio_addon.node
│  │  │  │  ├─ x64
│  │  │  │  │  └─ Release
│  │  │  │  │     ├─ ALL_BUILD
│  │  │  │  │     │  ├─ ALL_BUILD.recipe
│  │  │  │  │     │  └─ ALL_BUILD.tlog
│  │  │  │  │     │     ├─ ALL_BUILD.lastbuildstate
│  │  │  │  │     │     ├─ CustomBuild.command.1.tlog
│  │  │  │  │     │     ├─ CustomBuild.read.1.tlog
│  │  │  │  │     │     └─ CustomBuild.write.1.tlog
│  │  │  │  │     └─ ZERO_CHECK
│  │  │  │  │        ├─ ZERO_CHECK.recipe
│  │  │  │  │        └─ ZERO_CHECK.tlog
│  │  │  │  │           ├─ CustomBuild.command.1.tlog
│  │  │  │  │           ├─ CustomBuild.read.1.tlog
│  │  │  │  │           ├─ CustomBuild.write.1.tlog
│  │  │  │  │           └─ ZERO_CHECK.lastbuildstate
│  │  │  │  ├─ ZERO_CHECK.vcxproj
│  │  │  │  └─ ZERO_CHECK.vcxproj.filters
│  │  │  ├─ CMakeLists.txt
│  │  │  └─ node.js
│  │  ├─ addon.cpp
│  │  ├─ binding.gyp
│  │  ├─ build
│  │  │  ├─ addon.vcxproj
│  │  │  ├─ addon.vcxproj.filters
│  │  │  ├─ binding.sln
│  │  │  ├─ config.gypi
│  │  │  └─ Release
│  │  │     ├─ addon.iobj
│  │  │     ├─ addon.ipdb
│  │  │     ├─ addon.node
│  │  │     ├─ addon.pdb
│  │  │     └─ obj
│  │  │        └─ addon
│  │  │           ├─ addon.node.recipe
│  │  │           ├─ addon.obj
│  │  │           ├─ addon.tlog
│  │  │           │  ├─ addon.lastbuildstate
│  │  │           │  ├─ CL.command.1.tlog
│  │  │           │  ├─ Cl.items.tlog
│  │  │           │  ├─ CL.read.1.tlog
│  │  │           │  ├─ CL.write.1.tlog
│  │  │           │  ├─ link.command.1.tlog
│  │  │           │  ├─ link.read.1.tlog
│  │  │           │  ├─ link.secondary.1.tlog
│  │  │           │  └─ link.write.1.tlog
│  │  │           └─ win_delay_load_hook.obj
│  │  ├─ email-client.db
│  │  ├─ index.html
│  │  ├─ mailio
│  │  │  ├─ CMakeLists.txt
│  │  │  ├─ doxygen.conf
│  │  │  ├─ doxygen.conf.in
│  │  │  ├─ include
│  │  │  │  ├─ mailio
│  │  │  │  │  ├─ base64.hpp
│  │  │  │  │  ├─ binary.hpp
│  │  │  │  │  ├─ bit7.hpp
│  │  │  │  │  ├─ bit8.hpp
│  │  │  │  │  ├─ codec.hpp
│  │  │  │  │  ├─ dialog.hpp
│  │  │  │  │  ├─ export.hpp
│  │  │  │  │  ├─ imap.hpp
│  │  │  │  │  ├─ mailboxes.hpp
│  │  │  │  │  ├─ message.hpp
│  │  │  │  │  ├─ mime.hpp
│  │  │  │  │  ├─ percent.hpp
│  │  │  │  │  ├─ pop3.hpp
│  │  │  │  │  ├─ quoted_printable.hpp
│  │  │  │  │  ├─ q_codec.hpp
│  │  │  │  │  └─ smtp.hpp
│  │  │  │  └─ version.hpp.in
│  │  │  ├─ LICENSE
│  │  │  ├─ mailio.pc.in
│  │  │  ├─ README.md
│  │  │  ├─ README_zh.md
│  │  │  └─ src
│  │  │     ├─ base64.cpp
│  │  │     ├─ binary.cpp
│  │  │     ├─ bit7.cpp
│  │  │     ├─ bit8.cpp
│  │  │     ├─ codec.cpp
│  │  │     ├─ dialog.cpp
│  │  │     ├─ imap.cpp
│  │  │     ├─ mailboxes.cpp
│  │  │     ├─ message.cpp
│  │  │     ├─ mime.cpp
│  │  │     ├─ percent.cpp
│  │  │     ├─ pop3.cpp
│  │  │     ├─ quoted_printable.cpp
│  │  │     ├─ q_codec.cpp
│  │  │     └─ smtp.cpp
│  │  ├─ main.js
│  │  ├─ package.json
│  │  ├─ preload.js
│  │  ├─ public
│  │  │  ├─ mockServiceWorker.js
│  │  │  └─ vite.svg
│  │  └─ src
│  │     ├─ .env
│  │     ├─ .eslintrc.cjs
│  │     ├─ .prettierrc
│  │     ├─ controllers
│  │     │  ├─ accountController.js
│  │     │  └─ mailController.js
│  │     ├─ database
│  │     │  └─ db.js
│  │     ├─ eslint.config.js
│  │     ├─ index.html
│  │     ├─ package.json
│  │     ├─ README.md
│  │     ├─ renderer
│  │     │  ├─ apis
│  │     │  │  ├─ instance.ts
│  │     │  │  └─ recordApi.ts
│  │     │  ├─ App.css
│  │     │  ├─ App.tsx
│  │     │  ├─ assets
│  │     │  │  ├─ icons
│  │     │  │  │  ├─ ArrowDownIcon.tsx
│  │     │  │  │  ├─ ArrowUpIcon.tsx
│  │     │  │  │  ├─ CalendarIcon.tsx
│  │     │  │  │  ├─ DeleteIcon.tsx
│  │     │  │  │  ├─ EditIcon.tsx
│  │     │  │  │  ├─ FilterIcon.tsx
│  │     │  │  │  ├─ ForwardIcon.tsx
│  │     │  │  │  ├─ InboxIcon.tsx
│  │     │  │  │  ├─ MenuIcon.tsx
│  │     │  │  │  ├─ NavBarIcon.tsx
│  │     │  │  │  ├─ ReplyIcon.tsx
│  │     │  │  │  ├─ SearchIcon.tsx
│  │     │  │  │  ├─ SettingIcon.tsx
│  │     │  │  │  ├─ StarFillIcon.tsx
│  │     │  │  │  └─ StarIcon.tsx
│  │     │  │  ├─ images
│  │     │  │  │  └─ defaultProfile.png
│  │     │  │  └─ react.svg
│  │     │  ├─ components
│  │     │  │  ├─ common
│  │     │  │  │  ├─ bottomNav
│  │     │  │  │  │  ├─ BottomNav.tsx
│  │     │  │  │  │  ├─ BottomNavButton.tsx
│  │     │  │  │  │  └─ SearchBar.tsx
│  │     │  │  │  ├─ button
│  │     │  │  │  │  ├─ Button.tsx
│  │     │  │  │  │  └─ IconButton.tsx
│  │     │  │  │  ├─ modal
│  │     │  │  │  │  ├─ Modal.css
│  │     │  │  │  │  └─ Modal.tsx
│  │     │  │  │  └─ nav
│  │     │  │  │     └─ SideNav.tsx
│  │     │  │  ├─ detailEmail
│  │     │  │  │  ├─ components
│  │     │  │  │  │  ├─ DetailAttachments.tsx
│  │     │  │  │  │  ├─ DetailEmailContent.tsx
│  │     │  │  │  │  ├─ DetailEmailContents.tsx
│  │     │  │  │  │  ├─ DetailEmailHeader.tsx
│  │     │  │  │  │  ├─ DetailEmailInfo.tsx
│  │     │  │  │  │  └─ DetailEmailTitle.tsx
│  │     │  │  │  └─ DetailEmail.tsx
│  │     │  │  ├─ inbox
│  │     │  │  │  ├─ components
│  │     │  │  │  │  ├─ InboxContent.tsx
│  │     │  │  │  │  ├─ InboxContents.tsx
│  │     │  │  │  │  ├─ InboxFilter.tsx
│  │     │  │  │  │  ├─ InboxFilterForm.tsx
│  │     │  │  │  │  ├─ InboxHeader.tsx
│  │     │  │  │  │  └─ InboxSearchForm.tsx
│  │     │  │  │  └─ Inbox.tsx
│  │     │  │  └─ mailForm
│  │     │  │     ├─ components
│  │     │  │     │  ├─ MailForm.tsx
│  │     │  │     │  ├─ MailFormHeader.tsx
│  │     │  │     │  ├─ MailTextEditor.tsx
│  │     │  │     │  └─ SenderList.tsx
│  │     │  │     ├─ MailCreateForm.tsx
│  │     │  │     ├─ MailReplyForm.tsx
│  │     │  │     └─ NewMailFormModal.tsx
│  │     │  ├─ data
│  │     │  │  └─ EMAIL_CONSERVATIONS.ts
│  │     │  ├─ hooks
│  │     │  │  ├─ useDebounceHook.ts
│  │     │  │  └─ useGetConversations.ts
│  │     │  ├─ index.css
│  │     │  ├─ layouts
│  │     │  │  ├─ HoverZone.tsx
│  │     │  │  ├─ MainLayout.tsx
│  │     │  │  └─ NavZone.tsx
│  │     │  ├─ main.tsx
│  │     │  ├─ mocks
│  │     │  │  ├─ browser.ts
│  │     │  │  ├─ handlers.ts
│  │     │  │  └─ server.ts
│  │     │  ├─ pages
│  │     │  │  └─ home
│  │     │  │     └─ Home.tsx
│  │     │  ├─ services
│  │     │  │  └─ mailService.ts
│  │     │  ├─ stores
│  │     │  │  ├─ conversationsStore.ts
│  │     │  │  ├─ modalStore.ts
│  │     │  │  └─ userProgressStore.ts
│  │     │  ├─ styles
│  │     │  │  └─ animations.css
│  │     │  ├─ types
│  │     │  │  ├─ commonTypes.ts
│  │     │  │  ├─ emailTypes.ts
│  │     │  │  └─ iconProps.ts
│  │     │  ├─ utils
│  │     │  │  ├─ getEmailData.ts
│  │     │  │  └─ getFormattedDate.ts
│  │     │  └─ vite-env.d.ts
│  │     ├─ renderer.html
│  │     ├─ services
│  │     │  ├─ imap.js
│  │     │  └─ smtp.js
│  │     ├─ tsconfig.app.json
│  │     ├─ tsconfig.json
│  │     ├─ tsconfig.node.json
│  │     ├─ utils
│  │     │  └─ logging.js
│  │     └─ vite.config.ts
│  └─ web-site
├─ package-lock.json
├─ package.json
└─ README.md

```