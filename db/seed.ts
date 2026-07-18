import "dotenv/config";
import { getDb } from "../api/queries/connection";
import { users, userBadges, products, stories } from "./schema";
import { hashPassword } from "../api/auth";

async function main() {
  const db = getDb();

  const sellers = [
    { username: "raka_gg", displayName: "Raka GG", avatar: "🐉", bio: "Seller akun ML & Genshin sejak 2019. Amanah, fast respon!", phone: "081234567890", qrisNote: "QRIS Raka Store", verified: true, badges: ["verified", "trusted", "top_seller", "fast_response"] },
    { username: "sellystore", displayName: "Selly Store", avatar: "👾", bio: "Jual akun murah meriah, garansi 7 hari.", phone: "089876543210", qrisNote: "QRIS Selly", verified: true, badges: ["verified", "fast_response"] },
    { username: "bima_pro", displayName: "Bima Pro", avatar: "⚔️", bio: "Spesialis akun Valorant & PUBG.", phone: "085612345678", verified: false, badges: ["new"] },
  ];

  const sellerIds: number[] = [];
  for (const s of sellers) {
    const [{ id }] = await db
      .insert(users)
      .values({
        username: s.username,
        displayName: s.displayName,
        avatar: s.avatar,
        bio: s.bio,
        phone: s.phone,
        qrisNote: s.qrisNote ?? null,
        isVerified: s.verified,
        passwordHash: hashPassword("password123"),
      })
      .$returningId();
    sellerIds.push(id);
    for (const b of s.badges) {
      await db.insert(userBadges).values({ userId: id, badge: b });
    }
  }

  const prods = [
    { sellerId: sellerIds[0], title: "Akun ML Mythic Glory 500 Pts | 120 Skin", game: "Mobile Legends", price: 1500000, image: "🛡️", level: "Mythic Glory", description: "Akun ML Mythic Glory, 120 skin (15 collector, 8 legend), hero lengkap. Email ganti, garansi 30 hari." },
    { sellerId: sellerIds[0], title: "Genshin Impact AR 58 | 12 Limited 5★", game: "Genshin Impact", price: 2800000, image: "🌸", level: "AR 58", description: "Raiden C2, Hu Tao C1, Ayaka, Zhongli, Nahida. Akun ori first-hand, no bekas top up ilegal." },
    { sellerId: sellerIds[0], title: "Akun PUBG Conqueror | Set M416 Glacier", game: "PUBG Mobile", price: 950000, image: "🔫", level: "Conqueror", description: "Title Conqueror S12, M416 Glacier max, banyak outfit rare." },
    { sellerId: sellerIds[1], title: "Akun FF Sultan | 50+ Bundle Incubator", game: "Free Fire", price: 650000, image: "🔥", level: "Heroic", description: "Akun FF sultan, bundle incubator lawas lengkap, SG2 ungu, vault 200+." },
    { sellerId: sellerIds[1], title: "Roblox Account | Headless + Korblox", game: "Roblox", price: 3200000, image: "🧱", level: "2016", description: "Akun Roblox 2016, Headless Horseman + Korblox Deathspeaker, limited items banyak." },
    { sellerId: sellerIds[1], title: "Akun ML Epic | 80 Skin Murah", game: "Mobile Legends", price: 350000, image: "⚡", level: "Epic", description: "Akun ML epic murah, cocok buat smurf. 80 skin, emblem max." },
    { sellerId: sellerIds[2], title: "Valorant Immortal 3 | 25 Skin Premium", game: "Valorant", price: 1750000, image: "🎯", level: "Immortal 3", description: "Reaver, Prime, Glitchpop collection. Region AP, email ganti." },
    { sellerId: sellerIds[2], title: "Akun Genshin AR 45 Starter Whale", game: "Genshin Impact", price: 450000, image: "⭐", level: "AR 45", description: "Furina + Neuvillette, pity 60, akun aman." },
  ];
  for (const p of prods) {
    await db.insert(products).values({ ...p, category: "Akun" });
  }

  const now = Date.now();
  const storyData = [
    { userId: sellerIds[0], text: "RESTOCK! Akun ML Mythic baru masuk, cek katalog 🔥", emoji: "🔥", color: "purple" },
    { userId: sellerIds[0], text: "Open PO joki rank minggu ini, slot terbatas!", emoji: "🏆", color: "blue" },
    { userId: sellerIds[1], text: "DISKON 20% semua akun Free Fire sampai Minggu 🎉", emoji: "🎉", color: "pink" },
    { userId: sellerIds[2], text: "Akun Valorant Immortal ready lagi, DM aja!", emoji: "🎯", color: "green" },
  ];
  for (const s of storyData) {
    await db.insert(stories).values({ ...s, expiresAt: new Date(now + 1000 * 60 * 60 * 20) });
  }

  console.log("Seed selesai! Login demo: raka_gg / password123");
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
