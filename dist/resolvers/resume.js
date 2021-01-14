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
exports.ResumeResolver = void 0;
const apollo_server_express_1 = require("apollo-server-express");
const type_graphql_1 = require("type-graphql");
const Resume_1 = require("../entities/Resume");
const AWS_1 = require("../utils/AWS");
const dotenv_1 = __importDefault(require("dotenv"));
const isAuth_1 = require("../middleware/isAuth");
const User_1 = require("../entities/User");
dotenv_1.default.config();
class ResumeResolver {
    getResumeByUserId(userId) {
        return Resume_1.Resume.findOne({ ownerId: userId });
    }
    uploadResume(resume, { req }) {
        return __awaiter(this, void 0, void 0, function* () {
            const userId = req.session.userId;
            const { createReadStream, filename, mimetype } = yield resume;
            const bucketPath = `${userId}/resume/`;
            const resumeName = `${Date.now()}-${filename}`;
            const params = {
                Bucket: process.env.AWS_BUCKET_NAME,
                Body: createReadStream(),
                ContentType: mimetype,
                Key: bucketPath + resumeName,
                ACL: 'public-read'
            };
            console.log('params ContentType', params.ContentType);
            const { Location } = yield AWS_1.s3.upload(params, (err, data) => {
                if (err) {
                    console.log(err);
                    throw err;
                }
                console.log(`File uploaded successfully. ${data.Location}`);
            }).promise();
            const user = yield User_1.User.findOne({ id: userId }, { relations: ['resume'] });
            if (user === null || user === void 0 ? void 0 : user.resume) {
                console.log('user has resume already', user.resume);
                user.resume.link = Location;
                const resumeId = user.resume.id;
                Resume_1.Resume.update(resumeId, { link: Location });
                return user.resume;
            }
            return Resume_1.Resume.create({ link: Location, user }).save();
        });
    }
}
__decorate([
    type_graphql_1.Query(() => Resume_1.Resume, { nullable: true }),
    __param(0, type_graphql_1.Arg('userId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", Promise)
], ResumeResolver.prototype, "getResumeByUserId", null);
__decorate([
    type_graphql_1.Mutation(() => Resume_1.Resume),
    type_graphql_1.UseMiddleware(isAuth_1.isAuth),
    __param(0, type_graphql_1.Arg('resume', () => apollo_server_express_1.GraphQLUpload)),
    __param(1, type_graphql_1.Ctx()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], ResumeResolver.prototype, "uploadResume", null);
exports.ResumeResolver = ResumeResolver;
//# sourceMappingURL=resume.js.map