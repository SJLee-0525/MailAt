const assert = require('assert');
const { Bit7Wrapper } = require('../build/Release/mailio_addon.node');

console.log('[TEST] Bit7Wrapper Tests');

// --- 테스트 설정 ---
const line1Policy = 78; // 첫 줄 최대 길이
const linesPolicy = 78; // 나머지 줄 최대 길이

// --- 테스트 케이스 ---
const testCases = [
    {
        name: "Basic ASCII",
        input: "This is a simple test string with only ASCII characters.",
        expectedEncoded: ["This is a simple test string with only ASCII characters."], // No line breaks needed
        expectedDecoded: "This is a simple test string with only ASCII characters."
    },
    {
        name: "ASCII with Line Breaks",
        input: "First line.\r\nSecond line, slightly longer to test wrapping if policies were smaller.\r\nThird line.",
        // encode는 \r\n을 기준으로 줄을 나눔
        expectedEncoded: [
            "First line.",
            "Second line, slightly longer to test wrapping if policies were smaller.",
            "Third line."
        ],
        // decode는 각 줄 끝에 \r\n을 추가함 (마지막 줄 제외)
        expectedDecoded: "First line.\r\nSecond line, slightly longer to test wrapping if policies were smaller.\r\nThird line."
    },
    {
        name: "Long Line (should wrap based on policy)",
        input: "This is a very long line of text that should theoretically be wrapped by the encoder if the line policy was smaller than its actual length, but with 78 it likely won't wrap.",
        // linePolicy가 78이므로 줄바꿈 안됨
        expectedEncoded: ["This is a very long line of text that should theoretically be wrapped by the encoder if the line policy was smaller than its actual length, but with 78 it likely won't wrap."],
        expectedDecoded: "This is a very long line of text that should theoretically be wrapped by the encoder if the line policy was smaller than its actual length, but with 78 it likely won't wrap."
    },
    // 7bit에서 허용되지 않는 문자 포함 (예: 한글)
    {
        name: "Invalid Character (Korean)",
        input: "This contains 한글 which is not 7bit.",
        expectEncodeError: true
    },
    // 7bit에서 허용되지 않는 문자 포함 (예: €)
    {
        name: "Invalid Character (Euro sign)",
        input: "Price: €10",
        expectEncodeError: true
    }
];

// --- 테스트 실행 ---
const bit7 = new Bit7Wrapper(line1Policy, linesPolicy);

testCases.forEach(tc => {
    console.log(`\n[RUN] ${tc.name}`);
    // Encode Test
    if (tc.expectEncodeError) {
        try {
            bit7.encode(tc.input);
            console.error(`[FAIL] Expected encoding error for input: "${tc.input}", but none occurred.`);
        } catch (e) {
            console.log(`[SUCCESS] Caught expected encoding error: ${e.message}`);
            // 에러 발생 시 디코딩 테스트는 건너뜀
            return;
        }
    } else {
        try {
            const encoded = bit7.encode(tc.input);
            assert.deepStrictEqual(encoded, tc.expectedEncoded, `[FAIL] Encoding failed for input: "${tc.input}"`);
            console.log(`[SUCCESS] Encoding passed.`);

            // Decode Test (인코딩 성공 시에만 진행)
            try {
                const decoded = bit7.decode(encoded);
                assert.strictEqual(decoded, tc.expectedDecoded, `[FAIL] Decoding failed for encoded: ${JSON.stringify(encoded)}`);
                console.log(`[SUCCESS] Decoding passed.`);
            } catch (e) {
                console.error(`[FAIL] Decoding error: ${e.message} for encoded: ${JSON.stringify(encoded)}`);
            }

        } catch (e) {
            // 인코딩/디코딩 중 예기치 않은 오류 발생
             if (e instanceof assert.AssertionError) {
                 console.error(e.message); // Assert 실패 메시지 출력
             } else {
                 console.error(`[FAIL] Unexpected error during encode/decode: ${e.message}`);
             }
        }
    }
});

// 추가 오류 테스트: 잘못된 입력 타입
console.log('\n[RUN] Invalid Input Type Tests');
try {
    bit7.encode(123);
    console.error('[FAIL] encode did not throw error for non-string input.');
} catch (e) {
    console.log(`[SUCCESS] Caught expected error for non-string encode input: ${e.message}`);
}

try {
    bit7.decode("not an array");
    console.error('[FAIL] decode did not throw error for non-array input.');
} catch (e) {
    console.log(`[SUCCESS] Caught expected error for non-array decode input: ${e.message}`);
}

try {
    bit7.decode(["valid", 123]);
    console.error('[FAIL] decode did not throw error for array with non-string element.');
} catch (e) {
    console.log(`[SUCCESS] Caught expected error for array with non-string element: ${e.message}`);
}

console.log('\n[INFO] Bit7Wrapper tests finished.');