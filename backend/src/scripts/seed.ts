/**
 * Seed script — creates a demo user + 25 sample published blogs
 * Run: npx ts-node src/scripts/seed.ts
 */
import 'dotenv/config';
import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcryptjs';
import { initializeDatabase, getPool, closeDatabase } from '../config/database';

const DEMO_USER = {
  username: 'demo_author',
  email: 'demo@oziblog.com',
  password: 'Demo@1234',
  displayName: 'Ozi Demo',
  bio: 'Sample author for testing the blog platform.',
};

const SAMPLE_BLOGS: { title: string; excerpt: string; content: string }[] = [
  {
    title: 'The First 6 Months: What No One Tells You',
    excerpt: 'Honest reflections on the newborn phase — the beautiful chaos, the sleepless nights, and the unexpected joys.',
    content: '<h2>Brace Yourself</h2><p>The first six months of parenthood are unlike anything you have experienced. Time moves both incredibly fast and agonizingly slow at the same time.</p><p>You will question everything — your choices, your instincts, your sleep-deprived math. And yet, at 3 AM when your baby finally yawns and blinks at you, nothing else in the world matters.</p><h3>The Sleep Thing</h3><p>Everyone warns you about the sleep deprivation. What they don't tell you is that your brain adapts. You will function on 4-hour stretches and feel oddly proud of it.</p>',
  },
  {
    title: 'Baby-Led Weaning: Our Experience at 6 Months',
    excerpt: 'We tried baby-led weaning and here is everything that happened — the mess, the wins, and what we wish we knew.',
    content: '<h2>Starting Solids</h2><p>At exactly six months, we placed a piece of soft steamed carrot in front of our daughter. She stared at it for a full minute, then smashed it enthusiastically into her forehead.</p><p>That was our introduction to baby-led weaning.</p><h3>What Is BLW?</h3><p>Baby-led weaning skips purees entirely. You offer soft finger foods from the start and let your baby control how much they eat. It sounds terrifying. It is also surprisingly beautiful.</p>',
  },
  {
    title: 'Creating a Safe Sleep Environment',
    excerpt: 'A practical guide to setting up a crib, bassinet, or sleep space that keeps your baby safe and helps everyone sleep better.',
    content: '<h2>Safe Sleep Basics</h2><p>The ABCs of safe sleep are simple: Alone, on their Back, in a Crib. But setting up the physical space can feel overwhelming with so many products marketed to new parents.</p><h3>What You Actually Need</h3><p>A firm, flat mattress with a fitted sheet. That is genuinely all you need. No bumpers, no pillows, no positioning wedges.</p>',
  },
  {
    title: 'Tummy Time Tips That Actually Work',
    excerpt: 'Most babies hate tummy time at first. Here are the techniques we used to make it enjoyable — and build those important muscles.',
    content: '<h2>Why Tummy Time Matters</h2><p>Tummy time builds the core and neck strength babies need to roll, sit, and eventually crawl. But most newborns absolutely hate it in the beginning.</p><h3>Start Small</h3><p>Begin with just 1-2 minutes after a diaper change, several times a day. Lie down face-to-face with your baby. Your presence makes all the difference.</p>',
  },
  {
    title: 'Postpartum Recovery: Taking Care of Yourself',
    excerpt: 'Your body just did something incredible. Here is how to support your own recovery while caring for a newborn.',
    content: '<h2>Your Recovery Matters</h2><p>In the haze of new parenthood, self-care often falls completely to the bottom of the list. But a depleted parent cannot pour from an empty cup.</p><p>Postpartum recovery is not just physical. It is emotional, hormonal, and deeply personal.</p>',
  },
  {
    title: 'Understanding Your Baby\'s Cry: A Beginner\'s Guide',
    excerpt: 'Learning to decode what your baby needs from the type and tone of their cry takes time — but there are patterns you can spot.',
    content: '<h2>Every Cry Means Something</h2><p>In the early weeks, all cries sound the same. By week 6 or 8, most parents begin to notice subtle differences — a shorter, rhythmic cry for hunger, a higher-pitched wail for pain.</p>',
  },
  {
    title: 'Our Favourite Baby Carriers (And What We Learned)',
    excerpt: 'We tried four different carriers over the first year. Here is an honest comparison for new parents still researching.',
    content: '<h2>Why We Love Babywearing</h2><p>Babywearing keeps your baby close, supports their development, and frees up your hands for the million other things you need to do.</p><h3>The Ring Sling</h3><p>Perfect for the newborn stage. Takes some practice to position correctly, but once you get it right, it is incredibly quick to put on.</p>',
  },
  {
    title: 'Traveling With a Baby Under 1: What We Packed',
    excerpt: 'A long weekend away with a 7-month-old taught us exactly what to bring — and what was completely unnecessary.',
    content: '<h2>The Packing List</h2><p>We overpacked on our first trip. We brought three swaddles, two changing mats, and a white noise machine the size of a paperback novel.</p><p>Here is what we actually used.</p>',
  },
  {
    title: 'Navigating the 4-Month Sleep Regression',
    excerpt: 'Your baby was sleeping well. Then everything changed. Here is what the 4-month regression is and how we got through it.',
    content: '<h2>Why Sleep Gets Harder at 4 Months</h2><p>Around 4 months, your baby\'s sleep cycles mature to be more like an adult\'s — meaning they cycle between light and deep sleep more frequently. If they haven\'t learned to link cycles independently, they wake up.</p>',
  },
  {
    title: 'Baby Massage for Better Sleep and Bonding',
    excerpt: 'A simple baby massage routine that takes 10 minutes and can genuinely improve sleep quality and your connection with your baby.',
    content: '<h2>The Science Behind Baby Massage</h2><p>Baby massage has been shown to reduce cortisol levels, improve weight gain in premature infants, and support neurological development.</p><h3>Getting Started</h3><p>Use a small amount of baby-safe oil — coconut or sunflower work well. Start with the legs and feet, where babies are least sensitive.</p>',
  },
  {
    title: 'Setting a Flexible Newborn Routine',
    excerpt: 'Strict schedules don\'t work for newborns. Here is how we created a gentle rhythm that helped our family stay sane.',
    content: '<h2>Rhythm Over Schedule</h2><p>A routine is not about watching the clock. It is about doing things in a consistent order — feed, awake time, sleep — so your baby begins to anticipate what comes next.</p>',
  },
  {
    title: 'The Best First Books for Babies',
    excerpt: 'Reading to babies from day one builds language, bonding, and a lifelong love of books. These are our most-loved titles.',
    content: '<h2>Why Books Before They Can Talk</h2><p>Babies absorb language patterns long before they can produce words. Reading aloud exposes them to vocabulary, rhythm, and the pure joy of stories.</p>',
  },
  {
    title: 'Managing Colic: What Helped Our Baby',
    excerpt: 'Weeks of inconsolable crying changed our lives. Here is what we tried, what worked, and what we wish someone had told us.',
    content: '<h2>Colic Is Temporary (Though It Doesn\'t Feel Like It)</h2><p>Colic typically peaks at 6 weeks and resolves by 3-4 months. That knowledge did not make it easier in the moment, but it helped us hold on.</p>',
  },
  {
    title: 'Cloth Diapers vs. Disposables: Our Honest Review',
    excerpt: 'We tried both. Here is a real comparison covering cost, convenience, and environmental impact for families weighing the decision.',
    content: '<h2>We Started with Disposables</h2><p>In the early newborn fog, we reached for disposables. They were easy. They worked. We didn\'t have to think about them.</p><p>At 3 months, we switched to cloth for daytime use. Here is what we found.</p>',
  },
  {
    title: 'Introducing a Sibling to the New Baby',
    excerpt: 'Our toddler had big feelings about the new arrival. These strategies helped smooth the transition for the whole family.',
    content: '<h2>Preparing Your Older Child</h2><p>Start talking about the new baby months before the birth. Use simple language. Read books about being a big sibling. Let your toddler feel involved in preparations.</p>',
  },
  {
    title: 'Baby Proofing Room by Room',
    excerpt: 'Before your baby starts moving, it is time to look at your home through entirely new eyes. Here is our room-by-room checklist.',
    content: '<h2>When to Start</h2><p>Start baby proofing around 4-5 months — before your baby is mobile. Once they can roll or commando crawl, the window closes faster than you think.</p>',
  },
  {
    title: 'Building a Breastfeeding-Friendly Wardrobe',
    excerpt: 'The right clothing makes a genuine difference when you are nursing frequently. These are the pieces we actually reached for.',
    content: '<h2>Comfort First</h2><p>Forget the fancy nursing clothes. Layer a nursing tank under anything with a loose neckline and you have instant, discreet access anywhere.</p>',
  },
  {
    title: 'Screen Time and Babies: What the Research Says',
    excerpt: 'The guidelines say no screen time under 18-24 months. But what does the research actually show, and what does it mean for real families?',
    content: '<h2>The Current Guidelines</h2><p>The American Academy of Pediatrics recommends avoiding screen time for children under 18 months, except for video chatting with family members.</p><h3>Why These Guidelines Exist</h3><p>The concern is not about screens being harmful per se — it is about opportunity cost. Time spent on screens displaces face-to-face interaction, physical play, and language development.</p>',
  },
  {
    title: 'How We Handled Daycare Separation Anxiety',
    excerpt: 'The first drop-off was harder on us than on the baby. These practical strategies made the transition easier for everyone.',
    content: '<h2>It Gets Better</h2><p>Most children adapt to daycare within two to four weeks. The goodbye is almost always the hardest part — children often settle quickly once the parent has left.</p>',
  },
  {
    title: 'Introducing a Bottle to a Breastfed Baby',
    excerpt: 'Timing matters, and so does technique. Here is what helped our exclusively breastfed baby accept a bottle without fuss.',
    content: '<h2>The Timing Window</h2><p>Most lactation consultants recommend introducing a bottle between 3 and 6 weeks — after breastfeeding is well established, but before the "bottle refusal" window that can start around 8 weeks.</p>',
  },
  {
    title: 'First Foods: A Month-by-Month Guide',
    excerpt: 'A practical guide to starting solids from 6 months through the first birthday, including what to introduce and when.',
    content: '<h2>6 Months: Starting Simple</h2><p>Begin with single-ingredient purees or soft finger foods. Sweet potato, avocado, and banana are popular starting points. Wait 3-5 days between new foods to watch for reactions.</p><h2>8 Months: Building Variety</h2><p>By now, most babies can handle more texture. Lumpy purees, soft-cooked pasta, and small pieces of ripe fruit work well.</p>',
  },
  {
    title: 'The Witching Hour: Surviving Evening Fussiness',
    excerpt: 'Between 5 and 11 PM, many babies are inconsolably fussy. Here is why it happens and what actually helped us.',
    content: '<h2>Why the Evening Is Hard</h2><p>The "witching hour" typically peaks at 6 weeks and resolves by 3-4 months. The cause isn\'t fully understood — it may relate to overstimulation, cluster feeding, or an immature nervous system winding down after a long day.</p>',
  },
  {
    title: 'Baby Teeth: A First-Time Parent\'s Guide',
    excerpt: 'When to expect the first tooth, how to soothe teething discomfort, and when to schedule that first dental visit.',
    content: '<h2>When Teeth Arrive</h2><p>Most babies get their first tooth between 4 and 7 months, though anywhere from 3 to 12 months is within the normal range. The bottom front teeth usually come first.</p>',
  },
  {
    title: 'Sleep Training Methods Compared',
    excerpt: 'Ferber, chair method, pick-up-put-down — a calm, non-judgmental look at the main sleep training approaches.',
    content: '<h2>Is Sleep Training Right for You?</h2><p>Sleep training is a personal decision. There is no one right approach, and many families find their babies sleep well without any formal method.</p><h3>The Ferber Method</h3><p>Also called graduated extinction, this approach involves putting your baby down drowsy and checking in at gradually increasing intervals.</p>',
  },
  {
    title: 'Gentle Ways to Establish a Bedtime Routine',
    excerpt: 'A consistent bedtime routine is one of the most powerful tools for better infant sleep. Here is ours — simple, calm, and effective.',
    content: '<h2>Why Routines Work</h2><p>Bedtime routines signal to your baby\'s brain that sleep is coming. Over time, the routine itself becomes a sleep cue — the bath, the feed, the song all begin to trigger drowsiness.</p><h3>Our 20-Minute Routine</h3><p>Bath (optional, 3x per week), massage, fresh diaper and sleep sack, feed in dim light, one song or book, put down drowsy but awake.</p>',
  },
];

async function seed() {
  await initializeDatabase();
  const pool = getPool();

  // Upsert demo user
  const [existingRows] = await pool.execute('SELECT id FROM users WHERE email = ?', [DEMO_USER.email]);
  let userId: string;

  if ((existingRows as any[]).length > 0) {
    userId = (existingRows as any[])[0].id;
    console.log(`✓ Demo user already exists (id: ${userId})`);
  } else {
    userId = uuidv4();
    const hash = await bcrypt.hash(DEMO_USER.password, 12);
    const now = new Date().toISOString().slice(0, 19).replace('T', ' ');
    await pool.execute(
      `INSERT INTO users (id, username, email, passwordHash, displayName, bio, createdAt, updatedAt)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [userId, DEMO_USER.username, DEMO_USER.email, hash, DEMO_USER.displayName, DEMO_USER.bio, now, now],
    );
    console.log(`✓ Created demo user (id: ${userId})`);
  }

  // Insert sample blogs (skip if already exists by title)
  let created = 0;
  for (const blog of SAMPLE_BLOGS) {
    const [existing] = await pool.execute('SELECT id FROM blogs WHERE title = ? AND userId = ?', [blog.title, userId]);
    if ((existing as any[]).length > 0) continue;

    const blogId = uuidv4();
    const slug = `${blog.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')}-${blogId.slice(0, 6)}`;
    const now = new Date().toISOString().slice(0, 19).replace('T', ' ');

    await pool.execute(
      `INSERT INTO blogs (id, userId, title, slug, content, excerpt, status, publishedAt, createdAt, updatedAt)
       VALUES (?, ?, ?, ?, ?, ?, 'published', ?, ?, ?)`,
      [blogId, userId, blog.title, slug, blog.content, blog.excerpt, now, now, now],
    );
    created++;
  }

  console.log(`✓ Created ${created} sample blogs (${SAMPLE_BLOGS.length - created} already existed)`);
  await closeDatabase();
}

seed().catch(err => {
  console.error('Seed failed:', err);
  process.exit(1);
});
