import { Request, Response } from 'express';
import { User } from '../models/User';
import { createTemporaryUser, verifyToken } from '../utils/userUtils';
import { ApiError } from '../utils/ApiError';

export class AuthController {
  // Auto-login: Create temporary user
  static async autoLogin(req: Request, res: Response) {
    try {
      const { user, token } = await createTemporaryUser();
      
      res.status(201).json({
        success: true,
        token: token,
        user: {
          id: user._id,
          username: user.username,
          stats: user.stats
        }
      });
    } catch (error) {
      throw new ApiError(500, 'Error creating temporary user');
    }
  }

  // Get user profile
  static async getProfile(req: Request, res: Response) {
    try {
      if (!req.user?.userId) {
        throw new ApiError(401, 'User not authenticated');
      }

      const user = await User.findById(req.user.userId);
      if (!user) {
        throw new ApiError(404, 'User not found');
      }

      res.status(200).json({
        success: true,
        data: {
          user: {
            id: user._id,
            username: user.username,
            stats: user.stats
          }
        }
      });
    } catch (error) {
      throw new ApiError(500, 'Error fetching user profile');
    }
  }

  // Update user profile
  static async updateProfile(req: Request, res: Response) {
    try {
      const { username } = req.body;
      
      if (!req.user?.userId) {
        throw new ApiError(401, 'User not authenticated');
      }
      
      // Validate username
      if (username) {
        const existingUser = await User.findOne({ 
          username, 
          _id: { $ne: req.user.userId } 
        });
        
        if (existingUser) {
          throw new ApiError(400, 'Username already taken');
        }
      }

      const user = await User.findByIdAndUpdate(
        req.user.userId,
        { $set: { username } },
        { new: true }
      );

      if (!user) {
        throw new ApiError(404, 'User not found');
      }

      res.status(200).json({
        success: true,
        data: {
          user: {
            id: user._id,
            username: user.username,
            stats: user.stats
          }
        }
      });
    } catch (error) {
      throw new ApiError(500, 'Error updating user profile');
    }
  }
}
