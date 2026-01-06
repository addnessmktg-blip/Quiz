using System;
using System.Collections.Generic;
using UnityEngine;

namespace SkillEvolve.Core
{
    /// <summary>
    /// ゲーム全体の定数を管理
    /// </summary>
    public static class GameConstants
    {
        // スコア計算
        public const int BASE_SCORE = 100;
        public const int COMBO_MULTIPLIER = 20;
        public const int TIME_BONUS_MULTIPLIER = 10;

        // 経験値
        public const int BASE_EXP = 10;
        public const int COMBO_EXP_MULTIPLIER = 2;
        public const int SKILL_EXP_PER_CORRECT = 5;

        // レベル成長係数
        public const float STAGE_LEVEL_GROWTH = 1.5f;
        public const float SKILL_LEVEL_GROWTH = 1.3f;
        public const float PLAYER_LEVEL_RATIO = 0.8f;

        // 初期値
        public const int INITIAL_LEVEL = 1;
        public const int INITIAL_EXP = 0;
        public const int INITIAL_MAX_EXP = 100;

        // タイマー
        public const float QUIZ_TIME_LIMIT = 60f;

        // 進化・家出条件
        public const int HATCH_LEVEL = 5;
        public const int RUNAWAY_HOURS = 24;
    }

    /// <summary>
    /// スコア計算を担当するクラス
    /// </summary>
    public static class ScoreCalculator
    {
        /// <summary>
        /// 正解時のスコアを計算
        /// </summary>
        /// <param name="currentCombo">現在のコンボ数</param>
        /// <returns>獲得スコア</returns>
        public static int CalculateScore(int currentCombo)
        {
            int baseScore = GameConstants.BASE_SCORE;
            int comboBonus = currentCombo * GameConstants.COMBO_MULTIPLIER;
            return baseScore + comboBonus;
        }

        /// <summary>
        /// タイムボーナスを計算（Web版では未実装、Unity版で追加）
        /// </summary>
        /// <param name="remainingTime">残り時間（秒）</param>
        /// <returns>タイムボーナス</returns>
        public static int CalculateTimeBonus(float remainingTime)
        {
            return Mathf.FloorToInt(remainingTime) * GameConstants.TIME_BONUS_MULTIPLIER;
        }

        /// <summary>
        /// 正解時の経験値を計算
        /// </summary>
        /// <param name="currentCombo">現在のコンボ数</param>
        /// <returns>獲得経験値</returns>
        public static int CalculateExp(int currentCombo)
        {
            return GameConstants.BASE_EXP + (currentCombo * GameConstants.COMBO_EXP_MULTIPLIER);
        }
    }

    /// <summary>
    /// レベルシステムを管理するクラス
    /// </summary>
    [Serializable]
    public class LevelSystem
    {
        public int Level = GameConstants.INITIAL_LEVEL;
        public int Exp = GameConstants.INITIAL_EXP;
        public int MaxExp = GameConstants.INITIAL_MAX_EXP;

        /// <summary>
        /// 経験値を追加し、レベルアップを処理
        /// </summary>
        /// <param name="amount">追加する経験値</param>
        /// <param name="growthRate">レベルアップ時のMaxExp成長率</param>
        /// <returns>レベルアップしたかどうか</returns>
        public bool AddExp(int amount, float growthRate = GameConstants.STAGE_LEVEL_GROWTH)
        {
            Exp += amount;
            bool leveledUp = false;

            while (Exp >= MaxExp)
            {
                Exp -= MaxExp;
                Level++;
                MaxExp = Mathf.FloorToInt(MaxExp * growthRate);
                leveledUp = true;
            }

            return leveledUp;
        }

        /// <summary>
        /// 現在の進捗率を取得（0.0 ~ 1.0）
        /// </summary>
        public float GetProgress()
        {
            return (float)Exp / MaxExp;
        }
    }

    /// <summary>
    /// ステージ別レベルを管理
    /// </summary>
    [Serializable]
    public class StageLevels
    {
        public LevelSystem AI = new LevelSystem();
        public LevelSystem Writing = new LevelSystem();
        public LevelSystem Design = new LevelSystem();
        public LevelSystem Marketing = new LevelSystem();
        public LevelSystem Coding = new LevelSystem();
        public LevelSystem Other = new LevelSystem();

        /// <summary>
        /// 全体プレイヤーレベルを計算
        /// </summary>
        public int CalculatePlayerLevel()
        {
            int totalLevel = AI.Level + Writing.Level + Design.Level +
                             Marketing.Level + Coding.Level + Other.Level;
            return Mathf.FloorToInt(totalLevel * GameConstants.PLAYER_LEVEL_RATIO);
        }

        /// <summary>
        /// ステージIDからLevelSystemを取得
        /// </summary>
        public LevelSystem GetStage(string stageId)
        {
            return stageId.ToLower() switch
            {
                "ai" => AI,
                "writing" => Writing,
                "design" => Design,
                "marketing" => Marketing,
                "coding" => Coding,
                "other" => Other,
                _ => AI
            };
        }
    }

    /// <summary>
    /// スキルポイント（スパイダーチャート用）
    /// </summary>
    [Serializable]
    public class SkillSystem
    {
        public LevelSystem Grammar = new LevelSystem();      // プロンプト基礎
        public LevelSystem Vocabulary = new LevelSystem();   // AI用語
        public LevelSystem Structure = new LevelSystem();    // 指示構造化
        public LevelSystem Expression = new LevelSystem();   // 効果的表現
        public LevelSystem Logic = new LevelSystem();        // 論理的思考
        public LevelSystem Editing = new LevelSystem();      // プロンプト改善

        /// <summary>
        /// カテゴリ名からスキルに経験値を追加
        /// </summary>
        public void AddSkillExp(string category, int amount = GameConstants.SKILL_EXP_PER_CORRECT)
        {
            LevelSystem skill = GetSkillByCategory(category);
            skill?.AddExp(amount, GameConstants.SKILL_LEVEL_GROWTH);
        }

        /// <summary>
        /// カテゴリ名からLevelSystemを取得
        /// </summary>
        public LevelSystem GetSkillByCategory(string category)
        {
            return category switch
            {
                "文法" => Grammar,
                "語彙" => Vocabulary,
                "構成" => Structure,
                "表現" => Expression,
                "論理" => Logic,
                "推敲" => Editing,
                _ => null
            };
        }

        /// <summary>
        /// スパイダーチャート用の値を取得（6項目）
        /// </summary>
        public float[] GetRadarChartValues()
        {
            return new float[]
            {
                Grammar.Level,
                Vocabulary.Level,
                Structure.Level,
                Expression.Level,
                Logic.Level,
                Editing.Level
            };
        }
    }

    /// <summary>
    /// コレクションアイテム（旧：装備）
    /// </summary>
    [Serializable]
    public class CollectionItem
    {
        public string Id;
        public string Name;
        public int UnlockLevel;
        public int Bonus;

        public CollectionItem(string id, string name, int unlockLevel, int bonus)
        {
            Id = id;
            Name = name;
            UnlockLevel = unlockLevel;
            Bonus = bonus;
        }
    }

    /// <summary>
    /// コレクション管理
    /// </summary>
    public class CollectionManager
    {
        public List<CollectionItem> AllItems { get; private set; }
        public List<string> UnlockedItems { get; private set; } = new List<string>();

        public CollectionManager()
        {
            AllItems = new List<CollectionItem>
            {
                new CollectionItem("pen1", "木のペン", 1, 5),
                new CollectionItem("pen2", "銀のペン", 3, 10),
                new CollectionItem("pen3", "金のペン", 5, 15),
                new CollectionItem("book1", "初心者の本", 2, 5),
                new CollectionItem("book2", "上級者の本", 4, 10),
                new CollectionItem("glasses", "知恵のメガネ", 6, 20)
            };
        }

        /// <summary>
        /// プレイヤーレベルに応じてアイテムをアンロック
        /// </summary>
        public List<CollectionItem> CheckUnlocks(int playerLevel)
        {
            List<CollectionItem> newUnlocks = new List<CollectionItem>();

            foreach (var item in AllItems)
            {
                if (playerLevel >= item.UnlockLevel && !UnlockedItems.Contains(item.Id))
                {
                    UnlockedItems.Add(item.Id);
                    newUnlocks.Add(item);
                }
            }

            return newUnlocks;
        }
    }

    /// <summary>
    /// コンボ管理
    /// </summary>
    public class ComboManager
    {
        public int CurrentCombo { get; private set; } = 0;
        public int MaxCombo { get; private set; } = 0;

        /// <summary>
        /// 正解時：コンボを増加
        /// </summary>
        public void OnCorrectAnswer()
        {
            CurrentCombo++;
            if (CurrentCombo > MaxCombo)
            {
                MaxCombo = CurrentCombo;
            }
        }

        /// <summary>
        /// 不正解時：コンボをリセット
        /// </summary>
        public void OnWrongAnswer()
        {
            CurrentCombo = 0;
        }

        /// <summary>
        /// セッション開始時にリセット
        /// </summary>
        public void ResetSession()
        {
            CurrentCombo = 0;
            // MaxComboは累計記録なのでリセットしない
        }
    }

    /// <summary>
    /// 家出システム（Unity版で新規実装）
    /// </summary>
    public class RunawaySystem
    {
        /// <summary>
        /// 家出判定を行う
        /// </summary>
        /// <param name="lastLoginTime">最終ログイン時刻</param>
        /// <returns>家出状態かどうか</returns>
        public static bool CheckRunaway(DateTime lastLoginTime)
        {
            TimeSpan elapsed = DateTime.Now - lastLoginTime;
            return elapsed.TotalHours >= GameConstants.RUNAWAY_HOURS;
        }
    }

    /// <summary>
    /// キャラクター進化システム
    /// </summary>
    public class EvolutionSystem
    {
        public bool HasHatched { get; private set; } = false;
        public bool NeedsHatchAnimation { get; set; } = false;

        /// <summary>
        /// 孵化条件をチェック
        /// </summary>
        /// <param name="stageLevel">ステージレベル</param>
        public void CheckHatchCondition(int stageLevel)
        {
            if (stageLevel >= GameConstants.HATCH_LEVEL && !HasHatched)
            {
                HasHatched = true;
                NeedsHatchAnimation = true;
            }
        }
    }

    /// <summary>
    /// ゲーム全体の状態を管理
    /// </summary>
    [Serializable]
    public class GameState
    {
        // プレイヤー情報
        public string PlayerName = "";
        public string CharacterName = "";
        public string SelectedCharacter = "";

        // レベル関連
        public int PlayerLevel = 1;
        public StageLevels StageLevels = new StageLevels();
        public SkillSystem Skills = new SkillSystem();

        // 進捗
        public bool HasHatched = false;
        public int TotalAnswers = 0;
        public int CorrectAnswers = 0;
        public int MaxCombo = 0;

        // セッション情報（保存しない）
        [NonSerialized] public int Score = 0;
        [NonSerialized] public int SessionCorrectAnswers = 0;
        [NonSerialized] public float TimeLeft = GameConstants.QUIZ_TIME_LIMIT;
        [NonSerialized] public bool IsPlaying = false;

        // コレクション
        public List<string> Collection = new List<string>();

        // 最終ログイン（家出判定用）
        public string LastLoginTime = "";
    }

    /// <summary>
    /// セーブ・ロード管理
    /// </summary>
    public static class SaveManager
    {
        private const string SAVE_KEY = "SkillEvolveSaveData";

        /// <summary>
        /// ゲームデータを保存
        /// </summary>
        public static void Save(GameState state)
        {
            state.LastLoginTime = DateTime.Now.ToString("o");
            string json = JsonUtility.ToJson(state);
            PlayerPrefs.SetString(SAVE_KEY, json);
            PlayerPrefs.Save();
        }

        /// <summary>
        /// ゲームデータを読み込み
        /// </summary>
        public static GameState Load()
        {
            if (PlayerPrefs.HasKey(SAVE_KEY))
            {
                string json = PlayerPrefs.GetString(SAVE_KEY);
                return JsonUtility.FromJson<GameState>(json);
            }
            return new GameState();
        }

        /// <summary>
        /// セーブデータを削除
        /// </summary>
        public static void Delete()
        {
            PlayerPrefs.DeleteKey(SAVE_KEY);
        }
    }

    /// <summary>
    /// クイズ問題データ
    /// </summary>
    [Serializable]
    public class QuizQuestion
    {
        public string Type;           // "single", "multiple"
        public string Question;       // 問題文
        public string[] Options;      // 選択肢
        public string Answer;         // 正解（single用）
        public string[] Answers;      // 正解（multiple用）
        public string Category;       // スキルカテゴリ
        public int MinLevel;          // 必要レベル

        /// <summary>
        /// 回答が正解かどうかを判定
        /// </summary>
        public bool Validate(string userAnswer)
        {
            if (Type == "single")
            {
                return userAnswer == Answer;
            }
            return false;
        }

        /// <summary>
        /// 複数選択の回答が正解かどうかを判定
        /// </summary>
        public bool ValidateMultiple(string[] userAnswers)
        {
            if (Type != "multiple" || Answers == null) return false;

            if (userAnswers.Length != Answers.Length) return false;

            var sortedUser = new List<string>(userAnswers);
            var sortedCorrect = new List<string>(Answers);
            sortedUser.Sort();
            sortedCorrect.Sort();

            for (int i = 0; i < sortedUser.Count; i++)
            {
                if (sortedUser[i] != sortedCorrect[i]) return false;
            }
            return true;
        }
    }
}
