-- Make gonnyzalowski@gmail.com an admin
UPDATE users 
SET "isAdmin" = true 
WHERE email = 'gonnyzalowski@gmail.com';

-- Verify the change
SELECT id, email, "firstName", "lastName", "isAdmin", "accountStatus", "kycStatus"
FROM users 
WHERE email = 'gonnyzalowski@gmail.com';
