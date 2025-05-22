const { ImapWrapper } = require('../build/Release/mailio_addon.node');
const fs = require('fs');
const path = require('path');

// --- 설정 정보 로드 ---
let config;
try {
    const configPath = path.join(__dirname, 'info.json');
    const configData = fs.readFileSync(configPath, 'utf8');
    config = JSON.parse(configData);
} catch (error) {
    console.error(`[ERROR] Failed to load or parse info.json: ${error.message}`);
    console.error('[STOP] Cannot run tests without configuration.');
    process.exit(1); // 설정 파일 없으면 종료
}

const imapConfig = config.imap;
// --- 사용자 설정 끝 ---

// 테스트 변수 (필요시 info.json에 추가 가능)
const testMailbox = 'INBOX';
const testSearchKeyword = 'test';
const testFetchSeqNum = 1;
const testFetchUid = 1;
const testFolderName = 'MailioTestFolder';
const testNewFolderName = 'MailioTestFolderRenamed';

// ImapWrapper 인스턴스 생성
const imap = new ImapWrapper(imapConfig.host, imapConfig.port);

async function runImapTests() {
    console.log(`[INFO] Connecting to ${imapConfig.host}:${imapConfig.port}...`);

    // 1. 인증 테스트
    try {
        console.log('\n[TEST] Authenticate');
        const greeting = imap.authenticate(imapConfig.username, imapConfig.password);
        console.log(`[SUCCESS] Authentication successful. Server Greeting: ${greeting}`);
    } catch (e) {
        console.error(`[FAIL] Authentication failed: ${e.message}`);
        console.error('[STOP] Cannot proceed without authentication.');
        return; // 인증 실패 시 테스트 중단
    }

    // 2. 메일함 선택 (Select) 테스트
    let mailboxSelected = false;
    try {
        console.log(`\n[TEST] Select Mailbox: ${testMailbox}`);
        // 두 번째 인자: read_only (true/false, 기본값 false)
        const selectStat = imap.select(testMailbox, true); // 읽기 전용으로 선택
        console.log(`[SUCCESS] Mailbox selected. Stats:`, selectStat);
        mailboxSelected = true;
    } catch (e) {
        console.error(`[FAIL] Selecting mailbox '${testMailbox}' failed: ${e.message}`);
    }

    // 3. 메일함 통계 (Statistics) 테스트 (메일함 선택 후 가능)
    if (mailboxSelected) {
        try {
            console.log(`\n[TEST] Get Statistics for: ${testMailbox}`);
            // statistics는 메일함 이름을 다시 받음 (select와 별개)
            // 두 번째 인자: info_flags (선택 사항, mailio::imaps::mailbox_stat_t::flag 참고)
            const stats = imap.statistics(testMailbox);
            console.log(`[SUCCESS] Statistics:`, stats);
        } catch (e) {
            console.error(`[FAIL] Getting statistics for '${testMailbox}' failed: ${e.message}`);
        }
    } else {
        console.log(`[SKIP] Statistics test skipped (mailbox not selected).`);
    }

    // 4. 폴더 구분자 (Folder Delimiter) 테스트
    try {
        console.log(`\n[TEST] Get Folder Delimiter`);
        const delimiter = imap.folderDelimiter();
        console.log(`[SUCCESS] Folder delimiter: '${delimiter}'`);
    } catch (e) {
        console.error(`[FAIL] Getting folder delimiter failed: ${e.message}`);
    }

    // 5. 폴더 목록 (List Folders) 테스트
    try {
        console.log(`\n[TEST] List Folders (root)`);
        // 인자: mailbox_pattern (예: '*', 'INBOX.*')
        const folders = imap.listFolders('*'); // 모든 폴더 목록 가져오기
        console.log(`[SUCCESS] Folders listed:`, JSON.stringify(folders, null, 2)); // 객체를 보기 좋게 출력
    } catch (e) {
        console.error(`[FAIL] Listing folders failed: ${e.message}`);
    }

    // 6. 메시지 검색 (Search) 테스트 (메일함 선택 후 가능)
    let foundUids = [];
    if (mailboxSelected) {
        try {
            console.log(`\n[TEST] Search Messages (Subject contains '${testSearchKeyword}')`);
            // 현재 searchMessages는 Subject 키워드만 지원 (래퍼 수정 필요시 가능)
            foundUids = imap.searchMessages(testSearchKeyword); // 시퀀스 번호 반환
            // const foundUidsByUid = imap.searchByUid(testSearchKeyword); // UID 반환
            console.log(`[SUCCESS] Found message sequence numbers:`, foundUids);
            // console.log(`[SUCCESS] Found message UIDs:`, foundUidsByUid);
        } catch (e) {
            console.error(`[FAIL] Searching messages failed: ${e.message}`);
        }
    } else {
        console.log(`[SKIP] Search test skipped (mailbox not selected).`);
    }

    // 7. 메시지 가져오기 (FetchOne - Sequence Number) 테스트 (메일함 선택 후 가능)
    if (mailboxSelected) {
        try {
            console.log(`\n[TEST] Fetch Message by Sequence Number: ${testFetchSeqNum}`);
            // 인자: mailbox, index, is_uid (false), header_only (false)
            const rawMessage = imap.fetchOne(testMailbox, testFetchSeqNum, false, false);
            console.log(`[SUCCESS] Fetched message (Seq ${testFetchSeqNum}):\n--- START ---\n${rawMessage}\n--- END ---`);
            // 헤더만 가져오기 테스트
            // const headerOnly = imap.fetchOne(testMailbox, testFetchSeqNum, false, true);
            // console.log(`[SUCCESS] Fetched header only (Seq ${testFetchSeqNum}):\n--- START ---\n${headerOnly}\n--- END ---`);
        } catch (e) {
            console.error(`[FAIL] Fetching message (Seq ${testFetchSeqNum}) failed: ${e.message}`);
        }
    } else {
        console.log(`[SKIP] FetchOne test skipped (mailbox not selected).`);
    }

    // 8. 메시지 가져오기 (FetchByUid) 테스트 (메일함 선택 후 가능)
    if (mailboxSelected && testFetchUid > 0) { // 유효한 UID가 있을 경우 시도
        try {
            console.log(`\n[TEST] Fetch Message by UID: ${testFetchUid}`);
            // 인자: mailbox, uid, header_only (false)
            const rawMessageUid = imap.fetchByUid(testMailbox, testFetchUid, false);
            console.log(`[SUCCESS] Fetched message (UID ${testFetchUid}):\n--- START ---\n${rawMessageUid}\n--- END ---`);
            // 헤더만 가져오기 테스트
            // const headerOnlyUid = imap.fetchByUid(testMailbox, testFetchUid, true);
            // console.log(`[SUCCESS] Fetched header only (UID ${testFetchUid}):\n--- START ---\n${headerOnlyUid}\n--- END ---`);
        } catch (e) {
            console.error(`[FAIL] Fetching message (UID ${testFetchUid}) failed: ${e.message}`);
        }
    } else {
         console.log(`[SKIP] FetchByUid test skipped (mailbox not selected or invalid UID).`);
    }


    // --- 주의: 아래 테스트는 메일함에 변경을 가합니다 ---

    // 9. 폴더 생성 (Create Folder) 테스트 (주석 처리됨)
    /*
    try {
        console.log(`\n[TEST] Create Folder: ${testFolderName}`);
        const created = imap.createFolder(testFolderName);
        if (created) {
            console.log(`[SUCCESS] Folder '${testFolderName}' created.`);
        } else {
            console.warn(`[WARN] Folder '${testFolderName}' might already exist or creation failed.`);
        }
    } catch (e) {
        console.error(`[FAIL] Creating folder '${testFolderName}' failed: ${e.message}`);
    }
    */

    // 10. 폴더 이름 변경 (Rename Folder) 테스트 (주석 처리됨)
    /*
    try {
        console.log(`\n[TEST] Rename Folder: ${testFolderName} -> ${testNewFolderName}`);
        const renamed = imap.renameFolder(testFolderName, testNewFolderName);
        if (renamed) {
            console.log(`[SUCCESS] Folder renamed to '${testNewFolderName}'.`);
        } else {
            console.warn(`[WARN] Folder rename failed (maybe '${testFolderName}' doesn't exist or '${testNewFolderName}' already exists).`);
        }
    } catch (e) {
        console.error(`[FAIL] Renaming folder failed: ${e.message}`);
    }
    */

    // 11. 폴더 삭제 (Delete Folder) 테스트 (주석 처리됨)
    /*
    try {
        // 이름 변경 테스트 후 변경된 이름으로 삭제 시도
        const folderToDelete = testNewFolderName; // 또는 testFolderName
        console.log(`\n[TEST] Delete Folder: ${folderToDelete}`);
        const deleted = imap.deleteFolder(folderToDelete);
        if (deleted) {
            console.log(`[SUCCESS] Folder '${folderToDelete}' deleted.`);
        } else {
            console.warn(`[WARN] Folder delete failed (maybe '${folderToDelete}' doesn't exist).`);
        }
    } catch (e) {
        console.error(`[FAIL] Deleting folder failed: ${e.message}`);
    }
    */

    // 12. 메시지 추가 (Append) 테스트 (주석 처리됨)
    /*
    if (mailboxSelected) {
        try {
            console.log(`\n[TEST] Append Message to: ${testMailbox}`);
            const messageToAppend = `From: <${config.mailInfo.fromAddress}>
To: <${config.mailInfo.toAddress}>
Subject: Append Test Message
Date: ${new Date().toUTCString()}
Content-Type: text/plain; charset=utf-8

This is a test message appended via IMAP.
`;
            imap.append(testMailbox, messageToAppend);
            console.log(`[SUCCESS] Message appended to '${testMailbox}'. Check mailbox for confirmation.`);
        } catch (e) {
            console.error(`[FAIL] Appending message failed: ${e.message}`);
        }
    } else {
        console.log(`[SKIP] Append test skipped (mailbox not selected).`);
    }
    */

    // 13. 메시지 삭제 (Remove - Sequence Number) 테스트 (주석 처리됨, 메일함 선택 후 가능)
    /*
    if (mailboxSelected && testFetchSeqNum > 0) { // 삭제할 메시지 번호가 유효할 때
        try {
            console.log(`\n[TEST] Remove Message by Sequence Number: ${testFetchSeqNum}`);
            imap.removeOne(testMailbox, testFetchSeqNum);
            console.log(`[SUCCESS] Message (Seq ${testFetchSeqNum}) marked for deletion in '${testMailbox}'. (Requires EXPUNGE to finalize)`);
        } catch (e) {
            console.error(`[FAIL] Removing message (Seq ${testFetchSeqNum}) failed: ${e.message}`);
        }
    } else {
        console.log(`[SKIP] RemoveOne test skipped (mailbox not selected or invalid sequence number).`);
    }
    */

    // 14. 메시지 삭제 (RemoveByUid) 테스트 (주석 처리됨, 메일함 선택 후 가능)
    /*
    if (mailboxSelected && testFetchUid > 0) { // 삭제할 UID가 유효할 때
        try {
            console.log(`\n[TEST] Remove Message by UID: ${testFetchUid}`);
            imap.removeByUid(testMailbox, testFetchUid);
            console.log(`[SUCCESS] Message (UID ${testFetchUid}) marked for deletion in '${testMailbox}'. (Requires EXPUNGE to finalize)`);
        } catch (e) {
            console.error(`[FAIL] Removing message (UID ${testFetchUid}) failed: ${e.message}`);
        }
    } else {
        console.log(`[SKIP] RemoveByUid test skipped (mailbox not selected or invalid UID).`);
    }
    */

    console.log('\n[INFO] All tests finished.');
}

// 테스트 실행
runImapTests();
