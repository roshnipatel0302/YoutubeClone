import jwt from "jsonwebtoken";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandle } from "../utils/asyncHandler.js";
import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiErrror.js ";

export const verifyJWT = asyncHandle(async (req, res, next) => {
    try {
        console.log("🔹 Headers:", req.headers); // ✅ Debugging
        console.log("🔹 Cookies:", req.cookies); // ✅ Debugging
        const token = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer", "")
        console.log("🔍 Extracted Token:", token);
        if (!token) {
            console.error("❌ No Token Provided!");
            throw new ApiResponse(401, "UnAuthorized Requset")

        }

        const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET)
        console.log("✅ Decoded Token:", decoded);

        const user = await User.findOne({ email: decodedToken.email }).select("-password -refreshToken");
        console.log("✅ Decoded User:", user);

        if (!user) {
            onsole.error("❌ Token Verification Error:", error);
            throw new ApiError(401, "Invalid Access Token...")
        }
        req.user = user;
        next()
    }
    catch (error) {
        throw new ApiError(404, "Invalid Access Token...")
    }
})