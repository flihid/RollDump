import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQuery } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { Camera as CameraIcon, Star } from 'lucide-react';
import { api } from '../../lib/api';
import { StarRating, Loading, FormatBadge } from '../../components/common';

const CONDITIONS = ['daylight', 'overcast', 'indoor', 'low_light', 'night', 'mixed'];
const SCAN = ['lab', 'flatbed', 'dslr', 'drum'];

export default function WriteReview() {
  const { slug } = useParams();
  const nav = useNavigate();
  const film = useQuery({ queryKey: ['film', slug], queryFn: () => api.get(`/films/${slug}`), enabled: !!slug });

  const [variantId, setVariantId] = useState<string | null>(null);
  const [rating, setRating] = useState(0);
  const [color, setColor] = useState(0);
  const [grain, setGrain] = useState(0);
  const [sharp, setSharp] = useState(0);
  const [content, setContent] = useState('');
  const [cameraText, setCameraText] = useState('');
  const [lensText, setLensText] = useState('');
  const [pushPull, setPushPull] = useState(0);
  const [conditions, setConditions] = useState('');
  const [scan, setScan] = useState('');

  useEffect(() => {
    const variants = film.data?.film?.variants;
    if (variants?.length && !variantId) setVariantId(variants[0].id);
  }, [film.data, variantId]);

  const m = useMutation({
    mutationFn: () =>
      api.post('/reviews', {
        filmId: film.data!.film.id,
        filmVariantId: variantId,
        ratingOverall: rating,
        ratingColor: color || null,
        ratingGrain: grain || null,
        ratingSharpness: sharp || null,
        content,
        cameraText,
        lensText,
        pushPullStops: pushPull,
        shootingConditions: conditions || null,
        scanMethod: scan || null,
      }),
    onSuccess: () => {
      toast.success('Review published!');
      nav(`/films/${slug}`);
    },
    onError: (e: any) => toast.error(e.message),
  });

  if (film.isLoading) return <Loading />;
  const f = film.data!.film;
  const valid = rating > 0 && content.length >= 20 && variantId;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Write a review</h1>
        <p className="text-sm text-ink-600">{f.name} by {f.brand?.name}</p>
      </div>

      <div className="card p-6 space-y-6">
        <div>
          <div className="label">Format you shot</div>
          <div className="flex flex-wrap gap-2">
            {f.variants.map((v: any) => (
              <button
                key={v.id}
                type="button"
                onClick={() => setVariantId(v.id)}
                className={variantId === v.id ? 'chip-active' : 'chip'}
              >
                <FormatBadge format={v.format} />
              </button>
            ))}
          </div>
        </div>

        <div>
          <div className="label">Overall rating *</div>
          <StarRating value={rating} size="lg" onChange={setRating} />
        </div>

        <div className="grid sm:grid-cols-3 gap-4">
          <div>
            <div className="text-xs label">Color</div>
            <StarRating value={color} onChange={setColor} />
          </div>
          <div>
            <div className="text-xs label">Grain</div>
            <StarRating value={grain} onChange={setGrain} />
          </div>
          <div>
            <div className="text-xs label">Sharpness</div>
            <StarRating value={sharp} onChange={setSharp} />
          </div>
        </div>

        <div>
          <div className="label">Your experience *</div>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={6}
            placeholder="What's the color, grain, and latitude like? Where does it shine?"
            className="input"
          />
          <div className="text-xs text-ink-500 mt-1">{content.length}/5000 characters (min 20)</div>
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="label flex items-center gap-1">
              <CameraIcon className="w-3.5 h-3.5" /> Camera
            </label>
            <input className="input" value={cameraText} onChange={(e) => setCameraText(e.target.value)} placeholder="Yashica Mat-124G" />
          </div>
          <div>
            <label className="label">Lens</label>
            <input className="input" value={lensText} onChange={(e) => setLensText(e.target.value)} />
          </div>
        </div>

        <div>
          <div className="label">Push / Pull stops</div>
          <div className="flex items-center gap-3">
            <button type="button" onClick={() => setPushPull(Math.max(-3, pushPull - 1))} className="btn-secondary px-3">−</button>
            <span className="font-semibold w-10 text-center">{pushPull > 0 ? `+${pushPull}` : pushPull}</span>
            <button type="button" onClick={() => setPushPull(Math.min(3, pushPull + 1))} className="btn-secondary px-3">+</button>
          </div>
        </div>

        <div>
          <div className="label">Shooting conditions</div>
          <div className="flex flex-wrap gap-1.5">
            {CONDITIONS.map((c) => (
              <button key={c} type="button" onClick={() => setConditions(c === conditions ? '' : c)} className={c === conditions ? 'chip-active' : 'chip'}>
                {c}
              </button>
            ))}
          </div>
        </div>

        <div>
          <div className="label">Scan method</div>
          <div className="flex flex-wrap gap-1.5">
            {SCAN.map((c) => (
              <button key={c} type="button" onClick={() => setScan(c === scan ? '' : c)} className={c === scan ? 'chip-active' : 'chip'}>
                {c}
              </button>
            ))}
          </div>
        </div>

        <div className="flex gap-2 justify-end">
          <button onClick={() => nav(-1)} className="btn-ghost">Cancel</button>
          <button onClick={() => m.mutate()} disabled={!valid || m.isPending} className="btn-primary">
            <Star className="w-4 h-4" /> Publish
          </button>
        </div>
      </div>
    </div>
  );
}
