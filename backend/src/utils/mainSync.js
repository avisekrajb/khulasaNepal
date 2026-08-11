// // utils/mainSync.js
// const Main = require('../models/Main');
// const path = require('path');
// const fs = require('fs');

// /**
//  * Syncs a news article to the Main collection
//  * @param {Object} newsData - The news article data with source information
//  */
// const syncToMain = async (newsData) => {
//   try {
//     // Create a copy in Main table with source information
//     await Main.create({
//       image: newsData.image,
//       title: newsData.title,
//       subtitle: newsData.subtitle || null,
//       paragraph: newsData.paragraph || null,
//       publishedDate: newsData.publishedDate,
//       journalistName: newsData.journalistName,
//       journalistImage: newsData.journalistImage || null,
//       source: newsData.source, // Track which model it came from
//       sourceId: newsData.id // Track the original article ID
//     });

//     console.log(`✅ Synced to Main: ${newsData.title} from ${newsData.source}`);

//     // Cleanup old entries in Main
//     await cleanupOldMain();
//   } catch (error) {
//     console.error('❌ Error syncing to Main:', error.message);
//   }
// };

// /**
//  * Keeps only the latest 20 articles in Main table
//  */
// const cleanupOldMain = async () => {
//   try {
//     const totalCount = await Main.count();
    
//     if (totalCount > 20) {
//       const allMain = await Main.findAll({
//         order: [['publishedDate', 'ASC']],
//         limit: totalCount - 20
//       });

//       for (const mainItem of allMain) {
//         // Note: We don't delete images here because they belong to the original source
//         // Only delete the Main record
//         await mainItem.destroy();
//         console.log(`🗑️ Auto-deleted old Main entry: ${mainItem.title}`);
//       }

//       console.log(`🧹 Main cleanup completed: Deleted ${allMain.length} old entries`);
//     }
//   } catch (error) {
//     console.error('❌ Error during Main cleanup:', error.message);
//   }
// };

// /**
//  * Removes an article from Main when deleted from source
//  */
// const removeFromMain = async (source, sourceId) => {
//   try {
//     const mainItem = await Main.findOne({
//       where: { source, sourceId }
//     });

//     if (mainItem) {
//       await mainItem.destroy();
//       console.log(`🗑️ Removed from Main: ${mainItem.title}`);
//     }
//   } catch (error) {
//     console.error('❌ Error removing from Main:', error.message);
//   }
// };

// /**
//  * Updates an article in Main when updated in source
//  */
// const updateInMain = async (newsData) => {
//   try {
//     const mainItem = await Main.findOne({
//       where: { 
//         source: newsData.source,
//         sourceId: newsData.id 
//       }
//     });

//     if (mainItem) {
//       await mainItem.update({
//         image: newsData.image,
//         title: newsData.title,
//         subtitle: newsData.subtitle || null,
//         paragraph: newsData.paragraph || null,
//         publishedDate: newsData.publishedDate,
//         journalistName: newsData.journalistName,
//         journalistImage: newsData.journalistImage || null
//       });
//       console.log(`✏️ Updated in Main: ${newsData.title}`);
//     }
//   } catch (error) {
//     console.error('❌ Error updating Main:', error.message);
//   }
// };

// module.exports = {
//   syncToMain,
//   cleanupOldMain,
//   removeFromMain,
//   updateInMain
// };