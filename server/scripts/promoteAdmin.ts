import { normalizeEmail } from '../models/user';
import userRepository from '../repositories/userRepository';
import { closeDatabaseConnection, connectToDatabase } from '../db/mongo';
/*
   * npm run admin:promote <email>
   * starts up database
   * Takes email argument and promotes user associated
   * with that email to admin
   * disconnects from database gracefully
   */
async function main(): Promise<void> {
  
  const email = process.argv[2];
  if (!email) {
    console.error('Usage: npm run admin:promote -- <email>');
    process.exitCode = 1;
    return;
  }

  await connectToDatabase();
  const user = await userRepository.findByEmail(normalizeEmail(email));
  if (!user) {
    console.error(`No user found with email ${email}`);
    process.exitCode = 1;
    return;
  }

  const updated = await userRepository.updateRole(user._id, 'admin');
  console.log(`Promoted ${updated?.email} to admin`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(closeDatabaseConnection);
