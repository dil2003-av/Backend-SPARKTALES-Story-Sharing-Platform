"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const ReadFunController_1 = require("../controllers/ReadFunController");
const router = express_1.default.Router();
router.get("/", ReadFunController_1.getReadFunPosts);
router.get("/post/:id", ReadFunController_1.getSingleReadFunPost);
router.post("/post/:id/view", ReadFunController_1.incrementReadFunViews);
router.get("/trending", ReadFunController_1.getTrendingReadFun);
router.get("/category/:category", ReadFunController_1.getCategoryReadFun);
router.get("/search", ReadFunController_1.searchReadFun);
router.post("/test-data/create", ReadFunController_1.createTestReadFunPosts);
exports.default = router;
