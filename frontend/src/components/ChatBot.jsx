import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bot, X, Trash2, Send, SkipForward } from 'lucide-react';
import axiosInstance from '../api/axios';
import { useTheme } from '../context/ThemeContext';
import NepaliDate from 'nepali-date-converter';

const API_URL = import.meta.env.VITE_API_URL;
const ZERO_INFINITY_URL = 'https://zeroinfinitytechnology.com';

const WELCOME_TEXT = 'नमस्ते! म खुलासा नेपालको च्याटबट हुँ। समाचारको शीर्षक वा कीवर्ड लेख्नुहोस्, सम्पूर्ण वेबसाइट (समाचार र फुटर) मा खोजेर फोटोसहित देखाउनेछु।';
const SUGGESTIONS = ['what is your name', 'hello', 'hii', 'आजको समाचार', 'खेलकुद', 'सुशासन'];
const AD_POSITIONS = ['sidebar-top', 'homepage-banner'];
const AD_SLIDE_INTERVAL = 5000;
const MAX_NEWS_MATCHES = 4;
const MAX_FOOTER_MATCHES = 4;

const TypingIndicator = () => (
  <span className="flex items-center gap-1">
    <span className="h-2 w-2 animate-bounce rounded-full bg-current opacity-70" style={{ animationDelay: '0ms' }} />
    <span className="h-2 w-2 animate-bounce rounded-full bg-current opacity-70" style={{ animationDelay: '150ms' }} />
    <span className="h-2 w-2 animate-bounce rounded-full bg-current opacity-70" style={{ animationDelay: '300ms' }} />
  </span>
);

const isMakerCommand = (text) => {
  const lower = text.toLowerCase();
  return (
    /(who\s*made|who\s*created|who\s*build|who\s*develop|made\s*by|created\s*by|developed\s*by|your\s*creator|your\s*maker|your\s*owner|maker|creator)/.test(lower) ||
    /(कसले बनाउनुभयो|कसले बनायो|को बनाउनुभयो|बनाउने को|को बनाएको|को विकास|zero\s*infinity|zeroinfinity)/.test(lower)
  );
};

const isGreeting = (text) => {
  const lower = text.toLowerCase().trim();
  return /^(hi|hii|hiii|hello|hey|namaste|namaskar|namaskaram|good\s*(morning|afternoon|evening))\b/.test(lower) ||
    /^(नमस्ते|नमस्कार|हेलो|हाय|सुप्रभात)\b/.test(lower);
};

const isHelpCommand = (text) => {
  const lower = text.toLowerCase();
  return /\b(help|सहयोग|मद्दत)\b/.test(lower);
};

const isNameCommand = (text) => {
  const lower = text.toLowerCase();
  return (
    /\b(what\s*is\s*your\s*name|your\s*name|name\?|timro\s*naam|tero\s*naam)\b/.test(lower) ||
    /(नाम के हो|के नाम|तिम्रो नाम|तपाईंको नाम|तपाईको नाम|तिम्रो नाउँ)/.test(lower)
  );
};

const isTimeCommand = (text) => {
  const lower = text.toLowerCase();
  return (
    /\b(what\s*time|current\s*time|time\s*now|time\b)\b/.test(lower) ||
    /(कति बज्यो|समय के भयो|अहिलेको समय|समय देखाऊ|समय)/.test(lower)
  );
};

const isDateCommand = (text) => {
  const lower = text.toLowerCase();
  return (
    /\b(what\s*date|today['s]?\s*date|current\s*date|date\b|today)\b/.test(lower) ||
    /(आज कुन मिति|मिति के हो|आजको मिति|आजको तारिख|मिति)/.test(lower)
  );
};

const toNepaliNumber = (num) => {
  const nepaliDigits = ['०', '१', '२', '३', '४', '५', '६', '७', '८', '९'];
  return num.toString().split('').map((digit) => nepaliDigits[digit] || digit).join('');
};

const getNepaliTimeText = () => {
  const now = new Date();
  let hours = now.getHours();
  const mins = now.getMinutes();
  const ampm = hours >= 12 ? 'अपराह्न' : 'पूर्वाह्न';
  hours = hours % 12 || 12;
  return `${toNepaliNumber(hours)}:${toNepaliNumber(mins.toString().padStart(2, '0'))} ${ampm}`;
};

const getNepaliDateText = () => {
  try {
    const now = new Date();
    const nepaliDate = new NepaliDate(now);
    const nepaliMonths = ['बैशाख', 'जेठ', 'असार', 'साउन', 'भदौ', 'असोज', 'कार्तिक', 'मंसिर', 'पुष', 'माघ', 'फागुन', 'चैत'];
    const nepaliDays = ['आइतबार', 'सोमबार', 'मंगलबार', 'बुधबार', 'बिहिबार', 'शुक्रबार', 'शनिबार'];
    const month = nepaliMonths[nepaliDate.getMonth()] || '';
    const day = toNepaliNumber(nepaliDate.getDate());
    const year = toNepaliNumber(nepaliDate.getYear());
    const dayOfWeek = nepaliDays[now.getDay()] || '';
    return `${dayOfWeek}, ${month} ${day}, ${year}`;
  } catch {
    return new Date().toLocaleDateString('ne-NP', { year: 'numeric', month: 'long', day: 'numeric' });
  }
};

const formatDate = (dateStr) => {
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return '';
    const formatted = d.toLocaleDateString('ne-NP', { year: 'numeric', month: 'long', day: 'numeric' });
    if (!formatted || formatted.includes('Invalid')) return d.toLocaleDateString('en-GB', { year: 'numeric', month: 'long', day: 'numeric' });
    return formatted;
  } catch {
    try {
      return new Date(dateStr).toLocaleDateString('en-GB', { year: 'numeric', month: 'long', day: 'numeric' });
    } catch {
      return '';
    }
  }
};

const scoreMatch = (text, query) => {
  if (!text) return 0;
  const lowerText = String(text).toLowerCase();
  const lowerQuery = query.toLowerCase();
  let score = 0;
  if (lowerText === lowerQuery) score += 100;
  if (lowerText.includes(lowerQuery)) score += 50;
  lowerQuery.split(/\s+/).filter(Boolean).forEach((word) => {
    if (lowerText.includes(word)) score += 10;
  });
  return score;
};

const buildFooterEntries = (footer) => {
  if (!footer) return [];
  const entries = [];
  const push = (label, value, url = '') => {
    if (value && typeof value === 'string' && value.trim()) {
      entries.push({ label, value: value.trim(), url });
    }
  };
  push('कम्पनी नाम', footer.companyName);
  push('प्रेस नाम', footer.pressName);
  push('ठेगाना', footer.address);
  push('फोन', footer.phone, footer.phone ? `tel:${footer.phone.replace(/[^0-9+]/g, '')}` : '');
  push('इमेल', footer.email, footer.email ? `mailto:${footer.email}` : '');
  push('अध्यक्ष', footer.chairman);
  push('आईटी सम्पादक', footer.itEditor);
  push('कानूनी सल्लाहकार', footer.legalAdvisor);
  push('सल्लाहकार', footer.advisor);
  push('सह-सम्पादक', footer.coEditor);
  push('विभाग दर्ता नं.', footer.departmentRegNo);
  push('प्रेस काउन्सिल नं.', footer.pressCouncilNo);
  push('हाम्रोबारे', footer.aboutText);
  push('प्रतिलिपि अधिकार', footer.copyrightText);
  if (footer.facebookUrl) entries.push({ label: 'फेसबुक', value: 'Facebook', url: footer.facebookUrl });
  if (footer.twitterUrl) entries.push({ label: 'ट्विटर', value: 'Twitter', url: footer.twitterUrl });
  if (footer.instagramUrl) entries.push({ label: 'इन्स्टाग्राम', value: 'Instagram', url: footer.instagramUrl });
  if (footer.youtubeUrl) entries.push({ label: 'युट्युब', value: 'YouTube', url: footer.youtubeUrl });
  if (footer.whatsappNumber) {
    const wa = footer.whatsappNumber.replace(/[^0-9]/g, '');
    if (wa) entries.push({ label: 'व्हाट्सएप', value: footer.whatsappNumber, url: `https://wa.me/${wa}` });
  }
  if (Array.isArray(footer.usefulLinks)) {
    footer.usefulLinks.forEach((link) => {
      const title = typeof link === 'string' ? link : link?.title;
      const url = typeof link === 'string' ? '' : link?.url || '';
      if (title && typeof title === 'string' && title.trim()) {
        entries.push({ label: 'उपयोगी लिङ्क', value: title.trim(), url });
      }
    });
  }
  return entries;
};

const performFooterSearch = (footer, query) => {
  if (!footer) return [];
  return buildFooterEntries(footer)
    .map((entry) => ({
      label: entry.label,
      value: entry.value,
      url: entry.url,
      score: scoreMatch(`${entry.label} ${entry.value}`, query)
    }))
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, MAX_FOOTER_MATCHES)
    .map((entry) => ({ label: entry.label, value: entry.value, url: entry.url }));
};

const ChatBot = ({ footerInView = false }) => {
  const { isDark } = useTheme();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [chatAds, setChatAds] = useState([]);
  const [navbarAd, setNavbarAd] = useState(null);
  const [footerData, setFooterData] = useState(null);
  const [showAdBar, setShowAdBar] = useState(false);
  const [adIndex, setAdIndex] = useState(0);
  const idRef = useRef(0);
  const messagesRef = useRef(null);

  const nextId = () => {
    idRef.current += 1;
    return idRef.current;
  };

  const botMessage = (text, kind = 'text', results = []) => ({
    id: nextId(),
    sender: 'bot',
    kind,
    text,
    results
  });

  const userMessage = (text) => ({
    id: nextId(),
    sender: 'user',
    kind: 'text',
    text
  });

  const getImageUrl = (image) => {
    if (!image) return '';
    return image.startsWith('http') ? image : `${API_URL}${image}`;
  };

  const recordImpression = (ad) => {
    axiosInstance.post(`/api/ads/${ad.id}/impression`).catch(() => {});
  };

  useEffect(() => {
    if (messagesRef.current) {
      messagesRef.current.scrollTop = messagesRef.current.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;

    const fetchFooter = async () => {
      try {
        const res = await axiosInstance.get('/api/footer/public');
        if (!cancelled && res.data?.success) setFooterData(res.data.footer);
      } catch {
        console.error('Chatbot footer fetch failed');
      }
    };

    const fetchAds = async () => {
      try {
        const [chatResponses, navbarResponse] = await Promise.all([
          Promise.all(AD_POSITIONS.map((position) => axiosInstance.get(`/api/ads/position/${position}`))),
          axiosInstance.get('/api/ads/position/navbar-top')
        ]);
        const seen = new Map();
        chatResponses.forEach((response) => {
          const ads = response.data?.ads || [];
          ads.forEach((ad) => {
            if (!seen.has(ad.id)) seen.set(ad.id, ad);
          });
        });
        const ads = Array.from(seen.values());
        const navbarAds = navbarResponse.data?.ads || [];
        if (cancelled) return;
        setChatAds(ads);
        if (navbarAds.length > 0) setNavbarAd(navbarAds[0]);
        if (ads.length > 0 && Math.random() < 0.4) setShowAdBar(true);
      } catch {
        setChatAds([]);
      }
    };

    fetchFooter();
    fetchAds();
    return () => {
      cancelled = true;
    };
  }, [open]);

  useEffect(() => {
    if (!showAdBar || chatAds.length === 0) return;
    setAdIndex(0);
  }, [showAdBar, chatAds]);

  useEffect(() => {
    if (!showAdBar || chatAds.length === 0) return;
    const ad = chatAds[Math.min(adIndex, chatAds.length - 1)];
    if (ad) recordImpression(ad);
  }, [adIndex, showAdBar, chatAds]);

  useEffect(() => {
    if (!showAdBar || chatAds.length === 0) return;
    const timer = setInterval(() => {
      setAdIndex((prev) => {
        const next = prev + 1;
        if (next >= chatAds.length) {
          clearInterval(timer);
          setShowAdBar(false);
          return prev;
        }
        return next;
      });
    }, AD_SLIDE_INTERVAL);
    return () => clearInterval(timer);
  }, [showAdBar, chatAds.length]);

  useEffect(() => {
    if (navbarAd) recordImpression(navbarAd);
  }, [navbarAd]);

  const maybeShowAds = () => {
    if (chatAds.length > 0 && Math.random() < 0.25) {
      setShowAdBar(true);
    }
  };

  const handleOpen = () => {
    setOpen(true);
    setMessages((prev) => (prev.length === 0 ? [botMessage(WELCOME_TEXT)] : prev));
  };

  const handleClose = () => {
    setOpen(false);
  };

  const handleDeleteChat = () => {
    setMessages([botMessage(WELCOME_TEXT)]);
    setShowAdBar(false);
    setAdIndex(0);
  };

  const performSearch = async (query) => {
    const response = await axiosInstance.get(`/api/news/search?q=${encodeURIComponent(query)}&limit=20`);
    if (response.data.success) {
      const scored = (response.data.data || [])
        .map((item) => ({
          id: item.id,
          title: item.title,
          category: item.category,
          image: item.image,
          subtitle: item.subtitle,
          paragraph: item.paragraph,
          publishedDate: item.publishedDate,
          score:
            scoreMatch(item.title, query) * 3 +
            scoreMatch(item.subtitle, query) * 1.5 +
            scoreMatch(item.paragraph, query) * 0.8
        }))
        .sort((a, b) => b.score - a.score)
        .slice(0, MAX_NEWS_MATCHES);
      return scored.map((item) => ({
        id: item.id,
        title: item.title,
        category: item.category,
        image: item.image,
        publishedDate: item.publishedDate
      }));
    }
    return [];
  };

  const handleSend = async (override) => {
    const text = (override !== undefined ? override : input).trim();
    if (!text || isSearching) return;
    setInput('');
    setMessages((prev) => [...prev, userMessage(text)]);

    if (isMakerCommand(text)) {
      setMessages((prev) => [
        ...prev,
        botMessage('मलाई Zero Infinity Technology ले विकास गरेको हो। थप जानकारीका लागि तलको लिङ्कमा क्लिक गर्नुहोस्:', 'maker')
      ]);
      maybeShowAds();
      return;
    }

    if (isGreeting(text)) {
      setMessages((prev) => [
        ...prev,
        botMessage('नमस्ते! कसरी मद्दत गर्न सक्छु? समाचारको शीर्षक वा कीवर्ड लेख्नुहोस्, मैले सम्पूर्ण वेबसाइटबाट खोजेर देखाउनेछु।')
      ]);
      maybeShowAds();
      return;
    }

    if (isNameCommand(text)) {
      setMessages((prev) => [
        ...prev,
        botMessage('मेरो नाम खुलासा च्याटबट हो। म खुलासा नेपालको समाचार वेबसाइटमा सहयोग गर्न बनेको बट हुँ।')
      ]);
      maybeShowAds();
      return;
    }

    const askTime = isTimeCommand(text);
    const askDate = isDateCommand(text);
    if (askTime || askDate) {
      const timeText = `अहिलेको समय: ${getNepaliTimeText()}`;
      const dateText = `आजको मिति: ${getNepaliDateText()}`;
      const reply = askTime && askDate ? `${dateText}\n${timeText}` : askTime ? timeText : dateText;
      setMessages((prev) => [...prev, botMessage(reply)]);
      maybeShowAds();
      return;
    }

    if (isHelpCommand(text)) {
      setMessages((prev) => [
        ...prev,
        botMessage('म समाचार खोज्न मद्दत गर्छु। उदाहरण: "खेलकुद", "सुशासन", वा कुनै समाचारको शीर्षक लेख्नुहोस्। परिणाममा क्लिक गरेर समाचार पढ्न सक्नुहुन्छ। फुटरको जानकारी पनि खोजिनेछ।')
      ]);
      maybeShowAds();
      return;
    }

    setIsSearching(true);
    setMessages((prev) => [...prev, botMessage('खोज्दैछु...', 'typing')]);
    try {
      const newsResults = await performSearch(text);
      const footerResults = performFooterSearch(footerData, text);
      setMessages((prev) => {
        const withoutTyping = prev.length > 0 && prev[prev.length - 1].kind === 'typing' ? prev.slice(0, -1) : prev;
        if (newsResults.length === 0 && footerResults.length === 0) {
          return [...withoutTyping, botMessage(`"${text}" सँग मिल्ने कुनै समाचार वा जानकारी भेटिएन। फरक कीवर्ड प्रयास गर्नुहोस्।`)];
        }
        const next = [...withoutTyping];
        if (newsResults.length > 0) {
          next.push(botMessage(`"${text}" सँग मिल्ने ${newsResults.length} वटा समाचार फेला पर्यो:`, 'results', newsResults));
        }
        if (footerResults.length > 0) {
          next.push(botMessage(`फुटरमा "${text}" सँग मिल्ने जानकारी:`, 'footer', footerResults));
        }
        return next;
      });
    } catch {
      setMessages((prev) => {
        const withoutTyping = prev.length > 0 && prev[prev.length - 1].kind === 'typing' ? prev.slice(0, -1) : prev;
        return [...withoutTyping, botMessage('खोज गर्दा केही समस्या भयो। कृपया फेरि प्रयास गर्नुहोस्।')];
      });
    } finally {
      setIsSearching(false);
    }
    maybeShowAds();
  };

  const handleResultClick = (item) => {
    navigate(`/${item.category}/${item.id}`);
    setOpen(false);
  };

  const handleAdClick = async (ad) => {
    try {
      await axiosInstance.post(`/api/ads/${ad.id}/click`);
    } catch {
      console.error('Ad click tracking failed:', ad.id);
    }
    if (ad.linkUrl) {
      const url = ad.linkUrl.startsWith('http') ? ad.linkUrl : `https://${ad.linkUrl}`;
      if (ad.openInNewTab !== false) {
        window.open(url, '_blank', 'noopener,noreferrer');
      } else {
        window.location.href = url;
      }
    }
  };

  return (
    <>
      {!footerInView && (
        <button
          onClick={handleOpen}
          aria-label="Chatbot"
          title="च्याटबट"
          className="fixed bottom-24 md:bottom-32 right-4 md:right-8 z-[90] group flex items-center justify-center rounded-full bg-gradient-to-br from-[#123E8C] to-[#1d4ed8] p-3.5 md:p-4 text-white shadow-2xl transition-all duration-300 hover:scale-110"
        >
          <Bot size={22} />
          <span className={`pointer-events-none absolute right-full mr-3 whitespace-nowrap rounded-lg px-2.5 py-1 text-xs font-medium text-white opacity-0 transition-opacity duration-200 group-hover:opacity-100 ${isDark ? 'bg-gray-700' : 'bg-gray-900'}`}>
            च्याटबट
          </span>
        </button>
      )}

      {open && (
        <>
          <div
            className="fixed inset-0 z-[100] bg-black/40 backdrop-blur-[1px]"
            onClick={handleClose}
          />

          <div
            className={`fixed bottom-24 md:bottom-32 right-4 md:right-8 z-[110] flex w-[calc(100vw-2rem)] max-w-md flex-col overflow-hidden rounded-2xl border shadow-2xl ${isDark ? 'border-gray-700 bg-gray-900' : 'border-gray-200 bg-white'}`}
            style={{ height: 'min(65vh, 520px)', minHeight: '300px' }}
          >
            <div className="flex items-center justify-between bg-gradient-to-r from-[#123E8C] to-[#1e40af] px-4 py-3">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white/15">
                  <Bot size={20} className="text-white" />
                </div>
                <div>
                  <p className="text-sm font-bold text-white">खुलासा च्याटबट</p>
                  <p className="text-[11px] text-blue-200">समाचार खोज्नुहोस्</p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={handleDeleteChat}
                  title="च्याट मेटाउनुहोस्"
                  className="rounded-full p-2 text-white/90 transition hover:bg-white/15 hover:text-white"
                >
                  <Trash2 size={18} />
                </button>
                <button
                  onClick={handleClose}
                  title="बन्द गर्नुहोस्"
                  className="rounded-full p-2 text-white/90 transition hover:bg-white/15 hover:text-white"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {navbarAd && (
              <button
                onClick={() => handleAdClick(navbarAd)}
                title={navbarAd.title || 'Advertisement'}
                className={`flex w-full items-center justify-center border-b p-1.5 ${isDark ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-gray-100'}`}
              >
                <img
                  src={getImageUrl(navbarAd.imageUrl)}
                  alt={navbarAd.title || 'Advertisement'}
                  className="h-14 max-w-full rounded-lg object-contain"
                  loading="lazy"
                />
              </button>
            )}

            <div ref={messagesRef} className={`flex-1 space-y-3 overflow-y-auto p-3 ${isDark ? 'bg-gray-900' : 'bg-gray-50'}`}>
              {messages.map((msg) => (
                <div key={msg.id} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div
                    className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${
                      msg.sender === 'user'
                        ? 'rounded-br-sm bg-[#123E8C] text-white'
                        : `${isDark ? 'rounded-bl-sm bg-gray-700 text-white' : 'rounded-bl-sm bg-gray-200 text-gray-900'}`
                    }`}
                  >
                    {msg.kind === 'typing' ? (
                      <TypingIndicator />
                    ) : (
                      <>
                        <p>{msg.text}</p>

                        {msg.kind === 'maker' && (
                          <a
                            href={ZERO_INFINITY_URL}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={`mt-1.5 inline-flex items-center gap-1 font-semibold underline underline-offset-2 ${isDark ? 'text-blue-400' : 'text-blue-700'}`}
                          >
                            Zero Infinity Technology ↗
                          </a>
                        )}

                        {msg.kind === 'results' && msg.results.length > 0 && (
                          <div className="mt-2 space-y-2">
                            {msg.results.map((item, index) => (
                              <button
                                key={`${item.category}-${item.id}`}
                                onClick={() => handleResultClick(item)}
                                className={`flex w-full items-center gap-3 rounded-xl border p-2 text-left transition ${
                                  isDark
                                    ? 'border-gray-600 bg-gray-800 hover:border-blue-500'
                                    : 'border-gray-200 bg-white hover:border-blue-500'
                                }`}
                              >
                                <img
                                  src={getImageUrl(item.image)}
                                  alt={item.title || 'News'}
                                  className="h-14 w-20 flex-shrink-0 rounded-lg object-cover"
                                  loading="lazy"
                                  onError={(e) => {
                                    e.target.style.display = 'none';
                                  }}
                                />
                                <div className="min-w-0 flex-1">
                                  <span className={`text-[11px] font-semibold ${isDark ? 'text-blue-400' : 'text-blue-600'}`}>
                                    {index + 1}. समाचार
                                  </span>
                                  <p className={`mt-0.5 line-clamp-2 text-sm font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                    {item.title}
                                  </p>
                                  <p className={`mt-1 text-[11px] ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                                    📅 {formatDate(item.publishedDate)}
                                  </p>
                                </div>
                              </button>
                            ))}
                          </div>
                        )}

                        {msg.kind === 'footer' && msg.results.length > 0 && (
                          <div className="mt-2 space-y-2">
                            {msg.results.map((entry, index) => {
                              const content = (
                                <>
                                  <span className={`block text-[11px] font-semibold ${isDark ? 'text-blue-400' : 'text-blue-600'}`}>
                                    {entry.label}
                                  </span>
                                  <p className={`mt-0.5 break-words text-sm font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                    {entry.value}
                                  </p>
                                </>
                              );
                              if (entry.url) {
                                const isHttp = entry.url.startsWith('http');
                                return (
                                  <a
                                    key={`${entry.label}-${index}`}
                                    href={entry.url}
                                    target={isHttp ? '_blank' : undefined}
                                    rel={isHttp ? 'noopener noreferrer' : undefined}
                                    className={`block rounded-xl border p-2.5 text-left transition ${
                                      isDark
                                        ? 'border-gray-600 bg-gray-800 hover:border-blue-500'
                                        : 'border-gray-200 bg-white hover:border-blue-500'
                                    }`}
                                  >
                                    {content}
                                  </a>
                                );
                              }
                              return (
                                <div
                                  key={`${entry.label}-${index}`}
                                  className={`block rounded-xl border p-2.5 text-left ${
                                    isDark ? 'border-gray-600 bg-gray-800' : 'border-gray-200 bg-white'
                                  }`}
                                >
                                  {content}
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {showAdBar && chatAds.length > 0 && (
              <div className={`border-t p-2 ${isDark ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-white'}`}>
                <div className="flex items-center justify-between px-1 pb-1.5">
                  <span className={`text-[10px] font-semibold uppercase tracking-wider ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                    विज्ञापन {adIndex + 1}/{chatAds.length}
                  </span>
                  <button
                    onClick={() => setShowAdBar(false)}
                    className="flex items-center gap-1 rounded-full bg-blue-600 px-2.5 py-1 text-[10px] font-semibold text-white transition hover:bg-blue-700"
                  >
                    <SkipForward size={12} />
                    Skip Ads
                  </button>
                </div>
                {chatAds[adIndex] && (
                  <button onClick={() => handleAdClick(chatAds[adIndex])} className="block w-full overflow-hidden rounded-lg text-left">
                    <img
                      src={getImageUrl(chatAds[adIndex].imageUrl)}
                      alt={chatAds[adIndex].title || 'Advertisement'}
                      className="h-20 w-full rounded-lg object-cover"
                      loading="lazy"
                    />
                  </button>
                )}
              </div>
            )}

            {messages.length <= 2 && (
              <div className={`flex flex-wrap gap-2 px-3 pb-1 ${isDark ? 'bg-gray-900' : 'bg-gray-50'}`}>
                {SUGGESTIONS.map((suggestion) => (
                  <button
                    key={suggestion}
                    onClick={() => handleSend(suggestion)}
                    className={`rounded-full border px-3 py-1 text-xs font-medium transition ${
                      isDark
                        ? 'border-blue-400/40 bg-blue-500/10 text-blue-300 hover:bg-blue-500/20'
                        : 'border-blue-600/40 bg-blue-50 text-blue-700 hover:bg-blue-100'
                    }`}
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            )}

            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSend();
              }}
              className={`flex items-center gap-2 border-t p-3 ${isDark ? 'border-gray-700 bg-gray-900' : 'border-gray-200 bg-white'}`}
            >
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="समाचार खोज्नुहोस्..."
                className={`flex-1 rounded-full border px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500 ${
                  isDark
                    ? 'border-gray-600 bg-gray-800 text-white placeholder-gray-400'
                    : 'border-gray-300 bg-gray-100 text-gray-900 placeholder-gray-500'
                }`}
              />
              <button
                type="submit"
                disabled={isSearching || !input.trim()}
                className="rounded-full bg-[#123E8C] p-2.5 text-white transition hover:bg-[#0d2f6b] disabled:opacity-50"
                aria-label="Send"
              >
                <Send size={18} />
              </button>
            </form>
          </div>
        </>
      )}
    </>
  );
};

export default ChatBot;
