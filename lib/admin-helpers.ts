import { connectToDatabase, User } from './db';
import { getCurrentUserAsync } from './auth';

export async function hasAdminPrivileges(userId: string): Promise<boolean> {
  try {
    await connectToDatabase();
    const user = await User.findById(userId);
    return user && (user.role === 'admin' || user.email === process.env.OWNER_EMAIL);
  } catch (error) {
    console.error('Error checking admin privileges:', error);
    return false;
  }
}

export async function ensureOwnerPrivileges(userId: string): Promise<void> {
  try {
    await connectToDatabase();
    const user = await User.findById(userId);
    if (!user || user.email !== process.env.OWNER_EMAIL) {
      throw new Error('Access denied. Owner privileges required.');
    }
  } catch (error) {
    console.error('Error ensuring owner privileges:', error);
    throw error;
  }
}

export async function ensureAdminPrivileges(userId: string): Promise<void> {
  try {
    await connectToDatabase();
    const user = await User.findById(userId);
    if (!user || (user.role !== 'admin' && user.email !== process.env.OWNER_EMAIL)) {
      throw new Error('Access denied. Admin privileges required.');
    }
  } catch (error) {
    console.error('Error ensuring admin privileges:', error);
    throw error;
  }
}

export function isOwnerEmail(email: string): boolean {
  return email === process.env.OWNER_EMAIL;
}

export async function getAdminUsers(): Promise<any[]> {
  try {
    await connectToDatabase();
    const adminUsers = await User.find({
      $or: [
        { role: 'admin' },
        { email: process.env.OWNER_EMAIL }
      ]
    }).select('-password');
    return adminUsers;
  } catch (error) {
    console.error('Error getting admin users:', error);
    return [];
  }
}
