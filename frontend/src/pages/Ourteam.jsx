import React, { useState, useEffect } from 'react';
import { Users, Mail, Phone, Loader, AlertCircle } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

const API_URL = import.meta.env.VITE_API_URL 

function Ourteam() {
  const { isDark } = useTheme();
  const [teamMembers, setTeamMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchTeamMembers();
  }, []);

  const fetchTeamMembers = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/api/team/public`);
      if (!response.ok) throw new Error('Failed to fetch');
      const data = await response.json();
      setTeamMembers(data.team || []);
      setError(null);
    } catch (err) {
      console.error('Error fetching team members:', err);
      setError('Failed to load team members');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className={`min-h-screen transition-colors duration-300 flex items-center justify-center ${
        isDark 
          ? 'bg-gradient-to-br from-slate-900 via-gray-900 to-indigo-950' 
          : 'bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50'
      }`}>
        <div className="text-center">
          <Loader className={`w-12 h-12 animate-spin mx-auto mb-4 ${
            isDark ? 'text-blue-400' : 'text-blue-600'
          }`} />
          <p className={`text-lg font-medium ${
            isDark ? 'text-slate-300' : 'text-slate-600'
          }`}>
            Loading our amazing team...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`min-h-screen transition-colors duration-300 flex items-center justify-center p-6 ${
        isDark 
          ? 'bg-gradient-to-br from-slate-900 via-gray-900 to-indigo-950' 
          : 'bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50'
      }`}>
        <div className={`rounded-2xl shadow-xl p-8 max-w-md text-center transition-colors duration-300 ${
          isDark ? 'bg-gray-800' : 'bg-white'
        }`}>
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h3 className={`text-2xl font-bold mb-2 transition-colors duration-300 ${
            isDark ? 'text-slate-200' : 'text-slate-800'
          }`}>
            Unable to Load Team
          </h3>
          <p className={`mb-6 transition-colors duration-300 ${
            isDark ? 'text-slate-400' : 'text-slate-600'
          }`}>
            {error}
          </p>
          <button
            onClick={fetchTeamMembers}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen transition-colors duration-300 ${
      isDark 
        ? 'bg-gradient-to-br from-slate-900 via-gray-900 to-indigo-950' 
        : 'bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50'
    }`}>
      {/* Hero Section */}
      <div className="py-10 px-2 transition-colors duration-300">
        <div className="max-w-7xl mx-auto text-center">
          <h1 className={`text-5xl md:text-6xl font-bold mb-4 tracking-tight transition-colors duration-300 ${
            isDark ? 'text-white' : 'text-black'
          }`}>
            हाम्रो टीम
          </h1>
        </div>
      </div>

      {/* Team Members Grid */}
      <div className="max-w-7xl mx-auto px-6 py-16">
        {teamMembers.length === 0 ? (
          <div className="text-center py-20">
            <div className={`inline-flex items-center justify-center w-24 h-24 rounded-full mb-6 transition-colors duration-300 ${
              isDark ? 'bg-gray-700' : 'bg-slate-200'
            }`}>
              <Users className={`w-12 h-12 transition-colors duration-300 ${
                isDark ? 'text-slate-400' : 'text-slate-400'
              }`} />
            </div>
            <h3 className={`text-2xl font-bold mb-2 transition-colors duration-300 ${
              isDark ? 'text-slate-200' : 'text-slate-800'
            }`}>
              No Team Members Yet
            </h3>
            <p className={`transition-colors duration-300 ${
              isDark ? 'text-slate-400' : 'text-slate-600'
            }`}>
              Our team information will be available soon
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
            {teamMembers.map((member) => (
              <div
                key={member._id}
                className={`group rounded-2xl shadow-lg+ transition-all duration-300 hover:shadow-xl ${
                  isDark 
                    ? 'bg-gray-800 hover:bg-gray-750 border border-gray-700' 
                    : 'bg-white hover:shadow-2xl'
                }`}
              >
                {/* Card Content */}
                <div className="p-8 text-center flex flex-col flex-1">
                  {/* Circular Image Container */}
                  <div className="relative inline-block mb-6 mx-auto">
                    <div className={`w-40 h-40 rounded-full overflow-hidden transition-colors duration-300 ${
                      isDark ? 'ring-2 ring-blue-500/30' : 'ring-4 ring-blue-100'
                    }`}>
                      {member.imageUrl ? (
                        <img
                          src={`${API_URL}${member.imageUrl}`}
                          alt={member.name}
                          className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-500"
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center">
                          <span className="text-white text-5xl font-bold">
                            {member.name.charAt(0)}
                          </span>
                        </div>
                      )}
                    </div>
                    {/* Decorative Ring */}
                    <div className={`absolute inset-0 rounded-full border-2 border-dashed opacity-0 group-hover:opacity-100 group-hover:scale-110 transition-all duration-500 ${
                      isDark ? 'border-blue-400' : 'border-blue-300'
                    }`}></div>
                  </div>

                  {/* Name & Position */}
                  <h3 className={`text-2xl font-bold mb-1 transition-colors duration-300 group-hover:text-blue-600 ${
                    isDark ? 'text-slate-200 group-hover:text-blue-400' : 'text-slate-800'
                  }`}>
                    {member.name}
                  </h3>
                  <p className={`text-blue-600 font-semibold text-sm uppercase tracking-wider mb-4 ${
                    isDark ? 'text-blue-400' : 'text-blue-600'
                  }`}>
                    {member.position}
                  </p>

                  {/* Bio - Commented out but updated for dark mode */}
                  {/* <div className="min-h-[60px] mb-4">
                    {member.bio ? (
                      <p className={`text-sm leading-relaxed line-clamp-3 transition-colors duration-300 ${
                        isDark ? 'text-slate-400' : 'text-slate-600'
                      }`}>
                        {member.bio}
                      </p>
                    ) : (
                      <p className={`text-sm italic transition-colors duration-300 ${
                        isDark ? 'text-slate-500' : 'text-slate-400'
                      }`}>
                        No bio available
                      </p>
                    )}
                  </div> */}

                  {/* Contact Information - Commented out but updated for dark mode */}
                  {/* <div className="space-y-2 mb-6 min-h-[48px]">
                    {member.email && (
                      <a
                        href={`mailto:${member.email}`}
                        className={`flex items-center justify-center text-sm transition-colors duration-300 group/email ${
                          isDark ? 'text-slate-400 hover:text-blue-400' : 'text-slate-600 hover:text-blue-600'
                        }`}
                      >
                        <Mail className="w-4 h-4 mr-2 group-hover/email:scale-110 transition-transform" />
                        <span className="truncate">{member.email}</span>
                      </a>
                    )}
                    {member.phone && (
                      <a
                        href={`tel:${member.phone}`}
                        className={`flex items-center justify-center text-sm transition-colors duration-300 group/phone ${
                          isDark ? 'text-slate-400 hover:text-blue-400' : 'text-slate-600 hover:text-blue-600'
                        }`}
                      >
                        <Phone className="w-4 h-4 mr-2 group-hover/phone:scale-110 transition-transform" />
                        <span>{member.phone}</span>
                      </a>
                    )}
                  </div> */}

                  {/* Social Media Links - Commented out but updated for dark mode */}
                  {/* <div className="pt-6 border-t mt-auto transition-colors duration-300 ${
                    isDark ? 'border-gray-700' : 'border-slate-100'
                  }`}>
                    {member.socialLinks && Object.values(member.socialLinks).some(link => link) ? (
                      <div className="flex justify-center gap-3">
                        {Object.entries(member.socialLinks).map(([platform, url]) => {
                          if (!url) return null;
                          const IconComponent = getSocialIcon(platform);
                          if (!IconComponent) return null;

                          const colorMap = {
                            facebook: 'hover:bg-blue-600',
                            twitter: 'hover:bg-sky-500',
                            linkedin: 'hover:bg-blue-700',
                            instagram: 'hover:bg-gradient-to-tr hover:from-purple-600 hover:via-pink-600 hover:to-orange-500'
                          };

                          return (
                            <a
                              key={`${member._id}-${platform}`}
                              href={url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 hover:scale-110 hover:shadow-lg ${
                                isDark 
                                  ? 'bg-gray-700 text-slate-400 hover:text-white' 
                                  : 'bg-slate-100 text-slate-600 hover:text-white'
                              } ${colorMap[platform]}`}
                              aria-label={platform}
                            >
                              <IconComponent className="w-5 h-5" />
                            </a>
                          );
                        })}
                      </div>
                    ) : (
                      <p className={`text-xs italic transition-colors duration-300 ${
                        isDark ? 'text-slate-500' : 'text-slate-400'
                      }`}>
                        No social links available
                      </p>
                    )}
                  </div> */}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default Ourteam;