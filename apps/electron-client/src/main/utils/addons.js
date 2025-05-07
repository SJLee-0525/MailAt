// src/utils/addons.js
import path from 'path';

// 애드온 모듈 경로 설정
const addonPath = path.join(__dirname, '../../build/Release/mailio_addon.node');
const addonModule = require(addonPath);

// 애드온 모듈 내보내기
export const SmtpWrapper = addonModule.SmtpWrapper;
export const ImapWrapper = addonModule.ImapWrapper;

// 다른 래퍼들도 필요에 따라 추가
export const Base64Wrapper = addonModule.Base64Wrapper;
export const Bit7Wrapper = addonModule.Bit7Wrapper;
export const Bit8Wrapper = addonModule.Bit8Wrapper;

export default addonModule;