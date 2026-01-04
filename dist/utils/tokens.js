"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.signRefreshToken = exports.signAccessToken = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const JWT_SECRET = process.env.JWT_SECRET;
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET;
const signAccessToken = (user) => {
    return jsonwebtoken_1.default.sign({ sub: user._id.toString(), roles: user.roles }, JWT_SECRET, {
        expiresIn: "30m"
    });
};
exports.signAccessToken = signAccessToken;
const signRefreshToken = (user) => {
    return jsonwebtoken_1.default.sign({
        sub: user._id.toString()
    }, JWT_REFRESH_SECRET, {
        expiresIn: "7d"
    });
};
exports.signRefreshToken = signRefreshToken;
