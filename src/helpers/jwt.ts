import jsonwebtoken from "jsonwebtoken";
import { UserModel } from "../database";

export const generateToken = (payload: any) => {
    return jsonwebtoken.sign(payload, process.env.JWT_TOKEN_SECRET as string, { expiresIn: "30d" });
}

export const verifyToken = async (req: any, res: any, next: any) => {
    try {
        let token = req.headers.authorization;
        if (!token) return res.status(401).json({ message: "No token provided" });
        if (token.startsWith("Bearer ")) {
            token = token.slice(7, token.length).trim();
        }
        const decodedToken: any = jsonwebtoken.verify(token, process.env.JWT_TOKEN_SECRET as string);

        const user: any = await UserModel.findOne({ _id: decodedToken.id });
        if (!user) return res.status(401).json({ message: "User Not Found" });

        if (user.activeSession) {
            const session = user.activeSession.find((session: any) => session.token === token);
            if (!session) {
                // return res.status(401).json({ message: "Your session has expired Login again" });
                // If session management is strict, un-comment above. 
                // For now, proceeding as the code was commented out originally.
            }
        }

        req.headers.user = user;
        next();
    } catch (error: any) {
        console.error(error);
        return res.status(401).json({ message: "Unauthorized", error: error.message });
    }
}