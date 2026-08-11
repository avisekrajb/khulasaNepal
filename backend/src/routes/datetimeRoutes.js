// src/routes/datetimeRoutes.js
const express = require('express');
const router = express.Router();
const NepaliDateConverter = require('nepali-date-converter');
const NepaliDate = NepaliDateConverter.default || NepaliDateConverter;

router.get('/', (req, res) => {
  try {
    // Get current UTC time
    const now = new Date();
    
    // Convert to Nepal Time (NPT = UTC+5:45)
    const nptOffset = 5 * 60 + 45; // 5 hours 45 minutes in minutes
    const nptTime = new Date(now.getTime() + (nptOffset * 60 * 1000));
    
    // Helper function to convert to Nepali numerals
    const toNepaliNumerals = (num) => {
      const nepali = ['०', '१', '२', '३', '४', '५', '६', '७', '८', '९'];
      return String(num).split('').map(d => nepali[Number(d)] || d).join('');
    };
    
    // Get Nepali date using the ORIGINAL Date object (not NPT offset)
    // NepaliDate library handles timezone internally
    let nepaliDate;
    try {
      nepaliDate = new NepaliDate(now);
    } catch (err) {
      console.error('NepaliDate conversion error:', err);
      // Fallback: use current date
      nepaliDate = new NepaliDate(new Date());
    }
    
    const nepMonths = ['बैशाख', 'जेठ', 'असार', 'श्रावण', 'भाद्र', 'आश्विन', 'कार्तिक', 'मंसिर', 'पुस', 'माघ', 'फाल्गुन', 'चैत'];
    const nepDays = ['आइतबार', 'सोमबार', 'मंगलबार', 'बुधबार', 'बिहिबार', 'शुक्रबार', 'शनिबार'];
    
    const nepYear = nepaliDate.getYear();
    const nepMonth = nepaliDate.getMonth(); // 0-11
    const nepDay = nepaliDate.getDate();
    const dayOfWeek = nptTime.getDay(); // Use NPT time for day of week
    
    const formattedNepaliDate = `${toNepaliNumerals(nepDay)} ${nepMonths[nepMonth]} ${toNepaliNumerals(nepYear)}, ${nepDays[dayOfWeek]}`;
    
    // Format Nepali time using NPT
    let h = nptTime.getUTCHours();
    const min = nptTime.getUTCMinutes().toString().padStart(2, '0');
    const period = h >= 12 ? 'अपराह्न' : 'पूर्वाह्न';
    h = h % 12 || 12;
    const nepaliTime = `${toNepaliNumerals(h)}:${toNepaliNumerals(min)} ${period}`;
    
    // Format English date time using NPT
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const m = months[nptTime.getUTCMonth()];
    const d = nptTime.getUTCDate();
    const day = days[nptTime.getUTCDay()];
    let eh = nptTime.getUTCHours();
    const emin = nptTime.getUTCMinutes().toString().padStart(2, '0');
    const ePeriod = eh >= 12 ? 'pm' : 'am';
    eh = eh % 12 || 12;
    const englishDateTime = `${m} ${d} ${day}, ${eh}.${emin} ${ePeriod}`;
    
    console.log('✅ DateTime generated successfully:', {
      nepaliDate: formattedNepaliDate,
      nepaliTime: nepaliTime,
      englishDateTime: englishDateTime
    });
    
    res.json({
      success: true,
      serverTimestamp: now.toISOString(),
      nepaliDate: formattedNepaliDate,
      nepaliTime: nepaliTime,
      englishDateTime: englishDateTime
    });
    
  } catch (error) {
    console.error('❌ DateTime API error:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to generate datetime',
      message: error.message 
    });
  }
});


module.exports = router;