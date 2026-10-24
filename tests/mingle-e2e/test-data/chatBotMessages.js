const naturalMessages = [
  "hello, how are you?",
  "can you recommend something nice?",
  "I'm looking for ideas for my living room",
  "what do you sell here?",
  "I don't know what I want yet",
  "tell me more about this app",
  "how can I get help?",
  "what's trending right now?",
];

const validPatterns = [
  /how can i help/i,
  /assist you/i,
  /recommend/i,
  /browse/i,
  /explore/i,
  /we offer/i,
  /you can/i,
  /sorry/i,
  /let me help/i,
  /here to assist/i,
];

const multiCriteriaQueries = [
  "Show me chairs made of wood under $300",
  "Find products by Outdoor Comfort that are on sale",
  "List all tables above 1 meter in height under $500",
  "Find ceramic items priced between $50 and $150",
  "Show me beige furniture by Luxury Chairs over $100",

  // Sorting / comparison extensions
  "Show me the cheapest chair",
  "Find the most expensive wooden product",
];

module.exports = { naturalMessages, validPatterns, multiCriteriaQueries };
