# Unity移行ガイド
## Web版 → Unity版 移行手順

---

## 1. ファイル構成

### 移行対象ファイル

```
unity-export/
├── GameLogic.md          # 計算式ドキュメント
├── GameLogic.cs          # Unity用C#スクリプト
└── MIGRATION_GUIDE.md    # このファイル
```

### Unityプロジェクトでの配置

```
Assets/
├── Scripts/
│   └── Core/
│       └── GameLogic.cs      # ← ここに配置
├── Data/
│   └── Quizzes/
│       ├── ai.json           # ← Web版からコピー
│       └── writing.json
└── Resources/
    └── Questions/            # または ScriptableObject化
```

---

## 2. 移行手順

### Step 1: 新しいGitHubリポジトリを作成

```bash
# 新しいリポジトリをクローン（または作成）
git clone https://github.com/yourname/skill-evolve-unity.git
cd skill-evolve-unity
```

### Step 2: Unityプロジェクトを作成

1. Unity Hub を開く
2. 「New Project」→「2D Core」テンプレートを選択
3. プロジェクト名: `SkillEvolve`
4. 保存先: クローンしたリポジトリのフォルダ

### Step 3: GameLogic.cs を配置

```bash
# unity-exportフォルダからコピー
mkdir -p Assets/Scripts/Core
cp /path/to/Quiz/unity-export/GameLogic.cs Assets/Scripts/Core/
```

### Step 4: クイズデータを移行

#### 方法A: JSONファイルをそのまま使用

```bash
# Web版のデータをコピー
mkdir -p Assets/Resources/Data
cp /path/to/Quiz/public/data/quizzes/*.json Assets/Resources/Data/
```

Unity側での読み込み:
```csharp
TextAsset jsonFile = Resources.Load<TextAsset>("Data/ai");
QuizQuestion[] questions = JsonUtility.FromJson<QuizWrapper>(jsonFile.text).questions;
```

#### 方法B: ScriptableObjectに変換（推奨）

```csharp
[CreateAssetMenu(fileName = "QuizData", menuName = "Quiz/QuizData")]
public class QuizData : ScriptableObject
{
    public QuizQuestion[] Questions;
}
```

---

## 3. シーン構成の移行

### Web版の画面構成

| Web版 | Unity版シーン |
|-------|--------------|
| `#start-screen` | TitleScene |
| `#character-select` | (HomeSceneに統合) |
| `#home-screen` | HomeScene |
| `#stage-select` | (HomeSceneに統合) |
| `#game-screen` | QuizScene |
| `#result-screen` | ResultScene |

### Unityシーンの作成

```
Assets/Scenes/
├── TitleScene.unity      # タップしてスタート
├── HomeScene.unity       # メイン画面（キャラ表示、ステージ選択）
├── QuizScene.unity       # クイズ実行画面
└── ResultScene.unity     # 結果発表
```

---

## 4. コンポーネント設計

### GameManager.cs（シングルトン）

```csharp
using SkillEvolve.Core;
using UnityEngine;

public class GameManager : MonoBehaviour
{
    public static GameManager Instance { get; private set; }

    public GameState State { get; private set; }
    public ComboManager Combo { get; private set; }
    public CollectionManager Collection { get; private set; }

    void Awake()
    {
        if (Instance == null)
        {
            Instance = this;
            DontDestroyOnLoad(gameObject);
            Initialize();
        }
        else
        {
            Destroy(gameObject);
        }
    }

    void Initialize()
    {
        State = SaveManager.Load();
        Combo = new ComboManager();
        Collection = new CollectionManager();

        // 家出チェック
        if (!string.IsNullOrEmpty(State.LastLoginTime))
        {
            DateTime lastLogin = DateTime.Parse(State.LastLoginTime);
            if (RunawaySystem.CheckRunaway(lastLogin))
            {
                // 家出イベント発生
                OnCharacterRunaway();
            }
        }
    }

    void OnCharacterRunaway()
    {
        // キャラクターが家出した時の処理
        Debug.Log("キャラクターが家出しました...");
    }
}
```

### QuizManager.cs

```csharp
using SkillEvolve.Core;
using UnityEngine;

public class QuizManager : MonoBehaviour
{
    public string CurrentStageId = "ai";

    private float timeLeft;
    private bool isPlaying;

    void StartQuiz()
    {
        timeLeft = GameConstants.QUIZ_TIME_LIMIT;
        isPlaying = true;
        GameManager.Instance.Combo.ResetSession();
        GameManager.Instance.State.Score = 0;
        GameManager.Instance.State.SessionCorrectAnswers = 0;
    }

    void Update()
    {
        if (isPlaying)
        {
            timeLeft -= Time.deltaTime;
            if (timeLeft <= 0)
            {
                EndQuiz();
            }
        }
    }

    public void OnAnswer(bool isCorrect, string category)
    {
        var state = GameManager.Instance.State;
        var combo = GameManager.Instance.Combo;

        state.TotalAnswers++;

        if (isCorrect)
        {
            combo.OnCorrectAnswer();
            state.CorrectAnswers++;
            state.SessionCorrectAnswers++;

            // スコア計算
            int score = ScoreCalculator.CalculateScore(combo.CurrentCombo);
            int timeBonus = ScoreCalculator.CalculateTimeBonus(timeLeft);
            state.Score += score + timeBonus;

            // 経験値
            int exp = ScoreCalculator.CalculateExp(combo.CurrentCombo);
            var stageLevel = state.StageLevels.GetStage(CurrentStageId);
            bool leveledUp = stageLevel.AddExp(exp);

            // スキル経験値
            state.Skills.AddSkillExp(category);

            // 進化チェック
            if (leveledUp)
            {
                var evolution = new EvolutionSystem();
                evolution.CheckHatchCondition(stageLevel.Level);
            }

            // コレクションチェック
            state.PlayerLevel = state.StageLevels.CalculatePlayerLevel();
            GameManager.Instance.Collection.CheckUnlocks(state.PlayerLevel);
        }
        else
        {
            combo.OnWrongAnswer();
        }

        SaveManager.Save(state);
    }

    void EndQuiz()
    {
        isPlaying = false;
        // ResultSceneに遷移
        UnityEngine.SceneManagement.SceneManager.LoadScene("ResultScene");
    }
}
```

---

## 5. UIの移行

### 仕様書のUI要件

| 要件 | Unity実装 |
|------|----------|
| ボタンが押すと沈む | `Button` + `Animator` または DOTween |
| パーティクルエフェクト | `ParticleSystem` |
| Phase 1/2 演出 | `Coroutine` でシーケンス制御 |
| スパイダーチャート | UI Toolkit または `LineRenderer` |

### ボタンアニメーション例

```csharp
using DG.Tweening;  // DOTween使用

public class AnimatedButton : MonoBehaviour
{
    public void OnPointerDown()
    {
        transform.DOScale(0.9f, 0.1f);
    }

    public void OnPointerUp()
    {
        transform.DOScale(1f, 0.1f);
    }
}
```

---

## 6. 音声の移行

### Web版の音声ファイル

```
public/audio/
├── bgm_play.mp3       → BGM/Play.mp3
├── bgm_correct.mp3    → BGM/Correct.mp3
├── bgm_main.mp3       → BGM/Main.mp3
├── se_click.mp3       → SE/Click.mp3
└── se_result_entry.mp3 → SE/ResultEntry.mp3
```

### Unity AudioManager

```csharp
public class AudioManager : MonoBehaviour
{
    public static AudioManager Instance;

    [SerializeField] private AudioSource bgmSource;
    [SerializeField] private AudioSource seSource;

    public AudioClip[] bgmClips;
    public AudioClip[] seClips;

    public void PlayBGM(string name)
    {
        // BGM再生ロジック
    }

    public void PlaySE(string name)
    {
        // SE再生ロジック
    }
}
```

---

## 7. 移行チェックリスト

### 必須

- [ ] GameLogic.cs を Assets/Scripts/Core/ に配置
- [ ] シーン4つを作成（Title, Home, Quiz, Result）
- [ ] GameManager をシングルトンとして実装
- [ ] クイズデータをJSON or ScriptableObjectで読み込み
- [ ] PlayerPrefs でセーブ/ロード動作確認

### 推奨

- [ ] DOTweenパッケージをインストール
- [ ] TextMeshPro を導入
- [ ] 音声ファイルを移行
- [ ] スパイダーチャートUIを実装

### Web版にない新機能（Unity版で追加）

- [ ] 家出システム（24時間ログインなし判定）
- [ ] タイムボーナス計算
- [ ] プッシュ通知（家出防止）

---

## 8. トラブルシューティング

### Q: JSONのパースエラーが出る

A: `JsonUtility` は配列の直接パースに対応していません。ラッパークラスを使用:

```csharp
[Serializable]
public class QuizWrapper
{
    public QuizQuestion[] questions;
}

// 使用時
string json = "{\"questions\":" + originalJson + "}";
var wrapper = JsonUtility.FromJson<QuizWrapper>(json);
```

### Q: PlayerPrefsのデータが大きすぎる

A: 大量のデータは `Application.persistentDataPath` にファイル保存:

```csharp
string path = Path.Combine(Application.persistentDataPath, "save.json");
File.WriteAllText(path, json);
```

---

## 9. 参考リンク

- [Unity JsonUtility](https://docs.unity3d.com/ScriptReference/JsonUtility.html)
- [DOTween](http://dotween.demigiant.com/)
- [Unity UI Toolkit](https://docs.unity3d.com/Manual/UIElements.html)

---

## 次のステップ

1. 新しいGitHubリポジトリを作成
2. Unityプロジェクトをセットアップ
3. `GameLogic.cs` を配置してビルドが通ることを確認
4. 最小限のシーン（Title → Quiz）を作成してフローを確認
5. 段階的に機能を追加
