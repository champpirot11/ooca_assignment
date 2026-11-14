// ข้อมูลและถ้อยคำทั้งหมดของร้าน (แก้ข้อความ/เพลง/ลิงก์ได้ที่ไฟล์นี้ไฟล์เดียว)
// หมายเหตุ: ถ้อยคำตอบกลับ ประโยคในใบเสร็จ และเกณฑ์เส้นทางหนัก เป็นร่าง ควรให้นักจิตวิทยาตรวจก่อนใช้จริง

export const LINKS = { ooca: 'https://www.ooca.co/' };   // TODO: ยืนยันลิงก์ ooca ที่ต้องการให้ไป

// ข้อ 1 — กระดาษ (สีตามไฟล์ดีไซน์)
export const TOPICS = [
  { label: 'การเรียน', k: '#2F6DB0' }, { label: 'การงาน', k: '#A8730F' }, { label: 'ครอบครัว', k: '#B5483B' },
  { label: 'เพื่อน/สังคม', k: '#5B4DB5' }, { label: 'เรื่องเงิน', k: '#2E8A66' }, { label: 'ตัวเอง', k: '#B2682A' },
  { label: 'อนาคต', k: '#686868' }, { label: 'ความรัก', k: '#CC46A4' }, { label: 'เรื่องอื่นๆ', k: '#8C8C8C' },
];

// ข้อ 2 — ฝน (fx = ตำแหน่งหน้าใน faces.svg)
export const RAIN = [
  { label: 'ฝนปรอย', lv: .25, c: '#83B3B1', k: '#5F9694', fx: 15.81, reply: 'ฝนปรอยๆ ก็ทำให้เปียกได้นะครับ' },
  { label: 'เริ่มหนัก', lv: .5, c: '#F0BF4D', k: '#C9952A', fx: 72.99, reply: 'เปียกมาสักพักแล้วสินะครับ\nพักตรงนี้ก่อนได้เลย' },
  { label: 'ตกหนัก', lv: .8, c: '#BC9CC6', k: '#9A75A6', fx: 126.84, reply: 'หนักจริงๆ นะครับ\nอยู่ตรงนี้ก่อนได้' },
  { label: 'พายุ', lv: 1, c: '#8EB0DD', k: '#6E93C6', fx: 182.46, storm: true, reply: 'เดี๋ยวผมช่วยกางร่มไว้ให้นะ\nจะได้ไม่เปียกปอนอยู่คนเดียว' },
];

// ข้อ 3 — แบตเตอรี่ใจ
export const batteryReply = (v) => v <= 10 ? 'ไม่ต้องฝืนตัวเองนะครับ'
  : v <= 30 ? 'เหลือน้อยจริงๆ นะครับ\nที่นี่ชาร์จได้ ไม่ต้องรีบเต็ม'
  : v <= 60 ? 'ครึ่งๆ กลางๆ\nเหนื่อยบ้างก็ไม่เป็นไรนะครับ'
  : 'ยังมีแรงอยู่นะครับ\nเก็บไว้ใช้ในวันที่ต้องการ';

// ข้อ 4 — ชีวิตเหมือนเพลงแบบไหน (mood = แผ่นที่จะได้, n/iv = โน้ตตัวอย่างตอนเลือก)
export const SONGS = [
  { label: 'สดใส ฟังแล้วสบายๆ', say: 'สดใสแบบนี้ ผมชอบจัง\nอยากให้มันอยู่กับคุณนานๆ นะ', c: '#00C4B3', mood: 'easy', n: 12, iv: 4 },
  { label: 'ช้าๆ สบายๆ อยากพักผ่อน', say: 'อยากพักใช่ไหมครับ\nวันนี้พักได้เต็มที่เลย', c: '#4F8FE0', mood: 'calm', n: 7, iv: 5 },
  { label: 'เศร้าๆ อินกับความรู้สึก', say: 'เศร้าได้นะครับ\nไม่ต้องรีบหายก็ได้', c: '#8C7BD8', mood: 'cathartic', n: 5, iv: -2 },
  { label: 'เงียบๆ แทบไม่มีเสียง', say: 'เงียบๆ ก็ดีนะครับ\nผมจะนั่งเป็นเพื่อนเงียบๆ', c: '#B9B4AC', mood: 'still', n: 0, iv: 0 },
  { label: 'หนักๆ อยากระบายออกมา', say: 'อัดอั้นมาเยอะเลยสินะ\nปล่อยออกมาได้เลยครับ', c: '#E0655A', mood: 'release', n: 3, iv: -3 },
  { label: 'คิดถึงวันเก่าๆ', say: 'คิดถึงวันเก่าๆ เหรอครับ\nบางความทรงจำก็อุ่นใจดีนะ', c: '#E8A25C', mood: 'nostalgia', n: 9, iv: -4 },
  { label: 'วนๆ คิดไม่หยุด', say: 'หัวคงเหนื่อยน่าดูเลย\nค่อยๆ วางลงทีละเรื่องนะครับ', c: '#5B6BC9', mood: 'intro', n: 4, iv: 1 },
  { label: 'ค่อยๆ ดีขึ้นทีละนิด', say: 'ทีละนิดก็คือการไปข้างหน้า\nผมดีใจด้วยนะครับ', c: '#4FB889', mood: 'uplift', n: 7, iv: 7 },
];

// แผ่นเสียง 8 มู้ด
export const MOODS = {
  release: { th: 'ปล่อยออกมาก่อน', en: 'Release' }, cathartic: { th: 'ปล่อยให้เศร้า', en: 'Cathartic' },
  nostalgia: { th: 'คิดถึงอดีต', en: 'Nostalgia' }, intro: { th: 'อยู่กับความคิด', en: 'Introspective' },
  still: { th: 'เงียบๆ ไม่ต้องพูด', en: 'Stillness' }, calm: { th: 'พักหายใจ', en: 'Calm' },
  easy: { th: 'ใจเบาๆ', en: 'Easy Going' }, uplift: { th: 'ค่อยๆ ไต่ขึ้น', en: 'Gentle Uplift' },
};
const LIGHT = ['still', 'calm', 'cathartic'];      // แผ่นเบาสำหรับเส้นทางหนัก
const BY_RAIN = [['easy', 'calm'], ['calm', 'intro'], ['cathartic', 'intro'], ['still', 'cathartic']];   // ไม่ตอบข้อ 4 → เดาจากความแรงฝน (ปรอย → พายุ)
const any = (L) => L[Math.random() * L.length | 0];

// เพลง — มู้ดละ 2 เพลง ใช้เวอร์ชันคัฟเวอร์/อินดี้ที่ศิลปินอัปโหลดเอง (ไฟล์ของค่ายใหญ่ถูกบล็อกในไทย หรือเล่นได้แค่ 30 วิ) ระบบสุ่ม 1 เพลงจากมู้ดที่ได้
// ความหมาย = ถ้อยคำของเราเอง ไม่ได้ยกเนื้อเพลงมา
const SC = (path) => `https://w.soundcloud.com/player/?url=${encodeURIComponent('https://soundcloud.com/' + path)}&color=%2300c4b3&auto_play=false&hide_related=true&show_comments=false&show_user=true&show_reposts=false&show_teaser=false`;
export const TRACKS = {
  release: [
    { title: 'Shake It Out - Florence + The Machine (cover: CARRON)', embed: SC('carronmusic/shake-it-out'), t: ["ตัวเอง", "อนาคต"], e: 5, meaning: 'บางวันเราแบกอะไรไว้เยอะจนลืมไปว่าวางลงได้ ลองสลัดมันออกสักหน่อย แล้วค่อยเริ่มใหม่' },
    { title: 'Unsteady - X Ambassadors (cover: John Allred)', embed: SC('johnallred/x-ambassadors-unsteady-cover-by-allred'), t: ["ครอบครัว"], e: 4, meaning: 'ใจที่โยกเยกไม่ได้แปลว่าอ่อนแอ บอกออกมาว่าไม่ไหวได้ แล้วหาอะไรสักอย่างไว้ยึดก่อนก็พอ' },
  ],
  cathartic: [
    { title: 'All I Want - Kodaline (cover: Chris Lanzon)', embed: SC('chrislanzonmusic/alliwant'), t: ["ความรัก"], e: 3, meaning: 'การคิดถึงใครสักคนจนเจ็บ แปลว่าใจเราเคยรักจริง ร้องไห้ออกมาได้นะ' },
    { title: 'Skinny Love - Bon Iver (cover: Georgia Kinahan)', embed: SC('georgiakinahan/skinny-love-bon-iver-birdy'), t: ["ความรัก"], e: 3, meaning: 'ความเศร้าบางอย่างไม่ต้องรีบหาย ปล่อยให้มันอยู่สักพัก แล้วมันจะเบาลงเอง' },
    { title: "Who You Are - Jessie J (cover: Anna Clendening)", embed: SC('user-529691465/who-you-are-jessie-j-anna-clendening-cover'), t: ["ตัวเอง"], e: 2, meaning: 'ไม่ต้องเป็นใครที่คนอื่นอยากให้เป็นก็ได้ วันที่ไม่ไหว ร้องไห้ได้ แล้วค่อยกลับมาเป็นตัวเองอีกครั้ง' },
  ],
  nostalgia: [
    { title: 'The Night We Met - Lord Huron (cover: Sammi Lee)', embed: SC('lee_sam_t/the-night-we-met'), t: ["ความรัก"], e: 2, meaning: 'การอยากย้อนกลับไปช่วงเวลาหนึ่ง แปลว่ามันเคยมีความหมายกับเรามาก คิดถึงได้ ไม่ผิดเลย' },
    { title: 'Yellow - Coldplay (cover: Archelle)', embed: 'https://w.soundcloud.com/player/?url=https%3A//api.soundcloud.com/tracks/soundcloud%253Atracks%253A478672074&color=%2300c4b3&auto_play=false&hide_related=true&show_comments=false&show_user=true&show_reposts=false&show_teaser=false', t: ["ความรัก", "เพื่อน/สังคม"], e: 3, meaning: 'มีใครบางคนมองเห็นแสงในตัวคุณเสมอ แม้ในวันที่คุณมองไม่เห็นมันเอง' },
    { title: "The Best Day - Taylor Swift (cover: CARPAL PARKA)", embed: SC('carpalparka/the-best-day-taylor-swift'), t: ["ครอบครัว"], e: 2, meaning: 'บางวันธรรมดากับคนในบ้าน กลับเป็นวันที่ดีที่สุดที่เราจำได้ ความอบอุ่นนั้นยังอยู่กับเราเสมอ' },
  ],
  intro: [
    { title: 'Holocene - Bon Iver', embed: SC('boniver/holocene'), t: ["ตัวเอง", "อนาคต"], e: 2, meaning: 'บางครั้งการรู้สึกตัวเล็กๆ ก็ทำให้เรื่องในหัวเบาลง เราไม่จำเป็นต้องคิดให้จบทุกเรื่องในคืนนี้' },
    { title: 'Anchor - Novo Amor (cover: eriohutomo)', embed: SC('eriohutomo/anchor-novo-amor-cover'), t: ["ตัวเอง"], e: 2, meaning: 'ในวันที่ความคิดพัดไปมา หาอะไรสักอย่างไว้ยึด แค่ลมหายใจตัวเองก็ได้' },
  ],
  still: [
    { title: 'Bloom - The Paper Kites', embed: SC('nettwerkmusicgroup/the-paper-kites-bloom-bonus'), t: ["ความรัก"], e: 1, meaning: 'ความรู้สึกดีๆ ค่อยๆ ผลิบานอย่างเงียบๆ ได้ ไม่ต้องรีบ ไม่ต้องดังก็ได้' },
    { title: 'Such Great Heights - Iron & Wine', embed: SC('ironandwine/such-great-heights'), t: ["ความรัก", "เพื่อน/สังคม"], e: 1, meaning: 'ไม่ต้องพูดอะไรก็ได้ แค่นึกถึงคนหรือที่ที่ทำให้ใจอุ่น แล้วนั่งฟังไปเงียบๆ' },
  ],
  calm: [
    { title: 'Banana Pancakes - Jack Johnson (cover: Nick Duke)', embed: SC('nickdukemusic/banana-pancakes-jack-johnson-cover'), t: ["การงาน", "การเรียน", "เรื่องเงิน"], e: 2, meaning: 'วันฝนตกก็ไม่ต้องรีบไปไหน อยู่ช้าๆ ทำอะไรง่ายๆ ให้ตัวเองบ้าง' },
    { title: "Don't Know Why - Norah Jones (cover: ruthdian)", embed: SC('ruthdian/norah-jones-dont-know-why'), t: ["ตัวเอง", "อนาคต"], e: 1, meaning: 'ไม่ต้องรู้ทุกคำตอบตอนนี้ก็ได้ นั่งฟังเพลงช้าๆ แล้วให้ใจได้พักก่อน' },
    { title: "Lean On Me - Bill Withers (cover: David Bradford)", embed: SC('davidbradfordmusic/lean-on-me-cover'), t: ["เพื่อน/สังคม", "ครอบครัว"], e: 2, meaning: 'ทุกคนมีวันที่ต้องพึ่งใครสักคน การขอให้ใครช่วยไม่ใช่ความอ่อนแอเลย' },
    { title: "Home - Phillip Phillips (cover: Acoustic Covers)", embed: SC('acoustic_covers/home-phillip-phillips-acoustic-cover'), t: ["ครอบครัว", "อนาคต"], e: 2, meaning: 'ไม่ว่าทางข้างหน้าจะยุ่งเหยิงแค่ไหน เราจะหาที่ที่รู้สึกเหมือนบ้านเจอเสมอ' },
  ],
  easy: [
    { title: 'Lover Boy - Phum Viphurit (cover: mattjaudian)', embed: SC('mattjaudian/lover-boy-phum-viphuritacoustic-cover'), t: ["ความรัก"], e: 3, meaning: 'ความสุขเล็กๆ ไม่ต้องมีเหตุผลก็ได้ วันนี้ใจเบาก็ปล่อยให้มันเบาไป' },
    { title: 'Riptide - Vance Joy (cover: Kira Alejandro)', embed: SC('kira-alejandro/riptide-vance-joy-cover'), t: ["ตัวเอง", "อนาคต"], e: 4, meaning: 'ชีวิตไม่ต้องเพอร์เฟกต์ก็สนุกได้ ฮัมเพลงไปเรื่อยๆ ไม่ต้องคิดมาก' },
    { title: "Count on Me - Bruno Mars (cover: Porcupine_a)", embed: SC('porcupine-a/count-on-me-bruno-mars-cover'), t: ["เพื่อน/สังคม"], e: 3, meaning: 'มีเพื่อนสักคนที่พร้อมอยู่ข้างๆ ก็ทำให้วันหนักๆ เบาลงได้เยอะ' },
    { title: "Price Tag - Jessie J (cover: Jannine Weigel)", embed: SC('jannina-weigel/price-tag-jessie-j-cover'), t: ["เรื่องเงิน", "การงาน"], e: 4, meaning: 'ความสุขบางอย่างไม่ต้องมีราคา วันนี้ลองพักเรื่องตัวเลข แล้วยิ้มให้ตัวเองสักหน่อย' },
  ],
  uplift: [
    { title: 'Fix You - Coldplay (cover: NEKA)', embed: SC('officialneka/fix-you-cover-coldplay'), t: ["ตัวเอง", "ความรัก"], e: 3, meaning: 'ในวันที่พยายามแล้วยังไม่ดีขึ้น จะมีแสงพาคุณกลับบ้านเสมอ ไม่ต้องรีบหายดีในวันเดียว' },
    { title: 'Keep Your Head Up - Ben Howard (cover: Coby Grant)', embed: SC('cobygrant/ben-howard-keep-your-head-up'), t: ["การเรียน", "การงาน", "อนาคต"], e: 3, meaning: 'เงยหน้าขึ้นนิดนึง ก้าวเล็กๆ วันนี้ก็คือการไปข้างหน้าแล้ว' },
    { title: "The Climb - Miley Cyrus (cover: Samantha Harvey)", embed: SC('samharveyuk/miley-cyrus-the-climb-cover'), t: ["การเรียน", "อนาคต"], e: 3, meaning: 'ทางที่ชันไม่ได้แปลว่าเราเดินผิด สิ่งที่เติบโตขึ้นระหว่างทางก็มีความหมายพอๆ กับปลายทาง' },
    { title: "Rise Up - Andra Day (cover: Sanjana Ganesh)", embed: SC('sanjanaganesh/rise-up-andra-day'), t: ["การงาน", "ตัวเอง", "เรื่องเงิน"], e: 3, meaning: 'ล้มกี่ครั้งก็ค่อยๆ ลุกได้ ไม่ต้องรีบ แค่ไม่ทิ้งตัวเองก็พอ' },
  ],
};
// เลือกเพลง: ให้คะแนนทุกเพลงจากคำตอบทั้งหมด แล้วเอาเพลงที่คะแนนสูงสุด
//  ข้อ 4 (อารมณ์ที่อยากฟัง) น้ำหนักมากสุด · ข้อ 1 (เรื่องที่แบก) รองลงมา · ข้อ 2–3 (ฝน/แบตใจ) = เพดานความแรงของเพลง
//  เส้นทางหนัก → เฉพาะแผ่นเบาและเพลงที่นุ่มที่สุด · ไม่ซ้ำกับเพลงครั้งก่อนในเครื่องนี้ (จำไว้ในเครื่องเท่านั้น)
const NEAR = { release: ['cathartic', 'uplift'], cathartic: ['release', 'intro', 'still'], nostalgia: ['intro', 'calm'], intro: ['nostalgia', 'still', 'cathartic'],
  still: ['calm', 'intro'], calm: ['still', 'easy', 'nostalgia'], easy: ['calm', 'uplift'], uplift: ['easy', 'release', 'calm'] };
export function pickSong(st) {
  const fromQ4 = st.songs.length > 0, lowB = st.battery !== null && st.battery <= 30, storm = st.rain === 3;
  const want = fromQ4 ? st.songs.map((i) => SONGS[i].mood) : (st.battery ?? 50) <= 30 ? ['still', 'calm'] : st.rain != null ? BY_RAIN[st.rain] : ['calm', 'easy', 'intro', 'nostalgia'];
  const topics = st.topics.map((i) => TOPICS[i].label), maxE = st.heavy ? 2 : lowB || storm ? 3 : 5;
  let last = null; try { last = localStorage.getItem('ooca-last-track'); } catch (e) {}
  let best = null;
  for (const [mood, L] of Object.entries(TRACKS)) for (const track of L) {
    if (track.e > maxE || (st.heavy && !LIGHT.includes(mood))) continue;
    const hits = track.t.filter((x) => topics.includes(x));
    let sc = want.includes(mood) ? (fromQ4 ? 10 : 6) : want.some((w) => NEAR[w].includes(mood)) ? 4 : 0;
    if (hits.length) sc += 5 + (hits.length - 1);
    if (lowB || storm) sc -= (track.e - 1) * .5;          // ใจเหนื่อย → เพลงนุ่มกว่าได้เปรียบ
    if (track.embed === last) sc -= 100;
    sc += Math.random() * .9;                               // คะแนนเท่ากัน → สุ่ม
    if (!best || sc > best.sc) best = { sc, mood, track, hits };
  }
  try { localStorage.setItem('ooca-last-track', best.track.embed); } catch (e) {}
  // เหตุผลที่ได้เพลงนี้ (โชว์ในใบเสร็จ): เรื่องที่ตรง · อารมณ์ที่เลือก · ฝน/แบตใจ
  const why = [];
  if (best.hits.length) why.push(best.hits[0].startsWith('เรื่อง') ? best.hits[0] : 'เรื่อง' + best.hits[0]);
  const q = st.songs.map((i) => SONGS[i]).find((x) => x.mood === best.mood) || (fromQ4 ? SONGS[st.songs[0]] : null); if (q) why.push(q.label);
  if (st.rain != null) why.push(RAIN[st.rain].label); if (st.battery !== null) why.push(`แบตใจ ${st.battery}%`);
  return { mood: best.mood, track: best.track, why };
}

// ใบเสร็จ — ประโยคถึงคุณ ตามเรื่องแรกที่เลือกในข้อ 1
export const HEART = {
  'การเรียน': 'เรื่องเรียนที่หนักอยู่ ไม่ได้แปลว่าคุณเก่งน้อยลง มันแค่หนักจริงๆ',
  'การงาน': 'เหนื่อยจากงานมาขนาดนี้ ก็ยังเดินมาถึงตรงนี้ได้ แค่นั้นก็นับแล้ว',
  'ครอบครัว': 'คนใกล้ตัวที่สุด บางทีก็ทำให้เหนื่อยได้มากที่สุด ความรู้สึกของคุณมีที่ยืนที่นี่',
  'เพื่อน/สังคม': 'การต้องปรับตัวเข้าหาคนอื่นตลอดเวลามันเหนื่อยนะ ที่นี่คุณเป็นตัวเองได้เต็มที่',
  'เรื่องเงิน': 'เรื่องเงินกดทับได้มากกว่าที่ใครเห็น ที่นี่ไม่ต้องคิดคำนวณอะไร ไม่ต้องจ่ายสักบาท',
  'ตัวเอง': 'การเผชิญหน้ากับตัวเองในวันที่ไม่ค่อยโอเค ต้องใช้แรงมาก ขอบคุณที่ไม่ได้หนีมันไป',
  'อนาคต': 'อนาคตยังมาไม่ถึง ไม่ต้องแบกมันทั้งหมดในวันนี้ก็ได้ ทีละวันก็พอ',
  'ความรัก': 'ใจที่รักใครเป็น คือใจที่อ่อนโยน เหนื่อยเพราะมันก็ไม่ผิดเลย',
  'เรื่องอื่นๆ': 'ไม่ต้องรู้ชื่อมันก็ได้ ฝนก็คือฝน คุณแค่เข้ามาหลบก็พอแล้ว',
  _: 'ไม่ต้องเล่าอะไรก็ได้ แค่เข้ามาหลบฝน ก็ถือว่าดูแลตัวเองแล้ว',
};
export const ACTION = (b) => b === null ? 'นั่งฟังเพลงนี้ต่ออีกสักนาที โดยไม่ต้องทำอะไรเลย'
  : b <= 30 ? 'วางมือบนหน้าอก หายใจเข้าช้าๆ นับสี่ แล้วออกยาวๆ นับหก'
  : b <= 60 ? 'ดื่มน้ำสักแก้ว แล้วยืดไหล่ไปข้างหลังช้าๆ สามครั้ง'
  : 'เขียนสิ่งเล็กๆ หนึ่งอย่างที่ทำให้วันนี้ดีขึ้นอีกนิด';

// ข้อ 5 — ไม่เซ็นเซอร์คำหยาบ (เป็นพื้นที่ระบาย และข้อความไม่ถูกส่งไปไหน)
// แต่ถ้าเจอคำที่อาจสื่อถึงการทำร้ายตัวเอง จะพาไปหน้าดูแล (1323 / ooca) ก่อน แล้วเล่นต่อได้เสมอ
// ตั้งใจให้ "ไวไว้ก่อน": มีคำเดี่ยวอย่าง ตาย / ฆ่า อยู่ตรงไหนในประโยคก็นับ (ยอมให้เตือนเกินดีกว่าพลาด)
// รายการนี้เป็นร่าง ควรให้นักจิตวิทยาตรวจและเพิ่มเติม

// 1) คำเดี่ยว — เจอที่ไหนในประโยคก็นับ
const WORDS = [
  'ตาย', 'ฆ่า', 'ปลิดชีพ', 'ลาโลก', 'สั่งเสีย', 'จดหมายลา', 'กรีด', 'เชือด', 'แขวนคอ', 'ผูกคอ', 'รัดคอ', 'บีบคอ', 'เชือก', 'ห่วงเชือก', 'ปืน', 'ยิงตัวเอง', 'ยิงหัว', 'ถ่านเผา', 'รมควัน', 'เปิดแก๊ส', 'สูดแก๊ส',
  'โดดตึก', 'กระโดดตึก', 'โดดสะพาน', 'กระโดดสะพาน', 'จากที่สูง', 'จมน้ำ', 'ยาพิษ', 'ยาเบื่อ', 'ยาเกินขนาด', 'กินยาเยอะ', 'กินยาหมด', 'กินยาทั้ง',
  'ทำร้ายตัวเอง', 'ทำร้ายร่างกาย', 'ทำตัวเองเจ็บ', 'ให้ตัวเองเจ็บ', 'เลือด', 'ใบมีด', 'คมมีด', 'มีดโกน', 'คัตเตอร์', 'แทงตัวเอง', 'เผาตัวเอง', 'ให้รถชน',
];
// 2) วลี — ความหมายเสี่ยงแต่ไม่มีคำเดี่ยวข้างบน
const PHRASES = [
  'ไม่อยากอยู่', 'ไม่อยากมีชีวิต', 'ไม่อยากหายใจ', 'ไม่อยากตื่น', 'หลับไม่ตื่น', 'หลับไปตลอดกาล', 'ไม่อยากเกิด', 'ไม่น่าเกิดมา', 'เกิดมาทำไม', 'อยู่ไปทำไม',
  'อยากหายไป', 'หายไปจากโลก', 'หายไปตลอดกาล', 'ไปจากโลกนี้', 'จบชีวิต', 'จบทุกอย่าง', 'อยากจบ', 'จบๆไป', 'อยากไปสบาย', 'ไม่อยากไปต่อ', 'ไปต่อไม่ไหว', 'อยู่ไปก็เท่านั้น', 'อยู่ไปก็ไม่มี', 'ไม่อยากทนแล้ว',
  'อยู่ไม่ไหวแล้ว', 'ทนอยู่ไม่ไหว', 'ชีวิตไม่มีความหมาย', 'ไม่มีเหตุผลที่จะอยู่', 'ไม่มีทางออก', 'หมดหวังกับชีวิต', 'สิ้นหวัง', 'ไม่อยากเป็นภาระ', 'เป็นภาระของ', 'เป็นภาระให้',
  'ไม่มีใครต้องการ', 'ไม่มีใครรัก', 'ไม่มีเราก็ได้', 'ไม่มีฉันก็ได้', 'ไม่มีเราคงดีกว่า', 'ไม่มีฉันคงดีกว่า', 'ไม่มีกูคงดีกว่า', 'โลกไม่ต้องการ', 'ลาก่อนทุกคน', 'บอกลาทุกคน', 'เจ็บตัว',
];
// 3) อังกฤษ — ต้องเป็นคำทั้งคำ (กัน diet / skill / scut ฯลฯ)
const EN = /\b(die|dies|died|dying|dead|death|kill|killing|killed|suicide|suicidal|unalive|sewerslide|kms|kys|self ?-?harm|cut(ting)? myself|hurt(ing)? myself|overdose|od|hang myself|noose|end (my life|it all)|no reason to live|better off dead|wanna die|want to die)\b/i;

// เทียบแบบทนการพิมพ์: ตัดช่องว่าง/อักขระล่องหน/จุด, รวมสระอำที่พิมพ์แยก (ํ+า), ยุบตัวอักษรซ้ำ (ตายยยย → ตาย), ไม่สนตัวพิมพ์เล็ก/ใหญ่
const norm = (t) => t.normalize('NFC').toLowerCase().replace(/ํา/g, 'ำ').replace(/[\s​-‍﻿._\-*~,!?'"()]+/g, '').replace(/(.)\1+/g, '$1');
const KEYS = [...WORDS, ...PHRASES].map(norm);
const KNIFE = /มีด(?![ีิ])/;   // มีด ทุกแบบ ยกเว้น "มีดี" (มี+ดี) ที่ไม่เกี่ยวกัน
export const isRisk = (t) => { if (!t) return false; const x = norm(t); return KEYS.some((w) => x.includes(w)) || KNIFE.test(x) || EN.test(t.replace(/\s+/g, ' ')); };
export const RISK_WORDS = { WORDS, PHRASES };

// ข้อ 5 — คำหยาบ: ยังส่งไม่ได้ ให้เปลี่ยนเป็นคำที่สุภาพขึ้น (คำเสี่ยงทำร้ายตัวเองไม่นับตรงนี้ — ส่งได้เสมอเพื่อพาไปหน้าดูแล)
const RUDE = ['เหี้ย', 'เหี้ยะ', 'เชี่ย', 'เชี้ย', 'สัส', 'ควย', 'เย็ด', 'แม่ง', 'แม่มึง', 'พ่อมึง', 'มึง', 'ไอ้สัตว์', 'อีสัตว์', 'ไอ้เวร', 'อีเวร', 'ไอ้ควาย', 'อีควาย', 'อีดอก', 'ดอกทอง',
  'ระยำ', 'ชาติหมา', 'ส้นตีน', 'ตีนมึง', 'จัญไร', 'กะหรี่', 'ร่าน', 'ไอ้ฟาย', 'อีฟาย', 'ไอ้บ้า', 'อีบ้า', 'ไอ้โง่', 'อีโง่', 'ไอ้หน้าโง่', 'สถุน', 'ไพร่', 'ปัญญาอ่อน', 'อีห่า', 'ไอ้ห่า', 'ห่าราก', 'ห่าเหว', 'แตด', 'จู๋', 'จิ๋ม'];
const RUDE_RE = [/หี(?!บ)/, /สัด(?!ส่วน)/, /(^|[^ก-๙])เวร(?!กร)/];   // คำที่ซ้อนอยู่ในคำปกติ ต้องกันไว้ เช่น หีบ, สัดส่วน
const RUDE_EN = /\b(fuck\w*|f+u+c+k+|shit\w*|bitch\w*|asshole|bastard|dick|cunt|motherfucker|wtf|stfu|damn|crap|slut|whore)\b/i;
const RUDE_N = RUDE.map(norm);
export const isRude = (t) => { if (!t) return false; const x = norm(t); return RUDE_N.some((w) => x.includes(w)) || RUDE_RE.some((r) => r.test(x)) || RUDE_EN.test(t); };
