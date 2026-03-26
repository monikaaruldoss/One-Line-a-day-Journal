# One-Line-a-day-Journal
One-Line-a-Day Journal is a cosmic journaling web app where you write one honest sentence daily. Each entry becomes a glowing star, emotion-detected and color-coded — joy, calm, wonder, fire, or melancholy. Over 30 days, your lines form a personal constellation. Three views: write, constellation, and archive.

Three views:

write — a sealed letter input. One sentence, max 140 chars, one per day. Press Enter or click "seal →" to commit. No edits allowed — permanence is the point.
constellation — an animated canvas where every entry becomes a star. Stars are connected by thin constellation lines in order. Hover any star to read the line that created it.
archive — a reverse-chronological list of every sealed line with emotion tags and glowing dot indicators.

Emotion detection engine — scans each line for keywords across 5 moods (joy, melancholy, wonder, fire, calm) and assigns a star colour automatically. The emotion badge appears live as you type.
Visual details:

Seeded randomness so star positions are deterministic per entry
Animated star twinkle on canvas using requestAnimationFrame
Circular progress arc in the header (day X of 30)
12 demo entries pre-loaded so the constellation is alive on first open
Cormorant Garamond + DM Mono font pairing for an editorial-cosmic feel
