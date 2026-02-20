/**
 * TemplateLibrary - Pre-built templates organized by industry
 */

import React, { useState, useEffect } from 'react';
import { XIcon, TemplateIcon } from './Icons';
import { TEMPLATES as ALL_TEMPLATES, getSwissTemplates } from '../templates';

interface Template {
    id: string;
    name: string;
    industry: string;
    description: string;
    prompt: string;
    suggestedStyle?: string;
    previewColor: string;
    isSwiss?: boolean;
}

interface TemplateLibraryProps {
    isOpen: boolean;
    onClose: () => void;
    onSelectTemplate: (prompt: string) => void;
}

const TEMPLATES: Template[] = [
    // Restaurant & Food
    {
        id: 'restaurant-fine',
        name: 'Fine Dining Restaurant',
        industry: 'Restaurant',
        description: 'Elegant landing page for upscale restaurants',
        prompt: 'Elegant fine dining restaurant landing page with reservation system, chef showcase, seasonal menu highlights, and intimate atmosphere photos',
        suggestedStyle: 'Luxury serif with dark backgrounds',
        previewColor: '#1a1a2e'
    },
    {
        id: 'restaurant-casual',
        name: 'Casual Eatery',
        industry: 'Restaurant',
        description: 'Friendly, approachable restaurant page',
        prompt: 'Casual neighborhood restaurant landing page with daily specials, online ordering, friendly team photos, and customer reviews',
        suggestedStyle: 'Warm and inviting',
        previewColor: '#e07a5f'
    },
    {
        id: 'cafe-coffee',
        name: 'Coffee Shop',
        industry: 'Restaurant',
        description: 'Cozy cafe or coffee shop',
        prompt: 'Artisan coffee shop landing page with specialty drinks menu, cozy interior photos, local roasting process, and loyalty program signup',
        suggestedStyle: 'Warm browns and creams',
        previewColor: '#6b4423'
    },
    
    // Professional Services
    {
        id: 'lawyer-corporate',
        name: 'Law Firm',
        industry: 'Legal',
        description: 'Professional legal services page',
        prompt: 'Corporate law firm landing page with practice areas, attorney profiles, case results, client testimonials, and consultation booking',
        suggestedStyle: 'Traditional navy and gold',
        previewColor: '#1e3a5f'
    },
    {
        id: 'accountant-firm',
        name: 'Accounting Firm',
        industry: 'Finance',
        description: 'Tax and accounting services',
        prompt: 'Professional accounting firm landing page with services overview, tax deadlines tracker, client portal login, and free consultation offer',
        suggestedStyle: 'Clean and trustworthy',
        previewColor: '#2d5a27'
    },
    {
        id: 'consulting-business',
        name: 'Business Consulting',
        industry: 'Consulting',
        description: 'Management consulting services',
        prompt: 'Business consulting firm landing page with service offerings, industry expertise, case studies, methodology overview, and contact form',
        suggestedStyle: 'Modern corporate',
        previewColor: '#0f4c75'
    },
    
    // Health & Wellness
    {
        id: 'medical-clinic',
        name: 'Medical Clinic',
        industry: 'Healthcare',
        description: 'Doctor\'s office or clinic',
        prompt: 'Medical clinic landing page with services, doctor profiles, insurance accepted, patient portal, appointment booking, and health resources',
        suggestedStyle: 'Clean and calming',
        previewColor: '#0077b6'
    },
    {
        id: 'dental-practice',
        name: 'Dental Practice',
        industry: 'Healthcare',
        description: 'Family dentistry services',
        prompt: 'Family dental practice landing page with services, smile gallery, new patient forms, insurance info, and easy appointment scheduling',
        suggestedStyle: 'Bright and welcoming',
        previewColor: '#48cae4'
    },
    {
        id: 'fitness-gym',
        name: 'Fitness Studio',
        industry: 'Fitness',
        description: 'Gym or fitness center',
        prompt: 'Fitness studio landing page with class schedules, membership plans, trainer profiles, facility tour, free trial signup, and transformation stories',
        suggestedStyle: 'Energetic and bold',
        previewColor: '#ff6b35'
    },
    {
        id: 'spa-wellness',
        name: 'Spa & Wellness',
        industry: 'Wellness',
        description: 'Relaxation and wellness services',
        prompt: 'Luxury spa landing page with treatment menu, package deals, serene ambiance photos, online booking, and gift card purchasing',
        suggestedStyle: 'Soft and tranquil',
        previewColor: '#9c89b8'
    },
    
    // Real Estate
    {
        id: 'realestate-luxury',
        name: 'Luxury Real Estate',
        industry: 'Real Estate',
        description: 'High-end property listings',
        prompt: 'Luxury real estate agent landing page with featured properties, neighborhood guides, market insights, client testimonials, and property valuation tool',
        suggestedStyle: 'Sophisticated and elegant',
        previewColor: '#2d3436'
    },
    {
        id: 'realestate-residential',
        name: 'Residential Realtor',
        industry: 'Real Estate',
        description: 'Home buying and selling',
        prompt: 'Residential realtor landing page with property search, buyer/seller resources, area expertise, success stories, and free home evaluation',
        suggestedStyle: 'Friendly and trustworthy',
        previewColor: '#00b894'
    },
    
    // Tech & SaaS
    {
        id: 'saas-startup',
        name: 'SaaS Product',
        industry: 'Technology',
        description: 'Software as a service landing',
        prompt: 'SaaS product landing page with feature showcase, pricing tiers, customer logos, integration partners, demo request, and free trial signup',
        suggestedStyle: 'Modern gradient tech',
        previewColor: '#667eea'
    },
    {
        id: 'app-mobile',
        name: 'Mobile App',
        industry: 'Technology',
        description: 'App download page',
        prompt: 'Mobile app landing page with feature highlights, screenshot carousel, user testimonials, app store badges, and waitlist signup',
        suggestedStyle: 'Clean and modern',
        previewColor: '#6c5ce7'
    },
    {
        id: 'agency-digital',
        name: 'Digital Agency',
        industry: 'Technology',
        description: 'Web design and marketing agency',
        prompt: 'Digital agency landing page with services, portfolio showcase, team section, process explanation, client results, and project inquiry form',
        suggestedStyle: 'Creative and bold',
        previewColor: '#e84545'
    },
    
    // Education
    {
        id: 'school-private',
        name: 'Private School',
        industry: 'Education',
        description: 'K-12 educational institution',
        prompt: 'Private school landing page with academic programs, campus tour, admissions process, faculty highlights, student life, and inquiry form',
        suggestedStyle: 'Traditional and prestigious',
        previewColor: '#4a5568'
    },
    {
        id: 'course-online',
        name: 'Online Course',
        industry: 'Education',
        description: 'Educational course or workshop',
        prompt: 'Online course landing page with curriculum overview, instructor bio, student testimonials, course preview, pricing options, and enrollment CTA',
        suggestedStyle: 'Engaging and professional',
        previewColor: '#f59e0b'
    },
    
    // Events & Services
    {
        id: 'wedding-planner',
        name: 'Wedding Planner',
        industry: 'Events',
        description: 'Wedding planning services',
        prompt: 'Wedding planner landing page with service packages, portfolio gallery, planning process, real weddings, testimonials, and consultation booking',
        suggestedStyle: 'Romantic and elegant',
        previewColor: '#d4a5a5'
    },
    {
        id: 'photographer-portfolio',
        name: 'Photographer',
        industry: 'Creative',
        description: 'Photography services portfolio',
        prompt: 'Professional photographer landing page with portfolio gallery, service packages, booking calendar, about story, and contact form',
        suggestedStyle: 'Minimal image-focused',
        previewColor: '#2d3436'
    },
    {
        id: 'contractor-home',
        name: 'Home Contractor',
        industry: 'Construction',
        description: 'Home improvement services',
        prompt: 'Home renovation contractor landing page with services, before/after gallery, project process, customer reviews, and free estimate request',
        suggestedStyle: 'Sturdy and reliable',
        previewColor: '#d35400'
    },

    // NEW: Expanded Industries
    {
        id: 'salon-hair',
        name: 'Hair Salon',
        industry: 'Wellness',
        description: 'Hair styling and beauty services',
        prompt: 'Modern hair salon landing page with services (cuts, color, styling), stylist team, before/after gallery, online booking, loyalty program, and promotions',
        suggestedStyle: 'Chic and stylish',
        previewColor: '#e91e63'
    },
    {
        id: 'salon-nail',
        name: 'Nail Salon',
        industry: 'Wellness',
        description: 'Nail art and manicure services',
        prompt: 'Elegant nail salon landing page with services, nail art gallery, pricing menu, online booking, gift cards, and special event packages',
        suggestedStyle: 'Feminine and clean',
        previewColor: '#f06292'
    },
    {
        id: 'plumber-hvac',
        name: 'Plumber & HVAC',
        industry: 'Services',
        description: 'Plumbing and heating services',
        prompt: 'Professional plumber and HVAC service landing page with 24/7 emergency services, service areas, before/after repairs, customer reviews, online quote request, and service coupons',
        suggestedStyle: 'Trustworthy and reliable',
        previewColor: '#1976d2'
    },
    {
        id: 'dentist-family',
        name: 'Family Dentist',
        industry: 'Healthcare',
        description: 'General dentistry for families',
        prompt: 'Family dental practice landing page with preventive care, cosmetic dentistry, pediatric dentistry, insurance accepted, new patient specials, and easy appointment scheduling',
        suggestedStyle: 'Warm and professional',
        previewColor: '#00acc1'
    },
    {
        id: 'salon-barber',
        name: 'Barber Shop',
        industry: 'Services',
        description: 'Classic barber services for men',
        prompt: 'Traditional barbershop landing page with classic haircuts, beard grooming, hot towel shaves, membership options, walk-ins welcome, and vintage aesthetic',
        suggestedStyle: 'Classic and masculine',
        previewColor: '#455a64'
    },

    // Swiss Market Specific
    {
        id: 'physio-swiss',
        name: 'Physiotherapy Practice',
        industry: 'Healthcare',
        description: 'Physical therapy in Switzerland',
        prompt: 'Swiss physiotherapy practice landing page with treatments, therapist qualifications (Steiner licensed), appointment booking, insurance billing info (KVG/VVG), and location with parking',
        suggestedStyle: 'Professional Swiss healthcare',
        previewColor: '#00897b'
    },
    {
        id: 'immobilienmakler',
        name: 'Real Estate Agent',
        industry: 'Real Estate',
        description: 'Swiss real estate services',
        prompt: 'Swiss real estate agent landing page with property listings, property search, sold properties, agent profile, financing advice, and contact form in German/Swiss German',
        suggestedStyle: 'Premium Swiss real estate',
        previewColor: '#6d4c41'
    }
];

const INDUSTRIES = [...new Set(TEMPLATES.map(t => t.industry))];

export default function TemplateLibrary({ isOpen, onClose, onSelectTemplate }: TemplateLibraryProps) {
    const [selectedIndustry, setSelectedIndustry] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [showSwissOnly, setShowSwissOnly] = useState(false);
    
    const swissTemplates = getSwissTemplates();
    const swissIndustries = [...new Set(swissTemplates.map(t => t.industry))];
    const allIndustries = [...new Set(ALL_TEMPLATES.map(t => t.industry))];
    
    const filteredTemplates = TEMPLATES.filter(t => {
        const matchesSwiss = !showSwissOnly || t.isSwiss;
        const matchesIndustry = !selectedIndustry || t.industry === selectedIndustry;
        const matchesSearch = !searchQuery || 
            t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            t.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
            t.industry.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (t.prompt.toLowerCase().includes('swiss') && searchQuery.toLowerCase().includes('swiss'));
        return matchesSwiss && matchesIndustry && matchesSearch;
    });
    
    const handleSelect = (template: Template) => {
        onSelectTemplate(template.prompt);
        onClose();
    };

    // Handle escape key
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && isOpen) {
                onClose();
            }
        };

        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    return (
        <div className="publish-modal-overlay" onClick={onClose}>
            <div className="publish-modal template-library-modal" onClick={e => e.stopPropagation()} role="dialog" aria-modal="true" aria-labelledby="template-title">
                <div className="publish-modal-header">
                    <h2 id="template-title">
                        <TemplateIcon /> Template Library
                    </h2>
                    <button className="close-button" onClick={onClose} aria-label="Close template library">
                        <XIcon />
                    </button>
                </div>
                
                <div className="template-filters">
                    <input
                        type="text"
                        placeholder="Search templates..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="template-search"
                    />
                    
                    <div className="filter-row">
                        <button 
                            className={`industry-filter ${!showSwissOnly ? 'active' : ''}`}
                            onClick={() => { setShowSwissOnly(false); setSelectedIndustry(null); }}
                        >
                            All
                        </button>
                        <button 
                            className={`industry-filter swiss-filter ${showSwissOnly ? 'active' : ''}`}
                            onClick={() => { setShowSwissOnly(true); setSelectedIndustry(null); }}
                        >
                            🇨🇭 Swiss
                        </button>
                    </div>
                    
                    <div className="industry-filters">
                        <button 
                            className={`industry-filter ${!selectedIndustry ? 'active' : ''}`}
                            onClick={() => setSelectedIndustry(null)}
                        >
                            All
                        </button>
                        {(showSwissOnly ? swissIndustries : allIndustries).map(industry => (
                            <button
                                key={industry}
                                className={`industry-filter ${selectedIndustry === industry ? 'active' : ''}`}
                                onClick={() => setSelectedIndustry(industry)}
                            >
                                {industry}
                            </button>
                        ))}
                    </div>
                </div>
                
                <div className="publish-modal-body template-body">
                    <div className="template-grid">
                        {filteredTemplates.map(template => (
                            <div 
                                key={template.id}
                                className="template-card"
                                onClick={() => handleSelect(template)}
                            >
                                <div 
                                    className="template-preview"
                                    style={{ background: template.previewColor }}
                                >
                                    <div className="template-preview-content">
                                        <div className="preview-nav"></div>
                                        <div className="preview-hero"></div>
                                        <div className="preview-section"></div>
                                    </div>
                                </div>
                                <div className="template-info">
                                    <span className="template-industry">{template.industry}</span>
                                    <h3>{template.name}</h3>
                                    <p>{template.description}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                    
                    {filteredTemplates.length === 0 && (
                        <div className="no-templates">
                            <p>No templates match your search.</p>
                            <button onClick={() => { setSearchQuery(''); setSelectedIndustry(null); }}>
                                Clear filters
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
