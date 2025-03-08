import { asyncHandle } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiErrror.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";

const registerUser = asyncHandle(async (req, res) => {
    console.log("🟢 Register User Controller Hit!");  // Debugging ke liye

    //get user Details from frontend
    //validation - not empty
    //check if user already exists : username,email
    //check for the images and avatar
    //upload them cloudinary
    //create user object -create entry in db
    //remove password and refresh token field 
    //check for user creation
    //return response

    const { fullname, email, username, password, } = req.body
    // ✅ Saara data console pe print karega
    console.log("🔹 Received Data:", req.body);

    // if(fullname === ""){
    //   throw new ApiError(400,"Fullname is required")
    // }

    if ([fullname, email, username, password].some((field) => field?.trim() === "")) {
        console.log("❌ Validation Failed: Empty Fields");
        throw new ApiError(400, "ALL Fields are required")
    }

    console.log("🔎 Checking if user already exists...");
    const existedUser = await User.findOne({ $or: [{ username }, { email }] })
    if (existedUser) {
        console.log("❌ User already exists:", existedUser);
        throw new ApiError(409, "User with email or username exist")
    }
    console.log("📁 Checking file paths...");
    const avatarLocalPath = req.files?.avatar[0]?.path;
    // const coverLocalPath =  req.files?.coverImage[0]?.path;

    if (!avatarLocalPath) {
        console.log("❌ Avatar file missing");
        throw new ApiError(400, "Avatar file is required....")
    }

    let coverImageLocalPath;
    if(res.file && Array.isArray(req.files.coverImage)&& req.files.coverImage.length > 0)
    {
        coverImageLocalPath = req.files.coverImage[0].path
    }

    const avatar = await uploadOnCloudinary(avatarLocalPath)
    console.log("✅ Avatar Uploaded:", avatar);
    const coverImage = await uploadOnCloudinary(coverImageLocalPath)
    console.log("✅ Cover Image Uploaded:", coverImage);

    if (!avatar) {
        onsole.log("❌ Avatar Upload Failed");
        throw new ApiError(400, "Avatar is required....")
    }

    console.log("✅ User Registration Successful!");


    const user = await User.create({
        fullname,
        avatar: avatar.url,
        coverImage: coverImage.url || "",
        email,
        password,
        username:username.toLowerCase()
    })

    const createdUser = await User.findById(user._id).select("-password -refreshToken")
    if (!createdUser) {
        throw new ApiError(500, "Something Went Wrong...")
    }
    console.log("createdUser",createdUser)
    return res.status(201).json(
        new ApiResponse(200, createdUser, "User Registered Successfully...")
    );
});

export { registerUser };
