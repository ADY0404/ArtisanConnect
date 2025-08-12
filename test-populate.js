// Test script to check populate endpoint
const testPopulate = async () => {
  try {
    const response = await fetch('http://localhost:3000/api/populate-hygraph', {
      method: 'POST'
    });
    
    const result = await response.json();
    console.log('Response status:', response.status);
    console.log('Full result:', JSON.stringify(result, null, 2));
    
    if (result.results && result.results.errors) {
      console.log('\n=== ERRORS ===');
      result.results.errors.forEach((error, index) => {
        console.log(`${index + 1}. ${error.type} - ${error.name}: ${error.error}`);
      });
    }
  } catch (error) {
    console.error('Test failed:', error);
  }
};

testPopulate(); 