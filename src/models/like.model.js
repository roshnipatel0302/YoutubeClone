import mongoose from 'mongoose';


const { Schema } = mongoose;

const LikeSchema = new Schema({
    Comment: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
      video: {
        type: Schema.Types.ObjectId,
        ref: 'Video',
    },
    tweets: {
        type: Schema.Types.ObjectId,
        ref: 'Tweets',
        required: true
    },
    likedBy: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
},{timestamps: true});

export default mongoose.model('Like', LikeSchema);