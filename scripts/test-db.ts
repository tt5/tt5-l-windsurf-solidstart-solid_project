import { getAllItems, addItem, deleteAllItems } from '../src/lib/db';

async function testDatabase() {
  try {
    // Test adding an item
    const newItem = await addItem('[1, 3, 5, 7]');
    console.log('Added item with ID:', newItem.id);
    
    // Test getting all items
    const items = await getAllItems();
    console.log('All items:', items);
    
    // Clean up
    await deleteAllItems();
    console.log('Test completed successfully');
    
    process.exit(0);
  } catch (error) {
    console.error('Database test failed:', error);
    process.exit(1);
  }
}

testDatabase();
