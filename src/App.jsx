import React, { useEffect, useState, useRef, useCallback } from 'react';
import { supabase } from './supabaseClient';

/* ============================================================
   HELPERS
   ============================================================ */
const XP_PER_MESSAGE = 10;
const RYOS_PER_MESSAGE = 10;
const XP_PER_LEVEL = 100;
const RYOS_PER_LEVELUP = 100;
const DAILY_RYOS = 50;
const FREE_SPIN_COOLDOWN_MS = 24 * 60 * 60 * 1000;
const SPIN_COST = 100;

function titleForLevel(level) {
  if (level >= 10) return 'Jônin';
  if (level >= 5) return 'Chûnin';
  return 'Genin';
}

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

/* ============================================================
   TOAST SYSTEM
   ============================================================ */
function useToasts() {
  const [toasts, setToasts] = useState([]);
  const push = useCallback((message, kind = 'info') => {
    const id = Math.random().toString(36).slice(2);
    setToasts((t) => [...t, { id, message, kind }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3500);
  }, []);
  return { toasts, push };
}

function ToastStack({ toasts }) {
  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-2">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`toast-in px-4 py-3 rounded-xl border shadow-lg text-sm font-semibold ${
            t.kind === 'levelup'
              ? 'bg-akagold/20 border-akagold text-akagold'
              : t.kind === 'error'
              ? 'bg-red-950 border-red-500 text-red-300'
              : 'bg-akacard border-white/10 text-white'
          }`}
        >
          {t.message}
        </div>
      ))}
    </div>
  );
}

/* ============================================================
   USERNAME BADGE (color / border / emoji equip)
   ============================================================ */
function UserBadge({ username, colorCode, borderEquip, emojiEquip }) {
  return (
    <span
      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full"
      style={{ border: borderEquip || 'none' }}
    >
      {emojiEquip && <span>{emojiEquip}</span>}
      <span style={{ color: colorCode || '#ffffff' }} className="font-bold">
        {username}
      </span>
    </span>
  );
}

/* ============================================================
   HEADER
   ============================================================ */
function CloudLogo() {
  // Nuage stylisé rouge (inspiré Akatsuki, dessin original)
  return (
    <svg width="34" height="34" viewBox="0 0 64 64" fill="none">
      <path
        d="M18 40c-7 0-12-5.5-12-12s5-12 11.5-12c1.5-6 7-10 13.5-10s12 4 13.5 10C51 16 57 21 57 28c0 6.5-5 12-12 12H18z"
        fill="#ff3b3b"
        stroke="#000"
        strokeWidth="2.5"
      />
      <circle cx="24" cy="26" r="3" fill="#000" />
      <circle cx="40" cy="26" r="3" fill="#000" />
    </svg>
  );
}

function Header({ profile, page, setPage, onLogout }) {
  const xpInLevel = profile ? profile.xp % XP_PER_LEVEL : 0;
  const links = [
    ['general', 'Général'],
    ['profil', 'Profil'],
    ['shop', 'Boutique'],
    ['jeux', 'Jeux'],
  ];
  return (
    <header className="sticky top-0 z-40 bg-[#150a0a]/95 backdrop-blur border-b border-white/10">
      <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-2">
          <CloudLogo />
          <span className="font-extrabold tracking-widest uppercase text-lg">
            Akatsuki<span className="text-akared">Hub</span>
          </span>
        </div>

        <nav className="flex gap-1 flex-wrap">
          {links.map(([id, label]) => (
            <button
              key={id}
              onClick={() => setPage(id)}
              className={`px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest transition ${
                page === id ? 'bg-akared text-white' : 'text-white/60 hover:text-white'
              }`}
            >
              {label}
            </button>
          ))}
        </nav>

        {profile && (
          <div className="flex items-center gap-3 text-sm">
            <div className="flex flex-col items-end leading-tight">
              <span className="font-bold text-akagold">💰 {profile.ryos} Ryôs</span>
              <span className="text-white/50 text-xs">
                Niv. {profile.level} · {xpInLevel}/{XP_PER_LEVEL} XP
              </span>
            </div>
            <button
              onClick={onLogout}
              className="px-3 py-1.5 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-bold uppercase tracking-widest"
            >
              Sortir
            </button>
          </div>
        )}
      </div>
    </header>
  );
}

/* ============================================================
   AUTH PAGE
   ============================================================ */
function AuthPage({ push }) {
  const [mode, setMode] = useState('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === 'login') {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      } else {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { username: username || email.split('@')[0] } },
        });
        if (error) throw error;
        push('Compte créé ! Vérifie ta boîte mail si la confirmation est activée.', 'levelup');
      }
    } catch (err) {
      push(err.message || 'Erreur', 'error');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4">
      <form
        onSubmit={submit}
        className="w-full max-w-sm bg-akacard border border-white/10 rounded-xl p-8 space-y-4"
      >
        <div className="flex justify-center mb-2"><CloudLogo /></div>
        <h1 className="text-center text-xl font-extrabold uppercase tracking-widest">
          Akatsuki<span className="text-akared">Hub</span>
        </h1>
        <p className="text-center text-white/50 text-sm">
          {mode === 'login' ? 'Connecte-toi à l\u2019organisation' : 'Rejoins l\u2019organisation'}
        </p>

        {mode === 'register' && (
          <input
            className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm"
            placeholder="Pseudo"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
        )}
        <input
          className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm"
          placeholder="Email"
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <input
          className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm"
          placeholder="Mot de passe"
          type="password"
          required
          minLength={6}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <button
          disabled={loading}
          className="w-full bg-akared rounded-full font-bold uppercase tracking-widest py-2.5 text-sm disabled:opacity-50"
        >
          {loading ? '...' : mode === 'login' ? 'Connexion' : 'Créer le compte'}
        </button>

        <button
          type="button"
          onClick={() => setMode(mode === 'login' ? 'register' : 'login')}
          className="w-full text-center text-xs text-white/50 hover:text-white"
        >
          {mode === 'login' ? "Pas de compte ? S'inscrire" : 'Déjà membre ? Se connecter'}
        </button>
      </form>
    </div>
  );
}

/* ============================================================
   GENERAL CHAT PAGE
   ============================================================ */
function GeneralPage({ session, profile, refreshProfile, push }) {
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [profilesCache, setProfilesCache] = useState({});
  const bottomRef = useRef(null);

  const loadProfile = useCallback(
    async (userId) => {
      if (profilesCache[userId]) return profilesCache[userId];
      const { data } = await supabase
        .from('profiles')
        .select('username,color_code,border_equip,emoji_equip')
        .eq('id', userId)
        .single();
      if (data) setProfilesCache((c) => ({ ...c, [userId]: data }));
      return data;
    },
    [profilesCache]
  );

  useEffect(() => {
    let active = true;
    (async () => {
      const { data } = await supabase
        .from('messages')
        .select('id, content, created_at, user_id')
        .eq('channel', 'general')
        .order('created_at', { ascending: true })
        .limit(100);
      if (!active || !data) return;
      setMessages(data);
      data.forEach((m) => loadProfile(m.user_id));
    })();

    const channel = supabase
      .channel('messages-general')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages', filter: 'channel=eq.general' },
        (payload) => {
          setMessages((prev) => [...prev, payload.new]);
          loadProfile(payload.new.user_id);
        }
      )
      .subscribe();

    return () => {
      active = false;
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  async function sendMessage(e) {
    e.preventDefault();
    const content = text.trim();
    if (!content) return;
    setText('');

    const { error } = await supabase.from('messages').insert({
      user_id: session.user.id,
      channel: 'general',
      content,
    });
    if (error) {
      push("Message non envoyé : " + error.message, 'error');
      return;
    }

    // Récompense: +10 xp / +10 ryôs, gestion du level up côté client
    const newXp = profile.xp + XP_PER_MESSAGE;
    const newLevel = Math.floor(newXp / XP_PER_LEVEL) + 1;
    const leveledUp = newLevel > profile.level;
    const newRyos = profile.ryos + RYOS_PER_MESSAGE + (leveledUp ? RYOS_PER_LEVELUP : 0);

    await supabase
      .from('profiles')
      .update({
        xp: newXp,
        ryos: newRyos,
        level: newLevel,
        title: titleForLevel(newLevel),
      })
      .eq('id', session.user.id);

    if (leveledUp) {
      push(`⬆️ Niveau ${newLevel} atteint ! +${RYOS_PER_LEVELUP} Ryôs`, 'levelup');
    }
    refreshProfile();
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-6">
      <div className="bg-akacard border border-white/10 rounded-xl p-4 flex flex-col h-[70vh]">
        <h2 className="uppercase tracking-widest text-sm text-white/50 font-bold mb-3">
          # général
        </h2>
        <div className="flex-1 overflow-y-auto space-y-2 pr-1">
          {messages.map((m) => {
            const p = profilesCache[m.user_id];
            return (
              <div key={m.id} className="text-sm">
                {p ? (
                  <UserBadge
                    username={p.username}
                    colorCode={p.color_code}
                    borderEquip={p.border_equip}
                    emojiEquip={p.emoji_equip}
                  />
                ) : (
                  <span className="font-bold text-white/50">...</span>
                )}
                <span className="text-white/40 mx-1">:</span>
                <span>{m.content}</span>
              </div>
            );
          })}
          <div ref={bottomRef} />
        </div>
        <form onSubmit={sendMessage} className="flex gap-2 mt-3">
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            className="flex-1 bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm"
            placeholder="Écris un message... (+10 Ryôs)"
            maxLength={400}
          />
          <button className="bg-akared rounded-full font-bold uppercase tracking-widest px-5 text-xs">
            Envoyer
          </button>
        </form>
      </div>
    </div>
  );
}

/* ============================================================
   PROFIL PAGE
   ============================================================ */
function ProfilPage({ session, profile, refreshProfile, push }) {
  const [editing, setEditing] = useState(false);
  const [username, setUsername] = useState(profile?.username || '');
  const [avatarUrl, setAvatarUrl] = useState(profile?.avatar_url || '');

  if (!profile) return null;
  const xpInLevel = profile.xp % XP_PER_LEVEL;
  const pct = Math.round((xpInLevel / XP_PER_LEVEL) * 100);
  const canDaily = profile.last_daily !== todayStr();

  async function saveEdit() {
    await supabase
      .from('profiles')
      .update({ username, avatar_url: avatarUrl })
      .eq('id', session.user.id);
    setEditing(false);
    refreshProfile();
  }

  async function claimDaily() {
    if (!canDaily) return;
    await supabase
      .from('profiles')
      .update({ ryos: profile.ryos + DAILY_RYOS, last_daily: todayStr() })
      .eq('id', session.user.id);
    push(`+${DAILY_RYOS} Ryôs (bonus quotidien) !`, 'levelup');
    refreshProfile();
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <div className="bg-akacard border border-white/10 rounded-xl p-6 space-y-5">
        <div className="flex items-center gap-4">
          <img
            src={profile.avatar_url || `https://api.dicebear.com/7.x/shapes/svg?seed=${profile.username}`}
            alt="avatar"
            className="w-20 h-20 rounded-full border-2 border-akared object-cover bg-black/40"
          />
          <div>
            <UserBadge
              username={profile.username}
              colorCode={profile.color_code}
              borderEquip={profile.border_equip}
              emojiEquip={profile.emoji_equip}
            />
            <p className="text-akagold text-sm font-bold uppercase tracking-widest mt-1">
              {titleForLevel(profile.level)} · Niv. {profile.level}
            </p>
          </div>
        </div>

        <div>
          <div className="flex justify-between text-xs text-white/50 mb-1">
            <span>{xpInLevel} / {XP_PER_LEVEL} XP</span>
            <span>{pct}%</span>
          </div>
          <div className="w-full h-3 bg-black/40 rounded-full overflow-hidden">
            <div className="h-full bg-akared" style={{ width: `${pct}%` }} />
          </div>
        </div>

        <p className="text-lg font-bold text-akagold">💰 {profile.ryos} Ryôs</p>

        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => setEditing((v) => !v)}
            className="bg-white/5 hover:bg-white/10 border border-white/10 rounded-full font-bold uppercase tracking-widest px-5 py-2 text-xs"
          >
            Éditer
          </button>
          <button
            onClick={claimDaily}
            disabled={!canDaily}
            className="bg-akared rounded-full font-bold uppercase tracking-widest px-5 py-2 text-xs disabled:opacity-40"
          >
            {canDaily ? `Daily +${DAILY_RYOS} Ryôs` : 'Déjà réclamé aujourd\u2019hui'}
          </button>
        </div>

        {editing && (
          <div className="space-y-2 pt-3 border-t border-white/10">
            <input
              className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Pseudo"
            />
            <input
              className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm"
              value={avatarUrl}
              onChange={(e) => setAvatarUrl(e.target.value)}
              placeholder="URL avatar"
            />
            <button
              onClick={saveEdit}
              className="bg-akared rounded-full font-bold uppercase tracking-widest px-5 py-2 text-xs"
            >
              Enregistrer
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

/* ============================================================
   SHOP PAGE
   ============================================================ */
function ShopPage({ session, profile, refreshProfile, push }) {
  const [tab, setTab] = useState('border');
  const [items, setItems] = useState([]);
  const [owned, setOwned] = useState(new Set());

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from('shop_items').select('*').eq('type', tab);
      setItems(data || []);
      const { data: inv } = await supabase
        .from('inventory')
        .select('item_id')
        .eq('user_id', session.user.id);
      setOwned(new Set((inv || []).map((i) => i.item_id)));
    })();
  }, [tab, session.user.id]);

  async function buy(item) {
    if (profile.ryos < item.price) {
      push('Pas assez de Ryôs !', 'error');
      return;
    }
    const { error } = await supabase.from('inventory').insert({
      user_id: session.user.id,
      item_id: item.id,
    });
    if (error) {
      push('Achat impossible : ' + error.message, 'error');
      return;
    }
    await supabase
      .from('profiles')
      .update({ ryos: profile.ryos - item.price })
      .eq('id', session.user.id);
    setOwned((o) => new Set(o).add(item.id));
    push(`${item.name} acheté !`, 'levelup');
    refreshProfile();
  }

  async function equip(item) {
    const field = tab === 'border' ? 'border_equip' : tab === 'color' ? 'color_code' : 'emoji_equip';
    await supabase
      .from('profiles')
      .update({ [field]: item.css_value })
      .eq('id', session.user.id);
    push(`${item.name} équipé.`);
    refreshProfile();
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      <div className="flex gap-2 mb-5">
        {[
          ['border', 'Bordures'],
          ['color', 'Couleurs'],
          ['emoji', 'Emoji'],
        ].map(([id, label]) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest ${
              tab === id ? 'bg-akared' : 'bg-white/5 border border-white/10 text-white/60'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        {items.map((item) => {
          const isOwned = owned.has(item.id);
          return (
            <div key={item.id} className="bg-akacard border border-white/10 rounded-xl p-4 flex flex-col gap-2">
              <div className="flex items-center justify-center h-16 text-2xl">
                {tab === 'color' && (
                  <div className="w-8 h-8 rounded-full border border-white/20" style={{ background: item.css_value }} />
                )}
                {tab === 'border' && (
                  <div className="w-10 h-10 rounded-full" style={{ border: item.css_value }} />
                )}
                {tab === 'emoji' && <span>{item.css_value}</span>}
              </div>
              <p className="font-bold text-sm text-center">{item.name}</p>
              <p className="text-center text-akagold text-xs uppercase tracking-widest">{item.rarity}</p>
              <p className="text-center text-sm">💰 {item.price} Ryôs</p>
              <button
                onClick={() => (isOwned ? equip(item) : buy(item))}
                className={`mt-1 rounded-full font-bold uppercase tracking-widest py-1.5 text-xs ${
                  isOwned ? 'bg-white/10 border border-white/20' : 'bg-akared'
                }`}
              >
                {isOwned ? 'Équiper' : 'Acheter'}
              </button>
            </div>
          );
        })}
        {items.length === 0 && (
          <p className="text-white/40 text-sm col-span-full text-center py-10">
            Aucun objet dans cette catégorie pour l\u2019instant.
          </p>
        )}
      </div>
    </div>
  );
}

/* ============================================================
   JEUX: ROUE SHARINGAN
   ============================================================ */
const WHEEL_SLICES = [
  { label: '10', value: 10 },
  { label: '50', value: 50 },
  { label: '100', value: 100 },
  { label: '200', value: 200 },
  { label: '500', value: 500 },
  { label: '10', value: 10 },
  { label: '50', value: 50 },
  { label: 'BONUS', value: 'bonus' },
];
const SLICE_ANGLE = 360 / WHEEL_SLICES.length;

function SharinganWheel({ session, profile, refreshProfile, push }) {
  const [spinInfo, setSpinInfo] = useState(null);
  const [rotation, setRotation] = useState(0);
  const [spinning, setSpinning] = useState(false);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from('spins').select('*').eq('user_id', session.user.id).single();
      setSpinInfo(data);
    })();
  }, [session.user.id]);

  const canFreeSpin =
    !spinInfo?.last_spin || Date.now() - new Date(spinInfo.last_spin).getTime() > FREE_SPIN_COOLDOWN_MS;

  async function spin() {
    if (spinning) return;
    if (!canFreeSpin) {
      if (profile.ryos < SPIN_COST) {
        push('Pas assez de Ryôs pour tourner !', 'error');
        return;
      }
      await supabase.from('profiles').update({ ryos: profile.ryos - SPIN_COST }).eq('id', session.user.id);
      refreshProfile();
    }

    setSpinning(true);
    const sliceIndex = Math.floor(Math.random() * WHEEL_SLICES.length);
    // On veut que le pointeur (en haut) tombe au centre de la tranche choisie
    const targetAngle = 360 * 6 - (sliceIndex * SLICE_ANGLE + SLICE_ANGLE / 2);
    setRotation((r) => r + (targetAngle - (r % 360)));

    setTimeout(async () => {
      const slice = WHEEL_SLICES[sliceIndex];
      const gain = slice.value === 'bonus' ? 300 : slice.value;
      await supabase
        .from('profiles')
        .update({ ryos: profile.ryos + (canFreeSpin ? 0 : -0) + gain })
        .eq('id', session.user.id);

      if (canFreeSpin) {
        await supabase
          .from('spins')
          .upsert({ user_id: session.user.id, last_spin: new Date().toISOString() });
        setSpinInfo({ user_id: session.user.id, last_spin: new Date().toISOString() });
      }

      push(slice.value === 'bonus' ? '🎉 BONUS ! +300 Ryôs' : `+${gain} Ryôs`, 'levelup');
      refreshProfile();
      setSpinning(false);
    }, 3000);
  }

  return (
    <div className="bg-akacard border border-white/10 rounded-xl p-6 flex flex-col items-center gap-4">
      <h3 className="uppercase tracking-widest text-sm font-bold text-white/60">Roue Sharingan</h3>
      <div className="relative w-56 h-56">
        <div
          className="w-full h-full rounded-full border-4 border-akagold relative overflow-hidden transition-transform"
          style={{
            transform: `rotate(${rotation}deg)`,
            transitionDuration: spinning ? '3s' : '0s',
            transitionTimingFunction: 'cubic-bezier(0.2, 0.8, 0.2, 1)',
            background: `conic-gradient(${WHEEL_SLICES.map(
              (s, i) => `${i % 2 === 0 ? '#ff3b3b' : '#0f0f0f'} ${i * SLICE_ANGLE}deg ${(i + 1) * SLICE_ANGLE}deg`
            ).join(',')})`,
          }}
        >
          {WHEEL_SLICES.map((s, i) => (
            <span
              key={i}
              className="absolute left-1/2 top-1/2 text-xs font-bold text-white"
              style={{
                transform: `rotate(${i * SLICE_ANGLE + SLICE_ANGLE / 2}deg) translate(0, -85px) rotate(90deg)`,
                transformOrigin: '0 0',
              }}
            >
              {s.label}
            </span>
          ))}
        </div>
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-14 h-14 rounded-full bg-black border-2 border-akared flex items-center justify-center text-xl">
            🔴
          </div>
        </div>
        <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-0 h-0 border-l-8 border-r-8 border-b-[14px] border-l-transparent border-r-transparent border-b-akagold" />
      </div>
      <button
        onClick={spin}
        disabled={spinning}
        className="bg-akared rounded-full font-bold uppercase tracking-widest px-6 py-2 text-xs disabled:opacity-50"
      >
        {spinning ? 'Ça tourne...' : canFreeSpin ? 'Tourner (gratuit)' : `Tourner (${SPIN_COST} Ryôs)`}
      </button>
    </div>
  );
}

/* ============================================================
   JEUX: QUIZ AKATSUKI
   ============================================================ */
const QUIZ_BANK = [
  { q: 'Quel est le nom du village natal de Naruto Uzumaki ?', opts: ['Konoha', 'Suna', 'Kiri', 'Iwa'], a: 0 },
  { q: 'Quel démon à queues est scellé en Naruto ?', opts: ['Shukaku', 'Kurama', 'Matatabi', 'Son Goku'], a: 1 },
  { q: 'Qui est le sensei de l\u2019équipe 7 ?', opts: ['Jiraiya', 'Kakashi', 'Asuma', 'Orochimaru'], a: 1 },
  { q: 'Quel clan possède le Sharingan ?', opts: ['Hyûga', 'Uchiha', 'Uzumaki', 'Nara'], a: 1 },
  { q: 'Quel est le nom de l\u2019organisation criminelle portant des nuages rouges ?', opts: ['Racine', 'Akatsuki', 'Suna Corp', 'Anbu'], a: 1 },
  { q: 'Quel dojutsu appartient au clan Hyûga ?', opts: ['Sharingan', 'Byakugan', 'Rinnegan', 'Tenseigan'], a: 1 },
  { q: 'Qui est le premier Hokage ?', opts: ['Hiruzen', 'Tobirama', 'Hashirama', 'Minato'], a: 2 },
  { q: 'Quel est le nom du renard à neuf queues ?', opts: ['Kurama', 'Gyûki', 'Shukaku', 'Isobu'], a: 0 },
  { q: 'Qui a créé la technique du Rasengan à l\u2019origine ?', opts: ['Naruto', 'Jiraiya', 'Minato', 'Kakashi'], a: 2 },
  { q: 'Quel est le rang le plus bas chez les ninjas ?', opts: ['Chûnin', 'Genin', 'Jônin', 'Anbu'], a: 1 },
  { q: 'Qui est le leader officiel de l\u2019Akatsuki présenté au village de la Pluie ?', opts: ['Pain', 'Obito', 'Konan', 'Zetsu'], a: 0 },
  { q: 'Quel est le surnom de Kakashi Hatake ?', opts: ['Le Ninja qui Copie', 'L\u2019Éclair Jaune', 'Le Croc Blanc', 'Le Serpent Blanc'], a: 0 },
  { q: 'Quelle technique est associée au clan Nara ?', opts: ['Contrôle des ombres', 'Expansion corporelle', 'Insectes', 'Argile explosive'], a: 0 },
  { q: 'Qui est surnommé "l\u2019Éclair Jaune de Konoha" ?', opts: ['Minato Namikaze', 'Kakashi Hatake', 'Might Guy', 'Asuma Sarutobi'], a: 0 },
  { q: 'Quel village est représenté par le symbole du sable ?', opts: ['Suna', 'Konoha', 'Kiri', 'Kumo'], a: 0 },
  { q: 'Quelle est l\u2019arme de prédilection de Temari ?', opts: ['Éventail géant', 'Marionnettes', 'Sabre', 'Chaînes'], a: 0 },
  { q: 'Qui manipule des marionnettes dans le village du Sable ?', opts: ['Kankurô', 'Gaara', 'Baki', 'Chiyo'], a: 0 },
  { q: 'Quel est le nom du sabre légendaire de Zabuza ?', opts: ['Kubikiribôchô', 'Samehada', 'Kusanagi', 'Nuibari'], a: 0 },
  { q: 'Quelle organisation dirige les forces spéciales secrètes de Konoha ?', opts: ['Anbu', 'Akatsuki', 'Racine', 'Kage'], a: 2 },
  { q: 'Qui est le sensei de l\u2019équipe de Rock Lee, Neji et Tenten ?', opts: ['Might Guy', 'Kakashi', 'Asuma', 'Kurenai'], a: 0 },
];

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function AkatsukiQuiz({ session, profile, refreshProfile, push }) {
  const [questions, setQuestions] = useState(() => shuffle(QUIZ_BANK).slice(0, 10));
  const [index, setIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [locked, setLocked] = useState(false);
  const [finished, setFinished] = useState(false);

  function restart() {
    setQuestions(shuffle(QUIZ_BANK).slice(0, 10));
    setIndex(0);
    setScore(0);
    setFinished(false);
    setLocked(false);
  }

  async function answer(i) {
    if (locked) return;
    setLocked(true);
    const correct = questions[index].a === i;
    if (correct) setScore((s) => s + 1);
    setTimeout(async () => {
      if (index + 1 >= questions.length) {
        const gained = (correct ? score + 1 : score) * 10;
        await supabase.from('profiles').update({ ryos: profile.ryos + gained }).eq('id', session.user.id);
        refreshProfile();
        push(`Quiz terminé : +${gained} Ryôs`, 'levelup');
        setFinished(true);
      } else {
        setIndex((i2) => i2 + 1);
      }
      setLocked(false);
    }, 600);
  }

  if (finished) {
    return (
      <div className="bg-akacard border border-white/10 rounded-xl p-6 text-center space-y-3">
        <h3 className="uppercase tracking-widest text-sm font-bold text-white/60">Quiz Akatsuki</h3>
        <p className="text-3xl font-extrabold text-akagold">{score} / {questions.length}</p>
        <button onClick={restart} className="bg-akared rounded-full font-bold uppercase tracking-widest px-6 py-2 text-xs">
          Rejouer
        </button>
      </div>
    );
  }

  const q = questions[index];
  return (
    <div className="bg-akacard border border-white/10 rounded-xl p-6 space-y-4">
      <h3 className="uppercase tracking-widest text-sm font-bold text-white/60">Quiz Akatsuki</h3>
      <p className="text-xs text-white/40">Question {index + 1} / {questions.length}</p>
      <p className="font-semibold">{q.q}</p>
      <div className="grid gap-2">
        {q.opts.map((o, i) => (
          <button
            key={i}
            onClick={() => answer(i)}
            className="text-left bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm hover:border-akared"
          >
            {o}
          </button>
        ))}
      </div>
    </div>
  );
}

function GamesPage({ session, profile, refreshProfile, push }) {
  return (
    <div className="max-w-4xl mx-auto px-4 py-6 grid md:grid-cols-2 gap-6">
      <SharinganWheel session={session} profile={profile} refreshProfile={refreshProfile} push={push} />
      <AkatsukiQuiz session={session} profile={profile} refreshProfile={refreshProfile} push={push} />
    </div>
  );
}

/* ============================================================
   APP ROOT
   ============================================================ */
export default function App() {
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [page, setPage] = useState('general');
  const [loading, setLoading] = useState(true);
  const { toasts, push } = useToasts();

  const refreshProfile = useCallback(async () => {
    const { data: { session: s } } = await supabase.auth.getSession();
    if (!s) return;
    const { data } = await supabase.from('profiles').select('*').eq('id', s.user.id).single();
    setProfile(data);
  }, []);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session: s } }) => {
      setSession(s);
      setLoading(false);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (session) refreshProfile();
    else setProfile(null);
  }, [session, refreshProfile]);

  async function logout() {
    await supabase.auth.signOut();
  }

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center text-white/50">Chargement...</div>;
  }

  if (!session) {
    return (
      <>
        <ToastStack toasts={toasts} />
        <AuthPage push={push} />
      </>
    );
  }

  return (
    <div className="min-h-screen">
      <ToastStack toasts={toasts} />
      <Header profile={profile} page={page} setPage={setPage} onLogout={logout} />
      {!profile ? (
        <div className="text-center text-white/50 py-20">Chargement du profil...</div>
      ) : (
        <>
          {page === 'general' && (
            <GeneralPage session={session} profile={profile} refreshProfile={refreshProfile} push={push} />
          )}
          {page === 'profil' && (
            <ProfilPage session={session} profile={profile} refreshProfile={refreshProfile} push={push} />
          )}
          {page === 'shop' && (
            <ShopPage session={session} profile={profile} refreshProfile={refreshProfile} push={push} />
          )}
          {page === 'jeux' && (
            <GamesPage session={session} profile={profile} refreshProfile={refreshProfile} push={push} />
          )}
        </>
      )}
    </div>
  );
}
