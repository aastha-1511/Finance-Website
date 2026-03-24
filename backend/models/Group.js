import mongoose from 'mongoose';
import crypto from 'crypto';

const messageSchema = new mongoose.Schema({
    user: { type: String, required: true },
    text: { type: String, required: true },
    time: { type: String }
});

const groupSchema = new mongoose.Schema({
    name: { type: String, required: true, unique: true },
    description: { type: String, default: '' },
    creator: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    members: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    messages: [messageSchema],
    isPrivate: { type: Boolean, default: false },
    inviteCode: { type: String, default: () => crypto.randomBytes(4).toString('hex') }
}, { timestamps: true });

const Group = mongoose.model('Group', groupSchema);
export default Group;
