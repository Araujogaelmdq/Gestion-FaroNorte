import { eq } from 'drizzle-orm';
import { db } from '../db/client.js';
import { club } from '../db/schema.js';
import { Club, ClubInput } from '@faronorte/shared';

export async function getClubService(): Promise<Club> {
  let [datosClub] = await db.select().from(club).where(eq(club.id, 1)).limit(1);

  if (!datosClub) {
    const ahora = new Date().toISOString();
    await db.insert(club).values({
      id: 1,
      nombre: 'Faro Norte',
      contacto: 'contacto@faronorte.club',
      escudo_url: '/LogoFN.jpg',
      dia_vencimiento: 10,
      descuento_familiar_pct: 0,
      actualizado_en: ahora,
    });
    [datosClub] = await db.select().from(club).where(eq(club.id, 1)).limit(1);
  }

  return {
    id: datosClub.id,
    nombre: datosClub.nombre,
    contacto: datosClub.contacto,
    escudo_url: datosClub.escudo_url,
    dia_vencimiento: datosClub.dia_vencimiento,
    descuento_familiar_pct: datosClub.descuento_familiar_pct ?? 0,
    actualizado_en: datosClub.actualizado_en,
  };
}

export async function updateClubService(input: ClubInput): Promise<Club> {
  const ahora = new Date().toISOString();

  // Asegurar que exista
  await getClubService();

  await db
    .update(club)
    .set({
      nombre: input.nombre,
      contacto: input.contacto,
      escudo_url: input.escudo_url,
      dia_vencimiento: input.dia_vencimiento,
      descuento_familiar_pct: input.descuento_familiar_pct,
      actualizado_en: ahora,
    })
    .where(eq(club.id, 1));

  return getClubService();
}

