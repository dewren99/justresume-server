"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.splitOnUpperCase = void 0;
function splitOnUpperCase(string) {
    var _a;
    return (_a = string.match(/[A-Z][a-z]+/g)) !== null && _a !== void 0 ? _a : [string];
}
exports.splitOnUpperCase = splitOnUpperCase;
//# sourceMappingURL=splitOnUpperCase.js.map