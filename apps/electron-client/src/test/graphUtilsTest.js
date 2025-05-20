// src/test/graphUtilsTest.js
import userService from "../main/services/userService.js";
import accountService from "../main/services/accountService.js";
import * as imapService from "../main/services/imapService.js";
import * as graphService from "../main/services/neo4jAdapter.js";
import { updateGraphDBInBackground, initializeGraphDBAfterAccountSetup } from "../main/utils/graphUtills.js";
import { getConnection, closeConnection } from "../main/config/dbConfig.js";
import { fileURLToPath } from "url";

// ESM에서 현재 파일이 직접 실행되는지 확인하는 방법
const __filename = fileURLToPath(import.meta.url);
const isMainModule = process.argv[1] === __filename;

/**
 * GraphUtils Function Test - 그래프 DB 초기화 및 업데이트 테스트
 */
export const runGraphUtilsTests = async () => {
  console.log("===== GraphUtils Function Test Start =====");
  let userId = null;
  let accountId = null;

  try {
    // 0. Create a test user first
    console.log("0. Creating Test User (Prerequisite)");
    const userData = { username: "GraphTestUser" };
    const createdUser = await userService.createUser(userData);
    console.log("Created User:", createdUser);
    userId = createdUser.userId;

    // 1. Create Account for Graph Test
    console.log("\n1. Create Account for Graph Test");
    const accountData = {
      // 실제 테스트 가능한 계정 정보로 변경해주세요
      email: "",
      password: "", // 앱 비밀번호 사용
      imapHost: "imap.gmail.com",
      imapPort: 993,
      smtpHost: "smtp.gmail.com",
      smtpPort: 465,
      authMethod: "LOGIN",
    };

    try {
      // 계정 생성
      const result = await accountService.createAccount(accountData);
      console.log("Created Account Result:", result);

      // 생성된 계정 목록 조회
      const accounts = await accountService.getAllAccounts();
      console.log("All accounts:", accounts);

      // 방금 생성한 계정의 ID 가져오기
      accountId = accounts[accounts.length - 1].accountId;
      console.log("Using Account ID:", accountId);

      // 2. Test IMAP Authentication
      console.log("\n2. Test IMAP Authentication");
      const authConfig = {
        host: accountData.imapHost,
        port: accountData.imapPort,
        username: accountData.email,
        password: accountData.password,
      };

      const authResult = await imapService.testImapAuthentication(authConfig);
      console.log("IMAP Authentication Result:", authResult);

      if (authResult.success) {
        // 3. Test Initial Sync and Graph DB Setup
        console.log("\n3. Test Initial Sync and Graph DB Setup");
        try {
          // 초기 동기화 테스트 - 5개만 가져오기
          const initResult = await initializeGraphDBAfterAccountSetup(accountId, 2);
          console.log("Initial Sync and Graph DB Setup Result:", initResult);
          
          if (initResult.success) {
            console.log(`Synced ${initResult.syncResult.totalMessages} messages initially`);
            console.log(`Graph DB initialized: ${initResult.graphInitialized}`);
            
            // 데이터베이스에 저장된 메시지 확인
            await verifyMessagesInDB(accountId);
            
            // Neo4j Graph DB에 노드 확인
            await verifyNodesInGraphDB();
            
            // 4. Test Folder Sync Update
            console.log("\n4. Test Folder Sync Update with 1 Message");
            try {
              // 추가 동기화 테스트 - 1개만 가져오기
              const syncResult = await imapService.syncFolder(accountId, "INBOX", 1);
              console.log("Additional Sync Result:", syncResult);
              
              // 그래프 DB 업데이트 테스트
              console.log("\n5. Test Graph DB Update");
              // 이 함수는 비동기적으로 실행되므로 실제로는 결과를 기다리지 않지만, 테스트에서는 기다립니다
              await testGraphDBUpdate(syncResult.syncedCount);
              
            } catch (syncError) {
              console.error("Folder sync error:", syncError.message);
            }
          } else {
            console.log("Initial sync failed, skipping further tests");
          }
        } catch (initError) {
          console.error("Initial sync and Graph DB setup error:", initError.message);
          console.error("Error Stack:", initError.stack);
        }
      } else {
        console.log("IMAP authentication failed, skipping sync tests");
      }
    } catch (accountError) {
      console.error("Account creation failed:", accountError.message);
      console.error("Error Stack:", accountError.stack);
    }

    console.log("\n===== GraphUtils Function Test Finished =====");
  } catch (error) {
    console.error("Error during test:", error);
    console.error("Error Stack:", error.stack);
  } finally {
    // // Clean up - Delete test account and user
    // try {
    //   if (accountId) {
    //     console.log("\nCleaning up - Deleting test account");
    //     await accountService.deleteAccount(accountId);
    //     console.log("Test account deleted successfully");
    //   }

    //   if (userId) {
    //     console.log("\nCleaning up - Deleting test user");
    //     await userService.deleteUser(userId);
    //     console.log("Test user deleted successfully");
    //   }
    // } catch (cleanupError) {
    //   console.error("Error during cleanup:", cleanupError);
    // }

    console.log("Waiting for background graph DB tasks to complete...");
    await new Promise(resolve => setTimeout(resolve, 10000)); // 10초 대기
    await closeConnection();
    process.exit(0);
  }
};

/**
 * 데이터베이스에 저장된 메시지 확인
 * @param {Number} accountId - 계정 ID
 */
async function verifyMessagesInDB(accountId) {
  console.log("\nVerifying messages in SQLite database...");
  const db = getConnection();
  
  // 폴더 정보 조회
  const folderQuery = `SELECT * FROM Folder WHERE account_id = ? AND name = 'INBOX'`;
  const folder = await new Promise((resolve, reject) => {
    db.get(folderQuery, [accountId], (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
  console.log("INBOX Folder:", folder);
  
  // 저장된 메시지 개수 확인
  const messageCountQuery = `
    SELECT COUNT(*) as count 
    FROM Message 
    WHERE account_id = ? AND folder_id = ?
  `;
  const messageCount = await new Promise((resolve, reject) => {
    db.get(messageCountQuery, [accountId, folder.folder_id], (err, row) => {
      if (err) reject(err);
      else resolve(row.count);
    });
  });
  console.log(`Total messages in database: ${messageCount}`);
  
  // 카테고리 정보 확인
  const categoryQuery = `
    SELECT COUNT(*) as count 
    FROM Category
  `;
  const categoryCount = await new Promise((resolve, reject) => {
    db.get(categoryQuery, [], (err, row) => {
      if (err) reject(err);
      else resolve(row.count);
    });
  });
  console.log(`Total categories in database: ${categoryCount}`);
  
  // 메시지 카테고리 매핑 확인
  const mappingQuery = `
    SELECT COUNT(*) as count 
    FROM Message 
    WHERE category_id IS NOT NULL
  `;
  const mappingCount = await new Promise((resolve, reject) => {
    db.get(mappingQuery, [], (err, row) => {
      if (err) reject(err);
      else resolve(row.count);
    });
  });
  console.log(`Messages with assigned categories: ${mappingCount}`);
}

/**
 * Neo4j Graph DB에 저장된 노드 확인
 */
async function verifyNodesInGraphDB() {
  console.log("\nVerifying nodes in Neo4j Graph DB...");
  try {
    // Root 노드 확인 (C_ID: 0, C_type: 0)
    const rootNodeResult = await graphService.readNodePy({
      C_ID: 0,
      C_type: 0,
      IO_type: 3
    });
    
    console.log("Root Node Result:", rootNodeResult);
    
    if (rootNodeResult.status === "success") {
      const nodes = rootNodeResult.result.nodes;
      console.log(`Found ${nodes.length} nodes (including Root node)`);
      
      // 노드 타입별로 분류
      const personNodes = nodes.filter(n => n.C_type === 1);
      const categoryNodes = nodes.filter(n => n.C_type === 2);
      const subcategoryNodes = nodes.filter(n => n.C_type === 3);
      
      console.log(`Person nodes: ${personNodes.length}`);
      console.log(`Category nodes: ${categoryNodes.length}`);
      console.log(`Subcategory nodes: ${subcategoryNodes.length}`);
      
      // 첫 번째 Person 노드의 이메일 확인 (있는 경우)
      if (personNodes.length > 0) {
        console.log("First Person node:", personNodes[0]);
        
        // Person 노드의 메시지 확인
        const messageResult = await graphService.readMessagePy({
          C_ID: personNodes[0].C_ID,
          C_type: 1,
          IO_type: 1
        });
        
        console.log(`Messages for Person node: ${messageResult.result.emails?.length || 0}`);
      }
    }
  } catch (error) {
    console.error("Error verifying Graph DB:", error.message);
  }
}

/**
 * 그래프 DB 업데이트 함수 테스트 (비동기 함수를 동기적으로 테스트)
 * @param {Number} syncedCount - 동기화된 메시지 수
 */
async function testGraphDBUpdate(syncedCount) {
  console.log(`Testing Graph DB update with ${syncedCount} new messages...`);
  
  // 원래 비동기적으로 실행되는 함수를 테스트에서는 동기적으로 실행
  if (syncedCount > 0) {
    try {
      // 메시지 처리 및 임베딩
      console.log("Starting message processing and embedding...");
      await graphService.processAndEmbedMessagesPy();
      console.log("Message processing and embedding completed");
      
      // 그래프 DB 초기화
      console.log("Starting Graph DB initialization...");
      await graphService.initializeGraphFromSQLitePy();
      console.log("Graph DB initialization completed");
      
      // 업데이트 후 그래프 DB 상태 확인
      await verifyNodesInGraphDB();
      
      return { success: true };
    } catch (error) {
      console.error("Error during Graph DB update test:", error.message);
      return { success: false, error: error.message };
    }
  } else {
    console.log("No new messages, skipping Graph DB update test");
    return { success: true, skipped: true };
  }
}

// 직접 실행될 때
if (isMainModule) {
  runGraphUtilsTests();
}

export default { runGraphUtilsTests };