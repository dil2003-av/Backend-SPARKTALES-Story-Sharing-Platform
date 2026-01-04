"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authenticate = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const JWT_SECRET = process.env.JWT_SECRET;
const authenticate = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        return res.status(401).json({ message: "No token provided" });
    }
    // Bearer dgcfhvgjygukhiluytkuy
    const token = authHeader.split(" ")[1]; // ["Bearer", "dgcfhvgjygukhiluytkuy"]
    try {
        const payload = jsonwebtoken_1.default.verify(token, JWT_SECRET);
        req.user = payload;
        next();
    }
    catch (err) {
        console.error(err);
        res.status(401).json({
            message: "Invalid or expire token"
        });
    }
};
exports.authenticate = authenticate;
// res, next - return
