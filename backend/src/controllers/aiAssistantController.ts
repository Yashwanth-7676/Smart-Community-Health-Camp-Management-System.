import { Request, Response, NextFunction } from 'express';
import { AppError } from '../middleware/errorHandler';

interface QAPair {
  keywords: string[];
  en: string;
  kn: string;
}

const KNOWLEDGE_BASE: QAPair[] = [
  {
    keywords: ['service', 'services', 'camp service', 'checkup', 'test', 'treatment', 'offer', 'facility'],
    en: 'Community health camps offer free vital services including General Physician consultations, Blood Pressure monitoring, Blood Sugar (Diabetes) screening, Eye screening & vision checks, Basic Dental examinations, and Child vaccination guidance.',
    kn: 'ಆರೋಗ್ಯ ಶಿಬಿರಗಳು ಸಾಮಾನ್ಯ ತಪಾಸಣೆ, ರಕ್ತದೊತ್ತಡ ತಪಾಸಣೆ, ಸಕ್ಕರೆ ಕಾಯಿಲೆ (ಮಧುಮೇಹ) ಪರೀಕ್ಷೆ, ದೃಷ್ಟಿ ಮತ್ತು ಕಣ್ಣಿನ ತಪಾಸಣೆ, ದಂತ ಪರೀಕ್ಷೆ ಮತ್ತು ಉಚಿತ ಔಷಧಿ ವಿತರಣೆಯನ್ನು ಒದಗಿಸುತ್ತವೆ.',
  },
  {
    keywords: ['book', 'appointment', 'register', 'slot', 'schedule', 'queue', 'token'],
    en: 'To book an appointment: 1) Go to the "Find Camps" page, 2) Select an upcoming camp near you, 3) Choose an available morning or afternoon time slot, and 4) Confirm booking. You will immediately receive a digital Queue Token with QR code for check-in.',
    kn: 'ಅಪಾಯಿಂಟ್ಮೆಂಟ್ ಕಾಯ್ದಿರಿಸಲು: 1) "ಶಿಬಿರಗಳನ್ನು ಹುಡುಕಿ" ಪುಟಕ್ಕೆ ಹೋಗಿ, 2) ಸಮೀಪದ ಶಿಬಿರವನ್ನು ಆಯ್ಕೆಮಾಡಿ, 3) ಸಮಯದ ಸ್ಲಾಟ್ ಆಯ್ಕೆಮಾಡಿ, 4) ಖಚಿತಪಡಿಸಿ. ನಿಮಗೆ ತಕ್ಷಣ ಕ್ಯೂ ಟೋಕನ್ ದೊರೆಯುತ್ತದೆ.',
  },
  {
    keywords: ['report', 'medical report', 'result', 'test result', 'doctor observation', 'prescription', 'download'],
    en: 'You can access all authorized medical reports by signing in and opening your "Patient Dashboard". Click on "Reports" to review diagnoses, physician notes, vitals, and download official PDF reports.',
    kn: 'ನಿಮ್ಮ ಅಧಿಕೃತ ವೈದ್ಯಕೀಯ ವರದಿಗಳನ್ನು ಪಡೆಯಲು: ಲಾಗಿನ್ ಆಗಿ ರೋಗಿಯ ಡ್ಯಾಶ್‌ಬೋರ್ಡ್‌ಗೆ ಹೋಗಿ, "ವರದಿಗಳು" ಕ್ಲಿಕ್ ಮಾಡಿ ಪಿಡಿಎಫ್ ಡೌನ್‌ಲೋಡ್ ಮಾಡಿಕೊಳ್ಳಬಹುದು.',
  },
  {
    keywords: ['emergency', 'urgent', 'chest pain', 'breathing', 'heart attack', 'accident', 'serious', 'ambulance'],
    en: '🚨 EMERGENCY NOTICE: For immediate life-threatening symptoms (severe chest pain, difficulty breathing, stroke signs, deep trauma), please call 108 (India Emergency Ambulance) or reach your nearest emergency hospital immediately. Health camps do not handle emergency critical care.',
    kn: '🚨 ತುರ್ತು ಎಚ್ಚರಿಕೆ: ತೀವ್ರ ಎದೆನೋವು, ಉಸಿರಾಟದ ತೊಂದರೆ ಅಥವಾ ಅಪಘಾತದಂತಹ ತುರ್ತು ಸಂದರ್ಭಗಳಲ್ಲಿ ದಯವಿಟ್ಟು ತಕ್ಷಣ 108 ಆಂಬ್ಯುಲೆನ್ಸ್ ಸಂಖ್ಯೆಗೆ ಕರೆ ಮಾಡಿ ಅಥವಾ ಹತ್ತಿರದ ತುರ್ತು ಆಸ್ಪತ್ರೆಗೆ ತೆರಳಿ.',
  },
  {
    keywords: ['bring', 'carry', 'document', 'id', 'requirement', 'card', 'preparation'],
    en: 'What to bring to the camp: 1) A valid government ID (Aadhaar or Voter ID), 2) Any previous medical records/prescriptions, 3) List of current medications you take daily, and 4) Your digital queue token on your phone or printed.',
    kn: 'ಶಿಬಿರಕ್ಕೆ ತರಬೇಕಾದ ದಾಖಲೆಗಳು: 1) ಸರ್ಕಾರಿ ಗುರುತಿನ ಚೀಟಿ (ಆಧಾರ್ ಇತ್ಯಾದಿ), 2) ಹಿಂದಿನ ವೈದ್ಯಕೀಯ ವರದಿಗಳು, 3) ಪ್ರಸ್ತುತ ಸೇವಿಸುತ್ತಿರುವ ಔಷಧಿಗಳ ವಿವರ, ಮತ್ತು 4) ನಿಮ್ಮ ಕ್ಯೂ ಟೋಕನ್.',
  },
  {
    keywords: ['offline', 'internet', 'connection', 'network', 'sync', 'rural'],
    en: 'Our platform is designed with rural-first offline support! Camp volunteers can register patients and issue queue tokens even when internet is unavailable. All records safely synchronize as soon as connection is restored.',
    kn: 'ನಮ್ಮ ತಂತ್ರಜ್ಞಾನವು ಇಂಟರ್ನೆಟ್ ಇಲ್ಲದಿದ್ದರೂ ಗ್ರಾಮೀಣ ಪ್ರದೇಶದಲ್ಲಿ ಕಾರ್ಯನಿರ್ವಹಿಸುತ್ತದೆ. ಸಂಪರ್ಕ ಮರಳಿದ ತಕ್ಷಣ ಎಲ್ಲಾ ಮಾಹಿತಿ ಸ್ವಯಂಚಾಲಿತವಾಗಿ ಸಿಂಕ್ ಆಗುತ್ತದೆ.',
  },
  {
    keywords: ['cost', 'fee', 'price', 'free', 'money', 'charge'],
    en: 'All primary screenings, doctor consultations, basic diagnostics, and essential medicines at our Smart Community Health Camps are 100% FREE for all community members.',
    kn: 'ನಮ್ಮ ಸಮುದಾಯ ಆರೋಗ್ಯ ಶಿಬಿರಗಳಲ್ಲಿ ಎಲ್ಲಾ ಪ್ರಾಥಮಿಕ ಪರೀಕ್ಷೆಗಳು, ವೈದ್ಯರ ಸಮಾಲೋಚನೆ ಮತ್ತು ಅಗತ್ಯ ಔಷಧಿಗಳು ಸಂಪೂರ್ಣವಾಗಿ ಉಚಿತವಾಗಿವೆ.',
  },
];

/**
 * Fallback knowledge matcher
 */
function findAnswer(query: string, lang: 'en' | 'kn'): string {
  const q = query.toLowerCase();

  for (const item of KNOWLEDGE_BASE) {
    if (item.keywords.some((kw) => q.includes(kw))) {
      return item[lang] || item.en;
    }
  }

  if (lang === 'kn') {
    return 'ನಮಸ್ಕಾರ! ನಾನು ಆರೋಗ್ಯ ಶಿಬಿರದ ಮಾಹಿತಿ ಸಹಾಯಕ. ಶಿಬಿರಗಳ ಸೇವೆಗಳು, ಅಪಾಯಿಂಟ್‌ಮೆಂಟ್‌ಗಳು, ವರದಿಗಳು ಮತ್ತು ಸಾಮಾನ್ಯ ಆರೋಗ್ಯ ಅರಿವಿನ ಬಗ್ಗೆ ನಾನು ನಿಮಗೆ ಮಾಹಿತಿ ನೀಡಬಲ್ಲೆ. ತುರ್ತು ಸಂದರ್ಭಗಳಿಗೆ 108 ಗೆ ಕರೆ ಮಾಡಿ.';
  }

  return 'Hello! I am your Health Camp Assistant. I can help explain camp services, how to book an appointment, access your medical reports, and general health awareness topics. Please note: I cannot diagnose conditions or prescribe medications. For emergencies, please call 108.';
}

/**
 * POST /api/ai/chat
 * Secure AI Health Information Assistant
 */
export const chatWithAssistant = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { message, language = 'en' } = req.body;

    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      throw new AppError('Message is required', 400);
    }

    const lang = language === 'kn' ? 'kn' : 'en';
    const apiKey = process.env.AI_API_KEY || process.env.GEMINI_API_KEY;

    // Safety checks against prescription requests
    const lower = message.toLowerCase();
    const prescriptionKeywords = ['prescribe', 'dosage', 'how many mg', 'antibiotic for me', 'which medicine to buy'];
    if (prescriptionKeywords.some((p) => lower.includes(p))) {
      const refusal =
        lang === 'kn'
          ? '⚠️ ವೈದ್ಯಕೀಯ ನಿಯಮಗಳ ಪ್ರಕಾರ ನಾನು ಔಷಧಿಗಳನ್ನು ಶಿಫಾರಸು ಮಾಡಲು ಸಾಧ್ಯವಿಲ್ಲ. ದಯವಿಟ್ಟು ಶಿಬಿರದಲ್ಲಿರುವ ಪ್ರಮಾಣೀಕೃತ ವೈದ್ಯರನ್ನು ಭೇಟಿ ಮಾಡಿ.'
          : '⚠️ Safety Notice: I cannot prescribe specific medications or dosages. Please consult our certified medical officers at the health camp for a proper diagnosis and prescription.';
      res.json({
        success: true,
        data: {
          response: refusal,
          source: 'safety_guard',
        },
      });
      return;
    }

    // If an external AI API key is configured on the server, we can query it safely
    if (apiKey) {
      try {
        const systemPrompt = `You are a helpful, empathetic Community Health Camp Assistant in India.
Provide general health information, camp procedures, and preventive tips in ${lang === 'kn' ? 'Kannada' : 'English'}.
CRITICAL SAFETY RULES:
- Never diagnose disease.
- Never prescribe medicines or dosages.
- Distinguish informational advice from doctor consultation.
- For emergency, advise calling 108.
- Keep responses friendly, concise, and easy for rural citizens to understand.`;

        // Generic API fetch (supports compatible OpenAI/Gemini REST endpoints)
        const response = await fetch(process.env.AI_API_URL || 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=' + apiKey, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [
              {
                role: 'user',
                parts: [{ text: `${systemPrompt}\n\nUser Question: ${message}` }],
              },
            ],
          }),
        });

        if (response.ok) {
          const result = (await response.json()) as any;
          const replyText = result?.candidates?.[0]?.content?.parts?.[0]?.text;
          if (replyText) {
            res.json({
              success: true,
              data: {
                response: replyText,
                source: 'ai_cloud',
              },
            });
            return;
          }
        }
      } catch (externalErr) {
        console.warn('[AI Assistant] Cloud query failed, falling back to local knowledge base:', externalErr);
      }
    }

    // Default to verified local knowledge base
    const localReply = findAnswer(message, lang);
    res.json({
      success: true,
      data: {
        response: localReply,
        source: 'approved_knowledge_base',
      },
    });
  } catch (error) {
    next(error);
  }
};
