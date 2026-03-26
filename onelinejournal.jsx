import React, { useState, useEffect, useRef, useCallback } from "react";

const FONT_URL = "https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;1,300;1,400&family=Cormorant+SC:wght@300;400&family=DM+Mono:wght@300;400&display=swap";

const EMOTION_KEYWORDS = {
  joy: ["happy", "joy", "love", "wonderful", "amazing", "great", "beautiful", "smile", "laugh", "delight", "grateful", "excited", "bliss", "sunshine", "peace", "grateful", "warm", "bright"],
  melancholy: ["sad", "miss", "lost", "alone", "quiet", "grey", "tired", "heavy", "longing", "ache", "empty", "sigh", "drift", "distant", "fading", "hollow"],
  wonder: ["strange", "dream", "stars", "infinite", "vast", "imagine", "mystery", "wander", "curious", "magic", "sky", "universe", "beneath", "between", "beyond"],
  fire: ["angry", "frustrated", "fierce", "strong", "power", "fight", "burn", "rage", "passion", "intense", "force", "break", "push", "bold", "loud"],
  calm: ["still", "gentle", "soft", "slow", "breathe", "water", "rest", "simple", "quiet", "easy", "float", "smooth", "tender", "patient"],
};

function detectEmotion(text) {
  const lower = text.toLowerCase();
  const scores = {};
  for (const [emotion, words] of Object.entries(EMOTION_KEYWORDS)) {
    scores[emotion] = words.filter((w) => lower.includes(w)).length;
  }
  const best = Object.entries(scores).sort((a, b) => b[1] - a[1])[0];
  return best[1] > 0 ? best[0] : "calm";
}

const EMOTION_COLORS = {
  joy: { star: "#FAC775", line: "#EF9F2766", text: "#FAC775" },
  melancholy: { star: "#85B7EB", line: "#378ADD44", text: "#85B7EB" },
  wonder: { star: "#AFA9EC", line: "#7F77DD44", text: "#AFA9EC" },
  fire: { star: "#F0997B", line: "#D85A3044", text: "#F0997B" },
  calm: { star: "#9FE1CB", line: "#1D9E7544", text: "#9FE1CB" },
};

function seedRandom(seed) {
  let s = seed;
  return () => {
    s = (s * 16807 + 0) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

function ConstellationCanvas({ entries }) {
  const canvasRef = useRef();
  const animRef = useRef();
  const starsRef = useRef([]);
  const twinkleRef = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const W = (canvas.width = canvas.offsetWidth * window.devicePixelRatio);
    const H = (canvas.height = canvas.offsetHeight * window.devicePixelRatio);
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    const w = canvas.offsetWidth;
    const h = canvas.offsetHeight;

    // build star positions
    const stars = entries.map((entry, i) => {
      const rng = seedRandom(i * 9973 + entry.text.length * 31);
      const emotion = detectEmotion(entry.text);
      const col = EMOTION_COLORS[emotion];
      const intensity = Math.min(1, 0.4 + entry.text.length / 120);
      return {
        x: 0.06 * w + rng() * 0.88 * w,
        y: 0.06 * h + rng() * 0.88 * h,
        r: 1.5 + intensity * 3.5,
        color: col.star,
        lineColor: col.line,
        text: entry.text,
        day: entry.day,
        emotion,
        phase: rng() * Math.PI * 2,
        speed: 0.3 + rng() * 0.7,
      };
    });
    starsRef.current = stars;

    function draw(t) {
      ctx.clearRect(0, 0, w, h);

      // draw constellation lines
      for (let i = 0; i < stars.length - 1; i++) {
        const a = stars[i];
        const b = stars[i + 1];
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        ctx.strokeStyle = a.lineColor;
        ctx.lineWidth = 0.6;
        ctx.stroke();
      }

      // draw stars
      stars.forEach((s, i) => {
        const twinkle = 0.7 + 0.3 * Math.sin(t * 0.001 * s.speed + s.phase);
        const r = s.r * twinkle;
        // glow
        const grd = ctx.createRadialGradient(s.x, s.y, 0, s.x, s.y, r * 3.5);
        grd.addColorStop(0, s.color + "cc");
        grd.addColorStop(0.4, s.color + "44");
        grd.addColorStop(1, "transparent");
        ctx.beginPath();
        ctx.arc(s.x, s.y, r * 3.5, 0, Math.PI * 2);
        ctx.fillStyle = grd;
        ctx.fill();
        // core
        ctx.beginPath();
        ctx.arc(s.x, s.y, r, 0, Math.PI * 2);
        ctx.fillStyle = s.color;
        ctx.fill();

        // day number near star
        ctx.font = "300 10px 'DM Mono', monospace";
        ctx.fillStyle = s.color + "99";
        ctx.fillText(`${i + 1}`, s.x + r + 4, s.y + 4);
      });
    }

    function loop(t) {
      draw(t);
      animRef.current = requestAnimationFrame(loop);
    }
    animRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animRef.current);
  }, [entries]);

  return <canvas ref={canvasRef} style={{ width: "100%", height: "100%", display: "block", cursor: "crosshair" }} />;
}

function StarTooltip({ entry, pos }) {
  if (!entry) return null;
  const col = EMOTION_COLORS[detectEmotion(entry.text)];
  return (
    <div
      style={{
        position: "absolute",
        left: pos.x + 16,
        top: pos.y - 10,
        background: "#0a0a12ee",
        border: `0.5px solid ${col.star}44`,
        borderRadius: "8px",
        padding: "10px 14px",
        maxWidth: "220px",
        pointerEvents: "none",
        zIndex: 10,
      }}
    >
      <div style={{ fontSize: "10px", color: col.star, fontFamily: "'DM Mono', monospace", marginBottom: "4px" }}>
        day {entry.day} · {entry.date}
      </div>
      <div style={{ fontSize: "13px", color: "#e8e0d4", fontFamily: "'Cormorant Garamond', serif", fontStyle: "italic", lineHeight: 1.5 }}>
        "{entry.text}"
      </div>
      <div style={{ fontSize: "10px", color: col.star + "88", fontFamily: "'DM Mono', monospace", marginTop: "6px" }}>{entry.emotion}</div>
    </div>
  );
}

function AnimatedBackground({ theme }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    let rafId = 0;
    let stars = [];
    let shootingStars = [];
    let lastSpawnAt = 0;
    let w = 0;
    let h = 0;
    let dpr = 1;

    const initStars = () => {
      stars = Array.from({ length: 110 }, (_, i) => {
        const layer = i % 3;
        const depth = layer === 0 ? 0.35 : layer === 1 ? 0.65 : 1;
        return {
          x: Math.random() * w,
          y: Math.random() * h,
          r: 0.5 + Math.random() * 1.4 * depth,
          speedY: (0.03 + Math.random() * 0.12) * depth,
          speedX: (Math.random() - 0.5) * 0.05 * depth,
          pulse: Math.random() * Math.PI * 2,
          alpha: 0.2 + Math.random() * 0.5,
        };
      });
      shootingStars = [];
      lastSpawnAt = 0;
    };

    const spawnShootingStar = () => {
      const startX = Math.random() * w * 0.85;
      const startY = Math.random() * h * 0.45;
      const angle = (Math.PI / 180) * (20 + Math.random() * 20);
      const speed = 7 + Math.random() * 5;
      shootingStars.push({
        x: startX,
        y: startY,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 0,
        ttl: 42 + Math.random() * 18,
        length: 90 + Math.random() * 45,
      });
    };

    const resize = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = canvas.clientWidth;
      h = canvas.clientHeight;
      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      initStars();
    };

    const draw = (t) => {
      const time = t * 0.001;

      const bg = ctx.createLinearGradient(0, 0, 0, h);
      if (theme === "light") {
        bg.addColorStop(0, "#fdf9ff");
        bg.addColorStop(0.5, "#eef7ff");
        bg.addColorStop(1, "#f7fbff");
      } else {
        bg.addColorStop(0, "#070710");
        bg.addColorStop(0.5, "#0a0d1e");
        bg.addColorStop(1, "#05060e");
      }
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, w, h);

      // Slow moving haze to create atmospheric depth.
      const waveA = 24 * Math.sin(time * 0.35);
      const waveB = 20 * Math.cos(time * 0.28 + 1.4);

      const haze1 = ctx.createRadialGradient(w * 0.2 + waveA, h * 0.22, 10, w * 0.2 + waveA, h * 0.22, w * 0.55);
      haze1.addColorStop(0, theme === "light" ? "#8ec5ff55" : "#1b2d4d55");
      haze1.addColorStop(1, "transparent");
      ctx.fillStyle = haze1;
      ctx.fillRect(0, 0, w, h);

      const haze2 = ctx.createRadialGradient(w * 0.78 + waveB, h * 0.7, 10, w * 0.78 + waveB, h * 0.7, w * 0.5);
      haze2.addColorStop(0, theme === "light" ? "#ffb1d244" : "#28453f44");
      haze2.addColorStop(1, "transparent");
      ctx.fillStyle = haze2;
      ctx.fillRect(0, 0, w, h);

      stars.forEach((s) => {
        s.x += s.speedX + Math.sin(time * 0.25 + s.pulse) * 0.03;
        s.y += s.speedY;

        if (s.y > h + 3) s.y = -3;
        if (s.x > w + 3) s.x = -3;
        if (s.x < -3) s.x = w + 3;

        const twinkle = 0.65 + 0.35 * Math.sin(time * 2 + s.pulse);
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r * twinkle, 0, Math.PI * 2);
        const starAlpha = theme === "light" ? 0.55 * s.alpha * twinkle : s.alpha * twinkle;
        ctx.fillStyle = theme === "light" ? `rgba(91,112,186,${starAlpha})` : `rgba(255,255,255,${starAlpha})`;
        ctx.fill();
      });

      // Spawn a shooting star every few seconds with slight randomness.
      if (time - lastSpawnAt > 2.2 + Math.random() * 2.4) {
        spawnShootingStar();
        lastSpawnAt = time;
      }

      shootingStars = shootingStars.filter((comet) => {
        comet.life += 1;
        comet.x += comet.vx;
        comet.y += comet.vy;

        const progress = comet.life / comet.ttl;
        const alpha = Math.max(0, 1 - progress);
        if (alpha <= 0) return false;

        const tailX = comet.x - (comet.vx / 10) * comet.length;
        const tailY = comet.y - (comet.vy / 10) * comet.length;

        ctx.beginPath();
        ctx.moveTo(comet.x, comet.y);
        ctx.lineTo(tailX, tailY);
        const trail = ctx.createLinearGradient(comet.x, comet.y, tailX, tailY);
        if (theme === "light") {
          trail.addColorStop(0, `rgba(75,110,201,${0.85 * alpha})`);
          trail.addColorStop(0.35, `rgba(118,149,236,${0.45 * alpha})`);
          trail.addColorStop(1, "rgba(118,149,236,0)");
        } else {
          trail.addColorStop(0, `rgba(255,255,255,${0.95 * alpha})`);
          trail.addColorStop(0.35, `rgba(180,215,255,${0.45 * alpha})`);
          trail.addColorStop(1, "rgba(180,215,255,0)");
        }
        ctx.strokeStyle = trail;
        ctx.lineWidth = 1.4;
        ctx.lineCap = "round";
        ctx.stroke();

        // Bright comet head.
        ctx.beginPath();
        ctx.arc(comet.x, comet.y, 1.8, 0, Math.PI * 2);
        ctx.fillStyle = theme === "light" ? `rgba(84,119,214,${alpha})` : `rgba(255,255,255,${alpha})`;
        ctx.fill();

        return comet.life < comet.ttl && comet.x < w + 120 && comet.y < h + 120;
      });

      rafId = requestAnimationFrame(draw);
    };

    resize();
    rafId = requestAnimationFrame(draw);
    window.addEventListener("resize", resize);

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener("resize", resize);
    };
  }, [theme]);

  return <canvas ref={canvasRef} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", zIndex: 0, pointerEvents: "none" }} />;
}

function SpaceStructureOverlay({ theme }) {
  return (
    <>
      <div
        style={{
          position: "absolute",
          inset: 0,
          zIndex: 1,
          pointerEvents: "none",
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)",
          backgroundSize: "64px 64px",
          maskImage: "radial-gradient(circle at 50% 35%, black 15%, transparent 78%)",
          opacity: theme === "light" ? 0.18 : 0.35,
        }}
      />

      <div
        style={{
          position: "absolute",
          right: "-140px",
          top: "-120px",
          width: "420px",
          height: "420px",
          borderRadius: "50%",
          border: `1px solid ${theme === "light" ? "#6f9df144" : "#9FE1CB22"}`,
          zIndex: 1,
          pointerEvents: "none",
          animation: "orbitSpin 38s linear infinite",
        }}
      >
        <div
          style={{
            position: "absolute",
            left: "50%",
            top: "-6px",
            width: "10px",
            height: "10px",
            borderRadius: "50%",
            background: theme === "light" ? "#6f9df1" : "#9FE1CB",
            boxShadow: theme === "light" ? "0 0 14px #6f9df1" : "0 0 14px #9FE1CB",
            transform: "translateX(-50%)",
          }}
        />
      </div>

      <div
        style={{
          position: "absolute",
          left: "-120px",
          bottom: "-180px",
          width: "360px",
          height: "360px",
          borderRadius: "50%",
          border: `1px solid ${theme === "light" ? "#f38fb944" : "#85B7EB22"}`,
          zIndex: 1,
          pointerEvents: "none",
          animation: "orbitSpinReverse 42s linear infinite",
        }}
      >
        <div
          style={{
            position: "absolute",
            left: "50%",
            top: "-5px",
            width: "8px",
            height: "8px",
            borderRadius: "50%",
            background: theme === "light" ? "#f38fb9" : "#85B7EB",
            boxShadow: theme === "light" ? "0 0 12px #f38fb9" : "0 0 12px #85B7EB",
            transform: "translateX(-50%)",
          }}
        />
      </div>
    </>
  );
}

// Prefill 12 demo days so the app feels alive on first load
function buildDemoEntries() {
  const demos = [
    "The morning light came through crooked blinds and made me feel briefly infinite.",
    "Forgot to eat lunch, remembered at dusk, didn't mind.",
    "A stranger smiled at me and I thought about it for three hours.",
    "Everything felt loud today, even the silence.",
    "I fixed the thing I'd been avoiding for two weeks.",
    "Called my mother, talked about nothing, felt everything.",
    "Rain on the window, tea going cold, perfectly content.",
    "Angry at something small, then embarrassed about the anger.",
    "Dreamed of a city I've never been to but somehow know.",
    "Wrote this sentence six times before it felt honest.",
    "The stars were out and I stood in the cold just to see them.",
    "Something is shifting, slowly, quietly - I can feel it.",
  ];
  const today = new Date();
  return demos.map((text, i) => {
    const d = new Date(today);
    d.setDate(d.getDate() - (demos.length - 1 - i));
    return {
      day: i + 1,
      date: d.toLocaleDateString("en-GB", { day: "numeric", month: "short" }),
      text,
      emotion: detectEmotion(text),
      timestamp: d.getTime(),
    };
  });
}

const VIEWS = { dashboard: "dashboard", write: "write", constellation: "constellation", archive: "archive" };

function getCurrentStreak(entries) {
  if (!entries.length) return 0;
  const daySet = new Set(entries.map((e) => {
    const d = new Date(e.timestamp);
    return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  }));
  const sortedDays = [...daySet].sort((a, b) => b - a);
  let streak = 1;
  for (let i = 1; i < sortedDays.length; i++) {
    const prev = sortedDays[i - 1];
    const cur = sortedDays[i];
    if (prev - cur === 24 * 60 * 60 * 1000) streak += 1;
    else break;
  }
  return streak;
}

function getLongestStreak(entries) {
  if (!entries.length) return 0;
  const daySet = new Set(entries.map((e) => {
    const d = new Date(e.timestamp);
    return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  }));
  const sortedDays = [...daySet].sort((a, b) => a - b);
  let longest = 1;
  let current = 1;
  for (let i = 1; i < sortedDays.length; i++) {
    if (sortedDays[i] - sortedDays[i - 1] === 24 * 60 * 60 * 1000) current += 1;
    else current = 1;
    if (current > longest) longest = current;
  }
  return longest;
}

function calculateCredits(entries) {
  const base = entries.length * 25;
  const currentStreak = getCurrentStreak(entries);
  const longestStreak = getLongestStreak(entries);
  const counts = Object.keys(EMOTION_COLORS).reduce((acc, emotion) => {
    acc[emotion] = entries.filter((e) => e.emotion === emotion).length;
    return acc;
  }, {});
  const emotionVariety = Object.values(counts).filter((n) => n > 0).length;
  const streakBonus = currentStreak * 12 + longestStreak * 8;
  const varietyBonus = emotionVariety * 20;
  const total = base + streakBonus + varietyBonus;
  return { total, currentStreak, longestStreak, emotionVariety };
}

function calculateEntryCredits(nextEntries, textLength) {
  const streak = getCurrentStreak(nextEntries);
  const base = 25;
  const lengthBonus = Math.min(14, Math.floor(textLength / 10));
  const streakBonus = Math.min(42, streak * 3);
  const milestoneBonus = streak > 0 && streak % 7 === 0 ? 35 : 0;
  return base + lengthBonus + streakBonus + milestoneBonus;
}

export default function App() {
  const [entries, setEntries] = useState(buildDemoEntries);
  const [theme, setTheme] = useState("dark");
  const [view, setView] = useState(VIEWS.dashboard);
  const [input, setInput] = useState("");
  const [saved, setSaved] = useState(false);
  const [tooltip, setTooltip] = useState({ entry: null, pos: { x: 0, y: 0 } });
  const [hoveredDay, setHoveredDay] = useState(null);
  const [emotionFocus, setEmotionFocus] = useState("all");
  const [lastEarnedCredits, setLastEarnedCredits] = useState(0);
  const canvasWrapRef = useRef();
  const textareaRef = useRef();

  useEffect(() => {
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = FONT_URL;
    document.head.appendChild(link);

    const styleEl = document.createElement("style");
    styleEl.id = "space-ui-keyframes";
    styleEl.textContent = `
      @keyframes orbitSpin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      @keyframes orbitSpinReverse { from { transform: rotate(360deg); } to { transform: rotate(0deg); } }
      @keyframes floatPanel { 0% { transform: translateY(0px); } 50% { transform: translateY(-5px); } 100% { transform: translateY(0px); } }
      @keyframes pulseEdge { 0% { box-shadow: 0 0 0 rgba(159,225,203,0); } 50% { box-shadow: 0 0 20px rgba(159,225,203,0.16); } 100% { box-shadow: 0 0 0 rgba(159,225,203,0); } }
      @keyframes revealUp { from { opacity: 0; transform: translateY(14px); } to { opacity: 1; transform: translateY(0); } }
      @keyframes softGlow { 0% { filter: saturate(1) brightness(1); } 50% { filter: saturate(1.08) brightness(1.08); } 100% { filter: saturate(1) brightness(1); } }
      @keyframes breathScale { 0% { transform: scale(1); } 50% { transform: scale(1.01); } 100% { transform: scale(1); } }
    `;
    if (!document.getElementById(styleEl.id)) document.head.appendChild(styleEl);

    return () => {
      if (styleEl.parentNode) styleEl.parentNode.removeChild(styleEl);
    };
  }, []);

  const todayStr = new Date().toLocaleDateString("en-GB", { day: "numeric", month: "short" });
  const alreadyWroteToday = entries.some((e) => e.date === todayStr);
  const charCount = input.length;
  const maxChars = 140;
  const nextDay = entries.length + 1;
  const progress = Math.min(entries.length / 30, 1);
  const completionPct = Math.round(progress * 100);
  const totalChars = entries.reduce((sum, e) => sum + e.text.length, 0);
  const averageChars = entries.length ? Math.round(totalChars / entries.length) : 0;
  const currentStreak = getCurrentStreak(entries);
  const longestEntry = entries.reduce((acc, e) => (e.text.length > acc.text.length ? e : acc), { text: "", day: 0, emotion: "calm" });
  const emotionCounts = Object.keys(EMOTION_COLORS).reduce((acc, emotion) => {
    acc[emotion] = entries.filter((e) => e.emotion === emotion).length;
    return acc;
  }, {});
  const dominantEmotion = Object.entries(emotionCounts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "calm";
  const focusedEntries = emotionFocus === "all" ? entries : entries.filter((e) => e.emotion === emotionFocus);
  const recentEntries = [...entries].sort((a, b) => b.timestamp - a.timestamp).slice(0, 4);
  const dashboardWide = typeof window !== "undefined" && window.innerWidth >= 1200;
  const dashboardUltra = typeof window !== "undefined" && window.innerWidth >= 1550;
  const creditData = calculateCredits(entries);
  const credits = creditData.total;
  const level = Math.max(1, Math.floor(credits / 200) + 1);
  const levelFloor = (level - 1) * 200;
  const levelProgressPct = Math.round(((credits - levelFloor) / 200) * 100);
  const missionCards = [
    {
      key: "streak3",
      title: "Orbit Stabilizer",
      note: "Keep a 3-day streak active",
      progress: Math.min(currentStreak, 3),
      target: 3,
      reward: 60,
    },
    {
      key: "variety4",
      title: "Nebula Sampler",
      note: "Use 4 emotion types",
      progress: Math.min(creditData.emotionVariety, 4),
      target: 4,
      reward: 80,
    },
    {
      key: "entry30",
      title: "Galaxy Cartographer",
      note: "Reach 30 total entries",
      progress: Math.min(entries.length, 30),
      target: 30,
      reward: 150,
    },
  ];
  const badgeItems = [
    { key: "spark", label: "first spark", unlocked: entries.length >= 1 },
    { key: "steady", label: "steady writer", unlocked: creditData.currentStreak >= 3 },
    { key: "week", label: "week warrior", unlocked: creditData.currentStreak >= 7 },
    { key: "emotions", label: "emotion explorer", unlocked: creditData.emotionVariety >= 4 },
    { key: "galaxy", label: "constellation master", unlocked: entries.length >= 30 },
  ];

  const handleSave = () => {
    if (!input.trim() || alreadyWroteToday) return;
    const entry = {
      day: nextDay,
      date: todayStr,
      text: input.trim(),
      emotion: detectEmotion(input),
      timestamp: Date.now(),
    };
    const nextEntries = [...entries, entry];
    setEntries(nextEntries);
    setLastEarnedCredits(calculateEntryCredits(nextEntries, entry.text.length));
    setInput("");
    setSaved(true);
    setTimeout(() => setLastEarnedCredits(0), 2600);
    setTimeout(() => {
      setSaved(false);
      setView(VIEWS.constellation);
    }, 1200);
  };

  const handleCanvasMouseMove = useCallback(
    (e) => {
      if (!canvasWrapRef.current) return;
      const rect = canvasWrapRef.current.getBoundingClientRect();
      const mx = e.clientX - rect.left;
      const my = e.clientY - rect.top;
      const W = rect.width;
      const H = rect.height;

      let found = null;
      for (const entry of entries) {
        const i = entry.day - 1;
        const rng = seedRandom(i * 9973 + entry.text.length * 31);
        const x = 0.06 * W + rng() * 0.88 * W;
        const y = 0.06 * H + rng() * 0.88 * H;
        const dist = Math.hypot(mx - x, my - y);
        if (dist < 18) {
          found = { entry, x: mx, y: my };
          break;
        }
      }
      setTooltip(found ? { entry: found.entry, pos: { x: found.x, y: found.y } } : { entry: null, pos: { x: 0, y: 0 } });
    },
    [entries],
  );

  const bg = theme === "light" ? "#f7fbff" : "#06060f";
  const panel = theme === "light" ? "#ffffffec" : "#0d0d1a";
  const isLight = theme === "light";
  const themePalette = isLight
    ? {
        bg: "#f7fbff",
        panel: "#ffffffd9",
        panelStrong: "#ffffff",
        text: "#293551",
        muted: "#5f6c86",
        border: "#cfdcf5",
        soft: "#ebf2ff",
        accent: "#5f84ff",
        accent2: "#f372ae",
      }
    : {
        bg,
        panel,
        panelStrong: "#0b0f1dba",
        text: "#e8e0d4",
        muted: "#ffffff66",
        border: "#ffffff1f",
        soft: "#ffffff08",
        accent: "#9FE1CB",
        accent2: "#85B7EB",
      };
  const textMain = isLight ? "#223352" : "#f2ebdf";
  const textSub = isLight ? "#5c6f92" : "#ffffff66";
  const textFaint = isLight ? "#7c8cab" : "#ffffff44";
  const lineSoft = isLight ? "#cfdcf5" : "#ffffff1a";
  const panelSoft = isLight ? "#f4f8ff" : "#ffffff08";

  const navItems = [
    { key: VIEWS.dashboard, label: "dashboard" },
    { key: VIEWS.write, label: "write" },
    { key: VIEWS.constellation, label: "constellation" },
    { key: VIEWS.archive, label: "archive" },
  ];

  return (
    <div style={{ minHeight: "100vh", background: themePalette.bg, color: themePalette.text, fontFamily: "'Cormorant Garamond', serif", position: "relative", overflow: "hidden" }}>
      <AnimatedBackground theme={theme} />
      <SpaceStructureOverlay theme={theme} />
      {isLight && (
        <>
          <div style={{ position: "absolute", top: "-120px", left: "-100px", width: "320px", height: "320px", borderRadius: "50%", background: "radial-gradient(circle, #87b7ff66 0%, transparent 70%)", zIndex: 1, pointerEvents: "none" }} />
          <div style={{ position: "absolute", top: "80px", right: "-140px", width: "340px", height: "340px", borderRadius: "50%", background: "radial-gradient(circle, #ff91c766 0%, transparent 72%)", zIndex: 1, pointerEvents: "none" }} />
          <div style={{ position: "absolute", bottom: "-120px", left: "35%", width: "360px", height: "360px", borderRadius: "50%", background: "radial-gradient(circle, #9ff2d566 0%, transparent 74%)", zIndex: 1, pointerEvents: "none" }} />
        </>
      )}

      {/* Header */}
      <div style={{ position: "relative", zIndex: 2, padding: "28px 40px 0", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <div style={{ fontFamily: "'Cormorant SC', serif", fontSize: "13px", letterSpacing: "0.25em", color: isLight ? "#5f84ffaa" : "#9FE1CB88", marginBottom: "2px" }}>one line a day</div>
          <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "11px", color: isLight ? "#6c7792" : "#ffffff33", letterSpacing: "0.15em" }}>day {entries.length} of 30</div>
        </div>

        {/* Progress arc */}
        <div style={{ position: "relative", width: "48px", height: "48px" }}>
          <svg viewBox="0 0 48 48" style={{ width: "48px", height: "48px", transform: "rotate(-90deg)" }}>
            <circle cx="24" cy="24" r="20" fill="none" stroke={isLight ? "#c9d6f0" : "#ffffff11"} strokeWidth="1.5" />
            <circle
              cx="24"
              cy="24"
              r="20"
              fill="none"
              stroke={isLight ? "#5f84ff" : "#9FE1CB"}
              strokeWidth="1.5"
              strokeDasharray={`${progress * 125.6} 125.6`}
              strokeLinecap="round"
            />
          </svg>
          <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'DM Mono', monospace", fontSize: "10px", color: isLight ? "#5f84ff" : "#9FE1CB" }}>
            {entries.length}
          </div>
        </div>

        {/* Nav */}
        <nav style={{ display: "flex", gap: "6px", alignItems: "center" }}>
          <button
            onClick={() => setTheme((prev) => (prev === "light" ? "dark" : "light"))}
            style={{
              background: isLight ? "#5f84ff22" : "#ffffff0f",
              border: `0.5px solid ${isLight ? "#5f84ff66" : "#ffffff33"}`,
              color: isLight ? "#4a6de4" : "#e8e0d4",
              borderRadius: "999px",
              padding: "6px 12px",
              fontFamily: "'DM Mono', monospace",
              fontSize: "11px",
              letterSpacing: "0.08em",
              cursor: "pointer",
            }}
          >
            {isLight ? "light" : "dark"}
          </button>
          {navItems.map((n) => (
            <button
              key={n.key}
              onClick={() => setView(n.key)}
              style={{
                background: view === n.key ? (isLight ? "#5f84ff18" : "#ffffff0f") : "transparent",
                border: `0.5px solid ${view === n.key ? (isLight ? "#5f84ff66" : "#ffffff33") : isLight ? "#c8d5f0" : "#ffffff11"}`,
                color: view === n.key ? (isLight ? "#4a6de4" : "#e8e0d4") : isLight ? "#6f7c95" : "#ffffff44",
                borderRadius: "6px",
                padding: "6px 16px",
                fontFamily: "'DM Mono', monospace",
                fontSize: "11px",
                letterSpacing: "0.1em",
                cursor: "pointer",
                transition: "all 0.2s",
              }}
            >
              {n.label}
            </button>
          ))}
        </nav>
      </div>

      {/* WRITE VIEW */}
      {view === VIEWS.dashboard && (
        <div style={{ position: "relative", zIndex: 2, padding: "24px clamp(24px, 5vw, 72px) 56px", width: "100%", maxWidth: "1860px", margin: "0 auto", animation: "revealUp 520ms ease both" }}>
          <div style={{ marginBottom: "18px" }}>
            <div style={{ fontFamily: "'Cormorant SC', serif", fontSize: "11px", letterSpacing: "0.25em", color: isLight ? "#4c7bf0" : "#9FE1CBaa", marginBottom: "6px" }}>JOURNAL COMMAND DECK</div>
            <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "clamp(1.7rem, 4vw, 2.6rem)", color: textMain, lineHeight: 1.1 }}>
              Your emotional telemetry, in one view.
            </div>
            <div style={{ marginTop: "8px", display: "flex", gap: "8px", flexWrap: "wrap" }}>
              {[
                `sector: luna-${String(level).padStart(2, "0")}`,
                `streak-vector ${currentStreak}d`,
                `credits-core ${credits}`,
              ].map((chip) => (
                <span
                  key={chip}
                  style={{
                    border: `0.5px solid ${isLight ? "#bed0f5" : "#ffffff2a"}`,
                    borderRadius: "999px",
                    padding: "4px 10px",
                    color: isLight ? "#4f638a" : "#ffffff88",
                    fontFamily: "'DM Mono', monospace",
                    fontSize: "10px",
                    letterSpacing: "0.06em",
                    background: panelSoft,
                  }}
                >
                  {chip}
                </span>
              ))}
            </div>
          </div>

          <div style={{ marginBottom: "16px", background: isLight ? "#ffffffde" : "#0a1020c7", border: `0.5px solid ${isLight ? "#b8cdf4" : "#9FE1CB33"}`, borderRadius: "14px", padding: "14px", animation: "pulseEdge 4.2s ease-in-out infinite, revealUp 580ms ease both" }}>
            <div style={{ fontFamily: "'Cormorant SC', serif", fontSize: "11px", letterSpacing: "0.2em", color: isLight ? "#4c7bf0" : "#9FE1CBaa", marginBottom: "10px" }}>MISSION BOARD</div>
            <div style={{ display: "grid", gridTemplateColumns: dashboardWide ? "repeat(3, minmax(0, 1fr))" : "repeat(auto-fit, minmax(240px, 1fr))", gap: "14px" }}>
              {missionCards.map((mission) => {
                const done = mission.progress >= mission.target;
                const pct = Math.round((mission.progress / mission.target) * 100);
                return (
                  <div key={mission.key} style={{ border: `0.5px solid ${done ? "#9FE1CB66" : isLight ? "#cfdcf5" : "#ffffff22"}`, borderRadius: "10px", background: done ? (isLight ? "#9FE1CB2a" : "#9FE1CB14") : isLight ? "#f4f8ff" : "#ffffff08", padding: "10px", animation: "revealUp 620ms ease both" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "5px" }}>
                      <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "18px", color: done ? "#2e9a7d" : isLight ? "#223352" : "#f2ebdf" }}>{mission.title}</div>
                      <div style={{ fontFamily: "'DM Mono', monospace", fontSize: "10px", color: done ? (isLight ? "#2e9a7d" : "#9FE1CB") : textSub }}>{done ? "complete" : `${pct}%`}</div>
                    </div>
                    <div style={{ fontFamily: "'DM Mono', monospace", fontSize: "10px", color: textSub, marginBottom: "8px" }}>{mission.note}</div>
                    <div style={{ height: "6px", borderRadius: "999px", background: lineSoft, overflow: "hidden", marginBottom: "7px" }}>
                      <div style={{ width: `${Math.min(pct, 100)}%`, height: "100%", background: done ? "linear-gradient(90deg, #9FE1CB, #b7ffcb)" : "linear-gradient(90deg, #85B7EB, #AFA9EC)" }} />
                    </div>
                    <div style={{ fontFamily: "'DM Mono', monospace", fontSize: "10px", color: "#FAC775" }}>reward +{mission.reward} credits</div>
                  </div>
                );
              })}
            </div>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: dashboardUltra ? "repeat(6, minmax(0, 1fr))" : dashboardWide ? "repeat(3, minmax(0, 1fr))" : "repeat(auto-fit, minmax(220px, 1fr))",
              gap: "16px",
              marginBottom: "20px",
              animation: "revealUp 700ms ease both",
            }}
          >
            {[
              { label: "entries", value: entries.length, tint: "#9FE1CB" },
              { label: "current streak", value: `${currentStreak}d`, tint: "#85B7EB" },
              { label: "credits", value: credits, tint: "#e8baff" },
              { label: "level", value: `L${level}`, tint: "#b7ffcb" },
              { label: "avg chars", value: averageChars, tint: "#FAC775" },
              { label: "completion", value: `${completionPct}%`, tint: "#F0997B" },
            ].map((card) => (
              <div key={card.label} style={{ background: isLight ? "#ffffffd8" : "#0b0f1dba", border: `0.5px solid ${card.tint}55`, borderRadius: "12px", padding: "14px 14px 12px", backdropFilter: "blur(4px)", animation: "floatPanel 6s ease-in-out infinite, softGlow 5.4s ease-in-out infinite" }}>
                <div style={{ fontFamily: "'DM Mono', monospace", fontSize: "10px", letterSpacing: "0.13em", color: card.tint + "bb", marginBottom: "6px" }}>{card.label}</div>
                <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "30px", color: isLight ? "#223352" : "#f2ebdf", lineHeight: 1 }}>{card.value}</div>
              </div>
            ))}
          </div>

          <div style={{ display: "grid", gridTemplateColumns: dashboardWide ? "1.2fr 1fr" : "repeat(auto-fit, minmax(360px, 1fr))", gap: "18px", alignItems: "stretch", animation: "revealUp 820ms ease both" }}>
            <div style={{ background: isLight ? "#ffffffda" : "#090d1bbf", border: `0.5px solid ${isLight ? "#cfdcf5" : "#ffffff1f"}`, borderRadius: "14px", padding: "16px", animation: "breathScale 7s ease-in-out infinite" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "10px", gap: "8px", flexWrap: "wrap" }}>
                <div style={{ fontFamily: "'Cormorant SC', serif", fontSize: "11px", letterSpacing: "0.2em", color: isLight ? "#4f638a" : "#ffffff88" }}>EMOTION MIXER</div>
                <div style={{ fontFamily: "'DM Mono', monospace", fontSize: "10px", color: textSub }}>tap bars to filter</div>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginBottom: "14px" }}>
                {Object.entries(EMOTION_COLORS).map(([emotion, colors]) => {
                  const count = emotionCounts[emotion] || 0;
                  const width = entries.length ? Math.max((count / entries.length) * 100, 4) : 4;
                  const isActive = emotionFocus === emotion;
                  return (
                    <button
                      key={emotion}
                      onClick={() => setEmotionFocus((prev) => (prev === emotion ? "all" : emotion))}
                      style={{
                        background: "transparent",
                        border: isActive ? `0.5px solid ${colors.star}` : `0.5px solid ${isLight ? "#cfdcf5" : "#ffffff14"}`,
                        borderRadius: "10px",
                        padding: "7px 9px",
                        cursor: "pointer",
                      }}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px", fontFamily: "'DM Mono', monospace", fontSize: "10px", color: isActive ? colors.star : isLight ? "#617598" : "#ffffff77" }}>
                        <span>{emotion}</span>
                        <span>{count}</span>
                      </div>
                      <div style={{ height: "7px", borderRadius: "8px", background: isLight ? "#dce7fb" : "#ffffff12", overflow: "hidden" }}>
                        <div style={{ width: `${width}%`, height: "100%", background: `linear-gradient(90deg, ${colors.star}cc, ${colors.star}44)` }} />
                      </div>
                    </button>
                  );
                })}
              </div>

              <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                <button
                  onClick={() => {
                    setView(VIEWS.write);
                    setTimeout(() => textareaRef.current?.focus(), 0);
                  }}
                  style={{ background: "#9FE1CB22", border: "0.5px solid #9FE1CB77", color: "#9FE1CB", borderRadius: "8px", padding: "8px 12px", fontFamily: "'DM Mono', monospace", fontSize: "11px", cursor: "pointer" }}
                >
                  write now
                </button>
                <button
                  onClick={() => setView(VIEWS.constellation)}
                  style={{ background: "#85B7EB22", border: "0.5px solid #85B7EB77", color: "#85B7EB", borderRadius: "8px", padding: "8px 12px", fontFamily: "'DM Mono', monospace", fontSize: "11px", cursor: "pointer" }}
                >
                  open constellation
                </button>
                <button
                  onClick={() => {
                    setEmotionFocus("all");
                    setView(VIEWS.archive);
                  }}
                  style={{ background: "#FAC77522", border: "0.5px solid #FAC77577", color: "#FAC775", borderRadius: "8px", padding: "8px 12px", fontFamily: "'DM Mono', monospace", fontSize: "11px", cursor: "pointer" }}
                >
                  browse archive
                </button>
              </div>
            </div>

            <div style={{ background: isLight ? "#ffffffda" : "#0b0f1dbf", border: `0.5px solid ${isLight ? "#cfdcf5" : "#ffffff1f"}`, borderRadius: "14px", padding: "16px", animation: "breathScale 8s ease-in-out infinite" }}>
              <div style={{ fontFamily: "'Cormorant SC', serif", fontSize: "11px", letterSpacing: "0.2em", color: isLight ? "#4f638a" : "#ffffff88", marginBottom: "8px" }}>HIGHLIGHTS</div>
              <div style={{ marginBottom: "14px", padding: "10px 12px", borderRadius: "10px", background: panelSoft, border: `0.5px solid ${EMOTION_COLORS[dominantEmotion].star}55` }}>
                <div style={{ fontFamily: "'DM Mono', monospace", fontSize: "10px", color: textSub, marginBottom: "4px" }}>dominant emotion</div>
                <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "22px", color: EMOTION_COLORS[dominantEmotion].star, textTransform: "capitalize" }}>{dominantEmotion}</div>
              </div>

              <div style={{ marginBottom: "14px", padding: "10px 12px", borderRadius: "10px", background: panelSoft, border: `0.5px solid ${lineSoft}` }}>
                <div style={{ fontFamily: "'DM Mono', monospace", fontSize: "10px", color: textSub, marginBottom: "4px" }}>longest line</div>
                <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "17px", color: textMain, lineHeight: 1.35 }}>
                  {longestEntry.text ? `"${longestEntry.text}"` : "No entries yet"}
                </div>
              </div>

              <div style={{ fontFamily: "'DM Mono', monospace", fontSize: "10px", color: textSub, marginBottom: "8px" }}>
                30-day signal map {emotionFocus !== "all" ? `(${emotionFocus})` : ""}
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(10, 1fr)", gap: "6px" }}>
                {Array.from({ length: 30 }).map((_, i) => {
                  const entry = focusedEntries.find((e) => e.day === i + 1);
                  const color = entry ? EMOTION_COLORS[entry.emotion].star : isLight ? "#d8e4fb" : "#ffffff1a";
                  return <div key={i} title={entry ? `Day ${entry.day}: ${entry.emotion}` : `Day ${i + 1}`} style={{ height: "14px", borderRadius: "3px", background: color, boxShadow: entry ? `0 0 8px ${color}66` : "none" }} />;
                })}
              </div>
            </div>
          </div>

          <div style={{ marginTop: "14px", background: isLight ? "#ffffffdb" : "#0a0d19c9", border: `0.5px solid ${isLight ? "#cfdcf5" : "#ffffff1a"}`, borderRadius: "14px", padding: "16px", animation: "revealUp 930ms ease both" }}>
              <div style={{ marginBottom: "12px", padding: "10px 12px", borderRadius: "10px", background: isLight ? "#f4f8ff" : "#ffffff08", border: `0.5px solid ${isLight ? "#b8cdf4" : "#b7ffcb55"}` }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px", fontFamily: "'DM Mono', monospace", fontSize: "10px", color: isLight ? "#3a8f78" : "#b7ffcbcc" }}>
                <span>level progress</span>
                <span>{levelProgressPct}% to next</span>
              </div>
              <div style={{ height: "8px", borderRadius: "999px", background: isLight ? "#dce7fb" : "#ffffff1c", overflow: "hidden" }}>
                <div style={{ width: `${levelProgressPct}%`, height: "100%", background: "linear-gradient(90deg, #b7ffcb, #9FE1CB88)" }} />
              </div>
            </div>

            <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginBottom: "14px" }}>
              {badgeItems.map((badge) => (
                <div
                  key={badge.key}
                  style={{
                    border: `0.5px solid ${badge.unlocked ? "#FAC77577" : isLight ? "#cfdcf5" : "#ffffff24"}`,
                    borderRadius: "999px",
                    padding: "5px 10px",
                    background: badge.unlocked ? "#FAC7751f" : "transparent",
                    color: badge.unlocked ? "#FAC775" : isLight ? "#7c8cab" : "#ffffff44",
                    fontFamily: "'DM Mono', monospace",
                    fontSize: "10px",
                    letterSpacing: "0.04em",
                    textTransform: "lowercase",
                  }}
                >
                  {badge.label}
                </div>
              ))}
            </div>

            <div style={{ fontFamily: "'Cormorant SC', serif", fontSize: "11px", letterSpacing: "0.2em", color: isLight ? "#4f638a" : "#ffffff88", marginBottom: "10px" }}>RECENT SIGNALS</div>
            <div style={{ display: "grid", gridTemplateColumns: dashboardUltra ? "repeat(4, minmax(0, 1fr))" : dashboardWide ? "repeat(2, minmax(0, 1fr))" : "repeat(auto-fit, minmax(260px, 1fr))", gap: "14px" }}>
              {recentEntries.map((entry) => {
                const c = EMOTION_COLORS[entry.emotion].star;
                return (
                  <button
                    key={entry.day}
                    onClick={() => {
                      setEmotionFocus(entry.emotion);
                      setView(VIEWS.archive);
                    }}
                    style={{
                      textAlign: "left",
                      background: isLight ? "#f4f8ff" : "#ffffff08",
                      border: `0.5px solid ${c}55`,
                      borderRadius: "10px",
                      color: isLight ? "#223352" : "#f2ebdf",
                      padding: "10px",
                      cursor: "pointer",
                      animation: "softGlow 6.8s ease-in-out infinite",
                      transition: "transform 0.2s ease, border-color 0.2s ease",
                    }}
                  >
                    <div style={{ fontFamily: "'DM Mono', monospace", fontSize: "10px", color: c, marginBottom: "5px" }}>
                      day {entry.day} · {entry.date}
                    </div>
                    <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "16px", lineHeight: 1.35 }}>{entry.text}</div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* WRITE VIEW */}
      {view === VIEWS.write && (
        <div
          style={{
            position: "relative",
            zIndex: 2,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            minHeight: "85vh",
            padding: "40px 20px",
          }}
        >
          <div style={{ textAlign: "center", marginBottom: "56px" }}>
            <div
              style={{
                fontFamily: "'Cormorant Garamond', serif",
                fontSize: "clamp(2rem, 5vw, 3.2rem)",
                fontWeight: 300,
                letterSpacing: "-0.01em",
                lineHeight: 1.2,
                color: textMain,
                marginBottom: "12px",
              }}
            >
              {new Date().toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" })}
            </div>
            <div style={{ fontFamily: "'DM Mono', monospace", fontSize: "11px", color: textSub, letterSpacing: "0.2em" }}>ONE SENTENCE · ONE TRUTH · ONE DAY</div>
          </div>

          <div style={{ width: "min(1200px, 96vw)", position: "relative" }}>
            {alreadyWroteToday ? (
              <div style={{ textAlign: "center", padding: "40px 24px", background: panel, border: `0.5px solid ${isLight ? "#b8cdf4" : "#9FE1CB33"}`, borderRadius: "16px" }}>
                <div style={{ fontSize: "28px", marginBottom: "16px", color: "#9FE1CB" }}>*</div>
                <div style={{ fontSize: "18px", fontStyle: "italic", color: "#9FE1CB", marginBottom: "8px" }}>Today's line is sealed.</div>
                <div style={{ fontSize: "13px", color: textSub, fontFamily: "'DM Mono', monospace" }}>Come back tomorrow.</div>
                <div style={{ marginTop: "10px", fontSize: "11px", color: "#b7ffcb", fontFamily: "'DM Mono', monospace", letterSpacing: "0.06em" }}>
                  streak rewards stay active
                </div>
              </div>
            ) : (
              <>
                <div
                  style={{
                    background: panel,
                    border: `0.5px solid ${isLight ? "#cfdcf5" : "#ffffff14"}`,
                    borderRadius: "16px",
                    padding: "32px",
                    boxShadow: saved ? "0 0 40px #9FE1CB22" : "none",
                    transition: "box-shadow 0.6s",
                  }}
                >
                  {/* Decorative quote mark */}
                  <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "72px", color: isLight ? "#d6e3ff" : "#ffffff08", lineHeight: 0.8, marginBottom: "16px", userSelect: "none" }}>
                    "
                  </div>

                  <textarea
                    ref={textareaRef}
                    value={input}
                    onChange={(e) => e.target.value.length <= maxChars && setInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && (e.preventDefault(), handleSave())}
                    placeholder="Write one honest sentence about today..."
                    rows={3}
                    style={{
                      width: "100%",
                      background: "transparent",
                      border: "none",
                      outline: "none",
                      fontFamily: "'Cormorant Garamond', serif",
                      fontStyle: "italic",
                      fontSize: "clamp(1.1rem, 2.5vw, 1.35rem)",
                      color: textMain,
                      lineHeight: 1.7,
                      resize: "none",
                      boxSizing: "border-box",
                      caretColor: "#9FE1CB",
                    }}
                  />

                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: "20px", paddingTop: "16px", borderTop: `0.5px solid ${isLight ? "#d8e4fb" : "#ffffff0f"}` }}>
                    <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
                      {input.trim() && (
                        <span
                          style={{
                            fontSize: "11px",
                            padding: "2px 10px",
                            borderRadius: "20px",
                            fontFamily: "'DM Mono', monospace",
                            letterSpacing: "0.05em",
                            background: EMOTION_COLORS[detectEmotion(input)].star + "22",
                            color: EMOTION_COLORS[detectEmotion(input)].star,
                            border: `0.5px solid ${EMOTION_COLORS[detectEmotion(input)].star}44`,
                          }}
                        >
                          {detectEmotion(input)}
                        </span>
                      )}
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
                      <span style={{ fontFamily: "'DM Mono', monospace", fontSize: "11px", color: charCount > 120 ? "#F0997B" : textSub }}>
                        {charCount}/{maxChars}
                      </span>
                      <button
                        onClick={handleSave}
                        disabled={!input.trim() || saved}
                        style={{
                          background: saved ? "#9FE1CB22" : input.trim() ? "#9FE1CB18" : "transparent",
                          border: `0.5px solid ${input.trim() ? "#9FE1CB66" : isLight ? "#cfdcf5" : "#ffffff11"}`,
                          color: input.trim() ? "#2e9a7d" : textFaint,
                          borderRadius: "8px",
                          padding: "8px 22px",
                          fontFamily: "'DM Mono', monospace",
                          fontSize: "12px",
                          letterSpacing: "0.1em",
                          cursor: input.trim() ? "pointer" : "not-allowed",
                          transition: "all 0.2s",
                        }}
                      >
                        {saved ? "sealed *" : "seal ->"}
                      </button>
                    </div>
                  </div>
                </div>

                {lastEarnedCredits > 0 && (
                  <div
                    style={{
                      marginTop: "12px",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "8px",
                      padding: "7px 12px",
                      borderRadius: "999px",
                      border: "0.5px solid #b7ffcb77",
                      background: "#b7ffcb1f",
                      color: "#b7ffcb",
                      fontFamily: "'DM Mono', monospace",
                      fontSize: "11px",
                      letterSpacing: "0.06em",
                    }}
                  >
                    +{lastEarnedCredits} credits earned
                  </div>
                )}

                {/* Hint */}
                <div style={{ textAlign: "center", marginTop: "20px", fontFamily: "'DM Mono', monospace", fontSize: "10px", color: textFaint, letterSpacing: "0.12em" }}>
                  press enter to seal - one line per day - no edits
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* CONSTELLATION VIEW */}
      {view === VIEWS.constellation && (
        <div style={{ position: "relative", zIndex: 2, padding: "24px clamp(14px, 3vw, 40px) 40px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "20px", flexWrap: "wrap", gap: "12px" }}>
            <div>
              <div style={{ fontFamily: "'Cormorant SC', serif", fontSize: "11px", letterSpacing: "0.25em", color: "#ffffff33", marginBottom: "4px" }}>YOUR CONSTELLATION</div>
              <div style={{ fontFamily: "'Cormorant Garamond', serif", fontStyle: "italic", fontSize: "14px", color: "#ffffff55" }}>
                {entries.length < 30 ? `${30 - entries.length} more days until complete` : "30 days - your constellation is whole"}
              </div>
            </div>
            {/* Emotion legend */}
            <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
              {Object.entries(EMOTION_COLORS).map(([e, c]) => (
                <div key={e} style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                  <div style={{ width: "7px", height: "7px", borderRadius: "50%", background: c.star }} />
                  <span style={{ fontFamily: "'DM Mono', monospace", fontSize: "10px", color: "#ffffff44", letterSpacing: "0.08em" }}>{e}</span>
                </div>
              ))}
            </div>
          </div>

          <div
            ref={canvasWrapRef}
            onMouseMove={handleCanvasMouseMove}
            onMouseLeave={() => setTooltip({ entry: null, pos: { x: 0, y: 0 } })}
            style={{ position: "relative", width: "100%", height: "65vh", background: isLight ? "#f4f8ffcc" : "#08081488", border: `0.5px solid ${isLight ? "#cfdcf5" : "#ffffff08"}`, borderRadius: "16px", overflow: "hidden" }}
          >
            <ConstellationCanvas entries={entries} />
            <StarTooltip entry={tooltip.entry} pos={tooltip.pos} />
          </div>

          {entries.length >= 30 && (
            <div style={{ textAlign: "center", marginTop: "28px", padding: "24px", background: "#0d0d1a", border: "0.5px solid #9FE1CB33", borderRadius: "12px" }}>
              <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "22px", fontStyle: "italic", color: "#9FE1CB", marginBottom: "6px" }}>
                Your 30 days are written in the stars.
              </div>
              <div style={{ fontFamily: "'DM Mono', monospace", fontSize: "11px", color: "#ffffff33" }}>hover each star to read your lines</div>
            </div>
          )}
        </div>
      )}

      {/* ARCHIVE VIEW */}
      {view === VIEWS.archive && (
        <div style={{ position: "relative", zIndex: 2, padding: "24px clamp(14px, 3vw, 40px) 60px", width: "100%" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "10px", marginBottom: "18px", flexWrap: "wrap" }}>
            <div style={{ fontFamily: "'Cormorant SC', serif", fontSize: "11px", letterSpacing: "0.25em", color: "#ffffff33" }}>ARCHIVE</div>
            <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
              <button
                onClick={() => setEmotionFocus("all")}
                style={{
                  border: emotionFocus === "all" ? "0.5px solid #ffffff55" : "0.5px solid #ffffff22",
                  borderRadius: "999px",
                  padding: "4px 10px",
                  background: emotionFocus === "all" ? "#ffffff12" : "transparent",
                  color: "#ffffffbb",
                  fontFamily: "'DM Mono', monospace",
                  fontSize: "10px",
                  cursor: "pointer",
                }}
              >
                all
              </button>
              {Object.keys(EMOTION_COLORS).map((emotion) => (
                <button
                  key={emotion}
                  onClick={() => setEmotionFocus(emotion)}
                  style={{
                    border: `0.5px solid ${EMOTION_COLORS[emotion].star}${emotionFocus === emotion ? "cc" : "55"}`,
                    borderRadius: "999px",
                    padding: "4px 10px",
                    background: emotionFocus === emotion ? `${EMOTION_COLORS[emotion].star}22` : "transparent",
                    color: EMOTION_COLORS[emotion].star,
                    fontFamily: "'DM Mono', monospace",
                    fontSize: "10px",
                    cursor: "pointer",
                    textTransform: "lowercase",
                  }}
                >
                  {emotion}
                </button>
              ))}
            </div>
          </div>

          {[...focusedEntries].reverse().map((entry, i) => {
            const col = EMOTION_COLORS[entry.emotion];
            return (
              <div
                key={entry.day}
                onMouseEnter={() => setHoveredDay(entry.day)}
                onMouseLeave={() => setHoveredDay(null)}
                style={{
                  display: "flex",
                  gap: "24px",
                  paddingBottom: "28px",
                  marginBottom: "28px",
                  borderBottom: "0.5px solid #ffffff08",
                  opacity: hoveredDay && hoveredDay !== entry.day ? 0.4 : 1,
                  transition: "opacity 0.2s",
                }}
              >
                {/* Day number */}
                <div style={{ flexShrink: 0, textAlign: "right", width: "52px" }}>
                  <div style={{ fontFamily: "'DM Mono', monospace", fontSize: "10px", color: col.star, marginBottom: "2px" }}>{String(entry.day).padStart(2, "0")}</div>
                  <div style={{ fontFamily: "'DM Mono', monospace", fontSize: "9px", color: "#ffffff22" }}>{entry.date}</div>
                </div>

                {/* Line */}
                <div style={{ flex: 1 }}>
                  <div style={{ width: "5px", height: "5px", borderRadius: "50%", background: col.star, display: "inline-block", marginRight: "10px", verticalAlign: "middle", boxShadow: `0 0 6px ${col.star}` }} />
                  <span style={{ fontFamily: "'Cormorant Garamond', serif", fontStyle: "italic", fontSize: "clamp(1rem, 2vw, 1.2rem)", color: "#e8e0d4", lineHeight: 1.6 }}>{entry.text}</span>
                  <div style={{ marginTop: "6px", fontFamily: "'DM Mono', monospace", fontSize: "10px", color: col.star + "66", letterSpacing: "0.1em" }}>{entry.emotion}</div>
                </div>
              </div>
            );
          })}

          {entries.length === 0 && <div style={{ textAlign: "center", padding: "60px 0", color: "#ffffff22", fontStyle: "italic" }}>No entries yet. Write your first line.</div>}
        </div>
      )}
    </div>
  );
}
