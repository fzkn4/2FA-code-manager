import {
  ref,
  set,
  push,
  update,
  remove,
  get,
  query as dbQuery,
  orderByChild,
  equalTo,
  serverTimestamp,
} from "firebase/database";
import { db } from "./config";

// Database path references
const USERS_PATH = "users";
const CODES_PATH = "codes";

// 2FA Codes CRUD operations without encryption
export const codesService = {
  // Create a new 2FA code
  async createCode(codeData) {
    try {
      // Create new code entry without encryption
      const newCodeRef = push(ref(db, CODES_PATH));
      const codeId = newCodeRef.key;

      const codeEntry = {
        id: codeId,
        userId: codeData.userId,
        code: codeData.code,
        description: codeData.description,
        collectionName: codeData.collectionName,
        collectionDescription: codeData.collectionDescription,
        isUsed: false,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      await set(newCodeRef, codeEntry);
      return { id: codeId, ...codeData };
    } catch (error) {
      throw error;
    }
  },

  // Get all codes for a user
  async getUserCodes(userId) {
    try {
      // For new users, try to get codes but don't fail if permission denied
      const codesRef = ref(db, CODES_PATH);
      const userCodesQuery = dbQuery(
        codesRef,
        orderByChild("userId"),
        equalTo(userId)
      );

      const snapshot = await get(userCodesQuery);

      if (!snapshot.exists()) {
        return [];
      }

      const codes = [];

      // Process each code without encryption
      snapshot.forEach((childSnapshot) => {
        const codeData = childSnapshot.val();
        codes.push({
          id: codeData.id,
          userId: codeData.userId,
          code: codeData.code,
          description: codeData.description,
          collectionName: codeData.collectionName,
          collectionDescription: codeData.collectionDescription,
          isUsed: codeData.isUsed,
          createdAt: codeData.createdAt,
          updatedAt: codeData.updatedAt,
        });
      });

      // Sort by creation date (newest first)
      return codes.sort((a, b) => {
        const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return dateB - dateA;
      });
    } catch (error) {
      return [];
    }
  },

  // Get a specific code by ID
  async getCode(codeId) {
    try {
      const codeRef = ref(db, `${CODES_PATH}/${codeId}`);
      const snapshot = await get(codeRef);

      if (!snapshot.exists()) {
        throw new Error("Code not found");
      }

      const codeData = snapshot.val();
      return {
        id: codeData.id,
        userId: codeData.userId,
        code: codeData.code,
        description: codeData.description,
        collectionName: codeData.collectionName,
        collectionDescription: codeData.collectionDescription,
        isUsed: codeData.isUsed,
        createdAt: codeData.createdAt,
        updatedAt: codeData.updatedAt,
      };
    } catch (error) {
      throw error;
    }
  },

  // Update a code (e.g., mark as used)
  async updateCode(codeId, updateData) {
    try {
      const codeRef = ref(db, `${CODES_PATH}/${codeId}`);

      const updatePayload = {
        ...updateData,
        updatedAt: serverTimestamp(),
      };

      await update(codeRef, updatePayload);
      return { id: codeId, ...updateData };
    } catch (error) {
      throw error;
    }
  },

  // Mark a code as used
  async markCodeAsUsed(codeId) {
    try {
      const codeRef = ref(db, `${CODES_PATH}/${codeId}`);
      await update(codeRef, {
        isUsed: true,
        updatedAt: serverTimestamp(),
      });
      return { id: codeId, isUsed: true };
    } catch (error) {
      throw error;
    }
  },

  // Delete a code
  async deleteCode(codeId) {
    try {
      const codeRef = ref(db, `${CODES_PATH}/${codeId}`);
      await remove(codeRef);
      return { id: codeId };
    } catch (error) {
      throw error;
    }
  },

  // Get unused codes for a user
  async getUnusedCodes(userId) {
    try {
      const allCodes = await this.getUserCodes(userId);
      return allCodes.filter((code) => !code.isUsed);
    } catch (error) {
      throw error;
    }
  },
};

// Users CRUD operations without encryption
export const usersService = {
  // Create a new user
  async createUser(userData) {
    try {
      const userRef = ref(db, `${USERS_PATH}/${userData.uid}`);
      const userEntry = {
        uid: userData.uid,
        displayName: userData.displayName,
        email: userData.email,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      await set(userRef, userEntry);
      return { uid: userData.uid, ...userData };
    } catch (error) {
      throw error;
    }
  },

  // Get user by ID
  async getUser(userId) {
    try {
      const userRef = ref(db, `${USERS_PATH}/${userId}`);
      const snapshot = await get(userRef);

      if (!snapshot.exists()) {
        throw new Error("User not found");
      }

      const userData = snapshot.val();
      return {
        uid: userData.uid,
        displayName: userData.displayName,
        email: userData.email,
        createdAt: userData.createdAt,
        updatedAt: userData.updatedAt,
      };
    } catch (error) {
      throw error;
    }
  },

  // Update user
  async updateUser(userId, updateData) {
    try {
      const userRef = ref(db, `${USERS_PATH}/${userId}`);

      const updatePayload = {
        ...updateData,
        updatedAt: serverTimestamp(),
      };

      await update(userRef, updatePayload);
      return { uid: userId, ...updateData };
    } catch (error) {
      throw error;
    }
  },
};

// Analytics and Usage Tracking
export const analyticsService = {
  // Get monthly usage statistics for a user
  async getMonthlyUsage(userId, year = new Date().getFullYear()) {
    try {
      const allCodes = await codesService.getUserCodes(userId);

      // Initialize monthly data structure
      const monthlyData = {};
      const months = [
        "Jan",
        "Feb",
        "Mar",
        "Apr",
        "May",
        "Jun",
        "Jul",
        "Aug",
        "Sep",
        "Oct",
        "Nov",
        "Dec",
      ];

      months.forEach((month) => {
        monthlyData[month] = {
          month,
          used: 0,
          total: 0,
          available: 0,
        };
      });

      // Process codes to calculate monthly statistics
      allCodes.forEach((code) => {
        if (code.createdAt) {
          const codeDate = new Date(code.createdAt);
          const codeYear = codeDate.getFullYear();

          if (codeYear === year) {
            const monthIndex = codeDate.getMonth();
            const monthName = months[monthIndex];

            if (monthlyData[monthName]) {
              monthlyData[monthName].total += 1;
              if (code.isUsed) {
                monthlyData[monthName].used += 1;
              } else {
                monthlyData[monthName].available += 1;
              }
            }
          }
        }
      });

      // Convert to array and sort by month order
      return months.map((month) => monthlyData[month]);
    } catch (error) {
      return [];
    }
  },

  // Get usage statistics for the current year
  async getCurrentYearStats(userId) {
    try {
      const currentYear = new Date().getFullYear();
      const monthlyData = await this.getMonthlyUsage(userId, currentYear);

      const totalCodes = monthlyData.reduce(
        (sum, month) => sum + month.total,
        0
      );
      const totalUsed = monthlyData.reduce((sum, month) => sum + month.used, 0);
      const totalAvailable = monthlyData.reduce(
        (sum, month) => sum + month.available,
        0
      );

      return {
        totalCodes,
        totalUsed,
        totalAvailable,
        monthlyData,
      };
    } catch (error) {
      return {
        totalCodes: 0,
        totalUsed: 0,
        totalAvailable: 0,
        monthlyData: [],
      };
    }
  },

  // Get contribution calendar data for a specific year
  async getContributionData(userId, year = new Date().getFullYear()) {
    try {
      const allCodes = await codesService.getUserCodes(userId);

      // Create a map for each day of the year
      const contributionMap = {};

      // Initialize all days with 0 intensity
      const startDate = new Date(year, 0, 1);
      const endDate = new Date(year, 11, 31);

      for (
        let d = new Date(startDate);
        d <= endDate;
        d.setDate(d.getDate() + 1)
      ) {
        const dateKey = d.toISOString().split("T")[0];
        contributionMap[dateKey] = 0;
      }

      // Process codes to calculate daily contribution intensity
      allCodes.forEach((code) => {
        if (code.createdAt) {
          const codeDate = new Date(code.createdAt);
          const codeYear = codeDate.getFullYear();

          if (codeYear === year) {
            const dateKey = codeDate.toISOString().split("T")[0];
            if (contributionMap[dateKey] !== undefined) {
              contributionMap[dateKey] += 1;
            }
          }
        }
      });

      // Convert intensity to levels (0-4)
      const maxIntensity = Math.max(...Object.values(contributionMap));
      const normalizedMap = {};

      Object.keys(contributionMap).forEach((dateKey) => {
        const intensity = contributionMap[dateKey];
        if (maxIntensity > 0) {
          normalizedMap[dateKey] = Math.min(
            4,
            Math.floor((intensity / maxIntensity) * 4)
          );
        } else {
          normalizedMap[dateKey] = 0;
        }
      });

      return normalizedMap;
    } catch (error) {
      return {};
    }
  },

  // Get recent activity (last 30 days)
  async getRecentActivity(userId, days = 30) {
    try {
      const allCodes = await codesService.getUserCodes(userId);
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - days);

      const recentCodes = allCodes.filter((code) => {
        if (code.createdAt) {
          const codeDate = new Date(code.createdAt);
          return codeDate >= cutoffDate;
        }
        return false;
      });

      return recentCodes.sort((a, b) => {
        const dateA = new Date(a.createdAt).getTime();
        const dateB = new Date(b.createdAt).getTime();
        return dateB - dateA;
      });
    } catch (error) {
      return [];
    }
  },
};
