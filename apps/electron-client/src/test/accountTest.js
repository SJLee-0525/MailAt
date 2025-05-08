// src/test/accountTest.js
import accountService from "../main/services/accountService.js";
import userService from "../main/services/userService.js";
import { closeConnection } from "../main/config/dbConfig.js";
import { fileURLToPath } from "url";
import path from "path";

// ESM에서 현재 파일이 직접 실행되는지 확인하는 방법
const __filename = fileURLToPath(import.meta.url);
const isMainModule = process.argv[1] === __filename;

/**
 * Account CRUD Function Test
 */
export const runAccountTests = async () => {
  console.log("===== Account Function Test Start =====");
  let userId = null;

  try {
    // 0. Create a test user first (since accounts need a user)
    console.log("0. Creating Test User (Prerequisite)");
    const userData = { username: "TestUser" };
    const createdUser = await userService.createUser(userData);
    console.log("Created User:", createdUser);
    userId = createdUser.userId;

    // 1. Create Account Test
    console.log("\n1. Create Account Test");
    const accountData = {
      email: "test@example.com",
      password: "testpassword",
      imapHost: "imap.gmail.com",
      imapPort: 993,
      smtpHost: "smtp.gmail.com",
      smtpPort: 465,
    };

    const createdAccount = await accountService.createAccount(accountData);
    console.log("Created Account:", createdAccount);
    const accountId = createdAccount.id;

    // 2. Get All Accounts Test
    console.log("\n2. Get All Accounts Test");
    const accounts = await accountService.getAllAccounts();
    console.log("Fetched Accounts:", accounts);
    console.log("Total Accounts:", accounts.length);

    // 3. Delete Account Test
    console.log("\n3. Delete Account Test");
    const deleteResult = await accountService.deleteAccount(accountId);
    console.log("Delete Result:", deleteResult);

    // 3-1. Confirm Deletion by fetching all accounts again
    console.log("\n3-1. Confirm Deletion by fetching all accounts");
    const accountsAfterDeletion = await accountService.getAllAccounts();
    console.log("Accounts after deletion:", accountsAfterDeletion);
    console.log("Total Accounts after deletion:", accountsAfterDeletion.length);

    // 4. Test error handling - Try to delete non-existent account
    console.log("\n4. Test Deleting Non-existent Account (Expecting Error)");
    try {
      await accountService.deleteAccount(9999); // Non-existent ID
      console.log("Error: No error thrown for non-existent account deletion");
    } catch (error) {
      console.log("Expected Error Occurred:", error.message);
    }

    console.log("\n===== Account Function Test Finished =====");
  } catch (error) {
    console.error("Error during test:", error);
  } finally {
    // Clean up - Delete test user if created
    if (userId) {
      try {
        console.log("\nCleaning up - Deleting test user");
        await userService.deleteUser(userId);
        console.log("Test user deleted successfully");
      } catch (cleanupError) {
        console.error("Error during cleanup:", cleanupError);
      }
    }

    await closeConnection();
    process.exit(0);
  }
};

// ESM에서는 이 방식으로 직접 실행 여부를 확인
if (isMainModule) {
  runAccountTests();
}
