// src/services/userService.js
import userRepository from "../repositories/userRepository.js";

/**
 * 사용자 서비스 클래스
 */
class UserService {
  /**
   * 사용자 ID로 사용자 조회
   * @param {Number} userId - 사용자 ID
   * @returns {Promise<Object>} 사용자 정보
   */
  async getUserById(userId) {
    try {
      const user = await userRepository.getUserById(userId);

      if (!user) {
        throw new Error(
          `사용자 ID(${userId})에 해당하는 사용자를 찾을 수 없습니다.`
        );
      }

      return user;
    } catch (error) {
      console.error("사용자 조회 서비스 오류:", error);
      throw error;
    }
  }

  /**
   * 새 사용자 생성
   * @param {Object} userData - 사용자 데이터
   * @returns {Promise<Object>} 생성된 사용자 정보
   */
  async createUser(userData) {
    try {
      if (!userData.username) {
        throw new Error("사용자 이름(username)은 필수입니다.");
      }

      return await userRepository.createUser(userData);
    } catch (error) {
      console.error("사용자 생성 서비스 오류:", error);
      throw error;
    }
  }

  /**
   * 사용자 정보 업데이트
   * @param {Number} userId - 사용자 ID
   * @param {Object} userData - 업데이트할 사용자 데이터
   * @returns {Promise<Object>} 업데이트된 사용자 정보
   */
  async updateUser(userId, userData) {
    try {
      if (!userData.username) {
        throw new Error("사용자 이름(username)은 필수입니다.");
      }

      return await userRepository.updateUser(userId, userData);
    } catch (error) {
      console.error("사용자 업데이트 서비스 오류:", error);
      throw error;
    }
  }

  /**
   * 사용자 삭제
   * @param {Number} userId - 삭제할 사용자 ID
   * @returns {Promise<Object>} 삭제 결과
   */
  async deleteUser(userId) {
    try {
      return await userRepository.deleteUser(userId);
    } catch (error) {
      console.error("사용자 삭제 서비스 오류:", error);
      throw error;
    }
  }
}

export default new UserService();
