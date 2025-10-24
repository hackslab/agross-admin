import React, { useState, useEffect } from "react";
import { toast } from "sonner";
import type { Admin } from "../../types";
import ConfirmDialog from "../ConfirmDialog";
import { Crown, User } from "lucide-react";
import {
  getAllAdmins,
  createAdmin,
  deleteAdmin,
  updateMyProfile,
  changeAdminPassword,
  updateMyPassword,
  ApiError,
} from "../../services/api";

interface SettingsProps {
  username: string;
  userRole: "superadmin" | "admin";
  userId: string;
}

const Settings: React.FC<SettingsProps> = ({ username, userRole, userId }) => {
  // Superadmin: Tab management

  // Admin Management state
  const [admins, setAdmins] = useState<Admin[]>([]);
  const [isLoadingAdmins, setIsLoadingAdmins] = useState(false);
  const [adminsError, setAdminsError] = useState<string>("");
  const [showAddAdmin, setShowAddAdmin] = useState(false);
  const [newAdmin, setNewAdmin] = useState({
    name: "",
    username: "",
    password: "",
    role: "admin" as "admin" | "superadmin",
  });
  const [isSubmittingAdmin, setIsSubmittingAdmin] = useState(false);
  const [submitError, setSubmitError] = useState<string>("");

  // Admin Self-Service state
  const [profileData, setProfileData] = useState({
    username: username,
    email: "",
  });
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [changePasswordModal, setChangePasswordModal] = useState<{
    isOpen: boolean;
    adminId: string;
    adminUsername: string;
  }>({ isOpen: false, adminId: "", adminUsername: "" });
  const [newPasswordForAdmin, setNewPasswordForAdmin] = useState("");
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);

  const [confirmDialog, setConfirmDialog] = useState({
    isOpen: false,
    title: "",
    message: "",
    onConfirm: () => {},
  });

  // Load data based on role and active tab
  useEffect(() => {
    if (userRole === "superadmin") {
      fetchAdmins();
    }
  }, [userRole]);

  // Fetch admins
  const fetchAdmins = async () => {
    setIsLoadingAdmins(true);
    setAdminsError("");
    try {
      const data = await getAllAdmins();
      setAdmins(data);
    } catch (err) {
      if (err instanceof ApiError) {
        setAdminsError(err.message);
        toast.error(err.message);
      } else {
        setAdminsError("Adminlarni yuklashda xatolik.");
        toast.error("Adminlarni yuklashda xatolik.");
      }
    } finally {
      setIsLoadingAdmins(false);
    }
  };

  const handleDeleteAdmin = (adminId: string, adminUsername: string) => {
    setConfirmDialog({
      isOpen: true,
      title: "Adminni o'chirish",
      message: `Haqiqatan ham "${adminUsername}" adminini o'chirmoqchimisiz?`,
      onConfirm: async () => {
        try {
          await deleteAdmin(adminId);
          await fetchAdmins();
          setConfirmDialog({ ...confirmDialog, isOpen: false });
          toast.success("Admin muvaffaqiyatli o'chirildi.");
        } catch (err) {
          setConfirmDialog({ ...confirmDialog, isOpen: false });
          if (err instanceof ApiError) {
            toast.error(err.message);
          } else {
            toast.error("Adminni o'chirishda xatolik.");
          }
        }
      },
    });
  };

  // Superadmin: Change another admin's password
  const handleChangeAdminPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPasswordForAdmin.length < 8) {
      toast.error("Parol kamida 8 belgidan iborat bo'lishi kerak.");
      return;
    }
    setIsSubmittingAdmin(true);
    try {
      await changeAdminPassword(
        changePasswordModal.adminId,
        newPasswordForAdmin
      );
      toast.success(
        `${changePasswordModal.adminUsername} uchun parol muvaffaqiyatli o'zgartirildi.`
      );
      setChangePasswordModal({ isOpen: false, adminId: "", adminUsername: "" });
      setNewPasswordForAdmin("");
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Parolni o'zgartirishda xatolik.";
      toast.error(errorMessage);
    } finally {
      setIsSubmittingAdmin(false);
    }
  };

  const handleAddAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmittingAdmin(true);
    setSubmitError("");

    try {
      await createAdmin({
        name: newAdmin.name,
        username: newAdmin.username,
        password: newAdmin.password,
        isSuperadmin: newAdmin.role === "superadmin",
      });

      await fetchAdmins();
      setNewAdmin({ name: "", username: "", password: "", role: "admin" });
      setShowAddAdmin(false);
      toast.success("Admin muvaffaqiyatli qo'shildi.");
    } catch (err) {
      if (err instanceof ApiError) {
        setSubmitError(err.message);
      } else {
        setSubmitError("Admin qo'shishda xatolik.");
      }
    } finally {
      setIsSubmittingAdmin(false);
    }
  };

  // Admin self-service: Update profile
  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUpdatingProfile(true);
    try {
      await updateMyProfile({
        username: profileData.username,
        email: profileData.email,
      });
      toast.success("Profil muvaffaqiyatli yangilandi.");
    } catch (err) {
      if (err instanceof ApiError) {
        toast.error(err.message);
      } else {
        toast.error("Profilni yangilashda xatolik.");
      }
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  // Admin self-service: Update password
  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error("Parollar mos kelmadi.");
      return;
    }

    if (passwordData.newPassword.length < 8) {
      toast.error("Parol kamida 8 belgidan iborat bo'lishi kerak.");
      return;
    }

    setIsUpdatingPassword(true);
    try {
      await updateMyPassword({
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword,
      });
      setPasswordData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
      toast.success("Parol muvaffaqiyatli yangilandi.");
    } catch (err) {
      if (err instanceof ApiError) {
        toast.error(err.message);
      } else {
        toast.error("Parolni yangilashda xatolik.");
      }
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  // SUPERADMIN VIEW
  if (userRole === "superadmin") {
    return (
      <div className="p-4 md:p-8 max-w-[1400px]">
        <h1 className="m-0 mb-6 md:mb-8 text-2xl md:text-3xl text-gray-800">
          Adminlar
        </h1>

        <div>
          <div className="mb-6 md:mb-8">
            <div className="flex flex-col md:flex-row justify-between md:items-center mb-4 md:mb-6 gap-4">
              <h2 className="m-0 text-2xl text-gray-800 font-semibold">
                Adminlarni boshqarish
              </h2>
              <button
                className="bg-teal-700 text-white px-6 py-3 rounded-lg border-none cursor-pointer font-semibold transition-all duration-200 hover:bg-teal-800 hover:-translate-y-0.5 hover:shadow-[0_4px_12px_rgba(4,94,82,0.2)]"
                onClick={() => setShowAddAdmin(true)}
              >
                Admin qo'shish
              </button>
            </div>

            {isLoadingAdmins ? (
              <div className="text-center p-8 text-gray-600">
                Yuklanmoqda...
              </div>
            ) : adminsError ? (
              <div className="p-4 bg-red-50 text-red-800 rounded-lg border border-red-200 mt-4">
                {adminsError}
              </div>
            ) : (
              <div className="bg-white rounded-xl shadow-[0_2px_8px_rgba(0,0,0,0.1)] overflow-hidden border border-gray-200">
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-200">
                        <th className="px-6 py-4 text-left text-sm font-semibold text-gray-800 border-b border-gray-200">
                          To'liq ism
                        </th>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-gray-800 border-b border-gray-200">
                          Foydalanuvchi nomi
                        </th>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-gray-800 border-b border-gray-200">
                          Rol
                        </th>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-gray-800 border-b border-gray-200">
                          Harakatlar
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {admins.map((admin) => (
                        <tr
                          key={admin.id}
                          className="border-b border-gray-200 transition-colors duration-150 hover:bg-gray-50 last:border-b-0"
                        >
                          <td className="px-6 py-4 text-sm text-gray-800">
                            <span className="font-semibold">{admin.name}</span>
                            {admin.id === userId && (
                              <span className="ml-2 px-2 py-1 text-xs font-semibold bg-blue-100 text-blue-800 rounded">
                                (Siz)
                              </span>
                            )}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-600">
                            {admin.username}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-800">
                            <span
                              className={`px-3 py-1.5 rounded-full text-xs font-semibold inline-flex items-center gap-1 ${
                                admin.isSuperadmin
                                  ? "bg-purple-100 text-purple-800"
                                  : "bg-blue-100 text-blue-800"
                              }`}
                            >
                              {admin.isSuperadmin ? (
                                <>
                                  <Crown className="w-3 h-3" /> Super Admin
                                </>
                              ) : (
                                <>
                                  <User className="w-3 h-3" /> Admin
                                </>
                              )}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-800">
                            {admin.id !== userId && (
                              <div className="flex gap-2">
                                <button
                                  className="px-4 py-2 rounded-lg border-none cursor-pointer font-semibold transition-all duration-200 bg-blue-600 text-white hover:bg-blue-700 hover:-translate-y-0.5 text-sm"
                                  onClick={() =>
                                    setChangePasswordModal({
                                      isOpen: true,
                                      adminId: admin.id,
                                      adminUsername: admin.username,
                                    })
                                  }
                                >
                                  Parolni o'zgartirish
                                </button>
                                <button
                                  className="px-4 py-2 rounded-lg border-none cursor-pointer font-semibold transition-all duration-200 bg-red-600 text-white hover:bg-red-700 hover:-translate-y-0.5 text-sm"
                                  onClick={() =>
                                    handleDeleteAdmin(admin.id, admin.username)
                                  }
                                >
                                  Oʻchirish
                                </button>
                              </div>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>

        <ConfirmDialog
          isOpen={confirmDialog.isOpen}
          title={confirmDialog.title}
          message={confirmDialog.message}
          onConfirm={confirmDialog.onConfirm}
          onCancel={() => setConfirmDialog({ ...confirmDialog, isOpen: false })}
        />

        {showAddAdmin && (
          <div
            className="fixed inset-0 bg-black/70 flex items-center justify-center z-[1500] p-4"
            onClick={() => {
              setShowAddAdmin(false);
              setSubmitError("");
              setNewAdmin({
                name: "",
                username: "",
                password: "",
                role: "admin",
              });
            }}
          >
            <div
              className="bg-white rounded-xl w-full max-w-[600px] shadow-[0_8px_32px_rgba(0,0,0,0.2)] border border-gray-200"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="px-8 py-6 border-b border-gray-200 bg-gray-50">
                <h2 className="m-0 text-gray-800 text-2xl">
                  Yangi admin qo'shish
                </h2>
              </div>
              <form onSubmit={handleAddAdmin} className="p-4 md:p-8">
                {submitError && (
                  <div className="mb-4 p-3 bg-red-50 text-red-800 rounded-lg border border-red-200">
                    {submitError}
                  </div>
                )}
                <div className="grid grid-cols-2 gap-6 max-md:grid-cols-1">
                  <div className="mb-6">
                    <label className="block mb-2 text-gray-800 font-medium">
                      To'liq ism *
                    </label>
                    <input
                      type="text"
                      value={newAdmin.name}
                      onChange={(e) =>
                        setNewAdmin({
                          ...newAdmin,
                          name: e.target.value,
                        })
                      }
                      required
                      disabled={isSubmittingAdmin}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg text-base bg-white text-gray-800 transition-colors duration-200 focus:outline-none focus:border-teal-700 focus:ring-4 focus:ring-teal-700/10 disabled:opacity-50 disabled:cursor-not-allowed"
                    />
                  </div>
                  <div className="mb-6">
                    <label className="block mb-2 text-gray-800 font-medium">
                      Foydalanuvchi nomi *
                    </label>
                    <input
                      type="text"
                      value={newAdmin.username}
                      onChange={(e) =>
                        setNewAdmin({ ...newAdmin, username: e.target.value })
                      }
                      required
                      disabled={isSubmittingAdmin}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg text-base bg-white text-gray-800 transition-colors duration-200 focus:outline-none focus:border-teal-700 focus:ring-4 focus:ring-teal-700/10 disabled:opacity-50 disabled:cursor-not-allowed"
                    />
                  </div>
                </div>
                <div className="mb-6">
                  <label className="block mb-2 text-gray-800 font-medium">
                    Parol * (kamida 8 belgi)
                  </label>
                  <input
                    type="password"
                    value={newAdmin.password}
                    onChange={(e) =>
                      setNewAdmin({ ...newAdmin, password: e.target.value })
                    }
                    required
                    minLength={8}
                    disabled={isSubmittingAdmin}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg text-base bg-white text-gray-800 transition-colors duration-200 focus:outline-none focus:border-teal-700 focus:ring-4 focus:ring-teal-700/10 disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                </div>
                <div className="mb-6">
                  <label className="block mb-2 text-gray-800 font-medium">
                    Rol *
                  </label>
                  <select
                    value={newAdmin.role}
                    onChange={(e) =>
                      setNewAdmin({
                        ...newAdmin,
                        role: e.target.value as "admin" | "superadmin",
                      })
                    }
                    disabled={isSubmittingAdmin}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg text-base bg-white text-gray-800 transition-colors duration-200 focus:outline-none focus:border-teal-700 focus:ring-4 focus:ring-teal-700/10 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <option value="admin">Admin</option>
                    <option value="superadmin">Super Admin</option>
                  </select>
                </div>
                <div className="flex justify-end gap-4 mt-8 pt-6 border-t border-gray-200">
                  <button
                    type="button"
                    className="bg-gray-600 text-white px-6 py-3 rounded-lg border-none cursor-pointer font-semibold transition-all duration-200 hover:bg-gray-700"
                    onClick={() => {
                      setShowAddAdmin(false);
                      setSubmitError("");
                      setNewAdmin({
                        name: "",
                        username: "",
                        password: "",
                        role: "admin",
                      });
                    }}
                    disabled={isSubmittingAdmin}
                  >
                    Bekor qilish
                  </button>
                  <button
                    type="submit"
                    className="bg-teal-700 text-white px-6 py-3 rounded-lg border-none cursor-pointer font-semibold transition-all duration-200 hover:bg-teal-800 disabled:opacity-50"
                    disabled={isSubmittingAdmin}
                  >
                    {isSubmittingAdmin ? "Yuklanmoqda..." : "Admin qo'shish"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {changePasswordModal.isOpen && (
          <div
            className="fixed inset-0 bg-black/70 flex items-center justify-center z-[1500] p-4"
            onClick={() =>
              setChangePasswordModal({
                isOpen: false,
                adminId: "",
                adminUsername: "",
              })
            }
          >
            <div
              className="bg-white rounded-xl w-full max-w-[500px] shadow-[0_8px_32px_rgba(0,0,0,0.2)] border border-gray-200"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="px-8 py-6 border-b border-gray-200 bg-gray-50">
                <h2 className="m-0 text-gray-800 text-2xl">
                  {changePasswordModal.adminUsername} uchun parolni o'zgartirish
                </h2>
              </div>
              <form onSubmit={handleChangeAdminPassword} className="p-4 md:p-8">
                <div className="mb-6">
                  <label className="block mb-2 text-gray-800 font-medium">
                    Yangi parol (kamida 8 belgi)
                  </label>
                  <input
                    type="password"
                    value={newPasswordForAdmin}
                    onChange={(e) => setNewPasswordForAdmin(e.target.value)}
                    required
                    minLength={8}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg text-base bg-white text-gray-800 transition-colors duration-200 focus:outline-none focus:border-teal-700 focus:ring-4 focus:ring-teal-700/10"
                  />
                </div>
                <div className="flex justify-end gap-4 mt-8 pt-6 border-t border-gray-200">
                  <button
                    type="button"
                    className="bg-gray-600 text-white px-6 py-3 rounded-lg border-none cursor-pointer font-semibold transition-all duration-200 hover:bg-gray-700"
                    onClick={() =>
                      setChangePasswordModal({
                        isOpen: false,
                        adminId: "",
                        adminUsername: "",
                      })
                    }
                  >
                    Bekor qilish
                  </button>
                  <button
                    type="submit"
                    className="bg-teal-700 text-white px-6 py-3 rounded-lg border-none cursor-pointer font-semibold transition-all duration-200 hover:bg-teal-800 disabled:opacity-50"
                    disabled={isSubmittingAdmin}
                  >
                    {isSubmittingAdmin ? "Saqlanmoqda..." : "Parolni yangilash"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ADMIN VIEW (Self-Service)
  return (
    <div className="p-4 md:p-8 max-w-[1400px]">
      <h1 className="m-0 mb-6 md:mb-8 text-2xl md:text-3xl text-gray-800">
        Profil sozlamalari
      </h1>

      {/* Current User Info */}
      <div className="bg-white rounded-xl shadow-[0_2px_8px_rgba(0,0,0,0.1)] border border-gray-200 p-4 md:p-8 mb-6">
        <h2 className="m-0 mb-4 md:mb-6 text-xl md:text-2xl text-gray-800 font-semibold">
          Joriy foydalanuvchi
        </h2>
        <div className="grid grid-cols-2 gap-6 max-md:grid-cols-1">
          <div className="flex flex-col gap-2">
            <span className="text-sm font-medium text-gray-600">
              Foydalanuvchi nomi:
            </span>
            <span className="text-base text-gray-800 font-semibold">
              {username}
            </span>
          </div>
          <div className="flex flex-col gap-2">
            <span className="text-sm font-medium text-gray-600">Rol:</span>
            <span className="px-3 py-1.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 inline-flex items-center gap-1 w-fit">
              <User className="w-3 h-3" /> Admin
            </span>
          </div>
        </div>
      </div>

      {/* Update Profile */}
      <div className="bg-white rounded-xl shadow-[0_2px_8px_rgba(0,0,0,0.1)] border border-gray-200 p-8 mb-6">
        <h2 className="m-0 mb-6 text-2xl text-gray-800 font-semibold">
          Profilni yangilash
        </h2>
        <form onSubmit={handleUpdateProfile}>
          <div className="mb-6">
            <label className="block mb-2 text-gray-800 font-medium">
              Foydalanuvchi nomi
            </label>
            <input
              type="text"
              value={profileData.username}
              onChange={(e) =>
                setProfileData({ ...profileData, username: e.target.value })
              }
              className="w-full px-4 py-3 border border-gray-300 rounded-lg text-base bg-white text-gray-800 transition-colors duration-200 focus:outline-none focus:border-teal-700 focus:ring-4 focus:ring-teal-700/10"
              required
            />
          </div>
          <div className="mb-6">
            <label className="block mb-2 text-gray-800 font-medium">
              Email
            </label>
            <input
              type="email"
              value={profileData.email}
              onChange={(e) =>
                setProfileData({ ...profileData, email: e.target.value })
              }
              className="w-full px-4 py-3 border border-gray-300 rounded-lg text-base bg-white text-gray-800 transition-colors duration-200 focus:outline-none focus:border-teal-700 focus:ring-4 focus:ring-teal-700/10"
              required
            />
          </div>
          <button
            type="submit"
            className="bg-teal-700 text-white px-6 py-3 rounded-lg border-none cursor-pointer font-semibold transition-all duration-200 hover:bg-teal-800 hover:-translate-y-0.5 hover:shadow-[0_4px_12px_rgba(4,94,82,0.2)] disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={isUpdatingProfile}
          >
            {isUpdatingProfile ? "Saqlanmoqda..." : "Profilni saqlash"}
          </button>
        </form>
      </div>

      {/* Change Password */}
      <div className="bg-white rounded-xl shadow-[0_2px_8px_rgba(0,0,0,0.1)] border border-gray-200 p-8">
        <h2 className="m-0 mb-6 text-2xl text-gray-800 font-semibold">
          Parolni o'zgartirish
        </h2>
        <form onSubmit={handleUpdatePassword}>
          <div className="mb-6">
            <label className="block mb-2 text-gray-800 font-medium">
              Joriy parol
            </label>
            <input
              type="password"
              value={passwordData.currentPassword}
              onChange={(e) =>
                setPasswordData({
                  ...passwordData,
                  currentPassword: e.target.value,
                })
              }
              className="w-full px-4 py-3 border border-gray-300 rounded-lg text-base bg-white text-gray-800 transition-colors duration-200 focus:outline-none focus:border-teal-700 focus:ring-4 focus:ring-teal-700/10"
              required
            />
          </div>
          <div className="mb-6">
            <label className="block mb-2 text-gray-800 font-medium">
              Yangi parol (kamida 8 belgi)
            </label>
            <input
              type="password"
              value={passwordData.newPassword}
              onChange={(e) =>
                setPasswordData({
                  ...passwordData,
                  newPassword: e.target.value,
                })
              }
              className="w-full px-4 py-3 border border-gray-300 rounded-lg text-base bg-white text-gray-800 transition-colors duration-200 focus:outline-none focus:border-teal-700 focus:ring-4 focus:ring-teal-700/10"
              required
              minLength={8}
            />
          </div>
          <div className="mb-6">
            <label className="block mb-2 text-gray-800 font-medium">
              Yangi parolni tasdiqlang (kamida 8 belgi)
            </label>
            <input
              type="password"
              value={passwordData.confirmPassword}
              onChange={(e) =>
                setPasswordData({
                  ...passwordData,
                  confirmPassword: e.target.value,
                })
              }
              className="w-full px-4 py-3 border border-gray-300 rounded-lg text-base bg-white text-gray-800 transition-colors duration-200 focus:outline-none focus:border-teal-700 focus:ring-4 focus:ring-teal-700/10"
              required
              minLength={8}
            />
          </div>
          <button
            type="submit"
            className="bg-teal-700 text-white px-6 py-3 rounded-lg border-none cursor-pointer font-semibold transition-all duration-200 hover:bg-teal-800 hover:-translate-y-0.5 hover:shadow-[0_4px_12px_rgba(4,94,82,0.2)] disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={isUpdatingPassword}
          >
            {isUpdatingPassword ? "Yangilanmoqda..." : "Parolni yangilash"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Settings;
