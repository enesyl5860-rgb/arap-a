import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Clock, ArrowLeft, Download } from 'lucide-react';
import curriculum from './data/curriculum.json';
import flashcardsIndex from './data/indexes/flashcards-index.json';
import rootsIndex from './data/indexes/roots-index.json';
import atlasIndex from './data/indexes/atlas-index.json';
import searchIndex from './data/indexes/search-index.json';

import {
  getAvailableModuleIds,
  getAvailableFinalIds,
  loadModule
} from './utils/moduleLoader.js';
import { stopSpeaking } from './utils/speechEngine.js';

import { TopBar } from './components/layout/TopBar.jsx';
import { Sidebar, NAV_SECTIONS } from './components/layout/Sidebar.jsx';
import { CommandPalette } from './components/layout/CommandPalette.jsx';
import { BackupModal } from './components/layout/BackupModal.jsx';

import { CurriculumMap } from './components/sections/CurriculumMap.jsx';
import { GrammarStudio } from './components/sections/GrammarStudio.jsx';
import { SentenceWorkshop } from './components/sections/SentenceWorkshop.jsx';
import { ReadingStudio } from './components/sections/ReadingStudio.jsx';
import { DialogueStudio } from './components/sections/DialogueStudio.jsx';
import { FlashcardStudio } from './components/sections/FlashcardStudio.jsx';
import { FinalsArena } from './components/sections/FinalsArena.jsx';
import { ReferenceAtlas } from './components/sections/ReferenceAtlas.jsx';

const MODULE_REQUIRED_SECTIONS = new Set(['grammar', 'workshop', 'reading', 'dialogue']);

export default function App() {
  const availableModuleIds = useMemo(() => getAvailableModuleIds(), []);
  const availableFinalIds = useMemo(() => getAvailableFinalIds(), []);

  const [activeSection, setActiveSection] = useState('map');
  const [activeModuleId, setActiveModuleId] = useState('01');
  const [activeFinalId, setActiveFinalId] = useState('final_a1');
  const [moduleData, setModuleData] = useState(null);
  const [loadingModule, setLoadingModule] = useState(false);

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [backupOpen, setBackupOpen] = useState(false);

  const allModulesMeta = useMemo(
    () => curriculum.phases.flatMap((p) => p.modules),
    []
  );
  const activeModuleMeta = useMemo(
    () => allModulesMeta.find((m) => m.id === activeModuleId) || allModulesMeta[0],
    [allModulesMeta, activeModuleId]
  );
  const activeSectionMeta = useMemo(
    () => NAV_SECTIONS.find((s) => s.id === activeSection) || NAV_SECTIONS[0],
    [activeSection]
  );

  // Ctrl+K / Cmd+K hızlı arama kısayolu
  useEffect(() => {
    const onKey = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setSearchOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  // Aktif modülü yalnızca modül gerektiren bir bölüme geçildiğinde tembel (lazy) yükle
  useEffect(() => {
    if (!MODULE_REQUIRED_SECTIONS.has(activeSection)) return;
    let cancelled = false;
    setLoadingModule(true);
    loadModule(activeModuleId).then((data) => {
      if (!cancelled) {
        setModuleData(data);
        setLoadingModule(false);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [activeModuleId, activeSection]);

  const handleSelectSection = useCallback((sectionId) => {
    stopSpeaking();
    setActiveSection(sectionId);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const handleOpenModule = useCallback((modId, targetSection = 'grammar') => {
    stopSpeaking();
    setActiveModuleId(modId);
    setActiveSection(targetSection);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const handleOpenFinal = useCallback((finalId) => {
    stopSpeaking();
    setActiveFinalId(finalId);
    setActiveSection('finals');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const handleCommandNavigate = useCallback(
    (item) => {
      if (item.type === 'module') {
        if (availableModuleIds.has(item.moduleId)) {
          handleOpenModule(item.moduleId, 'grammar');
        } else {
          setActiveSection('map');
        }
      } else if (item.type === 'grammar') {
        handleOpenModule(item.moduleId, 'grammar');
      } else if (item.type === 'card') {
        setActiveSection('flashcards');
      } else if (item.type === 'root' || item.type === 'verb' || item.type === 'connector') {
        setActiveSection('atlas');
      }
    },
    [availableModuleIds, handleOpenModule]
  );

  const renderModuleSection = () => {
    if (loadingModule) {
      return (
        <div className="surface-card rounded-2xl p-12 text-center space-y-2">
          <div className="h-6 w-6 mx-auto rounded-full border-2 border-[var(--accent)] border-t-transparent animate-spin" />
          <p className="text-sm text-[var(--text-muted)]">Modül {activeModuleId} tembel yükleniyor...</p>
        </div>
      );
    }

    if (!moduleData) {
      return (
        <div className="surface-card rounded-2xl p-8 max-w-2xl mx-auto text-center space-y-4">
          <Clock size={32} className="mx-auto text-[var(--amber)]" />
          <h2 className="text-lg font-bold text-[var(--text-primary)]">
            Modül {activeModuleMeta.id}: {activeModuleMeta.title}
          </h2>
          <p className="text-sm text-[var(--text-secondary)]">{activeModuleMeta.summary}</p>
          <p className="text-xs text-[var(--text-muted)]">
            Bu modül 55 modüllük müfredat haritasında planlandı ve sıradaki içerik turunda eklenecektir.
          </p>
          <div className="flex justify-center gap-2 pt-2">
            <button
              type="button"
              onClick={() => handleOpenModule('01', activeSection)}
              className="px-4 py-2 rounded-xl bg-[var(--accent)] text-white dark:text-[#0b1311] text-xs font-semibold cursor-pointer"
            >
              Modül 01&apos;e Geç
            </button>
            <button
              type="button"
              onClick={() => setActiveSection('map')}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[var(--bg-subtle)] text-xs font-semibold text-[var(--text-primary)] cursor-pointer"
            >
              <ArrowLeft size={13} />
              <span>Külliyat Haritası</span>
            </button>
          </div>
        </div>
      );
    }

    if (activeSection === 'grammar') return <GrammarStudio moduleData={moduleData} />;
    if (activeSection === 'workshop') return <SentenceWorkshop moduleData={moduleData} />;
    if (activeSection === 'reading') return <ReadingStudio moduleData={moduleData} />;
    if (activeSection === 'dialogue') return <DialogueStudio moduleData={moduleData} />;
    return null;
  };

  return (
    <div className="min-h-screen flex bg-[var(--bg-canvas)] text-[var(--text-primary)]">
      <Sidebar
        activeSection={activeSection}
        onSelectSection={handleSelectSection}
        activeModuleId={activeModuleId}
        onSelectModule={(id) => {
          setActiveModuleId(id);
          if (activeSection === 'map') setActiveSection('grammar');
        }}
        availableModuleIds={availableModuleIds}
        curriculum={curriculum}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        onOpenBackup={() => setBackupOpen(true)}
      />

      <div className="flex-1 min-w-0 flex flex-col">
        <TopBar
          onToggleSidebar={() => setSidebarOpen((o) => !o)}
          onOpenSearch={() => setSearchOpen(true)}
          onOpenBackup={() => setBackupOpen(true)}
          activeModuleMeta={MODULE_REQUIRED_SECTIONS.has(activeSection) ? activeModuleMeta : null}
          activeSectionTitle={activeSectionMeta.label}
        />

        <main className="flex-1 w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
          {activeSection === 'map' && (
            <CurriculumMap
              curriculum={curriculum}
              availableModuleIds={availableModuleIds}
              availableFinalIds={availableFinalIds}
              activeModuleId={activeModuleId}
              onOpenModule={handleOpenModule}
              onOpenFinal={handleOpenFinal}
            />
          )}

          {MODULE_REQUIRED_SECTIONS.has(activeSection) && renderModuleSection()}

          {activeSection === 'flashcards' && (
            <FlashcardStudio flashcardsIndex={flashcardsIndex} activeModuleId={activeModuleId} />
          )}

          {activeSection === 'finals' && (
            <FinalsArena
              curriculum={curriculum}
              availableFinalIds={availableFinalIds}
              initialFinalId={activeFinalId}
            />
          )}

          {activeSection === 'atlas' && (
            <ReferenceAtlas rootsIndex={rootsIndex} atlasIndex={atlasIndex} />
          )}
        </main>

        <footer className="border-t border-[var(--border-subtle)] bg-[var(--bg-surface)]/70 py-4 px-4 sm:px-8">
          <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-[var(--text-muted)]">
            <span>
              Arapça Külliyatı v4.0 · 0&apos;dan B2&apos;ye + YDS/YÖKDİL · Günday &amp; Şahin Sistematiği
            </span>
            <button
              type="button"
              onClick={() => setBackupOpen(true)}
              className="inline-flex items-center gap-1.5 text-[var(--accent)] hover:underline font-medium cursor-pointer"
            >
              <Download size={13} />
              <span>İlerlemeyi Dışa Aktar / İçe Aktar (JSON)</span>
            </button>
          </div>
        </footer>
      </div>

      <CommandPalette
        isOpen={searchOpen}
        onClose={() => setSearchOpen(false)}
        searchIndex={searchIndex}
        onNavigate={handleCommandNavigate}
      />

      <BackupModal isOpen={backupOpen} onClose={() => setBackupOpen(false)} />
    </div>
  );
}
