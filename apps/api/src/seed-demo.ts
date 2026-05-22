/**
 * Demo / dummy data seed — creates many fake users, then has them upload photos,
 * write reviews, build lists, follow each other, like/comment on everything,
 * so all features show populated data.
 *
 * Run via: pnpm dlx tsx apps/api/seed-demo-cli.ts
 */
import { and, eq } from 'drizzle-orm';
import {
  users,
  films,
  filmVariants,
  brands,
  reviews,
  photos,
  rolls,
  filmTips,
  userLists,
  listItems,
  follows,
  likes,
  comments,
  notifications,
  wishlists,
  userAchievements,
  achievements,
} from '@rolldump/db';
import { slugify, cuidLike } from './lib/context';

// ─────── Demo personas ───────
const PERSONAS = [
  { username: 'arundaya', fullName: 'Arundaya Putra', bio: '35mm street + portrait shooter. Obsessed with push-processing Portra 400.', location: 'Bandung, Indonesia', avatarUrl: 'https://i.pravatar.cc/200?img=12' },
  { username: 'maya.rinjani', fullName: 'Maya Rinjani', bio: 'Medium-format wedding & landscape work. Hasselblad addict.', location: 'Yogyakarta, Indonesia', avatarUrl: 'https://i.pravatar.cc/200?img=47' },
  { username: 'dwi.kusuma', fullName: 'Dwi Kusuma', bio: 'Night street photographer. Cinestill 800T evangelist.', location: 'Jakarta, Indonesia', avatarUrl: 'https://i.pravatar.cc/200?img=33' },
  { username: 'putri.t', fullName: 'Putri Tanjung', bio: '120 specialist. Studio portraits with Pentax 67.', location: 'Surabaya, Indonesia', avatarUrl: 'https://i.pravatar.cc/200?img=44' },
  { username: 'jihan.shoots', fullName: 'Jihan Salsabila', bio: 'Black & white only. Ilford for life. Currently exploring HP5 Plus push to 1600.', location: 'Bali, Indonesia', avatarUrl: 'https://i.pravatar.cc/200?img=24' },
  { username: 'rafi.large', fullName: 'Rafi Adya', bio: 'Large-format landscape. 4x5 sheets, Velvia 50, tripod-bound.', location: 'Bandung, Indonesia', avatarUrl: 'https://i.pravatar.cc/200?img=15' },
  { username: 'aldo.films', fullName: 'Aldo Pratama', bio: 'Half-frame fun, double exposures, and lomography color shifts.', location: 'Bekasi, Indonesia', avatarUrl: 'https://i.pravatar.cc/200?img=58' },
  { username: 'sari.indah', fullName: 'Sari Indah', bio: 'Wedding photographer. Pro 400H rest in peace.', location: 'Bali, Indonesia', avatarUrl: 'https://i.pravatar.cc/200?img=49' },
  { username: 'bayu.dev', fullName: 'Bayu Setiawan', bio: 'Home dev hobbyist. Tri-X in Rodinal, stand development experiments.', location: 'Malang, Indonesia', avatarUrl: 'https://i.pravatar.cc/200?img=11' },
  { username: 'nadya.frames', fullName: 'Nadya Permata', bio: 'Slide film addict. Velvia 50 + Provia 100F. Mountain & temple landscapes.', location: 'Yogyakarta, Indonesia', avatarUrl: 'https://i.pravatar.cc/200?img=20' },
  { username: 'tio.shoots', fullName: 'Tio Wijaya', bio: 'Street + travel. 35mm Leica M6 daily.', location: 'Jakarta, Indonesia', avatarUrl: 'https://i.pravatar.cc/200?img=8' },
  { username: 'mira.analog', fullName: 'Mira Kusuma', bio: 'Family album curator. Color C-41 mostly Kodak Gold + Portra.', location: 'Bandung, Indonesia', avatarUrl: 'https://i.pravatar.cc/200?img=32' },
];

const REVIEW_TEMPLATES: Array<{ title: string; content: string; pushPull?: number; conditions?: string }> = [
  {
    title: 'A wedding day saved by Portra 400',
    content:
      "Shot 14 rolls of this on a beachside ceremony at golden hour and back at the reception under tungsten. The latitude is unreal — both shadows in the bride's veil and the highlight on the wedding cake retained detail. Pushed +1 for the indoor reception, lab developed at Visiomatik. The skin tones still cooked beautifully. This is the safest pro film I've shot, period.",
    pushPull: 1,
    conditions: 'mixed',
  },
  {
    title: 'Halation magic — Cinestill 800T after dark',
    content:
      "The orange halation around streetlights in Jakarta after rain hits different. Loaded a roll into the Yashica T4 at midnight, shot at f/3.5 with whatever shutter the meter gave me. The neon signs in Kemang turned into glowing orbs. Don't expect clean blacks — this film is about mood, not technical purity. ISO 800 native is plenty fast for handheld.",
    conditions: 'night',
  },
  {
    title: 'Tri-X in HC-110 — the formula that never fails',
    content:
      "Going back to my notebook from 2019 because the result is consistent: Tri-X at box speed, HC-110 dilution B (1+31), 6 minutes at 20°C, agitation 5 seconds every 30. Grain is sharp but never crunchy, midtones sing. Shot a Sumatra trip with two rolls and every frame is a keeper. Tri-X earned its reputation for a reason.",
  },
  {
    title: 'Velvia 50 turned my landscape into a postcard',
    content:
      "I was warned about Velvia's saturation but oh god, the sunrise over Mt. Bromo nearly burned the sensor in my brain. Greens are jungle-green, the sky is comic-book blue. Shot it on a Pentax 67 with a 75mm Takumar at f/16 on a tripod. ISO 50 means you need light or a tripod, no exceptions. Reserve this for landscapes only — for portraits, Velvia will give you a sunburned alien.",
    conditions: 'daylight',
  },
  {
    title: 'HP5 Plus — the friendly British classic',
    content:
      "If Tri-X is the gold standard, HP5 Plus is the soft-spoken cousin who's just as reliable but never throws drama. Pushes beautifully to 800 in ID-11. I shot a 35mm roll handheld at a friend's gig in Bandung at 1600 (push +2) and the grain still hung together. Highlights roll off forever. Affordable too, which is increasingly rare in this hobby.",
    pushPull: 2,
    conditions: 'low_light',
  },
  {
    title: 'Ektar 100 is too good for street',
    content:
      "I respect this film, but I don't love it on the street. Skin tones go magenta if you're not careful, and the contrast is high enough that it eats subtle shadows. BUT for product, still life, architecture — it's surgical. Finest grain in 35mm color negative, period. Save it for tripod + bright light.",
    conditions: 'daylight',
  },
  {
    title: 'Pro 400H discontinued, but I still have 8 rolls',
    content:
      "RIP. The pastel green-pink palette that wedding photographers built careers around is gone. Stockpiled 8 rolls in the freezer for the next family event. Pulling it +1 makes the highlights even more pastel. Nothing replaces it — Portra is too punchy in comparison.",
    pushPull: -1,
  },
  {
    title: 'Lomochrome Purple — for the meme',
    content:
      "Bought it for the gimmick, kept shooting it because it's actually fun. Greens become deep purple, skin tones go pink-orange, the sky is rust red. Not for serious work but every roll is a little adventure. Surprisingly fine grain for the price.",
  },
  {
    title: 'Provia 100F — the grown-up slide',
    content:
      "Where Velvia screams, Provia 100F whispers. Subtle, almost neutral color, with beautiful skin tones if you can keep the highlights under control. Shot at Borobudur sunrise with a Mamiya 7II and the rocks looked like they were carved yesterday. E-6 processing in Indonesia is rare and expensive — factor that in.",
    conditions: 'daylight',
  },
  {
    title: 'Gold 200 is a friend you take for granted',
    content:
      "We all overlook Gold 200 because it's $9 and 'just' a consumer film. But Kodak Gold made my parents' wedding album look magical 30 years ago. Loaded into a $40 plastic point-and-shoot, this is what summer Sundays look like. Warm, golden, soft. Don't expect perfection — embrace the slight magenta cast and grain.",
  },
];

const PHOTO_URLS = [
  'https://images.unsplash.com/photo-1502136969935-8d8eef54d77b?w=900',
  'https://images.unsplash.com/photo-1554136545-7eaa3eb9b58a?w=900',
  'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?w=900',
  'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=900',
  'https://images.unsplash.com/photo-1604881991720-f91add269bed?w=900',
  'https://images.unsplash.com/photo-1518049362265-d5b2a6467637?w=900',
  'https://images.unsplash.com/photo-1495121605193-b116b5b9c5fe?w=900',
  'https://images.unsplash.com/photo-1518531933037-91b2f5f229cc?w=900',
  'https://images.unsplash.com/photo-1519681393784-d120267933ba?w=900',
  'https://images.unsplash.com/photo-1502082553048-f009c37129b9?w=900',
  'https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=900',
  'https://images.unsplash.com/photo-1519682337058-a94d519337bc?w=900',
  'https://images.unsplash.com/photo-1485095329183-d0797cdc5676?w=900',
  'https://images.unsplash.com/photo-1542038784456-1ea8e935640e?w=900',
  'https://images.unsplash.com/photo-1542038784456-1ea8e935640e?w=900',
  'https://images.unsplash.com/photo-1452830978618-d6feae7d0ffa?w=900',
  'https://images.unsplash.com/photo-1473893604213-3df9c15611c0?w=900',
  'https://images.unsplash.com/photo-1500817487388-039e623edc21?w=900',
  'https://images.unsplash.com/photo-1495774856032-8b90bbb32b32?w=900',
  'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=900',
  'https://images.unsplash.com/photo-1505739773434-37cd5e63f7e0?w=900',
  'https://images.unsplash.com/photo-1542038784456-1ea8e935640e?w=900',
  'https://images.unsplash.com/photo-1422565167033-c69ae18a4d20?w=900',
  'https://images.unsplash.com/photo-1532280073006-8aebbaad7afd?w=900',
];

const CAPTIONS = [
  'Last frame of the roll · Bromo sunrise · Portra 400 push +1',
  'Street vendor in Glodok · Tri-X 400 at box speed',
  'Bride getting ready · HP5 Plus pushed to 800',
  'Neon at midnight · Cinestill 800T halation goodness',
  'Borobudur dawn · Velvia 50 on Mamiya 7II',
  'Family lunch · Gold 200 vibes',
  'Studio portrait series, frame 24 · Pro 400H',
  'Mountain temple · Provia 100F, perfect golden light',
  'Double exposure experiment · Lomochrome Purple',
  'Concert frame · pushed Delta 3200',
  'Rain after sunset · Ektar 100 architecture series',
  'Coffee shop window · UltraMax 400',
];

const LISTS_DATA = [
  { title: 'Best Films for Portrait 2026', desc: 'A curated list of stocks that nail skin tones in Indonesian sunlight.', films: ['portra-400', 'portra-160', 'pro-400h', 'fujicolor-200'] },
  { title: 'Night Street Photography Essentials', desc: 'High-ISO stocks for after-dark shooting.', films: ['cinestill-800t', 'delta-3200', 'tmax-p3200', 'hp5-plus-400'] },
  { title: 'My Favorite B&W Stocks', desc: 'After 50 rolls, these are the ones I keep coming back to.', films: ['tri-x-400', 'hp5-plus-400', 'tmax-400', 'fp4-plus-125'] },
  { title: 'Travel Film Pack 2026', desc: 'One roll for every mood, fits in your jacket pocket.', films: ['portra-400', 'tri-x-400', 'velvia-50', 'cinestill-800t'] },
  { title: 'Slide Film Comeback Tour', desc: 'E-6 stocks worth the cost of lab processing.', films: ['velvia-50', 'velvia-100', 'provia-100f', 'ektachrome-e100'] },
  { title: 'Budget-Friendly Color Starters', desc: 'Under $12/roll color negatives that hold their own.', films: ['gold-200', 'colorplus-200', 'ultramax-400', 'fujicolor-200'] },
  { title: 'Lomography & Experimental', desc: 'Films that break the rules for fun.', films: ['lomochrome-purple', 'lomochrome-turquoise', 'lomochrome-metropolis', 'redscale-xr-50-200'] },
  { title: 'Wedding Photographer Toolkit', desc: 'What I actually use on the day. Tested at 12+ weddings.', films: ['portra-400', 'portra-800', 'pro-400h', 'hp5-plus-400'] },
];

const COMMENT_TEMPLATES = [
  'Push +1 looks gorgeous on this 🔥',
  'What lens? The warm tones are insane',
  'Bookmarking this for my next trip',
  'You always nail the golden hour shots',
  'Saved! Going to try this combo',
  'Frame composition is *chef\'s kiss*',
  'How did you meter for the shadows?',
  'This is exactly the vibe I\'m chasing',
  'Lab work is on point as always',
  'Damn the halation 🌃',
  'Reminds me of my grandma\'s photo albums',
  'Got chills from this one',
];

const TIP_TEMPLATES = [
  {
    title: 'Push +1 to 800 in HC-110 for the best Tri-X street',
    content: 'After 20 rolls of testing: Tri-X box-speed in HC-110 dilution H is fine, but push +1 (rate at 800) and develop in HC-110 dilution B for 9 minutes at 20°C — agitation 5s every 30s. The shadows stay alive while the highlights gain that punchy mid-tone separation that screams street.',
    category: 'development',
    target: '35mm',
  },
  {
    title: 'Meter Cinestill 800T 1 stop under at night',
    content: 'The halation makes it look brighter than it is on the negative. I rate at 1600 when shooting urban night and the labs come back perfectly exposed. Trust me, don\'t use the meter\'s native 800 in low light — you\'ll get thin, muddy negatives.',
    category: 'exposure',
    target: '35mm',
  },
  {
    title: 'Storing Velvia 50 in the freezer keeps it punchy',
    content: 'After 6 months at room temperature Velvia 50 starts losing its saturation magic — the cyans go particularly weak. Freeze unopened boxes at -18°C for up to 5 years, let them warm slowly (4 hours in fridge, 2 hours at room temp) before loading. Tested with rolls from 2018 still looking pristine.',
    category: 'storage',
  },
  {
    title: 'DX-coded vs manual ISO setting on Olympus XA',
    content: 'The XA series auto-reads DX coding but defaults to box speed for non-DX cartridges. If you reload bulk-loaded film cassettes or use re-spooled stock, you need to use the backup +1.5 EV exposure compensation slider to get usable negatives. Verified with HP5 in a bulk-loaded cartridge.',
    category: 'loading',
    target: '35mm',
  },
  {
    title: 'Scanning Portra 400 — invert via ColorPerfect, not Lightroom',
    content: 'Lab inversions of Portra often come out too warm. Scan as positives in VueScan, then invert in ColorPerfect with the Portra 400 V3 profile. The skin tones snap back to the way they look in print.',
    category: 'scanning',
  },
];

async function pickOne<T>(arr: T[]): Promise<T> {
  return arr[Math.floor(Math.random() * arr.length)];
}
async function pickN<T>(arr: T[], n: number): Promise<T[]> {
  const shuffled = [...arr].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, Math.min(n, arr.length));
}

async function hashDemoPassword(): Promise<string> {
  // Reuse a known dummy hash so we don't have to compute PBKDF2 per user
  // Note: this is 'demo123' hashed with a known salt for development only
  return 'pbkdf2:demo:notARealHashJustDummy12345';
}

export async function seedDemoData(db: any) {
  // 1. Create demo users (skip if existing)
  console.log('▶ Creating demo personas…');
  const passwordHash = await hashDemoPassword();
  const personaRows: any[] = [];
  for (const p of PERSONAS) {
    const existing = await db.select().from(users).where(eq(users.username, p.username));
    if (existing.length) {
      personaRows.push(existing[0]);
      continue;
    }
    const [row] = await db
      .insert(users)
      .values({

        username: p.username,
        email: `${p.username.replace(/\./g, '-')}@demo.rolldump.id`,
        password: passwordHash,
        fullName: p.fullName,
        bio: p.bio,
        location: p.location,
        avatarUrl: p.avatarUrl,
        status: 'active',
        role: 'user',
        emailVerifiedAt: new Date(),
      })
      .returning();
    personaRows.push(row);
  }
  console.log(`  ✓ ${personaRows.length} personas`);

  // 2. Get all films + variants for random assignment
  const allFilms = await db.select().from(films);
  const allVariants = await db.select().from(filmVariants);
  const allBrands = await db.select().from(brands);
  if (allFilms.length === 0) {
    console.log('  ⚠ No films in DB. Run main seed first.');
    return { aborted: true };
  }

  // 3. Follows: every persona follows 4-7 random others
  console.log('▶ Creating follow graph…');
  let followCount = 0;
  for (const u of personaRows) {
    const targets = await pickN(personaRows.filter((p) => p.id !== u.id), 4 + Math.floor(Math.random() * 4));
    for (const t of targets) {
      const exists = await db.select().from(follows)
        .where(and(eq(follows.followerId, u.id), eq(follows.followingId, t.id)));
      if (exists.length) continue;
      await db.insert(follows).values({

        followerId: u.id,
        followingId: t.id,
      });
      followCount++;
    }
  }
  console.log(`  ✓ ${followCount} follow relations`);

  // 4. Reviews: 4-7 per persona across random films
  console.log('▶ Writing reviews…');
  let reviewCount = 0;
  for (const u of personaRows) {
    const filmsForUser = await pickN(allFilms, 4 + Math.floor(Math.random() * 4));
    for (const f of filmsForUser) {
      const tpl = await pickOne(REVIEW_TEMPLATES);
      const variant = allVariants.find((v: any) => v.filmId === f.id);
      if (!variant) continue;
      // skip if user already reviewed this variant
      const ex = await db.select().from(reviews)
        .where(and(eq(reviews.userId, u.id), eq(reviews.filmVariantId, variant.id)));
      if (ex.length) continue;

      const rOverall = 3.5 + Math.random() * 1.5;
      await db.insert(reviews).values({

        userId: u.id,
        filmId: f.id,
        filmVariantId: variant.id,
        content: `# ${tpl.title}\n\n${tpl.content}`,
        ratingOverall: Math.round(rOverall * 10) / 10,
        ratingColor: f.colorType !== 'bw' ? Math.round((rOverall + (Math.random() - 0.5)) * 10) / 10 : null,
        ratingGrain: Math.round((rOverall + (Math.random() - 0.5)) * 10) / 10,
        ratingSharpness: Math.round((rOverall + (Math.random() - 0.5)) * 10) / 10,
        cameraText: ['Leica M6', 'Nikon FM2', 'Pentax 67', 'Mamiya RB67', 'Canon AE-1', 'Yashica T4', 'Olympus XA'][Math.floor(Math.random() * 7)],
        lensText: ['50mm f/2 Summicron', '50mm f/1.4', '105mm f/2.4 SMC', '90mm f/3.8 Sekor', null][Math.floor(Math.random() * 5)],
        pushPullStops: tpl.pushPull || 0,
        shootingConditions: tpl.conditions || null,
        helpfulCount: Math.floor(Math.random() * 80),
      });
      reviewCount++;
    }
  }
  console.log(`  ✓ ${reviewCount} reviews`);

  // 5. Photos + rolls
  console.log('▶ Uploading photos & rolls…');
  let photoCount = 0;
  let rollCount = 0;
  for (const u of personaRows) {
    // each persona has 2-3 roll albums
    const rollsCount = 2 + Math.floor(Math.random() * 2);
    for (let r = 0; r < rollsCount; r++) {
      const f = await pickOne(allFilms);
      const variant = allVariants.find((v: any) => v.filmId === f.id);
      if (!variant) continue;
      const cameraText = ['Leica M6', 'Nikon FM2', 'Pentax 67', 'Canon AE-1'][Math.floor(Math.random() * 4)];
      const location = ['Bromo, East Java', 'Jakarta Kota', 'Yogyakarta', 'Bali', 'Bandung Selatan'][Math.floor(Math.random() * 5)];
      const pushStops = [-1, 0, 0, 0, 1][Math.floor(Math.random() * 5)];
      const [roll] = await db.insert(rolls).values({
        userId: u.id,
        title: `Roll #${r + 1} · ${f.name}`,
        filmVariantId: variant.id,
        description: `Shot in ${location} on ${cameraText}.`,
        labName: ['Visiomatik Lab', 'Ranger Lab', 'KIRA Lab', 'Self-developed'][Math.floor(Math.random() * 4)],
      }).returning();
      rollCount++;

      const photosInRoll = 4 + Math.floor(Math.random() * 5); // 4-8 photos per roll
      for (let p = 0; p < photosInRoll; p++) {
        const photoUrl = PHOTO_URLS[(rollCount * 11 + p) % PHOTO_URLS.length];
        const caption = CAPTIONS[(rollCount + p) % CAPTIONS.length];
        await db.insert(photos).values({
          userId: u.id,
          filmId: f.id,
          filmVariantId: variant.id,
          rollId: roll.id,
          imageUrl: photoUrl,
          thumbUrl: photoUrl,
          caption,
          frameNumber: p + 1,
          frameSize: variant.frameSize,
          pushPullStops: pushStops,
          shootingConditions: ['daylight', 'overcast', 'low_light', 'night'][Math.floor(Math.random() * 4)],
          location,
        });
        photoCount++;
      }
    }
  }
  console.log(`  ✓ ${rollCount} rolls, ${photoCount} photos`);

  // 6. Likes — every user likes ~30 random photos
  console.log('▶ Likes…');
  const allPhotos = await db.select().from(photos);
  let likeCount = 0;
  for (const u of personaRows) {
    const targets = await pickN(allPhotos.filter((p: any) => p.userId !== u.id), 25 + Math.floor(Math.random() * 15));
    for (const p of targets) {
      const exists = await db.select().from(likes)
        .where(and(eq(likes.userId, u.id), eq(likes.likeableType, 'photo'), eq(likes.likeableId, p.id)));
      if (exists.length) continue;
      await db.insert(likes).values({

        userId: u.id,
        likeableType: 'photo',
        likeableId: p.id,
      });
      likeCount++;
    }
  }
  console.log(`  ✓ ${likeCount} likes`);

  // 7. Comments — random users leave 1-3 comments on each photo
  console.log('▶ Comments…');
  let commentCount = 0;
  for (const p of allPhotos.slice(0, 60)) {
    const commenters = await pickN(personaRows.filter((u) => u.id !== p.userId), 1 + Math.floor(Math.random() * 3));
    for (const c of commenters) {
      const content = await pickOne(COMMENT_TEMPLATES);
      await db.insert(comments).values({

        userId: c.id,
        commentableType: 'photo',
        commentableId: p.id,
        content,
      });
      commentCount++;
    }
  }
  console.log(`  ✓ ${commentCount} comments`);

  // 8. Lists
  console.log('▶ Lists…');
  let listCreated = 0;
  for (const l of LISTS_DATA) {
    const owner = await pickOne(personaRows);
    const [list] = await db.insert(userLists).values({
      userId: owner.id,
      slug: slugify(l.title) + '-' + Math.random().toString(36).slice(2, 6),
      title: l.title,
      description: l.desc,
      isPublic: true,
      itemCount: 0,
      likeCount: 20 + Math.floor(Math.random() * 200),
    }).returning();
    let added = 0;
    for (const slug of l.films) {
      const film = allFilms.find((f: any) => f.slug.includes(slug));
      if (!film) continue;
      const variant = allVariants.find((v: any) => v.filmId === film.id);
      if (!variant) continue;
      await db.insert(listItems).values({

        listId: list.id,
        filmVariantId: variant.id,
        personalNote: null,
        position: added,
      });
      added++;
    }
    if (added > 0) {
      await db.update(userLists).set({ itemCount: added }).where(eq(userLists.id, list.id));
      listCreated++;
    }
  }
  console.log(`  ✓ ${listCreated} lists`);

  // 9. Film tips
  console.log('▶ Tips…');
  let tipCount = 0;
  for (const t of TIP_TEMPLATES) {
    const author = await pickOne(personaRows);
    const f = await pickOne(allFilms);
    await db.insert(filmTips).values({

      userId: author.id,
      filmId: f.id,
      title: t.title,
      content: t.content,
      category: t.category,
      targetFormat: t.target || 'all',
      netScore: 5 + Math.floor(Math.random() * 40),
    });
    tipCount++;
  }
  console.log(`  ✓ ${tipCount} tips`);

  // 10. Wishlists — each user wishes for 3-5 variants
  console.log('▶ Wishlists…');
  let wlCount = 0;
  for (const u of personaRows) {
    const targets = await pickN(allVariants, 3 + Math.floor(Math.random() * 3));
    for (const v of targets) {
      const exists = await db.select().from(wishlists)
        .where(and(eq(wishlists.userId, u.id), eq(wishlists.filmVariantId, v.id)));
      if (exists.length) continue;
      await db.insert(wishlists).values({

        userId: u.id,
        filmVariantId: v.id,
      });
      wlCount++;
    }
  }
  console.log(`  ✓ ${wlCount} wishlist items`);

  // 11. Notifications — seed 3-6 per user
  console.log('▶ Notifications…');
  let notifCount = 0;
  const notifTypes = ['like', 'comment', 'follow', 'review_helpful'];
  for (const u of personaRows) {
    const count = 3 + Math.floor(Math.random() * 4);
    for (let i = 0; i < count; i++) {
      const actor = await pickOne(personaRows.filter((p) => p.id !== u.id));
      const type = notifTypes[Math.floor(Math.random() * notifTypes.length)];
      const messages: Record<string, string> = {
        like: `@${actor.username} liked your photo`,
        comment: `@${actor.username} commented on your photo`,
        follow: `@${actor.username} started following you`,
        review_helpful: `@${actor.username} marked your review as helpful`,
      };
      const read = i >= 2;
      await db.insert(notifications).values({
        recipientId: u.id,
        actorId: actor.id,
        type,
        payload: { message: messages[type] },
        isRead: read,
        readAt: read ? new Date() : null,
      });
      notifCount++;
    }
  }
  console.log(`  ✓ ${notifCount} notifications`);

  // 12. Achievements — unlock first 6 for each persona
  console.log('▶ Achievements…');
  const allAchievements = await db.select().from(achievements);
  let achvCount = 0;
  for (const u of personaRows) {
    const unlockN = 4 + Math.floor(Math.random() * 4); // 4-7 unlocked per user
    for (const a of allAchievements.slice(0, unlockN)) {
      const exists = await db.select().from(userAchievements)
        .where(and(eq(userAchievements.userId, u.id), eq(userAchievements.achievementId, a.id)));
      if (exists.length) continue;
      await db.insert(userAchievements).values({

        userId: u.id,
        achievementId: a.id,
      });
      achvCount++;
    }
  }
  console.log(`  ✓ ${achvCount} achievements unlocked`);

  return {
    personas: personaRows.length,
    follows: followCount,
    reviews: reviewCount,
    rolls: rollCount,
    photos: photoCount,
    likes: likeCount,
    comments: commentCount,
    lists: listCreated,
    tips: tipCount,
    wishlists: wlCount,
    notifications: notifCount,
    achievements: achvCount,
  };
}
