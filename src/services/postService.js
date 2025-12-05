/**
 * 記事サービス
 * 記事の作成、取得、更新、削除のビジネスロジック
 */
const Post = require('../models/Post');
const User = require('../models/User');
const { notFound, forbidden, badRequest } = require('../middlewares/errorHandler');
const { isValidUuid } = require('../utils/validators');

/**
 * 記事を作成
 * @param {Object} postData - 記事データ
 * @param {string} postData.title - タイトル
 * @param {string} postData.content - 本文
 * @param {string} postData.status - ステータス（オプション）
 * @param {Object} user - 作成者情報
 * @param {string} user.id - ユーザーID
 * @param {string} user.name - ユーザー名
 * @returns {Object} 作成された記事
 */
function createPost(postData, user) {
  const post = Post.create({
    userId: user.id,
    title: postData.title,
    content: postData.content,
    author: user.name, // ユーザー名を自動設定（clarification決定事項）
    status: postData.status || 'draft',
  });
  
  return post;
}

/**
 * 記事一覧を取得
 * @param {Object} options - 取得オプション
 * @param {number} options.page - ページ番号
 * @param {number} options.limit - 取得件数
 * @param {string} options.status - ステータスフィルター
 * @param {string} options.sort - ソート順
 * @returns {Object} 記事一覧とページネーション情報
 */
function getPosts(options = {}) {
  return Post.findAll(options);
}

/**
 * 記事詳細を取得
 * @param {string} id - 記事ID
 * @returns {Object} 記事
 * @throws {ApiError} 記事が見つからない場合
 */
function getPostById(id) {
  // UUID形式のバリデーション
  if (!isValidUuid(id)) {
    throw badRequest('無効なID形式です。UUID形式で指定してください');
  }
  
  const post = Post.findById(id);
  
  if (!post) {
    throw notFound('記事が見つかりません');
  }
  
  return post;
}

/**
 * 記事を更新
 * @param {string} id - 記事ID
 * @param {Object} updates - 更新データ
 * @param {Object} user - 操作者情報
 * @returns {Object} 更新された記事
 * @throws {ApiError} 記事が見つからない/権限がない場合
 */
function updatePost(id, updates, user) {
  // UUID形式のバリデーション
  if (!isValidUuid(id)) {
    throw badRequest('無効なID形式です。UUID形式で指定してください');
  }
  
  const post = Post.findById(id);
  
  if (!post) {
    throw notFound('記事が見つかりません');
  }
  
  // 権限チェック: 作成者またはadminのみ更新可能
  if (post.userId !== user.id && user.role !== 'admin') {
    throw forbidden('この記事を更新する権限がありません');
  }
  
  const updatedPost = Post.update(id, {
    title: updates.title,
    content: updates.content,
    status: updates.status,
  });
  
  return updatedPost;
}

/**
 * 記事を削除（物理削除）
 * @param {string} id - 記事ID
 * @param {Object} user - 操作者情報
 * @throws {ApiError} 記事が見つからない/権限がない場合
 */
function deletePost(id, user) {
  // UUID形式のバリデーション
  if (!isValidUuid(id)) {
    throw badRequest('無効なID形式です。UUID形式で指定してください');
  }
  
  const post = Post.findById(id);
  
  if (!post) {
    throw notFound('記事が見つかりません');
  }
  
  // 権限チェック: 作成者またはadminのみ削除可能
  if (post.userId !== user.id && user.role !== 'admin') {
    throw forbidden('この記事を削除する権限がありません');
  }
  
  Post.remove(id);
}

/**
 * ユーザーの記事一覧を取得
 * @param {string} userId - ユーザーID
 * @param {Object} options - 取得オプション
 * @returns {Object} 記事一覧とページネーション情報
 */
function getPostsByUserId(userId, options = {}) {
  return Post.findByUserId(userId, options);
}

module.exports = {
  createPost,
  getPosts,
  getPostById,
  updatePost,
  deletePost,
  getPostsByUserId,
};
