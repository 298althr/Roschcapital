/**
 * Pool of security questions for user account recovery
 * Users must select and answer 3 questions during registration
 */
export const SECURITY_QUESTIONS = [
  "What was the name of your first pet?",
  "In what city were you born?",
  "What is your mother's maiden name?",
  "What was the make of your first car?",
  "What was the name of your elementary school?",
  "What is your favorite movie?",
  "What was your childhood nickname?",
  "Who was your childhood hero?",
  "What was the first concert you attended?",
  "What is your oldest sibling's middle name?",
  "What is the name of the hospital where you were born?",
  "What was the name of the street you grew up on?",
  "What is your maternal grandmother's maiden name?",
  "What was your favorite food as a child?",
  "What was the name of your favorite teacher?"
];

/**
 * Validate that a question is from the approved pool
 */
export const isValidQuestion = (question) => {
  return SECURITY_QUESTIONS.includes(question);
};
