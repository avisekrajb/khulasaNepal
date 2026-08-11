import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FaFacebook, FaWhatsapp, FaTwitter, FaInstagram, FaYoutube, FaPhone, FaEnvelope, FaArrowRight, FaUsers } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';

const API_URL = import.meta.env.VITE_API_URL;

function Footer() {
  const { isDark } = useTheme();
  const [footerData, setFooterData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchFooterData();
  }, []);

  const fetchFooterData = async () => {
    try {
      const response = await fetch(`${API_URL}/api/footer/public`);
      if (!response.ok) {
        throw new Error(`Failed: ${response.status}`);
      }
      const data = await response.json();
      
      if (data.success && data.footer) {
        let parsed = { ...data.footer };
        if (typeof data.footer.usefulLinks === 'string') {
          try {
            parsed.usefulLinks = JSON.parse(data.footer.usefulLinks);
          } catch (parseError) {
            console.error('Error parsing useful links:', parseError);
            parsed.usefulLinks = [];
          }
        }
        setFooterData(parsed);
      } else {
        setError(data.message || 'No footer found');
      }
    } catch (err) {
      console.error('Error fetching footer:', err);
      setError('Unable to load footer.');
    } finally {
      setLoading(false);
    }
  };

  const splitLinksIntoColumns = (links) => {
    if (!links || links.length === 0) return [[], [], []];
    const perColumn = Math.ceil(links.length / 3);
    return Array.from({ length: 3 }, (_, i) =>
      links.slice(i * perColumn, (i + 1) * perColumn)
    );
  };

  const handleOurTeamClick = () => {
    navigate('/ourteam');
  };

  // Text colors: White in light mode, Red in dark mode
  const textColor = isDark ? 'text-[#E31B23]' : 'text-white';
  const textColorHover = isDark ? 'hover:text-[#ff4444]' : 'hover:text-[#E31B23]';
  const headingColor = isDark ? 'text-[#E31B23]' : 'text-white';
  const borderColor = isDark ? 'border-[#E31B23]/30' : 'border-white/20';
  
  // Different overlay based on theme and background
  const getOverlayClass = () => {
    if (footerData?.bgMediaUrl) {
      return isDark ? 'bg-black/85' : 'bg-black/70';
    }
    return isDark ? 'bg-[#0a0a0a]' : 'bg-[#1a1a2e]';
  };

  if (loading) {
    return (
      <footer className="bg-[#0a0a1a] text-white py-12 text-center text-lg">
        <div className="animate-pulse font-bold">Loading...</div>
      </footer>
    );
  }

  if (error) {
    return (
      <footer className="bg-[#0a0a1a] text-white py-12 text-center text-red-400 text-lg">
        {error}
      </footer>
    );
  }

  const linkColumns = splitLinksIntoColumns(footerData?.usefulLinks || []);

  const getBgStyle = () => {
    if (!footerData?.bgMediaUrl) {
      return { 
        background: isDark ? '#0a0a0a' : '#1a1a2e'
      };
    }

    if (footerData.bgMediaType === 'image') {
      return {
        backgroundImage: `url(${footerData.bgMediaUrl})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        backgroundAttachment: 'fixed'
      };
    }
    return { 
      background: isDark ? '#0a0a0a' : '#1a1a2e'
    };
  };

  return (
    <footer 
      className="relative overflow-hidden"
      style={getBgStyle()}
    >
      {/* FAT SNAKE BORDER - Red Top & Blue Bottom with Neon Glow */}
      <div className="absolute top-0 left-0 right-0 h-[5px] bg-gradient-to-r from-transparent via-[#E31B23] to-transparent" style={{ zIndex: 2 }}></div>
      <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-[#E31B23]/0 via-[#E31B23] to-[#E31B23]/0 blur-[3px]" style={{ zIndex: 2 }}></div>
      <div className="absolute top-[-6px] left-0 right-0 h-6 bg-gradient-to-r from-transparent via-[#E31B23]/15 to-transparent blur-2xl" style={{ zIndex: 1 }}></div>
      
      <div className="absolute bottom-0 left-0 right-0 h-[5px] bg-gradient-to-r from-transparent via-[#123E8C] to-transparent" style={{ zIndex: 2 }}></div>
      <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-gradient-to-r from-[#123E8C]/0 via-[#123E8C] to-[#123E8C]/0 blur-[3px]" style={{ zIndex: 2 }}></div>
      <div className="absolute bottom-[-6px] left-0 right-0 h-6 bg-gradient-to-r from-transparent via-[#123E8C]/15 to-transparent blur-2xl" style={{ zIndex: 1 }}></div>

      {/* Animated Snake Glow Effect */}
      <motion.div 
        className="absolute top-0 left-0 right-0 h-8 bg-gradient-to-r from-transparent via-[#E31B23]/10 to-transparent blur-2xl"
        animate={{ 
          opacity: [0.3, 0.8, 0.3],
        }}
        transition={{ 
          duration: 3,
          repeat: Infinity,
          ease: "easeInOut"
        }}
        style={{ zIndex: 1 }}
      />
      <motion.div 
        className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-r from-transparent via-[#123E8C]/10 to-transparent blur-2xl"
        animate={{ 
          opacity: [0.3, 0.8, 0.3],
        }}
        transition={{ 
          duration: 3,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 0.5
        }}
        style={{ zIndex: 1 }}
      />

      {/* Video Background */}
      {footerData?.bgMediaUrl && footerData?.bgMediaType === 'video' && (
        <video
          autoPlay
          muted
          loop
          playsInline
          className="absolute inset-0 w-full h-full object-cover"
          style={{ zIndex: 0 }}
        >
          <source src={footerData.bgMediaUrl} type="video/mp4" />
          <source src={footerData.bgMediaUrl} type="video/webm" />
          Your browser does not support the video tag.
        </video>
      )}

      {/* Dynamic Overlay for Text Readability */}
      <div className={`absolute inset-0 ${getOverlayClass()}`} style={{ zIndex: 1 }}></div>

      {/* Content */}
      <div className="relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
          
          {/* Main Footer Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12 mb-12">
            
            {/* Column 1: Logo & Contact */}
            <div className="space-y-6">
              {footerData?.logoUrl && (
                <motion.div 
                  className="inline-block"
                  whileHover={{ scale: 1.05 }}
                  transition={{ duration: 0.3 }}
                >
                  <img 
                    src={footerData.logoUrl} 
                    alt="Logo" 
                    className="h-16 w-auto object-contain" 
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.style.display = 'none';
                    }}
                  />
                </motion.div>
              )}
              
              <div className="space-y-3">
                {footerData?.phone && (
                  <motion.div 
                    className={`flex items-center gap-3 ${textColor} ${textColorHover} transition-colors duration-300 group cursor-pointer`}
                    whileHover={{ x: 5 }}
                    transition={{ duration: 0.2 }}
                  >
                    <FaPhone className="text-[#E31B23] text-sm scale-x-[-1] group-hover:scale-110 transition-transform duration-300" />
                    <span className={`text-sm font-bold drop-shadow-lg ${textColor} group-hover:text-[#ff4444] transition-colors duration-300`}>{footerData.phone}</span>
                  </motion.div>
                )}
                {footerData?.email && (
                  <motion.div 
                    className={`flex items-center gap-3 ${textColor} ${textColorHover} transition-colors duration-300 group cursor-pointer`}
                    whileHover={{ x: 5 }}
                    transition={{ duration: 0.2 }}
                  >
                    <FaEnvelope className="text-[#E31B23] text-sm group-hover:scale-110 transition-transform duration-300" />
                    <span className={`text-sm font-bold drop-shadow-lg ${textColor} group-hover:text-[#ff4444] transition-colors duration-300`}>{footerData.email}</span>
                  </motion.div>
                )}
              </div>

              {/* Social Media Icons */}
              <div className="flex items-center gap-4 pt-2">
                {footerData?.facebookUrl && (
                  <motion.a 
                    href={footerData.facebookUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className={`${textColor} ${textColorHover} transition-all duration-300 drop-shadow-lg`}
                    whileHover={{ scale: 1.2, y: -2 }}
                    aria-label="Facebook"
                  >
                    <FaFacebook className="text-xl" />
                  </motion.a>
                )}
                {footerData?.whatsappNumber && (
                  <motion.a 
                    href={`https://wa.me/${footerData.whatsappNumber.replace(/\D/g, '')}`} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className={`${textColor} ${textColorHover} transition-all duration-300 drop-shadow-lg`}
                    whileHover={{ scale: 1.2, y: -2 }}
                    aria-label="WhatsApp"
                  >
                    <FaWhatsapp className="text-xl" />
                  </motion.a>
                )}
                {footerData?.twitterUrl && (
                  <motion.a 
                    href={footerData.twitterUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className={`${textColor} ${textColorHover} transition-all duration-300 drop-shadow-lg`}
                    whileHover={{ scale: 1.2, y: -2 }}
                    aria-label="Twitter"
                  >
                    <FaTwitter className="text-xl" />
                  </motion.a>
                )}
                {footerData?.instagramUrl && (
                  <motion.a 
                    href={footerData.instagramUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className={`${textColor} ${textColorHover} transition-all duration-300 drop-shadow-lg`}
                    whileHover={{ scale: 1.2, y: -2 }}
                    aria-label="Instagram"
                  >
                    <FaInstagram className="text-xl" />
                  </motion.a>
                )}
                {footerData?.youtubeUrl && (
                  <motion.a 
                    href={footerData.youtubeUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className={`${textColor} ${textColorHover} transition-all duration-300 drop-shadow-lg`}
                    whileHover={{ scale: 1.2, y: -2 }}
                    aria-label="YouTube"
                  >
                    <FaYoutube className="text-xl" />
                  </motion.a>
                )}
              </div>
            </div>

            {/* Column 2: Team Info */}
            <div className="space-y-3">
              <h4 className={`${headingColor} font-bold text-lg uppercase tracking-wider mb-4 border-b ${borderColor} pb-2 drop-shadow-lg ${textColorHover} transition-colors duration-300`}>
                हाम्रो टोली
              </h4>
              {footerData?.chairman && (
                <motion.p 
                  className={`text-sm ${textColor} ${textColorHover} transition-colors duration-300 drop-shadow-lg cursor-pointer`}
                  whileHover={{ x: 5 }}
                  transition={{ duration: 0.2 }}
                >
                  <span className={`font-bold ${textColor} hover:text-[#ff4444] transition-colors duration-300`}>अध्यक्ष/प्रधान सम्पादक:</span>{' '}
                  <span className={`font-bold ${textColor} hover:text-[#ff4444] transition-colors duration-300`}>{footerData.chairman}</span>
                </motion.p>
              )}
              {footerData?.itEditor && (
                <motion.p 
                  className={`text-sm ${textColor} ${textColorHover} transition-colors duration-300 drop-shadow-lg cursor-pointer`}
                  whileHover={{ x: 5 }}
                  transition={{ duration: 0.2 }}
                >
                  <span className={`font-bold ${textColor} hover:text-[#ff4444] transition-colors duration-300`}>सूचना प्रविधि सम्पादक:</span>{' '}
                  <span className={`font-bold ${textColor} hover:text-[#ff4444] transition-colors duration-300`}>{footerData.itEditor}</span>
                </motion.p>
              )}
              {footerData?.legalAdvisor && (
                <motion.p 
                  className={`text-sm ${textColor} ${textColorHover} transition-colors duration-300 drop-shadow-lg cursor-pointer`}
                  whileHover={{ x: 5 }}
                  transition={{ duration: 0.2 }}
                >
                  <span className={`font-bold ${textColor} hover:text-[#ff4444] transition-colors duration-300`}>कानूनी सल्लाहकार:</span>{' '}
                  <span className={`font-bold ${textColor} hover:text-[#ff4444] transition-colors duration-300`}>{footerData.legalAdvisor}</span>
                </motion.p>
              )}
              {footerData?.advisor && (
                <motion.p 
                  className={`text-sm ${textColor} ${textColorHover} transition-colors duration-300 drop-shadow-lg cursor-pointer`}
                  whileHover={{ x: 5 }}
                  transition={{ duration: 0.2 }}
                >
                  <span className={`font-bold ${textColor} hover:text-[#ff4444] transition-colors duration-300`}>सल्लाहकार:</span>{' '}
                  <span className={`font-bold ${textColor} hover:text-[#ff4444] transition-colors duration-300`}>{footerData.advisor}</span>
                </motion.p>
              )}
              {footerData?.coEditor && (
                <motion.p 
                  className={`text-sm ${textColor} ${textColorHover} transition-colors duration-300 drop-shadow-lg cursor-pointer`}
                  whileHover={{ x: 5 }}
                  transition={{ duration: 0.2 }}
                >
                  <span className={`font-bold ${textColor} hover:text-[#ff4444] transition-colors duration-300`}>सह-सम्पादक:</span>{' '}
                  <span className={`font-bold ${textColor} hover:text-[#ff4444] transition-colors duration-300`}>{footerData.coEditor}</span>
                </motion.p>
              )}
            </div>

            {/* Column 3: Company Info */}
            <div className="space-y-3">
              <h4 className={`${headingColor} font-bold text-lg uppercase tracking-wider mb-4 border-b ${borderColor} pb-2 drop-shadow-lg ${textColorHover} transition-colors duration-300`}>
                कम्पनी जानकारी
              </h4>
              {footerData?.companyName && (
                <motion.p 
                  className={`text-sm ${textColor} ${textColorHover} transition-colors duration-300 drop-shadow-lg cursor-pointer`}
                  whileHover={{ x: 5 }}
                  transition={{ duration: 0.2 }}
                >
                  <span className={`font-bold ${textColor} hover:text-[#ff4444] transition-colors duration-300`}>कम्पनी:</span>{' '}
                  <span className={`font-bold ${textColor} hover:text-[#ff4444] transition-colors duration-300`}>{footerData.companyName}</span>
                </motion.p>
              )}
              {footerData?.address && (
                <motion.p 
                  className={`text-sm ${textColor} ${textColorHover} transition-colors duration-300 drop-shadow-lg cursor-pointer`}
                  whileHover={{ x: 5 }}
                  transition={{ duration: 0.2 }}
                >
                  <span className={`font-bold ${textColor} hover:text-[#ff4444] transition-colors duration-300`}>ठेगाना:</span>{' '}
                  <span className={`font-bold ${textColor} hover:text-[#ff4444] transition-colors duration-300`}>{footerData.address}</span>
                </motion.p>
              )}
              {footerData?.pressName && (
                <motion.p 
                  className={`text-sm ${textColor} ${textColorHover} transition-colors duration-300 drop-shadow-lg cursor-pointer`}
                  whileHover={{ x: 5 }}
                  transition={{ duration: 0.2 }}
                >
                  <span className={`font-bold ${textColor} hover:text-[#ff4444] transition-colors duration-300`}>प्रिन्ट:</span>{' '}
                  <span className={`font-bold ${textColor} hover:text-[#ff4444] transition-colors duration-300`}>{footerData.pressName}</span>
                </motion.p>
              )}
            </div>

            {/* Column 4: Registration */}
            <div className="space-y-4">
              <h4 className={`${headingColor} font-bold text-lg uppercase tracking-wider mb-4 border-b ${borderColor} pb-2 drop-shadow-lg ${textColorHover} transition-colors duration-300`}>
                दर्ता जानकारी
              </h4>
              {footerData?.departmentRegNo && (
                <div className="space-y-0.5 hover:bg-white/5 p-2 rounded-lg transition-all duration-300">
                  <p className={`text-xs font-bold drop-shadow-lg ${textColor} hover:text-[#ff4444] transition-colors duration-300`}>सूचना विभाग दर्ता नं.</p>
                  <p className={`font-bold text-sm drop-shadow-lg ${textColor} hover:text-[#ff4444] transition-colors duration-300`}>{footerData.departmentRegNo}</p>
                </div>
              )}
              {footerData?.pressCouncilNo && (
                <div className="space-y-0.5 hover:bg-white/5 p-2 rounded-lg transition-all duration-300">
                  <p className={`text-xs font-bold drop-shadow-lg ${textColor} hover:text-[#ff4444] transition-colors duration-300`}>प्रेस काउन्सिल नेपाल सूचीकरण नं.</p>
                  <p className={`font-bold text-sm drop-shadow-lg ${textColor} hover:text-[#ff4444] transition-colors duration-300`}>{footerData.pressCouncilNo}</p>
                </div>
              )}
              
              {/* MODERN MINI OUR TEAM BUTTON */}
              <div className="flex justify-start mt-3">
                <motion.button 
                  onClick={handleOurTeamClick}
                  className="group relative inline-flex items-center gap-2 px-5 py-2.5 bg-[#E31B23] hover:bg-[#c4181f] text-white rounded-lg font-bold text-xs transition-all duration-300 shadow-lg hover:shadow-[#E31B23]/30 overflow-hidden"
                  whileHover={{ 
                    scale: 1.05,
                    transition: { type: "spring", stiffness: 400, damping: 10 }
                  }}
                  whileTap={{ scale: 0.95 }}
                >
                  <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700"></span>
                  
                  <FaUsers className="text-[10px] group-hover:rotate-12 transition-transform duration-300" />
                  <span className="tracking-wide">Our Team</span>
                  <FaArrowRight className="text-[10px] group-hover:translate-x-1 transition-transform duration-300" />
                </motion.button>
              </div>
            </div>
          </div>

          {/* Useful Links Section */}
          {footerData?.usefulLinks && footerData.usefulLinks.length > 0 && (
            <motion.div 
              className={`py-8 border-t border-b ${borderColor} mb-8`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <h3 className={`text-3xl font-bold text-center mb-8 drop-shadow-lg ${textColor} ${textColorHover} transition-colors duration-300`}>
                उपयोगी लिङ्कहरू
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
                {linkColumns.map((column, columnIndex) => (
                  <ul key={`column-${columnIndex}`} className="space-y-2 text-center">
                    {column.map((link, linkIndex) => (
                      <motion.li 
                        key={`link-${columnIndex}-${linkIndex}`}
                        whileHover={{ x: 5 }}
                        transition={{ duration: 0.2 }}
                      >
                        <a 
                          href={link.url || '#'} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className={`${textColor} ${textColorHover} transition-colors duration-300 text-sm inline-flex items-center gap-2 font-bold drop-shadow-lg`}
                        >
                          <span className="text-[#E31B23] font-bold group-hover:text-[#ff4444] transition-colors duration-300">▸</span>
                          {link.text || link || 'Link'}
                        </a>
                      </motion.li>
                    ))}
                  </ul>
                ))}
              </div>
            </motion.div>
          )}

          {/* Bottom Bar */}
          <div className="pt-6">
            {/* Ad Contact */}
            {footerData?.phone && (
              <motion.div 
                className="text-center mb-6"
                whileHover={{ scale: 1.02 }}
                transition={{ duration: 0.2 }}
              >
                <p className={`text-xs font-bold drop-shadow-lg ${textColor} ${textColorHover} transition-colors duration-300`}>For advertisement contact</p>
                <p className="text-sm font-bold text-[#E31B23] hover:text-[#ff4444] transition-colors duration-300 drop-shadow-lg cursor-pointer">
                  {footerData.phone}
                </p>
              </motion.div>
            )}

            {/* Copyright & Powered By */}
            <div className="mt-4 pt-6 border-t ${borderColor} text-center">
              <div className="space-y-3">
                {footerData?.copyrightText && (
                  <motion.p 
                    className={`text-sm ${textColor} ${textColorHover} transition-colors duration-300 font-bold drop-shadow-lg cursor-pointer`}
                    whileHover={{ scale: 1.02 }}
                    transition={{ duration: 0.2 }}
                  >
                    {footerData.copyrightText}
                  </motion.p>
                )}
                
                {/* Powered by section - visible in both modes (no white-on-light) */}
                <motion.div 
                  className={`inline-flex items-center gap-2 px-4 py-2 ${
                    isDark 
                      ? 'bg-[#E31B23]/10 hover:bg-[#E31B23]/20 border-[#E31B23]/30 hover:border-[#E31B23]/50' 
                      : 'bg-[#8B5CF6]/10 hover:bg-[#8B5CF6]/20 border-[#8B5CF6]/30 hover:border-[#8B5CF6]/50'
                  } border rounded-full transition-all duration-300`}
                  whileHover={{ 
                    y: -3,
                    scale: 1.02,
                    transition: { type: "spring", stiffness: 400, damping: 10 }
                  }}
                >
                  <span className={`text-xs font-medium drop-shadow-lg ${
                    isDark ? 'text-[#E31B23] hover:text-[#ff4444]' : 'text-[#8B5CF6] hover:text-[#7C3AED]'
                  } transition-colors duration-300`}>
                    Powered by
                  </span>
                  <span className={`h-4 w-[1px] ${
                    isDark ? 'bg-[#E31B23]/30' : 'bg-[#8B5CF6]/30'
                  }`}></span>
                  <a 
                    href="https://zeroinfinitytechnologies.com/" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className={`text-sm font-bold transition-all duration-300 hover:scale-105 drop-shadow-lg inline-block ${
                      isDark 
                        ? 'text-white hover:text-[#E31B23]' 
                        : 'text-[#8B5CF6] hover:text-[#7C3AED]'
                    }`}
                  >
                    Zero Infinity Technology
                  </a>
                </motion.div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default Footer;