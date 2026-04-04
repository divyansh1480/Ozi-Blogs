/**
 * Seed script — creates a demo user + 50 sample published blogs
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
    content: '<h2>Brace Yourself</h2><p>The first six months of parenthood are unlike anything you have experienced. Time moves both incredibly fast and agonizingly slow at the same time.</p><p>You will question everything — your choices, your instincts, your sleep-deprived math. And yet, at 3 AM when your baby finally yawns and blinks at you, nothing else in the world matters.</p><h3>The Sleep Thing</h3><p>Everyone warns you about the sleep deprivation. What they don\'t tell you is that your brain adapts. You will function on 4-hour stretches and feel oddly proud of it.</p>',
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
  {
    title: 'How to Choose the Right Pram or Stroller',
    excerpt: 'Lightweight, travel system, all-terrain — the choice is overwhelming. Here is how we narrowed it down and what we use every day.',
    content: '<h2>Start With How You Live</h2><p>Do you mostly walk on smooth pavements or take gravel paths? Do you travel frequently? Do you live in a small flat with limited storage? Your lifestyle should drive the decision, not the brand.</p><h3>Key Features to Consider</h3><p>Weight, fold mechanism, seat recline (flat for newborns), wheel type, and whether it fits in your car boot.</p>',
  },
  {
    title: 'Understanding Growth Spurts in the First Year',
    excerpt: 'Growth spurts can make your baby suddenly hungrier, fussier, and harder to settle. Here is when to expect them and how to ride them out.',
    content: '<h2>When They Happen</h2><p>Common growth spurt windows: 1-3 weeks, 6 weeks, 3 months, 6 months, and 9 months. Each lasts 2-7 days. Your baby may want to feed more frequently and sleep more or less than usual.</p>',
  },
  {
    title: 'Swimming Lessons for Babies: What Age to Start',
    excerpt: 'Baby swimming classes have real benefits — water confidence, coordination, and bonding. Here is what to look for and when to start.',
    content: '<h2>From 6 Weeks Onwards</h2><p>Most pools and instructors recommend starting after 6 weeks, once your baby has had their first vaccinations. The earlier you start, the more natural the water feels to them.</p>',
  },
  {
    title: 'The Best Baby Monitors in 2024',
    excerpt: 'Audio, video, movement, breathing — baby monitors have come a long way. Here is how to choose one that fits your setup and budget.',
    content: '<h2>Do You Need a Monitor at All?</h2><p>In a small home, a basic audio monitor is often enough. Video monitors are genuinely useful if your nursery is far from where you spend most of your time.</p><h3>Movement and Breathing Monitors</h3><p>These can offer reassurance but also cause unnecessary anxiety when false alarms occur. They are not a substitute for a safe sleep environment.</p>',
  },
  {
    title: 'Weaning Off the Dummy: A Gentle Approach',
    excerpt: 'Dummies are a helpful soothing tool — until it is time to let them go. Here is a calm, gradual strategy that worked for us.',
    content: '<h2>When to Start Thinking About It</h2><p>Most dentists recommend phasing out dummy use by age 2, when the habit can start to affect tooth alignment. Emotionally, there is no wrong time — follow your child\'s lead and choose a calm period to make the transition.</p>',
  },
  {
    title: 'Preparing for Your Baby\'s First Cold',
    excerpt: 'The first cold is scary. Here is how to manage symptoms safely, when to call the doctor, and how to help your baby sleep when congested.',
    content: '<h2>Newborns Are Obligate Nasal Breathers</h2><p>Babies under 3 months breathe almost entirely through their nose. A stuffy nose is therefore much more distressing for them than for older children. Saline drops and a gentle nasal aspirator can make a significant difference.</p>',
  },
  {
    title: 'Building Healthy Eating Habits From the Start',
    excerpt: 'The foods and attitudes around eating that you introduce in infancy lay the groundwork for lifelong habits. Here is how to start well.',
    content: '<h2>Variety From the Beginning</h2><p>Offer a wide range of flavours and textures from 6 months. Babies who are exposed to variety early are more likely to accept new foods as toddlers. Avoid adding salt or sugar to baby food.</p>',
  },
  {
    title: 'Baby Sign Language: How and Why We Started',
    excerpt: 'Teaching basic signs to babies before they can speak reduces frustration and builds communication. Here is how we introduced it and what signs helped most.',
    content: '<h2>Why It Works</h2><p>Babies develop motor control before vocal ability. They can physically make simple hand signs months before they can produce words. Signs for "more", "milk", "all done", and "help" have an enormous impact on daily life.</p>',
  },
  {
    title: 'Managing Eczema in Babies and Young Toddlers',
    excerpt: 'Eczema affects around 1 in 5 children. Here is what we learned about triggers, moisturising routines, and when to seek medical help.',
    content: '<h2>The Moisturiser Is Your Best Friend</h2><p>Twice-daily emollient application — even when the skin looks clear — is the foundation of eczema management. Apply immediately after bath while the skin is still slightly damp to lock in moisture.</p>',
  },
  {
    title: 'Night Nursing: Benefits, Challenges, and When to Stop',
    excerpt: 'Feeding at night is normal and beneficial in the early months. Here is an honest look at what the research says and how to decide when to night wean.',
    content: '<h2>Night Feeds Are Normal</h2><p>Newborns need to feed every 2-4 hours around the clock. Their stomachs are small and breast milk or formula digests quickly. Expecting a newborn to sleep through the night is biologically unrealistic.</p>',
  },
  {
    title: 'Sensory Play Ideas for Every Stage of the First Year',
    excerpt: 'Sensory play supports brain development, curiosity, and language. These are our favourite low-mess, age-appropriate activities from birth to 12 months.',
    content: '<h2>Birth to 3 Months</h2><p>High-contrast black-and-white images, soft textured fabrics, gentle music, and your own voice and face are the richest sensory experiences for a newborn.</p><h2>4-6 Months</h2><p>Crinkly toys, water play in a shallow dish, mirrors, rattles, and soft chew toys are perfect as babies start reaching and mouthing everything.</p>',
  },
  {
    title: 'How We Night Weaned at 9 Months',
    excerpt: 'Night weaning is not the same as sleep training. Here is the gradual approach we used to reduce night feeds without any crying it out.',
    content: '<h2>Our Timeline</h2><p>We began at 9 months when our son was healthy, growing well, and eating three solid meals a day — a good sign he did not need calories overnight. We reduced night feeds one at a time over two weeks, shortening each feed gradually.</p>',
  },
  {
    title: 'Postnatal Depression: What It Looks Like and Where to Get Help',
    excerpt: 'PND is more common than most people know and is not a reflection of your love for your baby. Here is how to recognise it and take the first steps toward support.',
    content: '<h2>More Than "Baby Blues"</h2><p>The baby blues — tearfulness, mood swings, and anxiety in the first week — are normal and typically resolve within 10 days. Postnatal depression is different: it persists, deepens, and interferes with daily life. It can begin at any time in the first year.</p>',
  },
  {
    title: 'Returning to Exercise After Birth: A Realistic Guide',
    excerpt: 'Your body needs time and the right approach before returning to exercise. Here is a realistic, evidence-based guide to rebuilding fitness postpartum.',
    content: '<h2>The First 6 Weeks</h2><p>Gentle walking and pelvic floor exercises are the only two things recommended in the first six weeks. Your uterus, ligaments, and pelvic floor are still healing regardless of how you gave birth.</p>',
  },
  {
    title: 'Choosing a Paediatrician: Questions to Ask',
    excerpt: 'Your baby\'s doctor is one of the most important choices you will make. Here is what to ask and what to look for in the first appointment.',
    content: '<h2>Before the Baby Arrives</h2><p>Ideally, choose your paediatrician before the birth. Many practices offer a free meet-and-greet appointment. Use this to assess communication style, availability, and how well they align with your approach to parenting.</p>',
  },
  {
    title: 'Vitamin D Supplements for Breastfed Babies',
    excerpt: 'Breast milk is remarkable — but it is low in vitamin D. Here is what the guidance says and how to supplement safely from birth.',
    content: '<h2>Why Vitamin D Matters</h2><p>Vitamin D is essential for bone development and immune function. Unlike formula (which is fortified), breast milk contains very little vitamin D — regardless of the mother\'s own vitamin D levels.</p><h3>What the NHS Recommends</h3><p>Breastfed babies should be given a daily vitamin D supplement of 8.5-10 micrograms from birth until they are having 500ml of formula per day.</p>',
  },
  {
    title: 'Understanding the Moro Reflex (and Why It Wakes Your Baby)',
    excerpt: 'The startle reflex is the most common reason newborns wake themselves up. Here is what it is, when it fades, and how to work with it.',
    content: '<h2>What Is the Moro Reflex?</h2><p>The Moro (startle) reflex is an involuntary response to a sudden change in position or loud noise. The baby throws their arms out, arches their back, then pulls their arms in. It typically peaks in the first 4-8 weeks and fades by 4-6 months.</p><h3>Swaddling and the Moro Reflex</h3><p>A snug swaddle contains the arm movement of the Moro reflex, which is why swaddled babies often sleep longer in the early weeks.</p>',
  },
  {
    title: 'Flying With a Baby for the First Time',
    excerpt: 'Our first flight with a 5-month-old taught us everything. Here is what we wish we had known — from booking to landing.',
    content: '<h2>Book a Bassinet Seat</h2><p>For long-haul flights, most airlines offer bassinet attachments on bulkhead seats. Book early — these go fast. Your baby can sleep in the bassinet during the flight, which saves your arms considerably.</p><h3>Feeding During Take-Off and Landing</h3><p>Feeding during ascent and descent helps equalise ear pressure. Bring more milk or formula than you think you need.</p>',
  },
  {
    title: 'When to Worry About Your Baby\'s Development',
    excerpt: 'Every baby develops at their own pace, but some signs are worth discussing with your doctor. Here is what to look for at each stage.',
    content: '<h2>3 Months</h2><p>Discuss with your doctor if your baby is not tracking moving objects with their eyes, not responding to loud sounds, or not smiling by 3 months.</p><h2>6 Months</h2><p>Concerns at 6 months include not reaching for objects, not making any vowel sounds, and not rolling in either direction.</p><h2>9-12 Months</h2><p>By 9 months, most babies babble, crawl or move around in some way, and gesture. Not doing so is worth mentioning, though development varies widely.</p>',
  },
  {
    title: 'The Science of Baby Talk (Motherese)',
    excerpt: 'That sing-song, high-pitched voice you instinctively use with your baby? Research shows it is one of the most powerful things you can do for their language development.',
    content: '<h2>What Is Motherese?</h2><p>Infant-directed speech — also called "motherese" or "parentese" — is characterised by slower tempo, higher pitch, exaggerated intonation, and simple vocabulary. Adults produce it instinctively across cultures and languages.</p><h3>Why It Works</h3><p>Studies show that babies pay more attention to infant-directed speech than adult-directed speech. It helps them segment words from continuous speech and learn phonemes more effectively.</p>',
  },
  {
    title: 'Reading the Room: Your Baby\'s Tired and Hunger Cues',
    excerpt: 'Before the crying starts, your baby is already communicating. Learning these subtle early cues can reduce stress for everyone.',
    content: '<h2>Early Hunger Cues</h2><p>Rooting (turning head side to side, mouth open), sucking on fists or tongue, and light fussiness are all early hunger signals. By the time your baby is crying, they are past the easy feeding window.</p><h2>Tired Cues</h2><p>Yawning, eye rubbing, glazed stare, and decreased activity are signs your baby is ready for sleep. Acting on these early cues means an easier settle.</p>',
  },
  {
    title: 'Why Outdoor Time Matters for Babies',
    excerpt: 'Fresh air, natural light, and nature exposure have measurable benefits for babies from the first weeks of life. Here is how to make it a daily habit.',
    content: '<h2>Regulating the Body Clock</h2><p>Natural light exposure in the morning is one of the most effective ways to help establish your baby\'s circadian rhythm. Even 20 minutes outside in the morning makes a difference to day-night orientation.</p>',
  },
  {
    title: 'Navigating Unsolicited Parenting Advice',
    excerpt: 'Everyone has an opinion. Here is how to receive advice gracefully, protect your choices, and stay confident in your own parenting.',
    content: '<h2>The Advice Avalanche</h2><p>From the moment you announce a pregnancy, advice arrives from all directions — family, friends, strangers at the supermarket. Most of it is well-intentioned. Some of it is outdated. Almost none of it is asked for.</p><h3>A Simple Script</h3><p>"Thank you, I\'ll think about that" ends most conversations politely without agreement or argument. You do not need to justify your choices.</p>',
  },
  {
    title: 'Our Honest Review of Baby Food Pouches',
    excerpt: 'Pouches are convenient, but are they nutritionally complete? Here is a balanced look at how to use them wisely without them becoming a crutch.',
    content: '<h2>The Convenience Factor Is Real</h2><p>On a long journey, at a restaurant, or during a busy week, pouches are genuinely useful. The problem arises when they replace varied textures and family mealtimes rather than supplementing them.</p><h3>What to Look For on the Label</h3><p>Avoid pouches with added sugar or salt. Look for ones with vegetables as the primary ingredient, not just fruit. Vary brands and flavours to prevent flavour fixation.</p>',
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
