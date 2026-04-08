const cron = require('node-cron');
const User = require('../models/User');

// Run every 5 minutes
const startStatusCheckJob = () => {
  cron.schedule('*/5 * * * *', async () => {
    try {
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
      
      // Find users who are marked as online but haven't been active for 5+ minutes
      const inactiveUsers = await User.find({
        onlineStatus: 'online',
        lastActive: { $lt: fiveMinutesAgo }
      });
      
      if (inactiveUsers.length > 0) {
        // Mark them as offline
        await User.updateMany(
          {
            onlineStatus: 'online',
            lastActive: { $lt: fiveMinutesAgo }
          },
          {
            $set: {
              onlineStatus: 'offline',
              lastActive: new Date()
            }
          }
        );
        
        console.log(`[${new Date().toISOString()}] Marked ${inactiveUsers.length} inactive user(s) as offline`);
      }
    } catch (error) {
      console.error('Error checking inactive users:', error);
    }
  });
  
  console.log('Status check job scheduled (runs every 5 minutes)');
};

module.exports = { startStatusCheckJob };
