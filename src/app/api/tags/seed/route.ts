import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

const DEFAULT_TAGS = [
  { name: "forçador", slug: "forcador" },
  { name: "engrasado", slug: "engrasado" },
  { name: "mechanics", slug: "mechanics" },
  { name: "lownaine", slug: "lownaine" },
  { name: "robloq", slug: "robloq" },
  { name: "fofinho", slug: "fofinho" },
  { name: "?", slug: "interrogacao" },
];

export async function POST() {
  try {
    const created = [];

    for (const tag of DEFAULT_TAGS) {
      const existing = await prisma.tag.findUnique({
        where: { slug: tag.slug },
      });

      if (!existing) {
        const newTag = await prisma.tag.create({
          data: tag,
        });
        created.push(newTag);
      }
    }

    return NextResponse.json({
      message: `${created.length} tags criadas`,
      tags: created,
    });
  } catch (error) {
    console.error("Seed tags error:", error);
    return NextResponse.json(
      { message: "Erro ao criar tags" },
      { status: 500 }
    );
  }
}
