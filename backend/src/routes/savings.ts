import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { eq, and } from "drizzle-orm";
import { db } from "../db";
import { savings, savingsBankAccounts } from "../db/schema/savings";
import { users } from "../db/schema/users";
import {
  createSavingSchema,
  updateSavingSchema,
  createSavingsBankAccountSchema,
  updateSavingsBankAccountSchema,
} from "../validators/savings";
import { authMiddleware, requirePermission } from "../middleware/auth";
import { rolePermissions, userPermissions } from "../db/schema/permissions";
import { createNotification } from "../utils/notifications";

const savingsRoute = new Hono();

// Apply authentication middleware to all savings routes
savingsRoute.use("*", authMiddleware);

// Helper function to check if the current user has the management permission for savings
async function hasManagePermission(userId: number, role: string): Promise<boolean> {
  if (role === "admin") return true;

  // Check user-specific overrides
  const userPerm = await db.query.userPermissions.findFirst({
    where: and(
      eq(userPermissions.userId, userId),
      eq(userPermissions.routePath, "/apps/savings/manage")
    ),
  });

  if (userPerm) {
    return userPerm.isAllowed;
  }

  // Check role-specific permissions
  const rolePerm = await db.query.rolePermissions.findFirst({
    where: and(
      eq(rolePermissions.role, role as any),
      eq(rolePermissions.routePath, "/apps/savings/manage")
    ),
  });

  return rolePerm ? rolePerm.isAllowed : false;
}

// Helper function to get all user IDs who are managers of savings
async function getSavingsManagers(): Promise<number[]> {
  const managers: number[] = [];

  try {
    // 1. Get all admins
    const admins = await db.query.users.findMany({
      where: (users, { eq }) => eq(users.role, "admin"),
      columns: { id: true }
    });
    admins.forEach(a => managers.push(a.id));

    // 2. Get all users who have explicit user override permissions allowed
    const userOverrides = await db.query.userPermissions.findMany({
      where: and(
        eq(userPermissions.routePath, "/apps/savings/manage"),
        eq(userPermissions.isAllowed, true)
      ),
      columns: { userId: true }
    });
    userOverrides.forEach(uo => {
      if (!managers.includes(uo.userId)) {
        managers.push(uo.userId);
      }
    });

    // 3. Get all roles that have role-based permissions allowed
    const allowedRolesList = await db.query.rolePermissions.findMany({
      where: and(
        eq(rolePermissions.routePath, "/apps/savings/manage"),
        eq(rolePermissions.isAllowed, true)
      ),
      columns: { role: true }
    });

    const allowedRoles = allowedRolesList.map(r => r.role);
    if (allowedRoles.length > 0) {
      // Find all active users with those roles
      const roleUsers = await db.query.users.findMany({
        where: (users, { and, inArray, eq }) => and(
          inArray(users.role, allowedRoles),
          eq(users.isActive, true)
        ),
        columns: { id: true }
      });

      // Add them if they don't have explicit user overrides denying them
      for (const u of roleUsers) {
        if (managers.includes(u.id)) continue;

        // Check if user has an override denying them
        const userDenial = await db.query.userPermissions.findFirst({
          where: and(
            eq(userPermissions.userId, u.id),
            eq(userPermissions.routePath, "/apps/savings/manage"),
            eq(userPermissions.isAllowed, false)
          )
        });

        if (!userDenial) {
          managers.push(u.id);
        }
      }
    }
  } catch (error) {
    console.error("Failed to query savings managers:", error);
  }

  return managers;
}

// 1. Get List of Users (for Savings Manager selection)
savingsRoute.get("/users", async (c) => {
  try {
    const currentUser = c.get("user");
    const isManager = await hasManagePermission(currentUser.userId, currentUser.role);

    if (!isManager) {
      return c.json(
        { success: false, message: "Forbidden: Hanya pengelola yang dapat mengakses daftar user" },
        403
      );
    }

    // Fetch all users with basic profile details
    const allUsers = await db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        role: users.role,
        firstName: users.firstName,
        lastName: users.lastName,
      })
      .from(users)
      .where(eq(users.isActive, true));

    return c.json({
      success: true,
      data: allUsers.map(u => ({
        id: u.id,
        name: u.name || `${u.firstName || ""} ${u.lastName || ""}`.trim() || u.email,
        email: u.email,
        role: u.role,
      })),
    });
  } catch (error) {
    console.error("Get savings users error:", error);
    return c.json({ success: false, message: "Gagal mengambil daftar pengguna" }, 500);
  }
});

// 2. Get Savings Balances
savingsRoute.get("/balance", async (c) => {
  try {
    const currentUser = c.get("user");
    const isManager = await hasManagePermission(currentUser.userId, currentUser.role);
    const targetUserId = c.req.query("userId");

    if (targetUserId) {
      const parsedUserId = parseInt(targetUserId);
      if (!isManager && parsedUserId !== currentUser.userId) {
        return c.json({ success: false, message: "Forbidden: Tidak memiliki akses ke data user ini" }, 403);
      }

      // Calculate single user balance
      const userSavings = await db
        .select({
          type: savings.type,
          nominal: savings.nominal,
          status: savings.status,
        })
        .from(savings)
        .where(eq(savings.userId, parsedUserId));

      let totalDeposit = 0;
      let totalWithdrawal = 0;

      userSavings.forEach((s) => {
        if (s.status === "confirmed") {
          if (s.type === "deposit") {
            totalDeposit += s.nominal;
          } else if (s.type === "withdrawal") {
            totalWithdrawal += s.nominal;
          }
        }
      });

      const balance = totalDeposit - totalWithdrawal;

      return c.json({
        success: true,
        data: {
          userId: parsedUserId,
          totalDeposit,
          totalWithdrawal,
          balance,
        },
      });
    }

    // If not manager, return only own balance
    if (!isManager) {
      const userSavings = await db
        .select({
          type: savings.type,
          nominal: savings.nominal,
          status: savings.status,
        })
        .from(savings)
        .where(eq(savings.userId, currentUser.userId));

      let totalDeposit = 0;
      let totalWithdrawal = 0;

      userSavings.forEach((s) => {
        if (s.status === "confirmed") {
          if (s.type === "deposit") {
            totalDeposit += s.nominal;
          } else if (s.type === "withdrawal") {
            totalWithdrawal += s.nominal;
          }
        }
      });

      const balance = totalDeposit - totalWithdrawal;

      return c.json({
        success: true,
        data: {
          userId: currentUser.userId,
          totalDeposit,
          totalWithdrawal,
          balance,
        },
      });
    }

    // For manager, calculate balance for every user
    const allUsers = await db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
      })
      .from(users)
      .where(eq(users.isActive, true));

    const allSavings = await db
      .select({
        userId: savings.userId,
        type: savings.type,
        nominal: savings.nominal,
        status: savings.status,
      })
      .from(savings);

    const userBalancesMap = new Map<number, { totalDeposit: number; totalWithdrawal: number }>();
    
    allUsers.forEach((u) => {
      userBalancesMap.set(u.id, { totalDeposit: 0, totalWithdrawal: 0 });
    });

    allSavings.forEach((s) => {
      if (s.status === "confirmed") {
        const current = userBalancesMap.get(s.userId);
        if (current) {
          if (s.type === "deposit") {
            current.totalDeposit += s.nominal;
          } else if (s.type === "withdrawal") {
            current.totalWithdrawal += s.nominal;
          }
        }
      }
    });

    const result = allUsers.map((u) => {
      const totals = userBalancesMap.get(u.id) || { totalDeposit: 0, totalWithdrawal: 0 };
      return {
        userId: u.id,
        userName: u.name || u.email,
        userEmail: u.email,
        totalDeposit: totals.totalDeposit,
        totalWithdrawal: totals.totalWithdrawal,
        balance: totals.totalDeposit - totals.totalWithdrawal,
      };
    });

    return c.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error("Get balance error:", error);
    return c.json({ success: false, message: "Gagal memuat saldo tabungan" }, 500);
  }
});

// 3. Get Savings Records (List)
savingsRoute.get("/", requirePermission("/apps/savings"), async (c) => {
  try {
    const currentUser = c.get("user");
    const isManager = await hasManagePermission(currentUser.userId, currentUser.role);

    let query = db
      .select({
        id: savings.id,
        userId: savings.userId,
        transferDate: savings.transferDate,
        nominal: savings.nominal,
        receiptPath: savings.receiptPath,
        type: savings.type,
        status: savings.status,
        description: savings.description,
        confirmedBy: savings.confirmedBy,
        confirmedAt: savings.confirmedAt,
        createdAt: savings.createdAt,
        updatedAt: savings.updatedAt,
        userName: users.name,
        userEmail: users.email,
        userRole: users.role,
      })
      .from(savings)
      .leftJoin(users, eq(savings.userId, users.id));

    // If not a manager, filter to only retrieve the user's own savings records
    if (!isManager) {
      query = query.where(eq(savings.userId, currentUser.userId)) as any;
    }

    const records = await query;

    return c.json({
      success: true,
      data: records.map(r => ({
        ...r,
        userName: r.userName || r.userEmail?.split("@")[0] || "User",
      })),
    });
  } catch (error) {
    console.error("Get savings records error:", error);
    return c.json({ success: false, message: "Gagal memuat data tabungan" }, 500);
  }
});

// 4. Get Single Savings Record
savingsRoute.get("/:id", requirePermission("/apps/savings"), async (c) => {
  try {
    const id = parseInt(c.req.param("id"));
    const currentUser = c.get("user");
    const isManager = await hasManagePermission(currentUser.userId, currentUser.role);

    const record = await db.query.savings.findFirst({
      where: eq(savings.id, id),
      with: {
        user: true
      }
    } as any);

    if (!record) {
      return c.json({ success: false, message: "Data tabungan tidak ditemukan" }, 404);
    }

    // Verify ownership if not manager
    if (!isManager && record.userId !== currentUser.userId) {
      return c.json({ success: false, message: "Forbidden: Tidak memiliki akses ke data ini" }, 403);
    }

    return c.json({
      success: true,
      data: record,
    });
  } catch (error) {
    console.error("Get single saving error:", error);
    return c.json({ success: false, message: "Gagal memuat detail tabungan" }, 500);
  }
});

// 5. Create Savings Record
savingsRoute.post(
  "/",
  requirePermission("/apps/savings"),
  zValidator("json", createSavingSchema),
  async (c) => {
    try {
      const currentUser = c.get("user");
      const data = c.req.valid("json");
      const isManager = await hasManagePermission(currentUser.userId, currentUser.role);

      // Security check: non-manager can only create savings for themselves
      if (!isManager && data.userId !== currentUser.userId) {
        return c.json(
          { success: false, message: "Forbidden: Hanya dapat menambahkan tabungan untuk diri sendiri" },
          403
        );
      }

      // Default status is pending for all new creations
      const result = await db.insert(savings).values({
        userId: data.userId,
        transferDate: new Date(data.transferDate),
        nominal: data.nominal,
        receiptPath: data.receiptPath || null,
        type: data.type || "deposit",
        description: data.description || null,
        status: "pending",
      });

      const newRecord = await db.query.savings.findFirst({
        where: eq(savings.id, Number(result[0].insertId)),
        with: {
          user: true
        }
      } as any);

      // Notify savings managers about the new request
      try {
        const managers = await getSavingsManagers();
        const creatorName = (newRecord as any)?.user?.name || (currentUser as any).name || "Anggota";
        const typeLabel = newRecord?.type === "deposit" ? "Setoran" : "Penarikan";
        const formattedNominal = new Intl.NumberFormat("id-ID", {
          style: "currency",
          currency: "IDR",
          maximumFractionDigits: 0
        }).format(newRecord?.nominal || 0);

        const title = `Pengajuan ${typeLabel} Baru`;
        const message = `${creatorName} mengajukan ${typeLabel.toLowerCase()} tabungan sebesar ${formattedNominal}.`;

        for (const managerId of managers) {
          // Do not send a notification to the manager if they are the one who created it
          if (managerId === currentUser.userId) continue;

          await createNotification(
            managerId,
            "savings",
            title,
            message,
            {
              savingId: newRecord?.id,
              type: newRecord?.type,
              userId: newRecord?.userId
            }
          );
        }
      } catch (err) {
        console.error("Failed to send saving notification to managers:", err);
      }

      return c.json({
        success: true,
        message: "Data tabungan berhasil ditambahkan",
        data: newRecord,
      });
    } catch (error) {
      console.error("Create saving error:", error);
      return c.json({ success: false, message: "Gagal menambahkan data tabungan" }, 500);
    }
  }
);

// 6. Update Savings Record
savingsRoute.put(
  "/:id",
  requirePermission("/apps/savings"),
  zValidator("json", updateSavingSchema),
  async (c) => {
    try {
      const id = parseInt(c.req.param("id"));
      const currentUser = c.get("user");
      const data = c.req.valid("json");
      const isManager = await hasManagePermission(currentUser.userId, currentUser.role);

      const record = await db.query.savings.findFirst({
        where: eq(savings.id, id),
      });

      if (!record) {
        return c.json({ success: false, message: "Data tabungan tidak ditemukan" }, 404);
      }

      // Security check: non-manager can only update their own savings
      if (!isManager && record.userId !== currentUser.userId) {
        return c.json({ success: false, message: "Forbidden: Tidak memiliki akses untuk mengubah data ini" }, 403);
      }

      // Security check: non-manager cannot edit if already confirmed
      if (!isManager && record.status === "confirmed") {
        return c.json({ success: false, message: "Forbidden: Data yang sudah dikonfirmasi tidak dapat diedit kembali" }, 403);
      }

      // Security check: non-manager cannot reassign user ID to someone else
      if (!isManager && data.userId && data.userId !== currentUser.userId) {
        return c.json({ success: false, message: "Forbidden: Tidak dapat memindahkan tabungan ke pengguna lain" }, 403);
      }

      const updateData: Partial<typeof savings.$inferInsert> = {};
      if (data.transferDate !== undefined) updateData.transferDate = new Date(data.transferDate);
      if (data.nominal !== undefined) updateData.nominal = data.nominal;
      if (data.receiptPath !== undefined) updateData.receiptPath = data.receiptPath;
      if (data.type !== undefined) updateData.type = data.type;
      if (data.description !== undefined) updateData.description = data.description;
      if (isManager && data.userId !== undefined) updateData.userId = data.userId;
      
      if (isManager && data.status !== undefined) {
        updateData.status = data.status;
        if (data.status === "confirmed") {
          updateData.confirmedBy = currentUser.userId;
          updateData.confirmedAt = new Date();
        } else {
          updateData.confirmedBy = null;
          updateData.confirmedAt = null;
        }
      }

      const oldStatus = record.status;
      await db.update(savings).set(updateData).where(eq(savings.id, id));

      const updatedRecord = await db.query.savings.findFirst({
        where: eq(savings.id, id),
        with: {
          user: true
        }
      } as any);

      // Notify the user if status has changed to confirmed or rejected
      try {
        if (data.status !== undefined && data.status !== oldStatus && (data.status === "confirmed" || data.status === "rejected") && updatedRecord) {
          const typeLabel = updatedRecord.type === "deposit" ? "Setoran" : "Penarikan";
          const formattedNominal = new Intl.NumberFormat("id-ID", {
            style: "currency",
            currency: "IDR",
            maximumFractionDigits: 0
          }).format(updatedRecord.nominal);
          
          const statusLabel = data.status === "confirmed" ? "disetujui" : "ditolak";
          const title = `Pengajuan Tabungan ${data.status === "confirmed" ? "Disetujui" : "Ditolak"}`;
          const message = `Pengajuan ${typeLabel.toLowerCase()} tabungan Anda sebesar ${formattedNominal} telah ${statusLabel}.`;

          await createNotification(
            updatedRecord.userId,
            "savings",
            title,
            message,
            {
              savingId: updatedRecord.id,
              type: updatedRecord.type,
              status: data.status
            }
          );
        }
      } catch (err) {
        console.error("Failed to send saving status notification to user in PUT:", err);
      }

      return c.json({
        success: true,
        message: "Data tabungan berhasil diubah",
        data: updatedRecord,
      });
    } catch (error) {
      console.error("Update saving error:", error);
      return c.json({ success: false, message: "Gagal mengubah data tabungan" }, 500);
    }
  }
);

// 7. Change Transaction Status (Confirm / Cancel Confirmation)
savingsRoute.patch("/:id/status", async (c) => {
  try {
    const id = parseInt(c.req.param("id"));
    const currentUser = c.get("user");
    const isManager = await hasManagePermission(currentUser.userId, currentUser.role);

    if (!isManager) {
      return c.json({ success: false, message: "Forbidden: Hanya pengelola yang dapat mengubah status konfirmasi" }, 403);
    }

    const body = await c.req.json();
    const { status } = body; // 'confirmed' | 'pending' | 'rejected'

    if (!["confirmed", "pending", "rejected"].includes(status)) {
      return c.json({ success: false, message: "Status tidak valid" }, 400);
    }

    const record = await db.query.savings.findFirst({
      where: eq(savings.id, id),
    });

    if (!record) {
      return c.json({ success: false, message: "Data tabungan tidak ditemukan" }, 404);
    }

    const updateData: any = {
      status,
    };

    if (status === "confirmed") {
      updateData.confirmedBy = currentUser.userId;
      updateData.confirmedAt = new Date();
    } else {
      updateData.confirmedBy = null;
      updateData.confirmedAt = null;
    }

    await db.update(savings).set(updateData).where(eq(savings.id, id));

    // Notify the user who owns the saving
    try {
      if (status === "confirmed" || status === "rejected") {
        const typeLabel = record.type === "deposit" ? "Setoran" : "Penarikan";
        const formattedNominal = new Intl.NumberFormat("id-ID", {
          style: "currency",
          currency: "IDR",
          maximumFractionDigits: 0
        }).format(record.nominal);
        
        const statusLabel = status === "confirmed" ? "disetujui" : "ditolak";
        const title = `Pengajuan Tabungan ${status === "confirmed" ? "Disetujui" : "Ditolak"}`;
        const message = `Pengajuan ${typeLabel.toLowerCase()} tabungan Anda sebesar ${formattedNominal} telah ${statusLabel}.`;

        await createNotification(
          record.userId,
          "savings",
          title,
          message,
          {
            savingId: record.id,
            type: record.type,
            status: status
          }
        );
      }
    } catch (err) {
      console.error("Failed to send saving status notification to user:", err);
    }

    return c.json({
      success: true,
      message: `Status tabungan berhasil diubah menjadi ${status}`,
    });
  } catch (error) {
    console.error("Confirm saving status error:", error);
    return c.json({ success: false, message: "Gagal mengubah status konfirmasi" }, 500);
  }
});

// 8. Delete Savings Record
savingsRoute.delete("/:id", requirePermission("/apps/savings"), async (c) => {
  try {
    const id = parseInt(c.req.param("id"));
    const currentUser = c.get("user");
    const isManager = await hasManagePermission(currentUser.userId, currentUser.role);

    const record = await db.query.savings.findFirst({
      where: eq(savings.id, id),
    });

    if (!record) {
      return c.json({ success: false, message: "Data tabungan tidak ditemukan" }, 404);
    }

    // Security check: non-manager can only delete their own savings
    if (!isManager && record.userId !== currentUser.userId) {
      return c.json({ success: false, message: "Forbidden: Tidak memiliki akses untuk menghapus data ini" }, 403);
    }

    // Security check: non-manager cannot delete if already confirmed
    if (!isManager && record.status === "confirmed") {
      return c.json({ success: false, message: "Forbidden: Data yang sudah dikonfirmasi tidak dapat dihapus" }, 403);
    }
    await db.delete(savings).where(eq(savings.id, id));

    return c.json({
      success: true,
      message: "Data tabungan berhasil dihapus",
    });
  } catch (error) {
    console.error("Delete saving error:", error);
    return c.json({ success: false, message: "Gagal menghapus data tabungan" }, 500);
  }
});

// ============================================
// SAVINGS BANK ACCOUNTS API
// ============================================

// 9. Get list of savings bank accounts (Accessible by all users with /apps/savings)
savingsRoute.get(
  "/bank-accounts",
  requirePermission("/apps/savings"),
  async (c) => {
    try {
      const accounts = await db.query.savingsBankAccounts.findMany({
        orderBy: (accounts, { desc }) => [desc(accounts.isActive), desc(accounts.id)],
      });
      return c.json({
        success: true,
        data: accounts,
      });
    } catch (error) {
      console.error("Get bank accounts error:", error);
      return c.json({ success: false, message: "Gagal mengambil data rekening" }, 500);
    }
  }
);

// 10. Create savings bank account (Manager only)
savingsRoute.post(
  "/bank-accounts",
  requirePermission("/apps/savings/manage"),
  zValidator("json", createSavingsBankAccountSchema),
  async (c) => {
    try {
      const data = c.req.valid("json");
      const result = await db.insert(savingsBankAccounts).values({
        bankName: data.bankName,
        accountNumber: data.accountNumber,
        accountName: data.accountName,
        isActive: data.isActive,
      });

      const newAccount = await db.query.savingsBankAccounts.findFirst({
        where: eq(savingsBankAccounts.id, Number(result[0].insertId)),
      });

      return c.json({
        success: true,
        message: "Rekening tabungan berhasil ditambahkan",
        data: newAccount,
      });
    } catch (error) {
      console.error("Create bank account error:", error);
      return c.json({ success: false, message: "Gagal menambahkan rekening" }, 500);
    }
  }
);

// 11. Update savings bank account (Manager only)
savingsRoute.put(
  "/bank-accounts/:id",
  requirePermission("/apps/savings/manage"),
  zValidator("json", updateSavingsBankAccountSchema),
  async (c) => {
    try {
      const id = parseInt(c.req.param("id"));
      const data = c.req.valid("json");

      const record = await db.query.savingsBankAccounts.findFirst({
        where: eq(savingsBankAccounts.id, id),
      });

      if (!record) {
        return c.json({ success: false, message: "Rekening tidak ditemukan" }, 404);
      }

      const updateData: any = {};
      if (data.bankName !== undefined) updateData.bankName = data.bankName;
      if (data.accountNumber !== undefined) updateData.accountNumber = data.accountNumber;
      if (data.accountName !== undefined) updateData.accountName = data.accountName;
      if (data.isActive !== undefined) updateData.isActive = data.isActive;

      await db.update(savingsBankAccounts).set(updateData).where(eq(savingsBankAccounts.id, id));

      const updatedRecord = await db.query.savingsBankAccounts.findFirst({
        where: eq(savingsBankAccounts.id, id),
      });

      return c.json({
        success: true,
        message: "Rekening tabungan berhasil diperbarui",
        data: updatedRecord,
      });
    } catch (error) {
      console.error("Update bank account error:", error);
      return c.json({ success: false, message: "Gagal memperbarui rekening" }, 500);
    }
  }
);

// 12. Delete savings bank account (Manager only)
savingsRoute.delete(
  "/bank-accounts/:id",
  requirePermission("/apps/savings/manage"),
  async (c) => {
    try {
      const id = parseInt(c.req.param("id"));

      const record = await db.query.savingsBankAccounts.findFirst({
        where: eq(savingsBankAccounts.id, id),
      });

      if (!record) {
        return c.json({ success: false, message: "Rekening tidak ditemukan" }, 404);
      }

      await db.delete(savingsBankAccounts).where(eq(savingsBankAccounts.id, id));

      return c.json({
        success: true,
        message: "Rekening tabungan berhasil dihapus",
      });
    } catch (error) {
      console.error("Delete bank account error:", error);
      return c.json({ success: false, message: "Gagal menghapus rekening" }, 500);
    }
  }
);

export default savingsRoute;
