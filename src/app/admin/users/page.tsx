"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";

interface Team {
  id: string;
  name: string;
}

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  active: boolean;
  teams: Team[];
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/users")
      .then((r) => r.json())
      .then((data) => {
        setUsers(data);
        setLoading(false);
      });
  }, []);

  async function toggleActive(user: User) {
    await fetch("/api/admin/users", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: user.id, active: !user.active }),
    });
    setUsers(users.map((u) => (u.id === user.id ? { ...u, active: !u.active } : u)));
  }

  if (loading) {
    return <div className="text-gray-500">Lade Benutzer*innen...</div>;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-headline text-2xl font-bold text-tanne uppercase">
          Benutzer*innen
        </h1>
        <Link href="/admin/users/neu">
          <Button>Neue*r Benutzer*in</Button>
        </Link>
      </div>

      <div className="border-2 border-black overflow-hidden shadow-[4px_4px_0_#000]">
        <table className="w-full">
          <thead className="bg-sand border-b-2 border-black">
            <tr>
              <th className="text-left px-4 py-3 text-sm font-bold text-black uppercase tracking-wide">Name</th>
              <th className="text-left px-4 py-3 text-sm font-bold text-black uppercase tracking-wide">E-Mail</th>
              <th className="text-left px-4 py-3 text-sm font-bold text-black uppercase tracking-wide">Rolle</th>
              <th className="text-left px-4 py-3 text-sm font-bold text-black uppercase tracking-wide">Teams</th>
              <th className="text-left px-4 py-3 text-sm font-bold text-black uppercase tracking-wide">Status</th>
              <th className="text-right px-4 py-3 text-sm font-bold text-black uppercase tracking-wide">Aktionen</th>
            </tr>
          </thead>
          <tbody className="divide-y-2 divide-black">
            {users.map((user) => (
              <tr key={user.id} className="hover:bg-sand/50 bg-white">
                <td className="px-4 py-3 font-medium">{user.name}</td>
                <td className="px-4 py-3 text-gray-700">{user.email}</td>
                <td className="px-4 py-3">
                  <Badge variant={user.role === "ADMIN" ? "info" : "default"}>
                    {user.role === "ADMIN" ? "Admin" : "Expert*in"}
                  </Badge>
                </td>
                <td className="px-4 py-3 text-gray-700 text-sm">
                  {user.teams.length > 0 ? user.teams.map((t) => t.name).join(", ") : "–"}
                </td>
                <td className="px-4 py-3">
                  <Badge variant={user.active ? "success" : "danger"}>
                    {user.active ? "Aktiv" : "Inaktiv"}
                  </Badge>
                </td>
                <td className="px-4 py-3 text-right flex gap-3 justify-end">
                  <Link
                    href={`/admin/users/${user.id}`}
                    className="text-sm text-tanne font-bold hover:underline"
                  >
                    Bearbeiten
                  </Link>
                  <button
                    onClick={() => toggleActive(user)}
                    className="text-sm text-gray-500 font-bold hover:underline"
                  >
                    {user.active ? "Deaktivieren" : "Aktivieren"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
