// src/utils/syncManager.js
class SyncManager {
  constructor() {
    this.syncLocks = new Map(); // 폴더별 동기화 잠금
    this.pendingSyncs = new Map(); // 대기 중인 동기화 요청
  }

  // 폴더 동기화 잠금 획득
  async acquireLock(accountId, folderName) {
    const lockKey = `${accountId}-${folderName}`;

    // 이미 진행 중인 동기화가 있는지 확인
    if (this.syncLocks.get(lockKey)) {
      console.log(
        `[SYNC] 이미 ${folderName} 폴더 동기화가 진행 중입니다. 대기합니다.`
      );

      // 동기화 완료 대기
      return new Promise((resolve) => {
        if (!this.pendingSyncs.has(lockKey)) {
          this.pendingSyncs.set(lockKey, []);
        }
        this.pendingSyncs.get(lockKey).push(resolve);
      });
    }

    // 잠금 획득
    this.syncLocks.set(lockKey, true);
    return true;
  }

  // 폴더 동기화 잠금 해제
  releaseLock(accountId, folderName) {
    const lockKey = `${accountId}-${folderName}`;
    this.syncLocks.set(lockKey, false);

    // 대기 중인 동기화 요청이 있으면 하나 처리
    if (
      this.pendingSyncs.has(lockKey) &&
      this.pendingSyncs.get(lockKey).length > 0
    ) {
      const nextResolve = this.pendingSyncs.get(lockKey).shift();
      setTimeout(() => {
        this.syncLocks.set(lockKey, true);
        nextResolve(true);
      }, 100);
    } else {
      this.syncLocks.delete(lockKey);
      this.pendingSyncs.delete(lockKey);
    }
  }
}

export default new SyncManager();
