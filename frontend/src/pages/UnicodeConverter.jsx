import React, { useState, useEffect, useRef } from 'react';
import { 
  ArrowRight, ArrowLeft, Copy, Check, RefreshCw, Globe, 
  Volume2, VolumeX, Calendar, Clock, Languages, Sparkles,
  Download, Trash2, History, ChevronDown, ChevronUp,
  ChevronLeft, ChevronRight
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { ad2bs, bs2ad } from 'nepali-dayjs-date-converter';

const API_URL = import.meta.env.VITE_API_URL;

const UnicodeConverter = () => {
  const { isDark } = useTheme();
  
  // State for conversion
  const [inputText, setInputText] = useState('');
  const [outputText, setOutputText] = useState('');
  const [conversionType, setConversionType] = useState('preeti-to-unicode');
  const [copied, setCopied] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [savedTexts, setSavedTexts] = useState([]);
  const [showHistory, setShowHistory] = useState(false);
  const [historyPage, setHistoryPage] = useState(1);
  const ITEMS_PER_PAGE = 10;
  
  // State for Date Converter
  const [dateInput, setDateInput] = useState('');
  const [convertedDate, setConvertedDate] = useState('');
  const [dateConversionType, setDateConversionType] = useState('bs-to-ad');
  const [showCalendar, setShowCalendar] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [selectedDay, setSelectedDay] = useState(new Date().getDate());
  const [bannerError, setBannerError] = useState(false);

  // State for Language
  const [language, setLanguage] = useState('english');
  const [translations, setTranslations] = useState({
    title: 'Unicode Converter',
    subtitle: 'Convert between Preeti, Unicode, Romanised Nepali, and English to Nepali',
    input: 'Input',
    output: 'Output',
    copy: 'Copy',
    copied: 'Copied!',
    clear: 'Clear',
    speak: 'Speak',
    stop: 'Stop',
    swap: 'Swap',
    history: 'History',
    clearAll: 'Clear All',
    reuse: 'Reuse',
    seeMore: 'See More',
    seeLess: 'See Less',
    dateConverter: 'Date Converter',
    today: 'Today',
    tomorrow: 'Tomorrow',
    yesterday: 'Yesterday',
    validYears: 'Valid BS years: 2000-2100',
    tips: '💡 Tips:',
    tip1: 'Text converts automatically as you type',
    tip2: 'Use the Speak button to listen to the converted text',
    tip3: 'Copy any text with the Copy button',
    tip4: 'Your conversion history is saved for 30 days',
    tip5: 'Use the calendar to pick dates easily',
    tip6: 'Saturday (शनि) is highlighted in red as a holiday with a pulsing dot',
    tip7: 'BS ↔ AD conversion uses the nepali-dayjs-date-converter package (2000-2100)',
    placeholder: 'Enter text to convert...',
    convertedText: 'Converted text will appear here...',
    converting: 'Converting...',
    invalidFormat: 'Invalid Date Format (YYYY-MM-DD)',
    invalidBS: 'Invalid BS Date',
    invalidAD: 'Invalid AD Date',
    bsToAd: 'BS → AD',
    adToBs: 'AD → BS',
    bsDate: 'BS Date:',
    adDate: 'AD Date:',
    remaining: 'remaining',
    preetiToUnicode: 'Preeti to Unicode',
    romanisedNepali: 'Romanised Nepali',
    unicodeToPreeti: 'Unicode to Preeti',
    englishToNepali: 'English to Nepali',
    bannerAlt: 'Converter Banner',
    bannerPlaceholder: 'Banner Ad Placeholder'
  });

  // Language translations
  const languageTranslations = {
    english: {
      title: 'Unicode Converter',
      subtitle: 'Convert between Preeti, Unicode, Romanised Nepali, and English to Nepali',
      input: 'Input',
      output: 'Output',
      copy: 'Copy',
      copied: 'Copied!',
      clear: 'Clear',
      speak: 'Speak',
      stop: 'Stop',
      swap: 'Swap',
      history: 'History',
      clearAll: 'Clear All',
      reuse: 'Reuse',
      seeMore: 'See More',
      seeLess: 'See Less',
      dateConverter: 'Date Converter',
      today: 'Today',
      tomorrow: 'Tomorrow',
      yesterday: 'Yesterday',
      validYears: 'Valid BS years: 2000-2100',
      tips: '💡 Tips:',
      tip1: 'Text converts automatically as you type',
      tip2: 'Use the Speak button to listen to the converted text',
      tip3: 'Copy any text with the Copy button',
      tip4: 'Your conversion history is saved for 30 days',
      tip5: 'Use the calendar to pick dates easily',
      tip6: 'Saturday (शनि) is highlighted in red as a holiday with a pulsing dot',
      tip7: 'BS ↔ AD conversion uses the nepali-dayjs-date-converter package (2000-2100)',
      placeholder: 'Enter text to convert...',
      convertedText: 'Converted text will appear here...',
      converting: 'Converting...',
      invalidFormat: 'Invalid Date Format (YYYY-MM-DD)',
      invalidBS: 'Invalid BS Date',
      invalidAD: 'Invalid AD Date',
      bsToAd: 'BS → AD',
      adToBs: 'AD → BS',
      bsDate: 'BS Date:',
      adDate: 'AD Date:',
      remaining: 'remaining',
      preetiToUnicode: 'Preeti to Unicode',
      romanisedNepali: 'Romanised Nepali',
      unicodeToPreeti: 'Unicode to Preeti',
      englishToNepali: 'English to Nepali',
      bannerAlt: 'Converter Banner',
      bannerPlaceholder: 'Banner Ad Placeholder'
    },
    nepali: {
      title: 'युनिकोड रूपान्तरक',
      subtitle: 'प्रीति, युनिकोड, रोमनाइज्ड नेपाली, र अंग्रेजीबाट नेपालीमा रूपान्तरण गर्नुहोस्',
      input: 'इनपुट',
      output: 'आउटपुट',
      copy: 'प्रतिलिपि',
      copied: 'प्रतिलिपि गरियो!',
      clear: 'खाली गर्नुहोस्',
      speak: 'पढ्नुहोस्',
      stop: 'रोक्नुहोस्',
      swap: 'स्वैप',
      history: 'इतिहास',
      clearAll: 'सबै खाली गर्नुहोस्',
      reuse: 'पुन: प्रयोग',
      seeMore: 'थप हेर्नुहोस्',
      seeLess: 'कम हेर्नुहोस्',
      dateConverter: 'मिति रूपान्तरक',
      today: 'आज',
      tomorrow: 'भोलि',
      yesterday: 'हिजो',
      validYears: 'मान्य BS वर्ष: २०००-२१००',
      tips: '💡 सुझावहरू:',
      tip1: 'टाइप गर्दा पाठ स्वचालित रूपमा रूपान्तरण हुन्छ',
      tip2: 'रूपान्तरित पाठ सुन्न स्पीक बटन प्रयोग गर्नुहोस्',
      tip3: 'कपि बटन प्रयोग गरेर कुनै पनि पाठ प्रतिलिपि गर्नुहोस्',
      tip4: 'तपाईंको रूपान्तरण इतिहास ३० दिनको लागि सुरक्षित गरिन्छ',
      tip5: 'सजिलै मिति छान्न क्यालेन्डर प्रयोग गर्नुहोस्',
      tip6: 'शनिबार रातो रंगमा हाइलाइट गरिएको छ र पल्सिङ डटको साथ बिदाको रूपमा देखाइएको छ',
      tip7: 'BS ↔ AD रूपान्तरणले nepali-dayjs-date-converter प्याकेज प्रयोग गर्दछ (२०००-२१००)',
      placeholder: 'रूपान्तरण गर्न पाठ प्रविष्ट गर्नुहोस्...',
      convertedText: 'रूपान्तरित पाठ यहाँ देखिनेछ...',
      converting: 'रूपान्तरण हुँदै...',
      invalidFormat: 'अमान्य मिति ढाँचा (YYYY-MM-DD)',
      invalidBS: 'अमान्य BS मिति',
      invalidAD: 'अमान्य AD मिति',
      bsToAd: 'BS → AD',
      adToBs: 'AD → BS',
      bsDate: 'BS मिति:',
      adDate: 'AD मिति:',
      remaining: 'बाँकी',
      preetiToUnicode: 'प्रीति देखि युनिकोड',
      romanisedNepali: 'रोमनाइज्ड नेपाली',
      unicodeToPreeti: 'युनिकोड देखि प्रीति',
      englishToNepali: 'अंग्रेजी देखि नेपाली',
      bannerAlt: 'रूपान्तरक ब्यानर',
      bannerPlaceholder: 'ब्यानर विज्ञापन स्थान'
    }
  };

  const inputRef = useRef(null);

  // ============================================
  // BS ↔ AD DATE CONVERTER USING PACKAGE
  // ============================================

  const bsDays = [
    'आइतबार', 'सोमबार', 'मंगलबार', 'बुधबार', 'बिहिबार', 'शुक्रबार', 'शनिबार'
  ];

  const adDays = [
    'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'
  ];

  /**
   * Check whether a date string is valid.
   * Format: YYYY-MM-DD
   */
  const isValidDateFormat = (dateString) => {
    if (typeof dateString !== 'string') return false;
    return /^\d{4}-\d{2}-\d{2}$/.test(dateString.trim());
  };

  /**
   * Validate Gregorian AD date.
   */
  const isValidADDate = (dateString) => {
    if (!isValidDateFormat(dateString)) return false;

    const [year, month, day] = dateString.split('-').map(Number);
    const date = new Date(year, month - 1, day);

    return (
      date.getFullYear() === year &&
      date.getMonth() === month - 1 &&
      date.getDate() === day
    );
  };

  /**
   * Validate BS date.
   * The actual month/day validation is handled by bs2ad()
   * because BS month lengths are different from year to year.
   */
  const isValidBSDate = (dateString) => {
    if (!isValidDateFormat(dateString)) return false;

    try {
      const converted = bs2ad(dateString);
      return (
        typeof converted === 'string' &&
        /^\d{4}-\d{2}-\d{2}$/.test(converted)
      );
    } catch (error) {
      console.error('Invalid BS date:', error);
      return false;
    }
  };

  /**
   * Get weekday from an AD date.
   */
  const getADWeekday = (adDateString) => {
    const [year, month, day] = adDateString.split('-').map(Number);
    const date = new Date(year, month - 1, day);
    return adDays[date.getDay()];
  };

  /**
   * Get Nepali weekday from an AD date.
   */
  const getBSWeekday = (adDateString) => {
    const [year, month, day] = adDateString.split('-').map(Number);
    const date = new Date(year, month - 1, day);
    return bsDays[date.getDay()];
  };

  /**
   * Convert BS → AD
   * Example: 2082-03-15 → 2025-06-30
   */
  const convertBSToAD = (bsDateString) => {
    try {
      if (!isValidBSDate(bsDateString)) return null;

      const normalizedDate = bsDateString.trim();
      const adDate = bs2ad(normalizedDate);

      if (!adDate || typeof adDate !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(adDate)) {
        return null;
      }

      return adDate;
    } catch (error) {
      console.error('BS → AD conversion error:', error);
      return null;
    }
  };

  /**
   * Convert AD → BS
   * Example: 2025-06-30 → 2082-03-15
   */
  const convertADToBS = (adDateString) => {
    try {
      if (!isValidADDate(adDateString)) return null;

      const normalizedDate = adDateString.trim();
      const bsDate = ad2bs(normalizedDate);

      if (!bsDate || typeof bsDate !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(bsDate)) {
        return null;
      }

      return bsDate;
    } catch (error) {
      console.error('AD → BS conversion error:', error);
      return null;
    }
  };

  // ============================================
  // UI HANDLERS
  // ============================================

  const handleBSToAD = (bsDateStr) => {
    const input = bsDateStr.trim();

    if (!input) return '';

    if (!isValidDateFormat(input)) {
      return translations.invalidFormat;
    }

    const adDate = convertBSToAD(input);

    if (!adDate) {
      return translations.invalidBS;
    }

    const dayOfWeek = getADWeekday(adDate);
    return `${adDate} (${dayOfWeek})`;
  };

  const handleADToBS = (adDateStr) => {
    const input = adDateStr.trim();

    if (!input) return '';

    if (!isValidDateFormat(input)) {
      return translations.invalidFormat;
    }

    if (!isValidADDate(input)) {
      return translations.invalidAD;
    }

    const bsDate = convertADToBS(input);

    if (!bsDate) {
      return translations.invalidAD;
    }

    const dayOfWeek = getBSWeekday(input);
    return `${bsDate} (${dayOfWeek})`;
  };

  // ============================================
  // MAIN DATE CONVERSION HANDLER
  // ============================================

  const handleDateConversion = () => {
    if (!dateInput || !dateInput.trim()) {
      setConvertedDate('');
      return;
    }

    let result = '';

    if (dateConversionType === 'bs-to-ad') {
      result = handleBSToAD(dateInput);
    } else {
      result = handleADToBS(dateInput);
    }

    setConvertedDate(result);
  };

  // ============================================
  // AUTO CONVERT WHEN INPUT CHANGES
  // ============================================

  useEffect(() => {
    if (dateInput && dateInput.trim()) {
      handleDateConversion();
    } else {
      setConvertedDate('');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dateInput, dateConversionType]);

  // Nepali months and days for calendar display
  const nepaliMonths = ['बैशाख', 'जेठ', 'असार', 'साउन', 'भदौ', 'असोज', 'कार्तिक', 'मंसिर', 'पुष', 'माघ', 'फागुन', 'चैत'];
  const nepaliDays = ['आइत', 'सोम', 'मंगल', 'बुध', 'बिहि', 'शुक्र', 'शनि'];
  
  // Load saved texts from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('unicode_converter_history');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        const oneMonthAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);
        const filtered = parsed.filter(item => item.timestamp > oneMonthAgo);
        setSavedTexts(filtered);
        localStorage.setItem('unicode_converter_history', JSON.stringify(filtered));
      } catch (e) {
        console.error('Error loading history:', e);
      }
    }
  }, []);

  // Auto-convert on input change
  useEffect(() => {
    if (inputText.trim()) {
      handleConvert();
    } else {
      setOutputText('');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inputText, conversionType]);

  // Preeti to Unicode mapping
  const preetiToUnicodeMap = {
    'k': 'क', 'K': 'ख', 'g': 'ग', 'G': 'घ',
    'c': 'च', 'C': 'छ', 'j': 'ज', 'J': 'झ', 'Y': 'ञ',
    'T': 'ट', 'Th': 'ठ', 'D': 'ड', 'Dh': 'ढ', 'N': 'ण',
    't': 'त', 'th': 'थ', 'd': 'द', 'dh': 'ध', 'n': 'न',
    'p': 'प', 'P': 'फ', 'b': 'ब', 'B': 'भ', 'm': 'म',
    'y': 'य', 'r': 'र', 'l': 'ल', 'v': 'व', 'S': 'श',
    'Sh': 'ष', 's': 'स', 'h': 'ह', 'x': 'क्ष', 'tr': 'त्र',
    'gy': 'ज्ञ', 'a': 'अ', 'A': 'आ', 'i': 'इ', 'I': 'ई',
    'u': 'उ', 'U': 'ऊ', 'e': 'ए', 'E': 'ऐ', 'o': 'ओ', 'O': 'औ',
    'M': 'अं', 'H': 'अः', "'": '्', '।': '।', '॥': '॥',
    '0': '०', '1': '१', '2': '२', '3': '३', '4': '४',
    '5': '५', '6': '६', '7': '७', '8': '८', '9': '९'
  };

  // Unicode to Preeti mapping
  const unicodeToPreetiMap = {
    'क': 'k', 'ख': 'K', 'ग': 'g', 'घ': 'G', 'ङ': 'N',
    'च': 'c', 'छ': 'C', 'ज': 'j', 'झ': 'J', 'ञ': 'Y',
    'ट': 'T', 'ठ': 'Th', 'ड': 'D', 'ढ': 'Dh', 'ण': 'N',
    'त': 't', 'थ': 'th', 'द': 'd', 'ध': 'dh', 'न': 'n',
    'प': 'p', 'फ': 'P', 'ब': 'b', 'भ': 'B', 'म': 'm',
    'य': 'y', 'र': 'r', 'ल': 'l', 'व': 'v', 'श': 'S',
    'ष': 'Sh', 'स': 's', 'ह': 'h', 'क्ष': 'x', 'त्र': 'tr',
    'ज्ञ': 'gy', 'अ': 'a', 'आ': 'A', 'इ': 'i', 'ई': 'I',
    'उ': 'u', 'ऊ': 'U', 'ए': 'e', 'ऐ': 'E', 'ओ': 'o', 'औ': 'O',
    'अं': 'M', 'अः': 'H', '्': "'", '।': '।', '॥': '॥',
    '०': '0', '१': '1', '२': '2', '३': '3', '४': '4',
    '५': '5', '६': '6', '७': '7', '८': '8', '९': '9'
  };

  // Romanised Nepali to Unicode mapping
  const romanToUnicodeMap = {
    'ka': 'क', 'kha': 'ख', 'ga': 'ग', 'gha': 'घ', 'nga': 'ङ',
    'cha': 'च', 'chha': 'छ', 'ja': 'ज', 'jha': 'झ', 'nya': 'ञ',
    'ta': 'त', 'tha': 'थ', 'da': 'द', 'dha': 'ध', 'na': 'न',
    'pa': 'प', 'pha': 'फ', 'ba': 'ब', 'bha': 'भ', 'ma': 'म',
    'ya': 'य', 'ra': 'र', 'la': 'ल', 'va': 'व',
    'sha': 'ष', 'sa': 'स', 'ha': 'ह', 'ksha': 'क्ष', 'tra': 'त्र',
    'gya': 'ज्ञ', 'a': 'अ', 'aa': 'आ', 'i': 'इ', 'ee': 'ई',
    'u': 'उ', 'oo': 'ऊ', 'e': 'ए', 'ai': 'ऐ', 'o': 'ओ', 'au': 'औ',
    'am': 'अं', 'ah': 'अः', 'ch': 'च', 'chh': 'छ',
    'kt': 'क्त', 'ng': 'ङ', 'nj': 'ञ', 'sh': 'श', 'ss': 'ष'
  };

  // English to Nepali translation (basic)
  const englishToNepaliMap = {
    'hello': 'नमस्ते', 'hi': 'नमस्ते', 'how': 'कसरी',
    'you': 'तपाईं', 'i': 'म', 'am': 'हुँ', 'is': 'हो', 'are': 'हुन्',
    'we': 'हामी', 'they': 'उनीहरू', 'he': 'उनी', 'she': 'उनी',
    'it': 'यो', 'this': 'यो', 'that': 'त्यो', 'yes': 'हो', 'no': 'होइन',
    'thank': 'धन्यवाद', 'thanks': 'धन्यवाद', 'please': 'कृपया',
    'sorry': 'माफ गर्नुहोस्', 'good': 'राम्रो', 'bad': 'नराम्रो',
    'great': 'उत्कृष्ट', 'beautiful': 'सुन्दर', 'love': 'माया',
    'friend': 'साथी', 'family': 'परिवार', 'home': 'घर',
    'school': 'विद्यालय', 'college': 'कलेज', 'university': 'विश्वविद्यालय',
    'work': 'काम', 'job': 'जागिर', 'business': 'व्यापार',
    'money': 'पैसा', 'time': 'समय', 'day': 'दिन', 'night': 'राति',
    'today': 'आज', 'tomorrow': 'भोलि', 'yesterday': 'हिजो',
    'week': 'हप्ता', 'month': 'महिना', 'year': 'वर्ष',
    'happy': 'खुसी', 'sad': 'दुखी', 'angry': 'रिसाएको',
    'hungry': 'भोको', 'thirsty': 'तिर्खाएको', 'tired': 'थकित'
  };

  const convertPreetiToUnicode = (text) => {
    let result = text;
    const sortedKeys = Object.keys(preetiToUnicodeMap).sort((a, b) => b.length - a.length);
    for (const key of sortedKeys) {
      const regex = new RegExp(key, 'g');
      result = result.replace(regex, preetiToUnicodeMap[key]);
    }
    return result;
  };

  const convertUnicodeToPreeti = (text) => {
    let result = text;
    const sortedKeys = Object.keys(unicodeToPreetiMap).sort((a, b) => b.length - a.length);
    for (const key of sortedKeys) {
      const regex = new RegExp(key, 'g');
      result = result.replace(regex, unicodeToPreetiMap[key]);
    }
    return result;
  };

  const convertRomanToUnicode = (text) => {
    let result = text;
    const sortedKeys = Object.keys(romanToUnicodeMap).sort((a, b) => b.length - a.length);
    for (const key of sortedKeys) {
      const regex = new RegExp(key, 'g');
      result = result.replace(regex, romanToUnicodeMap[key]);
    }
    return result;
  };

  const convertEnglishToNepali = (text) => {
    let result = text.toLowerCase();
    const sortedKeys = Object.keys(englishToNepaliMap).sort((a, b) => b.length - a.length);
    for (const key of sortedKeys) {
      const regex = new RegExp(`\\b${key}\\b`, 'gi');
      result = result.replace(regex, englishToNepaliMap[key]);
    }
    return result;
  };

  const handleConvert = () => {
    if (!inputText.trim()) {
      setOutputText('');
      return;
    }

    let converted = '';
    switch (conversionType) {
      case 'preeti-to-unicode':
        converted = convertPreetiToUnicode(inputText);
        break;
      case 'unicode-to-preeti':
        converted = convertUnicodeToPreeti(inputText);
        break;
      case 'romanised-nepali':
        converted = convertRomanToUnicode(inputText);
        break;
      case 'english-to-nepali':
        converted = convertEnglishToNepali(inputText);
        break;
      default:
        converted = inputText;
    }
    setOutputText(converted);

    if (converted && converted !== inputText) {
      const newEntry = {
        input: inputText.slice(0, 50) + (inputText.length > 50 ? '...' : ''),
        output: converted.slice(0, 50) + (converted.length > 50 ? '...' : ''),
        type: conversionType,
        timestamp: Date.now()
      };
      const updated = [newEntry, ...savedTexts].slice(0, 50);
      setSavedTexts(updated);
      localStorage.setItem('unicode_converter_history', JSON.stringify(updated));
    }
  };

  // Text-to-Speech
  const handleSpeak = () => {
    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }

    const textToSpeak = outputText || inputText;
    if (!textToSpeak.trim()) return;

    const utterance = new SpeechSynthesisUtterance(textToSpeak);
    utterance.lang = 'ne-NP';
    utterance.rate = 0.9;
    utterance.pitch = 1;

    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    window.speechSynthesis.speak(utterance);
    setIsSpeaking(true);
  };

  const handleCopy = async (text) => {
    const textToCopy = text || outputText;
    if (!textToCopy) return;
    try {
      await navigator.clipboard.writeText(textToCopy);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const handleClear = () => {
    setInputText('');
    setOutputText('');
    setCopied(false);
    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }
  };

  const handleSwap = () => {
    if (inputText || outputText) {
      setInputText(outputText);
      setOutputText('');
    }
  };

  const handleClearHistory = () => {
    setSavedTexts([]);
    localStorage.removeItem('unicode_converter_history');
  };

  const handleLoadMoreHistory = () => {
    setHistoryPage(prev => prev + 1);
  };

  const handleLoadLessHistory = () => {
    setHistoryPage(1);
  };

  const getPaginatedHistory = () => {
    const start = 0;
    const end = historyPage * ITEMS_PER_PAGE;
    return savedTexts.slice(start, end);
  };

  const displayedHistory = getPaginatedHistory();
  const hasMoreHistory = savedTexts.length > displayedHistory.length;

  // Calendar functions
  const getDaysInMonth = (month, year) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (month, year) => {
    return new Date(year, month, 1).getDay();
  };

  const isSaturday = (day, month, year) => {
    const date = new Date(year, month, day);
    return date.getDay() === 6;
  };

  const isToday = (day, month, year) => {
    const today = new Date();
    return day === today.getDate() && month === today.getMonth() && year === today.getFullYear();
  };

  const handleDateSelect = (day, month, year) => {
    const date = new Date(year, month, day);
    setSelectedDate(date);
    setSelectedDay(day);
    const formatted = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    setDateInput(formatted);
    setShowCalendar(false);
  };

  const renderNepaliCalendarDays = () => {
    const daysInMonth = getDaysInMonth(currentMonth, currentYear);
    const firstDay = getFirstDayOfMonth(currentMonth, currentYear);
    const days = [];

    // Empty cells before first day
    for (let i = 0; i < firstDay; i++) {
      days.push(
        <div key={`empty-${i}`} className="h-10 w-10"></div>
      );
    }

    // Days
    for (let i = 1; i <= daysInMonth; i++) {
      const isSat = isSaturday(i, currentMonth, currentYear);
      const isTodayDate = isToday(i, currentMonth, currentYear);
      const isSelected = i === selectedDay && currentMonth === selectedDate.getMonth() && currentYear === selectedDate.getFullYear();
      
      days.push(
        <button
          key={i}
          onClick={() => handleDateSelect(i, currentMonth, currentYear)}
          className={`
            h-10 w-10 rounded-full transition-all duration-200 font-medium text-sm
            flex items-center justify-center relative
            ${isSat ? 'text-red-500 font-bold' : isDark ? 'text-gray-300' : 'text-gray-700'}
            ${isTodayDate ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/50 scale-110' : ''}
            ${isSelected && !isTodayDate ? 'ring-2 ring-blue-500 bg-blue-50' : ''}
            ${!isSat && !isTodayDate && !isSelected ? (isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-100') : ''}
            ${!isSat && !isTodayDate ? 'hover:scale-105' : ''}
          `}
        >
          {i}
          {isSat && (
            <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
          )}
        </button>
      );
    }
    return days;
  };

  const conversionOptions = [
    { id: 'preeti-to-unicode', label: translations.preetiToUnicode, icon: '🔄' },
    { id: 'romanised-nepali', label: translations.romanisedNepali, icon: '🔤' },
    { id: 'unicode-to-preeti', label: translations.unicodeToPreeti, icon: '🔄' },
    { id: 'english-to-nepali', label: translations.englishToNepali, icon: '🇬🇧→🇳🇵' },
  ];

  // Change month
  const changeMonth = (delta) => {
    let newMonth = currentMonth + delta;
    let newYear = currentYear;
    if (newMonth < 0) {
      newMonth = 11;
      newYear--;
    } else if (newMonth > 11) {
      newMonth = 0;
      newYear++;
    }
    setCurrentMonth(newMonth);
    setCurrentYear(newYear);
  };

  // Handle language change
  const handleLanguageChange = (lang) => {
    setLanguage(lang);
    setTranslations(languageTranslations[lang]);
  };

  return (
    <div className={`min-h-screen ${isDark ? 'bg-gray-900' : 'bg-gray-50'} py-8`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header with Language Dropdown */}
        <div className="text-center mb-8 relative">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Globe size={32} className="text-blue-600" />
            <h1 className={`text-3xl font-bold ${isDark ? 'text-gray-200' : 'text-gray-900'}`}>
              {translations.title}
            </h1>
          </div>
          <p className={`${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            {translations.subtitle}
          </p>
          
          {/* Language Dropdown - Top Right Corner */}
          <div className="absolute top-0 right-0">
            <div className="relative inline-block text-left">
              <div className="flex items-center gap-2">
                <Languages size={20} className={isDark ? 'text-gray-400' : 'text-gray-600'} />
                <select
                  value={language}
                  onChange={(e) => handleLanguageChange(e.target.value)}
                  className={`
                    px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200
                    appearance-none cursor-pointer
                    ${isDark 
                      ? 'bg-gray-700 text-gray-300 border-gray-600 hover:bg-gray-600' 
                      : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
                    }
                    border focus:outline-none focus:ring-2 focus:ring-blue-500
                    pr-8
                  `}
                >
                  <option value="english">🇬🇧 English</option>
                  <option value="nepali">🇳🇵 नेपाली</option>
                </select>
                <ChevronDown 
                  size={16} 
                  className={`absolute right-2 pointer-events-none ${isDark ? 'text-gray-400' : 'text-gray-500'}`}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Main Grid - 70% Translation, 30% Date Converter */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column - Translation (70%) */}
          <div className="lg:col-span-8">
            <div className={`${isDark ? 'bg-gray-800' : 'bg-white'} rounded-xl shadow-lg p-6`}>
              {/* Conversion Type Selector */}
              <div className="flex flex-wrap gap-3 mb-6">
                {conversionOptions.map((option) => (
                  <button
                    key={option.id}
                    onClick={() => {
                      setConversionType(option.id);
                      setInputText('');
                      setOutputText('');
                    }}
                    className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 flex items-center gap-2 ${
                      conversionType === option.id
                        ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30'
                        : isDark
                          ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    <span>{option.icon}</span>
                    {option.label}
                  </button>
                ))}
              </div>

              {/* Input & Output */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Input Section */}
                <div>
                  <label className={`block text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'} mb-2`}>
                    {translations.input}
                  </label>
                  <textarea
                    ref={inputRef}
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    placeholder={translations.placeholder}
                    className={`w-full h-48 p-3 rounded-lg border focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none transition-all duration-300 ${
                      isDark
                        ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400'
                        : 'bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-500'
                    }`}
                  />
                  <div className="flex items-center gap-2 mt-3 flex-wrap">
                    <button
                      onClick={handleSpeak}
                      className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 flex items-center gap-2 ${
                        isSpeaking
                          ? 'bg-red-600 text-white hover:bg-red-700'
                          : 'bg-blue-600 text-white hover:bg-blue-700'
                      }`}
                    >
                      {isSpeaking ? <VolumeX size={18} /> : <Volume2 size={18} />}
                      {isSpeaking ? translations.stop : translations.speak}
                    </button>
                    <button
                      onClick={() => handleCopy(inputText)}
                      className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 flex items-center gap-2 ${
                        isDark
                          ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      <Copy size={18} />
                      {translations.copy}
                    </button>
                    <button
                      onClick={handleClear}
                      className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 flex items-center gap-2 ${
                        isDark
                          ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      <RefreshCw size={18} />
                      {translations.clear}
                    </button>
                  </div>
                </div>

                {/* Output Section */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className={`block text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                      {translations.output}
                    </label>
                    <div className="flex items-center gap-2">
                      {outputText && (
                        <button
                          onClick={() => handleCopy(outputText)}
                          className={`text-sm font-medium transition-all duration-200 flex items-center gap-1 ${
                            copied
                              ? 'text-green-500'
                              : isDark
                                ? 'text-blue-400 hover:text-blue-300'
                                : 'text-blue-600 hover:text-blue-700'
                          }`}
                        >
                          {copied ? <Check size={16} /> : <Copy size={16} />}
                          {copied ? translations.copied : translations.copy}
                        </button>
                      )}
                      {inputText && outputText && (
                        <button
                          onClick={handleSwap}
                          className={`text-sm font-medium transition-all duration-200 flex items-center gap-1 ${
                            isDark
                              ? 'text-gray-400 hover:text-gray-300'
                              : 'text-gray-600 hover:text-gray-800'
                          }`}
                        >
                          <ArrowLeft size={16} />
                          {translations.swap}
                        </button>
                      )}
                    </div>
                  </div>
                  <div
                    className={`w-full h-48 p-3 rounded-lg border overflow-y-auto whitespace-pre-wrap transition-all duration-500 ${
                      isDark
                        ? 'bg-gray-700 border-gray-600 text-white'
                        : 'bg-gray-50 border-gray-200 text-gray-900'
                    }`}
                  >
                    {outputText || (
                      <span className={isDark ? 'text-gray-500' : 'text-gray-400'}>
                        {inputText ? translations.converting : translations.convertedText}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* History */}
              {savedTexts.length > 0 && (
                <div className="mt-6">
                  <div className="flex items-center justify-between mb-2">
                    <button
                      onClick={() => setShowHistory(!showHistory)}
                      className={`flex items-center gap-2 text-sm font-medium ${
                        isDark ? 'text-gray-400 hover:text-gray-300' : 'text-gray-600 hover:text-gray-800'
                      }`}
                    >
                      <History size={16} />
                      {translations.history} ({savedTexts.length})
                      {showHistory ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    </button>
                    <button
                      onClick={handleClearHistory}
                      className={`text-sm ${
                        isDark ? 'text-red-400 hover:text-red-300' : 'text-red-600 hover:text-red-700'
                      }`}
                    >
                      {translations.clearAll}
                    </button>
                  </div>
                  {showHistory && (
                    <div className={`max-h-60 overflow-y-auto space-y-2 ${isDark ? 'bg-gray-700' : 'bg-gray-50'} rounded-lg p-3 transition-all duration-300`}>
                      {displayedHistory.map((item, index) => (
                        <div
                          key={index}
                          className={`p-2 rounded-lg flex justify-between items-center ${
                            isDark ? 'bg-gray-600' : 'bg-white'
                          } shadow-sm`}
                        >
                          <div className="flex-1 min-w-0">
                            <p className={`text-sm truncate ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                              <span className="font-medium">→</span> {item.input} 
                              <span className="mx-1 text-blue-500">→</span> 
                              <span className="font-medium">{item.output}</span>
                            </p>
                            <p className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                              {new Date(item.timestamp).toLocaleString()}
                            </p>
                          </div>
                          <button
                            onClick={() => {
                              setInputText(item.input);
                              setConversionType(item.type);
                            }}
                            className={`ml-2 text-sm px-2 py-1 rounded ${
                              isDark 
                                ? 'text-blue-400 hover:text-blue-300 hover:bg-gray-700' 
                                : 'text-blue-600 hover:text-blue-700 hover:bg-gray-100'
                            }`}
                          >
                            {translations.reuse}
                          </button>
                        </div>
                      ))}
                      
                      {savedTexts.length > ITEMS_PER_PAGE && (
                        <div className="text-center pt-2">
                          {hasMoreHistory ? (
                            <button
                              onClick={handleLoadMoreHistory}
                              className={`text-sm font-medium transition-all ${
                                isDark 
                                  ? 'text-blue-400 hover:text-blue-300' 
                                  : 'text-blue-600 hover:text-blue-700'
                              }`}
                            >
                              {translations.seeMore} ({savedTexts.length - displayedHistory.length} {translations.remaining})
                            </button>
                          ) : (
                            <button
                              onClick={handleLoadLessHistory}
                              className={`text-sm font-medium transition-all ${
                                isDark 
                                  ? 'text-blue-400 hover:text-blue-300' 
                                  : 'text-blue-600 hover:text-blue-700'
                              }`}
                            >
                              {translations.seeLess}
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Right Column - Date Converter (30%) */}
          <div className="lg:col-span-4">
            <div className={`${isDark ? 'bg-gray-800' : 'bg-white'} rounded-xl shadow-lg p-6`}>
              <div className="flex items-center gap-2 mb-4">
                <Calendar size={20} className="text-blue-600" />
                <h3 className={`text-lg font-semibold ${isDark ? 'text-gray-200' : 'text-gray-900'}`}>
                  {translations.dateConverter}
                </h3>
                <span className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'} ml-auto`}>
                  BS 2000-2100
                </span>
              </div>

              {/* Date Conversion Type */}
              <div className="flex gap-2 mb-4">
                <button
                  onClick={() => setDateConversionType('bs-to-ad')}
                  className={`flex-1 px-3 py-2 text-sm rounded-lg font-medium transition-all duration-200 ${
                    dateConversionType === 'bs-to-ad'
                      ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30'
                      : isDark
                        ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {translations.bsToAd}
                </button>
                <button
                  onClick={() => setDateConversionType('ad-to-bs')}
                  className={`flex-1 px-3 py-2 text-sm rounded-lg font-medium transition-all duration-200 ${
                    dateConversionType === 'ad-to-bs'
                      ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30'
                      : isDark
                        ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {translations.adToBs}
                </button>
              </div>

              {/* Date Input */}
              <div className="relative">
                <input
                  type="text"
                  value={dateInput}
                  onChange={(e) => setDateInput(e.target.value)}
                  placeholder={dateConversionType === 'bs-to-ad' ? 'YYYY-MM-DD (BS)' : 'YYYY-MM-DD (AD)'}
                  className={`w-full p-3 rounded-lg border focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    isDark
                      ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400'
                      : 'bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-500'
                  }`}
                />
                <button
                  onClick={() => setShowCalendar(!showCalendar)}
                  className={`absolute right-3 top-1/2 transform -translate-y-1/2 ${
                    isDark ? 'text-gray-400 hover:text-gray-300' : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <Calendar size={18} />
                </button>
              </div>

              {/* Calendar Dropdown */}
              {showCalendar && (
                <div className={`mt-2 p-4 rounded-lg shadow-xl border ${isDark ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-200'}`}>
                  <div className="flex items-center justify-between mb-4">
                    <button
                      onClick={() => changeMonth(-1)}
                      className={`p-1 rounded hover:bg-gray-200 ${isDark ? 'hover:bg-gray-600' : ''}`}
                    >
                      <ChevronLeft size={20} />
                    </button>
                    <span className={`font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                      {nepaliMonths[currentMonth]} {currentYear}
                    </span>
                    <button
                      onClick={() => changeMonth(1)}
                      className={`p-1 rounded hover:bg-gray-200 ${isDark ? 'hover:bg-gray-600' : ''}`}
                    >
                      <ChevronRight size={20} />
                    </button>
                  </div>
                  <div className="grid grid-cols-7 gap-1 text-center">
                    {nepaliDays.map(day => (
                      <div key={day} className={`text-xs font-medium ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                        {day}
                      </div>
                    ))}
                    <div className="col-span-7 grid grid-cols-7 gap-1 mt-1">
                      {renderNepaliCalendarDays()}
                    </div>
                  </div>
                </div>
              )}

              {/* Converted Date Output */}
              {convertedDate && (
                <div className={`mt-4 p-3 rounded-lg ${isDark ? 'bg-gray-700' : 'bg-blue-50'} transition-all duration-300 border ${isDark ? 'border-gray-600' : 'border-blue-200'}`}>
                  <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                    {dateConversionType === 'bs-to-ad' ? translations.adDate : translations.bsDate}
                  </p>
                  <p className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    {convertedDate}
                  </p>
                </div>
              )}

              {/* Quick Date Buttons */}
              <div className="mt-4 flex flex-wrap gap-2">
                <button
                  onClick={() => {
                    const today = new Date();
                    const date = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
                    setDateInput(date);
                    setSelectedDate(today);
                    setSelectedDay(today.getDate());
                  }}
                  className={`px-3 py-1 text-xs rounded-lg ${
                    isDark
                      ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {translations.today}
                </button>
                <button
                  onClick={() => {
                    const tomorrow = new Date();
                    tomorrow.setDate(tomorrow.getDate() + 1);
                    const date = `${tomorrow.getFullYear()}-${String(tomorrow.getMonth() + 1).padStart(2, '0')}-${String(tomorrow.getDate()).padStart(2, '0')}`;
                    setDateInput(date);
                    setSelectedDate(tomorrow);
                    setSelectedDay(tomorrow.getDate());
                  }}
                  className={`px-3 py-1 text-xs rounded-lg ${
                    isDark
                      ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {translations.tomorrow}
                </button>
                <button
                  onClick={() => {
                    const yesterday = new Date();
                    yesterday.setDate(yesterday.getDate() - 1);
                    const date = `${yesterday.getFullYear()}-${String(yesterday.getMonth() + 1).padStart(2, '0')}-${String(yesterday.getDate()).padStart(2, '0')}`;
                    setDateInput(date);
                    setSelectedDate(yesterday);
                    setSelectedDay(yesterday.getDate());
                  }}
                  className={`px-3 py-1 text-xs rounded-lg ${
                    isDark
                      ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {translations.yesterday}
                </button>
              </div>

              {/* Valid Year Range Info */}
              <div className={`mt-3 text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                <span>{translations.validYears}</span>
              </div>
            </div>
          </div>
        </div>

        {/* ============================================ */}
        {/* FULL BANNER IMAGE AT THE BOTTOM */}
        {/* ============================================ */}
        <div className="mt-8 rounded-xl overflow-hidden shadow-lg bg-gray-100 dark:bg-gray-700">
          {!bannerError ? (
            <img
              src={`${API_URL}/uploads/converter/converter.png`}
              alt={translations.bannerAlt}
              className="w-full h-auto object-cover"
              onError={() => setBannerError(true)}
            />
          ) : (
            <div className="w-full h-[200px] flex items-center justify-center text-gray-500 dark:text-gray-400">
              <div className="text-center">
                <Globe size={48} className="mx-auto mb-2 opacity-50" />
                <p className="text-sm">{translations.bannerPlaceholder}</p>
                <p className="text-xs opacity-50 mt-1">converter.png</p>
              </div>
            </div>
          )}
        </div>

        {/* Information Box */}
        <div className={`mt-6 ${isDark ? 'bg-gray-800' : 'bg-white'} rounded-xl shadow-lg p-6`}>
          <h3 className={`text-sm font-semibold ${isDark ? 'text-gray-300' : 'text-gray-700'} mb-2`}>
            {translations.tips}
          </h3>
          <ul className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'} space-y-1 list-disc list-inside`}>
            <li>{translations.tip1}</li>
            <li>{translations.tip2}</li>
            <li>{translations.tip3}</li>
            <li>{translations.tip4}</li>
            <li>{translations.tip5}</li>
            <li>{translations.tip6}</li>
            <li>{translations.tip7}</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default UnicodeConverter;