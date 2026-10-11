export type GreetingLine = { from: string; text: string }

type CharacterId = 'anon' | 'tomori' | 'rana' | 'soyo' | 'taki'

// The reference widget has character-specific quotes and motion mappings, but
// no structured two-person welcome scenes. These original lines are inspired
// by the characters' established temperaments rather than copied dialogue.
const soloGreetings: Record<CharacterId, readonly string[]> = {
  tomori: [
    '你来了……我刚刚听见雨停的声音。要不要一起把今天的心情，慢慢放下来？',
    '欢迎回来。我把想说的话收进了一首小小的诗里……你愿意听吗？',
  ],
  anon: [
    '欢迎回来！我今天也有认真打扮哦——不过，最重要的是你来了！',
    '嗨，终于等到你啦。今天的烦恼先放一边，我们从轻松的话题开始吧？',
  ],
  rana: [
    '来了？正好。抹茶芭菲和这里，你先选一个。',
    '我刚发现一个有趣的东西……嗯，就是你回来这件事。',
  ],
  soyo: [
    '欢迎回来。看起来今天也辛苦了，先坐下歇一会儿吧。',
    '你来了呀。要喝点什么吗？不用急着说话，我会陪着你的。',
  ],
  taki: [
    '回来了？先把东西放下。今天的事，想说多少都随你。',
    '……等你很久倒没有。只是刚好有空。有什么烦心事就说吧。',
  ],
}

const pairGreetings: Record<string, readonly (readonly GreetingLine[])[]> = {
  'anon:tomori': [
    [
      { from: 'tomori', text: '爱音，刚才路灯亮起来的时候，我觉得像有人把星星放到了街上。' },
      { from: 'anon', text: '灯又发现了只有你才会注意到的风景呢。那我们就陪你一起看一会儿吧！' },
    ],
    [
      { from: 'anon', text: '灯灯，我准备了一个超自然的欢迎仪式！要不要一起倒数？' },
      { from: 'tomori', text: '三、二……啊，已经欢迎完了。可是和爱音一起等人的时间，也很开心。' },
    ],
  ],
  'anon:rana': [
    [
      { from: 'anon', text: '乐奈，你又在找抹茶芭菲吗？我知道一家新开的店哦！' },
      { from: 'rana', text: '带路。你负责找店，我负责判断好不好吃。' },
    ],
    [
      { from: 'rana', text: '有趣的女人，今天看起来很有精神。' },
      { from: 'anon', text: '当然啦！不过被乐奈这么直接地夸，还是有点不好意思嘛。' },
    ],
  ],
  'anon:soyo': [
    [
      { from: 'soyo', text: '爱音，欢迎回来。今天的发型很适合你，心情也有变好吗？' },
      { from: 'anon', text: '爽世世一眼就看出来了！有你这么温柔地问我，我当然会好一点呀。' },
    ],
    [
      { from: 'anon', text: '爽世世，今天也拜托你照顾大家啦！' },
      { from: 'soyo', text: '好呀。不过今天也让爱音来选话题吧，我想听你分享开心的事。' },
    ],
  ],
  'anon:taki': [
    [
      { from: 'taki', text: '爱音，练习的时候别光顾着拍照。手指还疼不疼？' },
      { from: 'anon', text: '立希是在关心我吧？放心，我有好好休息，也有好好练习哦！' },
    ],
    [
      { from: 'anon', text: '立希，欢迎词要不要说得温柔一点？比如“欢迎回来”之类的。' },
      { from: 'taki', text: '……欢迎回来。好了，别露出那种得逞的表情。' },
    ],
  ],
  'rana:tomori': [
    [
      { from: 'tomori', text: '乐奈，我捡到一块形状很像猫的石头……想给你看看。' },
      { from: 'rana', text: '像猫？那就收下。下次找到更像的，再拿来比较。' },
    ],
    [
      { from: 'rana', text: '灯，今天有带新的诗吗？' },
      { from: 'tomori', text: '有一首还没有写完……如果乐奈愿意听，我想边走边想。' },
    ],
  ],
  'soyo:tomori': [
    [
      { from: 'tomori', text: '爽世……你身上的香味，让人想到雨后的花。' },
      { from: 'soyo', text: '谢谢灯。那今天也慢慢来吧，不必急着找到答案。' },
    ],
    [
      { from: 'soyo', text: '灯，今天想把什么样的心情写下来呢？' },
      { from: 'tomori', text: '现在的话……是有人愿意等我把话说完的心情。' },
    ],
  ],
  'taki:tomori': [
    [
      { from: 'taki', text: '灯，今天不舒服的话就早点回去，练习可以改天再补。' },
      { from: 'tomori', text: '立希……谢谢你。知道有人会提醒我休息，我就安心了。' },
    ],
    [
      { from: 'tomori', text: '立希，我把刚才听到的节奏记下来了……想弹给你听。' },
      { from: 'taki', text: '那就弹吧。我会认真听的，哪里需要调整我也会告诉你。' },
    ],
  ],
  'rana:soyo': [
    [
      { from: 'rana', text: '爽世，今天的香味不错。像奶油，又不像。' },
      { from: 'soyo', text: '是新试的护手霜。喜欢的话，下次我带一支给你。' },
    ],
    [
      { from: 'soyo', text: '乐奈，等会儿要不要和我们一起吃点东西？' },
      { from: 'rana', text: '有抹茶就去。没有的话，再考虑。' },
    ],
  ],
  'rana:taki': [
    [
      { from: 'taki', text: '乐奈，练习前先把芭菲吃完，别放到融化了再抱怨。' },
      { from: 'rana', text: '融化的也好吃。立希要不要尝一口？' },
    ],
    [
      { from: 'rana', text: '立希，鼓点今天很稳。像猫走过屋顶。' },
      { from: 'taki', text: '这是什么比喻……算了，你觉得好听就行。' },
    ],
  ],
  'soyo:taki': [
    [
      { from: 'soyo', text: '立希，大家都到齐了。你也稍微放松一下吧。' },
      { from: 'taki', text: '我没紧张。只是想确认每个人都准备好了……谢谢。' },
    ],
    [
      { from: 'taki', text: '爽世，今天排练结束后你先走吧，不用每次都等最后一个。' },
      { from: 'soyo', text: '好呀。不过我想等大家都收拾好再走，这样比较放心。' },
    ],
  ],
}

function choose<T>(items: readonly T[], random: () => number): T {
  return items[Math.min(items.length - 1, Math.floor(random() * items.length))]
}

export function createGreetingSequence(participants: readonly string[], random = Math.random): GreetingLine[] {
  const cast = participants.slice(0, 2) as CharacterId[]
  if (!cast.length) return [{ from: 'anon', text: choose(soloGreetings.anon, random) }]
  if (cast.length === 1) return [{ from: cast[0], text: choose(soloGreetings[cast[0]], random) }]

  const [first, second] = cast
  const key = [first, second].sort().join(':')
  const exchange = choose(pairGreetings[key], random)
  return [
    { from: first, text: choose(soloGreetings[first], random) },
    { from: second, text: choose(soloGreetings[second], random) },
    ...exchange,
  ]
}
