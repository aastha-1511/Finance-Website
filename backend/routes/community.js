import express from 'express';
import Group from '../models/Group.js';
import Blog from '../models/Blog.js';
import User from '../models/User.js';
import jwt from 'jsonwebtoken';

const router = express.Router();

const protect = async (req, res, next) => {
    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            token = req.headers.authorization.split(' ')[1];
            const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret123');
            req.user = await User.findById(decoded.id).select('-password');
            next();
        } catch {
            res.status(401).json({ message: 'Not authorized' });
        }
    } else {
        res.status(401).json({ message: 'No token' });
    }
};

// ─── BLOGS ────────────────────────────────────────────────
router.get('/blogs', async (req, res) => {
    try {
        const blogs = await Blog.find().populate('author', 'name').sort({ createdAt: -1 });
        res.json(blogs);
    } catch (error) { res.status(500).json({ message: error.message }); }
});

router.post('/blogs', protect, async (req, res) => {
    try {
        const { title, content, tags } = req.body;
        const blog = await Blog.create({ author: req.user._id, title, content, tags });
        const populated = await Blog.findById(blog._id).populate('author', 'name');
        res.status(201).json(populated);
    } catch (error) { res.status(500).json({ message: error.message }); }
});

// ─── GROUPS ───────────────────────────────────────────────

// GET all groups — private groups only shown to their members
router.get('/groups', async (req, res) => {
    try {
        let userId = null;
        try {
            const auth = req.headers.authorization;
            if (auth?.startsWith('Bearer')) {
                const decoded = jwt.verify(auth.split(' ')[1], process.env.JWT_SECRET || 'secret123');
                userId = decoded.id;
            }
        } catch { }

        const all = await Group.find()
            .populate('creator', 'name _id')
            .populate('members', '_id name')
            .select('-messages')
            .sort({ createdAt: -1 });

        // Hide private groups from non-members
        const visible = all.filter(g =>
            !g.isPrivate || (userId && g.members.some(m => m._id.toString() === userId))
        );
        res.json(visible);
    } catch (error) { res.status(500).json({ message: error.message }); }
});

// POST join by invite code (powers the "Got a code?" bar)
router.post('/groups/join-by-code', protect, async (req, res) => {
    try {
        const { inviteCode } = req.body;
        if (!inviteCode) return res.status(400).json({ message: 'Invite code required' });
        const group = await Group.findOne({ inviteCode: inviteCode.trim() });
        if (!group) return res.status(404).json({ message: 'Invalid invite code — group not found' });
        if (!group.members.map(m => m.toString()).includes(req.user._id.toString())) {
            group.members.push(req.user._id);
            await group.save();
        }
        const populated = await Group.findById(group._id)
            .populate('creator', 'name _id').populate('members', '_id name');
        res.json(populated);
    } catch (error) { res.status(500).json({ message: error.message }); }
});


// POST create group
router.post('/groups', protect, async (req, res) => {
    try {
        const { name, description, isPrivate } = req.body;
        const exists = await Group.findOne({ name });
        if (exists) return res.status(400).json({ message: 'Group name already exists' });

        const group = await Group.create({
            name, description,
            creator: req.user._id,
            members: [req.user._id],
            isPrivate: !!isPrivate
        });
        const populated = await Group.findById(group._id)
            .populate('creator', 'name').populate('members', 'name');
        res.status(201).json(populated);
    } catch (error) { res.status(500).json({ message: error.message }); }
});

// POST join group (supports invite code for private groups)
router.post('/groups/:id/join', protect, async (req, res) => {
    try {
        const group = await Group.findById(req.params.id);
        if (!group) return res.status(404).json({ message: 'Group not found' });

        // Private groups require invite code
        if (group.isPrivate) {
            const { inviteCode } = req.body;
            if (!inviteCode || inviteCode !== group.inviteCode) {
                return res.status(403).json({ message: 'Invalid invite code' });
            }
        }

        if (!group.members.map(m => m.toString()).includes(req.user._id.toString())) {
            group.members.push(req.user._id);
            await group.save();
        }
        const populated = await Group.findById(group._id)
            .populate('creator', 'name').populate('members', 'name');
        res.json(populated);
    } catch (error) { res.status(500).json({ message: error.message }); }
});

// POST leave group
router.post('/groups/:id/leave', protect, async (req, res) => {
    try {
        const group = await Group.findById(req.params.id);
        if (!group) return res.status(404).json({ message: 'Group not found' });

        // Creator cannot leave their own group
        if (group.creator.toString() === req.user._id.toString()) {
            return res.status(400).json({ message: 'Creator cannot leave — delete the group instead' });
        }

        group.members = group.members.filter(m => m.toString() !== req.user._id.toString());
        await group.save();
        res.json({ message: 'Left group successfully' });
    } catch (error) { res.status(500).json({ message: error.message }); }
});

// GET group messages
router.get('/groups/:id/messages', protect, async (req, res) => {
    try {
        const group = await Group.findById(req.params.id);
        if (!group) return res.status(404).json({ message: 'Group not found' });
        res.json(group.messages);
    } catch (error) { res.status(500).json({ message: error.message }); }
});

export default router;
