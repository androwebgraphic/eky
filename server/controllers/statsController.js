const Dog = require('../models/dogModel');
const User = require('../models/userModel');

// Get application statistics
const getStats = async (req, res) => {
  try {
    // Count dogs by status
    const availableDogs = await Dog.countDocuments({ adoptionStatus: 'available' });
    const pendingDogs = await Dog.countDocuments({ adoptionStatus: 'pending' });
    const adoptedDogs = await Dog.countDocuments({ adoptionStatus: 'adopted' });

    // Total dogs
    const totalDogs = await Dog.countDocuments();

    // Count total users
    const totalUsers = await User.countDocuments();

    // Count users by person type
    const organizationUsers = await User.countDocuments({ person: 'organization' });
    const privateUsers = await User.countDocuments({ person: 'private' });

    res.json({
      success: true,
      data: {
        dogs: {
          total: totalDogs,
          available: availableDogs,
          pending: pendingDogs,
          adopted: adoptedDogs
        },
        users: {
          total: totalUsers,
          organizations: organizationUsers,
          private: privateUsers
        }
      }
    });
  } catch (error) {
    console.error('Error fetching statistics:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching statistics',
      error: error.message
    });
  }
};

module.exports = {
  getStats
};