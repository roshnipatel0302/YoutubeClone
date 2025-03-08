import { asyncHandle } from "../utils/asyncHandler.js";

const registerUser = asyncHandle(async (req, res) => {
    console.log("🟢 Register User Controller Hit!");  // Debugging ke liye

    return res.status(200).json({
        message: "Ok"
    });
});

export { registerUser };
