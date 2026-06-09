import { PageShell } from "@/components/page-shell";
import { prisma } from "@/lib/db";
import { MembersGallery } from "@/components/members-gallery";

export const metadata = {
  title: "~/membros — Favela Archive",
  description: "Todos os membros da Favela Archive.",
};

async function getMembers() {
  const users = await prisma.user.findMany({
    where: { isActive: true, isBanned: false },
    select: {
      id: true,
      name: true,
      avatarUrl: true,
      role: true,
      createdAt: true,
      _count: {
        select: {
          articles: true,
          posts: true,
          clips: true,
        },
      },
    },
    orderBy: { createdAt: "asc" },
  });

  return users;
}

export default async function MembersPage() {
  const members = await getMembers();

  const galleryItems = members.map((member) => ({
    image: member.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(member.name)}&background=dc2626&color=fff&size=400`,
    text: member.name,
  }));

  return (
    <PageShell>
      <section className="border-b border-border">
        <div className="mx-auto max-w-6xl px-4 py-12">
          <p className="font-mono text-xs text-primary">$ cd ~/membros</p>
          <h1 className="font-display mt-2 text-5xl sm:text-6xl">Membros</h1>
          <p className="font-mono mt-3 max-w-2xl text-sm text-muted-foreground">
            <span className="text-primary">&gt;</span> aviãozinhos.
          </p>
        </div>
      </section>

      <section className="border-b border-border">
        <div className="h-[600px] w-full">
          <MembersGallery items={galleryItems} />
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-12">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {members.map((member) => (
            <div
              key={member.id}
              className="rounded-lg border border-border bg-card p-5 transition-colors hover:border-primary"
            >
              <div className="flex items-center gap-4">
                <div className="font-mono flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary/10 text-lg text-primary">
                  {member.name.charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <h3 className="font-display text-lg text-foreground truncate">
                    {member.name}
                  </h3>
                  <p className="font-mono text-xs text-muted-foreground">
                    {member.role === "ADMIN" ? "admin" : "membro"} · desde{" "}
                    {new Date(member.createdAt).toLocaleDateString("pt-BR", {
                      month: "short",
                      year: "numeric",
                    })}
                  </p>
                </div>
              </div>
              <div className="font-mono mt-4 flex items-center gap-4 text-xs text-muted-foreground">
                <span>{member._count.articles} artigos</span>
                <span>{member._count.posts} posts</span>
                <span>{member._count.clips} clips</span>
              </div>
            </div>
          ))}
        </div>
      </section>
    </PageShell>
  );
}
