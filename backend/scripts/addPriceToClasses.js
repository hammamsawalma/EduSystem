const mongoose = require('mongoose');
const Class = require('../models/Class');
require('dotenv').config();

async function addPriceToExistingClasses() {
  try {
    // Connect to database
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Update all classes that don't have a price field
    const result = await Class.updateMany(
      { price: { $exists: false } },
      { $set: { price: 0 } }
    );

    console.log(`Updated ${result.modifiedCount} classes with price field`);

    // Also ensure classes with null price are set to 0
    const nullPriceResult = await Class.updateMany(
      { price: null },
      { $set: { price: 0 } }
    );

    console.log(`Updated ${nullPriceResult.modifiedCount} classes with null price to 0`);

    // List all classes with their new price field
    const classes = await Class.find({}, 'name price currency');
    console.log('\nAll classes:');
    classes.forEach(cls => {
      console.log(`- ${cls.name}: ${cls.currency} ${cls.price.toFixed(2)}`);
    });

  } catch (error) {
    console.error('Error updating classes:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

// Run the migration
addPriceToExistingClasses();
