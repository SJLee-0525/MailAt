// src/controllers/userController.js
import { ipcMain } from "electron";
import userService from "../services/userService.js";

console.log("userController 모듈 로드됨!");

/**
 * 사용자 컨트롤러 초기화
 */
export const initUserController = () => {
  // 사용자 생성 요청 처리
  ipcMain.removeHandler("user:create"); // 기존 핸들러 제거

  ipcMain.handle("user:create", async (event, userData) => {
    try {
      const result = await userService.createUser(userData);
      console.log("사용자 생성 결과:", result);
      return { success: true, data: result };
    } catch (error) {
      console.error("사용자 생성 컨트롤러 오류:", error);
      return { success: false, message: error.message };
    }
  });

  // 사용자 조회 요청 처리
  ipcMain.handle("user:get", async (event, userId) => {
    try {
      const user = await userService.getUserById(userId);
      console.log("사용자 조회 결과:", user);
      return { success: true, data: user };
    } catch (error) {
      console.error("사용자 조회 컨트롤러 오류:", error);
      return { success: false, message: error.message };
    }
  });

  // 사용자 업데이트 요청 처리
  ipcMain.handle("user:update", async (event, { userId, userData }) => {
    try {
      const updatedUser = await userService.updateUser(userId, userData);
      console.log("사용자 업데이트 결과:", updatedUser);
      return { success: true, data: updatedUser };
    } catch (error) {
      console.error("사용자 업데이트 컨트롤러 오류:", error);
      return { success: false, message: error.message };
    }
  });

  // 사용자 삭제 요청 처리
  ipcMain.handle("user:delete", async (event, userId) => {
    try {
      const result = await userService.deleteUser(userId);
      console.log("사용자 삭제 결과:", result);
      return { success: true, data: result };
    } catch (error) {
      console.error("사용자 삭제 컨트롤러 오류:", error);
      return { success: false, message: error.message };
    }
  });
};
