/**
 * バリデーションミドルウェア
 * express-validator のバリデーションルールを適用
 */
const { checkValidation } = require('../utils/validators');

/**
 * バリデーションミドルウェアを作成
 * @param {Array} validators - express-validator のバリデーションルール配列
 * @returns {Array} ミドルウェア配列
 */
function validate(validators) {
  return [...validators, checkValidation];
}

module.exports = {
  validate,
};
