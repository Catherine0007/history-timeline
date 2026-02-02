<template>
  <div class="universe">
    <video ref="videoElement" style="display: none;"></video>
    
    <div class="gesture-status" :class="statusClass">
      <span v-if="selectedNode && !isCurrentlyFist">🖐️ 横向挥手 (像推开窗户一样) 即可退出</span>
      <span v-else-if="isCurrentlyFist">✊ 已抓取 (松开查看详情)</span>
      <span v-else-if="isPanning">☝️ 食指引导 (移动时间轴)</span>
      <span v-else>✋ 等待指令 (食指滑动 / 握拳抓取)</span>
    </div>

    <div class="fixed-lane-labels">
      <div class="lane-label label-west">
        <span class="label-en">HISTORY OF WEST</span>
        <span class="label-decoration"></span>
      </div>
      <div class="lane-label label-asia">
        <span class="label-en">HISTORY OF ASIA</span>
        <span class="label-decoration"></span>
      </div>
    </div>

    <h1 class="main-title">CHRONICLES OF CIVILIZATION</h1>
    
    <div 
      class="view-viewport" 
      ref="viewportRef"
      :class="{ 'is-focus': selectedNode }"
      @scroll="handleScroll"
    >
      <div class="scrolling-content">
        
        <div class="horizontal-axis">
          <div v-for="n in 400" :key="'dot-'+n" class="axis-dot" :style="getAxisItemStyle((n-1) * 45)"></div>
          <div v-for="y in yearMarkers" :key="y" class="marker-tag" :style="getAxisItemStyle(getPos(y), true)">
            {{ y < 0 ? Math.abs(y) + ' BCE' : y + ' CE' }}
          </div>
        </div>

        <div v-for="lane in ['west', 'asia']" :key="lane" :class="['content-lane', lane + '-lane']">
          <div 
            v-for="item in historyData[lane]" 
            :key="item.id" 
            class="history-node" 
            :class="{ 'is-highlight': isNodeInCenter(item) }"
            :style="getDynamicStyle(item.year)"
          >
            <transition name="pop">
              <div class="detail-pop" v-if="selectedNode?.id === item.id">
                
                <div class="info-card summary-card" v-if="item.summary" style="margin-bottom: 20px;">
                  <p>{{ item.summary }}</p>
                </div>

                <div v-if="item.regions" class="parallel-container">
                  <div v-for="reg in item.regions" :key="reg.pos" :class="['info-card', 'pop-' + reg.pos]">
                    <div class="reg-tag">{{ reg.pos.toUpperCase() }} ASIA</div>
                    <h4>{{ reg.title }}</h4>
                    <p>{{ reg.detail }}</p>
                  </div>
                </div>

                <div v-else class="info-card">
                  <div v-for="sub in item.subRegions" :key="sub.name">
                    <h4>{{ sub.name }}</h4>
                    <p>{{ sub.detail }}</p>
                  </div>
                </div>
                
              </div>
            </transition>

            <template v-if="lane === 'west'">
              <div class="node-text">
                <div class="node-name">{{ item.period }}</div>
                <div class="node-time">{{ item.time }}</div>
              </div>
              <div class="vertical-stem"></div>
              <div class="core-dot"></div>
            </template>
            <template v-else>
              <div class="core-dot"></div>
              <div class="vertical-stem"></div>
              <div class="node-text">
                <div class="node-name">{{ item.period }}</div>
                <div class="node-time">{{ item.time }}</div>
              </div>
            </template>
          </div>
        </div>

      </div>
    </div>

    <button v-if="selectedNode" class="clear-btn" @click="selectedNode = null">RESET (🖐️ SWIPE)</button>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';

// --- 基础配置 ---
const START = -4000;
const END = 2025;
const TOTAL_WIDTH = 18000;
const yearMarkers = [-4000, -2000, 0, 1000, 1500, 1800, 1900, 2000];
const currentScroll = ref(0);
const selectedNode = ref(null);
const viewportRef = ref(null);
const videoElement = ref(null);

// 手势识别状态
const isCurrentlyFist = ref(false);
const isPanning = ref(false);
const handXHistory = ref([]); // 用于记录手部 X 轴位移趋势

const statusClass = computed(() => ({
  'is-fist': isCurrentlyFist.value,
  'is-panning': isPanning.value,
  'is-exit': selectedNode.value && !isCurrentlyFist.value
}));

// 模拟历史数据
const historyData = {
  west: [
    { id: "w1", 
      year: -3500, 
      period: "Prehistoric", 
      time: "Before 3000 BCE", 
      subRegions: [{ 
        name: "Cave Art",
        detail: `The term “prehistoric” refers to the time before written history. In the West, writing was invented in ancient Mesopotamia just before 3000 B.C.E., so this period includes visual culture (paintings, sculpture, and architecture) made before that date. The oldest decorative forms we can recognize as art come from Africa and may date back to 100,000 B.C.E. In contrast, the oldest cave paintings known are about 40,800 years old, and although we used to think that only our species, Homo Sapiens, made art—anthropologists now speculate that Neanderthals may have made at least some of these very early images.
The Neolithic revolution, one of the most profound developments in all of human history, occurs during the Prehistoric Era. This is when our ancestors learned to farm and domesticate animals, allowing them to give up their nomadic ways, and settle down to build cities and civilizations.`
      }] 
    },
    { id: "w2", 
      year: -500, 
      period: "Ancient", 
      time: "3000 BCE - 400 CE", 
      subRegions: [{ 
        name: "Classical Age", 
        detail: `This period includes the great early civilizations of the ancient Near East (think Babylonia), ancient Egypt, ancient Greece, the Etruscans, and the Romans—everything that comes after the invention of writing and before the fall of the Roman Empire. Keep in mind the disintegration of the Roman Empire took centuries, but to simplify, c. 400 will do.
        It was during this period that the ancient Greeks first applied human reason to their observations of the natural world and created some of the earliest naturalistic images of human beings. This period is often credited with the birth of Western philosophy, mathematics, theater, science, and democracy. The Romans in turn created an empire that extended across most of Europe, and all the lands that surround the Mediterranean Sea. They were expert administrators and engineers and they saw themselves as the inheritors of the great civilizations that came before them, particularly, Greece and Egypt (which they conquered). 
        It’s important to remember that although history is often presented as a series of discrete stories, in reality narratives often overlap making history both more complex and more interesting. For example, it was also during the Roman Empire that the figure we now call Jesus lived. Jesus and his apostles were Jewish men living in what is today Israel, but which was then part of the Roman Empire.` 
      }] 
    },
    { id: "w3", 
      year: 800, 
      period: "Middle Ages", 
      time: "400 - 1400 CE", 
      subRegions: [{ 
        name: "Feudal Era", 
        detail: `The first half of this thousand-year period witnessed terrible political and economic upheaval in Western Europe, as waves of invasions by migrating peoples destabilized the Roman Empire. The Roman emperor Constantine established Constantinople (now Istanbul, Turkey) as a new capital in the East in 330 C.E. and the Western Roman Empire broke apart soon after. In the Eastern Mediterranean, the Byzantine Empire (with Constantinople as its capital), flourished.
        Christianity spread across what had been the Roman Empire—even among migrating invaders (Vandals, Visigoths, etc.). The Christian Church, headed by the Pope, emerged as the most powerful institution in Western Europe, the Orthodox Church dominated in the East.
        It was during this period that Islam, one of the three great monotheistic religions, was born. Within little more than a century of the death of the Prophet Muhammad in 632 C.E., Islam had become an empire that stretched from Spain across North Africa, the Middle and Near East, to India. Medieval Islam was a leader in science and technology and established some of the world’s great centers of learning (Cordoba, for example). Islamic culture played an important role in preserving and translating ancient Greek texts at a time when much of the knowledge created during the ancient world was lost.
        Petrarch (a writer who lived in the 1300s) described the early Medieval period as the "Dark Ages" because to him it seemed to be a period of declining human achievement, especially when he compared it to the Ancient Greeks and Romans. The “Middle Ages” got its name because Renaissance scholars saw it as a long barbaric period that separated them from the great civilizations of ancient Greece and Rome that they both celebrated and emulated.
        Medieval society was organized into clearly defined strata. At the top was the king. Below were lesser nobles. These lords in turn, ruled over peasants and serfs (the vast majority of the population). Serfs were laborers who were permanently bound to work the land owned by their lord. The basic unit of this system, known as Feudalism, was the lord/vassal relationship. The vassal would provide labor (in the fields or in battle) to the lord in exchange for land and protection. Mobility between strata was very rare.
        Of course, the thousand years of the Middle Ages saw the creation of many great works of art and literature, but they were different from what Petrarch valued. The works of art created in the Middle Ages were largely focused on the teachings of the Church.
        It is important to remember that during the Middle Ages it was rare that anyone except members of the clergy (monks, priests, etc.) could read and write. Despite expectations that the world would end in the year 1,000, Western Europe became increasingly stable, and this period is sometimes referred to as the Late (or High) Middle Ages. This period saw the renewal of large scale building and the re-establishment of sizable towns. Monasteries, such as Cluny, became wealthy and important centers of learning.
        Within the Middle Ages, there are subdivisions in art history, including Early Christian, Byzantine, Carolingian, Ottonian, Romanesque and Gothic. When we look closely at much of the art and politics of the 1,000 years of the Middle Ages, we find a complex and ongoing relationship with the memory and legacy of the ancient Roman empire and this is the foundation for the Renaissance.`
      }] 
    },
    { id: "w4", 
      year: 1500, 
      period: "Renaissance", 
      time: "1400 - 1600 CE", 
      subRegions: [{ 
        name: "Modern Birth", 
        detail: `In part, the Renaissance was a rebirth of interest in ancient Greek and Roman culture. It was also a period of economic prosperity in Europe—particularly in Italy and in Northern Europe. In art history, we study both the Italian Renaissance and the Northern Renaissance. We talk about a way of looking at the world called Humanism, which—at its most basic—placed renewed value on human knowledge, and the experience of this world (as opposed to focusing largely on the heavenly realm), using ancient Greek and Roman literature and art as a model.
        There are only a handful of moments in history that we can point to that changed everything. The invention and adoption of the printing press was certainly one. As a result of the wider availability of books, literacy rates in Europe dramatically increased. Readers were empowered and in many ways we can trace the origin of our own information revolution to 15th-century Germany and Gutenberg’s first printing press.
        In 1517 a German theologian and monk, Martin Luther, challenged the authority of the Pope and sparked the Protestant Reformation. His ideas spread quickly, thanks in part to the printing press. By challenging the power of the Church, and asserting the authority of individual conscience (it was increasingly possible for people to read the bible in the language that they spoke), the Reformation laid the foundation for the value that modern culture places on the individual.
        It is also during this period that the Scientific Revolution began and observation replaced religious doctrine as the source of our understanding of the universe and our place in it. Copernicus up-ended the ancient Greek model of the heavens by suggesting that the sun was at the center of the solar system and that the planets orbited in circles around it. However, there were still problems with getting this theory to match observation. At the beginning of the 17th century, Kepler theorized (correctly!) that the planets moved in elliptical orbits (not circular ones) and that the speed of the orbits varied according to the planets’ distance from the sun. So much for the ideal geometries of the Greeks!`
      }] 
    },
    { id: "w5", 
      year: 1700,
      period: "Early Modern", 
      time: "1600 - 1800 CE", 
      subRegions: [{ 
        name: "Modern Birth", 
        detail: `It might seem strange to date the beginning of the "modern era" to so long ago, but in many ways it was the scientific, political and economic revolutions of the 17th and 18th centuries that have most shaped our own society.
        Art historians study the Baroque style of the 17th century. This was a time of extended and often violent conflict between Catholics and Protestants made all the more complex because of the growing power of Europe’s great monarchies. It was a time when nations grew in size, wealth and autonomy and when national boundaries were hardened, prefiguring the countries we know today (France, Spain and England for example). This was also a period of colonization, when European powers divided and exploited the world’s natural resources and people for their own benefit (think especially of the African slave trade, or the subjugation and forced conversion of the indigenous peoples of the Americas).
        The 1700s is often called the Enlightenment. In many ways, it furthers the interest in the individual seen in the Italian Renaissance and more widely during the Protestant Reformation. Thinkers such as Rousseau, Voltaire and Diderot asserted our ability to reason for ourselves instead of relying on the teachings of established institutions, such as the Church. In art history we study the Rococo and Neoclassical styles.
        The American and French Revolutions date to this period. The emerging middle classes (and later the working-classes) began a centuries-long campaign to gain political power, challenging the control of the aristocracy and monarchy. Successive reform movements (in this period and the 19th century) and revolutions gradually extended the franchise (the right to vote). Previously suffrage had been limited to males who owned land or who paid a certain amount in taxes. It was only in the second half of the 19th and the 20th centuries that universal suffrage became the norm in Europe and North America.`
      }] 
    },
    { id: "w6", 
      year: 1800, 
      period: "Modern", 
      time: "1800 CE", 
      subRegions: [{ 
        name: "Modern Birth", 
        detail: `Capitalism became the dominant economic system during this period (though it had its roots in the Renaissance). Individuals risked capital to produce goods in a currency-based market which depended on inexpensive, waged labor. Labor eventually organized into unions (latter-day guilds) and in this way, asserted considerable influence. More broadly shared political power was bolstered by overall increases in the standard of living and the first experiments in public education.
        Steam-powered machines and unskilled laborers in factories began to replace skilled artisans. London, Paris, and New York led the unprecedented population growth of cities during this period, as people moved from the countryside or emigrated to find a higher standard of living.
        The 20th Century was the most violent in history. It included two world wars, the Cold War, the dismantling of colonialism and the invention of the Totalitarian state. Dictators (Mussolini, Hitler, Stalin, Idi Amin, Pol Pot, the successive leaders of North Korea, etc.) imposed extreme political systems that caused mass starvation, mass dislocations and genocide. At the same time, the 20th Century was marked by the struggle for human rights and the rise of global capitalism.
        Where artists had previously worked under the instructions of wealthy patrons associated with the church or state, in this period, art became part of the market economy, and art itself came to be seen as personal self-expression. The high value placed on the individual, which emerged in ancient Greece and Rome and then again in the Renaissance, became the primary value of Western culture. Where artistic styles (for example, Baroque) had once covered numerous artists working over broad regions and periods of time, in the late Nineteenth and through the 20th Century, successive styles of art change with increasing speed and fracture into a kaleidoscope of individual artistic practices.` 
      }] 
    }
  ],
  asia: [
    { id: "a1", 
      year: -3200, 
      period: "Prehistoric", 
      time: "Before c. 2500 B.C.E.", 
      summary: "The term 'prehistoric' refers to the time before written history...",
      regions: [
        { 
          pos: 'west', 
          title: 'WEST ASIA (Mesopotamia)', 
          detail: `In Mesopotamia (present-day Iraq), as early as 8000 B.C.E., sedentary agricultural communities are established. 
          
Writing — newly invented — provides invaluable information about city-states, rulers, and their reigns. Invented by the Sumerians, the cuneiform system is the earliest writing we know.` 
        },
        { 
          pos: 'east', 
          title: 'EAST ASIA (China)', 
          detail: `In China, writing is first seen as inscriptions on oracle bones, a hallmark of the Shang dynasty (1700-1027 B.C.E.). 
          
China had already developed a rich culture ranging from pottery and clay figurines to carved jade and bronze ritual vessels.` 
        }
        // 注意：这里没有 North 和 South，系统会自动只渲染两个弹窗
      ]
    },
    { id: "a2", 
      year: 100, 
      period: "Ancient", 
      time: "2500 BCE - 650 CE", 
      summary: "The ancient world is often thought of as a cradle of today’s civilizations...",
      regions: [
        {
          pos: 'west',
          title: 'CENTRAL & WEST ASIA (Persia & Hellenism)',
          detail: `The first of these empires is that of Cyrus the Great (6th century B.C.E.). 
          
Later, Alexander the Great's presence brought Hellenism—a synthesis of Greek naturalism and idealism—to local centers.`
        },
        {
          pos: 'south',
          title: 'SOUTH ASIA (Gandhara & Buddhism)',
          detail: `In Gandhara, a compelling fusion was at work in devotional images of Buddhas. 
          
The Gupta empire (319 to 543 C.E.) saw the creation of 'ideal' images of the Buddha, which spread along the Silk Road.`
        }
      ]
    },
    { id: "a3", 
      year: 1100, 
      period: "Middle Ages", 
      time: "650 - 1500 CE", 
      regions: [
      {
        pos: 'west',
        title: 'Central & West Asia (Islamic Empire)',
        detail: `The formation of the Islamic empire (starting c. 634 C.E.) became a major catalyst for art. 
        
The Great Mosque of Damascus is a striking example, built on a site holy to many regimes. Its prayer hall was modeled on Christian basilicas, while its walls were adorned with opulent Byzantine-style mosaics.`
      },
      {
        pos: 'east',
        title: 'East Asia (Tang & Yuan Dynasties)',
        detail: `The Tang Dynasty marked a 'Golden Age' of poetry and painting. 

Later, the Mongol-led Yuan Dynasty (Kublai Khan) saw the rise of the 'Four Masters' of ink painting, like Ni Zan and Wang Meng, who redefined individual expression in landscape art.`
      },
      {
        pos: 'southeast',
        title: 'Southeast Asia (Khmer Empire)',
        detail: `The Hindu-Buddhist Angkor empire reached its zenith in the 12th century. 
        
They constructed Angkor Wat, one of the world's largest religious monuments. Originally dedicated to Vishnu, it later became a Buddhist temple, reflecting the creative tension of a multicultural empire.`
      },
      {
        pos: 'north',
        title: 'Central & North Asia (Mongol Empire)',
        detail: `Founded by Genghis Khan, the Mongol Empire (1206–1405) controlled much of Eurasia. 
        
This 'Pax Mongolica' allowed the transcontinental dissemination of technologies like movable type printing and facilitated unprecedented cultural exchange along the Silk Road.`
      }
    ]
    },
    { id: "a4", 
      year: 1675, 
      period: "Early Modern", 
      time: "1500 - 1850 CE", 
      regions: [
      {
        pos: 'west',
        title: 'West Asia (Safavid Persia)',
        detail: `The Safavids used 'self-fashioning' to strengthen their rule. 
        
Shah Abbas's 'porcelain diplomacy' is legendary: he donated over 1,000 Chinese Ming blue-and-white porcelain objects to the Ardabil Shrine to signal his cosmopolitan power and world-stage presence.`
      },
      {
        pos: 'east',
        title: 'East Asia (Qing China & Edo Japan)',
        detail: `In China, the Qing Dynasty strategic emphasized multiculturalism. 

In Japan, the Tokugawa Shogunate in Edo fostered a vibrant urban culture. This led to 'genre paintings' (rakuchū rakugai zu), capturing daily life and seasonal festivals in spectacular detail.`
      }
    ]
    },
    { id: "a5", 
      year: 1850, 
      period: "Modern", 
      time: "after c. 1850 CE", 
      regions: [
      {
        pos: 'north',
        title: 'Central & North Asia (Soviet Influence)',
        detail: `Soviet control altered local expression significantly. 
        
Mosques were closed, and traditional scripts were replaced. Modernist design and bold typography were used aggressively in posters as tools for propaganda and rewriting history.`
      },
      {
        pos: 'south',
        title: 'South & Southeast Asia (Colonization)',
        detail: `Colonization by France, Britain, and the Netherlands eroded local traditions but also led to 'Swadeshi' movements. 

Artists like Abanindranath Tagore (Bengal School) encouraged a non-Western Indian art, paralleling the 'Nihonga' movement in Japan.`
      }
    ]
    }
  ]
};

const getPos = (y) => {
  // 定义一个“转折点”，比如公元 1000 年
  const pivotYear = 1500;
  // 基础偏移量（起始点）
  const startX = 0;
  
  if (y <= pivotYear) {
    // 公元 1000 年之前：时间跨度大，间距压缩
    // 映射范围：-4000 到 1500 -> 占据总宽度的 40%
    return ((y - START) / (pivotYear - START)) * (TOTAL_WIDTH * 0.4);
  } else {
    // 公元 1500 年之后：时间跨度短，间距拉大（膨胀）
    // 映射范围：1500 到 2500 -> 占据总宽度的 60%
    const beforePivotWidth = TOTAL_WIDTH * 0.4;
    const afterPivotRatio = (y - pivotYear) / (END - pivotYear);
    return beforePivotWidth + afterPivotRatio * (TOTAL_WIDTH * 0.6);
  }
};
const handleScroll = (e) => { currentScroll.value = e.target.scrollLeft; };

// --- 手势识别核心逻辑 ---
let lastHandX = null;

const getHandState = (landmarks) => {
  const isIndexOut = landmarks[8].y < landmarks[5].y - 0.08;
  const isMiddleOut = landmarks[12].y < landmarks[9].y - 0.08;
  const isRingOut = landmarks[16].y < landmarks[13].y - 0.08;
  const isPinkyOut = landmarks[20].y < landmarks[17].y - 0.08;

  return {
    isFist: !isIndexOut && !isMiddleOut && !isRingOut && !isPinkyOut,
    isOnlyIndex: isIndexOut && !isMiddleOut && !isRingOut && !isPinkyOut,
    isFullPalm: isIndexOut && isMiddleOut && isRingOut && isPinkyOut,
    palmX: landmarks[9].x // 以中指根作为手的水平中心
  };
};

const findCenterNode = (handY) => { // 传入当前手的 Y 坐标
  const centerX = currentScroll.value + window.innerWidth / 2;
  const viewportY = window.innerHeight / 2;
  
  let closest = null;
  let minDist = Infinity;

  [...historyData.west, ...historyData.asia].forEach(item => {
    const xPos = getPos(item.year);
    const dx = Math.abs(xPos - centerX);
    
    // 关键：计算 Y 轴偏好
    // 如果手部位置偏上，给 west 轨道的节点增加权重；偏下则给 asia 轨道增加权重
    const isWest = historyData.west.includes(item);
    const handBias = handY < 0.5 ? (isWest ? 0 : 100) : (isWest ? 100 : 0);

    const totalDist = dx + handBias; 

    if (totalDist < minDist) {
      minDist = totalDist;
      closest = item;
    }
  });

  if (minDist < 500) selectedNode.value = closest;
};

const isNodeInCenter = (item) => {
  return Math.abs(getPos(item.year) - (currentScroll.value + window.innerWidth / 2)) < 80;
};

onMounted(() => {
  const hands = new window.Hands({
    locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`,
  });

  hands.setOptions({ maxNumHands: 1, modelComplexity: 1, minDetectionConfidence: 0.75 });

  hands.onResults((results) => {
    if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
      const landmarks = results.multiHandLandmarks[0];
      const state = getHandState(landmarks);
      const x = landmarks[8].x;

      // --- 1. 横向挥手退出逻辑 (Swipe to Dismiss) ---
      handXHistory.value.push(state.palmX);
      if (handXHistory.value.length > 6) handXHistory.value.shift();

      if (state.isFullPalm && handXHistory.value.length === 6 && selectedNode.value) {
        const deltaX = handXHistory.value[5] - handXHistory.value[0];
        // 绝对值大于 0.1 代表快速横移
        if (Math.abs(deltaX) > 0.1) {
          selectedNode.value = null;
          handXHistory.value = [];
          return;
        }
      }

      // --- 2. 握拳选取逻辑 ---
      if (state.isFist) {
        isCurrentlyFist.value = true;
        isPanning.value = false;
      } else {
        if (isCurrentlyFist.value) {
          // 只有平稳释放才打开弹窗 (防止挥手时误触发)
          const isQuickMove = handXHistory.value.length === 6 && Math.abs(handXHistory.value[5] - handXHistory.value[0]) > 0.05;
          if (!isQuickMove) findCenterNode();
        }
        isCurrentlyFist.value = false;
        isPanning.value = state.isOnlyIndex;
      }

      // --- 3. 食指滑动逻辑 ---
      if (state.isOnlyIndex && lastHandX !== null) {
        const dx = (x - lastHandX) * 4800;
        if (viewportRef.value) viewportRef.value.scrollLeft += dx;
      }

      lastHandX = x;
    } else {
      lastHandX = null;
      handXHistory.value = [];
      isPanning.value = false;
    }
  });

  const camera = new window.Camera(videoElement.value, {
    onFrame: async () => { await hands.send({ image: videoElement.value }); },
    width: 640, height: 480
  });
  camera.start();
});

// --- 视觉样式计算 (平滑拱形) ---
const getDynamicStyle = (year) => {
  const x = getPos(year);
  const vw = window.innerWidth;
  const offset = (x - (currentScroll.value + vw / 2)) / (vw * 1.2);
  const absO = Math.abs(offset);
  const arcY = Math.pow(offset, 2) * 200;
  const scale = 1.3 - absO * 0.7;

  return {
    left: `${x}px`,
    transform: `translateY(${arcY}px) translateZ(${-absO * 700}px) scale(${Math.max(0.6, scale)}) rotateY(${offset * -35}deg)`,
    opacity: 1 - absO * 0.6,
    zIndex: Math.round(scale * 100)
  };
};

const getAxisItemStyle = (x, isTag = false) => {
  const vw = window.innerWidth;
  const offset = (x - (currentScroll.value + vw / 2)) / (vw * 1.2);
  return {
    left: `${x}px`,
    transform: `translateY(${Math.pow(offset, 2) * 200}px) translateZ(${-Math.abs(offset) * 700}px)`,
    opacity: isTag ? (1 - Math.abs(offset) * 0.8) : 0.3
  };
};
</script>

<style>
body { margin: 0; background: #000; color: #fff; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; overflow: hidden; }
.universe { height: 100vh; width: 100vw; background: radial-gradient(circle at 50% 20%, #1a1a1a 0%, #000 80%); }

/* 状态提示浮层 */
.gesture-status {
  position: fixed; top: 80px; left: 50%; transform: translateX(-50%);
  padding: 12px 30px; border-radius: 40px; background: rgba(255,255,255,0.05);
  font-size: 0.9rem; transition: all 0.4s cubic-bezier(0.19, 1, 0.22, 1); 
  z-index: 9999; border: 1px solid rgba(255,255,255,0.1); backdrop-filter: blur(10px);
}
.gesture-status.is-fist { background: #00ffcc; color: #000; box-shadow: 0 0 30px rgba(0,255,204,0.4); border-color: transparent; }
.gesture-status.is-panning { background: #fff; color: #000; box-shadow: 0 0 20px rgba(255,255,255,0.3); }
.gesture-status.is-exit { border-color: #00ffcc; color: #00ffcc; box-shadow: inset 0 0 10px rgba(0,255,204,0.2); }

.main-title { position: absolute; top: 3vh; width: 100%; text-align: center; font-size: 1rem; letter-spacing: 1.2rem; opacity: 0.3; }

/* 滚动容器 */
.view-viewport { 
  width: 100vw; height: 100vh; overflow-x: auto; overflow-y: hidden; 
  perspective: 2000px; perspective-origin: 50% 35%;
  display: flex; align-items: center; 
}
.view-viewport::-webkit-scrollbar { display: none; }
.scrolling-content { position: relative; width: 8000px; height: 100%; transform-style: preserve-3d; }

/* 轴线 */
.horizontal-axis { position: absolute; top: 40%; width: 100%; transform-style: preserve-3d; }
.axis-dot { position: absolute; width: 4px; height: 4px; background: #fff; border-radius: 50%; box-shadow: 0 0 8px #fff; }
.marker-tag { position: absolute; top: 45px; transform: translateX(-50%); font-weight: 900; }

/* 轨道 */
.content-lane { position: absolute; width: 100%; left: 0; top: 40%; transform-style: preserve-3d; transition: opacity 0.6s, filter 0.6s; }
.west-lane { transform: translateY(-130px); }
.asia-lane { transform: translateY(130px); }

.history-node { position: absolute; display: flex; flex-direction: column; align-items: center; transform-style: preserve-3d; }
.node-text { display: flex; flex-direction: column; align-items: center; margin-bottom: 15px; }
.node-name { font-size: 1.7rem; font-weight: 900; display: block; white-space: nowrap; transition: color 0.3s; }
.node-time { font-size: 0.8rem; color: #666; margin-top: 4px; }

/* 交互高亮 */
.is-highlight .core-dot { transform: scale(2.5); background: #00ffcc; box-shadow: 0 0 30px #00ffcc; }
.is-highlight .node-name { color: #00ffcc; }

.core-dot { width: 8px; height: 8px; background: #fff; border-radius: 50%; border: 2px solid #000; transition: all 0.4s ease; }
.vertical-stem { width: 1px; height: 50px; background: linear-gradient(to top, #fff, transparent); opacity: 0.2; }

/* 详情弹窗与动画 */
/* 1. 详情弹窗容器：确保它在 3D 空间中足够靠前且不被遮挡 */
.detail-pop {
  position: absolute;
  z-index: 5000;
  width: 500px; /* 稍微加宽一点，长文本阅读更舒适 */
  pointer-events: auto; /* 关键：允许鼠标或手势在卡片上操作 */
}
/* 容器支持并排 */
.parallel-container {
  display: flex;
  gap: 20px;
  justify-content: center;
  align-items: flex-start;
  width: 1200px; /* 增加容器宽度，容纳多个卡片 */
  transform: translateX(-50%); /* 配合 left: 50% 居中 */
  position: absolute;
  left: 50%;
}
.parallel-container .info-card {
  width: 200px; /* 缩小单卡宽度 */
  flex-shrink: 0;
  max-height: 40vh; /* 稍微长一点 */
}
.reg-tag {
  font-size: 0.7rem;
  color: #00ffcc;
  margin-bottom: 10px;
  opacity: 0.8;
  letter-spacing: 1px;
}
.west-lane .detail-pop { top: 110%; left: 50%; transform: translateX(-50%) translateZ(400px); }
.asia-lane .detail-pop { bottom: 300%; left: 50%; transform: translateX(-50%) translateZ(400px); }
.info-card {
  background: rgba(15, 15, 15, 0.95); /* 加深背景色，增强对比度 */
  backdrop-filter: blur(25px);
  border: 1px solid rgba(255, 255, 255, 0.15);
  padding: 30px;
  border-radius: 24px;
  box-shadow: 0 50px 100px rgba(0, 0, 0, 0.8);
  
  /* 核心改动：限制高度并允许纵向滚动 */
  max-height: 10vh; /* 最大高度为屏幕高度的 60% */
  overflow-y: auto;  /* 内容超出时显示滚动条 */
  scrollbar-width: thin; /* Firefox 滚动条美化 */
  scrollbar-color: #00ffcc transparent;
}
/* 3. 为 Chrome/Safari/Edge 自定义极简滚动条 */
.info-card::-webkit-scrollbar {
  width: 6px;
}
.info-card::-webkit-scrollbar-track {
  background: transparent;
}
.info-card::-webkit-scrollbar-thumb {
  background: #00ffcc;
  border-radius: 10px;
  box-shadow: 0 0 10px #00ffcc;
}

/* 4. 优化卡片内文字排版 */
.info-card h4 {
  color: #00ffcc;
  margin-top: 0;
  font-size: 1.4rem;
  letter-spacing: 2px;
}
.info-card p {
  color: #ddd;
  line-height: 1.8; /* 增加行高，提升长文阅读体验 */
  font-size: 1rem;
}

/* Transition 动画 */
.pop-enter-active, .pop-leave-active { transition: all 0.6s cubic-bezier(0.19, 1, 0.22, 1); }
.pop-enter-from { opacity: 0; transform: translateX(-50%) translateZ(-300px) scale(0.6); }
.pop-leave-to { opacity: 0; transform: translateX(100%) rotate(15deg) scale(0.8); } /* 向侧面甩出的动效 */

.is-focus .content-lane { opacity: 0.1; filter: blur(12px); }
.is-focus .content-lane:has(.detail-pop) { opacity: 1; filter: blur(0); }

.clear-btn { position: fixed; bottom: 50px; left: 50%; transform: translateX(-50%); background: #fff; color: #000; border: none; padding: 12px 40px; border-radius: 50px; font-weight: bold; cursor: pointer; z-index: 9999; }
/* 固定标签容器 */
.fixed-lane-labels {
  position: absolute;
  left: 40px; /* 距离左侧距离 */
  top: 0;
  height: 100vh;
  display: flex;
  flex-direction: column;
  justify-content: center;
  z-index: 1000;
  pointer-events: none; /* 不挡住手势和点击 */
  perspective: 1000px;
}

.lane-label {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  transition: all 0.5s ease;
}

/* 契合弯曲美感：上方的西欧标签向下倾斜，下方的亚洲标签向上倾斜 */
.label-west {
  margin-bottom: 240px; /* 对应西欧轨道的高度 */
  transform: rotateY(25deg) rotateX(-10deg);
}

.label-asia {
  transform: rotateY(25deg) rotateX(10deg);
}

.label-en {
  font-size: 0.8rem;
  font-weight: 900;
  letter-spacing: 4px;
  color: rgba(0, 255, 204, 0.6); /* 淡淡的青色 */
  text-shadow: 0 0 15px rgba(0, 255, 204, 0.3);
}

/* 文字下方的装饰细线 */
.label-decoration {
  width: 40px;
  height: 2px;
  background: linear-gradient(to right, #00ffcc, transparent);
  margin-top: 8px;
  box-shadow: 0 0 10px #00ffcc;
}

/* 选中的时候（is-focus）标签稍微淡出，让位给弹窗 */
.is-focus ~ .fixed-lane-labels {
  opacity: 0.2;
}
</style>