/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { Card, CardStatus, LearnState } from './types';
import { loadState, saveState } from './data';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import Dashboard from './components/Dashboard';
import MyDecks from './components/MyDecks';
import StudyMode from './components/StudyMode';
import AddNewCard from './components/AddNewCard';
import FillInBlanks from './components/FillInBlanks';
import IpaChart from './components/IpaChart';
import ToeicPractice from './components/ToeicPractice';

export default function App() {
  // Global client-side persistent storage state
  const [state, setState] = useState<LearnState>(() => loadState());
  const [currentTab, setCurrentTab] = useState<string>('dashboard');
  const [selectedDeckId, setSelectedDeckId] = useState<string>('deck-toeic');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Synchronize state back to localStorage
  useEffect(() => {
    saveState(state);
  }, [state]);

  // Handle adding card
  const handleAddCard = (deckId: string, front: string, back: string, example?: string) => {
    const newCard: Card = {
      id: `card-${Date.now()}`,
      deckId,
      front,
      back,
      example,
      status: 'MỚI',
      streakCount: 0
    };

    const updatedState = {
      ...state,
      cards: [...state.cards, newCard]
    };
    setState(updatedState);
  };

  // Handle deleting card
  const handleDeleteCard = (cardId: string) => {
    const updatedState = {
      ...state,
      cards: state.cards.filter(c => c.id !== cardId)
    };
    setState(updatedState);
  };

  // Handle editing card
  const handleEditCard = (cardId: string, updatedFront: string, updatedBack: string, updatedStatus: CardStatus) => {
    const updatedState = {
      ...state,
      cards: state.cards.map(c => {
        if (c.id === cardId) {
          return {
            ...c,
            front: updatedFront,
            back: updatedBack,
            status: updatedStatus
          };
        }
        return c;
      })
    };
    setState(updatedState);
  };

  // Handle direct card status toggles
  const handleUpdateCardStatus = (cardId: string, status: CardStatus) => {
    const updatedState = {
      ...state,
      cards: state.cards.map(c => {
        if (c.id === cardId) {
          return { ...c, status };
        }
        return c;
      })
    };
    setState(updatedState);
  };

  // Handle spaced repetition ratings & advance "REVIEW" Daily Quest
  const handleRateCard = (cardId: string, rating: 'AGAIN' | 'HARD' | 'GOOD' | 'EASY') => {
    const updatedCards = state.cards.map(c => {
      if (c.id === cardId) {
        let newStatus: CardStatus = c.status;
        let newStreak = c.streakCount;

        if (rating === 'AGAIN') {
          newStatus = 'CẦN ÔN';
          newStreak = 0;
        } else if (rating === 'HARD') {
          newStatus = 'ĐANG HỌC';
          newStreak = Math.max(0, c.streakCount - 1);
        } else if (rating === 'GOOD') {
          newStatus = 'CẦN ÔN'; // Keeps in loop but with higher streak weight
          newStreak = c.streakCount + 1;
        } else if (rating === 'EASY') {
          newStatus = 'ĐÃ THUỘC';
          newStreak = c.streakCount + 2;
        }

        return {
          ...c,
          status: newStatus,
          streakCount: newStreak
        };
      }
      return c;
    });

    // Increment today's counters
    const nextReviewedCount = state.todayReviewedCount + 1;

    // Advance REVIEW Quest
    const updatedQuests = state.quests.map(quest => {
      if (quest.category === 'REVIEW' && !quest.completed) {
        return {
          ...quest,
          current: Math.min(quest.target, quest.current + 1)
        };
      }
      return quest;
    });

    setState(prev => ({
      ...prev,
      cards: updatedCards,
      todayReviewedCount: nextReviewedCount,
      quests: updatedQuests
    }));
  };

  // Duolingo Gamification: Correct spelling guess + XP award + SPELL Quest progress
  const handleAnswerSpellingCorrect = (xpGained: number) => {
    setState(prev => {
      const nextXp = prev.xp + xpGained;
      const nextLevel = Math.floor(nextXp / 100) + 1;

      const updatedQuests = prev.quests.map(quest => {
        if (quest.category === 'SPELL' && !quest.completed) {
          return {
            ...quest,
            current: Math.min(quest.target, quest.current + 1)
          };
        }
        return quest;
      });

      return {
        ...prev,
        xp: nextXp,
        level: nextLevel,
        quests: updatedQuests
      };
    });
  };

  // Duolingo Gamification: Deduct hearts on wrong spelling
  const handleAnswerSpellingWrong = () => {
    setState(prev => {
      if (prev.unlimitedHearts) return prev;
      return {
        ...prev,
        hearts: Math.max(0, prev.hearts - 1)
      };
    });
  };

  // Duolingo Gamification: Sound player clicks earn XP and advance IPA quest category
  const handleEarnXpAndRecord = (amount: number, category: 'REVIEW' | 'SPELL' | 'IPA') => {
    setState(prev => {
      const nextXp = prev.xp + amount;
      const nextLevel = Math.floor(nextXp / 100) + 1;

      const updatedQuests = prev.quests.map(quest => {
        if (quest.category === category && !quest.completed) {
          return {
            ...quest,
            current: Math.min(quest.target, quest.current + 1)
          };
        }
        return quest;
      });

      return {
        ...prev,
        xp: nextXp,
        level: nextLevel,
        quests: updatedQuests
      };
    });
  };

  // Duolingo Gamification: Toggle unlimited Study Hearts
  const handleToggleUnlimitedHearts = () => {
    setState(prev => ({
      ...prev,
      unlimitedHearts: !prev.unlimitedHearts
    }));
  };

  // Duolingo Gamification: Refill hearts using XP
  const handleReplenishHearts = () => {
    setState(prev => {
      if (prev.xp >= 50 && prev.hearts < 5) {
        return {
          ...prev,
          xp: prev.xp - 50,
          hearts: 5
        };
      }
      return prev;
    });
  };

  // Duolingo Gamification: Claim quest rewards
  const handleClaimQuest = (questId: string) => {
    setState(prev => {
      const q = prev.quests.find(quest => quest.id === questId);
      if (!q || q.completed) return prev;

      const nextXp = prev.xp + q.xpReward;
      const nextLevel = Math.floor(nextXp / 100) + 1;

      const updatedQuests = prev.quests.map(quest => {
        if (quest.id === questId) {
          return { ...quest, completed: true };
        }
        return quest;
      });

      return {
        ...prev,
        xp: nextXp,
        level: nextLevel,
        quests: updatedQuests
      };
    });
  };

  // Handle quick review starts
  const handleStartReview = () => {
    // Select first deck requiring review, fallback to currently selected
    const priorityDeck = state.cards.find(c => c.status === 'CẦN ÔN')?.deckId || selectedDeckId;
    setSelectedDeckId(priorityDeck);
    setCurrentTab('study');
  };

  // Automatically switch tab to My Decks if a user performs search query on Dashboard
  useEffect(() => {
    if (searchQuery && currentTab === 'dashboard') {
      setCurrentTab('my-decks');
    }
  }, [searchQuery]);

  return (
    <div id="zencards-app-container" className="min-h-screen bg-[#F5F5F0] text-[#3D3D33] flex select-none">
      
      {/* Side Navigation Rail */}
      <Sidebar 
        currentTab={currentTab} 
        onSetTab={(tab) => {
          setCurrentTab(tab);
          setSearchQuery(''); // clear query on transitions
        }} 
        onStartReview={handleStartReview}
      />

      {/* Main Content Pane */}
      <div className="ml-64 flex-1 flex flex-col min-h-screen">
        
        {/* Context-aware Dynamic Header Topbar */}
        <Header 
          searchQuery={searchQuery} 
          onSetSearchQuery={setSearchQuery}
          placeholderText={
            currentTab === 'my-decks'
              ? "Tìm kiếm thẻ trong bộ..."
              : "Tìm kiếm tiếng Anh..."
          }
          xp={state.xp}
          level={state.level}
          hearts={state.hearts}
          unlimitedHearts={state.unlimitedHearts}
          onToggleUnlimitedHearts={handleToggleUnlimitedHearts}
          onReplenishHearts={handleReplenishHearts}
        />

        {/* Floating Active tab workspace renderer */}
        <main className="flex-grow py-6">
          {currentTab === 'dashboard' && (
            <Dashboard 
              decks={state.decks} 
              cards={state.cards}
              streak={state.streak}
              todayReviewed={state.todayReviewedCount}
              todayGoal={state.todayGoal}
              onSetTab={setCurrentTab}
              onSelectDeck={setSelectedDeckId}
              xp={state.xp}
              level={state.level}
              quests={state.quests}
              onClaimQuest={handleClaimQuest}
            />
          )}

          {currentTab === 'my-decks' && (
            <MyDecks 
              decks={state.decks}
              cards={state.cards}
              selectedDeckId={selectedDeckId}
              onSelectDeck={setSelectedDeckId}
              onSetTab={setCurrentTab}
              onDeleteCard={handleDeleteCard}
              onEditCard={handleEditCard}
              searchQuery={searchQuery}
            />
          )}

          {currentTab === 'study' && (
            <StudyMode 
              decks={state.decks}
              cards={state.cards}
              selectedDeckId={selectedDeckId}
              onSetTab={setCurrentTab}
              onRateCard={handleRateCard}
            />
          )}

          {currentTab === 'add-new' && (
            <AddNewCard 
              decks={state.decks}
              selectedDeckId={selectedDeckId}
              onAddCard={handleAddCard}
              onSetTab={setCurrentTab}
            />
          )}

          {currentTab === 'fill-word' && (
            <FillInBlanks 
              decks={state.decks}
              cards={state.cards}
              onSetTab={setCurrentTab}
              onUpdateCardStatus={handleUpdateCardStatus}
              onAnswerCorrect={handleAnswerSpellingCorrect}
              onAnswerWrong={handleAnswerSpellingWrong}
              hearts={state.hearts}
              unlimitedHearts={state.unlimitedHearts}
            />
          )}

          {currentTab === 'ipa' && (
            <IpaChart 
              onEarnXpAndRecord={handleEarnXpAndRecord}
              xpState={state.xp}
            />
          )}

          {currentTab === 'toeic-test' && (
            <ToeicPractice />
          )}
        </main>

        {/* Global Footer (Matching the minimal design system aesthetic) */}
        <footer className="border-t border-[#E0E0D6] py-8 bg-[#F5F5F0]">
          <div className="max-w-[1200px] mx-auto px-6 flex flex-col md:flex-row justify-between items-center text-xs text-[#7C7C6B] select-none gap-4">
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-[#5A5A40]">ZenCards</span>
              <span className="opacity-40">|</span>
              <span>© 2026 ZenCards. Học tập trung cho hiệu suất chuyên sâu.</span>
            </div>
            
            <div className="flex gap-6 font-medium">
              <a href="#privacy" className="hover:text-[#5A5A40] transition-all cursor-pointer">Chính sách bảo mật</a>
              <a href="#terms" className="hover:text-[#5A5A40] transition-all cursor-pointer">Điều khoản dịch vụ</a>
              <a href="#support" className="hover:text-[#5A5A40] transition-all cursor-pointer">Trung tâm hỗ trợ</a>
            </div>
          </div>
        </footer>

      </div>

    </div>
  );
}
