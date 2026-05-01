import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { AuthService, FilmService, ReviewService, PhotoService, TipService, ListService, DiscoveryService, SocialService } from '@rolldump/auth';
import { sign, verify } from 'hono/jwt';

type Bindings = {
  DATABASE_URL: string;
  JWT_SECRET?: string;
};

type Variables = {
  user: any;
  session: any;
  authService: AuthService;
  filmService: FilmService;
  reviewService: ReviewService;
  photoService: PhotoService;
  tipService: TipService;
  listService: ListService;
  discoveryService: DiscoveryService;
  socialService: SocialService;
};

const app = new Hono<{ Bindings: Bindings; Variables: Variables }>();

app.use('*', cors());

// Global instances to prevent connection exhaustion
let authServiceInstance: AuthService | null = null;
let filmServiceInstance: FilmService | null = null;
let reviewServiceInstance: ReviewService | null = null;
let photoServiceInstance: PhotoService | null = null;
let tipServiceInstance: TipService | null = null;
let listServiceInstance: ListService | null = null;
let discoveryServiceInstance: DiscoveryService | null = null;
let socialServiceInstance: SocialService | null = null;

// Middleware to inject services
app.use('*', async (c, next) => {
  if (!authServiceInstance) {
    authServiceInstance = new AuthService(c.env.DATABASE_URL);
  }
  if (!filmServiceInstance) {
    filmServiceInstance = new FilmService(c.env.DATABASE_URL);
  }
  if (!reviewServiceInstance) {
    reviewServiceInstance = new ReviewService(c.env.DATABASE_URL);
  }
  if (!photoServiceInstance) {
    photoServiceInstance = new PhotoService(c.env.DATABASE_URL);
  }
  if (!tipServiceInstance) {
    tipServiceInstance = new TipService(c.env.DATABASE_URL);
  }
  if (!listServiceInstance) {
    listServiceInstance = new ListService(c.env.DATABASE_URL);
  }
  if (!discoveryServiceInstance) {
    discoveryServiceInstance = new DiscoveryService(c.env.DATABASE_URL);
  }
  if (!socialServiceInstance) {
    socialServiceInstance = new SocialService(c.env.DATABASE_URL);
  }
  c.set('authService', authServiceInstance);
  c.set('filmService', filmServiceInstance);
  c.set('reviewService', reviewServiceInstance);
  c.set('photoService', photoServiceInstance);
  c.set('tipService', tipServiceInstance);
  c.set('listService', listServiceInstance);
  c.set('discoveryService', discoveryServiceInstance);
  c.set('socialService', socialServiceInstance);
  await next();
});

const getJwtSecret = (c: any) => c.env.JWT_SECRET || 'super-secret-key-for-dev-only-change-in-prod';

// Auth Middleware
export const authMiddleware = async (c: any, next: any) => {
  const authHeader = c.req.header('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return c.json({ error: 'Unauthorized: No token provided' }, 401);
  }

  const token = authHeader.split(' ')[1];
  try {
    const payload = await verify(token, getJwtSecret(c), 'HS256');
    c.set('user', { id: payload.sub, role: payload.role });
    await next();
  } catch (err: any) {
    console.error('JWT Verification error:', err);
    return c.json({ error: 'Invalid or expired token' }, 401);
  }
};

// Admin Middleware (must be used after authMiddleware)
const adminMiddleware = async (c: any, next: any) => {
  const user = c.get('user');
  if (user?.role !== 'admin') {
    return c.json({ error: 'Forbidden: Admin access required' }, 403);
  }
  await next();
};

const apiV1 = new Hono<{ Bindings: Bindings; Variables: Variables }>();

apiV1.post('/register', async (c) => {
  console.log('--- Mulai Registrasi ---');
  
  // TES KONEKSI INTERNET SEDERHANA
  try {
    console.log('Mengetes koneksi internet (ke google.com)...');
    const testFetch = await fetch('https://www.google.com', { method: 'HEAD' });
    console.log('Koneksi internet OK, status:', testFetch.status);
  } catch (e: any) {
    console.error('Koneksi internet GAGAL:', e.message);
  }

  try {
    const body = await c.req.json();
    const { email, username, password } = body;
    console.log('Request body diterima:', { email, username });

    if (!email || !username || !password || password.length < 8) {
      console.log('Validasi gagal');
      return c.json({ error: 'Format tidak valid. Pastikan semua field terisi dan password minimal 8 karakter.' }, 400);
    }

    const authService = c.get('authService');
    
    try {
      console.log('Mencoba menyimpan ke database...');
      const user = await authService.register({
        email,
        username,
        password,
        fullName: body.fullName || username,
        role: 'user',
        status: 'active'
      });
      console.log('Registrasi database sukses:', user.id);
      return c.json({ message: 'Registrasi berhasil', user }, 201);
    } catch (dbError: any) {
      console.error('Database Error:', dbError.message);
      if (dbError.message && dbError.message.includes('duplicate key')) {
        return c.json({ error: 'Email atau username sudah terdaftar.' }, 409);
      }
      throw dbError;
    }
  } catch (error: any) {
    console.error('General Error:', error.message);
    return c.json({ error: error.message }, 400);
  }
});

apiV1.post('/login', async (c) => {
  try {
    const body = await c.req.json();
    const authService = c.get('authService');
    const identifier = body.email || body.username;
    
    if (!identifier || !body.password) {
      return c.json({ error: 'Email/Username dan Password wajib diisi.' }, 400);
    }

    let user;
    try {
      user = await authService.login(identifier, body.password);
    } catch (e: any) {
      return c.json({ error: 'Kredensial salah.' }, 401);
    }

    const session = await authService.createSession(user.id);

    const payload = {
      sub: user.id,
      exp: Math.floor(Date.now() / 1000) + 60 * 60,
      role: user.role
    };
    const accessToken = await sign(payload, getJwtSecret(c), 'HS256');

    return c.json({ 
      access_token: accessToken,
      refresh_token: session.refreshToken,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role
      }
    }, 200);
  } catch (error: any) {
    return c.json({ error: error.message }, 400);
  }
});

apiV1.get('/users/:username', async (c) => {
  try {
    const authService = c.get('authService');
    const socialService = c.get('socialService');
    const username = c.req.param('username');
    const user = await authService.getUserByUsername(username);
    
    if (!user) {
      return c.json({ error: 'User not found' }, 404);
    }

    // Try to get viewer from JWT if present
    let viewerId: string | undefined;
    const authHeader = c.req.header('Authorization');
    if (authHeader?.startsWith('Bearer ')) {
      try {
        const token = authHeader.split(' ')[1];
        const payload = await verify(token, getJwtSecret(c), 'HS256');
        viewerId = payload.sub as string;
      } catch (e) {}
    }

    const stats = await socialService.getUserStats(user.id, viewerId);
    console.log(`[DEBUG] Profile fetch for ${username}: viewerId=${viewerId}, targetId=${user.id}, isFollowing=${stats.isFollowing}`);
    
    return c.json({ user, stats }, 200);
  } catch (error: any) {
    return c.json({ error: error.message }, 400);
  }
});

apiV1.put('/users/profile', authMiddleware, async (c) => {
  try {
    const authService = c.get('authService');
    const user = c.get('user');
    const body = await c.req.json();
    
    const updateData: any = {};
    if (body.fullName !== undefined) updateData.fullName = body.fullName;
    if (body.bio !== undefined) updateData.bio = body.bio;
    if (body.avatarUrl !== undefined) updateData.avatarUrl = body.avatarUrl;

    if (Object.keys(updateData).length === 0) {
      return c.json({ error: 'Tidak ada data yang diubah' }, 400);
    }

    const updatedUser = await authService.updateProfile(user.id, updateData);
    
    return c.json({ message: 'Perubahan disimpan', user: updatedUser }, 200);
  } catch (error: any) {
    console.error('Error in PUT /users/profile:', error);
    return c.json({ error: error.message || 'Terjadi kesalahan internal' }, 400);
  }
});

apiV1.put('/users/preferences', authMiddleware, async (c) => {
  try {
    const authService = c.get('authService');
    const user = c.get('user');
    const body = await c.req.json();
    
    if (!Array.isArray(body.preferences)) {
      return c.json({ error: 'Preferences must be an array' }, 400);
    }
    
    const updatedUser = await authService.updatePreferences(user.id, body.preferences);
    return c.json({ message: 'Preferences updated', user: updatedUser }, 200);
  } catch (error: any) {
    console.error('Error in PUT /users/preferences:', error);
    return c.json({ error: error.message || 'Terjadi kesalahan internal' }, 400);
  }
});

apiV1.delete('/users/account', authMiddleware, async (c) => {
  try {
    const authService = c.get('authService');
    const user = c.get('user');
    await authService.deleteAccount(user.id);
    return c.json({ message: 'Akun berhasil dihapus' }, 200);
  } catch (error: any) {
    console.error('Error in DELETE /users/account:', error);
    return c.json({ error: error.message || 'Terjadi kesalahan internal' }, 400);
  }
});

apiV1.post('/forgot-password', async (c) => {
  try {
    const authService = c.get('authService');
    const body = await c.req.json();
    
    if (!body.email) {
      return c.json({ error: 'Email is required' }, 400);
    }
    
    const token = await authService.createPasswordResetToken(body.email);
    
    if (token) {
      console.log(`[SMTP MOCK] Sending reset token to ${body.email}: ${token}`);
    }
    
    return c.json({ message: 'Tautan telah dikirim' }, 200);
  } catch (error: any) {
    return c.json({ error: error.message }, 400);
  }
});

apiV1.post('/reset-password', async (c) => {
  try {
    const authService = c.get('authService');
    const body = await c.req.json();
    
    if (!body.token || !body.password) {
      return c.json({ error: 'Token and new password are required' }, 400);
    }
    
    if (body.password.length < 8) {
      return c.json({ error: 'Password minimal 8 karakter.' }, 400);
    }
    
    await authService.resetPassword(body.token, body.password);
    return c.json({ message: 'Password berhasil diubah' }, 200);
  } catch (error: any) {
    return c.json({ error: error.message }, 400);
  }
});

// ── EPIC02: Film Roll Catalog Endpoints ──

// 1. Get Catalog (Enhanced with EPIC07)
apiV1.get('/films', async (c) => {
  try {
    const filmService = c.get('filmService');
    const query = c.req.query();
    
    // Parse filters
    const isos_query = query.isos ? query.isos.split(',').map(v => parseInt(v)).filter(v => !isNaN(v)) : undefined;
    const iso_min = query.iso_min ? parseInt(query.iso_min) : undefined;
    const iso_max = query.iso_max ? parseInt(query.iso_max) : undefined;
    
    const results = await filmService.getFilmsAdvanced({
      isos: isos_query,
      iso_min,
      iso_max,
      color_type: query.color_type,
      format: query.format,
      frame_size: query.frame_size,
      brand: query.brand,
      sort_by: query.sort_by,
      sort_order: query.sort_order as any,
      limit: query.limit ? parseInt(query.limit) : 20,
    });

    return c.json({ films: results }, 200);
  } catch (error: any) {
    console.error('Error in GET /films:', error);
    return c.json({ error: error.message }, 500);
  }
});

// 4. Katalog Trending (publik)
apiV1.get('/films/trending', async (c) => {
  try {
    const filmService = c.get('filmService');
    const limit = parseInt(c.req.query('limit') || '10');
    const result = await filmService.getTrendingFilms(limit);
    return c.json({ films: result }, 200);
  } catch (error: any) {
    console.error('Error in GET /films/trending:', error);
    return c.json({ error: error.message }, 500);
  }
});

// 2. Detail Film by slug (publik)
apiV1.get('/films/:slug', async (c) => {
  try {
    const filmService = c.get('filmService');
    const slug = c.req.param('slug');
    const film = await filmService.getFilmBySlug(slug);

    if (!film) {
      return c.json({ error: 'Film not found' }, 404);
    }

    return c.json({ film }, 200);
  } catch (error: any) {
    console.error('Error in GET /films/:slug:', error);
    return c.json({ error: error.message }, 500);
  }
});

// 3. Tambah Film (admin only)
apiV1.post('/admin/films', authMiddleware, adminMiddleware, async (c) => {
  try {
    const filmService = c.get('filmService');
    const body = await c.req.json();

    // Validasi ketat
    if (!body.name || !body.brand || !body.iso || !body.type) {
      return c.json({ error: 'Name, brand, ISO, dan type wajib diisi.' }, 400);
    }
    if (typeof body.iso !== 'number' || body.iso <= 0) {
      return c.json({ error: 'ISO harus berupa angka positif.' }, 400);
    }
    if (!['color', 'bw'].includes(body.type)) {
      return c.json({ error: 'Type harus "color" atau "bw".' }, 400);
    }
    if (!body.variants || !Array.isArray(body.variants) || body.variants.length === 0) {
      return c.json({ error: 'Minimal satu varian format diperlukan.' }, 400);
    }
    const validFormats = ['35mm', '120', 'large_format'];
    for (const v of body.variants) {
      if (!v.format || !validFormats.includes(v.format)) {
        return c.json({ error: `Format tidak valid: "${v.format}". Gunakan: ${validFormats.join(', ')}` }, 400);
      }
    }

    const film = await filmService.createFilm(body);
    return c.json({ message: 'Film berhasil ditambahkan', film }, 201);
  } catch (error: any) {
    console.error('Error in POST /admin/films:', error);
    if (error.message?.includes('duplicate key')) {
      return c.json({ error: 'Film dengan nama ini sudah ada.' }, 409);
    }
    return c.json({ error: error.message }, 500);
  }
});

// 5. Wishlist endpoints
apiV1.post('/wishlists', authMiddleware, async (c) => {
  try {
    const filmService = c.get('filmService');
    const user = c.get('user');
    const body = await c.req.json();

    if (!body.filmVariantId) {
      return c.json({ error: 'filmVariantId wajib diisi.' }, 400);
    }

    const entry = await filmService.addToWishlist(user.id, body.filmVariantId);
    return c.json({ message: 'Ditambahkan ke wishlist', wishlist: entry }, 201);
  } catch (error: any) {
    if (error.message === 'CONFLICT') {
      return c.json({ error: 'Varian ini sudah ada di wishlist Anda.' }, 409);
    }
    console.error('Error in POST /wishlists:', error);
    return c.json({ error: error.message }, 500);
  }
});

apiV1.delete('/wishlists/:filmVariantId', authMiddleware, async (c) => {
  try {
    const filmService = c.get('filmService');
    const user = c.get('user');
    const filmVariantId = c.req.param('filmVariantId');
    await filmService.removeFromWishlist(user.id, filmVariantId);
    return c.json({ message: 'Dihapus dari wishlist' }, 200);
  } catch (error: any) {
    console.error('Error in DELETE /wishlists:', error);
    return c.json({ error: error.message }, 500);
  }
});

apiV1.get('/wishlists', authMiddleware, async (c) => {
  try {
    const filmService = c.get('filmService');
    const user = c.get('user');
    const items = await filmService.getWishlist(user.id);
    return c.json({ wishlists: items }, 200);
  } catch (error: any) {
    console.error('Error in GET /wishlists:', error);
    return c.json({ error: error.message }, 500);
  }
});

apiV1.get('/wishlists/variant-ids', authMiddleware, async (c) => {
  try {
    const filmService = c.get('filmService');
    const user = c.get('user');
    const ids = await filmService.getUserWishlistVariantIds(user.id);
    return c.json({ variantIds: ids }, 200);
  } catch (error: any) {
    return c.json({ error: error.message }, 500);
  }
});

// ── EPIC03: Review & Rating System Endpoints ──

// 1. Create Review
apiV1.post('/reviews', authMiddleware, async (c) => {
  try {
    const reviewService = c.get('reviewService');
    const user = c.get('user');
    const body = await c.req.json();

    if (!body.filmId || !body.filmVariantId || !body.rating) {
      return c.json({ error: 'filmId, filmVariantId, dan rating wajib diisi.' }, 400);
    }
    if (body.rating < 1 || body.rating > 5) {
      return c.json({ error: 'Rating harus antara 1-5.' }, 400);
    }
    if (!body.content || body.content.length < 20) {
      return c.json({ error: 'Ulasan minimal 20 karakter.' }, 400);
    }

    const review = await reviewService.createReview({
      userId: user.id,
      filmId: body.filmId,
      filmVariantId: body.filmVariantId,
      rating: body.rating,
      content: body.content,
      cameraUsed: body.cameraUsed,
    });

    return c.json({ message: 'Ulasan berhasil dibuat', review }, 201);
  } catch (error: any) {
    console.error('Error in POST /reviews:', error);
    return c.json({ error: error.message }, 500);
  }
});

// 2. Edit Review
apiV1.put('/reviews/:id', authMiddleware, async (c) => {
  try {
    const reviewService = c.get('reviewService');
    const user = c.get('user');
    const reviewId = c.req.param('id');
    const body = await c.req.json();

    if (body.content && body.content.length < 20) {
      return c.json({ error: 'Ulasan minimal 20 karakter.' }, 400);
    }
    if (body.rating && (body.rating < 1 || body.rating > 5)) {
      return c.json({ error: 'Rating harus antara 1-5.' }, 400);
    }

    const updated = await reviewService.updateReview(reviewId, user.id, {
      rating: body.rating,
      content: body.content,
      cameraUsed: body.cameraUsed,
    });

    return c.json({ message: 'Ulasan berhasil diperbarui', review: updated }, 200);
  } catch (error: any) {
    if (error.message === 'FORBIDDEN') return c.json({ error: 'Anda tidak berhak mengedit ulasan ini.' }, 403);
    if (error.message === 'NOT_FOUND') return c.json({ error: 'Ulasan tidak ditemukan.' }, 404);
    console.error('Error in PUT /reviews/:id:', error);
    return c.json({ error: error.message }, 500);
  }
});

// 3. Get Reviews for Film (with format filter)
apiV1.get('/films/:slug/reviews', async (c) => {
  try {
    const reviewService = c.get('reviewService');
    const slug = c.req.param('slug');
    const format = c.req.query('format');

    const filmId = await reviewService.getFilmIdBySlug(slug);
    if (!filmId) return c.json({ error: 'Film tidak ditemukan.' }, 404);

    const reviewList = await reviewService.getFilmReviews(filmId, format || undefined);
    return c.json({ reviews: reviewList }, 200);
  } catch (error: any) {
    console.error('Error in GET /films/:slug/reviews:', error);
    return c.json({ error: error.message }, 500);
  }
});

// Helper: get user's upvoted review IDs for a set of reviews
apiV1.post('/reviews/upvoted', authMiddleware, async (c) => {
  try {
    const reviewService = c.get('reviewService');
    const user = c.get('user');
    const body = await c.req.json();
    const ids = await reviewService.getUserUpvotedReviewIds(user.id, body.reviewIds || []);
    return c.json({ upvotedIds: ids }, 200);
  } catch (error: any) {
    return c.json({ error: error.message }, 500);
  }
});

// 4. Soft Delete Review
apiV1.delete('/reviews/:id', authMiddleware, async (c) => {
  try {
    const reviewService = c.get('reviewService');
    const user = c.get('user');
    const reviewId = c.req.param('id');

    const isAdmin = user.role === 'admin';
    await reviewService.softDeleteReview(reviewId, user.id, isAdmin);
    return c.json({ message: 'Ulasan berhasil dihapus' }, 200);
  } catch (error: any) {
    if (error.message === 'FORBIDDEN') return c.json({ error: 'Anda tidak berhak menghapus ulasan ini.' }, 403);
    if (error.message === 'NOT_FOUND') return c.json({ error: 'Ulasan tidak ditemukan.' }, 404);
    console.error('Error in DELETE /reviews/:id:', error);
    return c.json({ error: error.message }, 500);
  }
});

// 5. Toggle Upvote
apiV1.post('/reviews/:id/upvote', authMiddleware, async (c) => {
  try {
    const reviewService = c.get('reviewService');
    const user = c.get('user');
    const reviewId = c.req.param('id');

    const result = await reviewService.toggleUpvote(reviewId, user.id);
    return c.json(result, 200);
  } catch (error: any) {
    console.error('Error in POST /reviews/:id/upvote:', error);
    return c.json({ error: error.message }, 500);
  }
});

// ── EPIC04: Photo Upload & Gallery ──

// 1. Upload Photo
apiV1.post('/photos', authMiddleware, async (c) => {
  try {
    const photoService = c.get('photoService');
    const user = c.get('user');
    const body = await c.req.json();

    if (!body.filmVariantId || !body.imageUrl) {
      return c.json({ error: 'filmVariantId dan imageUrl wajib diisi.' }, 400);
    }

    const photo = await photoService.createPhoto({
      userId: user.id,
      filmVariantId: body.filmVariantId,
      imageUrl: body.imageUrl,
      caption: body.caption,
      cameraUsed: body.cameraUsed,
      lensUsed: body.lensUsed,
    });

    return c.json({ message: 'Foto berhasil diunggah', photo }, 201);
  } catch (error: any) {
    console.error('Error in POST /photos:', error);
    return c.json({ error: error.message }, 500);
  }
});

// 2. Get Photos for Film
apiV1.get('/films/:slug/photos', async (c) => {
  try {
    const photoService = c.get('photoService');
    const slug = c.req.param('slug');
    const format = c.req.query('format');
    const frameSize = c.req.query('frameSize');

    const photos = await photoService.getFilmPhotos(slug, { format, frameSize });
    return c.json({ photos }, 200);
  } catch (error: any) {
    if (error.message === 'NOT_FOUND') return c.json({ error: 'Film tidak ditemukan.' }, 404);
    console.error('Error in GET /films/:slug/photos:', error);
    return c.json({ error: error.message }, 500);
  }
});

// 3. Get Photo Detail
apiV1.get('/photos/:id', async (c) => {
  try {
    const photoService = c.get('photoService');
    const photoId = c.req.param('id');

    const photo = await photoService.getPhotoById(photoId);
    if (!photo) return c.json({ error: 'Foto tidak ditemukan.' }, 404);

    return c.json({ photo }, 200);
  } catch (error: any) {
    console.error('Error in GET /photos/:id:', error);
    return c.json({ error: error.message }, 500);
  }
});

// 4. Get User Portfolio
apiV1.get('/users/:username/photos', async (c) => {
  try {
    const photoService = c.get('photoService');
    const username = c.req.param('username');

    const photos = await photoService.getUserPhotos(username);
    return c.json({ photos }, 200);
  } catch (error: any) {
    if (error.message === 'NOT_FOUND') return c.json({ error: 'User tidak ditemukan.' }, 404);
    console.error('Error in GET /users/:username/photos:', error);
    return c.json({ error: error.message }, 500);
  }
});

// 5. Delete Photo
apiV1.delete('/photos/:id', authMiddleware, async (c) => {
  try {
    const photoService = c.get('photoService');
    const user = c.get('user');
    const photoId = c.req.param('id');

    const isAdmin = user.role === 'admin';
    await photoService.deletePhoto(photoId, user.id, isAdmin);
    return c.json({ message: 'Foto berhasil dihapus' }, 200);
  } catch (error: any) {
    if (error.message === 'FORBIDDEN') return c.json({ error: 'Anda tidak berhak menghapus foto ini.' }, 403);
    if (error.message === 'NOT_FOUND') return c.json({ error: 'Foto tidak ditemukan.' }, 404);
    console.error('Error in DELETE /photos/:id:', error);
    return c.json({ error: error.message }, 500);
  }
});

// ── EPIC05: Tips & Guide System ──

// 1. Create Tip
apiV1.post('/films/:id/tips', authMiddleware, async (c) => {
  try {
    const tipService = c.get('tipService');
    const user = c.get('user');
    const filmId = c.req.param('id');
    const body = await c.req.json();

    if (!body.title || !body.content || !body.targetFormat) {
      return c.json({ error: 'Title, content, dan targetFormat wajib diisi.' }, 400);
    }

    const tip = await tipService.createTip({
      filmId,
      userId: user.id,
      title: body.title,
      content: body.content,
      targetFormat: body.targetFormat,
    });

    return c.json({ message: 'Tips berhasil dipublikasikan', tip }, 201);
  } catch (error: any) {
    if (error.message === 'LIMIT_EXCEEDED') return c.json({ error: 'Batas harian tercapai (maks 5 tips/hari).' }, 429);
    console.error('Error in POST /films/:id/tips:', error);
    return c.json({ error: error.message }, 500);
  }
});

// 2. Get Film Tips
apiV1.get('/films/:slug/tips', async (c) => {
  try {
    const tipService = c.get('tipService');
    const slug = c.req.param('slug');
    const format = c.req.query('format');
    const sort = c.req.query('sort') as 'top' | 'new';

    const tips = await tipService.getFilmTips(slug, { format, sort });
    return c.json({ tips }, 200);
  } catch (error: any) {
    if (error.message === 'NOT_FOUND') return c.json({ error: 'Film tidak ditemukan.' }, 404);
    console.error('Error in GET /films/:slug/tips:', error);
    return c.json({ error: error.message }, 500);
  }
});

// 3. Vote on Tip
apiV1.post('/tips/:id/vote', authMiddleware, async (c) => {
  try {
    const tipService = c.get('tipService');
    const user = c.get('user');
    const tipId = c.req.param('id');
    const body = await c.req.json();

    const result = await tipService.voteTip(tipId, user.id, body.voteType);
    return c.json(result, 200);
  } catch (error: any) {
    console.error('Error in POST /tips/:id/vote:', error);
    return c.json({ error: error.message }, 500);
  }
});

// 4. Admin: Update Datasheet
apiV1.put('/admin/films/:id/datasheet', authMiddleware, async (c) => {
  try {
    const tipService = c.get('tipService');
    const user = c.get('user');
    const filmId = c.req.param('id');
    const body = await c.req.json();

    if (user.role !== 'admin') return c.json({ error: 'Hanya admin yang diperbolehkan.' }, 403);
    if (!body.datasheetUrl) return c.json({ error: 'datasheetUrl wajib diisi.' }, 400);

    await tipService.updateDatasheet(filmId, body.datasheetUrl);
    return c.json({ message: 'Datasheet berhasil diperbarui' }, 200);
  } catch (error: any) {
    console.error('Error in PUT /admin/films/:id/datasheet:', error);
    return c.json({ error: error.message }, 500);
  }
});

// 5. Report Tip
apiV1.post('/tips/:id/report', authMiddleware, async (c) => {
  try {
    const tipService = c.get('tipService');
    const user = c.get('user');
    const tipId = c.req.param('id');
    const body = await c.req.json();

    if (!body.reason) return c.json({ error: 'Alasan pelaporan wajib diisi.' }, 400);

    await tipService.reportTip(tipId, user.id, {
      reason: body.reason,
      description: body.description,
    });

    return c.json({ message: 'Terima kasih atas laporan Anda. Moderator kami akan meninjaunya.' }, 201);
  } catch (error: any) {
    console.error('Error in POST /tips/:id/report:', error);
    return c.json({ error: error.message }, 500);
  }
});

// 6. Admin: Get All Reports
apiV1.get('/admin/reports', authMiddleware, async (c) => {
  try {
    const tipService = c.get('tipService');
    const user = c.get('user');
    if (user.role !== 'admin') return c.json({ error: 'Forbidden' }, 403);

    const reports = await tipService.getAllReports();
    return c.json({ reports }, 200);
  } catch (error: any) {
    console.error('Error in GET /admin/reports:', error);
    return c.json({ error: error.message }, 500);
  }
});

// 7. Admin: Delete Tip
apiV1.delete('/admin/tips/:id', authMiddleware, async (c) => {
  try {
    const tipService = c.get('tipService');
    const user = c.get('user');
    if (user.role !== 'admin') return c.json({ error: 'Forbidden' }, 403);

    const tipId = c.req.param('id');
    await tipService.deleteTip(tipId);
    return c.json({ message: 'Tips berhasil dihapus oleh admin' }, 200);
  } catch (error: any) {
    console.error('Error in DELETE /admin/tips/:id:', error);
    return c.json({ error: error.message }, 500);
  }
});

// ── EPIC06: List & Collection ──

// 1. Create List
apiV1.post('/lists', authMiddleware, async (c) => {
  try {
    const listService = c.get('listService');
    const user = c.get('user');
    const body = await c.req.json();

    const list = await listService.createList(user.id, body);
    return c.json({ list }, 201);
  } catch (error: any) {
    return c.json({ error: error.message }, 500);
  }
});

// 2. Get My Lists
apiV1.get('/my/lists', authMiddleware, async (c) => {
  try {
    const listService = c.get('listService');
    const user = c.get('user');
    const lists = await listService.getUserLists(user.id, true);
    return c.json({ lists }, 200);
  } catch (error: any) {
    return c.json({ error: error.message }, 500);
  }
});

// 3. Get User Public Lists
apiV1.get('/users/:username/lists', async (c) => {
  try {
    const listService = c.get('listService');
    const authService = c.get('authService');
    const username = c.req.param('username');
    
    const user = await authService.getUserByUsername(username);
    if (!user) return c.json({ error: 'User not found' }, 404);

    const lists = await listService.getUserLists(user.id, false);
    return c.json({ lists }, 200);
  } catch (error: any) {
    return c.json({ error: error.message }, 500);
  }
});

// 4. Explore Lists
apiV1.get('/lists/explore', async (c) => {
  try {
    const listService = c.get('listService');
    const lists = await listService.getExploreLists();
    return c.json({ lists }, 200);
  } catch (error: any) {
    return c.json({ error: error.message }, 500);
  }
});

// 5. Get List Detail
apiV1.get('/lists/:slug', async (c) => {
  try {
    const listService = c.get('listService');
    const slug = c.req.param('slug');
    
    // Optional auth for private list check
    const authHeader = c.req.header('Authorization');
    let userId: string | undefined;
    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      try {
        const payload = await verify(token, getJwtSecret(c), 'HS256');
        userId = payload.sub as string;
      } catch (err) {
        console.error('Optional JWT Verification error for list:', err);
      }
    }

    const list = await listService.getListBySlug(slug, userId);
    return c.json({ list }, 200);
  } catch (error: any) {
    if (error.message === 'NOT_FOUND') return c.json({ error: 'List not found' }, 404);
    if (error.message === 'FORBIDDEN') return c.json({ error: 'This list is private' }, 403);
    return c.json({ error: error.message }, 500);
  }
});

// 5. Add Item to List
apiV1.post('/lists/:id/items', authMiddleware, async (c) => {
  try {
    const listService = c.get('listService');
    const user = c.get('user');
    const listId = c.req.param('id');
    const body = await c.req.json();

    const item = await listService.addItemToList(listId, user.id, body);
    return c.json({ item }, 201);
  } catch (error: any) {
    if (error.message === 'CONFLICT') return c.json({ error: 'Film ini sudah ada di list Anda' }, 409);
    if (error.message === 'FORBIDDEN') return c.json({ error: 'Forbidden' }, 403);
    return c.json({ error: error.message }, 500);
  }
});

// 6. Remove Item from List
apiV1.delete('/lists/:id/items/:itemId', authMiddleware, async (c) => {
  try {
    const listService = c.get('listService');
    const user = c.get('user');
    const listId = c.req.param('id');
    const itemId = c.req.param('itemId');

    await listService.removeItemFromList(listId, itemId, user.id);
    return c.json({ message: 'Item dihapus dari list' }, 200);
  } catch (error: any) {
    return c.json({ error: error.message }, 500);
  }
});

// 8. Check if variant in lists
apiV1.get('/my/variant-lists/:variantId', authMiddleware, async (c) => {
  try {
    const listService = c.get('listService');
    const user = c.get('user');
    const variantId = c.req.param('variantId');

    const listIds = await listService.checkVariantInLists(user.id, variantId);
    return c.json({ listIds }, 200);
  } catch (error: any) {
    return c.json({ error: error.message }, 500);
  }
});

// 9. Update List Privacy
apiV1.patch('/lists/:id/privacy', authMiddleware, async (c) => {
  try {
    const listService = c.get('listService');
    const user = c.get('user');
    const listId = c.req.param('id');
    const body = await c.req.json();

    await listService.updateListPrivacy(listId, user.id, body.isPublic);
    return c.json({ message: 'Privasi list diperbarui' }, 200);
  } catch (error: any) {
    if (error.message === 'FORBIDDEN') return c.json({ error: 'Unauthorized' }, 403);
    return c.json({ error: error.message }, 500);
  }
});

// ── EPIC07: Search & Discovery Endpoints ──

// 1. Autocomplete Search
apiV1.get('/search/autocomplete', async (c) => {
  try {
    const discoveryService = c.get('discoveryService');
    const q = c.req.query('q');
    if (!q) return c.json({ films: [], users: [], lists: [] }, 200);

    const results = await discoveryService.autocomplete(q);
    return c.json(results, 200);
  } catch (error: any) {
    return c.json({ error: error.message }, 500);
  }
});

// 2. Brand Index
apiV1.get('/brands', async (c) => {
  try {
    const discoveryService = c.get('discoveryService');
    const brands = await discoveryService.getBrands();
    return c.json({ brands }, 200);
  } catch (error: any) {
    return c.json({ error: error.message }, 500);
  }
});

// 3. Film of the Day
apiV1.get('/discover/daily-featured', async (c) => {
  try {
    const discoveryService = c.get('discoveryService');
    const featured = await discoveryService.getDailyFeatured();
    return c.json({ featured }, 200);
  } catch (error: any) {
    return c.json({ error: error.message }, 500);
  }
});

// ── EPIC08: Social Interaction Endpoints ──

// 1. Follow / Unfollow Toggle
apiV1.post('/users/:username/follow', authMiddleware, async (c) => {
  try {
    const socialService = c.get('socialService');
    const user = c.get('user');
    const targetUsername = c.req.param('username');
    
    const result = await socialService.toggleFollow(user.id, targetUsername);
    return c.json(result, 200);
  } catch (error: any) {
    if (error.message === 'CANNOT_FOLLOW_SELF') return c.json({ error: error.message }, 400);
    return c.json({ error: error.message }, 500);
  }
});

// 2. Activity Feed
apiV1.get('/feed', authMiddleware, async (c) => {
  try {
    const socialService = c.get('socialService');
    const user = c.get('user');
    const cursor = c.req.query('cursor');
    const limit = c.req.query('limit') ? parseInt(c.req.query('limit')!) : 10;
    
    const feed = await socialService.getFeed(user.id, cursor, limit);
    return c.json(feed, 200);
  } catch (error: any) {
    return c.json({ error: error.message }, 500);
  }
});

// 3. Like Toggle (Polymorphic)
apiV1.post('/:entity_type/:id/like', authMiddleware, async (c) => {
  try {
    const socialService = c.get('socialService');
    const user = c.get('user');
    const entity_type = c.req.param('entity_type'); // 'photo', 'review', 'list'
    const id = c.req.param('id');
    
    const result = await socialService.toggleLike(user.id, id, entity_type);
    return c.json(result, 200);
  } catch (error: any) {
    return c.json({ error: error.message }, 500);
  }
});

// 4. Comments (Add & Get)
apiV1.post('/:entity_type/:id/comments', authMiddleware, async (c) => {
  try {
    const socialService = c.get('socialService');
    const user = c.get('user');
    const entity_type = c.req.param('entity_type');
    const id = c.req.param('id');
    const { content } = await c.req.json();
    
    const comment = await socialService.addComment(user.id, id, entity_type, content);
    return c.json({ comment }, 201);
  } catch (error: any) {
    if (error.message === 'RATE_LIMIT_EXCEEDED') return c.json({ error: 'Terlalu cepat! Tunggu 10 detik.' }, 429);
    return c.json({ error: error.message }, 500);
  }
});

apiV1.get('/:entity_type/:id/comments', async (c) => {
  try {
    const socialService = c.get('socialService');
    const entity_type = c.req.param('entity_type');
    const id = c.req.param('id');
    
    const comments = await socialService.getComments(id, entity_type);
    return c.json({ comments }, 200);
  } catch (error: any) {
    return c.json({ error: error.message }, 500);
  }
});

// 5. Notifications
apiV1.get('/notifications', authMiddleware, async (c) => {
  try {
    const socialService = c.get('socialService');
    const user = c.get('user');
    const notifications = await socialService.getNotifications(user.id);
    return c.json({ notifications }, 200);
  } catch (error: any) {
    return c.json({ error: error.message }, 500);
  }
});

apiV1.put('/notifications/:id/read', authMiddleware, async (c) => {
  try {
    const socialService = c.get('socialService');
    const user = c.get('user');
    const id = c.req.param('id');
    await socialService.markNotificationRead(id, user.id);
    return c.json({ success: true }, 200);
  } catch (error: any) {
    return c.json({ error: error.message }, 500);
  }
});

app.route('/api/v1', apiV1);


// Protected route example
app.get('/api/v1/me', authMiddleware, (c) => {
  const user = c.get('user');
  return c.json({ user });
});

export default app;
