import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import prisma from '../config/prisma';
import * as userService from '../services/userService';
import { logAuditEvent } from '../utils/audit';

export const getProfile = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    const user = await userService.getUserById(userId);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const { passwordHash: _, ...userWithoutPassword } = user as any;
    res.json(userWithoutPassword);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const updateProfile = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    const existingUser = await userService.getUserById(userId);

    if (!existingUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    const { fullName, phoneNumber, email, dob, gender, address, profilePhoto, city, region, country } = req.body;

    const updateData: Record<string, any> = {};

    if (fullName !== undefined) {
      if (typeof fullName !== 'string' || !fullName.trim()) {
        return res.status(400).json({ error: 'Full name cannot be empty' });
      }
      updateData.fullName = fullName.trim();
    }

    if (phoneNumber !== undefined) {
      updateData.phoneNumber = phoneNumber ? String(phoneNumber).trim() : null;
    }

    if (gender !== undefined) {
      updateData.gender = gender ? String(gender).trim() : null;
    }

    if (address !== undefined) {
      updateData.address = address ? String(address).trim() : null;
    }

    if (profilePhoto !== undefined) {
      updateData.profilePhoto = profilePhoto ? String(profilePhoto).trim() : null;
    }

    if (city !== undefined) {
      updateData.city = city ? String(city).trim() : null;
    }

    if (region !== undefined) {
      updateData.region = region ? String(region).trim() : null;
    }

    if (country !== undefined) {
      updateData.country = country ? String(country).trim() : null;
    }

    if (email !== undefined) {
      if (typeof email !== 'string' || !email.trim()) {
        return res.status(400).json({ error: 'Email cannot be empty' });
      }
      const normalizedEmail = email.trim().toLowerCase();
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(normalizedEmail)) {
        return res.status(400).json({ error: 'Invalid email address format' });
      }
      if (normalizedEmail !== existingUser.email.toLowerCase()) {
        const emailExists = await userService.getUserByEmail(normalizedEmail);
        if (emailExists && emailExists.id !== existingUser.id) {
          return res.status(409).json({ error: 'Email is already in use by another account' });
        }
        updateData.email = normalizedEmail;
      }
    }

    if (dob !== undefined && dob !== null && dob !== '') {
      let parsedDate: Date;
      if (typeof dob === 'string') {
        const trimmedDob = dob.trim();
        const ddmmyyyy = /^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/.exec(trimmedDob);
        if (ddmmyyyy) {
          const day = parseInt(ddmmyyyy[1], 10);
          const month = parseInt(ddmmyyyy[2], 10) - 1;
          const year = parseInt(ddmmyyyy[3], 10);
          parsedDate = new Date(Date.UTC(year, month, day));
        } else {
          parsedDate = new Date(trimmedDob);
        }
      } else {
        parsedDate = new Date(dob);
      }

      if (isNaN(parsedDate.getTime())) {
        return res.status(400).json({ error: 'Invalid date of birth format. Please use DD/MM/YYYY or YYYY-MM-DD' });
      }
      updateData.dob = parsedDate;
    } else if (dob === null || dob === '') {
      updateData.dob = null;
    }

    // Safety: ensure dangerous fields are strictly excluded
    delete (updateData as any).role;
    delete (updateData as any).passwordHash;
    delete (updateData as any).organizationId;
    delete (updateData as any).id;
    delete (updateData as any).staffBranchId;
    delete (updateData as any).firebaseUid;

    const updatedUser = await userService.updateUser(existingUser.id, updateData);

    await logAuditEvent({
      organizationId: existingUser.organizationId || null,
      userId: existingUser.id,
      action: 'PROFILE_UPDATED',
      details: {
        updatedFields: Object.keys(updateData),
      },
    });

    const { passwordHash: _, ...userWithoutPassword } = updatedUser as any;
    res.json(userWithoutPassword);
  } catch (error: any) {
    console.error('Update profile error:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
};

export const listOrganizationStaff = async (req: Request, res: Response) => {
  try {
    const reqUser = (req as any).user;
    const orgId = req.params.orgId || reqUser.organizationId;

    if (!orgId) {
      return res.status(400).json({ error: 'Organization ID is required' });
    }

    const staff = await userService.getStaffByOrganization(orgId);
    res.json(staff);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const updatePushToken = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    const { pushToken } = req.body;

    if (!pushToken || typeof pushToken !== 'string') {
      return res.status(400).json({ error: 'Valid pushToken string is required' });
    }

    const updated = await userService.updateUser(userId, { pushToken: pushToken.trim() });
    res.json({ success: true, pushToken: updated.pushToken });
  } catch (error: any) {
    console.error('Error updating push token:', error);
    res.status(500).json({ error: 'Failed to update push token' });
  }
};

export const changePassword = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Current password and new password are required' });
    }

    if (typeof newPassword !== 'string' || newPassword.length < 6) {
      return res.status(400).json({ error: 'New password must be at least 6 characters long' });
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const isMatch = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!isMatch) {
      return res.status(400).json({ error: 'Current password is incorrect' });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(newPassword, salt);

    await prisma.user.update({
      where: { id: userId },
      data: { passwordHash },
    });

    await logAuditEvent({
      organizationId: user.organizationId || null,
      userId: user.id,
      action: 'PASSWORD_CHANGED',
      details: { timestamp: new Date().toISOString() },
    });

    res.json({ message: 'Password updated successfully' });
  } catch (error: any) {
    console.error('Change password error:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
};
