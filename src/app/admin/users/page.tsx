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
  await prisma.user.create({ data: { email, name, password: hashPassword(password), role } });
  redirect("/admin/users");
}

async function updateRoleAction(formData: FormData) {
  "use server";
  await requireRole(["ADMIN"]);
  const id = String(formData.get("id") || "");
  const role = String(formData.get("role") || "ANNOTATOR") as "ADMIN" | "MANAGER" | "ANNOTATOR";
  await prisma.user.update({ where: { id }, data: { role } });
  redirect("/admin/users");
}

async function deleteUserAction(formData: FormData) {
  "use server";
  const currentUser = await requireRole(["ADMIN"]);
  const id = String(formData.get("id") || "");
  if (id && id !== currentUser.id) await prisma.user.delete({ where: { id } });
  redirect("/admin/users");
}

export default async function UsersPage() {
  await requireRole(["ADMIN"]);
  const users = await prisma.user.findMany({ orderBy: { createdAt: "desc" }, include: { _count: { select: { assignments: true, annotations: true } } } });

  return (
    <div className="min-h-screen bg-[#0e0f14] text-gray-100">
      <header className="border-b border-[#2a2d3e] bg-[#13151e] px-6 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div>
            <a href="/dashboard" className="text-sm text-gray-500 hover:text-white">← Projects</a>
            <h1 className="text-xl font-bold text-white mt-1">User Management</h1>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-10 space-y-8">
        <section className="bg-[#13151e] border border-[#2a2d3e] rounded-xl p-6">
          <h2 className="text-sm font-semibold text-white mb-4">Add user</h2>
          <form action={createUserAction} className="grid grid-cols-1 md:grid-cols-5 gap-3">
            <input name="name" placeholder="Name" className="rounded-lg bg-[#0e0f14] border border-[#2a2d3e] px-3 py-2 text-sm outline-none focus:border-indigo-500" />
            <input name="email" type="email" required placeholder="Email" className="rounded-lg bg-[#0e0f14] border border-[#2a2d3e] px-3 py-2 text-sm outline-none focus:border-indigo-500" />
            <input name="password" type="password" required placeholder="Password" className="rounded-lg bg-[#0e0f14] border border-[#2a2d3e] px-3 py-2 text-sm outline-none focus:border-indigo-500" />
            <select name="role" className="rounded-lg bg-[#0e0f14] border border-[#2a2d3e] px-3 py-2 text-sm outline-none focus:border-indigo-500">
              <option value="ANNOTATOR">Annotator</option>
              <option value="MANAGER">Manager</option>
              <option value="ADMIN">Admin</option>
            </select>
            <button className="rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium px-4 py-2">Create</button>
          </form>
        </section>

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
                        <select name="role" defaultValue={user.role} className="rounded bg-[#0e0f14] border border-[#2a2d3e] px-2 py-1 text-xs">
                          <option value="ANNOTATOR">Annotator</option>
                          <option value="MANAGER">Manager</option>
                          <option value="ADMIN">Admin</option>
                        </select>
                        <button className="text-xs text-indigo-300 hover:text-indigo-200">Save</button>
                      </form>
                    </td>
                    <td className="py-3 pr-4 text-gray-400">{user._count.assignments}</td>
                    <td className="py-3 pr-4 text-gray-400">{user._count.annotations}</td>
                    <td className="py-3">
                      <form action={deleteUserAction}>
                        <input type="hidden" name="id" value={user.id} />
                        <button className="text-xs text-red-400 hover:text-red-300">Delete</button>
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
