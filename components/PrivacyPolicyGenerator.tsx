/**
 * PrivacyPolicyGenerator - Generate GDPR-compliant privacy policies for Swiss/EU businesses
 */

import React, { useState } from 'react';
import { XIcon, ShieldIcon } from './Icons';

interface PrivacyPolicyGeneratorProps {
    isOpen: boolean;
    onClose: () => void;
    onGenerate: (html: string, businessName: string) => void;
}

interface BusinessDetails {
    businessName: string;
    websiteUrl: string;
    email: string;
    phone: string;
    address: string;
    country: 'CH' | 'DE' | 'AT' | 'EU' | 'OTHER';
    hasCookies: boolean;
    hasAnalytics: boolean;
    hasNewsletter: boolean;
    hasContactForm: boolean;
    hasAccount: boolean;
    hasPayment: boolean;
}

const DEFAULT_DETAILS: BusinessDetails = {
    businessName: '',
    websiteUrl: '',
    email: '',
    phone: '',
    address: '',
    country: 'CH',
    hasCookies: true,
    hasAnalytics: true,
    hasNewsletter: false,
    hasContactForm: true,
    hasAccount: false,
    hasPayment: false
};

export default function PrivacyPolicyGenerator({ isOpen, onClose, onGenerate }: PrivacyPolicyGeneratorProps) {
    const [details, setDetails] = useState<BusinessDetails>(DEFAULT_DETAILS);
    const [isGenerating, setIsGenerating] = useState(false);

    const updateField = (field: keyof BusinessDetails, value: string | boolean) => {
        setDetails(prev => ({ ...prev, [field]: value }));
    };

    const generatePrivacyPolicy = async () => {
        if (!details.businessName) {
            alert('Please enter your business name');
            return;
        }

        setIsGenerating(true);

        const today = new Date().toLocaleDateString('de-CH', { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
        });

        // Build data processing sections based on features
        const dataSections: string[] = [];
        
        if (details.hasContactForm) {
            dataSections.push(`
                <h3>Kontaktformular</h3>
                <p>Wenn Sie unser Kontaktformular nutzen, werden die von Ihnen eingegebenen Daten (Name, E-Mail-Adresse, Nachricht) zwecks Bearbeitung Ihrer Anfrage gespeichert. Diese Daten werden nicht an Dritte weitergegeben und nach Bearbeitung Ihrer Anfrage gelöscht.</p>
            `);
        }

        if (details.hasNewsletter) {
            dataSections.push(`
                <h3>Newsletter</h3>
                <p>Für den Newsletter-Versand nutzen wir [Newsletter-Dienst]. Ihre E-Mail-Adresse wird nur für den Newsletter-Versand verwendet. Sie können den Newsletter jederzeit über den Abmeldelink im Footer abbestellen.</p>
            `);
        }

        if (details.hasAccount) {
            dataSections.push(`
                <h3>Kundenkonto</h3>
                <p>Bei der Registrierung eines Kundenkontos speichern wir Ihre Zugangsdaten sowie die im Rahmen der Nutzung angegebenen Informationen. Sie können Ihr Konto jederzeit löschen.</p>
            `);
        }

        if (details.hasPayment) {
            dataSections.push(`
                <h3>Zahlungsabwicklung</h3>
                <p>Die Zahlungsabwicklung erfolgt über [Zahlungsanbieter]. Wir speichern keine Kreditkartendaten. Die Datenschutzerklärung des Zahlungsanbieters gilt zusätzlich.</p>
            `);
        }

        if (details.hasCookies) {
            dataSections.push(`
                <h3>Cookies</h3>
                <p>Unsere Website verwendet Cookies, um die Nutzerfreundlichkeit zu verbessern. Sie können die Cookie-Speicherung in Ihren Browsereinstellungen deaktivieren.</p>
            `);
        }

        if (details.hasAnalytics) {
            dataSections.push(`
                <h3>Google Analytics</h3>
                <p>Wir nutzen Google Analytics zur Analyse der Website-Nutzung. Die Daten werden anonymisiert verarbeitet. Sie können die Erfassung durch ein Browser-Plugin verhindern.</p>
            `);
        }

        const countryText: Record<string, string> = {
            'CH': 'der Schweiz',
            'DE': 'Deutschland',
            'AT': 'Österreich',
            'EU': 'der Europäischen Union',
            'OTHER': 'dem jeweiligen Sitzland'
        };

        const html = `
<!DOCTYPE html>
<html lang="de">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Datenschutzerklärung - ${details.businessName}</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; max-width: 800px; margin: 0 auto; padding: 40px 20px; color: #333; }
        h1 { color: #1a1a2e; border-bottom: 2px solid #4a90d9; padding-bottom: 10px; }
        h2 { color: #2d3748; margin-top: 30px; }
        h3 { color: #4a5568; }
        .last-updated { color: #718096; font-size: 0.9em; }
        a { color: #4a90d9; }
        ul { padding-left: 20px; }
        li { margin-bottom: 8px; }
    </style>
</head>
<body>
    <h1>Datenschutzerklärung</h1>
    <p class="last-updated">Stand: ${today}</p>

    <h2>1. Verantwortlicher</h2>
    <p>
        <strong>${details.businessName}</strong><br>
        ${details.address ? details.address + '<br>' : ''}
        ${details.country === 'CH' ? 'Schweiz' : details.country === 'DE' ? 'Deutschland' : details.country === 'AT' ? 'Österreich' : ''}<br>
        E-Mail: <a href="mailto:${details.email}">${details.email}</a><br>
        ${details.phone ? 'Telefon: ' + details.phone + '<br>' : ''}
        ${details.websiteUrl ? 'Webseite: <a href="' + details.websiteUrl + '">' + details.websiteUrl + '</a>' : ''}
    </p>

    <h2>2. Erhebung und Verarbeitung personenbezogener Daten</h2>
    <p>Wir erheben und verarbeiten personenbezogene Daten nur im Rahmen der gesetzlichen Bestimmungen, insbesondere ${countryText[details.country === 'OTHER' ? 'EU' : details.country]}.</p>
    
    ${dataSections.join('')}

    <h2>3. Datensicherheit</h2>
    <p>Wir treffen angemessene technische und organisatorische Sicherheitsmassnahmen, um Ihre Daten vor unbefugtem Zugriff, Verlust oder Manipulation zu schützen.</p>

    <h2>4. Ihre Rechte</h2>
    <p>Sie haben das Recht auf Auskunft, Berichtigung, Löschung und Übertragung Ihrer personenbezogenen Daten. Zudem können Sie die Verarbeitung einschränken oder widersprechen.</p>
    <ul>
        <li>Auskunftsrecht</li>
        <li>Recht auf Berichtigung</li>
        <li>Recht auf Löschung</li>
        <li>Recht auf Datenübertragbarkeit</li>
        <li>Widerspruchsrecht</li>
    </ul>

    <h2>5. Kontakt</h2>
    <p>Bei Fragen zum Datenschutz wenden Sie sich bitte an: <a href="mailto:${details.email}">${details.email}</a></p>

    <p style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #e2e8f0; font-size: 0.9em; color: #718096;">
        Diese Datenschutzerklärung wurde generiert von ${details.websiteUrl ? details.websiteUrl : details.businessName}.
    </p>
</body>
</html>
        `.trim();

        setIsGenerating(false);
        onGenerate(html, details.businessName);
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="publish-modal-overlay" onClick={onClose}>
            <div className="publish-modal privacy-policy-modal" onClick={e => e.stopPropagation()} role="dialog" aria-modal="true">
                <div className="publish-modal-header">
                    <h2>
                        <ShieldIcon /> Privacy Policy Generator
                    </h2>
                    <button className="close-button" onClick={onClose} aria-label="Close">
                        <XIcon />
                    </button>
                </div>

                <div className="publish-modal-body">
                    <div className="privacy-form">
                        <div className="form-group">
                            <label>Business Name *</label>
                            <input
                                type="text"
                                value={details.businessName}
                                onChange={(e) => updateField('businessName', e.target.value)}
                                placeholder="Your company name"
                            />
                        </div>

                        <div className="form-row">
                            <div className="form-group">
                                <label>Website URL</label>
                                <input
                                    type="url"
                                    value={details.websiteUrl}
                                    onChange={(e) => updateField('websiteUrl', e.target.value)}
                                    placeholder="https://example.com"
                                />
                            </div>
                            <div className="form-group">
                                <label>Country</label>
                                <select
                                    value={details.country}
                                    onChange={(e) => updateField('country', e.target.value)}
                                >
                                    <option value="CH">Switzerland</option>
                                    <option value="DE">Germany</option>
                                    <option value="AT">Austria</option>
                                    <option value="EU">EU</option>
                                    <option value="OTHER">Other</option>
                                </select>
                            </div>
                        </div>

                        <div className="form-row">
                            <div className="form-group">
                                <label>Email</label>
                                <input
                                    type="email"
                                    value={details.email}
                                    onChange={(e) => updateField('email', e.target.value)}
                                    placeholder="hello@company.ch"
                                />
                            </div>
                            <div className="form-group">
                                <label>Phone</label>
                                <input
                                    type="tel"
                                    value={details.phone}
                                    onChange={(e) => updateField('phone', e.target.value)}
                                    placeholder="+41 00 000 00 00"
                                />
                            </div>
                        </div>

                        <div className="form-group">
                            <label>Address</label>
                            <input
                                type="text"
                                value={details.address}
                                onChange={(e) => updateField('address', e.target.value)}
                                placeholder="Street, City, Switzerland"
                            />
                        </div>

                        <div className="form-group">
                            <label>Features Used</label>
                            <div className="checkbox-group">
                                <label className="checkbox-label">
                                    <input
                                        type="checkbox"
                                        checked={details.hasContactForm}
                                        onChange={(e) => updateField('hasContactForm', e.target.checked)}
                                    />
                                    Contact Form
                                </label>
                                <label className="checkbox-label">
                                    <input
                                        type="checkbox"
                                        checked={details.hasCookies}
                                        onChange={(e) => updateField('hasCookies', e.target.checked)}
                                    />
                                    Cookies
                                </label>
                                <label className="checkbox-label">
                                    <input
                                        type="checkbox"
                                        checked={details.hasAnalytics}
                                        onChange={(e) => updateField('hasAnalytics', e.target.checked)}
                                    />
                                    Google Analytics
                                </label>
                                <label className="checkbox-label">
                                    <input
                                        type="checkbox"
                                        checked={details.hasNewsletter}
                                        onChange={(e) => updateField('hasNewsletter', e.target.checked)}
                                    />
                                    Newsletter
                                </label>
                                <label className="checkbox-label">
                                    <input
                                        type="checkbox"
                                        checked={details.hasAccount}
                                        onChange={(e) => updateField('hasAccount', e.target.checked)}
                                    />
                                    User Accounts
                                </label>
                                <label className="checkbox-label">
                                    <input
                                        type="checkbox"
                                        checked={details.hasPayment}
                                        onChange={(e) => updateField('hasPayment', e.target.checked)}
                                    />
                                    Payment Processing
                                </label>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="publish-modal-footer">
                    <button className="btn-secondary" onClick={onClose}>
                        Cancel
                    </button>
                    <button 
                        className="btn-primary" 
                        onClick={generatePrivacyPolicy}
                        disabled={isGenerating || !details.businessName}
                    >
                        {isGenerating ? 'Generating...' : 'Generate Privacy Policy'}
                    </button>
                </div>
            </div>
        </div>
    );
}
