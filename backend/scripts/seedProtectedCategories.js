

require('dotenv').config();
const db = require('../src/config/db');
const Category = require('../src/models/Category');

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

async function seedCategories(force = false) {
  try {
    console.log('🔌 Connecting to database...');
    await db.authenticate();
    console.log('✅ Database connected\n');

    console.log('📊 Syncing models...');
    await db.sync({ alter: true });
    console.log('✅ Models synced\n');

    console.log('🌱 Seeding protected categories...');
    console.log(`   Mode: ${force ? 'FORCE UPDATE' : 'CREATE ONLY'}\n`);
    
    let created = 0;
    let updated = 0;
    let skipped = 0;
    
    for (const categoryData of PROTECTED_CATEGORIES) {
      const [category, wasCreated] = await Category.findOrCreate({
        where: { value: categoryData.value },
        defaults: categoryData
      });

      if (wasCreated) {
        created++;
        console.log(`   ✅ Created: ${categoryData.label} (${categoryData.value})`);
      } else if (force) {
        await category.update(categoryData);
        updated++;
        console.log(`   🔄 Updated: ${categoryData.label} (${categoryData.value})`);
      } else {
        skipped++;
        console.log(`   ⏭️  Skipped: ${categoryData.label} (${categoryData.value}) - already exists`);
      }
    }

    console.log('\n📊 Summary:');
    console.log(`   ✅ Created: ${created}`);
    console.log(`   🔄 Updated: ${updated}`);
    console.log(`   ⏭️  Skipped: ${skipped}`);
    console.log(`   📌 Total: ${PROTECTED_CATEGORIES.length}`);
    
    console.log('\n✅ Seeding complete!');
    
    // List all categories
    console.log('\n📋 Current categories in database:');
    const allCategories = await Category.findAll({
      order: [['displayOrder', 'ASC']]
    });
    
    allCategories.forEach(cat => {
      console.log(`   ${cat.isActive ? '✅' : '❌'} ${cat.label} (${cat.value}) - ${cat.isProtected ? '🛡️  Protected' : '📝 Custom'}`);
    });
    
    await db.close();
    console.log('\n👋 Database connection closed');
    process.exit(0);
    
  } catch (error) {
    console.error('\n❌ Error seeding categories:', error);
    await db.close();
    process.exit(1);
  }
}

// Check for --force flag
const forceMode = process.argv.includes('--force');

if (forceMode) {
  console.log('⚠️  FORCE MODE ENABLED - Will update existing categories\n');
}

seedCategories(forceMode);