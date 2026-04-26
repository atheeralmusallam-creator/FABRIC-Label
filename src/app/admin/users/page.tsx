export const dynamic = "force-dynamic";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { hashPassword, requireRole } from "@/lib/auth";

async function createUserAction(formData: FormData) {
  "use server";
  await requireRole(["ADMIN"]);

  const email = String(formData.get("email") || "").trim().toLowerCase();
  const name = String(formData.get("name") || "").trim() || null;
  const password = String(formData.get("password") || "");
  const role = String(formData.get("role") || "ANNOTATOR") as "ADMIN" | "MANAGER" | "ANNOTATOR";

  if (!email || !password) return;

  await prisma.user.create({
    data: {
      email,
      name,
      password: hashPassword(password),
      role,
      mustChangePassword: true, // 🔥 مهم
    },
  });

  redirect("/admin/users");
}

async function updateRoleAction(formData: FormData) {
  "use server";
  await requireRole(["ADMIN"]);

  const id = String(formData.get("id") || "");
  const role = String(formData.get("role") || "ANNOTATOR") as "ADMIN" | "MANAGER" | "ANNOTATOR";

  await prisma.user.update({
    where: { id },
    data: { role },
  });

  redirect("/admin/users");
}

async function resetPasswordAction(formData: FormData) {
  "use server";
  await requireRole(["ADMIN"]);

  const id = String(formData.get("id") || "");

  await prisma.user.update({
    where: { id },
    data: {
      password: hashPassword("123456"), // 🔥 باسورد افتراضي
      mustChangePassword: true,
    },
  });

  redirect("/admin/users");
}

async function deleteUserAction(formData: FormData) {
  "use server";
  const currentUser = await requireRole(["ADMIN"]);

  const id = String(formData.get("id") || "");

  if (id && id !== currentUser.id) {
    await prisma.user.delete({ where: { id } });
  }

  redirect("/admin/users");
}

export default async function UsersPage() {
  await requireRole(["ADMIN"]);

  const users = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      _count: {
        select: {
          assignments: true,
          annotations: true,
        },
      },
    },
  });

  return (
    <div className="min-h-screen bg-[#0e0f14] text-gray-100">
      <header className="border-b border-[#2a2d3e] bg-[#13151e] px-6 py-4">
        <div className="max-w-5xl mx-auto">
          <a href="/dashboard" className="text-sm text-gray-500 hover:text-white">
            ← Projects
          </a>
          <h1 className="text-xl font-bold text-white mt-1">User Management</h1>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-10 space-y-8">
        {/* Create User */}
        <section className="bg-[#13151e] border border-[#2a2d3e] rounded-xl p-6">
          <h2 className="text-sm font-semibold text-white mb-4">Add user</h2>

          <form action={createUserAction} className="grid grid-cols-1 md:grid-cols-5 gap-3">
            <input name="name" placeholder="Name" className="input" />
            <input name="email" type="email" required placeholder="Email" className="input" />
            <input name="password" type="text" required placeholder="Password" className="input" />

            <select name="role" className="input">
              <option value="ANNOTATOR">Annotator</option>
              <option value="MANAGER">Manager</option>
              <option value="ADMIN">Admin</option>
            </select>

            <button className="btn-primary">Create</button>
          </form>
        </section>

        {/* Users Table */}
        <section className="bg-[#13151e] border border-[#2a2d3e] rounded-xl p-6">
          <h2 className="text-sm font-semibold text-white mb-4">Users</h2>

          <div className="overflow-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-gray-600 uppercase border-b border-[#2a2d3e]">
                  <th className="pb-2 pr-4">User</th>
                  <th className="pb-2 pr-4">Role</th>
                  <th className="pb-2 pr-4">Projects</th>
                  <th className="pb-2 pr-4">Annotations</th>
                  <th className="pb-2 pr-4">Status</th>
                  <th className="pb-2">Actions</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-[#2a2d3e]">
                {users.map((user) => (
                  <tr key={user.id}>
                    <td className="py-3 pr-4">
                      <div className="font-medium text-white">{user.name || "—"}</div>
                      <div className="text-xs text-gray-500">{user.email}</div>
                    </td>

                    <td className="py-3 pr-4">
                      <form action={updateRoleAction} className="flex gap-2">
                        <input type="hidden" name="id" value={user.id} />
                        <select name="role" defaultValue={user.role} className="input-sm">
                          <option value="ANNOTATOR">Annotator</option>
                          <option value="MANAGER">Manager</option>
                          <option value="ADMIN">Admin</option>
                        </select>
                        <button className="text-xs text-indigo-300">Save</button>
                      </form>
                    </td>

                    <td className="py-3 pr-4 text-gray-400">
                      {user._count.assignments}
                    </td>

                    <td className="py-3 pr-4 text-gray-400">
                      {user._count.annotations}
                    </td>

                    {/* 🔥 حالة الباسورد */}
                    <td className="py-3 pr-4">
                      {user.mustChangePassword ? (
                        <span className="text-xs text-yellow-400">
                          Must change password
                        </span>
                      ) : (
                        <span className="text-xs text-green-400">
                          Active
                        </span>
                      )}
                    </td>

                    <td className="py-3 flex gap-2">
                      {/* Reset Password */}
                      <form action={resetPasswordAction}>
                        <input type="hidden" name="id" value={user.id} />
                        <button className="text-xs text-blue-400 hover:text-blue-300">
                          Reset
                        </button>
                      </form>

                      {/* Delete */}
                      <form action={deleteUserAction}>
                        <input type="hidden" name="id" value={user.id} />
                        <button className="text-xs text-red-400 hover:text-red-300">
                          Delete
                        </button>
                      </form>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </main>
    </div>
  );
}
