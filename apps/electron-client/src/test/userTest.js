import userService from "../main/services/userService.js";
import { closeConnection } from "../main/config/dbConfig.js";

/**
 * User CRUD Function Test
 */
export const runUserTests = async () => {
  console.log("===== User Function Test Start =====");

  try {
    // 1. Create User Test
    console.log("1. Create User Test");
    let userData = { username: "TestUser" };
    let createdUser = await userService.createUser(userData);
    console.log("Created User:", createdUser);

    let userId = createdUser.userId;

    console.log("1. Create User Test");
    userData = { username: "Test2User" };
    createdUser = await userService.createUser(userData);
    console.log("Created User:", createdUser);

    userId = createdUser.userId;

    // 2. Read User Test
    console.log("\n2. Read User Test");
    const user = await userService.getUserById(userId);
    console.log("Fetched User:", user);

    // 3. Update User Test
    console.log("\n3. Update User Test");
    const updatedData = { username: "UpdatedUser" };
    const updatedUser = await userService.updateUser(userId, updatedData);
    console.log("Updated User:", updatedUser);

    // 3-1. Confirm Update
    const checkUser = await userService.getUserById(userId);
    console.log("Confirmed Updated User:", checkUser);

    // // 4. Delete User Test
    // console.log("\n4. Delete User Test");
    // const deleteResult = await userService.deleteUser(userId);
    // console.log("Delete Result:", deleteResult);

    // // 4-1. Confirm Deletion (Expecting Error)
    // console.log("\n4-1. Confirm Deletion (Expecting Error)");
    // try {
    //   const deletedUser = await userService.getUserById(userId);
    //   console.log("Deleted User Fetch Result:", deletedUser);
    // } catch (error) {
    //   console.log("Expected Error Occurred:", error.message);
    // }

    console.log("\n===== User Function Test Finished =====");
  } catch (error) {
    console.error("Error during test:", error);
  } finally {
    await closeConnection();
    process.exit(0);
  }
};

runUserTests();