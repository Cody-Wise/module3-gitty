const pool = require('../utils/pool');

class Post {
  id;
  description;

  constructor(row) {
    this.id = row.id;
    this.description = row.description;
  }

  static async getAll() {
    const { rows } = await pool.query(
      `
            SELECT *
            FROM posts
            `
    );
    return rows.map((row) => new Post(row));
  }

  static async insert({ description }) {
    const { rows } = await pool.query(
      `
            INSERT INTO posts (description)
            VALUES ($1)
            RETURNING *
            `,
      [description]
    );
    return new Post(rows[0]);
  }
}

module.exports = Post;
