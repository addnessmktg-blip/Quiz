# 音源ファイル配置ガイド

このフォルダに以下の音源ファイルを配置してください。

## 必要な音源ファイル

### BGM（ループ再生）
- **bgm_play.mp3** - キャラクター選択画面用のBGM
- **bgm_correct.mp3** - クイズプレイ中のBGM
- **bgm_main.mp3** - リザルト画面用のBGM

### 効果音（SE）
- **se_click.mp3** - ボタンタップ音
- **se_result_entry.mp3** - ゲーム終了時のファンファーレ

### 未使用（今後の拡張用）
- **think_as_a_smart.mp3** - 現在は使用していません

## 配置後のフォルダ構造

```
/Users/santakurosu/Desktop/TsumQMA/
└── public/
    └── audio/
        ├── bgm_play.mp3
        ├── bgm_correct.mp3
        ├── bgm_main.mp3
        ├── se_click.mp3
        ├── se_result_entry.mp3
        └── think_as_a_smart.mp3
```

## 画面とBGMの対応

- **キャラクター選択画面**: bgm_play.mp3
- **クイズプレイ中**: bgm_correct.mp3
- **リザルト画面**: se_result_entry.mp3 → bgm_main.mp3

## 注意事項

- ファイル名は正確に一致させてください（大文字小文字も区別されます）
- 対応フォーマット: MP3, WAV, OGG など（Howler.js対応形式）
- ブラウザのコンソールにエラーが表示される場合、ファイル名とパスを確認してください

## 音量調整

ゲーム内の🔊ボタンから以下の音量を調整できます：
- マスター音量（全体の音量）
- BGM音量
- SE音量（効果音）
