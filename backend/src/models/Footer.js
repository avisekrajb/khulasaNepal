// models/Footer.js
const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Footer = sequelize.define('Footer', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  
  // Logo
  logoUrl: {
    type: DataTypes.TEXT('long'),
    allowNull: true,
    comment: 'URL or base64 of the footer logo image'
  },
  
  // Background Media (Image or Video)
  bgMediaUrl: {
    type: DataTypes.TEXT('long'),
    allowNull: true,
    comment: 'URL or base64 of background image or video'
  },
  bgMediaType: {
    type: DataTypes.ENUM('image', 'video'),
    allowNull: true,
    defaultValue: 'image',
    comment: 'Type of background media - image or video'
  },
  
  // Contact Information
  address: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: 'Company address'
  },
  phone: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: 'Contact phone number'
  },
  email: {
    type: DataTypes.STRING,
    allowNull: true,
    validate: {
      isEmail: true
    },
    comment: 'Contact email address'
  },
  
  // Team Information
  chairman: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: 'Chairman / Chief Editor name'
  },
  itEditor: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: 'IT Editor name'
  },
  legalAdvisor: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: 'Legal Advisor name'
  },
  advisor: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: 'Advisor name'
  },
  coEditor: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: 'Co-Editor name'
  },
  
  // Company Information
  companyName: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: 'Company name'
  },
  pressName: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: 'Press name'
  },
  departmentRegNo: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: 'Department registration number'
  },
  pressCouncilNo: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: 'Press council number'
  },
  
  // Social Media Links
  facebookUrl: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: 'Facebook page URL'
  },
  whatsappNumber: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: 'WhatsApp number'
  },
  twitterUrl: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: 'Twitter/X profile URL'
  },
  instagramUrl: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: 'Instagram profile URL'
  },
  youtubeUrl: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: 'YouTube channel URL'
  },
  
  // Copyright and About
  copyrightText: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: 'Copyright text'
  },
  aboutText: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'About description'
  },
  
  // Useful Links (JSON array)
  usefulLinks: {
    type: DataTypes.TEXT,
    allowNull: true,
    defaultValue: '[]',
    comment: 'JSON array of useful links with text and url',
    get() {
      const rawValue = this.getDataValue('usefulLinks');
      if (!rawValue) return [];
      try {
        return JSON.parse(rawValue);
      } catch (e) {
        return [];
      }
    },
    set(value) {
      if (typeof value === 'string') {
        this.setDataValue('usefulLinks', value);
      } else {
        this.setDataValue('usefulLinks', JSON.stringify(value || []));
      }
    }
  },
  
  // Active Status
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    comment: 'Whether this footer is active'
  }
}, {
  tableName: 'footers',
  timestamps: true,
  createdAt: 'createdAt',
  updatedAt: 'updatedAt',
  
  // Indexes for better performance
  indexes: [
    {
      fields: ['isActive'],
      name: 'footer_active_index'
    },
    {
      fields: ['createdAt'],
      name: 'footer_created_index'
    }
  ],
  
  // Hooks
  hooks: {
    beforeCreate: async (footer) => {
      // Ensure only one active footer
      if (footer.isActive) {
        await Footer.update(
          { isActive: false },
          { where: {} }
        );
      }
    },
    beforeUpdate: async (footer) => {
      // Ensure only one active footer when updating
      if (footer.isActive) {
        await Footer.update(
          { isActive: false },
          { where: { id: { [require('sequelize').Op.ne]: footer.id } } }
        );
      }
    }
  }
});

// Instance method to get formatted useful links
Footer.prototype.getUsefulLinks = function() {
  const links = this.getDataValue('usefulLinks');
  if (!links) return [];
  try {
    return typeof links === 'string' ? JSON.parse(links) : links;
  } catch (e) {
    return [];
  }
};

// Static method to get active footer
Footer.getActiveFooter = async function() {
  const footer = await this.findOne({
    where: { isActive: true },
    order: [['updatedAt', 'DESC']]
  });
  return footer;
};

// Static method to get public footer data
Footer.getPublicFooter = async function() {
  const footer = await this.getActiveFooter();
  if (!footer) return null;
  
  // Return sanitized data for public
  return {
    logoUrl: footer.logoUrl,
    bgMediaUrl: footer.bgMediaUrl,
    bgMediaType: footer.bgMediaType,
    address: footer.address,
    phone: footer.phone,
    email: footer.email,
    chairman: footer.chairman,
    itEditor: footer.itEditor,
    legalAdvisor: footer.legalAdvisor,
    advisor: footer.advisor,
    coEditor: footer.coEditor,
    companyName: footer.companyName,
    pressName: footer.pressName,
    departmentRegNo: footer.departmentRegNo,
    pressCouncilNo: footer.pressCouncilNo,
    facebookUrl: footer.facebookUrl,
    whatsappNumber: footer.whatsappNumber,
    twitterUrl: footer.twitterUrl,
    instagramUrl: footer.instagramUrl,
    youtubeUrl: footer.youtubeUrl,
    copyrightText: footer.copyrightText,
    aboutText: footer.aboutText,
    usefulLinks: footer.getUsefulLinks()
  };
};

module.exports = Footer;