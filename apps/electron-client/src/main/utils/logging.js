// src/utils/logging.js - 성능 측정 및 로깅 유틸리티

/**
 * 성능 측정을 위한 유틸리티 함수들
 */
class PerformanceLogger {
  constructor() {
    this.timers = new Map();
    this.measurements = new Map();
  }

  /**
   * 타이머 시작
   * @param {string} label - 타이머 레이블
   */
  start(label) {
    this.timers.set(label, process.hrtime());
    console.log(`⏱️ [PERF] 시작: ${label}`);
  }

  /**
   * 타이머 종료 및 소요 시간 반환
   * @param {string} label - 타이머 레이블
   * @returns {number} 밀리초 단위 소요 시간
   */
  end(label) {
    const startTime = this.timers.get(label);
    if (!startTime) {
      console.warn(`⚠️ [PERF] 경고: '${label}'에 대한 타이머가 없습니다.`);
      return 0;
    }

    const diff = process.hrtime(startTime);
    const milliseconds = diff[0] * 1000 + diff[1] / 1000000;
    const roundedMs = Math.round(milliseconds * 100) / 100;

    this.measurements.set(label, roundedMs);
    console.log(`⏱️ [PERF] 종료: ${label} - ${roundedMs}ms`);

    return roundedMs;
  }

  /**
   * 측정된 시간 반환
   * @param {string} label - 타이머 레이블
   * @returns {number|undefined} 측정된 시간 (밀리초)
   */
  getMeasurement(label) {
    return this.measurements.get(label);
  }

  /**
   * 모든 측정 결과 로깅
   */
  logAll() {
    console.log("📊 [PERF] 성능 측정 결과:");
    console.log("==============================");

    // 측정 결과를 배열로 변환하여 소요시간 기준 내림차순 정렬
    const sortedMeasurements = [...this.measurements.entries()].sort(
      (a, b) => b[1] - a[1]
    );

    // 테이블 형식으로 출력
    const table = sortedMeasurements.map(([label, time]) => ({
      작업: label,
      "소요시간(ms)": time,
      "성능 평가": this.getPerformanceRating(time),
    }));

    console.table(table);
    console.log("==============================");
  }

  /**
   * 소요 시간에 따른 성능 평가
   * @param {number} time - 밀리초 단위 소요 시간
   * @returns {string} 성능 평가 문자열
   */
  getPerformanceRating(time) {
    if (time < 100) return "🟢 매우 빠름";
    if (time < 300) return "🟡 빠름";
    if (time < 1000) return "🟠 보통";
    return "🔴 느림";
  }

  /**
   * 타이머를 감싸는 고차 함수 (async 함수용)
   * @param {string} label - 타이머 레이블
   * @param {Function} fn - 측정할 함수
   * @returns {Function} 타이머를 적용한 함수
   */
  async measureAsync(label, fn) {
    this.start(label);
    try {
      const result = await fn();
      const time = this.end(label);
      return { result, time };
    } catch (error) {
      this.end(label);
      throw error;
    }
  }
}

// 싱글톤 인스턴스 생성
const performanceLogger = new PerformanceLogger();

export default performanceLogger;