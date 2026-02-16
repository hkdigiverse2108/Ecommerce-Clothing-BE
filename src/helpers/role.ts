import { NextFunction, Request, Response } from "express";

export const roleCheck = (role: string[]) => {
    try {
        return (req: Request, res: Response, next: NextFunction) => {
            if (!req.headers.user || !role.includes(req.headers.user.accountType)) {
                return res.status(403).json({ message: "Forbidden" });
            }
            next();
        }
    } catch (error) {
        console.log(error);
    }
}