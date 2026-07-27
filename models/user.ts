export class User {
  user_id: number;
  name: string;
  email: string;
  created_at: string;

  constructor(id: number, name: string, email: string) {
    this.user_id = id;
    this.name = name;
    this.email = email;
    this.created_at = new Date().toISOString();
  }
}
