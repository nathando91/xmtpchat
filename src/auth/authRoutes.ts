import express, { Request, Response, NextFunction } from 'express';
import {
  generateRegistrationOptionsForUser,
  verifyRegistration,
  generateAuthenticationOptionsForUser,
  verifyAuthentication,
  getUser
} from './authService';
import {
  RegistrationRequest,
  AuthenticationRequest,
  VerifyRegistrationRequest,
  VerifyAuthenticationRequest
} from './authTypes';

const router = express.Router();

// Generate registration options
router.post('/register-options', async function(req: Request, res: Response) {
  try {
    const { username } = req.body as RegistrationRequest;
    
    if (!username) {
      return res.status(400).json({ error: 'Username is required' });
    }
    
    const options = await generateRegistrationOptionsForUser(username);
    return res.json(options);
  } catch (error) {
    console.error('Error generating registration options:', error);
    return res.status(500).json({ error: 'Failed to generate registration options' });
  }
});

// Verify registration response
router.post('/verify-registration', async function(req: Request, res: Response) {
  try {
    const { username, response } = req.body as VerifyRegistrationRequest;
    
    if (!username || !response) {
      return res.status(400).json({ error: 'Username and response are required' });
    }
    
    const verified = await verifyRegistration(username, response);
    
    if (verified) {
      return res.json({ verified, message: 'Registration successful' });
    } else {
      return res.status(400).json({ verified, error: 'Registration verification failed' });
    }
  } catch (error) {
    console.error('Error verifying registration:', error);
    return res.status(500).json({ error: 'Failed to verify registration' });
  }
});

// Generate authentication options
router.post('/auth-options', async function(req: Request, res: Response) {
  try {
    const { username } = req.body as AuthenticationRequest;
    
    if (!username) {
      return res.status(400).json({ error: 'Username is required' });
    }
    
    const options = await generateAuthenticationOptionsForUser(username);
    return res.json(options);
  } catch (error) {
    console.error('Error generating authentication options:', error);
    return res.status(500).json({ error: 'Failed to generate authentication options' });
  }
});

// Verify authentication response
router.post('/verify-authentication', async function(req: Request, res: Response) {
  try {
    const { username, response } = req.body as VerifyAuthenticationRequest;
    
    if (!username || !response) {
      return res.status(400).json({ error: 'Username and response are required' });
    }
    
    const verified = await verifyAuthentication(username, response);
    
    if (verified) {
      const user = getUser(username);
      return res.json({ 
        verified, 
        message: 'Authentication successful',
        user: {
          id: user?.id,
          username: user?.username,
          ethAddress: user?.ethAddress
        }
      });
    } else {
      return res.status(400).json({ verified, error: 'Authentication verification failed' });
    }
  } catch (error) {
    console.error('Error verifying authentication:', error);
    return res.status(500).json({ error: 'Failed to verify authentication' });
  }
});

// Get user information
router.get('/user/:username', function(req: Request, res: Response) {
  try {
    const { username } = req.params;
    const user = getUser(username);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    return res.json({
      id: user.id,
      username: user.username,
      ethAddress: user.ethAddress,
      hasCredentials: user.registeredCredentials.length > 0
    });
  } catch (error) {
    console.error('Error getting user:', error);
    return res.status(500).json({ error: 'Failed to get user information' });
  }
});

export { router as authRouter };
