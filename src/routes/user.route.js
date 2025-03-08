import { Router } from "express";
import { registerUser } from "../controllers/user.controller.js";

const router = Router();

console.log("🟡 Registering /users/register route...");

router.route("/register").post(registerUser);

console.log("✅ Route Registered: /users/register");

export default router;
