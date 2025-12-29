/**
 * Chat Cache Warmup Service
 * 
 * Pre-warms the cache with commonly asked questions
 * for instant responses on first load
 */

import { chatCache } from "./chat-cache-service";

/**
 * Common typing-related questions with pre-generated responses
 */
const typingQuestions = [
  {
    query: "How can I improve my typing speed?",
    response: `## Improving Your Typing Speed

### Essential Techniques

1. **Master Touch Typing**
   - Learn proper finger placement on home row (ASDF JKL;)
   - Practice without looking at keyboard
   - Use all 10 fingers consistently

2. **Focus on Accuracy First**
   - Speed comes naturally with accuracy
   - Aim for 98%+ accuracy before pushing speed
   - Slow down if error rate increases

3. **Practice Deliberately**
   - 15-30 minutes daily is better than occasional long sessions
   - Focus on weak keys and combinations
   - Use typing.com, Keybr, or TypeRacer

4. **Optimize Your Setup**
   - Proper posture: feet flat, back straight, wrists neutral
   - Screen at eye level
   - Quality keyboard that feels comfortable

5. **Build Muscle Memory**
   - Repeat common words and patterns
   - Practice real-world content (code, writing)
   - Gradual progression: accuracy → speed → endurance

> **Pro Tip**: Track your progress weekly. Most people can increase from 40 WPM to 60+ WPM in 2-3 months with consistent practice.

### Common Mistakes to Avoid
- Don't look at the keyboard
- Don't rush before you're accurate
- Don't practice tired or frustrated
- Don't skip warm-up exercises`,
  },
  {
    query: "What is touch typing?",
    response: `## Touch Typing

**Touch typing** is a typing technique where you type without looking at the keyboard, using muscle memory to find keys by feel rather than sight.

### Key Principles

1. **Home Row Position**
   - Left hand: A, S, D, F
   - Right hand: J, K, L, ;
   - Index fingers rest on F and J (with tactile bumps)

2. **Finger Zones**
   - Each finger is responsible for specific keys
   - Fingers return to home row after each keystroke
   - Thumbs rest on spacebar

3. **No Looking**
   - Eyes stay on screen or source material
   - Rely on tactile feedback and muscle memory
   - Trust finger positioning

### Benefits
- **Speed**: 60-80+ WPM achievable vs 30-40 WPM hunt-and-peck
- **Accuracy**: Fewer errors with consistent technique
- **Efficiency**: Less mental effort, more focus on content
- **Health**: Better posture, reduced strain

### Learning Curve
- Week 1-2: Learning finger positions (slow)
- Week 3-4: Building muscle memory (awkward)
- Month 2-3: Matching old speed
- Month 3+: Exceeding old speed

> Most people can learn touch typing basics in 2-4 weeks with 20-30 minutes daily practice.`,
  },
  {
    query: "How do I practice typing?",
    response: `## Effective Typing Practice

### Daily Practice Routine (20-30 minutes)

**Warm-up (5 minutes)**
- Type the home row keys: asdf jkl;
- Practice common letter combinations
- Type familiar words slowly and accurately

**Focused Practice (15-20 minutes)**
1. **Identify weak keys** - Notice which keys slow you down
2. **Targeted exercises** - Practice words with those keys
3. **Real content** - Type articles, code, or stories
4. **Gradual speed increase** - Push speed only when accurate

**Cool-down (5 minutes)**
- Type at comfortable speed
- Focus on consistency
- Review mistakes

### Best Practice Resources
- **TypeRacer** - Competitive, fun races
- **Keybr** - Adaptive algorithm, focuses on weak keys
- **Monkeytype** - Customizable, modern interface
- **Typing.com** - Structured lessons, good for beginners

### Practice Tips
✅ **Do:**
- Practice daily, even if brief
- Focus on accuracy over speed
- Use proper finger placement
- Take breaks to avoid fatigue
- Track your progress

❌ **Don't:**
- Look at the keyboard
- Practice when tired
- Skip difficult keys
- Compare yourself to others
- Give up during the awkward phase

### Progress Tracking
- Week 1-2: 15-25 WPM (learning phase)
- Month 1-2: 25-40 WPM (building consistency)
- Month 3-6: 40-60 WPM (improving speed)
- Month 6+: 60-80+ WPM (mastery)

> **Remember**: Consistency beats intensity. 15 minutes daily is better than 2 hours once a week.`,
  },
  {
    query: "What is a good typing speed?",
    response: `## Typing Speed Benchmarks

### Average Typing Speeds

**General Typing:**
- Beginner: 20-30 WPM
- Average: 40-50 WPM
- Above Average: 50-60 WPM
- Advanced: 60-80 WPM
- Professional: 80-100+ WPM
- Expert: 100-120+ WPM

**By Profession:**
- Data Entry: 60-80 WPM required
- Secretary/Admin: 60-70 WPM expected
- Transcriptionist: 80-100 WPM needed
- Court Reporter: 200+ WPM (stenography)

**Coding:**
- Junior Developer: 40-60 WPM
- Senior Developer: 60-80 WPM
- (Note: Coding involves more thinking than raw typing speed)

### Accuracy Matters More
- **Target accuracy**: 95%+ minimum, 98%+ ideal
- A 80 WPM typist at 98% accuracy is better than 100 WPM at 90% accuracy
- Errors waste time in corrections

### Age Considerations
- **Youth (15-25)**: Fastest learning, can reach 80+ WPM
- **Adults (25-50)**: Can still reach 60-80 WPM with practice
- **Seniors (50+)**: May take longer but can achieve 50-60 WPM

### Goals to Aim For
- **Minimum competency**: 40 WPM at 95% accuracy
- **Comfortable speed**: 60 WPM at 98% accuracy
- **Professional level**: 80+ WPM at 98% accuracy

> **Your goal should be**: Whatever speed feels comfortable while maintaining 98%+ accuracy. Speed will naturally increase with practice.`,
  },
  {
    query: "Best keyboard for typing?",
    response: `## Best Keyboards for Typing

### Mechanical Keyboards (Recommended)

**Switch Types:**
1. **Linear (Red switches)**
   - Smooth, no tactile bump
   - Quieter, good for shared spaces
   - Best for: Fast typists, gaming

2. **Tactile (Brown switches)**
   - Tactile bump without loud click
   - Balanced for typing and gaming
   - Best for: General use, beginners

3. **Clicky (Blue switches)**
   - Tactile bump with audible click
   - Satisfying feedback
   - Best for: Typing enthusiasts (but loud!)

### Top Recommendations

**Budget ($50-100):**
- Keychron C1/C2
- Redragon K552
- Royal Kludge RK61

**Mid-Range ($100-200):**
- Keychron Q1
- Ducky One 2
- Leopold FC750R

**Premium ($200+):**
- Varmilo keyboards
- Custom built (QMK compatible)
- HHKB (Topre switches)

### Ergonomic Options
- **Split keyboards**: Kinesis Freestyle, Ergodox
- **Ortholinear**: Planck, Preonic
- **Curved**: Microsoft Sculpt, Kinesis Advantage

### Key Features to Consider
✅ Hot-swappable switches (easy customization)
✅ Adjustable tilt/height
✅ Wrist rest (separate or built-in)
✅ Proper key spacing
✅ Quality keycaps (PBT preferred)

### Don't Overlook
- **Your laptop keyboard** might be perfectly fine
- **Cheap membrane keyboards** can work if comfortable
- **The best keyboard** is the one you'll actually use

> **Pro Tip**: Try before you buy. Visit a computer store or mechanical keyboard meetup to test different switches.`,
  },
];

/**
 * Warm up the cache on server startup
 */
export function warmupChatCache(): void {
  console.log("[Cache Warmup] Starting cache warmup...");
  
  chatCache.warmup(typingQuestions);
  
  const stats = chatCache.getStats();
  console.log(`[Cache Warmup] Complete! ${stats.entries} entries loaded`);
}

/**
 * Schedule periodic cache refresh for popular queries
 */
export function schedulePeriodicWarmup(intervalHours: number = 12): void {
  setInterval(() => {
    console.log("[Cache Warmup] Periodic refresh...");
    warmupChatCache();
  }, intervalHours * 3600000);
}

