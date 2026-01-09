const axios = require('axios');

async function testApi() {
  try {
    // Test fetching countries
    console.log("Fetching countries...");
    const countriesRes = await axios.get('https://api.worldbank.org/v2/country?format=json&per_page=5');
    console.log("Countries sample:", countriesRes.data[1][0]);

    // Test searching indicators (guessing 'q' or just fetching list)
    console.log("\nFetching indicators...");
    const indicatorsRes = await axios.get('https://api.worldbank.org/v2/indicator?format=json&per_page=5');
    console.log("Indicators sample:", indicatorsRes.data[1][0]);
    
  } catch (error) {
    console.error("Error:", error.message);
  }
}

testApi();
