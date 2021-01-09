"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function validateRegister(options) {
    if (!options.email.includes('@')) {
        return [
            {
                field: 'email',
                message: 'invalid email'
            }
        ];
    }
    if (options.username.length <= 2) {
        return [
            {
                field: 'username',
                message: 'invalid username length'
            }
        ];
    }
    if (options.username.includes('@')) {
        return [
            {
                field: 'username',
                message: 'username cannot include "@" symbol'
            }
        ];
    }
    if (options.password.length <= 2) {
        return [
            {
                field: 'password',
                message: 'invalid password length'
            }
        ];
    }
    return null;
}
exports.default = validateRegister;
//# sourceMappingURL=validateRegister.js.map