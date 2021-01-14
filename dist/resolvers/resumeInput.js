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
Object.defineProperty(exports, "__esModule", { value: true });
exports.ResumeInput = void 0;
const stream_1 = require("stream");
const type_graphql_1 = require("type-graphql");
let ResumeInput = class ResumeInput {
};
__decorate([
    type_graphql_1.Field(() => stream_1.Stream),
    __metadata("design:type", stream_1.Stream)
], ResumeInput.prototype, "stream", void 0);
__decorate([
    type_graphql_1.Field(),
    __metadata("design:type", String)
], ResumeInput.prototype, "filename", void 0);
__decorate([
    type_graphql_1.Field(),
    __metadata("design:type", String)
], ResumeInput.prototype, "mimetype", void 0);
__decorate([
    type_graphql_1.Field(),
    __metadata("design:type", String)
], ResumeInput.prototype, "encoding", void 0);
ResumeInput = __decorate([
    type_graphql_1.InputType()
], ResumeInput);
exports.ResumeInput = ResumeInput;
//# sourceMappingURL=ResumeInput.js.map