'use client';

import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import * as htmlToImage from 'html-to-image';
import { Check, Image as ImageIcon, Sparkles, Loader2 } from 'lucide-react';

export type CardThemeId = 'classic' | 'dark' | 'minimal' | 'floral' | 'party';

export interface CardTheme {
  id: CardThemeId;
  name: string;
  previewClass: string;
  cardClasses: string;
  textClass: string;
}

const THEMES: CardTheme[] = [
  {
    id: 'classic',
    name: 'Clássico',
    previewClass: 'bg-amber-100 border-amber-300 text-amber-900',
    cardClasses: 'bg-amber-50 border-[3px] border-amber-500/50 shadow-sm rounded-lg relative overflow-hidden',
    textClass: 'font-serif text-amber-900',
  },
  {
    id: 'dark',
    name: 'Modern Dark',
    previewClass: 'bg-zinc-800 border-zinc-600 text-cyan-400',
    cardClasses: 'bg-zinc-900 shadow-xl rounded-2xl relative overflow-hidden',
    textClass: 'font-sans text-cyan-400',
  },
  {
    id: 'minimal',
    name: 'Minimal',
    previewClass: 'bg-white border-gray-200 text-gray-800',
    cardClasses: 'bg-white rounded border border-gray-100 shadow-sm relative',
    textClass: 'font-sans text-gray-800 tracking-wide',
  },
  {
    id: 'floral',
    name: 'Floral Soft',
    previewClass: 'bg-rose-100 border-rose-200 text-rose-800',
    // Using simple gradients/colors for floral vibe, since we don't have SVGs right away
    cardClasses: 'bg-gradient-to-br from-rose-50 to-pink-50 border border-rose-200 shadow-md rounded-xl relative',
    textClass: 'font-serif text-rose-900',
  },
  {
    id: 'party',
    name: 'Party Vibes',
    previewClass: 'bg-gradient-to-r from-purple-500 to-pink-500 border-purple-400 text-white',
    cardClasses: 'bg-gradient-to-br from-purple-500 via-pink-500 to-orange-400 shadow-lg rounded-2xl relative',
    textClass: 'font-bold text-white drop-shadow-md',
  },
];

interface GiftCardEditorProps {
  giftName: string;
  giftPrice: number;
  onConfirm: (imageBase64: string, name: string, message: string) => void;
  onCancel?: () => void;
}

export function GiftCardEditor({ giftName, giftPrice, onConfirm, onCancel }: GiftCardEditorProps) {
  const [senderName, setSenderName] = useState('');
  const [message, setMessage] = useState('');
  const [selectedThemeId, setSelectedThemeId] = useState<CardThemeId>('classic');
  const [isGenerating, setIsGenerating] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  const selectedTheme = THEMES.find((t) => t.id === selectedThemeId) || THEMES[0];

  const handleConfirm = async () => {
    if (!cardRef.current) return;
    setIsGenerating(true);

    try {
      // Small delay to ensure any CSS/fonts are settled before capture
      await new Promise((resolve) => setTimeout(resolve, 100));
      
      const dataUrl = await htmlToImage.toPng(cardRef.current, {
        quality: 0.95,
        pixelRatio: 2, // High resolution for Retina displays
      });

      onConfirm(dataUrl, senderName, message);
    } catch (error) {
      console.error('Failed to generate image', error);
      alert('Ops! Tivemos um problema ao gerar seu cartão. Tente novamente.');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="flex flex-col lg:flex-row gap-8 w-full max-w-6xl mx-auto p-4 bg-white/50 rounded-3xl backdrop-blur-sm border border-gray-100">
      
      {/* PREVIEW AREA */}
      <div className="w-full lg:w-5/12 flex-shrink-0">
        <div className="sticky top-6">
          <div className="mb-4">
            <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider">Preview do Cartão</h3>
            <p className="text-xs text-gray-400">É assim que os noivos verão sua mensagem.</p>
          </div>

          <div className="aspect-[4/3] w-full" style={{ perspective: '1000px' }}>
            <AnimatePresence mode="wait">
              <motion.div
                key={selectedTheme.id}
                initial={{ opacity: 0, rotateY: 15, scale: 0.95 }}
                animate={{ opacity: 1, rotateY: 0, scale: 1 }}
                exit={{ opacity: 0, rotateY: -15, scale: 0.95 }}
                transition={{ duration: 0.4, ease: "easeOut" }}
                className="w-full h-full flex items-center justify-center bg-gray-50/50 rounded-xl border border-dashed border-gray-200"
              >
                {/* O Cartão em si - a Div que será capturada */}
                <div 
                  ref={cardRef} 
                  className={`w-full max-w-[400px] aspect-[4/3] p-6 lg:p-8 flex flex-col justify-between ${selectedTheme.cardClasses}`}
                  style={{ width: '400px', height: '300px' }} // Fixed dimensions for consistent capture
                >
                  {/* Decorações do tema (Floral/Classic etc) - placeholders */}
                  {selectedTheme.id === 'classic' && (
                    <div className="absolute inset-2 border border-amber-500/30 rounded" />
                  )}
                  {selectedTheme.id === 'floral' && (
                    <div className="absolute top-0 right-0 p-4 opacity-20">
                       <Sparkles size={48} className="text-rose-500" />
                    </div>
                  )}

                  <div className={`flex flex-col h-full z-10 ${selectedTheme.textClass}`}>
                    <div className="flex-1">
                      <p className="text-sm opacity-80 mb-2">De:</p>
                      <p className="text-xl md:text-2xl break-words leading-tight">
                        {senderName || "Seu Nome Aqui"}
                      </p>
                    </div>

                    <div className="flex-[2] flex items-center justify-center text-center mt-4">
                      <p className="text-lg md:text-xl italic leading-relaxed break-words line-clamp-4">
                        {message || "Digite uma mensagem linda para os noivos celebrando este momento especial."}
                      </p>
                    </div>

                    <div className="mt-4 flex flex-col items-center justify-center opacity-70 border-t border-current/20 pt-2">
                       <span className="text-xs uppercase tracking-widest block mb-1">Presente:</span>
                       <span className="text-sm font-medium truncate max-w-full">{giftName}</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* CONTROLS AREA */}
      <div className="w-full lg:w-7/12 flex flex-col gap-8 lg:border-l lg:border-gray-200 lg:pl-8 py-2">
        <div>
          <h2 className="text-2xl font-semibold text-gray-800 mb-1">Personalize seu Cartão</h2>
          <p className="text-gray-500 text-sm">Este cartão será entregue digitalmente aos noivos com o seu presente.</p>
        </div>

        {/* Form Inputs */}
        <div className="space-y-6">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
              Seu Nome <span className="text-gray-400 font-normal">(máx. 30 caracteres)</span>
            </label>
            <input
              type="text"
              id="name"
              maxLength={30}
              value={senderName}
              onChange={(e) => setSenderName(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-black focus:border-black outline-none transition-all"
              placeholder="Como os noivos te conhecem?"
            />
          </div>

          <div>
            <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-2">
              Sua Mensagem <span className="text-gray-400 font-normal">({message.length}/150)</span>
            </label>
            <textarea
              id="message"
              rows={4}
              maxLength={150}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-black focus:border-black outline-none transition-all resize-none"
              placeholder="Deseje felicidades, brincadeiras ou algo do coração..."
            />
          </div>
        </div>

        {/* Theme Selector */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-4">
            Escolha seu Modelo
          </label>
          <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
            {THEMES.map((theme) => {
              const isActive = selectedThemeId === theme.id;
              return (
                <button
                  key={theme.id}
                  onClick={() => setSelectedThemeId(theme.id)}
                  className={`relative flex flex-col items-center gap-2 p-2 rounded-xl transition-all ${
                    isActive ? 'bg-gray-100 ring-2 ring-black scale-105' : 'hover:bg-gray-50 hover:scale-105'
                  }`}
                >
                  <div className={`w-12 h-12 rounded-lg border ${theme.previewClass} shadow-sm flex items-center justify-center overflow-hidden`}>
                     {/* Pequena representação do tema */}
                     <span className={`text-[10px] opacity-70 ${theme.textClass}`}>Aa</span>
                  </div>
                  <span className={`text-[11px] font-medium text-center leading-tight ${isActive ? 'text-black' : 'text-gray-500'}`}>
                    {theme.name}
                  </span>
                  {isActive && (
                    <div className="absolute -top-1 -right-1 bg-black text-white w-4 h-4 rounded-full flex items-center justify-center shadow-sm">
                      <Check size={10} />
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Actions */}
        <div className="mt-8 pt-6 border-t border-gray-200 flex flex-col sm:flex-row items-center gap-4">
          <button
            onClick={handleConfirm}
            disabled={isGenerating || !senderName.trim() || !message.trim()}
            className="w-full sm:w-auto flex-1 bg-black text-white px-8 py-4 rounded-xl font-medium text-lg hover:bg-gray-800 disabled:bg-gray-300 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 shadow-lg shadow-black/10"
          >
            {isGenerating ? (
              <>
                <Loader2 size={20} className="animate-spin" />
                Gerando Cartão...
              </>
            ) : (
              <>
                <ImageIcon size={20} />
                Confirmar e Ir para Pagamento
              </>
            )}
          </button>
          
          {onCancel && (
            <button
              onClick={onCancel}
              disabled={isGenerating}
              className="w-full sm:w-auto px-6 py-4 text-gray-600 font-medium hover:text-black transition-colors"
            >
              Voltar
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
