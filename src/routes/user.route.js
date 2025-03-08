import { Router } from "express";
import { registerUser } from "../controllers/user.controller.js";
import { upload } from "../middlewares/multer.middleware.js";

const router = Router();

console.log("🟡 Registering /users/register route...");

router.route("/register").post(upload.fields([{ name: "avatar", maxCount: 1 }, { name: "coverImage", maxCount: 1 }]), registerUser);

console.log("✅ Route Registered: /users/register");

export default router;
