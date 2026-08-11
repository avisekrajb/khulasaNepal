const Category = require('../models/Category');
const Admin = require('../models/Admin');

// Protected categories configuration
const PROTECTED_CATEGORIES = [
  {
    value: 'news',
    label: 'समाचार (News)',
    icon: '📰',
    color: 'blue',
    displayOrder: 1,
    isProtected: true,
    isActive: true,
    description: 'General news and current affairs'
  },
  {
    value: 'local',
    label: 'स्थानीय (Local)',
    icon: '🏘️',
    color: 'green',
    displayOrder: 2,
    isProtected: true,
    isActive: true,
    description: 'Local news and community updates'
  },
  {
    value: 'sports',
    label: 'खेलकुद (Sports)',
    icon: '⚽',
    color: 'orange',
    displayOrder: 3,
    isProtected: true,
    isActive: true,
    description: 'Sports news and updates'
  },
  {
    value: 'society',
    label: 'समाज (Society)',
    icon: '👥',
    color: 'purple',
    displayOrder: 4,
    isProtected: true,
    isActive: true,
    description: 'Social issues and community stories'
  },
  {
    value: 'more',
    label: 'थप (More)',
    icon: '➕',
    color: 'teal',
    displayOrder: 5,
    isProtected: true,
    isActive: true,
    description: 'Miscellaneous and other news'
  }
];

async function seedProtectedCategories() {
  try {
    let created = 0;
    let existing = 0;
    
    for (const categoryData of PROTECTED_CATEGORIES) {
      const [category, wasCreated] = await Category.findOrCreate({
        where: { value: categoryData.value },
        defaults: categoryData
      });

      if (wasCreated) {
        created++;
        console.log(`   ✅ Created: ${categoryData.label}`);
      } else {
        existing++;
        // Ensure existing categories are marked as protected
        if (!category.isProtected) {
          await category.update({ isProtected: true });
          console.log(`   🔒 Protected: ${categoryData.label}`);
        }
      }
    }

    console.log(`✅ Categories: ${created} created, ${existing} existing`);
    return { success: true, created, existing };
  } catch (error) {
    console.error('❌ Error seeding categories:', error.message);
    throw error;
  }
}

async function seedSuperAdmin() {
  const email = process.env.SUPERADMIN_EMAIL;
  const password = process.env.SUPERADMIN_PASSWORD;

  if (!email || !password) {
    console.log('⚠️  SUPERADMIN_EMAIL / SUPERADMIN_PASSWORD not set in .env. Skipping superadmin seeding.');
    return { success: true, skipped: true };
  }

  try {
    await Admin.sync();
    const [admin, created] = await Admin.findOrCreate({
      where: { email },
      defaults: { email, password, role: 'superadmin', isActive: true }
    });

    if (created) {
      console.log(`✅ Superadmin created: ${email}`);
    } else {
      if (admin.role !== 'superadmin' || !admin.isActive) {
        await admin.update({ role: 'superadmin', isActive: true });
        console.log(`🔒 Promoted existing admin to superadmin: ${email}`);
      } else {
        console.log(`✅ Superadmin already exists: ${email}`);
      }
    }

    return { success: true, created };
  } catch (error) {
    console.error('❌ Error seeding superadmin:', error.message);
    throw error;
  }
}

async function initializeDatabase(db, options = {}) {
  const { isDevelopment = false } = options;
  
  try {
    console.log('\n🔌 Initializing database...');
    
    // Step 1: Test connection
    await db.authenticate();
    console.log('✅ Database connected');
    
    // Step 2: Sync models
    if (isDevelopment) {
      console.log('🔄 Development mode: Syncing database schema...');
      await db.sync({ alter: false });
      console.log('✅ Database schema synchronized');
    } else {
      console.log('📋 Production mode: Using existing schema');
      await db.authenticate(); // Just verify connection
    }
    
    // Step 3: Seed protected categories
    console.log('🌱 Seeding protected categories...');
    await seedProtectedCategories();

    // Step 4: Seed superadmin from environment variables
    console.log('🛡️  Seeding superadmin...');
    await seedSuperAdmin();
    
    console.log('✅ Database initialization complete\n');
    return true;
  } catch (err) {
    console.error('❌ Database initialization failed:', err);
    throw err;
  }
}

module.exports = { 
  initializeDatabase,
  seedProtectedCategories,
  seedSuperAdmin,
  PROTECTED_CATEGORIES 
};