import React, { useEffect, useState, useMemo } from 'react';
import { Plus, Search, Grid, LayoutList, Layers, Github } from 'lucide-react';
import { HTMLItem, SortOption } from './types';
import * as storage from './utils/storage';
import PreviewCard from './components/PreviewCard';
import UploadModal from './components/UploadModal';
import DetailView from './components/DetailView';
import Button from './components/Button';

const App: React.FC = () => {
  const [items, setItems] = useState<HTMLItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOption, setSortOption] = useState<SortOption>('newest');
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<HTMLItem | null>(null);
  
  // Load initial data
  useEffect(() => {
    setItems(storage.getLibrary());
  }, []);

  const handleSave = (item: HTMLItem) => {
    const updated = storage.saveItem(item);
    setItems(updated);
  };

  const handleDelete = (id: string) => {
    const updated = storage.deleteItem(id);
    setItems(updated);
  };

  const filteredItems = useMemo(() => {
    let result = items.filter(item => {
      const q = searchQuery.toLowerCase();
      return (
        item.title.toLowerCase().includes(q) ||
        item.tags.some(tag => tag.toLowerCase().includes(q))
      );
    });

    return result.sort((a, b) => {
      switch (sortOption) {
        case 'newest': return b.createdAt - a.createdAt;
        case 'oldest': return a.createdAt - b.createdAt;
        case 'name': return a.title.localeCompare(b.title);
        case 'size': return b.size - a.size;
        default: return 0;
      }
    });
  }, [items, searchQuery, sortOption]);

  return (
    <div className="min-h-screen bg-background text-white flex">
      {/* Sidebar (Desktop) */}
      <aside className="hidden lg:flex w-64 border-r border-white/5 flex-col p-6 fixed h-full bg-surface/30 backdrop-blur-xl z-10">
        <div className="flex items-center gap-3 mb-10">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-primary to-accent flex items-center justify-center">
             <Layers size={20} className="text-white" />
          </div>
          <span className="text-xl font-bold tracking-tight">Lumina</span>
        </div>

        <nav className="space-y-2 flex-1">
          <div className="px-4 py-3 bg-white/5 text-white rounded-xl font-medium cursor-pointer flex items-center gap-3 border border-white/5">
            <Grid size={18} />
            Library
          </div>
          <div className="px-4 py-3 text-gray-400 hover:text-white hover:bg-white/5 rounded-xl transition-all cursor-not-allowed flex items-center gap-3">
             <LayoutList size={18} />
             Collections <span className="text-[10px] bg-primary/20 text-primary px-1.5 py-0.5 rounded ml-auto">SOON</span>
          </div>
        </nav>

        <div className="pt-6 border-t border-white/5">
           <div className="bg-surfaceHighlight rounded-xl p-4">
              <h4 className="text-xs font-semibold text-gray-400 uppercase mb-2">Storage Used</h4>
              <div className="w-full bg-black/50 rounded-full h-2 mb-2">
                 <div className="bg-primary h-2 rounded-full" style={{ width: '15%' }}></div>
              </div>
              <p className="text-xs text-gray-500">{items.length} items</p>
           </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 lg:ml-64 p-4 md:p-8">
        {/* Top Bar */}
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold">Your Library</h1>
            <p className="text-gray-400 text-sm mt-1">Manage and preview your HTML components</p>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative group">
               <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-primary transition-colors" size={18} />
               <input 
                  type="text" 
                  placeholder="Search projects..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="bg-surface border border-white/10 rounded-xl pl-10 pr-4 py-2 text-sm w-full md:w-64 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
               />
            </div>
            
            <select 
               value={sortOption}
               onChange={(e) => setSortOption(e.target.value as SortOption)}
               className="bg-surface border border-white/10 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-primary cursor-pointer"
            >
               <option value="newest">Newest</option>
               <option value="oldest">Oldest</option>
               <option value="name">Name</option>
               <option value="size">Size</option>
            </select>

            <Button onClick={() => setIsUploadOpen(true)} icon={<Plus size={18} />}>
              Add New
            </Button>
          </div>
        </header>

        {/* Content Grid */}
        {filteredItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center border-2 border-dashed border-white/5 rounded-3xl bg-surface/20">
             <div className="w-16 h-16 bg-surfaceHighlight rounded-full flex items-center justify-center mb-4">
                <Layers size={32} className="text-gray-600" />
             </div>
             <h3 className="text-lg font-medium text-white mb-2">Library is empty</h3>
             <p className="text-gray-500 max-w-xs mb-6">Start by uploading an HTML file or pasting some code snippets.</p>
             <Button onClick={() => setIsUploadOpen(true)} variant="secondary">Create First Item</Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredItems.map(item => (
              <PreviewCard 
                key={item.id} 
                item={item} 
                onClick={setSelectedItem} 
              />
            ))}
          </div>
        )}
      </main>

      {/* Modals */}
      <UploadModal 
        isOpen={isUploadOpen} 
        onClose={() => setIsUploadOpen(false)} 
        onSave={handleSave} 
      />

      {selectedItem && (
        <DetailView 
          item={selectedItem} 
          onClose={() => setSelectedItem(null)} 
          onDelete={handleDelete}
        />
      )}
    </div>
  );
};

export default App;