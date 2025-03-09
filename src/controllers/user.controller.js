import { asyncHandle } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiErrror.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken";


const generateAccessAndRefreshToken = async (userId) => {
    try {
        const user = await User.findById(userId);
        const accessToken = user.generateAccessToken()
        const refreshToken = user.generateRefreshToken()

        user.refreshToken = refreshToken
        await user.save({ validateBeforeSave: false })

        return { accessToken, refreshToken }
    }
    catch (error) {
        throw new ApiError(500, "Internal Server Error")
    }
}

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
    if (res.file && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0) {
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
        username: username.toLowerCase()
    })

    const createdUser = await User.findById(user._id).select("-password -refreshToken")
    if (!createdUser) {
        throw new ApiError(500, "Something Went Wrong...")
    }
    console.log("createdUser", createdUser)
    return res.status(201).json(
        new ApiResponse(200, createdUser, "User Registered Successfully...")
    );
});

const loginUser = asyncHandle(async (req, res) => {
    console.log("🟢 Login route hit!");
    //req body
    //username or email 
    //find the user
    //check password
    //accesss and refresh token
    //send cookies
    //send response

    const { email, username, password } = req.body
    console.log("🔹 Received data:", { email, username });
    if (!username && !email) {
        console.log("❌ Missing username or email");
        throw new ApiError(400, "Username or Password is required..")
    }
    const user = await User.findOne({
        $or: [{ username }, { email }]
    })
    console.log("🔹 User found:", user);

    if (!user) {
        console.log("❌ User does not exist");
        throw new ApiError(404, "User does not exist")
    }
    const isPasswordValid = await user.isPasswordCorrect(password)
    console.log("🔹 Password valid:", isPasswordValid);

    if (!isPasswordValid) {
        console.log("❌ Invalid password");
        throw new ApiError(401, "Password is not valid")
    }

    const { accessToken, refreshToken } = await generateAccessAndRefreshToken(user._id)
    console.log("🔹 Tokens generated:", { accessToken, refreshToken });

    const loggedIn = await User.findById(user._id).select("-password -refreshToken")
    console.log("🔹 Logged-in user details:", loggedIn);

    const options = {
        httpOnly: true,
        secure: true
    }
    console.log("✅ Login successful! Sending response...");
    return res.status(200).cookie("accessToken", accessToken, options).cookie("refreshToken", refreshToken, options).json(
        new ApiResponse(200, { user: loggedIn, accessToken, refreshToken }, "User LoggedIn SuccessFully")
    )



});

const logOutUser = asyncHandle(async (req, res) => {
    //find user

    await User.findByIdAndDelete(req.User._id, { $set: { refreshToken: undefined } }, {
        new: true
    })

    const options = {
        httpOnly: true,
        secure: true
    }
    return res.status(200).clearCookie("accessToken", options).clearCookie("refreshToken", options).json(new ApiResponse(200, {}, "User Logged Out.."))

})

const refreshAccessToken = asyncHandle(async (req, res) => {
    const incomingResponseToken = req.cookies.refreshToken || req.body.refreshToken
    if (!incomingResponseToken) {
        throw new ApiError(400, "Unauthorized Request..")
    }
    try {
        const decodedToken = jwt.verify(incomingResponseToken, process.env.REFRESH_TOKEN_SECRET);
        const user = await User.findById(decodedToken?._id)
        if (!user) {
            throw new ApiError(401, "Invalid Refresh Token....")
        }
        if (incomingResponseToken !== user?.refreshToken) {
            throw new ApiError(401, "refresh Token Expired....")
    
        }
    
        const option = {
            httpOnly: true,
            secure: true
        }
    
        const { accessToken, newrefreshToken } = await generateAccessAndRefreshToken(user?._id)
        return res.status(200).cookie("accessToken", accessToken).
            cookie("refreshToken", newrefreshToken).json(new ApiResponse(200, { accessToken, refreshToken: newrefreshToken }, "Acccess Token Refreshed...."))
    } catch (error) {
      throw new ApiError(401,"Invalid Refresh Token")  
    }
})

export { registerUser, loginUser, logOutUser , refreshAccessToken}
