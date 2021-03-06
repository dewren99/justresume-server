"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserResolver = void 0;
const argon2_1 = __importDefault(require("argon2"));
const pretty_ms_1 = __importDefault(require("pretty-ms"));
const capitalizeFirstLetter_1 = require("../utils/capitalizeFirstLetter");
const splitOnUpperCase_1 = require("../utils/splitOnUpperCase");
const type_graphql_1 = require("type-graphql");
const uuid_1 = require("uuid");
const constants_1 = require("../constants");
const User_1 = require("../entities/User");
const sendEmail_1 = __importDefault(require("../utils/sendEmail"));
const validateRegister_1 = __importDefault(require("../utils/validateRegister"));
const RegisterUserInput_1 = require("./RegisterUserInput");
let FieldError = class FieldError {
};
__decorate([
    type_graphql_1.Field(),
    __metadata("design:type", String)
], FieldError.prototype, "field", void 0);
__decorate([
    type_graphql_1.Field(),
    __metadata("design:type", String)
], FieldError.prototype, "message", void 0);
FieldError = __decorate([
    type_graphql_1.ObjectType()
], FieldError);
let UserResponse = class UserResponse {
};
__decorate([
    type_graphql_1.Field(() => [FieldError], { nullable: true }),
    __metadata("design:type", Array)
], UserResponse.prototype, "errors", void 0);
__decorate([
    type_graphql_1.Field(() => User_1.User, { nullable: true }),
    __metadata("design:type", User_1.User)
], UserResponse.prototype, "user", void 0);
UserResponse = __decorate([
    type_graphql_1.ObjectType()
], UserResponse);
let UserResolver = class UserResolver {
    forgotPassword(email, { redis }) {
        return __awaiter(this, void 0, void 0, function* () {
            const user = yield User_1.User.findOne({
                where: { email: email }
            });
            if (!user) {
                return true;
            }
            const token = uuid_1.v4();
            yield redis.set(constants_1.FORGOT_PASSWORD_PREFIX + token, user.id, 'ex', constants_1.FORGOT_PASSWORD_LINK_EXPIRATION_DATE);
            const resetPasswordLink = `<a href="http://localhost:3000/change-password/${token}">Reset password (valid for ${pretty_ms_1.default(constants_1.FORGOT_PASSWORD_LINK_EXPIRATION_DATE, { verbose: true })})</a>`;
            sendEmail_1.default(email, resetPasswordLink);
            return true;
        });
    }
    changePassword(token, newPassword, { redis, req }) {
        return __awaiter(this, void 0, void 0, function* () {
            if (newPassword.length <= 2) {
                return {
                    errors: [
                        {
                            field: 'newPassword',
                            message: 'invalid password length'
                        }
                    ]
                };
            }
            const key = constants_1.FORGOT_PASSWORD_PREFIX + token;
            const userId = yield redis.get(key);
            if (!userId) {
                return {
                    errors: [
                        {
                            field: 'token',
                            message: 'token expired'
                        }
                    ]
                };
            }
            const userIdInt = parseInt(userId);
            const user = yield User_1.User.findOne(userIdInt);
            if (!user) {
                return {
                    errors: [
                        {
                            field: 'token',
                            message: 'user no longer exists'
                        }
                    ]
                };
            }
            yield User_1.User.update({ id: userIdInt }, { password: yield argon2_1.default.hash(newPassword) });
            yield redis.del(key);
            req.session.userId = user.id;
            return { user };
        });
    }
    setFullName(text, { req }) {
        return __awaiter(this, void 0, void 0, function* () {
            const { userId } = req.session;
            let user = yield User_1.User.findOne(userId);
            if (!user) {
                return ({
                    errors: [
                        {
                            field: 'token',
                            message: 'user no longer exists'
                        }
                    ]
                });
            }
            const fullName = text.split(' ');
            if (fullName.length < 2) {
                return ({
                    errors: [
                        {
                            field: 'fullName',
                            message: 'First or last name is missing'
                        }
                    ]
                });
            }
            const firstName = fullName.filter((_name, i, nameArr) => { var _a; return (_a = nameArr.length - 1 !== i) !== null && _a !== void 0 ? _a : false; }).join(' ');
            const lastName = fullName[fullName.length - 1];
            user.firstName = firstName;
            user.lastName = lastName;
            yield User_1.User.update({ id: userId }, { firstName: firstName, lastName: lastName });
            return { user };
        });
    }
    me({ req }) {
        if (!req.session.userId) {
            return null;
        }
        return User_1.User.findOne(req.session.userId);
    }
    getUser(username, { req }) {
        const userId = req.session.userId;
        if (username) {
            console.log('HERE');
            return User_1.User.findOne({ username: username }, { relations: ['resume', 'profile'] });
        }
        if (!userId) {
            return null;
        }
        return User_1.User.findOne({ id: userId }, { relations: ['resume', 'profile'] });
    }
    register(options, { req }) {
        return __awaiter(this, void 0, void 0, function* () {
            const errors = validateRegister_1.default(options);
            if (errors) {
                return { errors };
            }
            const hashedPassword = yield argon2_1.default.hash(options.password);
            let user;
            try {
                user = yield User_1.User.create(Object.assign(Object.assign({}, options), { password: hashedPassword })).save();
            }
            catch (e) {
                if (e.code === '23505') {
                    const { detail } = e;
                    const field = detail.slice(detail.indexOf('(') + 1, detail.indexOf(')'));
                    console.log(detail, field);
                    return {
                        errors: [
                            {
                                field: field,
                                message: `${capitalizeFirstLetter_1.capitalizeFirstLetter(splitOnUpperCase_1.splitOnUpperCase(field).join(' ').toLowerCase())} has already been taken`
                            }
                        ],
                    };
                }
                console.log('error creating user:', e.message);
            }
            req.session.userId = user.id;
            return { user };
        });
    }
    login(usernameOrEmail, password, { req }) {
        return __awaiter(this, void 0, void 0, function* () {
            const user = yield User_1.User.findOne({
                where: [
                    { username: usernameOrEmail },
                    { email: usernameOrEmail }
                ],
            });
            if (!user) {
                return {
                    errors: [
                        {
                            field: 'username',
                            message: 'that username does not exist'
                        }
                    ]
                };
            }
            const valid = yield argon2_1.default.verify(user.password, password);
            if (!valid) {
                return {
                    errors: [
                        {
                            field: 'password',
                            message: 'incorrect password'
                        }
                    ]
                };
            }
            req.session.userId = user.id;
            return { user };
        });
    }
    logout({ req, res }) {
        return new Promise(resolve => req.session.destroy((err) => {
            res.clearCookie(constants_1.COOKIE_NAME);
            if (err) {
                console.log(err);
                resolve(false);
                return;
            }
            resolve(true);
        }));
    }
};
__decorate([
    type_graphql_1.Mutation(() => Boolean),
    __param(0, type_graphql_1.Arg('email')),
    __param(1, type_graphql_1.Ctx()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], UserResolver.prototype, "forgotPassword", null);
__decorate([
    type_graphql_1.Mutation(() => UserResponse),
    __param(0, type_graphql_1.Arg('token')),
    __param(1, type_graphql_1.Arg('newPassword')),
    __param(2, type_graphql_1.Ctx()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", Promise)
], UserResolver.prototype, "changePassword", null);
__decorate([
    type_graphql_1.Mutation(() => UserResponse),
    __param(0, type_graphql_1.Arg('text')),
    __param(1, type_graphql_1.Ctx()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], UserResolver.prototype, "setFullName", null);
__decorate([
    type_graphql_1.Query(() => User_1.User, { nullable: true }),
    __param(0, type_graphql_1.Ctx()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], UserResolver.prototype, "me", null);
__decorate([
    type_graphql_1.Query(() => User_1.User, { nullable: true }),
    __param(0, type_graphql_1.Arg('username', { nullable: true })),
    __param(1, type_graphql_1.Ctx()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], UserResolver.prototype, "getUser", null);
__decorate([
    type_graphql_1.Mutation(() => UserResponse),
    __param(0, type_graphql_1.Arg('options')),
    __param(1, type_graphql_1.Ctx()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [RegisterUserInput_1.RegisterUserInput, Object]),
    __metadata("design:returntype", Promise)
], UserResolver.prototype, "register", null);
__decorate([
    type_graphql_1.Mutation(() => UserResponse),
    __param(0, type_graphql_1.Arg('usernameOrEmail')),
    __param(1, type_graphql_1.Arg('password')),
    __param(2, type_graphql_1.Ctx()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", Promise)
], UserResolver.prototype, "login", null);
__decorate([
    type_graphql_1.Mutation(() => Boolean),
    __param(0, type_graphql_1.Ctx()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], UserResolver.prototype, "logout", null);
UserResolver = __decorate([
    type_graphql_1.Resolver(User_1.User)
], UserResolver);
exports.UserResolver = UserResolver;
//# sourceMappingURL=user.js.map