// ===== ステージデータ =====
let stages = []; // stages.jsonから読み込む
let currentStageId = 'ai'; // 現在選択されているステージID

// ===== キャラクターデータ =====
const characters = [
  {
    id: 'fire',
    name: 'フレア',
    type: '炎タイプ',
    color: '#ff6b6b',
    description: '情熱的で行動力がある',
    gradients: {
      stage1: 'linear-gradient(135deg, #ff6b6b 0%, #ff8e53 100%)',
      stage2: 'linear-gradient(135deg, #ff6b6b 0%, #ff8e53 50%, #ffd93d 100%)',
      stage3: 'linear-gradient(135deg, #ff0844 0%, #ff6b6b 25%, #ff8e53 50%, #ffab00 75%, #ffd93d 100%)'
    }
  },
  {
    id: 'water',
    name: 'アクア',
    type: '水タイプ',
    color: '#4ecdc4',
    description: '冷静で思慮深い',
    gradients: {
      stage1: 'linear-gradient(135deg, #4ecdc4 0%, #3498db 100%)',
      stage2: 'linear-gradient(135deg, #4ecdc4 0%, #3498db 50%, #667eea 100%)',
      stage3: 'linear-gradient(135deg, #00d2ff 0%, #4ecdc4 25%, #3498db 50%, #667eea 75%, #764ba2 100%)'
    }
  },
  {
    id: 'leaf',
    name: 'リーフ',
    type: '草タイプ',
    color: '#51cf66',
    description: '優しくて創造的',
    gradients: {
      stage1: 'linear-gradient(135deg, #51cf66 0%, #38d39f 100%)',
      stage2: 'linear-gradient(135deg, #51cf66 0%, #38d39f 50%, #26de81 100%)',
      stage3: 'linear-gradient(135deg, #7bed9f 0%, #51cf66 25%, #38d39f 50%, #26de81 75%, #20bf6b 100%)'
    }
  }
];

// ===== 問題形式システム（プラグイン構造） =====

// 基底クラス：すべての問題形式の共通インターフェース
class QuestionType {
  constructor(questionData) {
    this.data = questionData;
    this.container = null;
  }

  // 問題を描画（サブクラスで実装必須）
  render(container) {
    throw new Error('render() must be implemented');
  }

  // ユーザーの回答を取得（サブクラスで実装必須）
  getAnswer() {
    throw new Error('getAnswer() must be implemented');
  }

  // 正誤判定（サブクラスで実装必須）
  validate(userAnswer) {
    throw new Error('validate() must be implemented');
  }

  // 正解の回答を取得（サブクラスで実装必須）
  getCorrectAnswer() {
    throw new Error('getCorrectAnswer() must be implemented');
  }

  // 回答後の結果表示（サブクラスで実装必須）
  showResult(isCorrect, userAnswer) {
    throw new Error('showResult() must be implemented');
  }
}

// 単一選択問題（従来の4択問題）
class SingleChoiceQuestion extends QuestionType {
  render(container) {
    this.container = container;
    container.innerHTML = '';

    const labels = ['A', 'B', 'C', 'D', 'E', 'F'];

    this.data.options.forEach((option, index) => {
      const btn = document.createElement('button');
      btn.className = 'answer-btn';
      btn.dataset.index = index;

      // インデックスラベルを追加
      const label = document.createElement('span');
      label.className = 'answer-label';
      label.textContent = labels[index];

      const text = document.createElement('span');
      text.className = 'answer-text';
      text.textContent = option;

      btn.appendChild(label);
      btn.appendChild(text);
      container.appendChild(btn);
    });
  }

  getAnswer() {
    // クリックされたボタンのindexを返す（クリックイベントで設定される）
    const selected = this.container.querySelector('.answer-btn.selected');
    return selected ? parseInt(selected.dataset.index) : null;
  }

  validate(userAnswer) {
    return userAnswer === this.data.correct;
  }

  getCorrectAnswer() {
    return this.data.correct;
  }

  showResult(isCorrect, userAnswer) {
    const buttons = this.container.querySelectorAll('.answer-btn');
    buttons.forEach(btn => btn.disabled = true);

    if (isCorrect) {
      buttons[userAnswer].classList.add('correct');
    } else {
      buttons[userAnswer].classList.add('incorrect');
      buttons[this.data.correct].classList.add('correct');
    }
  }
}

// 複数選択問題（チェックボックス形式）
class MultipleChoiceQuestion extends QuestionType {
  render(container) {
    this.container = container;
    container.innerHTML = '';

    // 説明文を追加
    const instruction = document.createElement('div');
    instruction.className = 'question-instruction';
    instruction.textContent = '※ 正しいものをすべて選んでください';
    container.appendChild(instruction);

    // チェックボックス付きの選択肢
    const labels = ['A', 'B', 'C', 'D', 'E', 'F'];

    this.data.options.forEach((option, index) => {
      const btn = document.createElement('button');
      btn.className = 'answer-btn checkbox-btn';
      btn.dataset.index = index;

      // インデックスラベルを追加
      const label = document.createElement('span');
      label.className = 'answer-label';
      label.textContent = labels[index];

      const checkbox = document.createElement('span');
      checkbox.className = 'checkbox';
      checkbox.textContent = '☐';

      const text = document.createElement('span');
      text.className = 'option-text';
      text.textContent = option;

      btn.appendChild(label);
      btn.appendChild(checkbox);
      btn.appendChild(text);
      container.appendChild(btn);
    });

    // 決定ボタン
    const submitBtn = document.createElement('button');
    submitBtn.className = 'submit-btn';
    submitBtn.textContent = '回答する';
    submitBtn.id = 'submit-multiple-choice';
    container.appendChild(submitBtn);
  }

  getAnswer() {
    // 選択されたすべてのindexを配列で返す
    const selected = this.container.querySelectorAll('.answer-btn.selected');
    return Array.from(selected).map(btn => parseInt(btn.dataset.index));
  }

  validate(userAnswer) {
    // 配列の内容が一致するか確認
    if (userAnswer.length !== this.data.correct.length) return false;
    const sortedUser = [...userAnswer].sort((a, b) => a - b);
    const sortedCorrect = [...this.data.correct].sort((a, b) => a - b);
    return sortedUser.every((val, idx) => val === sortedCorrect[idx]);
  }

  getCorrectAnswer() {
    return this.data.correct;
  }

  showResult(isCorrect, userAnswer) {
    const buttons = this.container.querySelectorAll('.answer-btn');
    const submitBtn = this.container.querySelector('.submit-btn');

    buttons.forEach(btn => btn.disabled = true);
    if (submitBtn) submitBtn.style.display = 'none';

    const correctAnswers = this.data.correct;

    buttons.forEach((btn, index) => {
      const isSelected = userAnswer.includes(index);
      const isCorrectOption = correctAnswers.includes(index);

      if (isSelected && isCorrectOption) {
        btn.classList.add('correct');
      } else if (isSelected && !isCorrectOption) {
        btn.classList.add('incorrect');
      } else if (!isSelected && isCorrectOption) {
        btn.classList.add('correct', 'missed');
      }
    });
  }
}


// 問題形式のレジストリ（新しい形式を追加する場合はここに登録）
const questionTypes = {
  'single-choice': SingleChoiceQuestion,
  'multiple-choice': MultipleChoiceQuestion,
  // 将来追加予定：
  // 'swipe': SwipeQuestion,         // スワイプ仕分け
  // 'typing': TypingQuestion,       // タイピング
  // 'matching': MatchingQuestion    // マッチング
};

// 問題形式のファクトリー関数
function createQuestion(questionData) {
  const QuestionClass = questionTypes[questionData.type || 'single-choice'];
  if (!QuestionClass) {
    console.error(`Unknown question type: ${questionData.type}`);
    return new SingleChoiceQuestion(questionData);
  }
  return new QuestionClass(questionData);
}

// ===== クイズデータ（JSONから読み込み） =====
let quizData = [];

// ステージ設定を読み込む関数
async function loadStages() {
  try {
    const response = await fetch('/data/stages.json');
    stages = await response.json();
    console.log(`✅ ステージデータ読み込み完了: ${stages.length}ステージ`);
    return true;
  } catch (error) {
    console.error('❌ ステージデータの読み込みに失敗:', error);
    return false;
  }
}

// 選択されたステージのクイズデータを読み込んで変換する関数
async function loadQuizData(stageId = 'ai') {
  try {
    // ステージIDが指定されていない場合は現在のステージを使用
    const targetStageId = stageId || currentStageId;
    currentStageId = targetStageId;

    // ステージ情報を取得
    const stage = stages.find(s => s.id === targetStageId);
    if (!stage) {
      console.error(`❌ ステージが見つかりません: ${targetStageId}`);
      return false;
    }

    console.log(`📚 クイズデータ読み込み開始: ${stage.name} (${stage.quizFile})`);

    const response = await fetch(`/data/quizzes/${stage.quizFile}`);
    const jsonData = await response.json();

    // sortタイプの問題を除外してから変換
    const filteredData = jsonData.filter(quiz => quiz.type !== 'sort');
    console.log(`📝 並び替え問題を除外: ${jsonData.length}問 → ${filteredData.length}問`);

    // JSONの形式を内部形式に変換
    quizData = filteredData.map((quiz, index) => {
      // type を変換
      let type = quiz.type;
      if (type === 'single') type = 'single-choice';
      if (type === 'multiple') type = 'multiple-choice';

      // データの整合性チェック
      if (!quiz.answer) {
        console.error(`❌ 問題 ${index} に answer がありません:`, quiz);
      }

      // answer を correct（インデックス）に変換
      let correct;

      if (type === 'single-choice') {
        // answerの文字列をoptionsの中で探してインデックスを取得
        correct = quiz.options.indexOf(quiz.answer);
      } else if (type === 'multiple-choice') {
        // answerの配列の各要素をoptionsの中で探してインデックス配列を取得
        correct = quiz.answer.map(ans => quiz.options.indexOf(ans));
      }

      return {
        type: type,
        question: quiz.question,
        options: quiz.options,
        correct: correct,
        category: stage.name,
        minLevel: quiz.minLevel || 1 // minLevelがない場合は1
      };
    });

    console.log(`✅ クイズデータ読み込み完了: ${quizData.length}問`);
    console.log(`   レベル別内訳:`, quizData.reduce((acc, q) => {
      acc[`Lv${q.minLevel}`] = (acc[`Lv${q.minLevel}`] || 0) + 1;
      return acc;
    }, {}));
    return true;
  } catch (error) {
    console.error('❌ クイズデータの読み込みに失敗:', error);
    return false;
  }
}

// ===== スキルデータ（AI活用スキル6項目） =====
const skills = [
  { id: 'grammar', name: 'プロンプト基礎', icon: '📝', category: '文法', angle: 0, locked: false },
  { id: 'vocabulary', name: 'AI用語', icon: '📚', category: '語彙', angle: 60, locked: false },
  { id: 'structure', name: '指示構造化', icon: '🏗️', category: '構成', angle: 120, locked: false },
  { id: 'expression', name: '効果的表現', icon: '✨', category: '表現', angle: 180, locked: false },
  { id: 'logic', name: '論理的思考', icon: '🧠', category: '論理', angle: 240, locked: false },
  { id: 'editing', name: 'プロンプト改善', icon: '🔍', category: '推敲', angle: 300, locked: false }
];

// 他のジャンルのスキル（ロック済み）
const lockedSkills = [
  { id: 'writing1', name: 'ライティング1', icon: '✍️', angle: 0, locked: true },
  { id: 'writing2', name: 'ライティング2', icon: '📖', angle: 60, locked: true },
  { id: 'image1', name: '画像生成1', icon: '🎨', angle: 120, locked: true },
  { id: 'image2', name: '画像生成2', icon: '🖼️', angle: 180, locked: true },
  { id: 'video', name: '動画編集', icon: '🎬', angle: 240, locked: true },
  { id: 'advanced', name: '応用', icon: '🚀', angle: 300, locked: true }
];

// ===== 装備品データ =====
const equipmentList = [
  { id: 'pen1', name: '木のペン', icon: '🖊️', unlockLevel: 1, bonus: 5 },
  { id: 'pen2', name: '銀のペン', icon: '🖋️', unlockLevel: 3, bonus: 10 },
  { id: 'pen3', name: '金のペン', icon: '✒️', unlockLevel: 5, bonus: 15 },
  { id: 'book1', name: '初心者の本', icon: '📕', unlockLevel: 2, bonus: 5 },
  { id: 'book2', name: '上級者の本', icon: '📘', unlockLevel: 4, bonus: 10 },
  { id: 'glasses', name: '知恵の眼鏡', icon: '👓', unlockLevel: 6, bonus: 20 }
];

// ===== ゲーム状態 =====
const gameState = {
  selectedCharacter: null,
  playerName: '', // プレイヤーの名前
  characterName: '', // キャラクターの名前
  hasHatched: false, // 孵化済みかどうか
  needsHatchAnimation: false, // 孵化演出を表示する必要があるか
  level: 1, // 廃止予定：後方互換性のため残す
  exp: 0,
  maxExp: 100,
  score: 0,
  combo: 0,
  maxCombo: 0,
  totalAnswers: 0,
  correctAnswers: 0,
  sessionCorrectAnswers: 0, // このセッションの正解数
  timeLeft: 60,
  currentQuestionIndex: 0,
  usedQuestions: [],
  shuffledQuestionIndexes: [], // シャッフルされた問題のインデックス配列
  currentShuffleIndex: 0, // 現在のシャッフル配列内のインデックス
  isPlaying: false,
  equipment: [],
  // ステージごとのレベル管理
  stageLevels: {
    ai: { level: 1, exp: 0, maxExp: 100 },
    writing: { level: 1, exp: 0, maxExp: 100 },
    design: { level: 1, exp: 0, maxExp: 100 },
    marketing: { level: 1, exp: 0, maxExp: 100 },
    coding: { level: 1, exp: 0, maxExp: 100 },
    other: { level: 1, exp: 0, maxExp: 100 }
  }
};

// ===== 音響システム（SoundManager） =====
class SoundManager {
  constructor() {
    // 音量設定
    this.masterVolume = 0.7;
    this.bgmVolume = 0.5;
    this.seVolume = 0.8;

    // BGMチャンネル（常に1曲のみ）
    this.currentBGM = null;
    this.bgmTracks = {};

    // SEチャンネル（複数同時再生可能）
    this.seTracks = {};

    this.initialized = false;
  }

  // 初期化: 音源を読み込む
  init() {
    if (this.initialized) return;

    console.log('🎵 SoundManager initializing...');

    // BGMトラックを登録
    this.bgmTracks.play = new Howl({
      src: ['/audio/bgm_play.mp3'],
      loop: true,
      volume: 0,
      preload: true,
      onload: () => console.log('✅ BGM: play (character select) loaded'),
      onloaderror: (id, error) => console.error('❌ BGM: play load error:', error)
    });

    this.bgmTracks.correct = new Howl({
      src: ['/audio/bgm_correct.mp3'],
      loop: true,
      volume: 0,
      preload: true,
      onload: () => console.log('✅ BGM: correct (quiz play) loaded'),
      onloaderror: (id, error) => console.error('❌ BGM: correct load error:', error)
    });

    this.bgmTracks.main = new Howl({
      src: ['/audio/bgm_main.mp3'],
      loop: true,
      volume: 0,
      preload: true,
      onload: () => console.log('✅ BGM: main (result) loaded'),
      onloaderror: (id, error) => console.error('❌ BGM: main load error:', error)
    });

    // SEトラックを登録
    this.seTracks.click = new Howl({
      src: ['/audio/se_click.mp3'],
      volume: this.masterVolume * this.seVolume,
      preload: true,
      onload: () => console.log('✅ SE: click loaded'),
      onloaderror: (id, error) => console.error('❌ SE: click load error:', error)
    });

    this.seTracks.resultEntry = new Howl({
      src: ['/audio/se_result_entry.mp3'],
      volume: this.masterVolume * this.seVolume,
      preload: true,
      onload: () => console.log('✅ SE: resultEntry loaded'),
      onloaderror: (id, error) => console.error('❌ SE: resultEntry load error:', error)
    });

    this.initialized = true;
    console.log('✅ SoundManager initialized');
  }

  // BGM再生: 古いBGMを確実に停止してから新しいBGMを再生
  playBGM(trackName, force = false) {
    const nextBGM = this.bgmTracks[trackName];

    if (!nextBGM) {
      console.error(`❌ BGM track "${trackName}" not found`);
      return;
    }

    // すでに再生中の同じBGMの場合は何もしない（forceフラグがfalseの場合）
    if (!force && this.currentBGM === nextBGM && nextBGM.playing()) {
      console.log(`✅ BGM "${trackName}" is already playing (volume: ${nextBGM.volume().toFixed(2)})`);
      return;
    }

    console.log(`🎵 Switching to BGM: ${trackName}${force ? ' (forced restart)' : ''}`);

    // 【重要】古いBGMを確実に停止
    if (this.currentBGM) {
      console.log(`   ⏹️ Stopping previous BGM`);
      this.currentBGM.stop();
    }

    // 新しいBGMを固定音量で再生開始
    this.currentBGM = nextBGM;
    const targetVolume = this.masterVolume * this.bgmVolume;
    nextBGM.volume(targetVolume);
    nextBGM.play();
    console.log(`   ▶️ BGM "${trackName}" started at fixed volume: ${targetVolume.toFixed(2)}`);
    console.log(`   🔒 BGM volume locked (will not change during SE playback)`);
  }

  // BGM停止
  stopBGM() {
    if (this.currentBGM) {
      console.log(`⏹️ Stopping BGM`);
      this.currentBGM.stop();
      this.currentBGM = null;
    }
  }

  // SE再生: BGMと完全に独立して同時再生
  playSE(trackName) {
    const se = this.seTracks[trackName];

    if (!se) {
      console.error(`❌ SE track "${trackName}" not found`);
      return;
    }

    // 【重要】BGM音量には一切触らず、SEのみ再生
    console.log(`🔊 Playing SE: ${trackName} (BGM unchanged)`);
    const volume = this.masterVolume * this.seVolume;
    se.volume(volume);
    se.play();

    // BGMの音量が変わっていないことを確認（デバッグ用）
    if (this.currentBGM && this.currentBGM.playing()) {
      const bgmVolume = this.currentBGM.volume();
      console.log(`   BGM volume: ${bgmVolume.toFixed(2)} (unchanged)`);
    }
  }

  // マスター音量設定
  setMasterVolume(volume) {
    this.masterVolume = volume;
    this.updateVolumes();
  }

  // BGM音量設定
  setBGMVolume(volume) {
    this.bgmVolume = volume;
    if (this.currentBGM) {
      const newVolume = this.masterVolume * this.bgmVolume;
      this.currentBGM.volume(newVolume);
      console.log(`🎚️ BGM volume updated: ${newVolume.toFixed(2)}`);
    }
  }

  // SE音量設定
  setSEVolume(volume) {
    this.seVolume = volume;
    console.log(`🎚️ SE volume updated: ${(this.masterVolume * this.seVolume).toFixed(2)}`);
  }

  // 音量を更新（マスター音量変更時）
  updateVolumes() {
    // BGMの音量を更新
    if (this.currentBGM) {
      const newBGMVolume = this.masterVolume * this.bgmVolume;
      this.currentBGM.volume(newBGMVolume);
      console.log(`🎚️ Master volume changed - BGM: ${newBGMVolume.toFixed(2)}`);
    }

    // SEの音量を更新（次回再生時に反映される）
    const newSEVolume = this.masterVolume * this.seVolume;
    Object.values(this.seTracks).forEach(se => {
      se.volume(newSEVolume);
    });
    console.log(`🎚️ Master volume changed - SE: ${newSEVolume.toFixed(2)}`);
  }
}

// グローバルインスタンスを作成
const soundManager = new SoundManager();

// ===== ローカルストレージ =====
function saveGameData() {
  const data = {
    selectedCharacter: gameState.selectedCharacter,
    playerName: gameState.playerName,
    characterName: gameState.characterName,
    hasHatched: gameState.hasHatched,
    level: gameState.level,
    exp: gameState.exp,
    maxCombo: gameState.maxCombo,
    totalAnswers: gameState.totalAnswers,
    correctAnswers: gameState.correctAnswers,
    stageLevels: gameState.stageLevels, // ステージごとのレベルを保存
    equipment: gameState.equipment
  };
  localStorage.setItem('tsumqma_save', JSON.stringify(data));
}

function loadGameData() {
  const saved = localStorage.getItem('tsumqma_save');
  if (saved) {
    const data = JSON.parse(saved);
    gameState.selectedCharacter = data.selectedCharacter;
    gameState.playerName = data.playerName || ''; // プレイヤー名（なければ空文字）
    gameState.characterName = data.characterName || '';
    gameState.hasHatched = data.hasHatched || false;
    gameState.level = data.level || 1;
    gameState.exp = data.exp || 0;
    gameState.maxCombo = data.maxCombo || 0;
    gameState.totalAnswers = data.totalAnswers || 0;
    gameState.correctAnswers = data.correctAnswers || 0;
    gameState.equipment = data.equipment || [];

    // ステージごとのレベルを読み込み（後方互換性のため古いデータも対応）
    if (data.stageLevels) {
      gameState.stageLevels = data.stageLevels;
    } else {
      // 古いセーブデータの場合、AIレベルに移行
      gameState.stageLevels = {
        ai: { level: data.level || 1, exp: data.exp || 0, maxExp: 100 },
        writing: { level: 1, exp: 0, maxExp: 100 },
        design: { level: 1, exp: 0, maxExp: 100 },
        marketing: { level: 1, exp: 0, maxExp: 100 },
        coding: { level: 1, exp: 0, maxExp: 100 },
        other: { level: 1, exp: 0, maxExp: 100 }
      };
    }

    // ロード後、全体レベルを全ステージの合計レベルの8割として再計算
    const allStageLevels = Object.values(gameState.stageLevels).map(s => s.level);
    const totalLevel = allStageLevels.reduce((sum, level) => sum + level, 0);
    const calculatedLevel = Math.floor(totalLevel * 0.8);
    gameState.level = calculatedLevel;

    return true;
  }
  return false;
}

// ===== 画面切り替え =====
function showScreen(screenId) {
  console.log(`📺 showScreen() 呼び出し: ${screenId}`);

  const allScreens = document.querySelectorAll('.screen');
  console.log(`📺 全画面数: ${allScreens.length}`);

  allScreens.forEach(screen => {
    screen.classList.remove('active');
  });

  const targetScreen = document.getElementById(screenId);
  if (targetScreen) {
    targetScreen.classList.add('active');
    console.log(`✅ 画面 "${screenId}" をアクティブ化しました`);
  } else {
    console.error(`❌ 画面 "${screenId}" が見つかりません`);
  }
}

// ===== ジャンル選択画面 =====
function initGenreSelect() {
  const grid = document.getElementById('genre-grid');
  grid.innerHTML = '';

  stages.forEach(genre => {
    const card = document.createElement('div');
    card.className = 'genre-card';

    if (genre.locked) {
      card.classList.add('locked');
    }
    if (genre.active) {
      card.classList.add('active');
    }

    card.innerHTML = `
      ${genre.locked ? '<div class="genre-lock">🔒</div>' : ''}
      <div class="genre-icon">${genre.icon}</div>
      <div class="genre-name">${genre.name}</div>
      <div class="genre-description">${genre.description}</div>
      ${genre.comingSoon ? '<div class="genre-coming-soon">Coming Soon</div>' : ''}
    `;

    if (!genre.locked) {
      card.addEventListener('click', () => {
        soundManager.playSE('click');
        console.log(`📺 Screen: genre-select → character-select (${genre.id})`);
        showScreen('character-select');
        initCharacterSelect();
        soundManager.playBGM('main'); // キャラ選択画面のBGM
      });
    }

    grid.appendChild(card);
  });
}

// ===== キャラクター選択画面 =====
function initCharacterSelect() {
  const grid = document.getElementById('character-grid');
  grid.innerHTML = '';

  characters.forEach(char => {
    const card = document.createElement('div');
    card.className = 'character-card';
    card.style.borderColor = char.color;

    // グラデーションアイコンを作成
    const iconDiv = document.createElement('div');
    iconDiv.className = 'character-icon';
    iconDiv.style.background = char.gradients.stage1;
    iconDiv.style.width = '80px';
    iconDiv.style.height = '80px';
    iconDiv.style.borderRadius = '50%';
    iconDiv.style.margin = '0 auto 15px';
    iconDiv.style.boxShadow = `0 4px 12px ${char.color}40`;

    card.appendChild(iconDiv);
    card.innerHTML += `
      <div class="character-card-name">${char.name}</div>
      <div class="character-card-type">${char.type}</div>
      <div class="character-card-desc">${char.description}</div>
    `;

    card.addEventListener('click', () => {
      soundManager.playSE('click');
      document.querySelectorAll('.character-card').forEach(c => c.classList.remove('selected'));
      card.classList.add('selected');
      gameState.selectedCharacter = char;
      setTimeout(() => {
        console.log('📺 Screen: character-select → main-page');
        saveGameData();
        showScreen('main-page');
        soundManager.playBGM('play', true); // メイン画面のBGMに切り替え（強制再スタート）
        initMainPage();
      }, 500);
    });

    grid.appendChild(card);
  });
}

// ===== 経験値とレベルアップ =====
function gainExp(amount) {
  // 現在プレイ中のステージのレベルと経験値を更新
  const stageId = currentStageId || 'ai';
  const stageLevel = gameState.stageLevels[stageId];

  if (!stageLevel) {
    console.error(`❌ ステージレベルが見つかりません: ${stageId}`);
    return false;
  }

  stageLevel.exp += amount;
  let leveledUp = false;

  while (stageLevel.exp >= stageLevel.maxExp) {
    stageLevel.exp -= stageLevel.maxExp;
    stageLevel.level++;
    stageLevel.maxExp = Math.floor(stageLevel.maxExp * 1.5);
    soundManager.playSE('resultEntry');

    // 全体プレイヤーレベルを全ステージの合計レベルの8割に更新
    const allStageLevels = Object.values(gameState.stageLevels).map(s => s.level);
    const totalLevel = allStageLevels.reduce((sum, level) => sum + level, 0);
    const calculatedLevel = Math.floor(totalLevel * 0.8);
    gameState.level = calculatedLevel;

    // 現在プレイ中のステージの経験値を全体にも反映（表示用）
    gameState.exp = stageLevel.exp;
    gameState.maxExp = stageLevel.maxExp;

    // 装備アンロックチェック（全体レベルに基づく）
    checkEquipmentUnlock();

    // Lv.5到達時に孵化フラグを設定（実際の演出はリザルト画面で表示）
    if (stageLevel.level === 5 && !gameState.hasHatched) {
      gameState.hasHatched = true;
      gameState.needsHatchAnimation = true; // リザルト画面で孵化演出を表示するフラグ
      console.log('🥚 孵化条件達成！リザルト画面で演出を表示します');
    }

    updateCharacterDisplay(); // レベルアップ時にキャラクター表示を更新
    leveledUp = true;
  }

  console.log(`📈 ${stageId}スキル経験値獲得: +${amount} (Lv.${stageLevel.level} ${stageLevel.exp}/${stageLevel.maxExp})`);
  return leveledUp;
}

function checkEquipmentUnlock() {
  equipmentList.forEach(item => {
    if (item.unlockLevel === gameState.level && !gameState.equipment.includes(item.id)) {
      gameState.equipment.push(item.id);
    }
  });
}

function gainSkillExp(category, amount) {
  const skillMap = {
    '文法': 'grammar',
    '語彙': 'vocabulary',
    '構成': 'structure',
    '表現': 'expression',
    '論理': 'logic',
    '推敲': 'editing'
  };
  const skillId = skillMap[category];

  if (!skillId || !gameState.skillLevels[skillId]) return;

  const skill = gameState.skillLevels[skillId];
  skill.exp += amount;

  if (skill.exp >= skill.maxExp) {
    skill.exp -= skill.maxExp;
    skill.level++;
    skill.maxExp = Math.floor(skill.maxExp * 1.3);
  }
}

function updateExpBar() {
  const expBar = document.getElementById('exp-bar');
  const currentExpEl = document.getElementById('current-exp');
  const maxExpEl = document.getElementById('max-exp');
  const levelEl = document.getElementById('player-level');

  // 現在プレイ中のステージのレベルと経験値を表示
  const stageId = currentStageId || 'ai';
  const stageLevel = gameState.stageLevels[stageId];

  if (stageLevel) {
    const percentage = (stageLevel.exp / stageLevel.maxExp) * 100;
    expBar.style.width = percentage + '%';
    currentExpEl.textContent = stageLevel.exp;
    maxExpEl.textContent = stageLevel.maxExp;
    levelEl.textContent = stageLevel.level;
  }
}

// ===== 孵化演出 =====
function showHatchAnimation() {
  const hatchModal = document.getElementById('hatch-modal');
  const hatchMessage = document.getElementById('hatch-message');
  const hatchCharacterImage = document.getElementById('hatch-character-image');
  const hatchCelebration = document.getElementById('hatch-celebration');
  const nameInputContainer = document.getElementById('name-input-container');

  if (!hatchModal || !gameState.selectedCharacter) return;

  // モーダルを表示
  hatchModal.classList.add('active');
  soundManager.playSE('click');

  // 初期状態設定
  hatchMessage.style.display = 'block';
  hatchMessage.textContent = 'おや…？ 卵の様子が…！';
  hatchCharacterImage.innerHTML = '';
  hatchCelebration.style.display = 'none';
  nameInputContainer.style.display = 'none';

  const char = gameState.selectedCharacter;
  const eggPath = getCharacterImagePath(char, 0); // 卵画像
  const hatchedPath = getCharacterImagePath(char, 5); // 孵化後画像

  // ステップ1: 卵を表示（揺れるアニメーション）
  hatchCharacterImage.innerHTML = `<img src="${eggPath}" alt="卵" class="hatch-egg-shake">`;

  // ステップ2: 2秒後に孵化
  setTimeout(() => {
    hatchCharacterImage.innerHTML = `<img src="${hatchedPath}" alt="${char.name}" class="hatch-character-appear">`;
    hatchMessage.style.display = 'none';
    hatchCelebration.style.display = 'block';
    soundManager.playSE('correct');
  }, 2000);

  // ステップ3: 3秒後に名前入力フォーム表示
  setTimeout(() => {
    hatchCelebration.style.display = 'none';
    nameInputContainer.style.display = 'block';

    // 名前入力フォーカス
    const nameInput = document.getElementById('character-name-input');
    if (nameInput) {
      nameInput.value = '';
      nameInput.focus();
    }
  }, 5000);
}

// 名前確定処理
function confirmCharacterName() {
  const nameInput = document.getElementById('character-name-input');
  const hatchModal = document.getElementById('hatch-modal');

  if (!nameInput || !hatchModal) return;

  const name = nameInput.value.trim();

  if (name.length === 0) {
    alert('名前を入力してください');
    return;
  }

  // 名前を保存
  gameState.characterName = name;
  saveGameData();

  // キャラクター名表示を更新
  updateCharacterDisplay();

  // モーダルを閉じる
  hatchModal.classList.remove('active');
  soundManager.playSE('click');

  // メイン画面を再初期化して画像を確実に更新
  const mainPage = document.getElementById('main-page');
  if (mainPage && mainPage.classList.contains('active')) {
    console.log('🔄 孵化完了：メイン画面を更新');
    initMainPage();
  }
}

// ===== キャラクター進化・画像システム =====
// キャラクターの画像バージョンを決定
function getCharacterImageVersion(level) {
  if (level >= 0 && level <= 4) return 0; // 卵
  if (level >= 5 && level <= 24) return 1; // 孵化後
  if (level >= 25 && level <= 49) return 2; // 進化1（将来用）
  if (level >= 50 && level <= 74) return 3; // 進化2（将来用）
  if (level >= 75 && level <= 99) return 4; // 進化3（将来用）
  return 5; // 最終進化（将来用）
}

// キャラクターIDから画像の色を取得
function getCharacterColor(characterId) {
  const colorMap = {
    'fire': 'red',
    'water': 'blue',
    'leaf': 'green'
  };
  return colorMap[characterId] || 'blue';
}

// キャラクター画像のパスを取得
function getCharacterImagePath(character, level) {
  if (!character) return '';

  const color = getCharacterColor(character.id);
  const version = getCharacterImageVersion(level);

  // v2以降の画像がまだない場合はv1を使用
  const actualVersion = version > 1 ? 1 : version;

  return `/images/char_${color}_v${actualVersion}.png`;
}

// キャラクタージャンプアニメーションを発動
function triggerCharacterJump() {
  const characterImages = document.querySelectorAll('.character-image, .character-image-main');

  characterImages.forEach(img => {
    // 既存のジャンプクラスを削除
    img.classList.remove('character-jump');

    // 再描画を強制してアニメーションをリセット
    void img.offsetWidth;

    // ジャンプクラスを追加
    img.classList.add('character-jump');

    // アニメーション終了後にクラスを削除
    setTimeout(() => {
      img.classList.remove('character-jump');
    }, 600); // アニメーション時間と同じ
  });
}

// ===== キャラクター進化システム =====
function getEvolutionStage(level) {
  if (level >= 7) return 'stage3';
  if (level >= 4) return 'stage2';
  return 'stage1';
}

// キャラクターアイコンとグラデーションを取得
function getCharacterGradient(icon, level) {
  // グラデーションではなく、アイコンそのものを返す
  return icon;
}

function updateCharacterDisplay() {
  if (!gameState.selectedCharacter) return;

  const char = gameState.selectedCharacter;
  // 全ステージの最高レベルを使用してキャラクター画像を決定
  const maxLevel = Math.max(...Object.values(gameState.stageLevels).map(s => s.level));
  const imagePath = getCharacterImagePath(char, maxLevel);

  // ゲーム画面のキャラクター表示
  const avatarEl = document.getElementById('character-avatar');
  if (avatarEl) {
    avatarEl.innerHTML = `<img src="${imagePath}" alt="${char.name}" class="character-image">`;
  }

  // メイン画面のキャラクター表示
  const mainAvatarEl = document.getElementById('main-character-avatar');
  if (mainAvatarEl) {
    mainAvatarEl.innerHTML = `<img src="${imagePath}" alt="${char.name}" class="character-image-main">`;
  }

  // キャラクター名の表示
  const characterNameEl = document.getElementById('main-character-name');
  if (characterNameEl && gameState.characterName) {
    characterNameEl.textContent = gameState.characterName;
  } else if (characterNameEl) {
    characterNameEl.textContent = char.name;
  }
}

// ===== クイズ画面 =====
// Fisher-Yatesシャッフルアルゴリズム
function shuffleArray(array) {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

function startQuiz() {
  console.log('🎮 startQuiz() called');

  // データが正しく読み込まれているか確認
  if (!quizData || quizData.length === 0) {
    console.error('❌ quizData が空です。データを再読み込みします...');
    alert('問題データが読み込まれていません。ページを再読み込みしてください。');
    return;
  }

  console.log(`✅ quizData loaded: ${quizData.length} questions`);

  showScreen('game-screen');
  // クイズプレイ中のBGMに切り替え
  soundManager.playBGM('correct');

  const char = gameState.selectedCharacter;
  const displayName = gameState.characterName || char.name;
  document.getElementById('character-name').textContent = displayName;

  // セッションごとの統計をリセット
  gameState.score = 0;
  gameState.combo = 0;
  gameState.timeLeft = 60;
  gameState.currentQuestionIndex = 0;
  gameState.usedQuestions = [];
  gameState.isPlaying = true;
  gameState.sessionCorrectAnswers = 0; // このセッションの正解数

  // 全体レベルを表示（平均レベル）
  document.getElementById('player-level').textContent = gameState.level;
  updateExpBar();
  updateScore();
  updateCharacterDisplay(); // キャラクター表示を更新

  // レベル別にフィルタリングして問題をシャッフル
  const stageId = currentStageId || 'ai';
  const stageLevel = gameState.stageLevels[stageId]?.level || 1;
  const levelFilteredQuizzes = quizData
    .map((quiz, index) => ({ quiz, index }))
    .filter(item => item.quiz.minLevel <= stageLevel);

  console.log(`🎲 問題シャッフル開始`);
  console.log(`   現在のステージ: ${stageId}`);
  console.log(`   現在のレベル: Lv${stageLevel}`);
  console.log(`   全問題数: ${quizData.length}問`);
  console.log(`   利用可能な問題数: ${levelFilteredQuizzes.length}問`);

  // インデックス配列をシャッフル
  gameState.shuffledQuestionIndexes = shuffleArray(levelFilteredQuizzes.map(item => item.index));
  gameState.currentShuffleIndex = 0;

  console.log(`✅ 問題シャッフル完了: ${gameState.shuffledQuestionIndexes.length}問`);

  showNextQuestion();
  startTimer();
}

function showNextQuestion() {
  // シャッフルされた問題が残っているか確認
  if (gameState.currentShuffleIndex >= gameState.shuffledQuestionIndexes.length) {
    // 全問題を解き終わった場合、再シャッフル
    console.log('🔄 全問題クリア！問題を再シャッフルします');
    const stageId = currentStageId || 'ai';
    const stageLevel = gameState.stageLevels[stageId]?.level || 1;
    const levelFilteredQuizzes = quizData
      .map((quiz, index) => ({ quiz, index }))
      .filter(item => item.quiz.minLevel <= stageLevel);

    gameState.shuffledQuestionIndexes = shuffleArray(levelFilteredQuizzes.map(item => item.index));
    gameState.currentShuffleIndex = 0;
    console.log(`✅ 再シャッフル完了: ${gameState.shuffledQuestionIndexes.length}問`);
  }

  // シャッフルされた配列から次の問題のインデックスを取得
  const quizIndex = gameState.shuffledQuestionIndexes[gameState.currentShuffleIndex];
  const quiz = quizData[quizIndex];

  gameState.currentShuffleIndex++;
  gameState.currentQuestion = quiz;
  gameState.currentQuestionIndex++;

  console.log(`📝 問題 ${gameState.currentQuestionIndex}: ${quiz.question.substring(0, 30)}...`);
  console.log(`   進行: ${gameState.currentShuffleIndex}/${gameState.shuffledQuestionIndexes.length}問`);

  // 問題形式クラスのインスタンスを作成
  gameState.currentQuestionType = createQuestion(quiz);

  document.getElementById('question-number').textContent = gameState.currentQuestionIndex;
  document.getElementById('question-text').textContent = quiz.question;

  // 問題形式に応じた描画
  const answerGrid = document.getElementById('answer-grid');
  gameState.currentQuestionType.render(answerGrid);

  // イベントリスナーを設定
  setupQuestionEventListeners();
}

function setupQuestionEventListeners() {
  const questionType = gameState.currentQuestionType;
  const answerGrid = document.getElementById('answer-grid');

  if (questionType instanceof SingleChoiceQuestion) {
    // 単一選択：ボタンをクリックしたら即座に回答
    const buttons = answerGrid.querySelectorAll('.answer-btn');
    buttons.forEach((btn) => {
      btn.addEventListener('click', () => {
        soundManager.playSE('click');
        btn.classList.add('selected');
        const selectedIndex = parseInt(btn.dataset.index);
        handleAnswer(selectedIndex);
      });
    });
  } else if (questionType instanceof MultipleChoiceQuestion) {
    // 複数選択：ボタンをクリックで選択/解除、決定ボタンで回答確定
    const buttons = answerGrid.querySelectorAll('.answer-btn');
    buttons.forEach((btn) => {
      btn.addEventListener('click', () => {
        soundManager.playSE('click');
        btn.classList.toggle('selected');

        // チェックボックスの表示を更新
        const checkbox = btn.querySelector('.checkbox');
        if (btn.classList.contains('selected')) {
          checkbox.textContent = '☑';
        } else {
          checkbox.textContent = '☐';
        }
      });
    });

    // 決定ボタン
    const submitBtn = answerGrid.querySelector('.submit-btn');
    submitBtn.addEventListener('click', () => {
      soundManager.playSE('click');
      const selectedAnswer = questionType.getAnswer();
      if (selectedAnswer.length === 0) {
        alert('選択肢を1つ以上選んでください');
        return;
      }
      handleAnswer(selectedAnswer);
    });
  }
}

function handleAnswer(userAnswer) {
  const questionType = gameState.currentQuestionType;

  gameState.totalAnswers++;

  // 問題形式クラスで正誤判定
  const isCorrect = questionType.validate(userAnswer);

  // 結果を表示
  questionType.showResult(isCorrect, userAnswer);

  if (isCorrect) {
    soundManager.playSE('click');

    // キャラクタージャンプアニメーションを発動
    triggerCharacterJump();

    gameState.correctAnswers++; // 全体の正解数
    gameState.sessionCorrectAnswers++; // このセッションの正解数
    gameState.combo++;
    if (gameState.combo > gameState.maxCombo) {
      gameState.maxCombo = gameState.combo;
    }

    const baseScore = 100;
    const comboBonus = gameState.combo * 20;
    const earnedScore = baseScore + comboBonus;
    gameState.score += earnedScore;

    gainExp(10 + gameState.combo * 2);
    gainSkillExp(gameState.currentQuestion.category, 5);
  } else {
    soundManager.playSE('click');
    gameState.combo = 0;
  }

  updateScore();
  updateExpBar();
  saveGameData();

  setTimeout(() => {
    if (gameState.isPlaying) {
      showNextQuestion();
    }
  }, 1500);
}

function updateScore() {
  document.getElementById('score').textContent = gameState.score;
  document.getElementById('combo').textContent = gameState.combo;
}

// ===== タイマー =====
let timerInterval;

function startTimer() {
  clearInterval(timerInterval);

  timerInterval = setInterval(() => {
    gameState.timeLeft--;
    document.getElementById('time-left').textContent = gameState.timeLeft;

    if (gameState.timeLeft <= 0) {
      endQuiz();
    }
  }, 1000);
}

function endQuiz() {
  gameState.isPlaying = false;
  clearInterval(timerInterval);
  saveGameData();
  showResultScreen();
}

// ===== リザルト画面 =====
function showResultScreen() {
  console.log('📺 Screen: game-screen → result-screen');
  showScreen('result-screen');

  // リザルト画面登場SEを再生し、その後にリザルトBGMを開始
  soundManager.playSE('resultEntry');

  // SE再生後にリザルト画面のBGMを開始
  setTimeout(() => {
    soundManager.playBGM('play');
  }, 1000);

  // キャラクター画像を表示
  const char = gameState.selectedCharacter;
  // 全ステージの最高レベルを使用
  const maxLevel = Math.max(...Object.values(gameState.stageLevels).map(s => s.level));
  const resultCharEl = document.getElementById('result-character');
  const imagePath = getCharacterImagePath(char, maxLevel);
  resultCharEl.innerHTML = `<img src="${imagePath}" alt="${char.name}" class="character-image-result">`;

  document.getElementById('final-score').textContent = gameState.score;
  document.getElementById('correct-count').textContent = gameState.sessionCorrectAnswers || 0;
  document.getElementById('total-count').textContent = gameState.currentQuestionIndex;
  document.getElementById('result-combo').textContent = gameState.maxCombo;

  const gainedExp = Math.floor(gameState.score / 10);
  document.getElementById('gained-exp').textContent = gainedExp;

  const leveledUp = gainExp(gainedExp);
  const levelUpNotice = document.getElementById('level-up-notice');

  if (leveledUp) {
    levelUpNotice.textContent = `🎉 レベルアップ！ Lv.${gameState.level} 🎉`;
    levelUpNotice.style.display = 'block';
  } else {
    levelUpNotice.style.display = 'none';
  }

  saveGameData();

  // 孵化演出が必要な場合は、リザルト画面表示後に実行
  if (gameState.needsHatchAnimation) {
    gameState.needsHatchAnimation = false; // フラグをリセット
    console.log('🥚 リザルト画面で孵化演出を開始します');
    setTimeout(() => {
      showHatchAnimation();
    }, 2000); // リザルト画面を表示してから2秒後に孵化演出
  }
}

// ===== ステータス画面 =====
function showStatusScreen() {
  showScreen('status-screen');
  soundManager.playBGM('main'); // ステータス画面のBGM

  const char = gameState.selectedCharacter;
  // 全ステージの最高レベルを使用
  const maxLevel = Math.max(...Object.values(gameState.stageLevels).map(s => s.level));
  const statusAvatarEl = document.getElementById('status-avatar');

  // キャラクター画像を表示
  const imagePath = getCharacterImagePath(char, maxLevel);
  statusAvatarEl.innerHTML = `<img src="${imagePath}" alt="${char.name}" class="character-image-status">`;

  // キャラクター名を表示（カスタム名があればそれを、なければデフォルト名）
  const displayName = gameState.characterName || char.name;
  document.getElementById('status-character-name').textContent = displayName;
  // 全体レベル（平均）を表示
  document.getElementById('status-level').textContent = gameState.level;

  // プレイヤー名を表示
  const playerNameDisplay = document.getElementById('display-player-name');
  if (playerNameDisplay) {
    playerNameDisplay.textContent = gameState.playerName || '未設定';
  }

  const accuracy = gameState.totalAnswers > 0
    ? Math.round((gameState.correctAnswers / gameState.totalAnswers) * 100)
    : 0;

  document.getElementById('accuracy').textContent = accuracy;
  document.getElementById('max-combo').textContent = gameState.maxCombo;
  document.getElementById('total-answers').textContent = gameState.totalAnswers;
  document.getElementById('total-score').textContent = gameState.score;

  // スキルレベルを更新（ステージごとの独立したレベル）
  const aiSkillLevel = document.getElementById('ai-skill-level');
  const writingSkillLevel = document.getElementById('writing-skill-level');

  if (aiSkillLevel) {
    aiSkillLevel.textContent = gameState.stageLevels.ai.level;
  }
  if (writingSkillLevel) {
    writingSkillLevel.textContent = gameState.stageLevels.writing.level;
  }

  // 各スキルのレーダーチャートを描画
  setTimeout(() => {
    drawSkillRadarChart('ai-skill-radar', 'ai');
    drawSkillRadarChart('writing-skill-radar', 'writing');
  }, 100);
}

// ===== Chart.jsを使った六角形レーダーチャート =====
let mainRadarChartInstance = null;
let skillRadarChartInstances = {}; // スキル別のチャートインスタンスを管理

function drawRadarChart(canvasId) {
  console.log(`🎨 drawRadarChart() 開始: ${canvasId}`);

  const canvas = document.getElementById(canvasId || 'radar-chart');
  if (!canvas) {
    console.warn(`⚠️ Canvas要素が見つかりません: ${canvasId || 'radar-chart'}`);
    console.warn(`   DOM内の全てのCanvas要素:`, document.querySelectorAll('canvas'));
    return;
  }

  console.log(`✅ Canvas要素取得成功: ${canvasId}`);

  // Chart.jsがロードされているか確認
  if (typeof Chart === 'undefined') {
    console.error('❌ Chart.jsがロードされていません');
    return;
  }
  console.log('✅ Chart.jsロード確認完了');

  const ctx = canvas.getContext('2d');
  if (!ctx) {
    console.error(`❌ Canvas contextの取得に失敗: ${canvasId}`);
    return;
  }

  const isMainChart = canvasId === 'main-radar-chart';

  // 既存のチャートインスタンスを破棄
  if (isMainChart && mainRadarChartInstance) {
    console.log('   🗑️ 既存のチャートを破棄');
    mainRadarChartInstance.destroy();
  }

  // スキルラベル
  const labels = ['AI活用', 'ライティング', 'デザイン', 'マーケティング', '構築', 'その他'];

  // データ: ステージごとのレベルを反映
  const aiLevel = gameState.stageLevels.ai.level * 10;
  const writingLevel = gameState.stageLevels.writing.level * 10;
  const designLevel = gameState.stageLevels.design.level * 10;
  const marketingLevel = gameState.stageLevels.marketing.level * 10;
  const codingLevel = gameState.stageLevels.coding.level * 10;
  const otherLevel = gameState.stageLevels.other.level * 10;

  const data = {
    labels: labels,
    datasets: [{
      label: 'あなたのスキル',
      data: [aiLevel, writingLevel, designLevel, marketingLevel, codingLevel, otherLevel],
      backgroundColor: 'rgba(0, 255, 255, 0.2)', // シアンの半透明
      borderColor: 'rgba(0, 255, 255, 1)', // ネオンシアン
      borderWidth: 2,
      pointBackgroundColor: 'rgba(0, 255, 255, 1)',
      pointBorderColor: '#fff',
      pointHoverBackgroundColor: '#fff',
      pointHoverBorderColor: 'rgba(0, 255, 255, 1)',
      pointRadius: 4,
      pointHoverRadius: 6
    }]
  };

  const config = {
    type: 'radar',
    data: data,
    options: {
      responsive: true,
      maintainAspectRatio: true,
      animation: {
        duration: 1000,
        easing: 'easeOutQuart'
      },
      scales: {
        r: {
          min: 0,
          max: 100,
          ticks: {
            stepSize: 20,
            color: 'rgba(255, 255, 255, 0.6)',
            backdropColor: 'transparent',
            font: {
              size: 10
            }
          },
          grid: {
            color: 'rgba(255, 255, 255, 0.2)',
            lineWidth: 1
          },
          angleLines: {
            color: 'rgba(255, 255, 255, 0.2)',
            lineWidth: 1
          },
          pointLabels: {
            color: 'rgba(255, 255, 255, 0.9)',
            font: {
              size: isMainChart ? 11 : 13,
              weight: 'bold'
            }
          }
        }
      },
      plugins: {
        legend: {
          display: false
        },
        tooltip: {
          enabled: true,
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          titleColor: 'rgba(0, 255, 255, 1)',
          bodyColor: 'rgba(255, 255, 255, 0.9)',
          borderColor: 'rgba(0, 255, 255, 1)',
          borderWidth: 1
        }
      }
    }
  };

  // チャートを作成
  const chartInstance = new Chart(ctx, config);

  // インスタンスを保存
  if (isMainChart) {
    mainRadarChartInstance = chartInstance;
  }

  console.log(`✅ Chart.jsレーダーチャート描画完了: ${canvasId}`);
}

// ===== スキル別レーダーチャート =====
function drawSkillRadarChart(canvasId, skillType) {
  console.log(`🎨 drawSkillRadarChart() 開始: ${canvasId}, スキル: ${skillType}`);

  const canvas = document.getElementById(canvasId);
  if (!canvas) {
    console.warn(`⚠️ Canvas要素が見つかりません: ${canvasId}`);
    return;
  }

  // Chart.jsがロードされているか確認
  if (typeof Chart === 'undefined') {
    console.error('❌ Chart.jsがロードされていません');
    return;
  }

  const ctx = canvas.getContext('2d');
  if (!ctx) {
    console.error(`❌ Canvas contextの取得に失敗: ${canvasId}`);
    return;
  }

  // 既存のチャートインスタンスを破棄
  if (skillRadarChartInstances[canvasId]) {
    skillRadarChartInstances[canvasId].destroy();
  }

  // スキルタイプ別のサブスキル定義
  const skillDefinitions = {
    ai: {
      labels: ['プロンプト力', '情報整理力', '批判的思考', '応用力', '効率化', 'AIリテラシー'],
      color: {
        bg: 'rgba(76, 175, 80, 0.2)',
        border: 'rgba(76, 175, 80, 1)',
        point: 'rgba(76, 175, 80, 1)'
      }
    },
    writing: {
      labels: ['文章構成力', '表現力', '敬語・マナー', '校正力', '読者理解力', '簡潔さ'],
      color: {
        bg: 'rgba(33, 150, 243, 0.2)',
        border: 'rgba(33, 150, 243, 1)',
        point: 'rgba(33, 150, 243, 1)'
      }
    }
  };

  const skill = skillDefinitions[skillType];
  if (!skill) {
    console.error(`❌ 未定義のスキルタイプ: ${skillType}`);
    return;
  }

  // データ: ステージごとのレベルを反映（仮データ）
  const stageLevel = gameState.stageLevels[skillType]?.level || 1;
  const baseLevel = stageLevel * 10; // レベルを10倍してスケール調整
  const variation = 20; // ランダムなバリエーション
  const data = skill.labels.map(() => {
    return Math.max(10, Math.min(100, baseLevel + (Math.random() * variation - variation / 2)));
  });

  const chartData = {
    labels: skill.labels,
    datasets: [{
      label: 'スキルレベル',
      data: data,
      backgroundColor: skill.color.bg,
      borderColor: skill.color.border,
      borderWidth: 2,
      pointBackgroundColor: skill.color.point,
      pointBorderColor: '#fff',
      pointHoverBackgroundColor: '#fff',
      pointHoverBorderColor: skill.color.point,
      pointRadius: 3,
      pointHoverRadius: 5
    }]
  };

  const config = {
    type: 'radar',
    data: chartData,
    options: {
      responsive: true,
      maintainAspectRatio: true,
      animation: {
        duration: 800,
        easing: 'easeOutQuart'
      },
      scales: {
        r: {
          min: 0,
          max: 100,
          ticks: {
            stepSize: 20,
            color: 'rgba(255, 255, 255, 0.5)',
            backdropColor: 'transparent',
            font: {
              size: 8
            },
            display: false // 数値を非表示
          },
          grid: {
            color: 'rgba(255, 255, 255, 0.15)',
            lineWidth: 1
          },
          angleLines: {
            color: 'rgba(255, 255, 255, 0.15)',
            lineWidth: 1
          },
          pointLabels: {
            color: 'rgba(255, 255, 255, 0.8)',
            font: {
              size: 9,
              weight: '600'
            },
            padding: 8,
            callback: function(label) {
              // ラベルが長い場合は改行
              if (label.length > 6) {
                return label;
              }
              return label;
            }
          }
        }
      },
      plugins: {
        legend: {
          display: false
        },
        tooltip: {
          enabled: true,
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          titleColor: skill.color.border,
          bodyColor: 'rgba(255, 255, 255, 0.9)',
          borderColor: skill.color.border,
          borderWidth: 1
        }
      }
    }
  };

  // チャートを作成
  const chartInstance = new Chart(ctx, config);
  skillRadarChartInstances[canvasId] = chartInstance;

  console.log(`✅ スキルレーダーチャート描画完了: ${canvasId}`);
}

// ===== 装備品表示 =====
// function displayEquipment() {
//   const equipmentGrid = document.getElementById('equipment-grid');
//   equipmentGrid.innerHTML = '';
//
//   equipmentList.forEach(item => {
//     const isUnlocked = gameState.equipment.includes(item.id);
//     const card = document.createElement('div');
//     card.className = `equipment-item ${isUnlocked ? 'unlocked' : 'locked'}`;
//     card.innerHTML = `
//       <div class="equipment-icon">${item.icon}</div>
//       <div class="equipment-name">${item.name}</div>
//       <div class="equipment-level">Lv.${item.unlockLevel}解放</div>
//       ${isUnlocked ? `<div class="equipment-bonus">+${item.bonus}</div>` : '<div class="equipment-bonus">🔒</div>'}
//     `;
//     equipmentGrid.appendChild(card);
//   });
// }

// ===== ボリュームコントロール =====
const volumeModal = document.getElementById('volume-modal');
const masterVolumeSlider = document.getElementById('master-volume');
const bgmVolumeSlider = document.getElementById('bgm-volume');
const seVolumeSlider = document.getElementById('se-volume');
const masterVolumeValue = document.getElementById('master-volume-value');
const bgmVolumeValue = document.getElementById('bgm-volume-value');
const seVolumeValue = document.getElementById('se-volume-value');

// ボリューム変更時の処理
masterVolumeSlider.addEventListener('input', (e) => {
  const value = e.target.value;
  masterVolumeValue.textContent = value + '%';
  soundManager.setMasterVolume(value / 100);
});

bgmVolumeSlider.addEventListener('input', (e) => {
  const value = e.target.value;
  bgmVolumeValue.textContent = value + '%';
  soundManager.setBGMVolume(value / 100);
});

seVolumeSlider.addEventListener('input', (e) => {
  const value = e.target.value;
  seVolumeValue.textContent = value + '%';
  soundManager.setSEVolume(value / 100);
});

// ===== イベントリスナー =====
// ホームボタン
document.getElementById('btn-home-result').addEventListener('click', () => {
  soundManager.playSE('click');
  console.log('📺 Screen: result-screen → main-page');
  showScreen('main-page');
  soundManager.playBGM('play', true); // BGMをメインテーマに戻す（強制再スタート）
  initMainPage();
});

document.getElementById('btn-volume').addEventListener('click', () => {
  soundManager.playSE('click');
  volumeModal.classList.add('active');
});

document.getElementById('btn-close-volume').addEventListener('click', () => {
  soundManager.playSE('click');
  volumeModal.classList.remove('active');
});

// モーダル外クリックで閉じる
volumeModal.addEventListener('click', (e) => {
  if (e.target === volumeModal) {
    soundManager.playSE('click');
    volumeModal.classList.remove('active');
  }
});

// 孵化演出：名前確定ボタン
document.getElementById('btn-confirm-name').addEventListener('click', () => {
  confirmCharacterName();
});

// プレイヤー名確定ボタン
document.getElementById('btn-confirm-player-name').addEventListener('click', () => {
  confirmPlayerName();
});

// プレイヤー名変更ボタン（ステータス画面）
document.getElementById('btn-edit-player-name').addEventListener('click', () => {
  soundManager.playSE('click');
  showPlayerNameModal();
});

document.getElementById('btn-close-status').addEventListener('click', () => {
  soundManager.playSE('click');
  console.log('📺 Screen: status-screen → main-page (×ボタン)');
  // 確実にメイン画面に戻す
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  showScreen('main-page');
  soundManager.playBGM('play', true); // BGMをメインテーマに戻す（強制再スタート）
  initMainPage();
});

document.getElementById('btn-continue').addEventListener('click', () => {
  soundManager.playSE('click');
  console.log('📺 Screen: result-screen → countdown-screen (continue)');
  startCountdown();
});

// ===== プレイヤー名入力システム =====
// プレイヤー名入力モーダルを表示
function showPlayerNameModal() {
  const modal = document.getElementById('player-name-modal');
  const input = document.getElementById('player-name-input');

  if (modal && input) {
    modal.classList.add('active');
    input.value = gameState.playerName || ''; // 既存の名前があれば表示
    input.focus();
  }
}

// プレイヤー名を確定
function confirmPlayerName() {
  const input = document.getElementById('player-name-input');
  const modal = document.getElementById('player-name-modal');

  if (!input || !modal) return;

  const name = input.value.trim();

  if (name.length === 0) {
    alert('お名前を入力してください');
    return;
  }

  // 名前を保存
  gameState.playerName = name;
  saveGameData();

  // モーダルを閉じる
  modal.classList.remove('active');
  soundManager.playSE('click');

  console.log('✅ プレイヤー名設定:', gameState.playerName);

  // ステータス画面が表示されている場合は更新
  const statusScreen = document.getElementById('status-screen');
  if (statusScreen && statusScreen.classList.contains('active')) {
    const playerNameDisplay = document.getElementById('display-player-name');
    if (playerNameDisplay) {
      playerNameDisplay.textContent = gameState.playerName;
    }
  }

  // セリフを再表示（名前を反映）
  const characterSpeech = document.getElementById('character-speech');
  if (characterSpeech && characterSpeech.style.display === 'block') {
    displayQuote();
  }
}

// ===== セリフ表示システム =====
let quotesData = [];

// quotes.jsonを読み込む
async function loadQuotes() {
  try {
    const response = await fetch('/data/quotes.json');
    if (!response.ok) {
      throw new Error('Failed to load quotes.json');
    }
    quotesData = await response.json();
    console.log('📝 セリフデータ読み込み完了:', quotesData.length, '件');
  } catch (error) {
    console.error('❌ セリフデータの読み込みエラー:', error);
    quotesData = [];
  }
}

// ランダムにセリフを表示
function displayQuote() {
  if (quotesData.length === 0) {
    console.warn('⚠️ セリフデータがありません');
    return;
  }

  // ランダムに1つ選択
  const randomQuote = quotesData[Math.floor(Math.random() * quotesData.length)];

  // セリフを取得し、「三田さん」をプレイヤー名に置き換え
  let quoteText = randomQuote.text;
  if (gameState.playerName) {
    quoteText = quoteText.replace(/三田さん/g, `${gameState.playerName}さん`);
    quoteText = quoteText.replace(/三田/g, gameState.playerName);
  }

  // セリフを表示
  const speechBubble = document.getElementById('character-speech');
  const speechText = document.getElementById('speech-text');

  if (speechBubble && speechText) {
    speechText.textContent = quoteText;
    speechBubble.style.display = 'block';
  }
}

// ===== マイページ初期化 =====
function initMainPage() {
  console.log('🏠 マイページを初期化');
  console.log('🔍 選択されたキャラクター:', gameState.selectedCharacter);

  // キャラクター表示
  if (gameState.selectedCharacter) {
    const charLevel = document.getElementById('main-level');

    // 全体レベル（平均）を表示
    charLevel.textContent = gameState.level;

    // キャラクター画像を更新
    updateCharacterDisplay();

    // 経験値バー
    updateExpBar();
  } else {
    // キャラクターが選択されていない場合はデフォルト表示
    const charName = document.getElementById('main-character-name');
    charName.textContent = '相棒を選ぼう';
    console.warn('⚠️ キャラクターが選択されていません');
  }

  // レーダーチャート（DOMの準備を確実にするため、少し遅延させる）
  setTimeout(() => {
    const canvas = document.getElementById('main-radar-chart');
    if (canvas) {
      console.log('✅ Canvas要素確認: main-radar-chart');
      drawRadarChart('main-radar-chart');
    } else {
      console.error('❌ Canvas要素が見つかりません: main-radar-chart');
    }
  }, 100);

  // ジャンル選択タイル
  console.log('🎯 ジャンルタイル初期化開始');
  initGenreTiles();
  console.log('✅ ジャンルタイル初期化完了');

  // 音量スライダー（イベントリスナーは一度だけ追加）
  const quickVolumeSlider = document.getElementById('quick-master-volume');
  if (quickVolumeSlider) {
    quickVolumeSlider.value = soundManager.masterVolume * 100;
    // 既存のリスナーを削除してから追加
    const newSlider = quickVolumeSlider.cloneNode(true);
    quickVolumeSlider.parentNode.replaceChild(newSlider, quickVolumeSlider);
    newSlider.addEventListener('input', (e) => {
      const volume = e.target.value / 100;
      soundManager.setMasterVolume(volume);
    });
  }

  // 左側エリア（ステータス表示部）をクリックしてステータス詳細画面へ
  const mainLeft = document.querySelector('.main-left');
  if (mainLeft) {
    // 既存のリスナーを削除してから追加
    const newMainLeft = mainLeft.cloneNode(true);
    mainLeft.parentNode.replaceChild(newMainLeft, mainLeft);
    newMainLeft.addEventListener('click', () => {
      soundManager.playSE('click');
      console.log('📺 Screen: main-page → status-screen');
      showStatusScreen();
    });
  }

  // セリフを表示（キャラクターが選択されている場合のみ）
  if (gameState.selectedCharacter) {
    displayQuote();
  }
}

function initGenreTiles() {
  console.log('🎯 initGenreTiles() 開始');
  console.log('🎯 stages配列の長さ:', stages ? stages.length : 'undefined');

  const tilesContainer = document.getElementById('genre-tiles');

  if (!tilesContainer) {
    console.error('❌ genre-tiles コンテナが見つかりません');
    console.error('❌ DOMの状態を確認してください');
    // DOMが準備できていない可能性があるため、少し待ってから再試行
    setTimeout(() => {
      console.log('⏱️ 再試行します...');
      const retry = document.getElementById('genre-tiles');
      if (retry) {
        console.log('✅ 再試行成功！コンテナが見つかりました');
        initGenreTilesCore(retry);
      } else {
        console.error('❌ 再試行も失敗しました');
      }
    }, 100);
    return;
  }

  initGenreTilesCore(tilesContainer);
}

function initGenreTilesCore(tilesContainer) {
  console.log('✅ genre-tiles コンテナ取得成功');
  console.log('📦 コンテナの状態:', tilesContainer);

  tilesContainer.innerHTML = '';
  console.log('🧹 コンテナをクリアしました');

  if (!stages || stages.length === 0) {
    console.error('❌ stages データが空です');
    // フォールバック：ハードコードでタイルを表示
    tilesContainer.innerHTML = `
      <div class="genre-tile">
        <div class="genre-tile-icon">🤖</div>
        <div class="genre-tile-name">AI基礎</div>
        <div class="genre-tile-desc">AIとの付き合い方を学ぼう</div>
      </div>
      <div class="genre-tile locked">
        <div class="genre-tile-lock">🔒</div>
        <div class="genre-tile-icon">✍️</div>
        <div class="genre-tile-name">ライティング</div>
        <div class="genre-tile-desc">文章力を磨こう</div>
        <div class="genre-tile-badge">Coming Soon</div>
      </div>
    `;

    // AI基礎のクリックイベント
    const aiTile = tilesContainer.querySelector('.genre-tile:not(.locked)');
    if (aiTile) {
      aiTile.addEventListener('click', () => {
        soundManager.playSE('click');
        console.log('🎮 ジャンル選択: AI基礎 (フォールバック)');
        startCountdown();
      });
    }

    console.log('⚠️ フォールバックでタイルを表示しました');
    return;
  }

  console.log('📊 stages データ:', stages);
  console.log('📊 stages 数:', stages.length);

  stages.forEach((stage, index) => {
    console.log(`🎴 タイル${index + 1}作成中: ${stage.name}`);
    const tile = document.createElement('div');
    tile.className = 'genre-tile';

    if (stage.locked) {
      tile.classList.add('locked');
      console.log(`  🔒 ロック状態: ${stage.name}`);
    }

    tile.innerHTML = `
      ${stage.locked ? '<div class="genre-tile-lock">🔒</div>' : ''}
      <div class="genre-tile-icon">${stage.icon}</div>
      <div class="genre-tile-name">${stage.name}</div>
      <div class="genre-tile-desc">${stage.description}</div>
      ${stage.comingSoon ? '<div class="genre-tile-badge">Coming Soon</div>' : ''}
    `;

    if (!stage.locked) {
      tile.addEventListener('click', async () => {
        soundManager.playSE('click');
        console.log(`🎮 ステージ選択: ${stage.name} (${stage.id})`);

        // 選択されたステージのクイズデータを読み込む
        const loaded = await loadQuizData(stage.id);
        if (loaded) {
          startCountdown();
        } else {
          alert('クイズデータの読み込みに失敗しました。');
        }
      });
      console.log(`  ✅ クリックイベント追加: ${stage.name}`);
    }

    tilesContainer.appendChild(tile);
    console.log(`✅ タイル${index + 1}追加完了 - DOM要素数: ${tilesContainer.children.length}`);
  });

  console.log('🎯 initGenreTiles() 完了 - 最終タイル数:', tilesContainer.children.length);
}

// デバッグ用：LocalStorageをクリア
window.clearSaveData = function() {
  localStorage.removeItem('tsumQMA_save');
  console.log('💾 セーブデータを削除しました。ページをリロードしてください。');
  location.reload();
};

// ===== カウントダウン演出 =====
function startCountdown() {
  console.log('⏱️ カウントダウン開始');
  showScreen('countdown-screen');

  const display = document.getElementById('countdown-display');
  let count = 3;

  function updateCount() {
    if (count > 0) {
      display.textContent = count;
      display.style.animation = 'none';
      setTimeout(() => {
        display.style.animation = 'countdownPulse 1s ease-in-out';
      }, 10);
      soundManager.playSE('click');
      count--;
      setTimeout(updateCount, 1000);
    } else {
      display.textContent = 'GO!';
      display.style.animation = 'none';
      setTimeout(() => {
        display.style.animation = 'countdownPulse 1s ease-in-out';
      }, 10);
      soundManager.playSE('click');
      setTimeout(() => {
        console.log('📺 Screen: countdown-screen → game-screen');
        startQuiz();
      }, 1000);
    }
  }

  updateCount();
}

// ===== 初期化 =====
async function init() {
  console.log('🚀🚀🚀 TsumQMA 初期化開始 🚀🚀🚀');
  console.log('='.repeat(50));

  // 1. ステージデータを読み込む
  console.log('🎮 ステップ1: ステージデータ読み込み中...');
  const stagesLoaded = await loadStages();
  if (!stagesLoaded) {
    alert('ステージデータの読み込みに失敗しました。ページを再読み込みしてください。');
    return;
  }
  console.log('✅ ステージデータ読み込み完了');

  // 2. クイズデータを読み込む
  console.log('📚 ステップ2: クイズデータ読み込み中...');
  const loaded = await loadQuizData('ai'); // デフォルトはAIステージ
  if (!loaded) {
    alert('クイズデータの読み込みに失敗しました。ページを再読み込みしてください。');
    return;
  }
  console.log('✅ クイズデータ読み込み完了');

  // 2. 音響システムを初期化
  console.log('🔊 ステップ2: 音響システム初期化中...');
  soundManager.init();
  console.log('✅ 音響システム初期化完了');

  // 2.5. セリフデータを読み込む
  console.log('📝 セリフデータ読み込み中...');
  await loadQuotes();
  console.log('✅ セリフデータ読み込み完了');

  // 3. セーブデータを読み込む
  console.log('💾 ステップ3: セーブデータ確認中...');
  const hasSaveData = loadGameData();
  console.log('💾 セーブデータの状態:', {
    hasSaveData,
    selectedCharacter: gameState.selectedCharacter,
    characterName: gameState.selectedCharacter?.name,
    level: gameState.level
  });

  // 4. DOMの準備を確認
  console.log('🔍 ステップ4: DOM要素確認中...');
  const mainPage = document.getElementById('main-page');
  const characterSelect = document.getElementById('character-select');
  const genreTiles = document.getElementById('genre-tiles');

  console.log('🔍 DOM要素の存在確認:', {
    'main-page': !!mainPage,
    'character-select': !!characterSelect,
    'genre-tiles': !!genreTiles
  });

  // 5. 画面遷移
  console.log('📺 ステップ5: 画面遷移決定中...');
  console.log('='.repeat(50));

  if (hasSaveData && gameState.selectedCharacter) {
    // 2回目以降：マイページから開始
    console.log('✅✅✅ セーブデータあり → マイページ表示 ✅✅✅');
    console.log('📺 Screen: initial → main-page');

    // 画面を切り替え
    showScreen('main-page');

    // マイページを初期化
    console.log('🏠 マイページ初期化開始...');
    setTimeout(() => {
      initMainPage();
      console.log('🏠 マイページ初期化完了！');
    }, 100);

    soundManager.playBGM('play'); // メインページのBGM

  } else {
    // 初回：キャラクター選択から開始
    console.log('❌❌❌ セーブデータなし → キャラクター選択画面表示 ❌❌❌');
    console.log('📺 Screen: initial → character-select');

    // すべての画面を一旦非表示
    document.querySelectorAll('.screen').forEach(s => {
      s.classList.remove('active');
      console.log(`  非表示: ${s.id}`);
    });

    // キャラクター選択画面のみ表示
    showScreen('character-select');
    initCharacterSelect();
    soundManager.playBGM('main'); // キャラ選択画面のBGM
  }

  console.log('='.repeat(50));
  console.log('🎉🎉🎉 TsumQMA 初期化完了！ 🎉🎉🎉');

  // 6. プレイヤー名の確認
  console.log('👤 プレイヤー名確認中...');
  if (!gameState.playerName) {
    console.log('⚠️ プレイヤー名が未設定');

    if (hasSaveData) {
      // 既存ユーザー：デフォルトで「三田」を設定
      gameState.playerName = '三田';
      saveGameData();
      console.log('✅ デフォルト名「三田」を設定しました');
    } else {
      // 初回ユーザー：名前入力モーダルを表示
      console.log('📝 初回起動：プレイヤー名入力モーダルを表示');
      setTimeout(() => {
        showPlayerNameModal();
      }, 500);
    }
  } else {
    console.log('✅ プレイヤー名:', gameState.playerName);
  }

  // iOS Audio Context Unlock - 最初のユーザーアクションでresumeする
  let audioUnlocked = false;
  const unlockAudio = () => {
    if (audioUnlocked) return;

    console.log('🔊 Attempting to unlock Audio Context...');

    if (typeof Howler !== 'undefined' && Howler.ctx) {
      console.log('   Current Audio Context state:', Howler.ctx.state);

      if (Howler.ctx.state === 'suspended') {
        Howler.ctx.resume().then(() => {
          console.log('✅ Audio Context unlocked successfully!');
          audioUnlocked = true;
        }).catch(err => {
          console.error('❌ Failed to unlock Audio Context:', err);
        });
      } else {
        console.log('✅ Audio Context already in state:', Howler.ctx.state);
        audioUnlocked = true;
      }
    }
  };

  // 複数のイベントでunlockを試みる
  ['touchstart', 'touchend', 'click', 'keydown'].forEach(eventType => {
    document.addEventListener(eventType, unlockAudio, { once: true, passive: true });
  });

  console.log('🎵 iOS Audio Context unlock listeners added');
}

// DOMContentLoadedイベントを待ってから初期化
if (document.readyState === 'loading') {
  console.log('⏳ DOMロード待機中...');
  document.addEventListener('DOMContentLoaded', init);
} else {
  console.log('✅ DOM準備完了、初期化開始');
  init();
}
