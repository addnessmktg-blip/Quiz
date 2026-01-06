# Skill Evolve - ゲームロジック仕様書
## Unity移植用ドキュメント

このドキュメントは、Web版クイズゲーム「TsumQMA」からUnityアプリ版「Skill Evolve」へ移植する際に必要な計算式とゲームルールをまとめたものです。

---

## 1. スコア計算システム

### 基本スコア計算

```
正解時のスコア = BaseScore + ComboBonus
```

| 項目 | 計算式 | 値の例 |
|------|--------|--------|
| BaseScore | 固定値 | 100pt |
| ComboBonus | `currentCombo × 20` | 3コンボ → 60pt |
| **合計** | `100 + (combo × 20)` | 3コンボ時 → 160pt |

### TimeBonus（Unity版で追加推奨）

仕様書に記載があるが、Web版では未実装。Unity版での実装を推奨。

```
TimeBonus = 残り秒数 × 10
```

**実装例**: 残り45秒で正解 → +450pt

---

## 2. コンボシステム

### ルール
- **正解時**: `combo++`
- **不正解時**: `combo = 0`（即座にリセット）
- **最大コンボ記録**: セッション中の最高コンボを記録

### コンボによるボーナス一覧

| コンボ数 | スコアボーナス | 経験値ボーナス |
|---------|---------------|---------------|
| 1 | +20pt | +12 EXP |
| 2 | +40pt | +14 EXP |
| 3 | +60pt | +16 EXP |
| 5 | +100pt | +20 EXP |
| 10 | +200pt | +30 EXP |

---

## 3. 経験値・レベルシステム

### 経験値獲得（正解時）

```
獲得EXP = 10 + (currentCombo × 2)
```

### レベルアップ計算

```
while (currentExp >= maxExp) {
    currentExp -= maxExp;
    level++;
    maxExp = floor(maxExp × 1.5);
}
```

### レベルごとの必要経験値

| レベル | 必要EXP | 累計EXP |
|--------|---------|---------|
| 1 → 2 | 100 | 100 |
| 2 → 3 | 150 | 250 |
| 3 → 4 | 225 | 475 |
| 4 → 5 | 337 | 812 |
| 5 → 6 | 506 | 1,318 |

**係数**: `1.5倍`

### 初期値

```
level = 1
exp = 0
maxExp = 100
```

---

## 4. ステージ別レベルシステム

6つのステージそれぞれが独立したレベルを持つ。

### ステージ一覧

| ID | 名前 | 初期状態 |
|----|------|---------|
| ai | AI活用 | アンロック済み |
| writing | ライティング | アンロック済み |
| design | デザイン | ロック |
| marketing | マーケティング | ロック |
| coding | コーディング | ロック |
| other | その他 | ロック |

### 全体プレイヤーレベル計算

```
playerLevel = floor(全ステージのレベル合計 × 0.8)
```

**例**: 各ステージがLv.2の場合
- 合計: 2 × 6 = 12
- プレイヤーレベル: floor(12 × 0.8) = **Lv.9**

---

## 5. スキルポイントシステム（スパイダーチャート用）

### 6つのスキル項目

| ID | 名前 | カテゴリ | 角度 |
|----|------|---------|------|
| grammar | プロンプト基礎 | 文法 | 0° |
| vocabulary | AI用語 | 語彙 | 60° |
| structure | 指示構造化 | 構成 | 120° |
| expression | 効果的表現 | 表現 | 180° |
| logic | 論理的思考 | 論理 | 240° |
| editing | プロンプト改善 | 推敲 | 300° |

### スキル経験値

```
正解時: +5 スキルEXP（該当カテゴリのみ）
```

### スキルレベルアップ

```
if (skillExp >= skillMaxExp) {
    skillExp -= skillMaxExp;
    skillLevel++;
    skillMaxExp = floor(skillMaxExp × 1.3);
}
```

**係数**: `1.3倍`（ステージレベルより緩やか）

---

## 6. タイマーシステム

| 項目 | 値 |
|------|-----|
| 初期時間 | 60秒 |
| カウント間隔 | 1秒 |
| 終了条件 | `timeLeft <= 0` |

### フェーズ設計（仕様書より）

1. **Phase 1 (Reading)**: 問題文表示、タイマー停止
2. **Phase 2 (Action)**: "GO!" 演出後、タイマー開始

---

## 7. コレクションシステム（旧：装備）

プレイヤーレベルに応じてアイテムがアンロックされる。

### アイテム一覧

| ID | 名前 | アンロックLv | ボーナス |
|----|------|-------------|---------|
| pen1 | 木のペン | 1 | +5 |
| pen2 | 銀のペン | 3 | +10 |
| pen3 | 金のペン | 5 | +15 |
| book1 | 初心者の本 | 2 | +5 |
| book2 | 上級者の本 | 4 | +10 |
| glasses | 知恵のメガネ | 6 | +20 |

### アンロック判定

```
foreach (item in collectionList) {
    if (playerLevel >= item.unlockLevel && !unlockedItems.Contains(item.id)) {
        unlockedItems.Add(item.id);
    }
}
```

---

## 8. キャラクター進化システム

### 進化条件

| 条件 | トリガー |
|------|---------|
| 孵化 | いずれかのステージがLv.5到達 |

### 進化フラグ

```
if (stageLevel == 5 && !hasHatched) {
    hasHatched = true;
    needsHatchAnimation = true;  // リザルト画面で演出
}
```

---

## 9. 家出システム（仕様書より）

### 判定ロジック

```
起動時:
    timeSinceLastLogin = 現在時刻 - LastLoginTime

    if (timeSinceLastLogin >= 24時間) {
        キャラクター.SetActive(false);
        置き手紙.SetActive(true);
    }
```

**注意**: Web版では未実装。Unity版で新規実装が必要。

---

## 10. セーブデータ構造

### 保存項目

```json
{
    "selectedCharacter": "red",
    "playerName": "プレイヤー名",
    "characterName": "キャラクター名",
    "hasHatched": false,
    "level": 1,
    "exp": 0,
    "maxCombo": 0,
    "totalAnswers": 0,
    "correctAnswers": 0,
    "stageLevels": {
        "ai": { "level": 1, "exp": 0, "maxExp": 100 },
        "writing": { "level": 1, "exp": 0, "maxExp": 100 },
        ...
    },
    "collection": []
}
```

### Unity実装

`JsonUtility` を使用してローカル保存。

```csharp
string json = JsonUtility.ToJson(saveData);
PlayerPrefs.SetString("SaveData", json);
```

---

## 11. 問題データ形式

### JSONフォーマット

```json
{
    "type": "single",
    "question": "AIに指示を出す文章のことを何と呼ぶ？",
    "options": ["呪文", "プロンプト", "コマンド"],
    "answer": "プロンプト",
    "category": "文法",
    "minLevel": 1
}
```

### 問題タイプ

| type | 説明 |
|------|------|
| single | 4択問題（1つ正解） |
| multiple | 複数選択問題 |
| sort | 並べ替え問題（Web版では無効化） |

---

## 付録: 定数一覧

```csharp
// スコア
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

// 進化条件
public const int HATCH_LEVEL = 5;
public const int RUNAWAY_HOURS = 24;
```
