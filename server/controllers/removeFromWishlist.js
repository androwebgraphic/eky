// Remove a dog from the user's wishlist
const removeFromWishlist = async (req, res) => {
    try {
        const { dogId } = req.body;
        const userId = req.user._id;
        // Remove dog from wishlist
        await User.findByIdAndUpdate(userId, {
            $pull: { wishlist: dogId }
        });
        // Return updated user (without password)
        const updatedUser = await User.findById(userId).select('-password');
        res.status(200).json({ message: "Dog removed from wishlist", user: updatedUser });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
