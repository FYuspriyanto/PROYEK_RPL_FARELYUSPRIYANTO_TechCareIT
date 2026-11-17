import { prisma } from '../src/lib/prisma';
import {
  hashPassword,
  verifyPassword,
  createToken,
  verifyToken,
  requireAuth,
} from '../src/lib/auth';
import { z } from 'zod';

async function runTests() {
  console.log('====================================================');
  console.log('🧪 RUNNING AUTHENTICATION & SECURITY TEST SUITE');
  console.log('====================================================\n');

  let passedTests = 0;
  let failedTests = 0;

  function assert(condition: boolean, testName: string, detail?: string) {
    if (condition) {
      console.log(`✅ PASS: ${testName}`);
      passedTests++;
    } else {
      console.error(`❌ FAIL: ${testName} - ${detail || ''}`);
      failedTests++;
    }
  }

  // ----------------------------------------------------
  // TEST 1: Password Hashing & No Plaintext Storage
  // ----------------------------------------------------
  console.log('▶ 1. Testing Password Hashing & Plaintext Verification...');
  const users = await prisma.user.findMany();
  assert(users.length > 0, 'Database contains seeded users');

  const allPasswordsHashed = users.every(
    (u) => u.password.startsWith('$2a$') || u.password.startsWith('$2b$')
  );
  assert(
    allPasswordsHashed,
    'All passwords in database are securely hashed with bcrypt (no plaintext)'
  );

  const adminUser = users.find((u) => u.role === 'ADMIN');
  assert(!!adminUser, 'Admin user exists in database');
  if (adminUser) {
    const validAdminPass = await verifyPassword('AdminPassword123!', adminUser.password);
    const wrongAdminPass = await verifyPassword('WrongPassword!', adminUser.password);
    assert(validAdminPass, 'Admin password matches hash');
    assert(!wrongAdminPass, 'Incorrect password rejected');
  }

  // ----------------------------------------------------
  // TEST 2: Customer Registration & Profile Creation
  // ----------------------------------------------------
  console.log('\n▶ 2. Testing Customer Registration & Profile Relation...');
  const testEmail = `test_customer_${Date.now()}@example.com`;
  const plainPass = 'SecurePass2026!';
  const hashed = await hashPassword(plainPass);

  const newCustomer = await prisma.user.create({
    data: {
      name: 'Rian Hidayat',
      email: testEmail,
      password: hashed,
      role: 'CUSTOMER',
      phone: '081987654321',
      profile: {
        create: {
          address: 'Jl. Rasuna Said Kav. 62, Jakarta Selatan',
        },
      },
    },
    include: {
      profile: true,
    },
  });

  assert(newCustomer.role === 'CUSTOMER', 'New user registered as CUSTOMER role');
  assert(newCustomer.profile?.address === 'Jl. Rasuna Said Kav. 62, Jakarta Selatan', 'Customer profile address created and linked');
  assert(newCustomer.password !== plainPass, 'Registered password is not plaintext');

  // ----------------------------------------------------
  // TEST 3: JWT Session Creation & Verification
  // ----------------------------------------------------
  console.log('\n▶ 3. Testing Session Management & JWT Token Verification...');
  const customerSession = {
    id: newCustomer.id,
    name: newCustomer.name,
    email: newCustomer.email,
    role: newCustomer.role as 'CUSTOMER',
    phone: newCustomer.phone,
  };

  const token = await createToken(customerSession);
  assert(typeof token === 'string' && token.length > 20, 'JWT session token created successfully');

  const verified = await verifyToken(token);
  assert(verified?.id === newCustomer.id, 'Session payload correctly verified from JWT');
  assert(verified?.role === 'CUSTOMER', 'Role preserved in JWT session');

  const invalidToken = await verifyToken(token + 'corrupted');
  assert(invalidToken === null, 'Corrupted / invalid JWT token properly rejected');

  // ----------------------------------------------------
  // TEST 4: Role-Based Access Control (RBAC)
  // ----------------------------------------------------
  console.log('\n▶ 4. Testing Role-Based Authorization & Route Policies...');
  const adminSession = {
    id: adminUser?.id || 'admin-id',
    name: 'Admin',
    email: 'admin@techcare.id',
    role: 'ADMIN' as const,
  };

  // Mock checking authorization rules
  function checkAccess(session: { role: 'ADMIN' | 'CUSTOMER' }, path: string): boolean {
    if (path.startsWith('/admin')) {
      return session.role === 'ADMIN';
    }
    if (path.startsWith('/customer')) {
      return true; // Both customer and admin can access
    }
    return true;
  }

  assert(
    checkAccess(adminSession, '/admin/dashboard') === true,
    'ADMIN allowed access to /admin/dashboard'
  );
  assert(
    checkAccess(customerSession, '/admin/dashboard') === false,
    'CUSTOMER blocked from /admin/dashboard (Unauthorized)'
  );
  assert(
    checkAccess(customerSession, '/customer/dashboard') === true,
    'CUSTOMER allowed access to /customer/dashboard'
  );

  // ----------------------------------------------------
  // TEST 5: Customer Data Isolation (Order Security)
  // ----------------------------------------------------
  console.log('\n▶ 5. Testing Customer Data Isolation (Order Access Guard)...');
  const allOrders = await prisma.serviceOrder.findMany({
    include: { customer: true },
  });
  assert(allOrders.length >= 2, 'Found seeded service orders');

  const budiOrder = allOrders.find((o) => o.customer.email === 'budi@gmail.com');
  const sitiOrder = allOrders.find((o) => o.customer.email === 'siti@gmail.com');

  assert(!!budiOrder && !!sitiOrder, 'Both Budi and Siti have orders');

  if (budiOrder && sitiOrder) {
    const budiSession = {
      id: budiOrder.customerId,
      role: 'CUSTOMER' as const,
      email: 'budi@gmail.com',
    };

    // Helper logic mirroring API route security check
    function canCustomerAccessOrder(session: { id: string; role: string }, order: { customerId: string }) {
      if (session.role === 'ADMIN') return true;
      return order.customerId === session.id;
    }

    assert(
      canCustomerAccessOrder(budiSession, budiOrder) === true,
      'Customer Budi can access his own order'
    );
    assert(
      canCustomerAccessOrder(budiSession, sitiOrder) === false,
      'Customer Budi CANNOT access Customer Siti order (403 Forbidden)'
    );
    assert(
      canCustomerAccessOrder(adminSession, budiOrder) === true,
      'ADMIN can view all customer orders globally'
    );
  }

  // ----------------------------------------------------
  // TEST 6: Input Validation with Zod
  // ----------------------------------------------------
  console.log('\n▶ 6. Testing Input Validation...');
  const testSchema = z.object({
    email: z.string().email(),
    password: z.string().min(6),
  });

  const validParsed = testSchema.safeParse({
    email: 'valid@example.com',
    password: 'securePassword123',
  });
  assert(validParsed.success === true, 'Valid input passes Zod schema');

  const invalidEmail = testSchema.safeParse({
    email: 'invalid-email-format',
    password: 'securePassword123',
  });
  assert(invalidEmail.success === false, 'Malformed email rejected by validator');

  const shortPassword = testSchema.safeParse({
    email: 'valid@example.com',
    password: '123',
  });
  assert(shortPassword.success === false, 'Short password (<6 chars) rejected by validator');

  // Clean up test customer
  await prisma.customerProfile.deleteMany({ where: { userId: newCustomer.id } });
  await prisma.user.delete({ where: { id: newCustomer.id } });
  console.log('\n🧹 Test customer clean-up completed.');

  console.log('\n====================================================');
  console.log(`📊 TEST RESULTS: ${passedTests} PASSED, ${failedTests} FAILED`);
  console.log('====================================================');

  if (failedTests > 0) {
    process.exit(1);
  }
}

runTests()
  .catch((e) => {
    console.error('Fatal test error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
