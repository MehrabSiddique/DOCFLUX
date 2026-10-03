import jwt from 'jsonwebtoken';

const authMiddleware = (req, res, next) => {
  const authHeader = req.headers.authorization;
  const token = authHeader?.split(' ')[1];

  console.log("Authorization header:", authHeader);  // Optional for debugging

  if (!token) {
    return res.status(401).json({ message: 'No token, authorization denied' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Ensure `decoded` includes the userId properly
    req.user = {
      id: decoded.userId || decoded.id || decoded._id // Support common naming patterns
    };

    if (!req.user.id) {
      return res.status(403).json({ message: 'Invalid token structure: userId missing' });
    }

    next();
  } catch (error) {
    console.error('JWT error:', error);
    res.status(403).json({ message: 'Invalid token' });
  }
};

export default authMiddleware;
