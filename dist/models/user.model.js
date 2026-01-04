"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.User = exports.Status = exports.Role = void 0;
const mongoose_1 = __importStar(require("mongoose"));
var Role;
(function (Role) {
    Role["ADMIN"] = "ADMIN";
    Role["AUTHOR"] = "AUTHOR";
    Role["USER"] = "USER";
})(Role || (exports.Role = Role = {}));
var Status;
(function (Status) {
    Status["NONE"] = "NONE";
    Status["PENDING"] = "PENDING";
    Status["APPROVED"] = "APPROVED";
    Status["REJECTED"] = "REJECTED";
})(Status || (exports.Status = Status = {}));
const userSchema = new mongoose_1.Schema({
    email: { type: String, unique: true, lowercase: true, required: true },
    firstname: { type: String, required: true },
    lastname: { type: String, required: true },
    password: { type: String, required: true },
    roles: { type: [String], enum: Object.values(Role), default: [Role.USER] },
    approved: {
        type: String,
        enum: Object.values(Status),
        default: Status.NONE
    },
    phone: { type: String },
    address: { type: String },
    avatarUrl: { type: String },
    // OTP for password reset
    otp: { type: String },
    otpExpires: { type: Date }
}, { timestamps: true });
exports.User = mongoose_1.default.model("User", userSchema);
