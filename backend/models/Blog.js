import mongoose from 'mongoose';

const commentSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    text: { type: String, required: true },
    date: { type: Date, default: Date.now }
});

const blogSchema = new mongoose.Schema({
    author: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'User'
    },
    title: { type: String, required: true },
    content: { type: String, required: true },
    tags: [String],
    comments: [commentSchema],
}, {
    timestamps: true
});

const Blog = mongoose.model('Blog', blogSchema);

export default Blog;
