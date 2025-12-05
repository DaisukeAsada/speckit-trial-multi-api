/**
 * 共通バリデーションユーティリティ
 * リクエストデータのバリデーション関数を提供
 */
const { body, param, query, validationResult } = require('express-validator');

/**
 * UUIDの正規表現パターン
 */
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/**
 * メールアドレスバリデーション
 */
const validateEmail = body('email')
  .trim()
  .isEmail()
  .withMessage('有効なメールアドレスを入力してください')
  .normalizeEmail();

/**
 * パスワードバリデーション
 * - 8文字以上
 * - 英字と数字を含む
 */
const validatePassword = body('password')
  .isLength({ min: 8 })
  .withMessage('パスワードは8文字以上で入力してください')
  .matches(/[a-zA-Z]/)
  .withMessage('パスワードには英字を含めてください')
  .matches(/[0-9]/)
  .withMessage('パスワードには数字を含めてください');

/**
 * ユーザー名バリデーション
 */
const validateName = body('name')
  .trim()
  .isLength({ min: 1, max: 100 })
  .withMessage('名前は1〜100文字で入力してください');

/**
 * 記事タイトルバリデーション
 */
const validateTitle = body('title')
  .trim()
  .isLength({ min: 1, max: 200 })
  .withMessage('タイトルは1〜200文字で入力してください')
  .custom((value) => {
    if (value.trim().length === 0) {
      throw new Error('タイトルに空白のみは使用できません');
    }
    return true;
  });

/**
 * 記事本文バリデーション（最大64KB）
 */
const validateContent = body('content')
  .isLength({ min: 1, max: 65536 })
  .withMessage('本文は1〜65536文字で入力してください');

/**
 * 記事ステータスバリデーション
 */
const validateStatus = body('status')
  .optional()
  .isIn(['draft', 'published'])
  .withMessage('ステータスは draft または published のみ指定可能です');

/**
 * 記事ステータスバリデーション（必須）
 */
const validateStatusRequired = body('status')
  .isIn(['draft', 'published'])
  .withMessage('ステータスは draft または published のみ指定可能です');

/**
 * UUID形式のIDパラメータバリデーション
 */
const validateIdParam = param('id')
  .matches(UUID_PATTERN)
  .withMessage('無効なID形式です。UUID形式で指定してください');

/**
 * ページネーション: ページ番号バリデーション
 */
const validatePage = query('page')
  .optional()
  .isInt({ min: 1 })
  .withMessage('ページ番号は1以上の整数で指定してください')
  .toInt();

/**
 * ページネーション: 取得件数バリデーション
 */
const validateLimit = query('limit')
  .optional()
  .isInt({ min: 1, max: 100 })
  .withMessage('取得件数は1〜100の整数で指定してください')
  .toInt();

/**
 * フィルター: ステータスバリデーション
 */
const validateStatusFilter = query('status')
  .optional()
  .isIn(['draft', 'published'])
  .withMessage('ステータスは draft または published のみ指定可能です');

/**
 * ソートバリデーション
 */
const validateSort = query('sort')
  .optional()
  .matches(/^(createdAt|updatedAt|title):(asc|desc)$/)
  .withMessage('ソートは "フィールド:方向" 形式で指定してください（例: createdAt:desc）');

/**
 * リフレッシュトークンバリデーション
 */
const validateRefreshToken = body('refreshToken')
  .notEmpty()
  .withMessage('リフレッシュトークンを入力してください');

/**
 * バリデーションエラーをチェックするミドルウェア
 * @param {Object} req - リクエスト
 * @param {Object} res - レスポンス
 * @param {Function} next - 次のミドルウェア
 */
function checkValidation(req, res, next) {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: 'Validation Error',
      message: 'バリデーションエラーが発生しました',
      details: errors.array().map((err) => ({
        field: err.path,
        message: err.msg,
        value: err.value,
      })),
    });
  }
  
  next();
}

/**
 * UUIDが有効かチェック
 * @param {string} uuid - チェックするUUID
 * @returns {boolean} 有効な場合true
 */
function isValidUuid(uuid) {
  return UUID_PATTERN.test(uuid);
}

module.exports = {
  validateEmail,
  validatePassword,
  validateName,
  validateTitle,
  validateContent,
  validateStatus,
  validateStatusRequired,
  validateIdParam,
  validatePage,
  validateLimit,
  validateStatusFilter,
  validateSort,
  validateRefreshToken,
  checkValidation,
  isValidUuid,
  UUID_PATTERN,
};
