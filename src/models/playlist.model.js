const mongoose = require('mongoose');
import mongoose from 'mongoose';

const Schema = mongoose.Schema;


const PlaylistSchema = new Schema({
    name: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: false
    },
    videos: [{
        type: Schema.Types.ObjectId,
        ref: 'Video'
    }],
    owner: {
        type: Schema.Types.ObjectId,
        ref: 'User',
    }
},{timestamps: true});

export default mongoose.model('Playlist', PlaylistSchema);