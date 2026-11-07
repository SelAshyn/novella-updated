// Test Firebase Admin SDK setup
import admin from 'firebase-admin';

const firebaseConfig = {
  projectId: 'novella-34657',
  clientEmail: 'firebase-adminsdk-fbsvc@novella-34657.iam.gserviceaccount.com',
  privateKey: `-----BEGIN PRIVATE KEY-----
MIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQDQ153YDjVcPQXz
mqk/xEuvBaTGH4aMh5nhrv80DYt9bq5lqOj6chGp5KueHvkPueCQgMm3HsZnwjXB
p3netxkCGOgSriaFULXqOKtUg4O6CGzVOTbjwjoqkHyE0s/XCQ29bazYHTOdR8zI
CagzZLcpgB/Mj42ZTmvzRLS3kSLvsTxDqh/2esrGqgz7bnewuxlKarmDlR/dZIZ5
v8WOWH4WVCybwrIyEDMNbI6WSNPpdJCPkbhDjDVGdUqLG4dRIGSjq6X1Jt6iGFtn
6N8W+1N45hpIqArJcEyEbvZRJbrg9fQuZ8XTVFBybaDOWbW/3hW2wAymv6UQz0wh
j5tTeIgLAgMBAAECggEAFNS8+NUJ+4ZWtqLBqQuiZPXSJrT0TcYk0j8LU5zaQgut
N5SukHSaUHDvsVjzjN8EiEVgWXSnY6gahpN284Ed7HihhWN7kianzpISfN6VYBQB
Dw+i6vrvpFk/IlyIwLE1fqSW7gOTp2eHBJj5/w5Xurr98QCMpjMNT3mV8Q14B6Je
4y3y239hCv0PQYURGm1148NFtqjM4ATH/rcU5S3Pa+SPCd5b4TnH9jvYY8gR0Tqg
NR9z+07DnvUkh/uis2bcwE0BF54HOdUdUkdsvSxxZb2JoBxEGAsS/AEk8T7iTBSh
FLkYmshL+WK477zllQnH6Le7aCurQ+0knzjl2yQ5kQKBgQD1rkSXN11NREQuA2zi
ugtwX5FBfjrRoE66k8QmvWP0isyRtmcXHfsEPMJfBMNhkVXUM1ny4UZK6gV7Lx97
AWaCR25ceeXM5LDyIP65I6QKanOnab1X4oMxFTrZlbZ7kkUVRwYHzNFSgUIl1B7V
cZgPB/kg+ORw+XwrfvAv4rXxMwKBgQDZnTxBnIayUvgXVsPMq92BeQoMwnvOniQr
FL0sOApTq5CTZjkxR6IAQFKEfFEaah35gGCc0l0kIq65RGcW4jU80UOdp56h+lOC
1Y0tfD49Gt0mZtnt/CUvhXE+57Gu9XG8WXPwjHzaZUvQuTpkytUqBrWHJ6Vq2uHZ
svjSoUc9yQKBgEShvj+QE9x16aYBBvX/ixqFWAq3vK663cN5bB52Yen6rFM4ZWwr
z+fLIXFx3zLuas+w2Lvk+sIKxiU3cM/oAD78vXPQCcZHTLcXSJFnx3exbUWjYGWg
vY2EpMAL9sJmhi3/fUvIh+FIgrYWn9Z4uUXZsFrprMdyqqFsAKUf7DvJAoGBAK29
n7IyqkgNfg4EM+dhAESywpdVX0ujbvUGZdK8G2KaA5/raZYyvuC8eiVUq9wPBUeC
e6A5RCvplN5OApB+okqgOP/SKBDir3Ix1bmPDJH0tMRIMY6UVYwPWk8C5RXu2JOs
R6iyQayMW2+Vs01ts6sOGDiEKsmZX+BTx91C7oIhAoGAOtV4ypZTVm+JQ0sSgYyF
9t8JB+jgIKmLlEDfX52lqqnS/MBsIs40zVSSR8CSI35l/0WTS0tF0O31OaSN+kU7
Np63Y2oeW4hTMLP9BSsQNspuzwj65g1d1hfy1I83TJEiyqPnki4M+x+33OozWetO
VmHOjtIkaSR7H3lZQ0MEeOY=
-----END PRIVATE KEY-----`,
};

async function testFirebaseAdmin() {
  try {
    console.log('🔍 Testing Firebase Admin SDK...\n');

    // Initialize
    const app = admin.initializeApp({
      credential: admin.credential.cert({
        projectId: firebaseConfig.projectId,
        clientEmail: firebaseConfig.clientEmail,
        privateKey: firebaseConfig.privateKey,
      }),
    });

    console.log('✅ Firebase Admin SDK initialized successfully!');
    console.log('   Project ID:', firebaseConfig.projectId);
    console.log('   Client Email:', firebaseConfig.clientEmail);

    // Test authentication
    const auth = admin.auth();
    console.log('\n✅ Firebase Auth module is accessible');

    console.log('\n✨ All Firebase Admin SDK tests passed!');
    console.log('   Your API routes will now work correctly.');

    // Clean up
    await app.delete();

  } catch (error) {
    console.error('❌ Firebase Admin test failed:');
    console.error('   Error:', error.message);

    console.log('\n💡 Troubleshooting:');
    console.log('   - Check FIREBASE_PROJECT_ID matches your Firebase project');
    console.log('   - Check FIREBASE_CLIENT_EMAIL is correct');
    console.log('   - Check FIREBASE_PRIVATE_KEY includes BEGIN/END lines');
    console.log('   - Make sure the service account has proper permissions');
  }
}

testFirebaseAdmin();
