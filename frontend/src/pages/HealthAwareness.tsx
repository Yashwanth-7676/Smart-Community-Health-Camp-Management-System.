// src/pages/HealthAwareness.tsx
import React, { useState } from 'react';
import { HealthTipCard, HealthTip } from '@/components/common/HealthTipCard';
import { SearchBar } from '@/components/common/SearchBar';
import { HeartPulse, Sparkles, BookOpen, ShieldAlert } from 'lucide-react';

const TIPS_DATA: HealthTip[] = [
  {
    id: 'tip-1',
    category: 'Hygiene & Water',
    titleEn: 'Boil Drinking Water Before Consumption',
    titleKn: 'ಕುಡಿಯುವ ನೀರನ್ನು ಕುದಿಸಿ ಆರಿಸಿ ಕುಡಿಯಿರಿ',
    descEn: 'Boiling water for at least 1-3 minutes destroys water-borne bacteria, parasites, and amoebic cysts, preventing gastrointestinal infections during monsoon.',
    descKn: 'ನೀರನ್ನು ಕನಿಷ್ಠ ೧-೩ ನಿಮಿಷಗಳ ಕಾಲ ಕುದಿಸುವುದರಿಂದ ರೋಗಾಣುಗಳು ನಾಶವಾಗುತ್ತವೆ ಮತ್ತು ಕಾಲರಾ, ಜ್ವರದಂತಹ ಕಾಯಿಲೆಗಳನ್ನು ತಡೆಗಟ್ಟಬಹುದು.',
  },
  {
    id: 'tip-2',
    category: 'Diabetes & Nutrition',
    titleEn: 'Manage Blood Sugar With Fiber-Rich Grains (Millets/Ragi)',
    titleKn: 'ಸಿರಿಧಾನ್ಯ ಮತ್ತು ರಾಗಿಯ ಮೂಲಕ ಮಧುಮೇಹ ನಿಯಂತ್ರಣ',
    descEn: 'Incorporate ragi, foxtail millet, and whole grains into daily diets. Their low glycemic index ensures gradual glucose absorption and supports cardiac health.',
    descKn: 'ರಾಗಿ ಮತ್ತು ನವಣೆ ಸಿರಿಧಾನ್ಯಗಳು ರಕ್ತದಲ್ಲಿ ಸಕ್ಕರೆಯ ಮಟ್ಟವನ್ನು ಹತೋಟಿಯಲ್ಲಿಡಲು ಸಹಾಯಕವಾಗಿವೆ.',
  },
  {
    id: 'tip-3',
    category: 'Hypertension',
    titleEn: 'Reduce Sodium & Salt Intake Daily',
    titleKn: 'ದೈನಂದಿನ ಉಪ್ಪಿನ ಪ್ರಮಾಣವನ್ನು ಕಡಿಮೆ ಮಾಡಿ',
    descEn: 'Limiting sodium to less than 5 grams per day significantly lowers systolic blood pressure and decreases the risk of stroke and cardiovascular disease.',
    descKn: 'ದಿನಕ್ಕೆ ೫ ಗ್ರಾಂ ಗಿಂತ ಕಡಿಮೆ ಉಪ್ಪನ್ನು ಸೇವಿಸುವುದರಿಂದ ರಕ್ತದೊತ್ತಡ ನಿಯಂತ್ರಣದಲ್ಲಿರುತ್ತದೆ.',
  },
  {
    id: 'tip-4',
    category: 'Eye Care',
    titleEn: 'Early Screening for Cataracts & Glaucoma',
    titleKn: 'ಕಣ್ಣಿನ ಪೊರೆ ಮತ್ತು ಗ್ಲುಕೋಮಾ ತಪಾಸಣೆ',
    descEn: 'Adults above 45 should have annual vision checks. Early identification of cataracts allows timely, free surgical remediation at our district camps.',
    descKn: '೪೫ ವರ್ಷ ಮೇಲ್ಪಟ್ಟವರು ವಾರ್ಷಿಕ ಕಣ್ಣಿನ ತಪಾಸಣೆ ಮಾಡಿಸಿಕೊಳ್ಳಬೇಕು. ಆರಂಭಿಕ ಹಂತದಲ್ಲೇ ಚಿಕಿತ್ಸೆ ಪಡೆಯಬಹುದು.',
  },
  {
    id: 'tip-5',
    category: 'Child Health',
    titleEn: 'Complete Timely Immunization Schedule',
    titleKn: 'ಮಕ್ಕಳಿಗೆ ಸಮಯಕ್ಕೆ ಸರಿಯಾಗಿ ಲಸಿಕೆಗಳನ್ನು ಕೊಡಿಸಿ',
    descEn: 'Follow the universal immunization schedule for infants, protecting against tuberculosis, polio, measles, and hepatitis B.',
    descKn: 'ಮಕ್ಕಳಿಗೆ ಪೋಲಿಯೋ, ದಡಾರ ಮುಂತಾದ ಲಸಿಕೆಗಳನ್ನು ತಪ್ಪದೇ ಕೊಡಿಸಿ ಆರೋಗ್ಯವಂತರನ್ನಾಗಿ ಮಾಡಿ.',
  },
  {
    id: 'tip-6',
    category: 'Mental Wellness',
    titleEn: 'Daily Movement & Stress Relief',
    titleKn: 'ದೈನಂದಿನ ನಡಿಗೆ ಮತ್ತು ಮಾನಸಿಕ ಶಾಂತಿ',
    descEn: '30 minutes of brisk walking in natural morning light improves mood, regulates circadian rhythms, and enhances joint flexibility.',
    descKn: 'ಪ್ರತಿದಿನ ಬೆಳಿಗ್ಗೆ ೩೦ ನಿಮಿಷಗಳ ನಡಿಗೆ ಮಾನಸಿಕ ಒತ್ತಡವನ್ನು ಕಡಿಮೆ ಮಾಡುತ್ತದೆ.',
  },
];

export const HealthAwareness: React.FC = () => {
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');

  const categories = ['ALL', 'Hygiene & Water', 'Diabetes & Nutrition', 'Hypertension', 'Eye Care', 'Child Health', 'Mental Wellness'];

  const filtered = TIPS_DATA.filter((tip) => {
    const matchesCategory = selectedCategory === 'ALL' || tip.category === selectedCategory;
    const matchesSearch =
      tip.titleEn.toLowerCase().includes(search.toLowerCase()) ||
      tip.titleKn.includes(search) ||
      tip.descEn.toLowerCase().includes(search.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Hero Banner */}
      <div className="p-8 rounded-3xl bg-gradient-to-r from-teal-700 via-cyan-800 to-blue-900 text-white shadow-xl relative overflow-hidden">
        <div className="max-w-2xl relative z-10 space-y-3">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-400/20 text-cyan-200 text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5" /> Community Health Awareness / ಆರೋಗ್ಯ ಅರಿವು
          </span>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
            Preventive Healthcare Guidelines & Daily Tips
          </h1>
          <p className="text-sm text-cyan-100 leading-relaxed">
            Essential lifestyle, nutrition, and disease prevention knowledge authored by our field doctors. Available in both English and Kannada.
          </p>
        </div>
      </div>

      {/* Filter and Search */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <SearchBar
          value={search}
          onSearch={setSearch}
          placeholder="Search topics (e.g., blood pressure, water, nutrition)..."
          className="max-w-md"
        />

        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-2 sm:pb-0">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors ${
                selectedCategory === cat
                  ? 'bg-cyan-600 text-white shadow-sm'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Tips Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filtered.map((tip) => (
          <HealthTipCard key={tip.id} tip={tip} />
        ))}
      </div>
    </div>
  );
};

export default HealthAwareness;

