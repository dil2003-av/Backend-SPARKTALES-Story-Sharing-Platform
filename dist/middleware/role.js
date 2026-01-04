"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireRole = void 0;
const requireRole = (roles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ message: "Unauthorized" });
        }
        const hasRole = roles.some((role) => req.user.roles.includes(role));
        if (!hasRole) {
            return res.status(403).json({
                message: `Require ${roles} role`
            });
        }
        next();
    };
};
exports.requireRole = requireRole;
// [].includes
