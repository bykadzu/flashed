/**
 * AnalyticsDashboard - View analytics for published pages
 */

import React, { useState, useEffect } from 'react';
import type { Artifact } from '../types';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { XIcon, ChartIcon, GlobeIcon } from './Icons';

interface AnalyticsData {
    totalViews: number;
    uniqueVisitors: number;
    formSubmissions: number;
    viewsByDay: { date: string; views: number }[];
    topReferrers: { referrer: string; count: number }[];
    recentSubmissions: { id: string; timestamp: number; data: Record<string, string> }[];
}

interface AnalyticsDashboardProps {
    isOpen: boolean;
    onClose: () => void;
    artifact: Artifact;
}

// Generate mock data for demo when Supabase isn't configured
const generateMockData = (): AnalyticsData => {
    const today = new Date();
    const viewsByDay = Array.from({ length: 7 }, (_, i) => {
        const date = new Date(today);
        date.setDate(date.getDate() - (6 - i));
        return {
            date: date.toLocaleDateString('en-US', { weekday: 'short' }),
            views: Math.floor(Math.random() * 50) + 10
        };
    });
    
    return {
        totalViews: viewsByDay.reduce((sum, d) => sum + d.views, 0),
        uniqueVisitors: Math.floor(viewsByDay.reduce((sum, d) => sum + d.views, 0) * 0.7),
        formSubmissions: Math.floor(Math.random() * 15) + 3,
        viewsByDay,
        topReferrers: [
            { referrer: 'google.com', count: Math.floor(Math.random() * 30) + 10 },
            { referrer: 'linkedin.com', count: Math.floor(Math.random() * 20) + 5 },
            { referrer: 'twitter.com', count: Math.floor(Math.random() * 15) + 3 },
            { referrer: 'direct', count: Math.floor(Math.random() * 25) + 8 },
        ],
        recentSubmissions: [
            { id: '1', timestamp: Date.now() - 3600000, data: { name: 'John Doe', email: 'john@example.com', message: 'Interested in your services' } },
            { id: '2', timestamp: Date.now() - 86400000, data: { name: 'Jane Smith', email: 'jane@company.com', message: 'Can we schedule a call?' } },
        ]
    };
};

export default function AnalyticsDashboard({ isOpen, onClose, artifact }: AnalyticsDashboardProps) {
    const [data, setData] = useState<AnalyticsData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'overview' | 'submissions'>('overview');
    
    useEffect(() => {
        if (isOpen) {
            loadAnalytics();
        }
    }, [isOpen, artifact.publishInfo?.shortId]);
    
    const loadAnalytics = async () => {
        setIsLoading(true);
        
        if (!isSupabaseConfigured() || !artifact.publishInfo?.shortId) {
            // Use mock data for demo
            setTimeout(() => {
                setData(generateMockData());
                setIsLoading(false);
            }, 500);
            return;
        }
        
        try {
            const shortId = artifact.publishInfo.shortId;
            
            // Fetch page views
            const { data: pageViews } = await supabase!
                .from('page_views')
                .select('*')
                .eq('short_id', shortId)
                .gte('timestamp', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());
            
            // Fetch form submissions
            const { data: submissions } = await supabase!
                .from('form_submissions')
                .select('*')
                .eq('short_id', shortId)
                .order('created_at', { ascending: false })
                .limit(10);
            
            // Process data
            const viewsByDay: Record<string, number> = {};
            const referrerCounts: Record<string, number> = {};
            
            (pageViews || []).forEach(view => {
                const date = new Date(view.timestamp).toLocaleDateString('en-US', { weekday: 'short' });
                viewsByDay[date] = (viewsByDay[date] || 0) + 1;
                
                const referrer = view.referrer ? new URL(view.referrer).hostname : 'direct';
                referrerCounts[referrer] = (referrerCounts[referrer] || 0) + 1;
            });
            
            setData({
                totalViews: (pageViews || []).length,
                uniqueVisitors: new Set((pageViews || []).map(v => v.ip_hash)).size,
                formSubmissions: (submissions || []).length,
                viewsByDay: Object.entries(viewsByDay).map(([date, views]) => ({ date, views })),
                topReferrers: Object.entries(referrerCounts)
                    .map(([referrer, count]) => ({ referrer, count }))
                    .sort((a, b) => b.count - a.count)
                    .slice(0, 5),
                recentSubmissions: (submissions || []).map(s => ({
                    id: s.id,
                    timestamp: new Date(s.created_at).getTime(),
                    data: s.data
                }))
            });
        } catch (error) {
            console.error('Error loading analytics:', error);
            setData(generateMockData());
        } finally {
            setIsLoading(false);
        }
    };
    
    if (!isOpen) return null;
    
    const maxViews = data ? Math.max(...data.viewsByDay.map(d => d.views), 1) : 1;
    
    return (
        <div className="publish-modal-overlay" onClick={onClose}>
            <div className="publish-modal analytics-modal" onClick={e => e.stopPropagation()}>
                <div className="publish-modal-header">
                    <h2>
                        <ChartIcon /> Analytics
                    </h2>
                    <button className="close-button" onClick={onClose}>
                        <XIcon />
                    </button>
                </div>
                
                {artifact.publishInfo ? (
                    <>
                        <div className="analytics-url">
                            <GlobeIcon />
                            <span>{artifact.publishInfo.url}</span>
                        </div>
                        
                        <div className="analytics-tabs">
                            <button 
                                className={`analytics-tab ${activeTab === 'overview' ? 'active' : ''}`}
                                onClick={() => setActiveTab('overview')}
                            >
                                Overview
                            </button>
                            <button 
                                className={`analytics-tab ${activeTab === 'submissions' ? 'active' : ''}`}
                                onClick={() => setActiveTab('submissions')}
                            >
                                Form Submissions
                            </button>
                        </div>
                        
                        <div className="publish-modal-body">
                            {isLoading ? (
                                <div className="analytics-loading">
                                    <div className="loading-spinner"></div>
                                    <p>Loading analytics...</p>
                                </div>
                            ) : data && activeTab === 'overview' ? (
                                <div className="analytics-content">
                                    {/* Stats Cards */}
                                    <div className="stats-grid">
                                        <div className="stat-card">
                                            <div className="stat-value">{data.totalViews}</div>
                                            <div className="stat-label">Total Views</div>
                                        </div>
                                        <div className="stat-card">
                                            <div className="stat-value">{data.uniqueVisitors}</div>
                                            <div className="stat-label">Unique Visitors</div>
                                        </div>
                                        <div className="stat-card">
                                            <div className="stat-value">{data.formSubmissions}</div>
                                            <div className="stat-label">Form Submissions</div>
                                        </div>
                                    </div>
                                    
                                    {/* Views Chart */}
                                    <div className="chart-section">
                                        <h3>Views (Last 7 Days)</h3>
                                        <div className="bar-chart">
                                            {data.viewsByDay.map((day, i) => (
                                                <div key={i} className="bar-container">
                                                    <div 
                                                        className="bar"
                                                        style={{ height: `${(day.views / maxViews) * 100}%` }}
                                                    >
                                                        <span className="bar-value">{day.views}</span>
                                                    </div>
                                                    <span className="bar-label">{day.date}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                    
                                    {/* Top Referrers */}
                                    <div className="referrers-section">
                                        <h3>Top Referrers</h3>
                                        <div className="referrers-list">
                                            {data.topReferrers.map((ref, i) => (
                                                <div key={i} className="referrer-item">
                                                    <span className="referrer-name">{ref.referrer}</span>
                                                    <span className="referrer-count">{ref.count}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                    
                                    {!isSupabaseConfigured() && (
                                        <div className="demo-notice">
                                            <strong>Demo Mode:</strong> This is sample data. Connect Supabase to see real analytics.
                                        </div>
                                    )}
                                </div>
                            ) : data && activeTab === 'submissions' ? (
                                <div className="submissions-content">
                                    {data.recentSubmissions.length > 0 ? (
                                        <div className="submissions-list">
                                            {data.recentSubmissions.map(sub => (
                                                <div key={sub.id} className="submission-card">
                                                    <div className="submission-time">
                                                        {new Date(sub.timestamp).toLocaleString()}
                                                    </div>
                                                    <div className="submission-data">
                                                        {Object.entries(sub.data).map(([key, value]) => (
                                                            <div key={key} className="submission-field">
                                                                <span className="field-key">{key}:</span>
                                                                <span className="field-value">{value}</span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="no-submissions">
                                            <p>No form submissions yet.</p>
                                            <span>Submissions will appear here once visitors fill out forms on your page.</span>
                                        </div>
                                    )}
                                </div>
                            ) : null}
                        </div>
                    </>
                ) : (
                    <div className="publish-modal-body">
                        <div className="not-published">
                            <p>This page hasn't been published yet.</p>
                            <span>Publish your page to start tracking analytics.</span>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
