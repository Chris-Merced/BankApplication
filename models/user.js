class User {
  constructor(id, name, email) {
    this.user_id = id;
    this.name = name;
    this.email = email;
    this.created_at = new Date().toISOString();
  }
}

module.exports = User;
