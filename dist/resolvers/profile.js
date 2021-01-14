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
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProfileResolver = void 0;
const apollo_server_express_1 = require("apollo-server-express");
const type_graphql_1 = require("type-graphql");
const Profile_1 = require("../entities/Profile");
const User_1 = require("../entities/User");
const isAuth_1 = require("../middleware/isAuth");
const AWS_1 = require("../utils/AWS");
let ProfileResolver = class ProfileResolver {
    setAboutMe(text, { req }) {
        return __awaiter(this, void 0, void 0, function* () {
            const userId = req.session.userId;
            let user = yield User_1.User.findOne(userId, { relations: ['profile'] });
            if (!user) {
                return null;
            }
            if (user === null || user === void 0 ? void 0 : user.profile) {
                console.log('user already has profile', user.profile);
                user.profile.aboutMe = text;
                const profileId = user.profile.id;
                Profile_1.Profile.update(profileId, { aboutMe: text });
                return user.profile;
            }
            return Profile_1.Profile.create({ aboutMe: text, user }).save();
        });
    }
    setProfileImage(image, { req }) {
        return __awaiter(this, void 0, void 0, function* () {
            const userId = req.session.userId;
            let user = yield User_1.User.findOne(userId, { relations: ['profile'] });
            if (!user) {
                return null;
            }
            const { createReadStream, filename, mimetype } = yield image;
            const bucketPath = `${userId}/profileImage/`;
            const imageName = `${Date.now()}-${filename}`;
            const params = {
                Bucket: process.env.AWS_BUCKET_NAME,
                Body: createReadStream(),
                ContentType: mimetype,
                Key: bucketPath + imageName,
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
            if (user === null || user === void 0 ? void 0 : user.profile) {
                console.log('user already has profile', user.profile);
                user.profile.profileImageLink = Location;
                const profileId = user.profile.id;
                Profile_1.Profile.update(profileId, { profileImageLink: Location });
                return user.profile;
            }
            return Profile_1.Profile.create({ profileImageLink: Location, user }).save();
        });
    }
    profile(userId) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield Profile_1.Profile.findOne({
                relations: ['user'],
                where: (qb) => {
                    qb.where('Profile__user.id = :id', { id: userId });
                }
            });
        });
    }
};
__decorate([
    type_graphql_1.Mutation(() => Profile_1.Profile),
    type_graphql_1.UseMiddleware(isAuth_1.isAuth),
    __param(0, type_graphql_1.Arg('text')),
    __param(1, type_graphql_1.Ctx()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], ProfileResolver.prototype, "setAboutMe", null);
__decorate([
    type_graphql_1.Mutation(() => Profile_1.Profile),
    type_graphql_1.UseMiddleware(isAuth_1.isAuth),
    __param(0, type_graphql_1.Arg('image', () => apollo_server_express_1.GraphQLUpload)),
    __param(1, type_graphql_1.Ctx()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], ProfileResolver.prototype, "setProfileImage", null);
__decorate([
    type_graphql_1.Query(() => Profile_1.Profile, { nullable: true }),
    __param(0, type_graphql_1.Arg('userId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", Promise)
], ProfileResolver.prototype, "profile", null);
ProfileResolver = __decorate([
    type_graphql_1.Resolver(Profile_1.Profile)
], ProfileResolver);
exports.ProfileResolver = ProfileResolver;
//# sourceMappingURL=profile.js.map