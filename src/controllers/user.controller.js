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
        throw new ApiError(401, "Invalid Refresh Token")
    }
})

const changeCurrentPassword = asyncHandle(async (req, res) => {
    const { oldPassword, newPassword } = req.body
    const user = await User.findById(req.user?._id);
    const isPasswordCorrect = await user.isPasswordCorrect(oldPassword)
    if (!isPasswordCorrect) {
        throw new ApiError(400, "Old Password is incorrect")
    }

    user.password = newPassword
    await user.save({ validateBeforeSave: false })
    return res.status(200).json(new ApiResponse(200, {}, "Password Changed Successfully"))
})

const getCurrentUser = asyncHandle(async (req, res) => {
    return res.status(200).json(new ApiResponse(200, req.user, "Current User Fetch Successfully"))

})

const updateAccountDetails = asyncHandle(async (req, res) => {
    const { fullname, email } = req.body;
    if (!fullname || !email) {
        throw new ApiError(400, "ALL Fields Are required..")
    }

    const user = User.findByIdAndUpdate(req.user?._id, {
        $set: { fullname, email }
    }, { new: true }).select("-password")

    return res.status(200).json(new ApiResponse(200, user, "Account Details Updated Successfully"))

})

const updateUserAvatar = asyncHandle(async (req, res) => {
    const avatarLocalPath = req.file?.path
    if (!avatarLocalPath) {
        throw new ApiError(400, "Avatar File is missing..")
    }

    const avatar = await uploadOnCloudinary(avatarLocalPath)
    if (!avatar.url) {
        throw new ApiError(400, "error while uploading avatar")
    }

    const user = await User.findByIdAndUpdate(req.user?._id, { $set: { avatar: avatar.url } }, { new: true }).select("-password ")

    return res.status(200).json(new ApiResponse(200, user, "Updated Successfully"))

})
const updateUserCoverImage = asyncHandle(async (req, res) => {
    const coverImageLocalPath = req.file?.path
    if (!coverImageLocalPath) {
        throw new ApiError(400, "CoverImage File is missing..")
    }

    const coverImage = await uploadOnCloudinary(coverImageLocalPath)
    if (!avatar.url) {
        throw new ApiError(400, "error while uploading coverImage")
    }

    const user = await User.findByIdAndUpdate(req.user?._id, { $set: { coverImage: coverImage.url } }, { new: true }).select("-password ")

    return res.status(200).json(new ApiResponse(200, user, "Updated Successfully"))

})

const getUserChannelProfile = asyncHandle(async (req, res) => {
    const { username } = req.params;
    if (!username?.trim()) {
        throw new ApiError(400, "Username is required")
    }

    const channel = await User.aggregate([
        { $match: { username: username } },
        {
            $lookup: {
                from: "subscriptions",
                localField: "_id",
                foreignField: "channel",
                as: "subscribers"
            }
        },
        {
            $lookup: {
                from: "subscriptions",
                localField: "_id",
                foreignField: "subscriber",
                as: "subscribersTo"
            }
        },
        {
            $addFields: {
                subscriberCount: { $size: "$subscribers" },
                subscribersToCount: { $size: "$subscribersTo" },
                isSubscribed: {
                    $cond: {
                        if: { $in: [req.user?._id, "$subscribers.subscriber"] },
                        then: true,
                        else: false
                    }
                }
            }
        }, {
            $project: { fullname: 1, username: 1, subscriberCount: 1, isSubscribed: 1, avatar: 1, coverImage: 1 }
        }
    ]);
    console.log("🔹 Channel:", channel);
    if (!channel?.length) {
        throw new ApiError(404, "Channel Not Found")
    }

    return res.status(200).json(new ApiResponse(200, channel[0], "Channel Profile Fetched Successfully"))


})

const getWathHistory = asyncHandle(async (req, res) => {
    const user = await User.aggregate([
        {
            $match: { _id: new mongoose.Types.ObjectId(req.user._id) }
        }, {
            $lookup: {
                from: "videos",
                localField: "watchHistory",
                foreignField: "_id",
                as: "watchHistory",
                pipeline: [
                    {
                    $lookup: {
                        from: "users",
                        localField: "owner",
                        foreignField: "_id",
                        as: "owner",
                        pipeline:[{
                            $project:{fullname:1,username:1,avatar:1}
                        }]
                    }
                },
                {
                    $addFields:{
                        owner:{
                            $first:"$owner"
                        }
                    }
                }
            ]
            }
        }
    ])

    return res.status.json(new ApiResponse(200, user[0].watchHistory, "Watch History Fetched Successfully"));

    
})



export { registerUser, loginUser, logOutUser, refreshAccessToken, changeCurrentPassword, getCurrentUser, updateAccountDetails, updateUserAvatar, updateUserCoverImage, getUserChannelProfile, getWathHistory }
