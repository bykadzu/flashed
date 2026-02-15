
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

//Vibe coded by ammaar@google.com

import { createOpenRouterClient, DEFAULT_MODEL, getStoredModel, setStoredModel, ModelId } from './lib/openrouter';
import { getApiKey, validateEnv, ENV } from './lib/env';
import React, { useState, useCallback, useEffect, useRef } from 'react';
import ReactDOM from 'react-dom/client';
import { ClerkProvider, SignedIn, SignedOut, SignInButton, UserButton } from '@clerk/clerk-react';
import { useAuth } from './lib/useAuth';

import { Artifact, Session, ComponentVariation, LayoutOption, BrandKit, Project, Site, SitePage, HTMLItem } from './types';
import {
    INITIAL_PLACEHOLDERS,
    FOCUS_DELAY,
    PLACEHOLDER_FETCH_DELAY,
    PLACEHOLDER_CYCLE_INTERVAL,
    HTML_PREVIEW_MAX_LENGTH,
    MOBILE_BREAKPOINT,
    GENERATION_BATCH_SIZE,
    VARIANT_OPTIONS,
    STYLE_FALLBACKS
} from './constants';
import { generateId, parseDataUrl } from './utils';

import DottedGlowBackground from './components/DottedGlowBackground';
import ArtifactCard from './components/ArtifactCard';
import SideDrawer from './components/SideDrawer';
import ImageCropper from './components/ImageCropper';
import {
    ThinkingIcon,
    CodeIcon,
    SparklesIcon,
    ArrowLeftIcon,
    ArrowRightIcon,
    ArrowUpIcon,
    GridIcon,
    LinkIcon,
    UploadIcon,
    XIcon,
    HistoryIcon,
    DownloadIcon,
    PublishIcon,
    GlobeIcon,
    ShareIcon,
    PaletteIcon,
    FolderIcon,
    CloneIcon,
    TemplateIcon,
    ChartIcon,
    SettingsIcon,
    HomeIcon,
    LayersIcon,
    BookmarkIcon
} from './components/Icons';
import PublishModal from './components/PublishModal';
import ShareModal from './components/ShareModal';
import RefineInput from './components/RefineInput';
import BrandKitEditor from './components/BrandKitEditor';
import ProjectManager from './components/ProjectManager';
import TemplateLibrary from './components/TemplateLibrary';
import AnalyticsDashboard from './components/AnalyticsDashboard';
import Settings from './components/Settings';
import Sidebar from './components/Sidebar';
import HTMLLibrary from './components/HTMLLibrary';
import Toast, { useToast } from './components/Toast';
import * as htmlLibrary from './lib/htmlLibrary';
import JSZip from 'jszip';

function App() {
  // Get current user (safe hook that works with or without Clerk)
  const { user } = useAuth();
  const userId = user?.id;

  // Toast notifications
  const { toasts, dismissToast, showSuccess, showError, showWarning } = useToast();

  const [sessions, setSessions] = useState<Session[]>([]);
  const [currentSessionIndex, setCurrentSessionIndex] = useState<number>(-1);
  const [focusedArtifactIndex, setFocusedArtifactIndex] = useState<number | null>(null);
  
  const [inputValue, setInputValue] = useState<string>('');
  const [urlValue, setUrlValue] = useState<string>('');
  const [showUrlInput, setShowUrlInput] = useState<boolean>(false);
  
  // Image State
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [imageToEdit, setImageToEdit] = useState<string | null>(null);
  const [editMode, setEditMode] = useState<'context' | 'replacement' | null>(null);

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [placeholderIndex, setPlaceholderIndex] = useState(0);
  const [placeholders, setPlaceholders] = useState<string[]>(INITIAL_PLACEHOLDERS);
  
  const [drawerState, setDrawerState] = useState<{
      isOpen: boolean;
      mode: 'code' | 'variations' | 'history' | null;
      title: string;
      data: any; 
  }>({ isOpen: false, mode: null, title: '', data: null });

  const [componentVariations, setComponentVariations] = useState<ComponentVariation[]>([]);

  // Publish Modal State
  const [isPublishModalOpen, setIsPublishModalOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  
  // Refinement State
  const [isRefining, setIsRefining] = useState(false);
  
  // Clone Mode State
  const [cloneMode, setCloneMode] = useState(false);
  
  // Site Mode State
  const [siteMode, setSiteMode] = useState(false);
  const [pageStructure, setPageStructure] = useState<string>('');
  const [currentSitePageId, setCurrentSitePageId] = useState<string>('');
  
  // Template Library State
  const [isTemplateLibraryOpen, setIsTemplateLibraryOpen] = useState(false);
  
  // Analytics State
  const [isAnalyticsOpen, setIsAnalyticsOpen] = useState(false);
  
  // Brand Kit State
  const [brandKits, setBrandKits] = useState<BrandKit[]>([]);
  const [selectedBrandKit, setSelectedBrandKit] = useState<BrandKit | null>(null);
  const [isBrandKitEditorOpen, setIsBrandKitEditorOpen] = useState(false);
  const [editingBrandKit, setEditingBrandKit] = useState<BrandKit | null>(null);
  const [showBrandKitDropdown, setShowBrandKitDropdown] = useState(false);
  
  // Project State
  const [projects, setProjects] = useState<Project[]>([]);
  const [currentProject, setCurrentProject] = useState<Project | null>(null);
  const [isProjectManagerOpen, setIsProjectManagerOpen] = useState(false);

  // Variant Count State
  const [variantCount, setVariantCount] = useState<3 | 5 | 10>(3);

  // HTML Library State
  const [isLibraryOpen, setIsLibraryOpen] = useState(false);

  // Settings State
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [selectedModel, setSelectedModel] = useState<ModelId>(getStoredModel());

  const handleModelChange = (modelId: ModelId) => {
    setSelectedModel(modelId);
    setStoredModel(modelId);
  };

  // Image Replacement State
  const [pendingImageReplacement, setPendingImageReplacement] = useState<{artifactId: string, imgId: string} | null>(null);
  const replaceInputRef = useRef<HTMLInputElement>(null);

  const inputRef = useRef<HTMLInputElement>(null);
  const urlInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const gridScrollRef = useRef<HTMLDivElement>(null);

  // Load from LocalStorage
  useEffect(() => {
      try {
          const saved = localStorage.getItem('flash_ui_sessions');
          if (saved) {
              const parsed = JSON.parse(saved);
              if (Array.isArray(parsed) && parsed.length > 0) {
                  setSessions(parsed);
                  setCurrentSessionIndex(parsed.length - 1);
              }
          }
          
          // Load brand kits
          const savedBrandKits = localStorage.getItem('flash_ui_brand_kits');
          if (savedBrandKits) {
              const parsed = JSON.parse(savedBrandKits);
              if (Array.isArray(parsed)) {
                  setBrandKits(parsed);
              }
          }
          
          // Load projects
          const savedProjects = localStorage.getItem('flash_ui_projects');
          if (savedProjects) {
              const parsed = JSON.parse(savedProjects);
              if (Array.isArray(parsed)) {
                  setProjects(parsed);
              }
          }
      } catch (e) {
          console.warn("Failed to load sessions", e);
      }
  }, []);

  // Save to LocalStorage
  useEffect(() => {
      if (sessions.length > 0) {
          try {
              // Limit to last 10 to avoid quota issues
              const toSave = sessions.slice(-10);
              localStorage.setItem('flash_ui_sessions', JSON.stringify(toSave));
          } catch (e) {
              console.warn("Failed to save sessions (quota exceeded?)", e);
          }
      }
  }, [sessions]);

  // Save brand kits to LocalStorage
  useEffect(() => {
      try {
          localStorage.setItem('flash_ui_brand_kits', JSON.stringify(brandKits));
      } catch (e) {
          console.warn("Failed to save brand kits", e);
      }
  }, [brandKits]);

  // Save projects to LocalStorage
  useEffect(() => {
      try {
          localStorage.setItem('flash_ui_projects', JSON.stringify(projects));
      } catch (e) {
          console.warn("Failed to save projects", e);
      }
  }, [projects]);

  // Handle Image Click and Site Navigation Messages from Iframe
  useEffect(() => {
      const handleMessage = (event: MessageEvent) => {
          if (event.data && event.data.type === 'IMAGE_CLICK') {
              const { artifactId, imgId } = event.data;
              setPendingImageReplacement({ artifactId, imgId });
              replaceInputRef.current?.click();
          }
          
          // Handle site internal navigation
          if (event.data && event.data.type === 'SITE_NAVIGATE') {
              const { pageId } = event.data;
              setCurrentSitePageId(pageId);
          }
      };
      
      window.addEventListener('message', handleMessage);
      return () => window.removeEventListener('message', handleMessage);
  }, []);

  const handleReplacementImageSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (file && pendingImageReplacement) {
          const reader = new FileReader();
          reader.onloadend = () => {
              const base64 = reader.result as string;
              setImageToEdit(base64);
              setEditMode('replacement');
          };
          reader.readAsDataURL(file);
      }
      // Reset input
      if (replaceInputRef.current) replaceInputRef.current.value = '';
  };

  const handleContextImageSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (file) {
          const reader = new FileReader();
          reader.onloadend = () => {
              const base64 = reader.result as string;
              setImageToEdit(base64);
              setEditMode('context');
          };
          reader.readAsDataURL(file);
      }
      if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const onCropComplete = (croppedBase64: string) => {
      if (editMode === 'context') {
          setSelectedImage(croppedBase64);
      } else if (editMode === 'replacement' && pendingImageReplacement) {
          // Send back to the specific iframe
          const iframeId = `iframe-${pendingImageReplacement.artifactId}`;
          const iframe = document.getElementById(iframeId) as HTMLIFrameElement;
          
          if (iframe && iframe.contentWindow) {
              iframe.contentWindow.postMessage({
                  type: 'UPDATE_IMAGE',
                  imgId: pendingImageReplacement.imgId,
                  src: croppedBase64
              }, '*');
          }
          setPendingImageReplacement(null);
      }
      setImageToEdit(null);
      setEditMode(null);
  };

  const onCropCancel = () => {
      setImageToEdit(null);
      setEditMode(null);
      setPendingImageReplacement(null);
  };

  const handleDownload = async () => {
    if (focusedArtifactIndex === null) return;
    const currentSession = sessions[currentSessionIndex];
    if (!currentSession) return;

    const siteName = (currentSession.prompt || 'flash-ui')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
      .substring(0, 50)
      || 'flash-ui';

    // Multi-page site: export as ZIP
    if (currentSession.mode === 'site' && currentSession.site) {
      const zip = new JSZip();
      for (const page of currentSession.site.pages) {
        if (!page.html) continue;
        const filename = page.isHome ? 'index.html' : `${page.slug}.html`;
        zip.file(filename, page.html);
      }
      const content = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(content);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${siteName}-site.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      return;
    }

    // Single page: download HTML
    const artifact = currentSession.artifacts[focusedArtifactIndex];
    if (!artifact) return;

    const blob = new Blob([artifact.html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${siteName}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  useEffect(() => {
      inputRef.current?.focus();
  }, []);

  useEffect(() => {
    if (showUrlInput && urlInputRef.current) {
        urlInputRef.current.focus();
    }
  }, [showUrlInput]);

  // Fix for mobile: reset scroll when focusing an item to prevent "overscroll" state
  useEffect(() => {
    if (focusedArtifactIndex !== null && window.innerWidth <= MOBILE_BREAKPOINT) {
        if (gridScrollRef.current) {
            gridScrollRef.current.scrollTop = 0;
        }
        window.scrollTo(0, 0);
    }
  }, [focusedArtifactIndex]);

  // Cycle placeholders
  useEffect(() => {
      const interval = setInterval(() => {
          setPlaceholderIndex(prev => (prev + 1) % placeholders.length);
      }, PLACEHOLDER_CYCLE_INTERVAL);
      return () => clearInterval(interval);
  }, [placeholders.length]);

  // Dynamic placeholder generation on load
  useEffect(() => {
      const fetchDynamicPlaceholders = async () => {
          try {
              const apiKey = getApiKey();
              const ai = createOpenRouterClient(apiKey);
              const response = await ai.models.generateContent({
                  model: selectedModel,
                  contents: { 
                      role: 'user', 
                      parts: [{ 
                          text: 'Generate 10 sophisticated B2B web design prompts (e.g. "Enterprise logistics dashboard", "AI-driven legal assistant"). Return ONLY a raw JSON array of strings.' 
                      }] 
                  }
              });
              const text = response.text || '[]';
              const jsonMatch = text.match(/\[[\s\S]*\]/);
              if (jsonMatch) {
                  const newPlaceholders = JSON.parse(jsonMatch[0]);
                  if (Array.isArray(newPlaceholders) && newPlaceholders.length > 0) {
                      const shuffled = newPlaceholders.sort(() => 0.5 - Math.random()).slice(0, 10);
                      setPlaceholders(prev => [...prev, ...shuffled]);
                  }
              }
          } catch (e) {
              console.warn("Silently failed to fetch dynamic placeholders", e);
          }
      };
      setTimeout(fetchDynamicPlaceholders, PLACEHOLDER_FETCH_DELAY);
  }, []);

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(event.target.value);
  };

  const clearImage = () => {
      setSelectedImage(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const parseJsonStream = async function* (responseStream: AsyncGenerator<{ text: string }>) {
      let buffer = '';
      for await (const chunk of responseStream) {
          const text = chunk.text;
          if (typeof text !== 'string') continue;
          buffer += text;
          let braceCount = 0;
          let start = buffer.indexOf('{');
          while (start !== -1) {
              braceCount = 0;
              let end = -1;
              for (let i = start; i < buffer.length; i++) {
                  if (buffer[i] === '{') braceCount++;
                  else if (buffer[i] === '}') braceCount--;
                  if (braceCount === 0 && i > start) {
                      end = i;
                      break;
                  }
              }
              if (end !== -1) {
                  const jsonString = buffer.substring(start, end + 1);
                  try {
                      yield JSON.parse(jsonString);
                      buffer = buffer.substring(end + 1);
                      start = buffer.indexOf('{');
                  } catch (e) {
                      start = buffer.indexOf('{', start + 1);
                  }
              } else {
                  break; 
              }
          }
      }
  };

  const handleGenerateVariations = useCallback(async () => {
    const currentSession = sessions[currentSessionIndex];
    if (!currentSession || focusedArtifactIndex === null) return;
    const currentArtifact = currentSession.artifacts[focusedArtifactIndex];

    setIsLoading(true);
    setComponentVariations([]);
    setDrawerState({ isOpen: true, mode: 'variations', title: 'Variations', data: currentArtifact.id });

    try {
        const apiKey = getApiKey();
        const ai = createOpenRouterClient(apiKey);

        // Define 3 distinct variation styles
        const variationStyles = [
            { name: 'Typography & Layout', focus: 'Focus on bold typography choices, creative text hierarchy, and an innovative layout structure. Use interesting font pairings and whitespace.' },
            { name: 'Color & Depth', focus: 'Focus on a striking color palette, gradients, shadows, and visual depth. Create dimension through layering and color contrast.' },
            { name: 'Different Vibe', focus: 'Take a completely different stylistic direction. If the original is corporate, make it playful. If minimal, make it bold. Surprise the user.' }
        ];

        // Generate each variation in parallel (more reliable than streaming JSON)
        const generateVariation = async (style: { name: string; focus: string }) => {
            const prompt = `
You are a World-Class Frontend Engineer.
Create a variation of this design: "${currentSession.prompt}".

**STYLE DIRECTION:** ${style.name}
${style.focus}

**CURRENT HTML TO REDESIGN:**
\`\`\`html
${currentArtifact.html.substring(0, HTML_PREVIEW_MAX_LENGTH)}${currentArtifact.html.length > HTML_PREVIEW_MAX_LENGTH ? '...' : ''}
\`\`\`

**INSTRUCTIONS:**
- Keep the same content and sections but apply a dramatically different visual style
- Make it mobile responsive
- Use CSS in a <style> tag
- Choose appropriate Google Fonts for this style

Return ONLY the complete HTML. No explanations or markdown code blocks.
            `.trim();

            const response = await ai.models.generateContent({
                model: selectedModel,
                contents: { role: 'user', parts: [{ text: prompt }] },
                config: { temperature: 1.1 }
            });

            let html = response.text || '';
            // Clean up code blocks if present
            if (html.startsWith('```html')) html = html.substring(7).trimStart();
            if (html.startsWith('```')) html = html.substring(3).trimStart();
            if (html.endsWith('```')) html = html.substring(0, html.length - 3).trimEnd();

            return { name: style.name, html };
        };

        // Run all 3 variations in parallel
        const results = await Promise.all(
            variationStyles.map(async (style) => {
                try {
                    const result = await generateVariation(style);
                    // Update state as each completes for progressive loading
                    if (result.html) {
                        setComponentVariations(prev => [...prev, result]);
                    }
                    return result;
                } catch (e) {
                    // Individual variation failed, continue with others
                    return null;
                }
            })
        );

        const successCount = results.filter(Boolean).length;
        if (successCount === 0) {
            showError('Failed to generate variations. Please try again.');
        }
    } catch (e: any) {
        showError(e.message || 'Failed to generate variations');
    } finally {
        setIsLoading(false);
    }
  }, [sessions, currentSessionIndex, focusedArtifactIndex, selectedModel]);

  const applyVariation = (html: string) => {
      if (focusedArtifactIndex === null) return;
      setSessions(prev => prev.map((sess, i) => 
          i === currentSessionIndex ? {
              ...sess,
              artifacts: sess.artifacts.map((art, j) => 
                j === focusedArtifactIndex ? { ...art, html, status: 'complete' } : art
              )
          } : sess
      ));
      setDrawerState(s => ({ ...s, isOpen: false }));
  };

  const handleShowCode = () => {
      const currentSession = sessions[currentSessionIndex];
      if (currentSession && focusedArtifactIndex !== null) {
          const artifact = currentSession.artifacts[focusedArtifactIndex];
          setDrawerState({ isOpen: true, mode: 'code', title: 'Source Code', data: artifact.html });
      }
  };
  
  const handleShowHistory = () => {
      setDrawerState({ isOpen: true, mode: 'history', title: 'History', data: null });
  };

  const handleOpenPublishModal = () => {
      if (focusedArtifactIndex !== null) {
          setIsPublishModalOpen(true);
      }
  };

  const handlePublished = (publishInfo: { url: string; shortId: string }) => {
      if (focusedArtifactIndex === null) return;

      setSessions(prev => prev.map((sess, i) =>
          i === currentSessionIndex ? {
              ...sess,
              artifacts: sess.artifacts.map((art, j) =>
                  j === focusedArtifactIndex ? {
                      ...art,
                      publishInfo: {
                          url: publishInfo.url,
                          shortId: publishInfo.shortId,
                          publishedAt: Date.now(),
                          version: (art.publishInfo?.version || 0) + 1
                      }
                  } : art
              )
          } : sess
      ));

      showSuccess('Page published successfully!');
  };

  const handleSaveToLibrary = () => {
      if (!currentSession || focusedArtifactIndex === null) return;
      const artifact = currentSession.artifacts[focusedArtifactIndex];
      if (!artifact?.html) return;

      try {
          const item = htmlLibrary.createLibraryItem(
              artifact.html,
              currentSession.prompt,
              artifact.seo?.title
          );
          htmlLibrary.saveItem(item);
          showSuccess('Saved to library!');
      } catch (e: any) {
          showError(e.message || 'Failed to save to library');
      }
  };

  const handleSaveBatchToLibrary = () => {
      const session = sessions[currentSessionIndex];
      if (!session) return;
      const completeArtifacts = session.artifacts.filter(a => a.status === 'complete' && a.html);
      if (completeArtifacts.length === 0) return;

      try {
          const batchId = generateId();
          completeArtifacts.forEach((artifact, index) => {
              const item = htmlLibrary.createLibraryItem(
                  artifact.html,
                  session.prompt,
                  artifact.seo?.title || `${session.prompt.slice(0, 30)} - ${artifact.styleName}`,
                  ['batch', `batch-${batchId}`]
              );
              item.batchId = batchId;
              item.batchIndex = index;
              htmlLibrary.saveItem(item);
          });
          showSuccess(`Saved ${completeArtifacts.length} variants to library!`);
      } catch (e: any) {
          showError(e.message || 'Failed to save batch to library');
      }
  };

  const handleRefine = useCallback(async (instruction: string) => {
      const session = sessions[currentSessionIndex];
      if (focusedArtifactIndex === null || !session || isRefining) return;
      
      const artifact = session.artifacts[focusedArtifactIndex];
      if (!artifact || !artifact.html) return;
      
      setIsRefining(true);
      
      // Mark the artifact as streaming
      setSessions(prev => prev.map((sess, i) => 
          i === currentSessionIndex ? {
              ...sess,
              artifacts: sess.artifacts.map((art, j) => 
                  j === focusedArtifactIndex ? { ...art, status: 'streaming' } : art
              )
          } : sess
      ));
      
      try {
          const apiKey = getApiKey();
          const ai = createOpenRouterClient(apiKey);

          const prompt = `
You are an Expert UI Refiner.

**CURRENT DESIGN:**
\`\`\`html
${artifact.html}
\`\`\`

**REFINEMENT REQUEST:** "${instruction}"

**TASK:**
Apply the refinement request to the current design. Make focused, targeted changes that address the request while preserving the overall structure and content.

**GUIDELINES:**
1. Keep all existing content (text, images, sections) unless specifically asked to remove them
2. Maintain the general layout structure unless the request asks to change it
3. Focus your changes on what was specifically requested
4. Ensure the design remains mobile-responsive
5. Keep all CSS in a <style> tag in the <head>

**OUTPUT:**
Return ONLY the complete, updated HTML. No explanations or markdown code blocks.
          `.trim();
          
          const responseStream = await ai.models.generateContentStream({
              model: selectedModel,
              contents: [{ parts: [{ text: prompt }], role: 'user' }],
              config: { temperature: 0.7 }
          });
          
          let accumulatedHtml = '';
          for await (const chunk of responseStream) {
              const text = chunk.text;
              if (typeof text === 'string') {
                  accumulatedHtml += text;
                  setSessions(prev => prev.map((sess, i) => 
                      i === currentSessionIndex ? {
                          ...sess,
                          artifacts: sess.artifacts.map((art, j) => 
                              j === focusedArtifactIndex ? { ...art, html: accumulatedHtml } : art
                          )
                      } : sess
                  ));
              }
          }
          
          // Clean up code blocks if present
          let finalHtml = accumulatedHtml.trim();
          if (finalHtml.startsWith('```html')) finalHtml = finalHtml.substring(7).trimStart();
          if (finalHtml.startsWith('```')) finalHtml = finalHtml.substring(3).trimStart();
          if (finalHtml.endsWith('```')) finalHtml = finalHtml.substring(0, finalHtml.length - 3).trimEnd();
          
          setSessions(prev => prev.map((sess, i) => 
              i === currentSessionIndex ? {
                  ...sess,
                  artifacts: sess.artifacts.map((art, j) => 
                      j === focusedArtifactIndex ? { 
                          ...art, 
                          html: finalHtml, 
                          status: finalHtml ? 'complete' : 'error' 
                      } : art
                  )
              } : sess
          ));
          
      } catch (e: any) {
          showError(e.message || 'Failed to refine design. Please try again.');
          // Restore original state on error
          setSessions(prev => prev.map((sess, i) => 
              i === currentSessionIndex ? {
                  ...sess,
                  artifacts: sess.artifacts.map((art, j) => 
                      j === focusedArtifactIndex ? { ...art, status: 'complete' } : art
                  )
              } : sess
          ));
      } finally {
          setIsRefining(false);
      }
  }, [focusedArtifactIndex, sessions, currentSessionIndex, isRefining, selectedModel]);

  const handleHistorySelect = (index: number) => {
      setCurrentSessionIndex(index);
      setFocusedArtifactIndex(null);
      setDrawerState(s => ({ ...s, isOpen: false }));
  };

  const handleSaveBrandKit = (brandKit: BrandKit) => {
      setBrandKits(prev => {
          const existing = prev.findIndex(bk => bk.id === brandKit.id);
          if (existing >= 0) {
              const updated = [...prev];
              updated[existing] = brandKit;
              return updated;
          }
          return [...prev, brandKit];
      });
      setSelectedBrandKit(brandKit);
      setEditingBrandKit(null);
  };

  const handleDeleteBrandKit = (id: string) => {
      setBrandKits(prev => prev.filter(bk => bk.id !== id));
      if (selectedBrandKit?.id === id) {
          setSelectedBrandKit(null);
      }
  };

  const openBrandKitEditor = (brandKit?: BrandKit) => {
      setEditingBrandKit(brandKit || null);
      setIsBrandKitEditorOpen(true);
      setShowBrandKitDropdown(false);
  };

  const handleSaveProject = (project: Project) => {
      setProjects(prev => {
          const existing = prev.findIndex(p => p.id === project.id);
          if (existing >= 0) {
              const updated = [...prev];
              updated[existing] = project;
              return updated;
          }
          return [...prev, project];
      });
      setCurrentProject(project);
      // Auto-select project's brand kit if it has one
      if (project.brandKit) {
          setSelectedBrandKit(project.brandKit);
      }
  };

  const handleDeleteProject = (id: string) => {
      setProjects(prev => prev.filter(p => p.id !== id));
      if (currentProject?.id === id) {
          setCurrentProject(null);
      }
  };

  const handleSelectProject = (project: Project | null) => {
      setCurrentProject(project);
      // Auto-select project's brand kit if it has one
      if (project?.brandKit) {
          setSelectedBrandKit(project.brandKit);
      } else if (!project) {
          // Optionally clear brand kit when clearing project
      }
      setIsProjectManagerOpen(false);
  };

  // Load item from library into workspace
  const handleLoadFromLibrary = (item: HTMLItem, preserveStyling: boolean) => {
      let html = item.content;

      // If not preserving styling, strip CSS (basic implementation)
      if (!preserveStyling) {
          // Remove <style> tags
          html = html.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '');
          // Remove inline style attributes
          html = html.replace(/\s+style="[^"]*"/gi, '');
      }

      const newArtifact: Artifact = {
          id: generateId(),
          styleName: item.title,
          html,
          status: 'complete'
      };

      const newSession: Session = {
          id: generateId(),
          prompt: item.prompt || `Loaded from library: ${item.title}`,
          artifacts: [newArtifact],
          createdAt: Date.now()
      };

      setSessions(prev => [...prev, newSession]);
      setCurrentSessionIndex(sessions.length);
      setFocusedArtifactIndex(0);
      showSuccess(`Loaded "${item.title}" from library`);
  };

  // Upgrade a single-page variant to a multi-page site
  const handleUpgradeToSite = useCallback((sessionIndex: number, artifactIndex: number) => {
      const session = sessions[sessionIndex];
      if (!session) return;
      const artifact = session.artifacts[artifactIndex];
      if (!artifact || artifact.status !== 'complete') return;

      const homePageId = generateId();
      const homePage: SitePage = {
          id: homePageId,
          name: 'Home',
          slug: 'home',
          html: artifact.html,
          status: 'complete',
          isHome: true
      };

      const newSite: Site = {
          id: generateId(),
          name: session.prompt.substring(0, 50),
          styleName: artifact.styleName,
          pages: [homePage],
          seo: artifact.seo,
          publishInfo: artifact.publishInfo,
          formSettings: artifact.formSettings
      };

      setSessions(prev => prev.map((s, i) =>
          i === sessionIndex ? {
              ...s,
              mode: 'site' as const,
              site: newSite,
              artifacts: s.artifacts // keep artifacts for reference
          } : s
      ));

      setCurrentSitePageId(homePageId);
      setFocusedArtifactIndex(0);
      showSuccess('Upgraded to multi-page site! Add more pages with the + button.');
  }, [sessions]);

  // Add Page to existing site
  const handleAddPage = useCallback(async (sessionId: string) => {
      const pageName = prompt('Enter page name (e.g., About, Contact, Services):');
      if (!pageName) return;
      
      const slug = pageName.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
      const pageId = generateId();
      
      const session = sessions.find(s => s.id === sessionId);
      if (!session?.site) return;
      
      // Add placeholder page
      const newPage: SitePage = {
          id: pageId,
          name: pageName,
          slug,
          html: '',
          status: 'streaming',
          isHome: false
      };
      
      setSessions(prev => prev.map(s => 
          s.id === sessionId && s.site ? {
              ...s,
              site: {
                  ...s.site,
                  pages: [...s.site.pages, newPage]
              }
          } : s
      ));
      
      setCurrentSitePageId(pageId);
      
      // Generate page content
      try {
          const apiKey = getApiKey();
          const ai = createOpenRouterClient(apiKey);

          const existingPages = session.site.pages.map(p => `- ${p.name} (/${p.slug})`).join('\n');
          const homeHtml = session.site.pages.find(p => p.isHome)?.html || '';
          
          const prompt = `
You are a World-Class Frontend Engineer.
Create a "${pageName}" page for an existing website.

**EXISTING SITE INFO:**
Original prompt: "${session.prompt}"
Existing pages:
${existingPages}

**STYLE REFERENCE (match this exactly):**
\`\`\`html
${homeHtml.substring(0, 4000)}
\`\`\`

**PAGE REQUIREMENTS:**
1. Match the EXACT same styling, colors, fonts, and design language
2. Include consistent navigation that links to: ${session.site.pages.map(p => `/${p.slug}`).join(', ')}, /${slug}
3. Create relevant content for a "${pageName}" page
4. Mobile responsive
5. Self-contained HTML with embedded CSS

**IMAGES:** Use \`https://image.pollinations.ai/prompt/{description}?width={w}&height={h}&nologo=true\`

Return ONLY RAW HTML.
          `.trim();
          
          const responseStream = await ai.models.generateContentStream({
              model: selectedModel,
              contents: [{ parts: [{ text: prompt }], role: "user" }]
          });
          
          let accumulatedHtml = '';
          for await (const chunk of responseStream) {
              const text = chunk.text;
              if (typeof text === 'string') {
                  accumulatedHtml += text;
                  setSessions(prev => prev.map(s => 
                      s.id === sessionId && s.site ? {
                          ...s,
                          site: {
                              ...s.site,
                              pages: s.site.pages.map(p => 
                                  p.id === pageId ? { ...p, html: accumulatedHtml } : p
                              )
                          }
                      } : s
                  ));
              }
          }
          
          // Clean up
          let finalHtml = accumulatedHtml.trim();
          if (finalHtml.startsWith('```html')) finalHtml = finalHtml.substring(7).trimStart();
          if (finalHtml.startsWith('```')) finalHtml = finalHtml.substring(3).trimStart();
          if (finalHtml.endsWith('```')) finalHtml = finalHtml.substring(0, finalHtml.length - 3).trimEnd();
          
          setSessions(prev => prev.map(s => 
              s.id === sessionId && s.site ? {
                  ...s,
                  site: {
                      ...s.site,
                      pages: s.site.pages.map(p => 
                          p.id === pageId ? { ...p, html: finalHtml, status: 'complete' } : p
                      )
                  }
              } : s
          ));
          
      } catch (e: any) {
          showError(e.message || 'Failed to add page. Please try again.');
          setSessions(prev => prev.map(s => 
              s.id === sessionId && s.site ? {
                  ...s,
                  site: {
                      ...s.site,
                      pages: s.site.pages.map(p => 
                          p.id === pageId ? { ...p, html: `<div style="color: #ff6b6b; padding: 20px;">Error: ${e.message}</div>`, status: 'error' } : p
                      )
                  }
              } : s
          ));
      }
  }, [sessions, selectedModel]);

  const handleSendMessage = useCallback(async (manualPrompt?: string) => {
    const promptToUse = manualPrompt || inputValue;
    const trimmedInput = promptToUse.trim();
    const currentUrl = urlValue.trim();
    
    if (!trimmedInput || isLoading) return;
    if (!manualPrompt) {
        setInputValue('');
        clearImage();
    }
    if (!manualPrompt) setUrlValue(''); // Reset URL after send
    setShowUrlInput(false);

    setIsLoading(true);
    const baseTime = Date.now();
    const sessionId = generateId();
    const displayPrompt = currentUrl ? `${trimmedInput} (${currentUrl})` : trimmedInput;

    // Handle Site Mode vs Single Page Mode
    if (siteMode) {
        // Parse page structure or use defaults
        const pages = pageStructure.trim() 
            ? pageStructure.split('\n').map(line => line.trim()).filter(Boolean)
            : ['Home', 'About', 'Contact'];
        
        const sitePages: SitePage[] = pages.map((pageName, i) => ({
            id: `${sessionId}_page_${i}`,
            name: pageName,
            slug: pageName.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') || 'home',
            html: '',
            status: 'streaming' as const,
            isHome: i === 0
        }));
        
        const newSite: Site = {
            id: `${sessionId}_site`,
            name: trimmedInput.substring(0, 50),
            styleName: 'Designing...',
            pages: sitePages
        };
        
        const newSession: Session = {
            id: sessionId,
            prompt: displayPrompt,
            timestamp: baseTime,
            artifacts: [],
            mode: 'site',
            site: newSite
        };
        
        setSessions(prev => [...prev, newSession]);
        setCurrentSessionIndex(sessions.length);
        setFocusedArtifactIndex(0);
        setCurrentSitePageId(sitePages[0].id);
        
        // Generate site pages
        try {
            const apiKey = getApiKey();
            const ai = createOpenRouterClient(apiKey);

            // Determine style for the site
            const stylePrompt = `
You are an expert Design Strategist.
Client Request: "${trimmedInput}" (Multi-page website).
${currentUrl ? `Context URL: ${currentUrl}.` : ''}

Determine ONE cohesive visual style for this website.
Consider: typography, color scheme, layout philosophy, visual elements.

Return ONLY a single string describing the style (e.g., "Modern Minimalist with Bold Typography" or "Warm Corporate with Soft Gradients").
            `.trim();
            
            const styleResponse = await ai.models.generateContent({
                model: selectedModel,
                contents: { role: 'user', parts: [{ text: stylePrompt }] }
            });
            
            const styleName = (styleResponse.text || 'Modern Professional').trim().replace(/^["']|["']$/g, '');
            
            setSessions(prev => prev.map(s => 
                s.id === sessionId && s.site ? {
                    ...s,
                    site: { ...s.site, styleName }
                } : s
            ));
            
            const brandKitInstruction = selectedBrandKit ? `
**BRAND KIT (MUST USE THESE):**
- Primary Color: ${selectedBrandKit.primaryColor}
- Secondary Color: ${selectedBrandKit.secondaryColor}
- Accent Color: ${selectedBrandKit.accentColor}
- Font Family: '${selectedBrandKit.fontFamily}' (import from Google Fonts)
${selectedBrandKit.logoUrl ? `- Logo URL: ${selectedBrandKit.logoUrl}` : ''}
` : '';
            
            const pageList = sitePages.map(p => `- ${p.name} (/${p.slug})`).join('\n');
            
            // Generate each page
            for (const page of sitePages) {
                const pagePrompt = `
You are a World-Class Frontend Engineer building a multi-page website.
Website: "${trimmedInput}"
Style: "${styleName}"
${brandKitInstruction}

**PAGE TO BUILD:** ${page.name} (${page.isHome ? 'Homepage' : 'Inner page'})
**URL:** /${page.slug}

**ALL PAGES IN THIS SITE:**
${pageList}

**REQUIREMENTS:**
1. Include a consistent navigation bar with links to ALL pages (use relative links like "/${sitePages[0].slug}", "/${sitePages[1]?.slug || 'about'}", etc.)
2. ${page.isHome ? 'Create a compelling homepage with hero section, features, and call-to-action' : `Create appropriate content for a ${page.name} page`}
3. Mobile responsive with Flexbox/Grid
4. Self-contained HTML with embedded CSS
5. Consistent styling across all pages

**IMAGES:** Use \`https://image.pollinations.ai/prompt/{description}?width={w}&height={h}&nologo=true\`

Return ONLY RAW HTML.
                `.trim();
                
                const responseStream = await ai.models.generateContentStream({
                    model: selectedModel,
                    contents: [{ parts: [{ text: pagePrompt }], role: "user" }]
                });
                
                let accumulatedHtml = '';
                for await (const chunk of responseStream) {
                    const text = chunk.text;
                    if (typeof text === 'string') {
                        accumulatedHtml += text;
                        setSessions(prev => prev.map(s => 
                            s.id === sessionId && s.site ? {
                                ...s,
                                site: {
                                    ...s.site,
                                    pages: s.site.pages.map(p => 
                                        p.id === page.id ? { ...p, html: accumulatedHtml } : p
                                    )
                                }
                            } : s
                        ));
                    }
                }
                
                // Clean up
                let finalHtml = accumulatedHtml.trim();
                if (finalHtml.startsWith('```html')) finalHtml = finalHtml.substring(7).trimStart();
                if (finalHtml.startsWith('```')) finalHtml = finalHtml.substring(3).trimStart();
                if (finalHtml.endsWith('```')) finalHtml = finalHtml.substring(0, finalHtml.length - 3).trimEnd();
                
                setSessions(prev => prev.map(s => 
                    s.id === sessionId && s.site ? {
                        ...s,
                        site: {
                            ...s.site,
                            pages: s.site.pages.map(p => 
                                p.id === page.id ? { ...p, html: finalHtml, status: 'complete' } : p
                            )
                        }
                    } : s
                ));
            }
            
        } catch (e: any) {
            showError(e.message || 'Failed to generate site. Please try again.');
        } finally {
            setIsLoading(false);
            setPageStructure('');
        }
        return;
    }

    // Single Page Mode (original behavior)
    const placeholderArtifacts: Artifact[] = Array(variantCount).fill(null).map((_, i) => ({
        id: `${sessionId}_${i}`,
        styleName: 'Designing...',
        html: '',
        status: 'streaming',
    }));

    const newSession: Session = {
        id: sessionId,
        prompt: displayPrompt,
        timestamp: baseTime,
        artifacts: placeholderArtifacts,
        mode: 'single',
        variantCount
    };

    setSessions(prev => [...prev, newSession]);
    setCurrentSessionIndex(sessions.length); 
    setFocusedArtifactIndex(null); 

    try {
        const apiKey = getApiKey();
        const ai = createOpenRouterClient(apiKey);

        // Phase 1: Determine Styles - UPDATED for Context Awareness
        const stylePrompt = `
You are an expert Design Strategist.
Client Request: "${trimmedInput}".
${currentUrl ? `Context URL: ${currentUrl}.` : ''}
${selectedImage ? `Context Image: Attached.` : ''}

**TASK:**
Analyze the request and determine the ${variantCount} most effective and DISTINCT visual styles for this specific use case.
Do NOT default to "Luxury" or "SaaS" unless the request specifically fits that.
Think broad: Retro, Brutalist, Playful, Corporate, Minimalist, Industrial, Nature-inspired, etc.

**EXAMPLES:**
- If "Kindergarten": ["Playful Storybook", "Soft Rounded Pastel", "Bright & Bouncy"]
- If "Law Firm": ["Trustworthy Serif", "High-Contrast Corporate", "Traditional Navy"]
- If "Dashboard": ["Linear Dark Mode", "Clean Light Glass", "Data-Dense Industrial"]

Return ONLY a raw JSON array of ${variantCount} strings describing the specific vibes.
        `.trim();

        const styleRequestParts: any[] = [{ text: stylePrompt }];
        
        // If an image is selected, add it to the request so Gemini can "see" the vibe
        if (selectedImage) {
            const { mimeType, data } = parseDataUrl(selectedImage);
            styleRequestParts.push({
                inlineData: { mimeType, data }
            });
        }

        const styleResponse = await ai.models.generateContent({
            model: selectedModel,
            contents: { role: 'user', parts: styleRequestParts }
        });

        let generatedStyles: string[] = [];
        const styleText = styleResponse.text || '[]';
        const jsonMatch = styleText.match(/\[[\s\S]*\]/);
        
        if (jsonMatch) {
            try {
                generatedStyles = JSON.parse(jsonMatch[0]);
            } catch (e) {
                console.warn("Failed to parse styles, using fallbacks");
            }
        }

        if (!generatedStyles || generatedStyles.length < variantCount) {
            generatedStyles = STYLE_FALLBACKS.slice(0, variantCount);
        }
        generatedStyles = generatedStyles.slice(0, variantCount);

        setSessions(prev => prev.map(s => {
            if (s.id !== sessionId) return s;
            return {
                ...s,
                artifacts: s.artifacts.map((art, i) => ({
                    ...art,
                    styleName: generatedStyles[i]
                }))
            };
        }));

        // Phase 2: Generate High-Fidelity HTML - UPDATED for Flexibility
        const generateArtifact = async (artifact: Artifact, styleInstruction: string) => {
            try {
                // Build brand kit instruction if one is selected
                const brandKitInstruction = selectedBrandKit ? `
**BRAND KIT (MUST USE THESE):**
- Primary Color: ${selectedBrandKit.primaryColor}
- Secondary Color: ${selectedBrandKit.secondaryColor}
- Accent Color: ${selectedBrandKit.accentColor}
- Font Family: '${selectedBrandKit.fontFamily}' (import from Google Fonts)
${selectedBrandKit.logoUrl ? `- Logo URL: ${selectedBrandKit.logoUrl}` : ''}
` : '';

                // Clone mode uses a different prompt focused on replication
                const isCloning = cloneMode && (currentUrl || selectedImage);
                
                const clonePrompt = `
You are a World-Class Frontend Engineer specializing in pixel-perfect recreations.

**TASK:** Replicate the layout and structure of the reference ${currentUrl ? `website at ${currentUrl}` : 'image provided'}.
**NEW CONTENT:** "${trimmedInput}"

**CLONE INSTRUCTIONS:**
1. **Structure:** Match the EXACT layout structure - same sections, same arrangement, same proportions.
2. **Typography:** Use the same or very similar fonts. Match font sizes and weights.
3. **Spacing:** Match padding, margins, and gaps as closely as possible.
4. **Colors:** ${selectedBrandKit ? `Use brand kit colors instead: primary (${selectedBrandKit.primaryColor}), secondary (${selectedBrandKit.secondaryColor}), accent (${selectedBrandKit.accentColor})` : 'Match the original color scheme closely.'}
5. **Components:** Recreate the same UI components (buttons, cards, navigation style).
6. **Content:** Replace text/images with content relevant to "${trimmedInput}".
${brandKitInstruction}

**IMAGES:** Use \`https://image.pollinations.ai/prompt/{description}?width={w}&height={h}&nologo=true\` for images.

**OUTPUT:** Return ONLY the complete, self-contained HTML with embedded CSS. Mobile responsive.
                `.trim();

                const standardPrompt = `
You are a World-Class Frontend Engineer.
Build a COMPLETE, Single Page Website for: "${trimmedInput}".

**CONTEXT:**
${currentUrl ? `Client URL: ${currentUrl}. Search it.` : ''}
${selectedImage ? `Refer to the attached image for color palette and visual tone.` : ''}
${brandKitInstruction}

**TARGET STYLE:** ${styleInstruction}

**DESIGN INSTRUCTIONS:**
1.  **Typography:** ${selectedBrandKit ? `Use '${selectedBrandKit.fontFamily}' as the primary font. Import it from Google Fonts.` : `Choose a Google Font that PERFECTLY fits the '${styleInstruction}' style. Import it in the CSS. Do NOT default to Inter unless it fits.`}
2.  **Layout & Structure:** Create a layout that makes sense for a "${trimmedInput}". 
    - If it's a Landing Page, use sections like Hero, Features, CTA.
    - If it's a Dashboard, use a Sidebar, Header, and Data Cards.
    - If it's a Blog, use a Grid of Articles.
    - If it's a Restaurant, use a Menu section and Gallery.
3.  **Visuals:** 
    - Use CSS for creative backgrounds/shapes matching the style (e.g. brutalist borders, soft gradients, retro patterns).
    - **IMAGES:** Use \`https://image.pollinations.ai/prompt/{description}?width={w}&height={h}&nologo=true\` for realistic photos/illustrations. 
4.  **Color:** ${selectedBrandKit ? `Use the brand kit colors: primary (${selectedBrandKit.primaryColor}), secondary (${selectedBrandKit.secondaryColor}), and accent (${selectedBrandKit.accentColor}).` : `Strictly follow the '${styleInstruction}' vibe.`}

**TECHNICAL:**
- Mobile Responsive.
- Flexbox/Grid.
- Self-contained HTML/CSS.

Return ONLY RAW HTML.
                `.trim();
                
                const prompt = isCloning ? clonePrompt : standardPrompt;
          
                const generationParts: any[] = [{ text: prompt }];
                if (selectedImage) {
                    const { mimeType, data } = parseDataUrl(selectedImage);
                    generationParts.push({
                        inlineData: { mimeType, data }
                    });
                }

                const responseStream = await ai.models.generateContentStream({
                    model: selectedModel,
                    contents: [{ parts: generationParts, role: "user" }]
                });

                let accumulatedHtml = '';
                for await (const chunk of responseStream) {
                    const text = chunk.text;
                    if (typeof text === 'string') {
                        accumulatedHtml += text;
                        setSessions(prev => prev.map(sess => 
                            sess.id === sessionId ? {
                                ...sess,
                                artifacts: sess.artifacts.map(art => 
                                    art.id === artifact.id ? { ...art, html: accumulatedHtml } : art
                                )
                            } : sess
                        ));
                    }
                }
                
                let finalHtml = accumulatedHtml.trim();
                // Basic cleanup if the model wraps in code blocks
                if (finalHtml.startsWith('```html')) finalHtml = finalHtml.substring(7).trimStart();
                if (finalHtml.startsWith('```')) finalHtml = finalHtml.substring(3).trimStart();
                if (finalHtml.endsWith('```')) finalHtml = finalHtml.substring(0, finalHtml.length - 3).trimEnd();

                setSessions(prev => prev.map(sess => 
                    sess.id === sessionId ? {
                        ...sess,
                        artifacts: sess.artifacts.map(art => 
                            art.id === artifact.id ? { ...art, html: finalHtml, status: finalHtml ? 'complete' : 'error' } : art
                        )
                    } : sess
                ));

            } catch (e: any) {
                showError(`Failed to generate ${artifact.styleName} variation`);
                setSessions(prev => prev.map(sess =>
                    sess.id === sessionId ? {
                        ...sess,
                        artifacts: sess.artifacts.map(art =>
                            art.id === artifact.id ? { ...art, html: `<div style="color: #ff6b6b; padding: 20px;">Error: ${e.message}</div>`, status: 'error' } : art
                        )
                    } : sess
                ));
            }
        };

        // Generate in batches to avoid rate limits
        for (let batchStart = 0; batchStart < placeholderArtifacts.length; batchStart += GENERATION_BATCH_SIZE) {
            const batch = placeholderArtifacts.slice(batchStart, batchStart + GENERATION_BATCH_SIZE);
            await Promise.all(batch.map((art, i) => generateArtifact(art, generatedStyles[batchStart + i])));
        }

    } catch (e: any) {
        showError(e.message || 'Failed to generate designs. Please try again.');
    } finally {
        setIsLoading(false);
        setTimeout(() => inputRef.current?.focus(), FOCUS_DELAY);
    }
  }, [inputValue, urlValue, selectedImage, isLoading, sessions.length, selectedModel, selectedBrandKit, cloneMode, variantCount]);

  const handleSurpriseMe = () => {
      const currentPrompt = placeholders[placeholderIndex];
      setInputValue(currentPrompt);
      handleSendMessage(currentPrompt);
  };

  const handleSelectTemplate = (prompt: string) => {
      setInputValue(prompt);
      // Focus the input so user can modify if needed
      setTimeout(() => inputRef.current?.focus(), FOCUS_DELAY);
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter' && !isLoading) {
      event.preventDefault();
      handleSendMessage();
    } else if (event.key === 'Tab' && !inputValue && !isLoading) {
        event.preventDefault();
        setInputValue(placeholders[placeholderIndex]);
    }
  };

  const nextItem = useCallback(() => {
      if (focusedArtifactIndex !== null) {
          const maxIndex = (sessions[currentSessionIndex]?.artifacts.length || 3) - 1;
          if (focusedArtifactIndex < maxIndex) setFocusedArtifactIndex(focusedArtifactIndex + 1);
      } else {
          if (currentSessionIndex < sessions.length - 1) setCurrentSessionIndex(currentSessionIndex + 1);
      }
  }, [currentSessionIndex, sessions, focusedArtifactIndex]);

  const prevItem = useCallback(() => {
      if (focusedArtifactIndex !== null) {
          if (focusedArtifactIndex > 0) setFocusedArtifactIndex(focusedArtifactIndex - 1);
      } else {
           if (currentSessionIndex > 0) setCurrentSessionIndex(currentSessionIndex - 1);
      }
  }, [currentSessionIndex, focusedArtifactIndex]);

  const isLoadingDrawer = isLoading && drawerState.mode === 'variations' && componentVariations.length === 0;

  const hasStarted = sessions.length > 0 || isLoading;
  const currentSession = sessions[currentSessionIndex];

  let canGoBack = false;
  let canGoForward = false;

  if (hasStarted) {
      if (focusedArtifactIndex !== null) {
          canGoBack = focusedArtifactIndex > 0;
          canGoForward = focusedArtifactIndex < (currentSession?.artifacts.length || 0) - 1;
      } else {
          canGoBack = currentSessionIndex > 0;
          canGoForward = currentSessionIndex < sessions.length - 1;
      }
  }

  return (
    <>
        {/* Hidden File Input for Image Replacement */}
        <input 
            type="file" 
            ref={replaceInputRef} 
            style={{ display: 'none' }} 
            accept="image/*"
            onChange={handleReplacementImageSelect}
        />

        {imageToEdit && (
            <ImageCropper 
                imageSrc={imageToEdit}
                onCancel={onCropCancel}
                onComplete={onCropComplete}
            />
        )}

        {/* Publish Modal */}
        {focusedArtifactIndex !== null && currentSession && currentSession.artifacts[focusedArtifactIndex] && (
            <PublishModal
                isOpen={isPublishModalOpen}
                onClose={() => setIsPublishModalOpen(false)}
                artifact={currentSession.artifacts[focusedArtifactIndex]}
                prompt={currentSession.prompt}
                onPublished={handlePublished}
                userId={userId}
            />
        )}

        {/* Share/Preview Modal */}
        {focusedArtifactIndex !== null && currentSession && currentSession.artifacts[focusedArtifactIndex] && (
            <ShareModal
                isOpen={isShareModalOpen}
                onClose={() => setIsShareModalOpen(false)}
                artifact={currentSession.artifacts[focusedArtifactIndex]}
                prompt={currentSession.prompt}
            />
        )}

        {/* Brand Kit Editor */}
        <BrandKitEditor
            isOpen={isBrandKitEditorOpen}
            onClose={() => {
                setIsBrandKitEditorOpen(false);
                setEditingBrandKit(null);
            }}
            currentBrandKit={editingBrandKit}
            onSave={handleSaveBrandKit}
            onDelete={handleDeleteBrandKit}
        />

        {/* Project Manager */}
        <ProjectManager
            isOpen={isProjectManagerOpen}
            onClose={() => setIsProjectManagerOpen(false)}
            projects={projects}
            currentProject={currentProject}
            brandKits={brandKits}
            onSaveProject={handleSaveProject}
            onDeleteProject={handleDeleteProject}
            onSelectProject={handleSelectProject}
        />

        {/* Template Library */}
        <TemplateLibrary
            isOpen={isTemplateLibraryOpen}
            onClose={() => setIsTemplateLibraryOpen(false)}
            onSelectTemplate={handleSelectTemplate}
        />

        {/* HTML Library */}
        <HTMLLibrary
            isOpen={isLibraryOpen}
            onClose={() => setIsLibraryOpen(false)}
            onSelectItem={handleLoadFromLibrary}
        />

        {/* Analytics Dashboard */}
        {focusedArtifactIndex !== null && currentSession && (
            <AnalyticsDashboard
                isOpen={isAnalyticsOpen}
                onClose={() => setIsAnalyticsOpen(false)}
                artifact={currentSession.artifacts[focusedArtifactIndex]}
            />
        )}

        {/* Settings Modal */}
        <Settings
            isOpen={isSettingsOpen}
            onClose={() => setIsSettingsOpen(false)}
            selectedModel={selectedModel}
            onModelChange={handleModelChange}
        />

        <SideDrawer 
            isOpen={drawerState.isOpen} 
            onClose={() => setDrawerState(s => ({...s, isOpen: false}))} 
            title={drawerState.title}
        >
            {isLoadingDrawer && (
                 <div className="loading-state">
                     <ThinkingIcon /> 
                     Designing variations...
                 </div>
            )}

            {drawerState.mode === 'code' && (
                <pre className="code-block"><code>{drawerState.data}</code></pre>
            )}
            
            {drawerState.mode === 'history' && (
                <div className="sexy-grid">
                    {sessions.map((s, i) => (
                         <div key={s.id} className="sexy-card" onClick={() => handleHistorySelect(i)}>
                             <div className="sexy-label" style={{ borderTop: 'none', borderBottom: '1px solid var(--glass-border)', background: i === currentSessionIndex ? 'rgba(255,255,255,0.1)' : 'transparent' }}>
                                 {new Date(s.timestamp).toLocaleTimeString()} - {s.prompt}
                             </div>
                         </div>
                    ))}
                    {sessions.length === 0 && <div style={{padding: 20, textAlign: 'center', color: '#666'}}>No history yet.</div>}
                </div>
            )}
            
            {drawerState.mode === 'variations' && (
                <div className="sexy-grid">
                    {componentVariations.map((v, i) => (
                         <div key={i} className="sexy-card" onClick={() => applyVariation(v.html)}>
                             <div className="sexy-preview">
                                 <iframe srcDoc={v.html} title={v.name} sandbox="allow-scripts allow-same-origin" />
                             </div>
                             <div className="sexy-label">{v.name}</div>
                         </div>
                    ))}
                </div>
            )}
        </SideDrawer>

        <Sidebar
            onHome={() => {
                setFocusedArtifactIndex(null);
                setCurrentSessionIndex(-1);
            }}
            onNew={() => {
                setFocusedArtifactIndex(null);
                setCurrentSessionIndex(-1);
                inputRef.current?.focus();
            }}
            onProjects={() => setIsLibraryOpen(true)}
            onHistory={() => setDrawerState({ isOpen: true, mode: 'history', title: 'History', data: null })}
            onShare={() => setIsShareModalOpen(true)}
            onPublish={handleOpenPublishModal}
            onAnalytics={() => setIsAnalyticsOpen(true)}
            onSettings={() => setIsSettingsOpen(true)}
            hasArtifact={focusedArtifactIndex !== null && currentSession?.artifacts[focusedArtifactIndex] !== undefined}
        />

        <div className="immersive-app">
            <DottedGlowBackground 
                gap={24} 
                radius={1.5} 
                color="rgba(255, 255, 255, 0.02)" 
                glowColor="rgba(255, 255, 255, 0.15)" 
                speedScale={0.5} 
            />

            <div className={`stage-container ${focusedArtifactIndex !== null ? 'mode-focus' : 'mode-split'}`}>
                 <div className={`empty-state ${focusedArtifactIndex !== null ? 'fade-out' : ''} ${hasStarted ? 'has-content' : ''}`}>
                     <div className="empty-content">
                         <h1>Flashed</h1>
                         <p>Instant landing pages for customer demos</p>
                         {!hasStarted && (
                             <>
                                 <button className="surprise-button" onClick={handleSurpriseMe} disabled={isLoading}>
                                     <SparklesIcon /> Example Pitch
                                 </button>
                                 <button className="template-browse-btn" onClick={() => setIsTemplateLibraryOpen(true)} disabled={isLoading}>
                                     <TemplateIcon /> Browse Templates
                                 </button>
                             </>
                         )}
                     </div>
                 </div>

                {sessions.map((session, sIndex) => {
                    let positionClass = 'hidden';
                    if (sIndex === currentSessionIndex) positionClass = 'active-session';
                    else if (sIndex < currentSessionIndex) positionClass = 'past-session';
                    else if (sIndex > currentSessionIndex) positionClass = 'future-session';
                    
                    // Check if this session has a site
                    const isSiteSession = session.mode === 'site' && session.site;
                    
                    return (
                        <div key={session.id} className={`session-group ${positionClass}`}>
                            <div className={`artifact-grid ${session.artifacts.length === 5 ? 'grid-5' : session.artifacts.length >= 10 ? 'grid-10' : ''}`} ref={sIndex === currentSessionIndex ? gridScrollRef : null}>
                                {isSiteSession ? (
                                    // Site mode: render the site with page navigation
                                    <ArtifactCard 
                                        key={session.site!.id}
                                        site={session.site}
                                        isFocused={focusedArtifactIndex === 0}
                                        onClick={() => setFocusedArtifactIndex(0)}
                                        onAddPage={() => handleAddPage(session.id)}
                                        onPageChange={(pageId) => setCurrentSitePageId(pageId)}
                                    />
                                ) : (
                                    // Single page mode: render artifacts
                                    session.artifacts.map((artifact, aIndex) => {
                                        const isFocused = focusedArtifactIndex === aIndex;
                                        
                                        return (
                                            <ArtifactCard 
                                                key={artifact.id}
                                                artifact={artifact}
                                                isFocused={isFocused}
                                                onClick={() => setFocusedArtifactIndex(aIndex)}
                                            />
                                        );
                                    })
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>

             {canGoBack && (
                <button className="nav-handle left" onClick={prevItem} aria-label="Previous">
                    <ArrowLeftIcon />
                </button>
             )}
             {canGoForward && (
                <button className="nav-handle right" onClick={nextItem} aria-label="Next">
                    <ArrowRightIcon />
                </button>
             )}

            {/* Refine Input - appears when artifact is focused */}
            <RefineInput
                isVisible={focusedArtifactIndex !== null && !isLoading}
                isRefining={isRefining}
                onRefine={handleRefine}
            />

            <div className={`action-bar ${focusedArtifactIndex !== null ? 'visible' : ''}`}>
                 <div className="active-prompt-label">
                    {currentSession?.prompt}
                 </div>
                 <div className="action-buttons">
                    {currentSession?.mode === 'site' ? (
                        <>
                            <button onClick={() => setFocusedArtifactIndex(null)}>
                                <GridIcon /> Grid
                            </button>
                            <button onClick={handleShowCode}>
                                <CodeIcon /> Source
                            </button>
                            <button onClick={handleDownload}>
                                <DownloadIcon /> Download
                            </button>
                            <button onClick={handleSaveToLibrary}>
                                <BookmarkIcon /> Save
                            </button>
                        </>
                    ) : (
                        <>
                            <button onClick={() => setFocusedArtifactIndex(null)}>
                                <GridIcon /> Grid
                            </button>
                            <button
                                className="upgrade-to-site-btn"
                                onClick={() => handleUpgradeToSite(currentSessionIndex, focusedArtifactIndex!)}
                                disabled={isLoading || currentSession?.artifacts[focusedArtifactIndex!]?.status !== 'complete'}
                            >
                                <LayersIcon /> Upgrade to Multi-Site
                            </button>
                            <button onClick={handleGenerateVariations} disabled={isLoading}>
                                <SparklesIcon /> Variations
                            </button>
                            <button onClick={handleShowCode}>
                                <CodeIcon /> Source
                            </button>
                            <button onClick={handleDownload}>
                                <DownloadIcon /> Download
                            </button>
                            <button onClick={handleSaveToLibrary}>
                                <BookmarkIcon /> Save
                            </button>
                            {currentSession && currentSession.artifacts.length > 3 && (
                                <button onClick={handleSaveBatchToLibrary}>
                                    <LayersIcon /> Save All
                                </button>
                            )}
                        </>
                    )}
                 </div>
            </div>

            <div className={`floating-input-container ${focusedArtifactIndex !== null ? 'hidden' : ''}`}>
                {/* Controls bar - only shown when no artifact is focused (hide during preview to reduce clutter) */}
                {hasStarted && focusedArtifactIndex === null && (
                    <div className="input-controls-bar">
                        {/* Brand Kit Selector */}
                        <div className="brand-kit-selector">
                        <button 
                            className={`brand-kit-btn ${selectedBrandKit ? 'active' : ''}`}
                            onClick={() => setShowBrandKitDropdown(!showBrandKitDropdown)}
                        >
                            <PaletteIcon />
                            {selectedBrandKit ? (
                                <>
                                    <span>{selectedBrandKit.name}</span>
                                    <div className="color-dots">
                                        <span className="color-dot" style={{ background: selectedBrandKit.primaryColor }}></span>
                                        <span className="color-dot" style={{ background: selectedBrandKit.secondaryColor }}></span>
                                        <span className="color-dot" style={{ background: selectedBrandKit.accentColor }}></span>
                                    </div>
                                </>
                            ) : (
                                <span>Brand Kit</span>
                            )}
                        </button>
                        
                        {showBrandKitDropdown && (
                            <div className="brand-kit-dropdown">
                                {selectedBrandKit && (
                                    <button 
                                        className="brand-kit-dropdown-item"
                                        onClick={() => {
                                            setSelectedBrandKit(null);
                                            setShowBrandKitDropdown(false);
                                        }}
                                    >
                                        <span style={{ color: 'var(--text-secondary)' }}>Clear selection</span>
                                    </button>
                                )}
                                
                                {brandKits.map(bk => (
                                    <button
                                        key={bk.id}
                                        className="brand-kit-dropdown-item"
                                        onClick={() => {
                                            setSelectedBrandKit(bk);
                                            setShowBrandKitDropdown(false);
                                        }}
                                        onDoubleClick={() => openBrandKitEditor(bk)}
                                    >
                                        <div className="color-dots">
                                            <span className="color-dot" style={{ background: bk.primaryColor }}></span>
                                            <span className="color-dot" style={{ background: bk.secondaryColor }}></span>
                                            <span className="color-dot" style={{ background: bk.accentColor }}></span>
                                        </div>
                                        <span>{bk.name}</span>
                                    </button>
                                ))}
                                
                                <button
                                    className="brand-kit-dropdown-item create-new"
                                    onClick={() => openBrandKitEditor()}
                                >
                                    + Create New Brand Kit
                                </button>
                            </div>
                        )}
                        </div>

                        {/* Variant Count Selector */}
                        <div className="variant-count-selector">
                            <span className="variant-count-label">Variants</span>
                            {VARIANT_OPTIONS.map(opt => (
                                <button
                                    key={opt}
                                    className={`variant-count-btn ${variantCount === opt ? 'active' : ''}`}
                                    onClick={() => setVariantCount(opt)}
                                >
                                    {opt}
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {selectedImage && (
                    <div className="image-preview-pill">
                        <img src={selectedImage} alt="Reference" />
                        <span>Attached Image</span>
                        <button onClick={clearImage} className="clear-image-btn" aria-label="Remove attached image"><XIcon /></button>
                    </div>
                )}
                
                <div className={`input-wrapper ${isLoading ? 'loading' : ''}`}>
                    {(!inputValue && !isLoading && !showUrlInput) && (
                        <div className="animated-placeholder" key={placeholderIndex}>
                            <span className="placeholder-text">{placeholders[placeholderIndex]}</span>
                            <span className="tab-hint">Tab</span>
                        </div>
                    )}
                    
                    {!isLoading ? (
                        <>
                             <input 
                                type="file" 
                                ref={fileInputRef}
                                style={{ display: 'none' }} 
                                accept="image/*" 
                                onChange={handleContextImageSelect} 
                            />
                            <button
                                className="link-button"
                                onClick={() => fileInputRef.current?.click()}
                                title="Attach image reference"
                                aria-label="Attach image reference"
                                style={{
                                    background: selectedImage ? 'rgba(74, 222, 128, 0.1)' : 'transparent',
                                    color: selectedImage ? '#4ade80' : 'var(--text-secondary)'
                                }}
                            >
                                <UploadIcon />
                            </button>

                            <button
                                className="link-button"
                                onClick={() => setShowUrlInput(!showUrlInput)}
                                title="Add website context (URL)"
                                aria-label="Add website URL context"
                                style={{
                                    background: showUrlInput ? 'rgba(255,255,255,0.2)' : 'transparent',
                                    color: urlValue ? '#4ade80' : 'var(--text-secondary)'
                                }}
                            >
                                <LinkIcon />
                            </button>

                            {/* Clone Mode Toggle */}
                            {(urlValue || selectedImage) && (
                                <button 
                                    className={`clone-mode-btn ${cloneMode ? 'active' : ''}`}
                                    onClick={() => setCloneMode(!cloneMode)}
                                    title={cloneMode ? 'Clone mode ON - Will replicate reference layout' : 'Enable clone mode to replicate reference'}
                                >
                                    <CloneIcon />
                                    <span>Clone</span>
                                </button>
                            )}

                            {showUrlInput && (
                                <input
                                    ref={urlInputRef}
                                    type="text"
                                    className="url-input"
                                    value={urlValue}
                                    onChange={(e) => setUrlValue(e.target.value)}
                                    placeholder="https://client-site.com"
                                    onKeyDown={(e) => e.key === 'Enter' && inputRef.current?.focus()}
                                    style={{
                                        width: '180px',
                                        background: 'rgba(0,0,0,0.3)',
                                        border: 'none',
                                        borderRadius: '4px',
                                        padding: '4px 8px',
                                        color: '#fff',
                                        fontSize: '0.85rem',
                                        marginRight: '8px'
                                    }}
                                />
                            )}

                            <input 
                                ref={inputRef}
                                type="text" 
                                value={inputValue} 
                                onChange={handleInputChange} 
                                onKeyDown={handleKeyDown} 
                                disabled={isLoading}
                                placeholder={showUrlInput ? "Describe the page..." : ""}
                                style={{ opacity: showUrlInput && !inputValue ? 0.7 : 1 }}
                            />
                        </>
                    ) : (
                        <div className="input-generating-label">
                            <span className="generating-prompt-text">{currentSession?.prompt}</span>
                            <ThinkingIcon />
                        </div>
                    )}
                    <button className="send-button" onClick={() => handleSendMessage()} disabled={isLoading || !inputValue.trim()} aria-label="Send message">
                        <ArrowUpIcon />
                    </button>
                </div>
            </div>
        </div>

        {/* Toast Notifications */}
        <Toast toasts={toasts} onDismiss={dismissToast} />
    </>
  );
}

// Sign-in page for unauthenticated users
function SignInPage() {
  return (
    <div className="auth-page">
      <div className="auth-container">
        <div className="auth-logo">⚡</div>
        <h1>Flashed</h1>
        <p>Instant landing pages for customer demos</p>
        <SignInButton mode="modal">
          <button className="auth-button">Sign In to Continue</button>
        </SignInButton>
      </div>
    </div>
  );
}

// Environment configuration error page
function EnvErrorPage({ missing, warnings }: { missing: string[]; warnings: string[] }) {
  return (
    <div className="auth-page">
      <div className="auth-container" style={{ maxWidth: '500px', textAlign: 'left' }}>
        <div className="auth-logo">⚠️</div>
        <h1 style={{ color: '#ef4444' }}>Configuration Error</h1>
        <p style={{ marginBottom: '24px' }}>
          Flashed cannot start because required environment variables are missing.
        </p>

        {missing.length > 0 && (
          <div style={{ marginBottom: '16px' }}>
            <strong style={{ color: '#ef4444' }}>Missing (Required):</strong>
            <ul style={{ margin: '8px 0', paddingLeft: '20px' }}>
              {missing.map(key => (
                <li key={key} style={{ color: '#fca5a5' }}>{key}</li>
              ))}
            </ul>
          </div>
        )}

        {warnings.length > 0 && (
          <div style={{ marginBottom: '16px' }}>
            <strong style={{ color: '#f59e0b' }}>Missing (Recommended):</strong>
            <ul style={{ margin: '8px 0', paddingLeft: '20px' }}>
              {warnings.map(key => (
                <li key={key} style={{ color: '#fcd34d' }}>{key}</li>
              ))}
            </ul>
          </div>
        )}

        <div style={{
          background: 'rgba(255,255,255,0.05)',
          padding: '16px',
          borderRadius: '8px',
          marginTop: '16px'
        }}>
          <strong>To fix this:</strong>
          <ol style={{ margin: '8px 0', paddingLeft: '20px', lineHeight: 1.6 }}>
            <li>Copy <code>.env.example</code> to <code>.env.local</code></li>
            <li>Fill in the missing values</li>
            <li>Restart the development server</li>
          </ol>
          <p style={{ marginTop: '12px', fontSize: '0.875rem', color: 'rgba(255,255,255,0.6)' }}>
            Get your OpenRouter API key at{' '}
            <a href="https://openrouter.ai/keys" target="_blank" rel="noopener noreferrer"
               style={{ color: '#60a5fa' }}>
              openrouter.ai/keys
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}

// Get Clerk publishable key from environment
const CLERK_PUBLISHABLE_KEY = ENV.CLERK_PUBLISHABLE_KEY;

// Validate environment on startup
const envValidation = validateEnv();

const rootElement = document.getElementById('root');
if (rootElement) {
  const root = ReactDOM.createRoot(rootElement);

  // Show error page if critical env vars are missing
  if (!envValidation.valid) {
    root.render(
      <React.StrictMode>
        <EnvErrorPage missing={envValidation.missing} warnings={envValidation.warnings} />
      </React.StrictMode>
    );
  } else {
    // Log warnings for missing optional vars
    if (envValidation.warnings.length > 0) {
      console.warn(
        'Optional environment variables not configured:',
        envValidation.warnings.join(', '),
        '- Some features may be limited.'
      );
    }

    // If no Clerk key, render app without auth (for development)
    if (!CLERK_PUBLISHABLE_KEY) {
      console.warn('Clerk publishable key not found. Running without authentication.');
      root.render(<React.StrictMode><App /></React.StrictMode>);
    } else {
      root.render(
        <React.StrictMode>
          <ClerkProvider publishableKey={CLERK_PUBLISHABLE_KEY}>
            <SignedIn>
              <App />
            </SignedIn>
            <SignedOut>
              <SignInPage />
            </SignedOut>
          </ClerkProvider>
        </React.StrictMode>
      );
    }
  }
}
