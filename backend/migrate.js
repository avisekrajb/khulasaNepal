// migrate.js - Simplified migration script using direct SQL
require('dotenv').config();
const { Sequelize } = require('sequelize');

// Create database connection
const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST,
    dialect: 'mysql',
    logging: false
  }
);

async function checkTableExists(tableName) {
  try {
    const [results] = await sequelize.query(`SHOW TABLES LIKE '${tableName}'`);
    return results.length > 0;
  } catch (error) {
    return false;
  }
}

async function migrate() {
  try {
    console.log('🔄 Starting migration...\n');
    
    // Test connection
    await sequelize.authenticate();
    console.log('✅ Database connected\n');
    
    // Check which tables exist
    const tables = ['news', 'local', 'society', 'sports', 'more'];
    const existingTables = [];
    
    for (const table of tables) {
      const exists = await checkTableExists(table);
      if (exists) {
        existingTables.push(table);
        console.log(`✅ Found table: ${table}`);
      } else {
        console.log(`⚠️  Table not found: ${table}`);
      }
    }
    
    if (existingTables.length === 0) {
      console.log('\n❌ No tables found to migrate!');
      console.log('   Make sure your old tables exist before running migration.');
      process.exit(1);
    }
    
    console.log('\n📋 Tables to migrate:', existingTables.join(', '));
    console.log('');
    
    // Create new unified table
    const newsUnifiedExists = await checkTableExists('news_unified');
    
    if (newsUnifiedExists) {
      console.log('⚠️  Table news_unified already exists. Dropping it...');
      await sequelize.query('DROP TABLE news_unified');
    }
    
    await sequelize.query(`
      CREATE TABLE news_unified (
        id INT PRIMARY KEY AUTO_INCREMENT,
        category ENUM('main', 'local', 'society', 'sports', 'more') NOT NULL DEFAULT 'main',
        image VARCHAR(255) NOT NULL,
        title VARCHAR(500) NOT NULL,
        subtitle TEXT,
        paragraph TEXT,
        publishedDate DATETIME NOT NULL,
        journalistName VARCHAR(255) NOT NULL,
        journalistImage VARCHAR(255),
        isFeatured BOOLEAN DEFAULT FALSE,
        views INT DEFAULT 0,
        status ENUM('draft', 'published') DEFAULT 'published',
        createdAt DATETIME NOT NULL,
        updatedAt DATETIME NOT NULL,
        INDEX idx_category (category),
        INDEX idx_publishedDate (publishedDate),
        INDEX idx_featured (isFeatured)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);
    
    console.log('✅ New unified table created\n');
    
    // Migrate data from each existing table
    let totalMigrated = 0;
    
    for (const table of existingTables) {
      try {
        // Determine category based on table name
        let category = 'main';
        if (table === 'local') category = 'local';
        else if (table === 'society') category = 'society';
        else if (table === 'sports') category = 'sports';
        else if (table === 'more') category = 'more';
        else if (table === 'news') category = 'main';
        
        // Check what columns exist in the source table
        const [columns] = await sequelize.query(`SHOW COLUMNS FROM ${table}`);
        const columnNames = columns.map(col => col.Field);
        
        console.log(`📝 Columns in ${table}:`, columnNames.join(', '));
        
        // Get data from old table
        const [rows] = await sequelize.query(`SELECT * FROM ${table}`);
        
        if (rows.length === 0) {
          console.log(`⚠️  No data in ${table} table\n`);
          continue;
        }
        
        // Insert into new table
        for (const row of rows) {
          // Handle missing columns with defaults
          const paragraph = row.paragraph || '';
          const journalistImage = row.journalistImage || row.journalistImageFile || null;
          const createdAt = row.createdAt || new Date();
          const updatedAt = row.updatedAt || new Date();
          
          await sequelize.query(`
            INSERT INTO news_unified 
            (category, image, title, subtitle, paragraph, publishedDate, journalistName, journalistImage, createdAt, updatedAt)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `, {
            replacements: [
              category,
              row.image,
              row.title,
              row.subtitle || null,
              paragraph,
              row.publishedDate,
              row.journalistName,
              journalistImage,
              createdAt,
              updatedAt
            ]
          });
          
          totalMigrated++;
        }
        
        console.log(`✅ Migrated ${rows.length} rows from ${table} (category: ${category})\n`);
        
      } catch (err) {
        console.error(`❌ Error migrating ${table}:`, err.message);
      }
    }
    
    console.log(`\n🎉 Migration complete! Total migrated: ${totalMigrated} articles\n`);
    
    // Show what to do next
    console.log('━'.repeat(60));
    console.log('📋 NEXT STEPS:');
    console.log('━'.repeat(60));
    console.log('\n1. Verify the data in news_unified table:');
    console.log('   SELECT category, COUNT(*) as count FROM news_unified GROUP BY category;\n');
    
    console.log('2. If everything looks good, rename tables:');
    for (const table of existingTables) {
      console.log(`   RENAME TABLE ${table} TO ${table}_backup;`);
    }
    console.log('   RENAME TABLE news_unified TO news;\n');
    
    console.log('3. Update your code:');
    console.log('   - Use the new News model');
    console.log('   - Use the new newsRoutes');
    console.log('   - Update server.js\n');
    
    console.log('4. Test everything thoroughly!\n');
    
    console.log('5. After confirming everything works, you can drop backup tables:');
    for (const table of existingTables) {
      console.log(`   DROP TABLE ${table}_backup;`);
    }
    console.log('\n⚠️  DO NOT drop backup tables until you are 100% sure!\n');
    
    await sequelize.close();
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    await sequelize.close();
    process.exit(1);
  }
}

// Run migration
migrate();