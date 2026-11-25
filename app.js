(() => {
  'use strict';

  const APP_STORE_URL = 'https://apps.apple.com/app/id6757732173';
  const WEB_APP_URL = 'https://ofc-optimizer.pages.dev/';
  const LANG_STORAGE_KEY = 'ofc_lp_lang_v1';
  const ASSET_BASE = document.documentElement.dataset.assetBase || '';
  const PAGE_DEFAULT_LANG = document.documentElement.dataset.defaultLang || '';

  /* ---------------- i18n Static Copy ---------------- */
  const COPY = {
    ja: {
      page_title: 'OFC Fantasy Optimizer v3.0 — 100% オフライン OFC Pineapple ソルバー＆トレーニング',
      nav_webapp: 'Web版アプリ',
      nav_quiz: '無料クイズ',
      nav_features: '機能',
      nav_data: 'FLデータ',
      nav_pricing: '料金',
      cta_store_short: 'App Store',
      hero_eyebrow: 'v3.0 · 100% OFFLINE NATIVE C++20 ENGINE',
      hero_title: 'OFC Pineapple を、<br />勘から<span class="gold">「期待値」</span>へ。',
      hero_sub:
        '初手 S0 から最終 S4 までの平場ソルバー、AI 1局レビュー、実効スタック（50pt〜∞）別の最適解、54枚／52枚（ジョーカーなし）完全対応。iPhone 内オフライン動作＋PC・Android 向け無料 Web 版も公開中。',
      cta_download: 'App Store で無料ダウンロード',
      cta_open_webapp: 'ブラウザで Web 版アプリを操作 →',
      pill_offline: '100% オフライン C++20',
      pill_decks: '54枚（JK2枚）＆ 52枚（JKなし）',
      pill_stacks: '実効スタック 50pt / 100pt / 200pt / ∞',
      pill_webapp: 'PC・Android は Web 版で無料体験',
      quiz_kicker: 'INTERACTIVE OFC QUIZ',
      quiz_heading: 'あなたの OFC 直感、厳密計算に勝てるか？',
      quiz_desc:
        '実戦から厳選した 3 問をブラウザ上でそのまま解けます。すべて C++20 エンジン＋最新 FL 価値テーブルで検証した期待値（EV）・FL 突入率・ファウル率を即時採点。',
      feat_kicker: 'INSIDE v3.0',
      feat_heading: '強くなるために必要な道具を、iPhone 1 台に。',
      feat_desc:
        '画像をタップすると拡大表示できます。全機能がオンデバイスで完結するため、海外遠征・機内・オフライン卓でも待ち時間ゼロで解析できます。',
      data_kicker: 'REPRODUCIBLE C++20 BENCHMARKS',
      data_heading: 'スタック深さとジョーカー有無で、FL 価値は別物になる。',
      data_desc:
        '「スタック無限・54枚」の感覚のまま 50pt 卓や 52 枚（ジョーカーなし）卓を打つと、Trips 特攻で大きく期待値を落とします。アプリ内では 1 タップで卓条件を切替可能。',
      chart1_cap:
        '54枚（JK2枚）実効スタック別 FL 価値：Trips（17枚）は ∞ 126.4pt → 50pt 42.0pt（-67%）。一方 QQ（14枚）は 100pt でも 22.8pt とほぼ不変。',
      chart2_cap:
        '54枚 vs 52枚（JKなし）：ジョーカー 2 枚が抜けると継続率が急落し、QQ 14.0pt（-40%）／Trips 58.5pt（-54%）まで半減。',
      methodology_note:
        '計測条件（再現性注記）：C++20 厳密分枝限定 FL ソルバー（1,200 局／ティア）＋ 100,000 連鎖マルコフ計算（同枚数リファンタジー採用）。自分の FL 連鎖のみを積算した基準値であり、相手の反撃 FL まで差し引くモデルでは値はこれより大きく低下します。誤差目安（∞）：QQ ±0.7 / KK ±1.2 / AA ±2.5 / Trips ±6.8 pt。',
      price_kicker: 'TRANSPARENT PRICING',
      price_heading: 'まずは無料で体験。本格研究には Pro。',
      price_desc:
        '毎日の「今日の 1 問」・AI 1局レビュー・平場ソルバー・CPU 対戦はすべて無料で試せます。本格研究向けの Pro プランはサブスクと買い切りプランを用意。',
      pricing_footnote:
        '※ 表示価格は日本（JPY）／米国（USD）の基準目安です。実際の請求額は App Store の各地域通貨・為替レートに準じます。サブスクリプションは iOS の「設定」からいつでも解約できます。買い切りプランは自動更新されません。',
      faq_heading: 'よくある質問',
      final_title: '今日の 1 問から、期待値ベースの OFC へ。',
      final_desc:
        '登録不要・無料で今すぐ開始。iPhone では 100% オフライン C++20 で動作し、PC や Android でも Web 版アプリからそのまま体験できます。',
      footer_privacy: 'プライバシーポリシー',
      footer_terms: '利用規約（Apple EULA）',
      footer_support: 'お問い合わせ',
      // Quiz UI labels
      quiz_solved_fmt: (ok, total) => `${ok} / ${total} 問正解`,
      quiz_my_board: 'あなたの盤面',
      quiz_opp_board: '相手の公開盤面',
      quiz_draw_label: '今回の 3 枚ドロー（2 枚配置・1 枚捨て）',
      quiz_row_top: 'トップ',
      quiz_row_mid: 'ミドル',
      quiz_row_bot: 'ボトム',
      quiz_ok_badge: '✓ 正解！ AI 最善 #1 と完全一致',
      quiz_miss_badge: (loss) => `惜しい！ 最善と -${loss} pt 差`,
      quiz_best_tag: '#1 最善',
      quiz_next_btn: '次の問題へ →',
      quiz_retry_btn: 'もう一度選ぶ',
      quiz_web_cta: 'Web版アプリで今すぐ操作 →',
      quiz_app_cta: 'iOS アプリで「今日の 1 問」を解く →'
    },
    en: {
      page_title: 'OFC Fantasy Optimizer v3.0 — 100% Offline OFC Pineapple Solver & Trainer',
      nav_webapp: 'Web App',
      nav_quiz: 'Free Quiz',
      nav_features: 'Features',
      nav_data: 'FL Data',
      nav_pricing: 'Pricing',
      cta_store_short: 'App Store',
      hero_eyebrow: 'v3.0 · 100% OFFLINE NATIVE C++20 ENGINE',
      hero_title: 'Solve Every Street of <span class="gold">OFC Pineapple.</span>',
      hero_sub:
        'Full Street 0–4 Flat-Play Solver, Street-by-Street AI Hand Review, Effective Stack presets (50pt–∞), and both 54-card (2 Jokers) & 52-card (No Jokers)—100% offline on iPhone, plus a free live Web App for PC & Android.',
      cta_download: 'Download Free on App Store',
      cta_open_webapp: 'Open Web App in Browser →',
      pill_offline: '100% Offline C++20',
      pill_decks: '54-Card (2 Jokers) & 52-Card',
      pill_stacks: 'Effective Stack 50pt / 100pt / 200pt / ∞',
      pill_webapp: 'Live Web App (PC & Android)',
      quiz_kicker: 'INTERACTIVE OFC QUIZ',
      quiz_heading: 'Can Your OFC Intuition Beat Exact Enumeration?',
      quiz_desc:
        'Play 3 real solver-mined spots right in your browser. Instant grading with exact EV, Fantasyland %, and Foul % computed by our C++20 engine.',
      feat_kicker: 'INSIDE v3.0',
      feat_heading: 'Every Serious OFC Study Tool, In Your Pocket.',
      feat_desc:
        'Tap any screen to zoom. Every neural net and exact endgame solver runs on-device—study on flights, live poker rooms, or anywhere offline.',
      data_kicker: 'REPRODUCIBLE C++20 BENCHMARKS',
      data_heading: 'Stack Depth & Jokers Completely Reshape FL Value.',
      data_desc:
        'Playing 50pt tables or 52-card (No Joker) games with infinite-stack 54-card intuition bleeds EV on high-risk Trips chases. Switch presets in one tap inside the app.',
      chart1_cap:
        '54-Card (2 Jokers) FL value by effective stack: 17-card Trips drops from 126.4pt (∞) to 42.0pt (50pt, -67%), while 14-card QQ holds steady at 22.8pt down to 100pt.',
      chart2_cap:
        '54-Card vs 52-Card (No Jokers): Removing 2 Jokers slashes repeat rates—cutting QQ to 14.0pt (-40%) and Trips to 58.5pt (-54%).',
      methodology_note:
        'Methodology: Exact C++20 branch-and-bound FL solver (1,200 hands/tier) + 100,000-chain Markov simulation with same-card Re-Fantasy. Counts own FL chains only (subtracting opponent counter-FL lowers values substantially). Standard error at ∞: QQ ±0.7 / KK ±1.2 / AA ±2.5 / Trips ±6.8 pt.',
      price_kicker: 'TRANSPARENT PRICING',
      price_heading: 'Start Free. Upgrade to Pro When You Grind.',
      price_desc:
        'Try Daily Spot drills, 1 AI Full-Hand Review/day, 1 Flat Solver run/day, and unlimited offline CPU battles for free. Pro offers flexible subscriptions plus a Lifetime license.',
      pricing_footnote:
        'Displayed USD / JPY prices are reference tiers; final billing uses your local App Store currency and tax rules. Subscriptions can be canceled anytime in iOS Settings. Lifetime plans never auto-renew.',
      faq_heading: 'Frequently Asked Questions',
      final_title: 'Stop Guessing. Start Studying EV.',
      final_desc:
        'Free to start, no account required. Run 100% offline C++20 solves on iPhone, or test the live Web App right now on PC or Android.',
      footer_privacy: 'Privacy Policy',
      footer_terms: 'Terms of Use (Apple EULA)',
      footer_support: 'Contact Support',
      // Quiz UI labels
      quiz_solved_fmt: (ok, total) => `${ok} / ${total} Correct`,
      quiz_my_board: 'Your Board',
      quiz_opp_board: 'Opponent Visible Board',
      quiz_draw_label: 'Your 3-Card Draw (Place 2 · Discard 1)',
      quiz_row_top: 'Top',
      quiz_row_mid: 'Middle',
      quiz_row_bot: 'Bottom',
      quiz_ok_badge: '✓ Spot On! Matches Exact #1 Best',
      quiz_miss_badge: (loss) => `Close! -${loss} pt EV vs Best`,
      quiz_best_tag: '#1 BEST',
      quiz_next_btn: 'Next Spot →',
      quiz_retry_btn: 'Try Again',
      quiz_web_cta: 'Try Live Web App →',
      quiz_app_cta: 'Play Free Daily Spots in the iOS App →'
    }
  };

  /* ---------------- Verified Quiz Data (2026-11-23 FL Table) ---------------- */
  const QUIZZES = [
    {
      id: 'pro-d1-s3-08',
      tabJa: 'Q1 · S3（QQ 確定 vs FH）',
      tabEn: 'Q1 · S3 (QQ Lock vs FH)',
      deckJa: '54枚（JK2枚）',
      deckEn: '54-Card (2 Jokers)',
      stackJa: '実効スタック：無限（∞）',
      stackEn: 'Effective Stack: ∞',
      streetJa: 'ストリート 3（残り 1 ストリート）',
      streetEn: 'Street 3 (1 Street Left)',
      titleJa: '残り 1 ストリート！「100% QQ FL 確定」を蹴って Q♦ を捨てるべきか？',
      titleEn: 'One Street Left! Should You Reject 100% QQ FL and Discard Q♦?',
      subJa: '【実効スタック：無限の卓】ミドル 8 トリップス完成済み。Q♦ でトップ QQ を確定させるか、Q♦ を捨ててボトム 9 フルハウスを完成させるか。',
      subEn: '[∞ Stack Table] Middle 8-trips is locked. Take guaranteed QQ Fantasyland on Top, or discard Q♦ to complete a Bottom Full House?',
      myBoard: {
        top: ['Ac', 'Qh'],
        mid: ['8s', '8d', '8c', '4d'],
        bot: ['9h', '9c', 'Jd']
      },
      oppBoard: {
        top: ['Ks', '6h', '2d'],
        mid: ['7d', '7c', '5s', '5c', '2h'],
        bot: ['Js', 'Th', '8h']
      },
      oppCount: '11/13',
      draw: ['9s', 'Qd', 'Jh'],
      bestIdx: 1,
      options: [
        {
          label: 'A',
          nameJa: 'QQ FL 100% 確定ライン',
          nameEn: 'Lock 100% QQ Fantasyland',
          moveJa: 'Q♦→TOP, 9♠→BOT（捨て J♥）',
          moveEn: 'Q♦→TOP, 9♠→BOT (disc J♥)',
          ev: 41.6,
          fl: 100.0,
          foul: 0.0,
          rank: 5,
          noteJa: 'QQ 100%',
          noteEn: 'QQ 100%'
        },
        {
          label: 'B',
          nameJa: 'Q♦ を捨ててボトム 9 フルハウス完成！',
          nameEn: 'Discard Q♦ & Complete 9s Full of Jacks!',
          moveJa: '9♠→BOT, J♥→BOT（捨て Q♦）',
          moveEn: '9♠→BOT, J♥→BOT (disc Q♦)',
          ev: 52.97,
          fl: 57.9,
          foul: 0.0,
          rank: 1,
          noteJa: 'AA 44.6% · FH +6pt',
          noteEn: 'AA 44.6% · FH +6pt'
        },
        {
          label: 'C',
          nameJa: '9♠ ボトム＋J♥ ミドル（Q♦ 捨て）',
          nameEn: 'Keep 9-Trips Bottom, J♥ Middle (disc Q♦)',
          moveJa: '9♠→BOT, J♥→MID（捨て Q♦）',
          moveEn: '9♠→BOT, J♥→MID (disc Q♦)',
          ev: 45.79,
          fl: 57.9,
          foul: 0.0,
          rank: 2,
          noteJa: 'AA 44.6% · FH 逃す',
          noteEn: 'AA 44.6% · Misses FH'
        }
      ],
      flipNoteJa: '実効 50pt 卓では？ AA FL 価値が 64.5pt → 35.5pt に下がるため、[B] +39.68pt vs [A] +38.78pt と大差がわずか +0.90pt 差まで急接近します。',
      flipNoteEn: 'At 50pt Effective Stack: AA FL drops from 64.5pt to 35.5pt, shrinking this massive +11.37pt gap down to just +0.90pt (+39.68 vs +38.78)!',
      explainJa:
        '[A] は QQ FL（23.2pt）が 100% 確定しますが、AA FL（64.5pt）の権利とボトムフルハウス（+6pt）を同時に放棄します。[B] はファウル率 0.0% のままフルハウスを確定させつつ、最終 S4 の 3 枚で残り A 3枚・JK 2枚・Q 2枚を引けば 44.6% で AA・13.2% で QQ に入るため +11.37pt もの大差で圧勝します。',
      explainEn:
        '[A] guarantees QQ FL (23.2pt) but throws away both AA FL (64.5pt) and a +6pt Bottom Full House. [B] locks the Full House with 0.0% foul risk while keeping 44.6% AA FL + 13.2% QQ FL outs on the final 3-card pull—crushing [A] by +11.37pt!',
      methodJa: 'C++20 厳密全列挙 (Exact S3) · 54枚 · 最新 100k 連鎖 FL テーブル',
      methodEn: 'C++20 Exact S3 Enumeration · 54-Card · 100k-Chain FL Table'
    },
    {
      id: 'pro-d3-s3-02',
      tabJa: 'Q2 · S3（JK の横に 2♠ vs 4♦）',
      tabEn: 'Q2 · S3 (JK + 2♠ vs 4♦)',
      deckJa: '54枚（JK2枚）',
      deckEn: '54-Card (2 Jokers)',
      stackJa: '実効スタック：無限（∞）',
      stackEn: 'Effective Stack: ∞',
      streetJa: 'ストリート 3（残り 1 ストリート）',
      streetEn: 'Street 3 (1 Street Left)',
      titleJa: 'トップ「JK・9♦」に置くべきは 4♦？ それとも小さい 2♠？',
      titleEn: 'Top Has "JK + 9♦": Place 4♦ or the Smaller 2♠?',
      subJa: '【実効スタック：無限の卓】ボトムはクラブ 4 枚でフラッシュ待ち。今回の 3♥ でミドルに 33 ワンペアを作ったあと、トップの「JK・9♦」には大きい 4♦ と小さい 2♠ のどちらを置くべきか？',
      subEn: '[∞ Stack Table] Bottom holds a 4-card club flush draw. After placing 3♥ in Middle for Pair of 3s, should you put the higher 4♦ or the smaller 2♠ next to JK 9♦ on Top?',
      myBoard: {
        top: ['JK', '9d'],
        mid: ['Qd', '3s', 'Jd'],
        bot: ['6c', '2c', '5c', '9c']
      },
      oppBoard: {
        top: ['Ah', 'Ks'],
        mid: ['6d', '6s', '2d'],
        bot: ['Th', '8h', '8d', '8c']
      },
      oppCount: '9/13',
      draw: ['4d', '3h', '2s'],
      bestIdx: 1,
      options: [
        {
          label: 'A',
          nameJa: 'キッカー重視で 4♦ をトップへ',
          nameEn: 'Put Higher 4♦ on Top + 33 in Middle',
          moveJa: '4♦→TOP, 3♥→MID（捨て 2♠）',
          moveEn: '4♦→TOP, 3♥→MID (disc 2♠)',
          ev: -24.99,
          fl: 0.0,
          foul: 16.2,
          rank: 2,
          noteJa: 'Foul 16.2%',
          noteEn: 'Foul 16.2%'
        },
        {
          label: 'B',
          nameJa: 'あえて小さい 2♠ をトップへ！（33 ミドル）',
          nameEn: 'Put the Smaller 2♠ on Top + 33 in Middle!',
          moveJa: '2♠→TOP, 3♥→MID（捨て 4♦）',
          moveEn: '2♠→TOP, 3♥→MID (disc 4♦)',
          ev: -24.14,
          fl: 0.0,
          foul: 16.2,
          rank: 1,
          noteJa: 'JK が 22 を作れる！',
          noteEn: 'JK forms 22 < 33!'
        },
        {
          label: 'C',
          nameJa: 'ファウル半減（7.5%）の超安全ライン',
          nameEn: 'Cut Foul Risk in Half (7.5% Ultra-Safe)',
          moveJa: '2♠→TOP, 4♦→MID（捨て 3♥）',
          moveEn: '2♠→TOP, 4♦→MID (disc 3♥)',
          ev: -25.64,
          fl: 0.0,
          foul: 7.5,
          rank: 3,
          noteJa: 'Foul 7.5% · EV -1.50pt 損',
          noteEn: 'Foul 7.5% · -1.50pt EV'
        }
      ],
      flipNoteJa: 'なぜ 2♠ が 4♦ に勝つ？ ミドルが 33 止まりのとき、JK 9♦ 4♦ は 44 にするとファウルするため A ハイ止まり（相手の A♥K♠ に負け）。一方 JK 9♦ 2♠ なら JK が「2」に化けて 22 ワンペアになり、ミドル 33 未満を保ったまま相手の A♥K♠ を撃破できます！',
      flipNoteEn: 'Why does 2♠ beat 4♦? When Middle stays Pair of 3s, JK 9♦ 4♦ CANNOT make 44 (foul!) and drops to A-high—losing to Opponent’s A♥ K♠. With 2♠, the Joker becomes a 2 to form Pair of 2s (22 < 33), legally beating A♥ K♠!',
      explainJa:
        'ファウル率は [A][B] どちらも 16.2% で完全一致しますが、ミドルが 33 で止まった局面で「JK を 22 にダウングレードして相手のトップ A♥K♠ を抜ける」 [B] が +0.85pt の厳密優位。ファウル率を 7.5% に半減させる [C] もミドル 33 を捨てる損が大きく -1.50pt 劣ります。',
      explainEn:
        'Both [A] and [B] share the exact same 16.2% foul rate, yet [B] gains +0.85pt because Joker + 2♠ creates a legal Pair of 2s underneath Middle 33—stealing Top from Opponent’s A♥ K♠. Even halving foul risk in [C] (7.5%) loses -1.50pt by giving up Middle 33.',
      methodJa: 'C++20 厳密全列挙 (Exact S3) · 54枚 · 上級実戦スポット',
      methodEn: 'C++20 Exact S3 Enumeration · 54-Card · Master Spot'
    },
    {
      id: 'pro-d3-s2-11',
      tabJa: 'Q3 · S2（トップ JK ＋ Q♣）',
      tabEn: 'Q3 · S2 (Top JK + Q♣)',
      deckJa: '54枚（JK2枚）',
      deckEn: '54-Card (2 Jokers)',
      stackJa: '実効スタック：無限（∞）',
      stackEn: 'Effective Stack: ∞',
      streetJa: 'ストリート 2（残り 2 ストリート）',
      streetEn: 'Street 2 (2 Streets Left)',
      titleJa: 'トップ「JK」に Q♣ を引いた！ 即 QQ FL 確定にする？ 捨てる？',
      titleEn: 'Top Has "JK" and You Draw Q♣! Lock QQ FL or Discard Q♣?',
      subJa: '【実効スタック：無限の卓】ボトムはすでに 9-7 ツーペアで安泰。トップの「JK」に Q♣ を置いて QQ 以上を確定させるか、あえて Q♣ を捨てて A・K を待つか？',
      subEn: '[∞ Stack Table] Bottom is safe with 9-7 two pair. Should you snap Q♣ onto Top next to your Joker to lock QQ+, or discard Q♣ to draw for K/A?',
      myBoard: {
        top: ['JK'],
        mid: ['6c', '3s'],
        bot: ['9d', '9s', '7c', '7s']
      },
      oppBoard: {
        top: ['Ah', 'Qd'],
        mid: ['4c', '4s', '3h', '2s'],
        bot: ['Td', 'Tc', '8d']
      },
      oppCount: '9/13',
      draw: ['Qc', '6d', '2h'],
      bestIdx: 1,
      options: [
        {
          label: 'A',
          nameJa: 'Q♣ をトップへ（QQ 以上 FL 69.7% 確保）',
          nameEn: 'Snap Q♣ to Top (69.7% FL Lock)',
          moveJa: '6♦→MID, Q♣→TOP（捨て 2♥）',
          moveEn: '6♦→MID, Q♣→TOP (disc 2♥)',
          ev: 28.4,
          fl: 69.7,
          foul: 4.8,
          rank: 2,
          noteJa: '50pt卓なら #1 (+22.93pt)!',
          noteEn: '#1 at 50pt Stack (+22.93pt)!'
        },
        {
          label: 'B',
          nameJa: 'あえて Q♣ を捨てる！（トップ 2 枠空き維持）',
          nameEn: 'Discard Q♣! Keep 2 Top Slots Open for KK/AA',
          moveJa: '6♦→MID, 2♥→MID（捨て Q♣）',
          moveEn: '6♦→MID, 2♥→MID (disc Q♣)',
          ev: 29.1,
          fl: 59.5,
          foul: 4.6,
          rank: 1,
          noteJa: 'AA 32.4% · KK 22.2%',
          noteEn: 'AA 32.4% · KK 22.2%'
        },
        {
          label: 'C',
          nameJa: 'Q♣ をミドルへ（ミドル強化）',
          nameEn: 'Place Q♣ in Middle for Safety',
          moveJa: '6♦→MID, Q♣→MID（捨て 2♥）',
          moveEn: '6♦→MID, Q♣→MID (disc 2♥)',
          ev: 19.95,
          fl: 45.4,
          foul: 5.5,
          rank: 4,
          noteJa: '-9.15pt 大悪手',
          noteEn: '-9.15pt Blunder'
        }
      ],
      flipNoteJa: '【補足：浅い 50pt 卓なら答えが逆転！】 この問題の前提（スタック無限）では [B] Q♣捨て（+29.10pt）が [A] に +0.70pt 勝利します。一方、実効 50pt 卓では [A] Q♣→TOP（+22.93pt）が [B]（+21.72pt）を +1.21pt 逆転して #1 になります。',
      flipNoteEn: 'BONUS — Shallow 50pt Stack Flips the Answer: Under this spot’s ∞ stack rule, discarding Q♣ [B] (+29.10pt) beats [A] by +0.70pt. On a 50pt table, locking Q♣→TOP [A] (+22.93pt) flips to #1—beating [B] (+21.72pt) by +1.21pt!',
      explainJa:
        'スタック無限では AA（64.5pt）と QQ（23.2pt）に 41pt 超の大差があるため、Q♣ を捨てて S3/S4 の A・K 受けを最大化する [B]（AA 32.4%・KK 22.2%）が最善。一方 50pt 卓では AA が 35.5pt に縮むのに対し QQ は 20.3pt とほぼ落ちないため、FL 率を +10.2% 上乗せする [A] が逆転します。',
      explainEn:
        'At infinite stack, AA FL (64.5pt) towers over QQ FL (23.2pt), so tossing Q♣ to keep 2 Top slots open for A/K draws [B] (AA 32.4%, KK 22.2%) leads. At 50pt stack, AA shrinks to 35.5pt while QQ stays 20.3pt—making [A]’s +10.2% extra FL frequency win easily.',
      methodJa: 'オンデバイス AI 評価 + 終盤厳密計算 · スタック無限 vs 実効 50pt',
      methodEn: 'On-Device AI + Exact Endgame · ∞ Stack vs 50pt Stack'
    }
  ];

  /* ---------------- Features, Pricing & FAQ Data ---------------- */
  const FEATURES = [
    {
      shot: '01-game-review',
      tagJa: 'AI GAME REVIEW',
      tagEn: 'AI GAME REVIEW',
      titleJa: '1 局まるごと AI レビュー',
      titleEn: 'Full-Hand AI Game Review',
      descJa: '対局直後に S0〜S4 の全ストリートを自動採点。精度スコア・総 EV 損失・悪手ハイライトを 1 画面で確認し、弱点をそのまま再挑戦できます。',
      descEn: 'Grade every street S0–S4 right after a hand with Accuracy %, total EV loss, blunder highlights, and instant mistake replay.'
    },
    {
      shot: '02-flat-solver-pro',
      tagJa: 'FLAT SOLVER PRO',
      tagEn: 'FLAT SOLVER PRO',
      titleJa: '全ストリート平場ソルバー（54枚 / 52枚）',
      titleEn: 'Full Street 0–4 Flat Solver (54c & 52c)',
      descJa: '実効スタック（50pt / 100pt / 200pt / ∞）とジョーカー有無を 1 タップ切替。上位候補の期待値・QQ〜Trips 突入率・ファウル率を並列比較。',
      descEn: 'Switch Effective Stack (50pt–∞) and 54-card / 52-card rules in one tap. Compare top candidates by EV, QQ–Trips FL%, and Foul%.'
    },
    {
      shot: '03-daily-spot-drills',
      tagJa: 'DAILY SPOT & PRO DRILLS',
      tagEn: 'DAILY SPOT & PRO DRILLS',
      titleJa: '今日の 1 問＆平場プロドリル',
      titleEn: 'Free Daily Spot & Pro Drills',
      descJa: 'AI 同士の対局から抽出した勝負所だけを収録。初級・中級・上級と実戦ミスの自動復習デッキで短時間トレーニング。',
      descEn: 'Curated high-leverage spots mined from solver-vs-solver play across Basic, Standard, and Master tiers—plus automatic mistake decks.'
    },
    {
      shot: '04-compact-keyboard',
      tagJa: 'FANTASY SOLVER + 4×13 KEYBOARD',
      tagEn: 'FANTASY SOLVER + 4×13 KEYBOARD',
      titleJa: '厳密ファンタジー解析＆片手 4×13 入力',
      titleEn: 'Exact Fantasy Solver & 4×13 Keyboard',
      descJa: '14〜17 枚のファンタジーランドを C++20 分枝限定で厳密最適化。4×13 スート配列キーボードで実卓のハンドも爆速入力。',
      descEn: 'Branch-and-bound exact solver for 14–17 card Fantasyland hands, paired with a fast one-handed 4×13 suited card keyboard.'
    },
    {
      shot: '05-battle-home',
      tagJa: 'OFFLINE PRO CPU BATTLE',
      tagEn: 'OFFLINE PRO CPU BATTLE',
      titleJa: 'オフライン最強 AI 対戦（入門〜Pro AI）',
      titleEn: 'Offline AI Battles (Beginner to Pro AI)',
      descJa: '通信ゼロでサクサク打てる実戦卓。54枚・52枚対応、対局履歴やブックマークからいつでも AI 1 局レビューへ直行。',
      descEn: 'Play fast offline matches across 54-card & 52-card rules, bookmark tough hands, and launch full AI reviews with one tap.'
    },
    {
      shot: '06-quick-score-calc',
      tagJa: '5-SECOND LIVE SETTLEMENT',
      tagEn: '5-SECOND LIVE SETTLEMENT',
      titleJa: '実卓 5 秒簡易役入力＆ 26 枚点数計算',
      titleEn: '5-Second Quick Calc & 26-Card Scorer',
      descJa: 'リアル卓・ホームゲームでの点数計算ミスをゼロに。役を選ぶだけの 5 秒モードと 26 枚カード直接入力モードの両方を搭載。',
      descEn: 'Eliminate home-game scoring errors with both 5-second quick rank entry and full 26-card board verification.'
    }
  ];

  const PRICING = {
    ja: [
      {
        name: 'Free',
        badge: '',
        price: '¥0',
        unit: '',
        sub: '登録不要で今すぐ体験',
        featured: false,
        skus: null,
        items: [
          '平場ソルバー 1 日 1 回（広告なし）',
          'AI 1 局レビュー 1 日 1 局',
          '今日の 1 問（毎日無料）＋ ドリル 1 日 3 問',
          'ファンタジーソルバー＆練習 1 日 3 回',
          'CPU 対戦（入門〜標準 AI）無制限',
          '5 秒点数計算＆ 26 枚計算ツール無制限'
        ],
        cta: '無料で始める'
      },
      {
        name: 'Standard',
        badge: '',
        price: '¥980',
        unit: '/ 月',
        sub: '週間 ¥480 · 買い切り ¥14,800',
        featured: false,
        skus: null,
        items: [
          'ファンタジーソルバー無制限（14〜17 枚）',
          'ファンタジートレーニング無制限',
          '対戦のファンタジー局「最適解」無制限',
          '広告完全非表示'
        ],
        cta: 'App Store で確認'
      },
      {
        name: 'Pro',
        badge: 'おすすめ · 本格研究',
        price: '¥5,980',
        unit: '/ 月',
        sub: '全ストリート解析・AIレビュー・Pro AI を無制限で',
        featured: true,
        skus: [
          { label: 'Pro 週間', val: '¥1,980 / 週' },
          { label: 'Pro 月額', val: '¥5,980 / 月' },
          { label: 'Pro 年額（約19% OFF）', val: '¥58,000 / 年' },
          { label: 'Pro 買い切り', val: '¥88,000' }
        ],
        items: [
          '平場ソルバー（S0〜S4・54枚/52枚・全スタック）無制限',
          'AI 1 局レビュー＆実戦ミス自動復習無制限',
          'Pro 限定「Pro AI」ネイティブ AI 対戦',
          '平場プロドリル無制限',
          'Standard の全機能（ファンタジー無制限・広告なし）込み'
        ],
        cta: 'App Store で Pro を試す'
      }
    ],
    en: [
      {
        name: 'Free',
        badge: '',
        price: '$0',
        unit: '',
        sub: 'No sign-up required',
        featured: false,
        skus: null,
        items: [
          'Flat-Play Solver: 1 free solve/day (no ad gate)',
          'AI Full-Hand Review: 1 full hand/day',
          'Free Daily Spot + 3 Spot Drills/day',
          'Fantasy Solver & Training: 3/day',
          'Unlimited offline CPU battles (Beginner–Standard AI)',
          'Unlimited 5-second & 26-card Score Calculator'
        ],
        cta: 'Download Free'
      },
      {
        name: 'Standard',
        badge: '',
        price: '$6.99',
        unit: '/ mo',
        sub: 'Weekly $2.99 · Lifetime $99.99 (approx.)',
        featured: false,
        skus: null,
        items: [
          'Unlimited Exact Fantasy Solver (14–17 cards)',
          'Unlimited Fantasy Training AI compare',
          'Unlimited "Optimal" in CPU Battle Fantasyland',
          '100% Ad-free experience'
        ],
        cta: 'View on App Store'
      },
      {
        name: 'Pro',
        badge: 'POPULAR · FULL SOLVER',
        price: '$39.99',
        unit: '/ mo',
        sub: 'Unlimited full-street solving, AI review & Pro AI',
        featured: true,
        skus: [
          { label: 'Pro Weekly', val: '$14.99 / wk' },
          { label: 'Pro Monthly', val: '$39.99 / mo' },
          { label: 'Pro Annual (~19% off)', val: '$389.99 / yr' },
          { label: 'Pro Lifetime', val: '$599.99 once' }
        ],
        items: [
          'Unlimited Flat-Play Solver (S0–S4, 54c & 52c, 50pt–∞)',
          'Unlimited AI Full-Hand Reviews & mistake replay',
          'Pro-exclusive "Pro AI" native CPU',
          'Unlimited curated Pro Spot Drills',
          'Includes all Standard features & zero ads'
        ],
        cta: 'Get Pro on App Store'
      }
    ]
  };

  const FAQS = {
    ja: [
      {
        q: 'PC や Android でも使えますか？',
        a: 'はい。アカウント登録不要・無料でそのまま操作できる Web 版アプリを公開しています。PC や Android スマホのブラウザから CPU 対戦・平場ソルバー・AI 1局レビュー・ファンタジー解析を試せます（Pro プラン・ネイティブ C++20 高速オフライン動作は現在 iOS アプリ版で提供中です）。'
      },
      {
        q: '52 枚（ジョーカーなし）ルールにも対応していますか？',
        a: 'はい。54 枚（ジョーカー 2 枚）と 52 枚（ジョーカーなし）の両方に対応しています。平場ソルバー・FL 価値テーブル・CPU 対戦・ファンタジー解析すべて 1 タップで切替できます。'
      },
      {
        q: 'オフライン環境でもソルバーは動きますか？',
        a: 'はい、iOS アプリは 100% オンデバイス（ネイティブ C++20 エンジン）で動作します。通信不要なので機内や海外のポーカールームでも遅延ゼロで解析できます。'
      },
      {
        q: 'Pro 買い切りプラン（¥88,000）は何が含まれますか？',
        a: 'アプリ内の全 Pro 機能（平場ソルバー・AI 1局レビュー・Pro AI 対戦・平場プロドリル・ファンタジー無制限・広告なし）を追加課金や自動更新なくずっと利用できます。すべて端末内で完結するため、オフライン環境でもそのまま使えます。'
      },
      {
        q: 'まず無料でどこまで試せますか？',
        a: '平場ソルバー 1 日 1 回、AI 1 局レビュー 1 日 1 局、今日の 1 問（毎日無料）、CPU 対戦（入門〜標準 AI）、ファンタジーソルバー（1 日 3 回）をすべて無料で体験してから Pro を検討できます。'
      }
    ],
    en: [
      {
        q: 'Can I use it on PC or Android?',
        a: 'Yes! You can open our free, no-signup Web App right in your PC or Android browser to play CPU battles, test the Flat-Play Solver, and run AI Full-Hand Reviews. Full Pro plans and ultra-fast offline native C++20 solving are currently available on iOS.'
      },
      {
        q: 'Does it support 52-card (No Joker) OFC Pineapple?',
        a: 'Yes! Both 54-card (2 Jokers) and 52-card (No Jokers) are supported across the Flat-Play Solver, dedicated FL value tables, AI CPU battles, and the exact Fantasy Solver.'
      },
      {
        q: 'Does the solver work offline without internet?',
        a: 'Yes—our iOS app runs 100% offline with a native C++20 engine directly on your iPhone, with zero server wait time on flights or in live poker rooms.'
      },
      {
        q: 'What does the Pro Lifetime ($599.99 / ¥88,000) license cover?',
        a: 'One-time purchase for lifetime access to all Pro features (unlimited Flat Solver, AI Hand Review, Pro AI battles, Pro Spot Drills, Fantasy Solver, no ads) with zero recurring fees.'
      },
      {
        q: 'Can I test the solver accuracy before subscribing?',
        a: 'Absolutely. You get 1 free Flat-Play solve per day (no ad wall), 1 free AI Full-Hand Review per day, the free Daily Spot, unlimited offline CPU battles, and 3 Fantasy solves/day right after download.'
      }
    ]
  };

  /* ---------------- State ---------------- */
  function detectInitialLang() {
    const params = new URLSearchParams(window.location.search);
    const qLang = params.get('lang');
    if (qLang === 'ja' || qLang === 'en') return qLang;
    if (PAGE_DEFAULT_LANG === 'en') return 'en';
    try {
      const saved = window.localStorage.getItem(LANG_STORAGE_KEY);
      if (saved === 'ja' || saved === 'en') return saved;
    } catch (_) {
      /* ignore storage errors */
    }
    return navigator.language && navigator.language.toLowerCase().startsWith('ja') ? 'ja' : 'en';
  }

  let lang = detectInitialLang();
  let activeQuizIdx = 0;
  const quizAnswers = {}; // { [quizId]: optionIndex }

  /* ---------------- Helpers ---------------- */
  function el(tag, attrs, children) {
    const node = document.createElement(tag);
    if (attrs) {
      for (const [k, v] of Object.entries(attrs)) {
        if (k === 'className') node.className = v;
        else if (k === 'text') node.textContent = v;
        else if (k === 'html') node.innerHTML = v;
        else if (k.startsWith('on') && typeof v === 'function') node.addEventListener(k.slice(2).toLowerCase(), v);
        else if (v !== null && v !== undefined && v !== false) node.setAttribute(k, v === true ? '' : String(v));
      }
    }
    if (children) {
      for (const c of Array.isArray(children) ? children : [children]) {
        if (c === null || c === undefined) continue;
        node.appendChild(typeof c === 'string' ? document.createTextNode(c) : c);
      }
    }
    return node;
  }

  function renderCard(code, large = false) {
    if (code === 'JK') {
      return el('span', { className: `pcard suit-jk${large ? ' pcard-lg' : ''}`, text: 'JK' });
    }
    const rank = code.slice(0, -1);
    const s = code.slice(-1);
    const suitMap = { s: '♠', h: '♥', d: '♦', c: '♣' };
    return el('span', {
      className: `pcard suit-${s}${large ? ' pcard-lg' : ''}`,
      text: `${rank}${suitMap[s] || s}`
    });
  }

  function renderBoardRow(label, cards, capacity) {
    const strip = el('div', { className: 'card-strip' });
    for (const c of cards) strip.appendChild(renderCard(c));
    for (let i = cards.length; i < capacity; i++) {
      strip.appendChild(el('span', { className: 'pcard-slot', text: '·' }));
    }
    return el('div', { className: 'board-row' }, [
      el('span', { className: 'row-lbl', text: label }),
      strip
    ]);
  }

  function signed(n) {
    return n > 0 ? `+${n}` : String(n);
  }

  function fmtEv(v) {
    return `${v >= 0 ? '+' : ''}${v.toFixed(2)}pt`;
  }

  /* ---------------- Render: Quiz ---------------- */
  function renderQuiz() {
    const root = document.getElementById('quiz-root');
    if (!root) return;
    const t = COPY[lang];
    const isJa = lang === 'ja';
    const q = QUIZZES[activeQuizIdx];
    const picked = quizAnswers[q.id];
    const isAnswered = picked !== undefined;

    const solvedCorrect = QUIZZES.filter((item) => quizAnswers[item.id] === item.bestIdx).length;

    const tabList = el('div', { className: 'quiz-tab-list', role: 'tablist' });
    QUIZZES.forEach((item, idx) => {
      const ans = quizAnswers[item.id];
      const cls = [
        'quiz-tab',
        idx === activeQuizIdx ? 'active' : '',
        ans !== undefined ? (ans === item.bestIdx ? 'solved-ok' : 'solved-miss') : ''
      ]
        .filter(Boolean)
        .join(' ');
      tabList.appendChild(
        el(
          'button',
          {
            type: 'button',
            role: 'tab',
            'aria-selected': idx === activeQuizIdx ? 'true' : 'false',
            'data-quiz-tab': item.id,
            className: cls,
            onClick: () => {
              activeQuizIdx = idx;
              renderQuiz();
            }
          },
          [el('span', { className: 'tab-dot' }), el('span', { text: isJa ? item.tabJa : item.tabEn })]
        )
      );
    });

    const headerBar = el('div', { className: 'quiz-tabs' }, [
      tabList,
      el('span', { className: 'quiz-score-pill', text: t.quiz_solved_fmt(solvedCorrect, QUIZZES.length) })
    ]);

    const myCount = q.myBoard.top.length + q.myBoard.mid.length + q.myBoard.bot.length;
    const myBox = el('div', { className: 'board-box' }, [
      el('div', { className: 'board-box-title' }, [
        el('span', { text: t.quiz_my_board }),
        el('span', { text: `${myCount}/13` })
      ]),
      renderBoardRow(t.quiz_row_top, q.myBoard.top, 3),
      renderBoardRow(t.quiz_row_mid, q.myBoard.mid, 5),
      renderBoardRow(t.quiz_row_bot, q.myBoard.bot, 5)
    ]);

    const oppBox = el('div', { className: 'board-box' }, [
      el('div', { className: 'board-box-title' }, [
        el('span', { text: t.quiz_opp_board }),
        el('span', { text: q.oppCount })
      ]),
      renderBoardRow(t.quiz_row_top, q.oppBoard.top, 3),
      renderBoardRow(t.quiz_row_mid, q.oppBoard.mid, 5),
      renderBoardRow(t.quiz_row_bot, q.oppBoard.bot, 5)
    ]);

    const drawBar = el('div', { className: 'draw-bar' }, [
      el('span', { className: 'draw-label', text: t.quiz_draw_label }),
      el(
        'div',
        { className: 'card-strip' },
        q.draw.map((c) => renderCard(c, true))
      )
    ]);

    const optsWrap = el('div', { className: 'quiz-options' });
    q.options.forEach((opt, idx) => {
      const cls = ['quiz-opt-btn'];
      if (isAnswered) {
        if (idx === q.bestIdx) cls.push('is-best');
        else if (idx === picked) cls.push('is-picked-wrong');
      }
      optsWrap.appendChild(
        el(
          'button',
          {
            type: 'button',
            className: cls.join(' '),
            disabled: isAnswered,
            'data-quiz-opt': opt.label,
            onClick: () => {
              quizAnswers[q.id] = idx;
              renderQuiz();
            }
          },
          [
            el('span', { className: 'opt-letter', text: opt.label }),
            el('div', { className: 'opt-body' }, [
              el('div', { className: 'opt-name', text: isJa ? opt.nameJa : opt.nameEn }),
              el('div', { className: 'opt-move', text: isJa ? opt.moveJa : opt.moveEn })
            ])
          ]
        )
      );
    });

    const nodes = [
      headerBar,
      el('div', { className: 'quiz-meta-row' }, [
        el('span', { className: 'pill-tag pill-tag-gold', text: isJa ? q.stackJa : q.stackEn }),
        el('span', { className: 'pill-tag', text: isJa ? q.deckJa : q.deckEn }),
        el('span', { className: 'pill-tag', text: isJa ? q.streetJa : q.streetEn })
      ]),
      el('h3', { className: 'quiz-q-title', text: isJa ? q.titleJa : q.titleEn }),
      el('p', { className: 'quiz-q-sub', text: isJa ? q.subJa : q.subEn }),
      el('div', { className: 'boards-grid' }, [myBox, oppBox]),
      drawBar,
      el('div', { style: 'height:14px;' }),
      optsWrap
    ];

    if (isAnswered) {
      const isRight = picked === q.bestIdx;
      const loss = (q.options[q.bestIdx].ev - q.options[picked].ev).toFixed(2);
      const evRows = q.options.map((opt, idx) =>
        el('div', { className: `ev-row${idx === q.bestIdx ? ' ev-row-best' : ''}` }, [
          el('div', { className: 'ev-row-left' }, [
            el('span', { text: `[${opt.label}] ${isJa ? opt.nameJa : opt.nameEn}` }),
            idx === q.bestIdx ? el('span', { className: 'pill-tag pill-tag-gold', text: t.quiz_best_tag }) : null
          ]),
          el('div', { className: 'ev-row-metrics' }, [
            el('span', { className: 'ev-val', text: `EV ${fmtEv(opt.ev)}` }),
            el('span', { text: `FL ${opt.fl.toFixed(1)}%` }),
            el('span', { text: `Foul ${opt.foul.toFixed(1)}%` }),
            el('span', { text: isJa ? opt.noteJa : opt.noteEn })
          ])
        ])
      );

      const nextIdx = (activeQuizIdx + 1) % QUIZZES.length;
      const resultBox = el('div', { className: 'quiz-result', 'data-testid': 'quiz-result' }, [
        el('div', { className: 'result-verdict' }, [
          el('span', {
            className: `verdict-badge ${isRight ? 'ok' : 'miss'}`,
            text: isRight ? t.quiz_ok_badge : t.quiz_miss_badge(loss)
          }),
          el('div', { className: 'calc-btn-group' }, [
            el('button', {
              type: 'button',
              className: 'btn btn-ghost btn-sm',
              text: t.quiz_retry_btn,
              onClick: () => {
                delete quizAnswers[q.id];
                renderQuiz();
              }
            }),
            el('button', {
              type: 'button',
              className: 'btn btn-gold btn-sm',
              text: t.quiz_next_btn,
              onClick: () => {
                activeQuizIdx = nextIdx;
                renderQuiz();
              }
            })
          ])
        ]),
        el('div', { className: 'ev-table' }, evRows),
        el('div', { className: 'stack-flip-box', text: isJa ? q.flipNoteJa : q.flipNoteEn }),
        el('p', { className: 'quiz-explain', text: isJa ? q.explainJa : q.explainEn }),
        el('div', { className: 'result-footer' }, [
          el('span', { className: 'method-note', text: isJa ? q.methodJa : q.methodEn }),
          el('div', { className: 'calc-btn-group' }, [
            el('a', {
              className: 'btn btn-ghost btn-sm',
              href: WEB_APP_URL,
              target: '_blank',
              rel: 'noopener',
              text: t.quiz_web_cta
            }),
            el('a', {
              className: 'btn btn-gold btn-sm',
              href: APP_STORE_URL,
              target: '_blank',
              rel: 'noopener',
              text: t.quiz_app_cta
            })
          ])
        ])
      ]);
      nodes.push(resultBox);
    }

    root.replaceChildren(...nodes);
  }

  /* ---------------- Render: Features, Pricing, FAQ ---------------- */
  function renderFeatures() {
    const grid = document.getElementById('features-grid');
    if (!grid) return;
    const isJa = lang === 'ja';
    grid.replaceChildren(
      ...FEATURES.map((f) =>
        el('article', { className: 'feature-card' }, [
          el('div', { className: 'feature-img-wrap' }, [
            el('img', {
              className: 'feature-img',
              src: `${ASSET_BASE}assets/${f.shot}-${lang}.webp`,
              alt: isJa ? f.titleJa : f.titleEn,
              width: 660,
              height: 1434,
              loading: 'lazy',
              onClick: (e) => openLightbox(e.currentTarget.src, e.currentTarget.alt)
            })
          ]),
          el('div', { className: 'feature-body' }, [
            el('div', { className: 'feature-tag', text: isJa ? f.tagJa : f.tagEn }),
            el('h3', { className: 'feature-title', text: isJa ? f.titleJa : f.titleEn }),
            el('p', { className: 'feature-desc', text: isJa ? f.descJa : f.descEn })
          ])
        ])
      )
    );
  }

  function renderPricing() {
    const grid = document.getElementById('pricing-grid');
    if (!grid) return;
    grid.replaceChildren(
      ...PRICING[lang].map((p) => {
        const skuBlock = p.skus
          ? el(
              'div',
              { className: 'pro-sku-list' },
              p.skus.map((s) =>
                el('div', { className: 'pro-sku-row' }, [
                  el('span', { text: s.label }),
                  el('strong', { text: s.val })
                ])
              )
            )
          : null;
        return el('div', { className: `price-card${p.featured ? ' featured' : ''}` }, [
          el('div', { className: 'price-tier' }, [
            el('h3', { text: p.name }),
            p.badge ? el('span', { className: 'badge-pro', text: p.badge }) : null
          ]),
          el('div', { className: 'price-main' }, [
            p.price,
            p.unit ? el('small', { text: ` ${p.unit}` }) : null
          ]),
          el('div', { className: 'price-sub', text: p.sub }),
          skuBlock,
          el(
            'ul',
            { className: 'price-list' },
            p.items.map((txt) => el('li', null, [el('span', { className: 'chk', text: '✓' }), el('span', { text: txt })]))
          ),
          el('a', {
            className: `btn ${p.featured ? 'btn-gold' : 'btn-ghost'}`,
            href: APP_STORE_URL,
            target: '_blank',
            rel: 'noopener',
            text: p.cta
          })
        ]);
      })
    );
  }

  function renderFaqs() {
    const grid = document.getElementById('faq-grid');
    if (!grid) return;
    grid.replaceChildren(
      ...FAQS[lang].map((item) =>
        el('div', { className: 'faq-item' }, [el('h3', { text: item.q }), el('p', { text: item.a })])
      )
    );
  }

  /* ---------------- Lightbox ---------------- */
  const lightbox = document.getElementById('lightbox');
  const lightboxImg = document.getElementById('lightbox-img');

  function openLightbox(src, alt) {
    if (!lightbox || !lightboxImg) return;
    lightboxImg.src = src;
    lightboxImg.alt = alt || '';
    lightbox.classList.add('open');
  }

  function closeLightbox() {
    if (!lightbox) return;
    lightbox.classList.remove('open');
  }

  if (lightbox) {
    lightbox.addEventListener('click', closeLightbox);
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') closeLightbox();
    });
  }

  /* ---------------- Language Application ---------------- */
  function applyLang(nextLang) {
    lang = nextLang === 'en' ? 'en' : 'ja';
    document.documentElement.lang = lang;
    try {
      window.localStorage.setItem(LANG_STORAGE_KEY, lang);
    } catch (_) {
      /* ignore */
    }
    const t = COPY[lang];
    document.title = t.page_title;

    document.querySelectorAll('[data-i18n]').forEach((node) => {
      const key = node.getAttribute('data-i18n');
      if (t[key] !== undefined) node.textContent = t[key];
    });
    document.querySelectorAll('[data-i18n-html]').forEach((node) => {
      const key = node.getAttribute('data-i18n-html');
      if (t[key] !== undefined) node.innerHTML = t[key];
    });

    document.querySelectorAll('[data-shot]').forEach((img) => {
      const name = img.getAttribute('data-shot');
      img.src = `${ASSET_BASE}assets/${name}-${lang}.webp`;
    });
    document.querySelectorAll('[data-chart]').forEach((img) => {
      const name = img.getAttribute('data-chart');
      img.src = `${ASSET_BASE}assets/${name}-${lang}.webp`;
    });

    document.querySelectorAll('.lang-btn').forEach((btn) => {
      btn.classList.toggle('active', btn.getAttribute('data-lang') === lang);
    });

    renderQuiz();
    renderFeatures();
    renderPricing();
    renderFaqs();
  }

  /* ---------------- Init ---------------- */
  document.querySelectorAll('.lang-btn').forEach((btn) => {
    btn.addEventListener('click', () => applyLang(btn.getAttribute('data-lang')));
  });

  document.querySelectorAll('.hero-shot, .hero-shot-secondary, .chart-img').forEach((img) => {
    img.addEventListener('click', () => openLightbox(img.src, img.alt));
  });

  applyLang(lang);
})();
