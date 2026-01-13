import admin from 'firebase-admin';
import 'dotenv/config';

// Inicializar Firebase Admin
admin.initializeApp();
const db = admin.firestore();

async function createAdmin(email) {
  try {
    // Buscar usuário pelo email
    const userRecord = await admin.auth().getUserByEmail(email);
    
    // Atualizar documento no Firestore
    await db.collection('users').doc(userRecord.uid).set({
      role: 'admin'
    }, { merge: true });
    
    console.log(`✅ Usuário ${email} agora é admin!`);
    process.exit(0);
  } catch (error) {
    console.error('❌ Erro:', error.message);
    process.exit(1);
  }
}

// Substitua pelo seu email
const EMAIL = 'kauanbertolo8@gmail.com';
createAdmin(EMAIL);
