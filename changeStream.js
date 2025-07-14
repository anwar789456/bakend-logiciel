const mongoose = require('mongoose');

const setupChangeStream = async (model, eventName, io) => {
  try {
    console.log(`Setting up change stream for ${model.collection.name} collection...`);
    
    // Make sure the model is properly initialized
    if (!model || !model.collection) {
      console.error(`Model for ${eventName} is not properly initialized`);
      return null;
    }
    
    // Create a change stream cursor
    const changeStream = model.watch([], { fullDocument: 'updateLookup' });
    
    // Set up event listener for changes
    changeStream.on('change', async (change) => {
      try {
        console.log(`Change detected in ${model.collection.name} collection:`, change.operationType);
        
        // Fetch updated data
        const updatedData = await model.find();
        
        // Emit the data to connected clients
        io.emit(eventName, updatedData);
        console.log(`Emitted ${eventName} event to all clients`);
      } catch (error) {
        console.error(`Error processing change in ${model.collection.name}:`, error);
      }
    });
    
    // Set up error handler
    changeStream.on('error', (error) => {
      console.error(`Error in change stream for ${model.collection.name}:`, error);
    });
    
    console.log(`Change stream set up for ${model.collection.name} collection`);
    return changeStream;
  } catch (error) {
    console.error(`Error setting up change stream for ${model.collection.name}:`, error);
    return null;
  }
};

module.exports = { setupChangeStream };
