const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// get a specific comment by ID
exports.getCommentById = async (req, res) => {
    const { commentId } = req.params;

    try {
        const comment = await prisma.comment.findUnique({
            where: { id: parseInt(commentId) },
            include: {
                author: true,
                likes: true,
            },
        });

        if (!comment) {
            return res.status(404).json({ error: 'Comment not found' });
        }

        res.status(200).json(comment);
    } catch (err) {
        res.status(500).json({ error: 'Internal server error while fetching comment' });
    }
};

// update comment status - Only admin or author
exports.updateCommentStatus = async (req, res) => {
    const { commentId } = req.params;
    const { status } = req.body;
    const { userId } = req.user;
    const userRole = req.user.role;

    try {
        if (!['ACTIVE', 'INACTIVE'].includes(status)) {
            return res.status(400).json({ error: 'Invalid status. Must be active or inactive' });
        }

        const comment = await prisma.comment.findUnique({
            where: { id: parseInt(commentId) }
        });

        if (!comment) {
            return res.status(404).json({ error: 'Comment not found' });
        }

        if (userRole !== 'ADMIN' && comment.authorId !== userId) {
            return res.status(403).json({ error: 'You can only update your own comments or be an admin' });
        }

        const updatedComment = await prisma.comment.update({
            where: { id: parseInt(commentId) },
            data: { status }
        });

        res.json(updatedComment);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// delete comment - ADMIN or USER
exports.deleteComment = async (req, res) => {
    const { commentId } = req.params;
    const userId = req.user.id;
    const userRole = req.user.role;

    try {
        const comment = await prisma.comment.findUnique({
            where: { id: parseInt(commentId) },
            include: { author: true }
        });

        if (!comment) {
            return res.status(404).json({ error: 'Comment not found' });
        }

        if (userRole !== 'ADMIN' && comment.authorId !== userId) {
            return res.status(403).json({ error: 'You can only delete your own comments or be an admin' });
        }

        await prisma.comment.delete({
            where: { id: parseInt(commentId) }
        });

        res.json({ message: 'Comment deleted successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// create like for comment
exports.createLike = async (req, res) => {
    const { commentId } = req.params;
    const { type } = req.body;
    const { userId } = req.user;

    if (!type || !['LIKE', 'DISLIKE'].includes(type.toUpperCase())) {
        return res.status(400).json({ error: 'Type must be either "LIKE" or "DISLIKE"' });
    }

    try {
        const comment = await prisma.comment.findUnique({
            where: { id: parseInt(commentId) },
        });

        if (!comment) {
            return res.status(404).json({ error: 'Comment not found' });
        }

        if (comment.status !== 'ACTIVE') {
            return res.status(403).json({ error: 'Cannot react to an inactive comment' });
        }

        const existingLike = await prisma.like.findFirst({
            where: { commentId: parseInt(commentId), authorId: userId },
        });

        if (existingLike) {
            if (existingLike.type === type.toUpperCase()) {
                await prisma.like.delete({
                    where: { id: existingLike.id },
                });
                return res.status(200).json({ message: 'Reaction removed successfully' });
            }

            const updatedLike = await prisma.like.update({
                where: { id: existingLike.id },
                data: { type: type.toUpperCase() },
            });
            return res.status(200).json({ message: 'Reaction updated successfully', like: updatedLike });
        }

        const newLike = await prisma.like.create({
            data: {
                type: type.toUpperCase(),
                commentId: parseInt(commentId),
                authorId: userId,
            },
            include: { author: true },
        });

        res.status(201).json({ message: 'Reaction added successfully', like: newLike });
    } catch (err) {
        res.status(500).json({ error: 'Internal server error while processing reaction' });
    }
};

// see all likes for the specified comment
exports.getLikesByComment = async (req, res) => {
    const { commentId } = req.params;

    try {
        const likes = await prisma.like.findMany({
            where: {
                commentId: parseInt(commentId),
            },
            include: {
                author: true,
            },
        });

        res.status(200).json(likes);
    } catch (err) {
        res.status(500).json({ error: 'Internal server error while fetching likes for comment' });
    }
};

// delete like for the specified comment
exports.deleteLike = async (req, res) => {
    const { commentId } = req.params;
    const { type } = req.body;
    const { userId } = req.user;

    if (!type || !['LIKE', 'DISLIKE'].includes(type.toUpperCase())) {
        return res.status(400).json({ error: 'Type must be either "LIKE" or "DISLIKE"' });
    }

    try {
        const existingReaction = await prisma.like.findFirst({
            where: {
                commentId: parseInt(commentId),
                authorId: userId,
                type: type.toUpperCase(),
            },
        });

        if (!existingReaction) {
            return res.status(404).json({ error: `${type} not found for the specified comment` });
        }

        await prisma.like.delete({
            where: { id: existingReaction.id },
        });

        res.status(200).json({ message: `${type} removed successfully` });
    } catch (err) {
        console.error('Error deleting reaction:', err);
        res.status(500).json({ error: 'Internal server error while deleting reaction' });
    }
};
