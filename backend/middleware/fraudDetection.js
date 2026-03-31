import crypto from 'crypto';
import OpenAI from 'openai';
import Listing from '../models/Listing.js';
import User from '../models/User.js';
import FraudReport from '../models/FraudReport.js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.node' });

const openai = new OpenAI({
  apiKey: process.env.EMERGENT_LLM_KEY || process.env.OPENAI_API_KEY
});

// IMEI Validation using Luhn Algorithm
export const validateIMEI = (imei) => {
  if (!imei || imei.length !== 15) {
    return false;
  }

  // Check if all characters are digits
  if (!/^\d+$/.test(imei)) {
    return false;
  }

  // Luhn Algorithm
  let sum = 0;
  let shouldDouble = false;

  for (let i = imei.length - 1; i >= 0; i--) {
    let digit = parseInt(imei[i]);

    if (shouldDouble) {
      digit *= 2;
      if (digit > 9) {
        digit -= 9;
      }
    }

    sum += digit;
    shouldDouble = !shouldDouble;
  }

  return sum % 10 === 0;
};

// Check for duplicate IMEI
export const checkDuplicateIMEI = async (imei, listingId = null) => {
  const query = { imei };
  if (listingId) {
    query._id = { $ne: listingId };
  }
  
  const existingListing = await Listing.findOne(query);
  return existingListing !== null;
};

// Generate image hash for duplicate detection
export const generateImageHash = (imageUrl) => {
  return crypto.createHash('md5').update(imageUrl).digest('hex');
};

// Check for duplicate images
export const checkDuplicateImages = async (imageUrls) => {
  const hashes = imageUrls.map(url => generateImageHash(url));
  
  // Check for duplicates within the same listing
  const uniqueHashes = new Set(hashes);
  if (uniqueHashes.size !== hashes.length) {
    return { isDuplicate: true, message: 'Duplicate images detected in listing' };
  }

  // Check against existing listings (basic check)
  const existingListings = await Listing.find({
    'images.url': { $in: imageUrls }
  }).limit(5);

  if (existingListings.length > 0) {
    return { isDuplicate: true, message: 'Images match existing listings' };
  }

  return { isDuplicate: false, message: 'No duplicate images found' };
};

// AI-powered Bill OCR verification
export const verifyBillWithAI = async (billImageUrl, brand, price) => {
  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-5.2',
      messages: [
        {
          role: 'system',
          content: 'You are an expert bill verification assistant. Extract text from the bill image and verify if the brand name and price match. Return a JSON response with: brandMatch (boolean), priceMatch (boolean), extractedBrand (string), extractedPrice (number), confidence (0-100), and notes (string).'
        },
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: `Please verify this bill image. Expected brand: ${brand}, Expected price: ${price}. Extract all visible text and verify if the brand and price match.`
            },
            {
              type: 'image_url',
              image_url: {
                url: billImageUrl
              }
            }
          ]
        }
      ],
      max_tokens: 500
    });

    const result = response.choices[0].message.content;
    
    try {
      const parsed = JSON.parse(result);
      return {
        success: true,
        brandMatch: parsed.brandMatch || false,
        priceMatch: parsed.priceMatch || false,
        extractedBrand: parsed.extractedBrand || '',
        extractedPrice: parsed.extractedPrice || 0,
        confidence: parsed.confidence || 0,
        notes: parsed.notes || result
      };
    } catch (parseError) {
      return {
        success: true,
        brandMatch: result.toLowerCase().includes(brand.toLowerCase()),
        priceMatch: result.includes(price.toString()),
        extractedBrand: '',
        extractedPrice: 0,
        confidence: 50,
        notes: result
      };
    }
  } catch (error) {
    console.error('AI Bill verification error:', error);
    return {
      success: false,
      brandMatch: false,
      priceMatch: false,
      extractedBrand: '',
      extractedPrice: 0,
      confidence: 0,
      notes: `AI verification failed: ${error.message}`
    };
  }
};

// Check image quality (basic validation)
export const checkImageQuality = (images) => {
  if (!images || images.length === 0) {
    return { passed: false, message: 'No images provided' };
  }

  if (images.length < 2) {
    return { passed: false, message: 'At least 2 product images required' };
  }

  return { passed: true, message: 'Image quality check passed' };
};

// User behavior analysis
export const analyzeUserBehavior = async (userId) => {
  const user = await User.findById(userId);
  
  if (!user) {
    return { passed: false, message: 'User not found', riskScore: 100 };
  }

  let riskScore = 0;
  const reasons = [];

  // Check rejection rate
  if (user.totalListings > 0) {
    const rejectionRate = (user.rejectedListings / user.totalListings) * 100;
    if (rejectionRate > 50) {
      riskScore += 30;
      reasons.push('High rejection rate');
    }
  }

  // Check if user is new with multiple listings
  const accountAge = Date.now() - user.createdAt.getTime();
  const daysSinceCreation = accountAge / (1000 * 60 * 60 * 24);
  
  if (daysSinceCreation < 7 && user.totalListings > 5) {
    riskScore += 25;
    reasons.push('Too many listings for new account');
  }

  // Check existing risk score
  if (user.riskScore > 60) {
    riskScore += user.riskScore * 0.5;
    reasons.push('User has high existing risk score');
  }

  return {
    passed: riskScore < 50,
    message: reasons.length > 0 ? reasons.join(', ') : 'User behavior normal',
    riskScore
  };
};

// Main fraud detection middleware
export const fraudDetection = async (req, res, next) => {
  try {
    const { brand, model, price, imei, images, billImage } = req.body;
    const userId = req.user._id;

    const fraudChecks = {
      imeiValidation: { passed: false, message: '' },
      duplicateDetection: { passed: true, message: '' },
      imageQuality: { passed: false, message: '' },
      billOCR: { passed: false, message: '', extractedData: {} },
      userBehavior: { passed: false, message: '' }
    };

    const fraudReasons = [];
    let fraudScore = 0;

    // 1. IMEI Validation
    const isIMEIValid = validateIMEI(imei);
    if (!isIMEIValid) {
      fraudChecks.imeiValidation.passed = false;
      fraudChecks.imeiValidation.message = 'Invalid IMEI (failed Luhn algorithm)';
      fraudReasons.push('Invalid IMEI');
      fraudScore += 40;
    } else {
      fraudChecks.imeiValidation.passed = true;
      fraudChecks.imeiValidation.message = 'IMEI validation passed';
    }

    // 2. Check duplicate IMEI
    const isDuplicateIMEI = await checkDuplicateIMEI(imei);
    if (isDuplicateIMEI) {
      fraudChecks.duplicateDetection.passed = false;
      fraudChecks.duplicateDetection.message = 'Duplicate IMEI found in database';
      fraudReasons.push('Duplicate IMEI');
      fraudScore += 50;
    } else {
      fraudChecks.duplicateDetection.passed = true;
      fraudChecks.duplicateDetection.message = 'No duplicate IMEI found';
    }

    // 3. Check duplicate images
    const imageUrls = images.map(img => img.url);
    const imageDuplicateCheck = await checkDuplicateImages(imageUrls);
    if (imageDuplicateCheck.isDuplicate) {
      fraudReasons.push('Duplicate images');
      fraudScore += 20;
    }

    // 4. Image quality check
    const imageQualityCheck = checkImageQuality(images);
    fraudChecks.imageQuality = imageQualityCheck;
    if (!imageQualityCheck.passed) {
      fraudReasons.push(imageQualityCheck.message);
      fraudScore += 15;
    }

    // 5. AI Bill verification
    if (billImage && billImage.url) {
      const billVerification = await verifyBillWithAI(billImage.url, brand, price);
      fraudChecks.billOCR = {
        passed: billVerification.brandMatch && billVerification.priceMatch,
        message: billVerification.notes,
        extractedData: {
          brandMatch: billVerification.brandMatch,
          priceMatch: billVerification.priceMatch,
          extractedBrand: billVerification.extractedBrand,
          extractedPrice: billVerification.extractedPrice,
          confidence: billVerification.confidence
        }
      };

      if (!billVerification.brandMatch) {
        fraudReasons.push('Brand mismatch in bill');
        fraudScore += 25;
      }
      if (!billVerification.priceMatch) {
        fraudReasons.push('Price mismatch in bill');
        fraudScore += 20;
      }
      if (billVerification.confidence < 50) {
        fraudReasons.push('Low confidence in bill verification');
        fraudScore += 10;
      }
    } else {
      fraudChecks.billOCR.passed = false;
      fraudChecks.billOCR.message = 'No bill image provided';
      fraudReasons.push('Missing bill image');
      fraudScore += 30;
    }

    // 6. User behavior analysis
    const userBehavior = await analyzeUserBehavior(userId);
    fraudChecks.userBehavior = userBehavior;
    if (!userBehavior.passed) {
      fraudReasons.push(userBehavior.message);
      fraudScore += userBehavior.riskScore * 0.3;
    }

    // Cap fraud score at 100
    fraudScore = Math.min(Math.round(fraudScore), 100);

    // Create fraud report
    req.fraudReport = {
      fraudScore,
      fraudReasons,
      checks: fraudChecks,
      autoRejected: fraudScore > 70
    };

    // Auto-reject if fraud score is too high
    if (fraudScore > 70) {
      return res.status(400).json({
        success: false,
        message: 'Listing rejected due to high fraud score',
        fraudScore,
        fraudReasons,
        autoRejected: true
      });
    }

    next();
  } catch (error) {
    console.error('Fraud detection error:', error);
    return res.status(500).json({
      success: false,
      message: 'Error in fraud detection',
      error: error.message
    });
  }
};
