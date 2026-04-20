const admin = require('./firebase');

// This is the Bouncer function
const verifyToken = async (req, res, next) => {
    // 1. Look for the wristband in the request headers
    const authHeader = req.headers.authorization;

    // 2. If there is no wristband, or it doesn't start with 'Bearer', kick them out
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Unauthorized: No token provided. Access Denied.' });
    }

    // 3. Extract the actual token string
    const token = authHeader.split(' ')[1];

    try {
        // 4. Ask Firebase to verify if this token is real and hasn't expired
        const decodedToken = await admin.auth().verifyIdToken(token);
        
        // 5. Success! Attach the user's Firebase data (like their uid) to the request
        // so the rest of the server knows exactly who is making the request
        req.user = decodedToken; 
        
        // 6. Open the door and let them pass to the API route
        next(); 
    } catch (error) {
        console.error('Bouncer Error: Token is fake or expired.', error.message);
        return res.status(403).json({ error: 'Unauthorized: Invalid or expired token.' });
    }
};

module.exports = verifyToken;