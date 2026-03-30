const Dog = require('../models/dogModel');
const User = require('../models/userModel');
const AdoptionRequest = require('../models/adoptionRequestModel');

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

// Reset adopted dogs back to available (for testing purposes)
const resetAdoptedDogs = async (req, res) => {
  try {
    console.log('[STATS] Resetting adopted dogs to available status...');
    
    // Find all adopted dogs
    const adoptedDogs = await Dog.find({ adoptionStatus: 'adopted' });
    console.log(`[STATS] Found ${adoptedDogs.length} adopted dogs to reset`);
    
    if (adoptedDogs.length === 0) {
      return res.json({
        success: true,
        message: 'No adopted dogs to reset',
        resetCount: 0
      });
    }
    
    // Reset each adopted dog
    const dogIds = adoptedDogs.map(dog => dog._id);
    
    // Update dogs back to available status
    const updateResult = await Dog.updateMany(
      { adoptionStatus: 'adopted' },
      {
        adoptionStatus: 'available',
        $unset: { adoptionQueue: '' }
      }
    );
    
    // Optionally update related adoption requests
    await AdoptionRequest.updateMany(
      { dog: { $in: dogIds }, status: 'adopted' },
      { status: 'completed' }
    );
    
    console.log(`[STATS] Reset ${updateResult.modifiedCount} dogs to available status`);
    
    res.json({
      success: true,
      message: `Successfully reset ${updateResult.modifiedCount} adopted dogs to available status`,
      resetCount: updateResult.modifiedCount
    });
  } catch (error) {
    console.error('[STATS] Error resetting adopted dogs:', error);
    res.status(500).json({
      success: false,
      message: 'Error resetting adopted dogs',
      error: error.message
    });
  }
};

module.exports = {
  getStats,
  resetAdoptedDogs
};
