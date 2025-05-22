const addon = require('../build/Release/mailio_addon.node');

// Bit8Wrapper 인스턴스 생성
const bit8 = new addon.Bit8Wrapper();

// 테스트할 문자열
const originalString = "This is a test string for 8bit encoding.";

// 인코딩 테스트
console.log("Original:", originalString);
const encodedResult = bit8.encode(originalString);
console.log("Encoded:", encodedResult); // 8bit 인코딩은 일반적으로 내용을 변경하지 않지만, 줄 바꿈 정책을 적용할 수 있습니다.

// 디코딩 테스트
try {
    const decodedResult = bit8.decode(encodedResult);
    console.log("Decoded:", decodedResult);
    console.log("Test Passed:", originalString === decodedResult);
} catch (e) {
    console.error("Decoding failed:", e);
    console.log("Test Failed");
}

// 오류 케이스 테스트 (선택 사항 - 예: 배열 대신 문자열 전달)
try {
    console.log("\nTesting decode with invalid input type:");
    bit8.decode("not an array");
} catch (e) {
    console.log("Caught expected error:", e.message);
}

// 오류 케이스 테스트 (선택 사항 - 예: 배열 내부에 문자열이 아닌 요소 포함)
try {
    console.log("\nTesting decode with invalid array element:");
    bit8.decode(["valid string", 123]);
} catch (e) {
    console.log("Caught expected error:", e.message);
}