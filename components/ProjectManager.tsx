/**
 * ProjectManager - Manage client projects
 */

import React, { useState, useEffect } from 'react';
import type { Project, BrandKit } from '../types';
import { generateId } from '../utils';
import { XIcon, FolderIcon } from './Icons';

interface ProjectManagerProps {
    isOpen: boolean;
    onClose: () => void;
    projects: Project[];
    currentProject: Project | null;
    brandKits: BrandKit[];
    onSaveProject: (project: Project) => void;
    onDeleteProject: (id: string) => void;
    onSelectProject: (project: Project | null) => void;
}

export default function ProjectManager({
    isOpen,
    onClose,
    projects,
    currentProject,
    brandKits,
    onSaveProject,
    onDeleteProject,
    onSelectProject
}: ProjectManagerProps) {
    const [mode, setMode] = useState<'list' | 'edit'>('list');
    const [editingProject, setEditingProject] = useState<Project | null>(null);
    
    // Form state
    const [name, setName] = useState('');
    const [clientName, setClientName] = useState('');
    const [selectedBrandKitId, setSelectedBrandKitId] = useState<string | null>(null);
    
    useEffect(() => {
        if (isOpen) {
            setMode('list');
            setEditingProject(null);
        }
    }, [isOpen]);
    
    useEffect(() => {
        if (editingProject) {
            setName(editingProject.name);
            setClientName(editingProject.clientName || '');
            setSelectedBrandKitId(editingProject.brandKit?.id || null);
        } else {
            setName('');
            setClientName('');
            setSelectedBrandKitId(null);
        }
    }, [editingProject]);
    
    const handleSave = () => {
        if (!name.trim()) return;
        
        const selectedBrandKit = brandKits.find(bk => bk.id === selectedBrandKitId);
        
        const project: Project = {
            id: editingProject?.id || generateId(),
            name: name.trim(),
            clientName: clientName.trim() || undefined,
            brandKit: selectedBrandKit,
            createdAt: editingProject?.createdAt || Date.now(),
            updatedAt: Date.now()
        };
        
        onSaveProject(project);
        setMode('list');
        setEditingProject(null);
    };
    
    const handleDelete = () => {
        if (editingProject && confirm(`Delete project "${editingProject.name}"? This won't delete the generated pages.`)) {
            onDeleteProject(editingProject.id);
            setMode('list');
            setEditingProject(null);
        }
    };
    
    const startEdit = (project?: Project) => {
        setEditingProject(project || null);
        setMode('edit');
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
            <div className="publish-modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '500px' }} role="dialog" aria-modal="true" aria-labelledby="projects-title">
                <div className="publish-modal-header">
                    <h2 id="projects-title">
                        {mode === 'list' ? 'Projects' : (editingProject ? 'Edit Project' : 'New Project')}
                    </h2>
                    <button className="close-button" onClick={onClose} aria-label="Close projects">
                        <XIcon />
                    </button>
                </div>
                
                <div className="publish-modal-body">
                    {mode === 'list' ? (
                        <div className="projects-list">
                            {/* Current project indicator */}
                            {currentProject && (
                                <div className="current-project-banner">
                                    <span>Working on:</span>
                                    <strong>{currentProject.name}</strong>
                                    <button onClick={() => onSelectProject(null)}>Clear</button>
                                </div>
                            )}
                            
                            {projects.length === 0 ? (
                                <div className="empty-projects">
                                    <FolderIcon />
                                    <p>No projects yet</p>
                                    <span>Create a project to organize your client work</span>
                                </div>
                            ) : (
                                <div className="project-cards">
                                    {projects.map(project => (
                                        <div 
                                            key={project.id} 
                                            className={`project-card ${currentProject?.id === project.id ? 'active' : ''}`}
                                            onClick={() => onSelectProject(project)}
                                        >
                                            <div className="project-card-header">
                                                <h3>{project.name}</h3>
                                                <button 
                                                    className="edit-btn"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        startEdit(project);
                                                    }}
                                                >
                                                    Edit
                                                </button>
                                            </div>
                                            {project.clientName && (
                                                <p className="project-client">{project.clientName}</p>
                                            )}
                                            {project.brandKit && (
                                                <div className="project-brand-kit">
                                                    <span className="color-dot" style={{ background: project.brandKit.primaryColor }}></span>
                                                    <span className="color-dot" style={{ background: project.brandKit.secondaryColor }}></span>
                                                    <span className="color-dot" style={{ background: project.brandKit.accentColor }}></span>
                                                    <span>{project.brandKit.name}</span>
                                                </div>
                                            )}
                                            <div className="project-date">
                                                Created {new Date(project.createdAt).toLocaleDateString()}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                            
                            <button className="create-project-btn" onClick={() => startEdit()}>
                                + New Project
                            </button>
                        </div>
                    ) : (
                        <div className="project-form">
                            <div className="form-group">
                                <label>Project Name</label>
                                <input
                                    type="text"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    placeholder="e.g., Website Redesign"
                                />
                            </div>
                            
                            <div className="form-group">
                                <label>Client Name (optional)</label>
                                <input
                                    type="text"
                                    value={clientName}
                                    onChange={(e) => setClientName(e.target.value)}
                                    placeholder="e.g., Acme Corporation"
                                />
                            </div>
                            
                            <div className="form-group">
                                <label>Brand Kit (optional)</label>
                                <select
                                    value={selectedBrandKitId || ''}
                                    onChange={(e) => setSelectedBrandKitId(e.target.value || null)}
                                    className="font-select"
                                >
                                    <option value="">No brand kit</option>
                                    {brandKits.map(bk => (
                                        <option key={bk.id} value={bk.id}>
                                            {bk.name}
                                        </option>
                                    ))}
                                </select>
                                <span className="helper-text">
                                    Associate a brand kit to automatically use it for generations in this project
                                </span>
                            </div>
                        </div>
                    )}
                </div>
                
                {mode === 'edit' && (
                    <div className="publish-modal-footer" style={{ justifyContent: 'space-between' }}>
                        {editingProject ? (
                            <button className="delete-btn" onClick={handleDelete}>
                                Delete
                            </button>
                        ) : (
                            <button className="next-btn" onClick={() => setMode('list')}>
                                Back
                            </button>
                        )}
                        <button 
                            className="next-btn" 
                            onClick={handleSave}
                            disabled={!name.trim()}
                            style={{ 
                                background: name.trim() ? '#fff' : 'rgba(255,255,255,0.1)',
                                color: name.trim() ? '#000' : 'var(--text-secondary)'
                            }}
                        >
                            {editingProject ? 'Save Changes' : 'Create Project'}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
