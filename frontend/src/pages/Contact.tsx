// src/pages/Contact.tsx
import React, { useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Phone, Mail, MapPin, Send, MessageSquare, Clock, HeartPulse } from 'lucide-react';
import toast from 'react-hot-toast';

export const Contact: React.FC = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    subject: 'General Inquiry',
    message: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      toast.success('Your message has been sent to the Health Camp coordination cell!');
      setFormData({ name: '', email: '', phone: '', subject: 'General Inquiry', message: '' });
    }, 800);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <div>
        <span className="text-xs font-semibold uppercase tracking-wider text-cyan-600 dark:text-cyan-400">
          Reach Us 24/7
        </span>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-slate-100">
          Helpline & Community Support
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-2xl">
          Need assistance finding a camp, registering an elderly relative, or volunteering as medical staff? We are here to support you.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Contact Info (1 Col) */}
        <div className="space-y-4">
          <Card className="p-6 space-y-4 bg-gradient-to-br from-cyan-600 to-blue-700 text-white">
            <h3 className="font-bold text-lg">Emergency Camp Helpline</h3>
            <p className="text-xs text-cyan-100">
              For urgent venue coordinates or special disability assistance at camps:
            </p>
            <div className="space-y-3 pt-2 text-sm">
              <div className="flex items-center gap-3">
                <Phone className="w-4 h-4 text-cyan-300" />
                <span className="font-bold">1800-425-CAMP (2267)</span>
              </div>
              <div className="flex items-center gap-3">
                <Mail className="w-4 h-4 text-cyan-300" />
                <span>support@healthcamp.community</span>
              </div>
              <div className="flex items-center gap-3">
                <Clock className="w-4 h-4 text-cyan-300" />
                <span>Mon – Sun, 07:00 AM – 08:00 PM</span>
              </div>
            </div>
          </Card>

          <Card className="p-6 space-y-3">
            <div className="flex items-center gap-2 text-slate-900 dark:text-slate-100 font-bold text-sm">
              <MapPin className="w-4 h-4 text-cyan-500" />
              <span>State Headquarters</span>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">
              Karnataka State Health Camp Directorate<br />
              Arogya Bhavan, Magadi Road,<br />
              Bengaluru, Karnataka - 560023
            </p>
          </Card>
        </div>

        {/* Inquiry Form (2 Cols) */}
        <div className="lg:col-span-2">
          <Card className="p-6 sm:p-8">
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 mb-4 flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-cyan-500" />
              Send an Inquiry or Request a Camp in Your Village
            </h3>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Your Name *
                  </label>
                  <Input
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g. Anand Kumar"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Phone Number *
                  </label>
                  <Input
                    required
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="9876543210"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Email Address
                </label>
                <Input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="anand@example.com"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Inquiry Topic
                </label>
                <select
                  value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
                >
                  <option value="General Inquiry">General Inquiry</option>
                  <option value="Request a Camp in My Area">Request a Health Camp in My Locality</option>
                  <option value="Doctor Volunteering">Physician / Specialist Volunteer Application</option>
                  <option value="Report / Prescription Issue">Medical Record Access Query</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Your Message / Location Details *
                </label>
                <textarea
                  required
                  rows={4}
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  placeholder="Tell us how we can assist or provide village/taluk details..."
                  className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                />
              </div>

              <Button
                type="submit"
                variant="primary"
                isLoading={isSubmitting}
                leftIcon={<Send className="w-4 h-4" />}
              >
                Send Message
              </Button>
            </form>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Contact;

