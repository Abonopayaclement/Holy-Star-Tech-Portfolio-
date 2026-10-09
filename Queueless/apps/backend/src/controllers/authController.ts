import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import * as userService from '../services/userService';
import prisma from '../config/prisma';
import { ENV } from '../config/env';

const JWT_SECRET = ENV.JWT_SECRET;

export const register = async (req: Request, res: Response) => {
  try {
    const { email, password, fullName, role, phoneNumber, organizationId, staffBranchId, ...otherFields } = req.body;

    if (!email || !password || !fullName) {
      return res.status(400).json({ error: 'Email, password, and full name are required.' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters long.' });
    }

    const existingUser = await userService.getUserByEmail(email);
    if (existingUser) {
      return res.status(400).json({ error: 'A user with this email already exists.' });
    }

    // Security check: Only an authenticated SUPER_ADMIN or ORG_ADMIN can assign privileged roles
    const requestingUser = (req as any).user;
    let assignedRole = 'CUSTOMER';

    if (role && role !== 'CUSTOMER') {
      if (
        requestingUser &&
        (requestingUser.role === 'SUPER_ADMIN' ||
          (requestingUser.role === 'ORG_ADMIN' && ['STAFF', 'BRANCH_MANAGER'].includes(role)))
      ) {
        assignedRole = role;
      } else {
        // Demote unprivileged requests to CUSTOMER to avoid privilege escalation
        assignedRole = 'CUSTOMER';
      }
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const user = await userService.createUser({
      email,
      passwordHash,
      fullName,
      role: assignedRole as any,
      phoneNumber,
      organizationId: organizationId || null,
      staffBranchId: staffBranchId || null,
      ...otherFields,
    });

    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        role: user.role,
        organizationId: user.organizationId,
        staffBranchId: user.staffBranchId,
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    const { passwordHash: _, ...userWithoutPassword } = user as any;
    res.status(201).json({ token, user: userWithoutPassword });
  } catch (error: any) {
    console.error('Error in register:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    const user = await userService.getUserByEmail(email);
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    // Check organization approval status (Super Admin exempt)
    if (user.organizationId && user.role !== 'SUPER_ADMIN') {
      try {
        const orgRows: any = await prisma.$queryRawUnsafe(
          'SELECT id, name, status FROM `organization` WHERE id = ? LIMIT 1',
          user.organizationId
        );
        const org = orgRows && orgRows.length > 0 ? orgRows[0] : null;
        if (org) {
          if (org.status === 'PENDING_APPROVAL') {
            return res.status(403).json({
              error: 'Your organization registration is currently pending approval by the Super Admin. You will be able to log in once approved.',
              organizationStatus: 'PENDING_APPROVAL',
            });
          }
          if (org.status === 'REJECTED') {
            return res.status(403).json({
              error: 'Your organization registration was rejected. Please contact platform administration.',
              organizationStatus: 'REJECTED',
            });
          }
          if (org.status === 'SUSPENDED') {
            return res.status(403).json({
              error: 'Your organization account is currently suspended. Please contact platform administration.',
              organizationStatus: 'SUSPENDED',
            });
          }
        }
      } catch (statusCheckErr) {
        console.warn('Could not check organization status with raw query, proceeding with login:', statusCheckErr);
      }
    }

    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        role: user.role,
        organizationId: user.organizationId,
        staffBranchId: user.staffBranchId,
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    const { passwordHash: _, ...userWithoutPassword } = user as any;
    res.json({ token, user: userWithoutPassword });
  } catch (error: any) {
    console.error('Error in login:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getMe = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const user = await userService.getUserById(userId);

    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }

    const { passwordHash: _, ...userWithoutPassword } = user as any;
    res.json(userWithoutPassword);
  } catch (error) {
    console.error('Error in getMe:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
