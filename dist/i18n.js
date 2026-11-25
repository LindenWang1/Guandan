// Presentation-only localization. English remains the canonical UI copy and
// game/room data is never rewritten. Original text is retained per DOM node so
// switching languages preserves inputs, focus, selections and event handlers.

export const messages = {
  Scoreboard: "战绩榜",
  "Final Scoreboard": "最终战绩",
  "Match Winners": "比赛冠军",
  "Points Earned": "累计得分",
  "Net Points": "净积分",
  "Hands Won": "获胜局数",
  "Matches Won": "获胜场数",
  "First Finishes": "头游次数",
  "Player Results": "玩家战绩",
  "Player scoreboard": "玩家战绩表",
  Player: "玩家",
  "THE CLIMB IS COMPLETE": "登顶成功",
  "YOUR TABLE RECORD": "本桌战绩",
  "Both partners receive a hand win. First finishes count who emptied their hand first.":
    "获胜队伍的两位玩家各记一局胜利。头游次数指最先出完手牌的次数。",
  "Net points subtract the other team's earned points. Level promotion is unchanged.":
    "净积分为本队得分减去对手得分。升级规则不变。",
  "Table totals carry into Play Again. New Game or a new room starts a fresh record.":
    "再来一场会保留本桌累计战绩。新游戏或新房间将重新记录。",
  "Back to Table": "返回牌桌",
  "Play Again ↗": "再来一场 ↗",
  "Turn Timer": "出牌计时",
  "Time Per Turn": "每次出牌时限",
  "When Time Runs Out": "超时处理",
  "Auto-Pass": "自动不出",
  "Warn Only": "仅提醒",
  "Time Up": "已超时",
  Ready: "待开始",
  "Apply Timer": "应用计时设置",
  "Pause Timer": "暂停计时",
  "Resume Timer": "继续计时",
  "Restart Turn": "重新计时",
  "Invalid timer setting.": "计时设置无效。",
  "The turn timer expired. The table has been refreshed.":
    "出牌已超时，牌桌已刷新。",
  "Auto-pass skips your turn. On an empty table, the lowest single card is played instead.":
    "超时自动不出；如果需要领出，则自动打出最小的一张单牌。",
  "Only the host controls the online timer. Practice pauses while a menu is open or the tab is hidden.":
    "联机计时由房主控制。练习模式在打开菜单或切换到其他标签页时暂停计时。",
  "Changing the duration starts a fresh countdown. Online expiry is processed when a player checks the table.":
    "修改时限会重新开始倒计时。联机超时由玩家刷新牌桌时处理。",
  "Pause Timer pauses the countdown only; players can still play.":
    "暂停计时仅暂停倒计时，玩家仍可出牌。",
  "Current table play": "当前桌面出牌",
  Played: "出牌",
  Passes: "不出",
  "Cards on Table": "本轮出牌",
  "Played These Cards": "打出了这些牌",
  "To Play": "正在出牌",
  Passed: "已不出",
  Finished: "已出完",
  "Your cards and saved groups": "手牌与已分组牌",
  "Sound On": "音效开启",
  "Sound Off": "音效关闭",
  Volume: "音量",
  "Test Sound": "试听音效",
  "Short cues only. No background music.": "仅播放简短提示音，无背景音乐。",
  "Playing a sample turn cue.": "正在播放回合提示音。",
  "Audio is unavailable. Check your browser or device sound settings.":
    "音频不可用，请检查浏览器或设备的声音设置。",
  "Selected cards": "已选牌",
  "Selected · Tap to Remove": "已选牌 · 点击移除",
  Undo: "撤销",
  "Undo Selection": "撤销选牌",
  "Last Play": "上次出牌",
  "Tip: Shift-click to select a range. Undo changes only your selection.":
    "提示：按住 Shift 点击可选择连续的牌。撤销仅影响选牌。",

  Settings: "设置",
  "Table Settings": "牌桌设置",
  Practice: "练习",
  "AI Difficulty": "电脑难度",
  Beginner: "入门",
  Medium: "中等",
  Hard: "困难",
  Expert: "专家",
  "Beginner often plays a random legal move. Medium balances cards and teamwork. Hard also protects useful combinations. Expert plans its whole hand, tracks every card played, and saves bombs.":
    "入门模式经常随机出合法的牌；中等模式兼顾出牌和配合；困难模式还会保留有用的组合；专家模式会规划整手牌、记住所有已出的牌并保留炸弹。",
  "Applies to all three practice bots on their next turn.":
    "从下一回合起应用于三位练习电脑玩家。",
  "Sound & Appearance": "声音与外观",
  "Sound Effects": "音效",
  Off: "关闭",
  On: "开启",
  "Table Theme": "牌桌主题",
  Jade: "翡翠",
  Midnight: "午夜",
  Plum: "紫梅",
  "Card Backs": "卡背",
  Classic: "经典",
  Lattice: "格纹",
  Stars: "繁星",
  "Saved on this device. Your friends can choose their own look and sound.":
    "设置保存在此设备。好友可自行选择外观和音效。",
  "Nice Play": "好牌",
  Thanks: "谢谢",
  "Good Luck": "好运",
  Oops: "哎呀",
  SPECTATOR: "观战",
  Spectator: "观战者",
  "Stop Watching": "退出观战",
  "Waiting for the Players": "等待玩家",
  "You can watch the table without taking a seat.": "无需占座，即可观看牌局。",
  "All hands are private. Use Played Cards to review the action.":
    "所有手牌均保密。点击已出的牌查看记录。",
  "Spectating · All hands are private. Watch the table and Played Cards.":
    "观战中 · 所有手牌均保密，可查看牌桌及出牌记录。",
  "Watching live · All hands are private.": "实时观战 · 所有手牌均保密。",
  "Live Table": "实时牌桌",
  "Team A wins.": "甲队获胜。",
  "Team B wins.": "乙队获胜。",
  "Keep the Table Moving": "保持牌局进行",
  "Auto-Play Absent Seats": "离线座位自动出牌",
  "After 1 Minute": "1 分钟后",
  "After 2 Minutes": "2 分钟后",
  "After 5 Minutes": "5 分钟后",
  "Only the host can change this. Bots act while another player has the room open. Reconnecting returns control immediately. If the host is away, another player can deal the next hand.":
    "仅房主可修改。只要另一位玩家仍打开房间，电脑便可代打。重连后立即恢复控制。房主离线时，其他玩家可发下一局。",
  "Invite a Spectator": "邀请观战",
  "Share a read-only link. Spectators see plays and card counts, never private hands.":
    "分享只读链接。观战者只能看到出牌与剩余张数，不能看到手牌。",
  "Copy Spectator Link": "复制观战链接",
  "Spectator link copied.": "已复制观战链接。",
  "Room settings saved.": "房间设置已保存。",
  "Spectators can only watch.": "观战者只能观看。",
  "Spectator link is invalid or expired.": "观战链接无效或已过期。",
  "Only the host can change room settings.": "仅房主可修改房间设置。",
  "Choose an available timeout.": "请选择有效的等待时间。",
  "Reloading reconnects to this seat. An absent player keeps their seat and takes control again when they reconnect.":
    "刷新可重新连接此座位。离线玩家的座位会保留，重连后恢复控制。",

  "Your Turn": "轮到你了",
  "Deal a hand to begin.": "发牌后开始游戏。",
  Paused: "已暂停",
  "Resume when you are ready.": "准备好后点击继续。",
  "Return Tribute": "请还贡",
  "Select one card to return.": "请选择一张牌还贡。",
  "Hand Complete": "本局结束",
  "Review the result above.": "请查看上方的本局结果。",
  "You’re Out": "已出完牌",
  "Cheer on your partner.": "为搭档加油。",
  "Waiting for Your Turn": "等待你的回合",
  "You can organize your hand while you wait.": "等待时可以整理手牌。",
  "Select cards to play.": "请选择要出的牌。",
  "Choose a valid combination.": "请选择合法的牌型。",
  "Match Ended": "比赛结束",
  "Find a new table to play again.": "请选择新牌桌继续游戏。",
  Reconnecting: "正在重连",
  "Your seat is saved. Reconnect to continue.": "座位已保留，请重连后继续。",
  "Confirming Your Action…": "正在确认操作…",
  "Emotes are cooling down.": "表情冷却中，请稍候。",
  Emotes: "表情",
  "Choose an Expression": "选择表情",
  Happy: "开心",
  Angry: "生气",
  Surprised: "惊讶",
  Confused: "疑惑",
  "Choose an available emote.": "请选择可用的表情。",
  "Wait a moment before sending another emote.": "请稍等片刻再发送表情。",
  "Played Cards": "已出的牌",
  "Cards played this hand, newest first.": "本局已出的牌，最近出牌显示在前。",
  "Filter played cards": "筛选出牌记录",
  Everyone: "全部玩家",
  "No cards played yet.": "暂无出牌记录。",
  "Declared:": "声明：",
  Organize: "整理",
  Pause: "暂停",
  Resume: "继续",
  "Practice saved on this device.": "练习进度已保存在此设备。",
  "Practice paused. Resume when you are ready.": "练习已暂停，准备好后可继续。",
  "Practice · Session Only": "练习进度仅限本次会话",
  "Connection interrupted. Your seat is reserved.": "连接中断，座位已保留。",
  Reconnect: "重新连接",
  "Find a Table": "选择牌桌",
  "To Beat": "当前牌型",
  "Your Next Play": "下一次出牌",
  "Any Legal Combination": "任意合法牌型",
  Matches: "比赛场数",
  Wins: "获胜场数",
  "Current Win Streak": "当前连胜",
  "Reconnect before playing.": "请重新连接后再出牌。",
  "Preview selection": "所选手牌",
  "Your partner has the table.": "搭档占先。",
  "Practice saved. Continue from your last hand.": "已恢复上次练习进度。",
  "Room unavailable. Choose another table.": "房间不可用，请选择其他牌桌。",
  "Your last action could not be confirmed. Reconnecting…":
    "上次操作尚未确认，正在重连…",

  "Group Selected": "组合所选牌",
  "Release Group": "拆开组合",
  "Move Group Left": "组合左移",
  "Move Group Right": "组合右移",
  "Reset Groups": "重置分组",
  "Group As": "组合牌型",
  "Ungrouped Cards": "未分组手牌",
  "Grouped Cards": "已分组手牌",
  "Saved for later. Select a group name when you want to play it.":
    "组合已暂存。需要出牌时，点击组合名称即可选中。",
  "All your cards are grouped below.": "所有手牌均已移至下方分组区。",
  "Select a valid combination to group.": "请选择合法牌型进行分组。",
  "Select a valid combination to keep it together. Click a group name to select its cards.":
    "选择合法牌型后可分组保留，点击组合名称可选中整组牌。",
  GUANDAN: "掼蛋",
  "THE PARTNERSHIP TABLE": "四人同桌 · 搭档同行",
  "AI PRACTICE": "人机练习",
  "AI Practice": "人机练习",
  "ONLINE 2V2": "在线 2 对 2",
  "Online 2v2": "在线 2 对 2",
  "How to Play": "玩法说明",
  "New Game": "新游戏",
  "Game mode": "游戏模式",
  "You + 3 AI Players": "你与 3 位电脑玩家",
  "Room Details": "房间详情",
  "Your Team": "我方",
  "Your team": "我方",
  Opponents: "对方",
  You: "你",
  PARTNER: "搭档",
  "Your seat": "你的座位",
  "Your Hand": "你的手牌",
  "COUNTERCLOCKWISE ↺": "逆时针出牌 ↺",
  "Guandan card table": "掼蛋牌桌",
  Clear: "清除",
  Hint: "提示",
  Pass: "不出",
  "Play Cards": "出牌",
  "Return Card": "还贡",
  "Sending…": "发送中…",
  "Declare Combination": "选择牌型声明",
  "Close dialog": "关闭对话框",
  "Select cards · H for hint · P to pass": "选择手牌 · H 提示 · P 不出",
  "Select cards to make a combination": "选择手牌组成牌型",
  "These cards cannot beat the table. Try Hint.":
    "所选手牌无法压过当前牌型，请试试提示。",
  "Sort: Rank ⇅": "排序：点数 ⇅",
  "Sort: Suit ⇅": "排序：花色 ⇅",
  "Play the long game.": "默契配合，携手升级。",
  "Help your partner finish first.": "帮助搭档率先出完手牌。",
  "Hand History ↗": "出牌记录 ↗",
  "Around the Table": "牌局记录",
  "Your hand history begins after the deal.": "发牌后即可查看出牌记录。",
  "Your cards appear here after the deal.": "发牌后，你的手牌将在这里显示。",
  "Your cards will appear here after the deal.":
    "发牌后，你的手牌将在这里显示。",
  "You’re out. Cheer on your partner.": "你已出完手牌，为搭档加油！",
  "27 cards to begin": "起手 27 张",
  "108 Cards · 4 Players · 2 Teams": "108 张牌 · 4 位玩家 · 2 支队伍",
  "A good hand. A better partnership.": "好牌在手，默契在心。",
  "Climb together from 2 to Ace.": "从 2 到 A，携手闯关。",
  "Deal a Practice Hand ↗": "开始练习 ↗",
  "Deal the First Hand": "开始发牌",
  "Play with an AI partner, or choose Online 2v2 to invite friends.":
    "与电脑搭档练习，或选择在线 2 对 2 邀请好友。",
  "Take your seat. Your partner is across the table.":
    "请入座，你的搭档就在对面。",
  "The table is yours.": "轮到你领出。",
  "A fresh trick. Any legal combination.": "新一轮，可领出任意合法牌型。",
  "Your lead. Play any legal combination.": "你领出，请选择任意合法牌型。",
  "A little give and take.": "进贡还贡，有来有往。",
  "Select any one card to return.": "选择任意一张手牌还贡。",
  "Waiting for tribute returns.": "等待其他玩家还贡。",
  "Your hand is ready. Waiting for the other players to return tribute.":
    "手牌已就绪，等待其他玩家还贡。",
  "The highest tribute payer will lead.": "进贡牌较大的一方先出。",
  "ROOM CLOSED": "房间已关闭",
  "A player left the table.": "有玩家离开了牌桌。",
  "Create another room to play again.": "创建新房间，再来一局。",
  "Find a New Table": "创建新牌桌",
  "This match has ended. You can start a new room or practice.":
    "本场比赛已结束，可以创建新房间或进行练习。",
  "MATCH COMPLETE": "比赛结束",
  "HAND COMPLETE": "本局结束",
  "Your team wins.": "我方获胜！",
  "Opponents win.": "对方获胜。",
  "The climb to Ace is complete.": "成功打过 A，赢得比赛！",
  "Play Again": "再来一场",
  "Deal Next Hand": "发下一局",
  "Deal Next Hand ↗": "发下一局 ↗",
  JOKER: "王",
  "Waiting for the host to deal.": "等待房主发牌。",
  "The failed Ace team returns to level 2.": "打 A 失败的队伍降回 2。",
  "Failed Ace team returns to level 2.": "打 A 失败的队伍降回 2。",
  "Tribute resisted: losing side holds both Big Jokers.":
    "抗贡：进贡方持有两张大王。",
  "No legal response. Pass to continue.": "没有可压过的牌，请选择不出。",
  "Reconnecting… your seat is saved": "正在重连…座位已保留",
  "FOUR FRIENDS. TWO TEAMS.": "四位好友，两支队伍。",
  "Your table is waiting.": "好友入座，即刻开局。",
  "Share the code. Take a seat opposite your partner.":
    "分享房间码，与搭档相对而坐。",
  "ROOM CODE": "房间码",
  "Copy Invite Link": "复制邀请链接",
  "Open Seat": "空位",
  "Ready to play": "已准备",
  "Getting ready": "准备中",
  "Away · seat reserved": "暂时离线 · 座位已保留",
  "Invite a friend": "邀请好友",
  "Take Seat": "入座",
  "Add AI": "添加电脑",
  "Remove AI": "移除电脑",
  "Invite a friend or add an AI": "邀请好友或添加电脑",
  "AI Level for New Seats": "新电脑玩家难度",
  "Short on players? The host can fill any open seat with an AI.":
    "人数不够？房主可以让电脑玩家坐任意空位。",
  "Team A": "A 队",
  "Team B": "B 队",
  "Seats 1 & 3": "座位 1 和 3",
  "Seats 2 & 4": "座位 2 和 4",
  "Rooms expire after 24 hours without a game action.":
    "房间连续 24 小时无游戏操作后将失效。",
  "Leave Room": "离开房间",
  "Not Ready": "取消准备",
  "I’m Ready": "我准备好了",
  "Start Match": "开始比赛",
  "The host starts when everyone is ready.": "全部准备后，由房主开始比赛。",
  "Bring Your Table Together": "邀请好友同桌",
  "Four players, two teams. Create a room or enter a friend’s code. The host can fill open seats with AI.":
    "四位玩家，两支队伍。创建房间，或输入好友的房间码。房主可以让电脑玩家填补空位。",
  "Your Name": "你的昵称",
  "Name at the table": "牌桌昵称",
  "Room Code": "房间码",
  "(to join a friend)": "（加入好友房间）",
  "8-character code": "8 位房间码",
  "Create Room": "创建房间",
  "Join Room": "加入房间",
  "Your seat stays in this browser if you reload. A match starts when all four players are ready.":
    "刷新页面后，此浏览器会保留你的座位。四位玩家全部准备后即可开始。",
  "Enter the 8-character room code.": "请输入 8 位房间码。",
  "Connecting…": "正在连接…",
  "Share your room code with three friends.": "将房间码分享给三位好友。",
  "Your Online Table": "你的在线牌桌",
  "Your partner is": "你的搭档是",
  "the open seat opposite you": "对面的空位",
  ". Choose an open seat in the lobby to change teams.":
    "。可在大厅选择空位来更换队伍。",
  ". Seats stay fixed for this match.": "。比赛期间座位固定。",
  "Reloading reconnects to this seat. If someone loses connection, their turn waits for them.":
    "刷新即可重新连接到此座位。玩家掉线后，牌局会在其回合等待重连。",
  "The room expires after 24 hours without a game action. Explicitly leaving during a match closes it for everyone.":
    "房间连续 24 小时无游戏操作后将失效。比赛中主动离开会结束所有人的比赛。",
  "Leave this table?": "离开这张牌桌？",
  "Your seat will become available.": "你的座位将空出，其他玩家可以加入。",
  "Leaving ends this online match for everyone. You can close the browser instead and return to your seat later.":
    "主动离开将结束所有人的在线比赛。如需暂离，可关闭浏览器，稍后返回原座位。",
  "Leave & Practice": "离开并练习",
  "A Fresh Climb": "开启新一场",
  "Start a new practice match with both teams on level 2.":
    "开始新的练习赛，双方都从 2 开始。",
  "Levels for a 1st–2nd Finish": "双上（头游、二游）升级数",
  "+3 Levels": "升 3 级",
  "+4 Levels (Original Variant)": "升 4 级（原始变体）",
  "Deal a New Game": "开始新游戏",
  "Invite link copied. Send it to three friends.":
    "邀请链接已复制，分享给三位好友吧。",
  "Invite Your Friends": "邀请好友",
  "Copy this link:": "复制此链接：",
  "Room invite link": "房间邀请链接",
  "Room code:": "房间码：",
  "The art of playing together": "掼蛋玩法与搭档配合",
  "The player opposite you is your partner. Play runs counterclockwise: you → right → partner → left. In AI Practice, Jade is your partner. Online 2v2 has two fixed teams; the host can fill open seats with AI players.":
    "对面的玩家是你的搭档。按逆时针顺序出牌：你 → 右手边 → 搭档 → 左手边。人机练习中，Jade 是你的搭档；在线 2 对 2 分为两支固定队伍，房主可以让电脑玩家填补空位。",
  "The Turn": "出牌顺序",
  "Select cards, then choose": "选好手牌后，点击",
  ". Beat the current combination with the same type, play a bomb, or pass. Three consecutive passes clear the table. The last player leads again; if they have finished, their partner leads.":
    "。可出同牌型的更大牌、出炸弹，或选择不出。连续三次不出后，本轮结束，由最后出牌者领出；若其已出完手牌，则由搭档接风领出。",
  "Seven Ordinary Combinations": "七种普通牌型",
  "Single / Pair / Triple": "单张 / 对子 / 三张",
  "1 / 2 / 3 cards of one rank": "同点数的 1 / 2 / 3 张牌",
  "Full House": "三带二",
  "A triple + a different-rank pair": "三张同点数牌 + 另一点数的对子",
  Straight: "顺子",
  "5 consecutive ranks": "五张点数连续的牌",
  Tube: "连对",
  "3 consecutive pairs": "三个连续的对子",
  Plate: "钢板",
  "2 consecutive triples": "两个连续的三张",
  "Singles, pairs, triples, full houses, and equal-sized rank bombs use level order: Big Joker > Small Joker > Level Rank > A … 2. Only two Small Jokers or two Big Jokers form a pair. A full house is ranked by its triple.":
    "单张、对子、三张、三带二及同张数的点数炸弹按级牌顺序比较：大王 > 小王 > 级牌 > A … 2。只有两张小王或两张大王能组成对子。三带二只比较三张的点数。",
  "Runs always use natural order. A can be low or high, never wrap: A2345 and 10JQKA are valid; QKA23 is not. Lowest tube: AA2233. Lowest plate: AAA222.":
    "顺子、连对和钢板始终按自然点数顺序排列。A 可作最小或最大，但不能绕接：A2345 和 10JQKA 合法，QKA23 不合法。最小连对是 AA2233，最小钢板是 AAA222。",
  "Wild Hearts": "红桃级牌（逢人配）",
  "Both heart cards of the Level Rank are wild. They can represent any card except a joker. A single wild or a pair of wilds stays at the Level Rank. When multiple declarations are possible, use the combination menu before playing. The declared substitutions appear on the table.":
    "两张红桃级牌可代替除大小王以外的任意牌。单独出一张或两张红桃级牌时，仍按级牌比较。存在多种组合方式时，请在出牌前通过牌型菜单选择声明；替代结果会显示在牌桌上。",
  "Bombs, from Low to High": "炸弹大小（从小到大）",
  "4 of a kind → 5 of a kind → 5-card straight flush → 6 → 7 → 8 → 9 → 10 of a kind → all four jokers. Higher bombs beat lower bombs. Within one size, compare ranks; straight flushes compare top cards, regardless of suit.":
    "四张炸弹 → 五张炸弹 → 五张同花顺 → 六张 → 七张 → 八张 → 九张 → 十张炸弹 → 天王炸。高等级炸弹可压低等级炸弹。同张数炸弹比较点数；同花顺比较最大牌点数，不比较花色。",
  "The Climb to Ace": "升级与打 A",
  "Only the winning team advances and becomes the Level Team. Finishing":
    "只有获胜队伍升级，并成为下一局打级方。名次为",
  ". Promotions stop at Ace. Win as the Level Team on Ace with 1–2 or 1–3 to win the match.":
    "。最高升到 A。打 A 的队伍以头游、二游或头游、三游获胜，即赢得整场比赛。",
  "A 1–4 result at Ace is a failed attempt. Three failed Ace attempts, even across separate visits to Ace, reset that team to 2. Losing at Ace when the opponent’s final play is entirely declared aces also resets the Level Team to 2. Challengers must become the Level Team before they can win the match.":
    "打 A 时，头游、末游算闯关失败。累计三次打 A 失败（不要求连续）则降回 2。打 A 的队伍输掉本局，且对方最后一手全部声明为 A 时，也降回 2。挑战方必须先成为打级方，才有资格赢得整场比赛。",
  Tribute: "进贡与还贡",
  "After a 1–2 finish, both losers pay their highest non-wild cards. First place receives the higher one. Otherwise, only last place pays first place. Winners return any card. Each person chooses their own return; AI players choose automatically.":
    "双上后，两位输家各进贡自己最大的非逢人配牌，头游收较大的贡牌。其他结果由末游向头游进贡。赢家可还任意一张牌；真人自行选择还贡牌，电脑玩家自动选择。",
  "Both Big Jokers among the two paying losers cancel double tribute. For single tribute, the payer must hold both. The higher or sole tribute payer leads. Without tribute, the previous winner leads.":
    "双贡时，两位进贡者合计持有两张大王即可抗贡；单贡时，进贡者须独持两张大王才能抗贡。贡牌较大者或唯一进贡者先出；抗贡后，由上一局头游先出。",
  "Table Conventions": "本桌约定",
  "Equal tribute cards are ordered counterclockwise from the previous winner; the first payer leads. The first hand’s opening player is random, equivalent to drawing the turned-up card. Shuffling and drawing are automatic. A hand ends as soon as one partnership is out.":
    "贡牌相同时，从上一局头游起按逆时针顺序确定进贡顺序，排在前面的进贡者先出。首局随机决定先出者，相当于抽到明牌。洗牌和摸牌自动完成；一队两人都出完手牌时，本局结束。",
  "AI Pace": "电脑出牌速度",
  Relaxed: "悠闲",
  Quick: "快速",
  Learning: "学习",
  "AI players favor longer combinations, protect their partner’s lead, and conserve bombs. Every level sees only its own cards, the card counts, and the cards already played.":
    "电脑玩家会优先出较长的牌型、保护搭档的领出权并节省炸弹。每个难度都只能看到自己的手牌、公开的剩余牌数和已经出过的牌。",
  "Finish this hand first.": "请先完成本局。",
  "No tribute to return.": "当前无需还贡。",
  "You have no tribute to return.": "你无需还贡。",
  "Select one card from your hand.": "请从手牌中选择一张。",
  "It is not your turn.": "还没轮到你出牌。",
  "A card cannot be used twice.": "同一张牌不能重复使用。",
  "Choose cards from your hand.": "请选择自己的手牌。",
  "That combination cannot beat the table.": "该牌型无法压过当前出牌。",
  "Lead a combination; you cannot pass on an empty table.":
    "请领出一组牌，空桌时不能选择不出。",
  "Allow browser storage to keep your seat when reconnecting.":
    "请允许浏览器存储，以便重连时保留座位。",
  "Online rooms are unavailable on this preview. Please try the published website.":
    "此预览不支持在线房间，请使用已发布的网站。",
  "Unable to reach the room.": "无法连接房间。",
  "Your previous action is still being confirmed.": "上一次操作仍在确认中。",
  "Use a name between 1 and 18 characters.": "昵称须为 1 至 18 个字符。",
  "This request must come from the game website.": "请从游戏网站发起操作。",
  "Online rooms are temporarily unavailable. Practice mode is still available.":
    "在线房间暂不可用，仍可进行人机练习。",
  "Room not found.": "未找到房间。",
  "Your seat could not be verified. Rejoin the room.":
    "无法验证座位，请重新加入房间。",
  "Send a JSON request.": "请求格式不正确。",
  "Request is too large.": "请求内容过大。",
  "Invalid request.": "无效请求。",
  "Method not allowed.": "不支持此操作。",
  "Choose Create Room to begin.": "请选择“创建房间”开始。",
  "Invalid room code.": "房间码无效。",
  "Invalid promotion setting.": "升级设置无效。",
  "That room code was just taken. Please create another room.":
    "此房间码刚被占用，请创建另一个房间。",
  "That room code was just taken. Please try again.":
    "此房间码刚被占用，请重试。",
  "This room has expired or does not exist. Check the code or create a new room.":
    "房间已失效或不存在，请核对房间码或创建新房间。",
  "This browser does not have a seat in that room.": "此浏览器尚未加入该房间。",
  "Missing action identifier.": "缺少操作标识，请重试。",
  "You have left this room.": "你已离开此房间。",
  "This match has already started. Ask the host for a new room.":
    "比赛已开始，请联系房主创建新房间。",
  "This room already has four players.": "房间已有四位玩家。",
  "That name is taken at this table. Choose another.":
    "此昵称已被使用，请换一个。",
  "This match ended because a player left. Create another room.":
    "有玩家离开，比赛已结束，请创建新房间。",
  "The table changed. Your hand has been refreshed; try your action again.":
    "牌局已有变化，手牌已刷新，请重试。",
  "Seats are fixed once the match starts.": "比赛开始后不能换座。",
  "Choose an open seat.": "请选择空位。",
  "The match has already started.": "比赛已开始。",
  "Invalid ready status.": "准备状态无效。",
  "Only the host can start the match.": "只有房主可以开始比赛。",
  "All four players must be seated and ready.": "须四位玩家全部入座并准备。",
  "Start the match first.": "请先开始比赛。",
  "Select a legal combination.": "请选择合法牌型。",
  "Invalid declaration.": "牌型声明无效。",
  "Select a card to return.": "请选择一张还贡牌。",
  "The host deals the next hand.": "下一局由房主发牌。",
  "Finish the current hand first.": "请先完成当前牌局。",
  "Unknown action.": "未知操作。",
  "Another player acted at the same time. Refreshing the table; please try again.":
    "其他玩家同时进行了操作，正在刷新牌桌，请重试。",
  "The table could not be reached. Please retry; your seat is saved in this browser.":
    "无法连接牌桌，请重试。你的座位已保存在此浏览器。",
  "Failed to fetch": "网络连接失败，请重试。",
  "Load failed": "加载失败，请重试。",
  "The operation was aborted due to timeout": "连接超时，请重试。",
};

const combinations = {
  Single: "单张",
  Pair: "对子",
  Triple: "三张",
  "Full house": "三带二",
  Straight: "顺子",
  Tube: "连对",
  Plate: "钢板",
  "Straight flush": "同花顺",
  "Four-joker bomb": "天王炸",
};
export function combo(text) {
  return text
    .replace(
      /^(Single|Pair|Triple|Full house|Straight flush|Straight|Tube|Plate|Four-joker bomb|\d+-card bomb)/i,
      (s) =>
        combinations[
          Object.keys(combinations).find(
            (k) => k.toLowerCase() === s.toLowerCase(),
          )
        ] || s.replace(/(\d+)-card bomb/i, "$1 张炸弹"),
    )
    .replace(/Small Joker/g, "小王")
    .replace(/Big Joker/g, "大王")
    .replace(/ Pair$/, " 对子");
}
const ordinal = (s) =>
  ({ "1st": "头游", "2nd": "二游", "3rd": "三游", "4th": "末游" })[s] || s;
const patterns = [
  [/^HAND (\d+)$/, (_, n) => `第 ${n} 局`],
  [/^Playing Level (.+)$/, (_, r) => `当前级数 ${r}`],
  [/^(.+)♥ is wild$/, (_, r) => `${r}♥ 为逢人配`],
  [
    /^(\d+) cards?( · Away| · Passed| · AI)?$/,
    (_, n, s) =>
      `${n} 张${s === " · AI" ? " · 电脑" : s === " · Away" ? " · 离线" : s ? " · 不出" : ""}`,
  ],
  [/^(1st|2nd|3rd|4th) place$/, (_, p) => `${ordinal(p)}`],
  [/^Play (\d+) cards?$/, (_, n) => `出 ${n} 张牌`],
  [/^(\d+) selected$/, (_, n) => `已选 ${n} 张`],
  [/^Room ([A-Z2-9]{8}) · Connected$/, (_, code) => `房间 ${code} · 已连接`],
  [
    /^(\d)\/4 players · Double-up \+(\d)$/,
    (_, n, d) => `${n}/4 位玩家 · 双上升 ${d} 级`,
  ],
  [/^· You$/, () => "· 你"],
  [
    /^AI · (Beginner|Medium|Hard|Expert)$/,
    (_, l) =>
      `电脑 · ${{ Beginner: "入门", Medium: "中等", Hard: "困难", Expert: "专家" }[l]}`,
  ],
  [/^Room$/, () => "房间"],
  [/^· You are on$/, () => "· 你的队伍是"],
  [
    /^1st & (2nd|3rd|4th): \+(\d)$/,
    (_, p, n) => `头游、${ordinal(p)}：升 ${n} 级`,
  ],
  [
    /^1st & (2nd|3rd|4th) · Now on (.+)$/,
    (_, p, r) => `头游、${ordinal(p)} · 当前打 ${r}`,
  ],
  [
    /^A (double-up|1–\d) finish\. (Match complete\.|Winning promotion: \+(\d)\.)$/,
    (_, p, tail, n) =>
      `${p === "double-up" ? "双上" : p}获胜。${n ? `赢家升 ${n} 级。` : "比赛结束。"}`,
  ],
  [/^Return one card to (.+)\.$/, (_, name) => `向 ${name} 还一张牌。`],
  [/^(.+) PLAYED$/, (_, name) => `${name === "You" ? "你" : name} 出牌`],
  [/^Declared: (.+)$/, (_, s) => `声明：${s}`],
  [
    /^(\d) of 3 passes · (Your partner has the table\.|Beat this combination or pass\.)$/,
    (_, n, s) =>
      `已连续 ${n}/3 次不出 · ${s.startsWith("Your") ? "搭档当前领先。" : "请压牌或选择不出。"}`,
  ],
  [/^(.+) has the lead\.$/, (_, name) => `由 ${name} 领出。`],
  [
    /^Level Team: (Your Team|Opponents) · Level (.+)$/,
    (_, team, r) => `${team === "Your Team" ? "我方" : "对方"}打级 · 打 ${r}`,
  ],
  [
    /^Your turn\. Beat the (.+) or pass\.$/,
    (_, type) => `轮到你，请压过${combo(type)}或选择不出。`,
  ],
  [
    /^(.+) (is up\.|is thinking…)$/,
    (_, name, state) =>
      `${name}${state === "is up." ? " 出牌。" : " 正在思考…"}`,
  ],
  [
    /^Hint: (.+)\. (Your partner is ahead; consider passing\.|Tap Hint again for another option\.)$/,
    (_, move, s) =>
      `提示：${combo(move)}。${s.startsWith("Your") ? "搭档当前领先，可以考虑不出。" : "再次点击提示可查看其他选择。"}`,
  ],
  [
    /^Playing (.+)\. (.+)♥ is wild\.$/,
    (_, r, w) => `本局打 ${r}，${w}♥ 为逢人配。`,
  ],
  [/^(.+) plays (.+)\.$/, (_, name, move) => `${name} 出 ${combo(move)}。`],
  [
    /^(.+) finishes (1st|2nd|3rd|4th)\.$/,
    (_, name, p) => `${name} 获得${ordinal(p)}名。`,
  ],
  [/^(.+) leads the next trick\.$/, (_, name) => `${name} 领出下一轮。`],
  [
    /^(.+) (pays|returns) ((?:Big Joker|Small Joker|[2-9AJQK]|10)[♥♦♣♠★]*) to (.+)\.$/,
    (_, from, verb, card, to) =>
      `${from} 向 ${to} ${verb === "pays" ? "进贡" : "还贡"} ${combo(card)}。`,
  ],
  [
    /^(Your team|Opponents|Team A|Team B) wins 1–([234])(?: and wins the game!|\. Now level (.+)\.)$/,
    (_, team, p, r) =>
      `${messages[team]}以 1–${p} 获胜${r ? `，升至 ${r}。` : "，赢得整场比赛！"}`,
  ],
  [
    /^(?:Small Joker|Big Joker|[2-9AJQK]|10) [♥♦♣♠★]*(?:, wild)?$/,
    (s) => combo(s).replace(", wild", "，逢人配"),
  ],
  [
    /^(\d+) wins? in (\d+) match(?:es)? played$/,
    (_, w, m) => `练习战绩：${m} 局中 ${w} 胜`,
  ],
  [/^Current win streak: (\d+)$/, (_, n) => `当前连胜：${n} 局`],
];
export function translate(text, language = "zh-CN") {
  if (language !== "zh-CN" || !text.trim()) return text;
  const trimmed = text.trim();
  // Formatted HTML can wrap a sentence across lines; look it up single-spaced.
  const source = trimmed.replace(/\s+/g, " ");
  let result = messages[source];
  if (result === undefined) {
    const history = source.match(/^Hand (\d+) · (.*)$/s);
    if (history)
      result = `第 ${history[1]} 局 · ${translate(history[2], language)}`;
    else if (
      /^(Single|Pair|Triple|Full house|Straight flush|Straight|Tube|Plate|Four-joker bomb|\d+-card bomb)(?: ·|$)/i.test(
        source,
      )
    )
      result = combo(source);
    else
      for (const [pattern, format] of patterns) {
        const match = source.match(pattern);
        if (match) {
          result = format(...match);
          break;
        }
      }
  }
  return result === undefined ? text : text.replace(trimmed, () => result);
}

export function installLanguageToggle(doc = document, storage) {
  const key = "guandan-language";
  let language = "en";
  try {
    storage ??= globalThis.localStorage;
    if (storage.getItem(key) === "zh-CN") language = "zh-CN";
  } catch {
    /* Session-only preference if browser storage is blocked. */
  }
  const originals = new WeakMap(),
    attributeOriginals = new WeakMap();
  const excluded = (el) =>
    el.closest('[translate="no"], script, style, [data-language-toggle]');
  function localize() {
    observer.disconnect();
    const walker = doc.createTreeWalker(doc.body, 4);
    let node;
    while ((node = walker.nextNode())) {
      if (excluded(node.parentElement)) continue;
      const previous = originals.get(node),
        source =
          previous && node.data === previous.output
            ? previous.source
            : node.data;
      const output = translate(source, language);
      originals.set(node, { source, output });
      if (node.data !== output) node.data = output;
    }
    for (const el of doc.body.querySelectorAll(
      "[placeholder],[aria-label],[title]",
    )) {
      if (excluded(el)) continue;
      const records = attributeOriginals.get(el) || {};
      for (const attribute of ["placeholder", "aria-label", "title"]) {
        if (!el.hasAttribute(attribute)) continue;
        const value = el.getAttribute(attribute),
          prior = records[attribute],
          source = prior && prior.output === value ? prior.source : value,
          output = translate(source, language);
        records[attribute] = { source, output };
        if (value !== output) el.setAttribute(attribute, output);
      }
      attributeOriginals.set(el, records);
    }
    doc.documentElement.lang = language;
    doc.title =
      language === "en"
        ? "Guandan — The Partnership Table"
        : "掼蛋 — 四人同桌，搭档同行";
    for (const button of doc.querySelectorAll("[data-language-toggle]")) {
      button.textContent = language === "en" ? "中文" : "English";
      button.lang = language === "en" ? "zh-CN" : "en";
      button.setAttribute(
        "aria-label",
        language === "en" ? "Switch to Chinese" : "切换为英文",
      );
      button.title =
        language === "en" ? "Language: English → 中文" : "语言：中文 → English";
    }
    observer.observe(doc.body, {
      subtree: true,
      childList: true,
      characterData: true,
      attributes: true,
      attributeFilter: ["placeholder", "aria-label", "title"],
    });
  }
  const observer = new MutationObserver(localize);
  doc.addEventListener("click", (event) => {
    if (!event.target.closest("[data-language-toggle]")) return;
    language = language === "en" ? "zh-CN" : "en";
    try {
      storage.setItem(key, language);
    } catch {}
    localize();
  });
  localize();
  return {
    get language() {
      return language;
    },
    refresh: localize,
  };
}
